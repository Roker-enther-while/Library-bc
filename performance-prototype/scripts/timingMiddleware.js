/**
 * Performance Timing Middleware
 * Tracks processing time for each request and adds it to response headers
 */
const timingMiddleware = (serviceName) => (req, res, next) => {
    const start = process.hrtime();

    // Attach service name to request for logging
    req.serviceName = serviceName;

    // Override res.send/json to capture the end time
    const originalSend = res.send;
    res.send = function(body) {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
        
        // Log to console for real-time monitoring
        console.log(`[${serviceName}] ${req.method} ${req.url} - ${timeInMs}ms`);
        
        // Add custom header so Gateway can aggregate
        res.setHeader(`X-Time-${serviceName}`, timeInMs);
        
        return originalSend.apply(this, arguments);
    };

    next();
};

module.exports = timingMiddleware;
