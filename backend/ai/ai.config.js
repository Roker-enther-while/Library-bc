const AI_CONFIG = {
    // API Configuration
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',

    // Model selection
    DEFAULT_MODEL: 'google/gemini-2.5-flash',

    // Generation settings
    MAX_TOKENS: 700,
    TEMPERATURE: 0.7,

    // Reliability
    TIMEOUT: 60000,
    RETRY_COUNT: 2,
    MAX_INTERNAL_LOOPS: 5
};

module.exports = { AI_CONFIG };
