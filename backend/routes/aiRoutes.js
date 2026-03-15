const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');

const { protect } = require('../middleware/auth');

// All authenticated users can chat with AI, limited to 10 msg/min
router.post('/chat', (req, res, next) => req.app.get('aiChatLimiter')(req, res, next), protect, chatWithAI);



module.exports = router;
