/**
 * ai.service.js - Core AI Execution Engine
 * Handles OpenRouter API calls, tool implementations, and the recursive deliberation loop.
 */

const axios = require('axios');
const { AI_CONFIG } = require('./ai.config');
const { buildSystemPrompt } = require('./prompt.builder');
const { prepareMessages } = require('./context.manager');

// Models
const Book = require('../models/Book');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const Copy = require('../models/Copy');
const Reservation = require('../models/Reservation');

/**
 * Tool definitions and implementations
 */
const toolImplementations = {
    searchBooks: async ({ query }) => {
        try {
            const fieldsToSelect = '_id title authorName available shelfLocation publicationYear categoryName isbn publisher';
            let books;

            try {
                // Try text search first
                books = await Book.find({ $text: { $search: query } }).select(fieldsToSelect).limit(5);
            } catch (textIndexError) {
                console.log("[AI-MODULAR] Text search index error, falling back to regex search...");
                books = []; // Fallback down
            }

            if (!books || books.length === 0) {
                console.log("[AI-MODULAR] Text search returned 0 results, falling back to regex search...");
                const regex = new RegExp(query, 'i');
                books = await Book.find({
                    $or: [{ title: regex }, { authorName: regex }]
                }).select(fieldsToSelect).limit(5);
            }

            if (!books || books.length === 0) {
                return { books: [], message: `Không tìm thấy cuốn sách nào khớp với từ khóa "${query}". Hãy báo cho người dùng biết.` };
            }

            // Map _id to bookCode for AI
            const results = books.map(b => ({
                bookCode: b._id,
                title: b.title,
                author: b.authorName,
                available: b.available,
                location: b.shelfLocation,
                year: b.publicationYear,
                category: b.categoryName,
                isbn: b.isbn
            }));

            return { books: results };
        } catch (error) {
            return { error: `Lỗi khi tìm kiếm sách: ${error.message}` };
        }
    },

    checkBookAvailability: async ({ bookCode }) => {
        try {
            const book = await Book.findById(bookCode);
            if (!book) return { error: 'Không tìm thấy sách với mã này.' };
            return {
                title: book.title,
                availableCount: book.available,
                shelfLocation: book.shelfLocation
            };
        } catch (error) {
            return { error: `Lỗi khi kiểm tra tồn kho: ${error.message}` };
        }
    },

    createReservationRequest: async ({ bookCodes, pickupDate }, context) => {
        const userId = context.userId;
        if (!userId) return { error: 'Lỗi: Không tìm thấy độc giả (userId). Vui lòng đăng nhập.' };

        try {
            const user = await User.findOne({ username: userId });
            if (!user) return { error: 'Lỗi: Không tìm thấy tài khoản độc giả.' };

            if (user.cardStatus === 'locked') {
                return { error: 'Thẻ của bạn đang bị khóa. Vui lòng liên hệ quầy để mở lại thẻ trước khi đặt sách.' };
            }

            // Create reservations for each book
            const createdIds = [];
            for (const bookCode of bookCodes) {
                // Check if already reserved
                const existing = await Reservation.findOne({
                    user: user._id, book: bookCode, status: { $in: ['pending', 'confirmed'] }
                });

                if (!existing) {
                    const reservation = await Reservation.create({
                        user: user._id,
                        book: bookCode,
                        note: `Ngày hẹn nhận: ${pickupDate} (Tạo qua AI Thư Đồng)`
                    });
                    createdIds.push(reservation._id);
                }
            }

            if (createdIds.length === 0) {
                return { error: 'Lỗi: Tất cả sách bạn chọn đều đã được bạn đặt trước đang chờ xử lý. Không tạo thêm đơn mới.' };
            }

            return {
                success: true,
                message: `Yêu cầu đặt trước đã được ghi nhận. Ngày hẹn: ${pickupDate}. Mã dự kiến: ${createdIds.join(', ')}`,
                reservationIds: createdIds
            };
        } catch (error) {
            return { error: `Lỗi khi tạo yêu cầu đặt sách: ${error.message}` };
        }
    }
};

/**
 * The main entry point for AI chat processing.
 */
