/**
 * context.manager.js - Chat History management
 */

const MAX_HISTORY = 10;

/**
 * Builds the full message array for the AI API call, summarizing history and adding system prompt.
 * @param {Array} history - Previous chat messages
 * @param {string} systemPrompt - The constructed system prompt
 */
const prepareMessages = (history, systemPrompt) => {
    // Keep only recent history
    const recentHistory = history.slice(-MAX_HISTORY);

    return [
        { role: 'system', content: systemPrompt },
        ...recentHistory
    ];
};

module.exports = { prepareMessages };
