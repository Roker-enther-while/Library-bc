const { askAI } = require('../services/aiService');
const BorrowRecord = require('../models/BorrowRecord');

/**
 * Controller for AI-related operations with context injection
 */
const chatWithAI = async (req, res) => {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: 'Messages array is required' });
    }

    // Security: Validate message length (max 500 chars for last message)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content && lastMessage.content.length > 500) {
        return res.status(400).json({ message: 'Tin nhắn quá dài (tối đa 500 ký tự).' });
    }

    // Security: Limit history length to remember the last 10 requests (20 messages) + current message
    const limitedMessages = messages.slice(-21);


    try {
        // Prepare context from authenticated user
        const context = {
            userName: req.user?.fullName || 'Khách',
            userId: req.user?.id || req.user?._id,
            cardStatus: req.user?.cardStatus || 'active',
            currentBorrowsCount: 0
        };

        if (context.userId) {
            context.currentBorrowsCount = await BorrowRecord.countDocuments({
                user: context.userId,
                status: 'borrowing'
            });
        }

        // Call AI Service with context
        const response = await askAI(limitedMessages, context, model);

        res.json({ response });
    } catch (error) {
        console.error('Chat Controller Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    chatWithAI
};