const processAIChat = async (history, context = {}) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const systemPrompt = buildSystemPrompt(context);
    let currentMessages = prepareMessages(history, systemPrompt);

    let loopCount = 0;
    while (loopCount < AI_CONFIG.MAX_INTERNAL_LOOPS) {
        try {
            const response = await axios.post(AI_CONFIG.OPENROUTER_URL,
                {
                    model: AI_CONFIG.DEFAULT_MODEL,
                    messages: currentMessages,
                    tools: [
                        {
                            type: 'function',
                            function: {
                                name: 'searchBooks',
                                description: 'Tìm kiếm sách theo tên, tác giả hoặc chủ đề (đa năng).',
                                parameters: {
                                    type: 'object',
                                    properties: { query: { type: 'string', description: 'Từ khóa tìm kiếm (tên sách, tác giả)' } },
                                    required: ['query']
                                }
                            }
                        },
                        {
                            type: 'function',
                            function: {
                                name: 'checkBookAvailability',
                                description: 'Kiểm tra xem một cuốn sách cụ thể (theo ID) còn trong kho không.',
                                parameters: {
                                    type: 'object',
                                    properties: { bookCode: { type: 'string', description: 'Mã bookCode của sách' } },
                                    required: ['bookCode']
                                }
                            }
                        },
                        {
                            type: 'function',
                            function: {
                                name: 'createReservationRequest',
                                description: 'Tạo phiếu đặt trước sách. Cần ngày hẹn và danh sách bookIds.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        bookCodes: { type: 'array', items: { type: 'string' }, description: 'Danh sách mã bookCode' },
                                        pickupDate: { type: 'string', description: 'Ngày hẹn nhận sách (ví dụ: 2024-03-21)' }
                                    },
                                    required: ['bookCodes', 'pickupDate']
                                }
                            }
                        }
                    ],
                    tool_choice: 'auto',
                    temperature: AI_CONFIG.TEMPERATURE,
                    max_tokens: AI_CONFIG.MAX_TOKENS
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                        'X-Title': 'Library Management System (Modular)',
                        'Content-Type': 'application/json'
                    },
                    timeout: AI_CONFIG.TIMEOUT
                }
            );

            const choice = response.data.choices[0];
            const message = choice.message;

            // Handle tool calls
            if (message.tool_calls) {
                currentMessages.push(message);
                for (const toolCall of message.tool_calls) {
                    const functionName = toolCall.function.name;
                    const argsString = toolCall.function.arguments;
                    const args = JSON.parse(argsString);

                    console.log(`[AI-MODULAR] Invoking tool: ${functionName}`, args);

                    const duplicateKey = `${functionName}:${argsString}`;
                    if (context.lastToolCall === duplicateKey) {
                        console.log(`[AI-MODULAR] Detected repeated tool call: ${duplicateKey}. Forcing stop.`);
                        return "Kính gửi quý độc giả, tôi đã cố gắng tìm kiếm nhưng không tìm thấy thông tin cuốn sách này trong hệ thống. Vui lòng kiểm tra lại tên sách hoặc cung cấp thêm thông tin tác giả để tôi hỗ trợ tốt hơn.";
                    }
                    context.lastToolCall = duplicateKey;

                    const result = await toolImplementations[functionName](args, context);

                    currentMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result)
                    });
                }
                loopCount++;
                continue;
            }

            // Force deliberation if content is empty (model returned no verbal response after tools)
            if (!message.content || message.content.trim() === "") {
                const forceResponse = await axios.post(AI_CONFIG.OPENROUTER_URL,
                    {
                        model: AI_CONFIG.DEFAULT_MODEL,
                        messages: [...currentMessages, {
                            role: 'user',
                            content: 'Dựa trên các dữ liệu trên, hãy thực hiện vai trò "Thư Đồng" và cung cấp phản hồi theo cấu trúc [SUY NGHĨ NỘI BỘ] -> [Ý KIẾN HỘI ĐỒNG] -> [PHẢN HỒI THƯ ĐỒNG]. KHÔNG ĐƯỢC để trống câu trả lời.'
                        }]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                            'X-Title': 'Library Management System (Modular)',
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return forceResponse.data.choices[0].message.content || "Xin lỗi, tôi đã gặp sự cố khi xử lý dữ liệu. Vui lòng thử lại sau.";
            }

            return message.content;
        } catch (error) {
            console.error(`[AI-MODULAR] Error: ${error.message}`);
            if (error.response && error.response.data) {
                console.error(`[AI-MODULAR] API Error Details:`, JSON.stringify(error.response.data, null, 2));
            }
            if (loopCount > 0) return "Tôi đã ghi nhận thông tin nhưng gặp lỗi khi kết nối. Vui lòng kiểm tra lại trạng thái mượn của bạn.";
            throw error;
        }
    }

    return "Tôi xin lỗi, có vẻ cuộc hội thoại quá phức tạp để tôi xử lý ngay lúc này.";
};

module.exports = { processAIChat };
