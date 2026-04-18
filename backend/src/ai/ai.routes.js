/**
 * ai.routes.js - Express Routes for AI module
 */

const express = require('express');
const router = express.Router();
const { chatController } = require('./ai.controller');
const { protect } = require('../middleware/auth'); // Import auth middleware

// All AI routes require authentication to properly build context
router.post('/chat', protect, chatController);

module.exports = router;
