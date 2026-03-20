/**
 * ai.error.js - Custom error classes for the AI module
 */

class AIError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'AIError';
        this.statusCode = statusCode;
    }
}

class AITimeoutError extends AIError {
    constructor(message = 'AI provider request timed out') {
        super(message, 504);
        this.name = 'AITimeoutError';
    }
}

class AIRateLimitError extends AIError {
    constructor(message = 'Too many requests to AI provider') {
        super(message, 429);
        this.name = 'AIRateLimitError';
    }
}

module.exports = { AIError, AITimeoutError, AIRateLimitError };
