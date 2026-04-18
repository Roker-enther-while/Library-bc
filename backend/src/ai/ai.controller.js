/**
 * ai.controller.js - Express Controller for AI chats
 */

const { processAIChat } = require('./ai.service');
const { formatAIResponse } = require('./response.formatter');
const { AI_CONFIG } = require('./ai.config');

const chatController = async (req, res) => {
    try {
        const { messages = [] } = req.body;

        // Ensure user is authenticated, though context handles logic
        const user = req.user; // Assuming authMiddleware populated this
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const context = {
            userId: user.username,
            userName: user.fullName || user.username,
            cardStatus: user.cardStatus || 'active',
            currentBorrowsCount: user.borrowCount || 0
        };

        // Prepare the new messages array for the service
        const history = messages;

        let responseText = null;
        let attempt = 0;

        // Retry logic for robustness
        while (attempt < AI_CONFIG.RETRY_COUNT) {
            try {
                responseText = await processAIChat(history, context);
                break; // Success, exit retry loop
            } catch (serviceError) {
                attempt++;
                console.warn(`[AI-CONTROLLER] Attempt ${attempt} failed: ${serviceError.message}`);
                if (attempt >= AI_CONFIG.RETRY_COUNT) {
                    throw serviceError; // Rethrow if max retries reached
                }
            }
        }

        const formattedResponse = formatAIResponse(responseText);

        res.json({
            success: true,
            response: formattedResponse
        });

    } catch (error) {
        console.error(`[AI-CONTROLLER] Final Error:`, error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi kết nối với Thư Đồng. Vui lòng thử lại sau.'
        });
    }
};

module.exports = { chatController };
