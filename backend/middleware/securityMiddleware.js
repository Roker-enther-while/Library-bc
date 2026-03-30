const SecurityServiceClass = require('../services/securityService');
const securityRepo = require('../repositories/SecurityRepository');

const securityService = new SecurityServiceClass(securityRepo);

/**
 * Tier 1: Threat Detector (Global)
 * Monitors all incoming requests for malicious patterns like XSS/SQLi.
 * Run this before any route or auth logic.
 */
const threatDetector = async (req, res, next) => {
    const threatType = securityService.detectThreats({ ...req.body, ...req.query });
    if (threatType) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await securityService.logThreat({
            username: 'ANONYMOUS_THREAT',
            action: 'malicious_input_detected',
            reason: `${threatType} detected`,
            ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
            payload: { body: req.body, query: req.query }
        });

        return res.status(403).json({
            message: 'Hành vi bất thường bị phát hiện và đã được ghi lại.'
        });
    }
    next();
};

/**
 * Tier 2: Audit Logger (Route-specific)
 * Records staff activities. Apply this AFTER 'protect' middleware.
 */
const auditLogger = async (req, res, next) => {
    const staffRoles = ['admin', 'librarian'];
    const isStaff = req.user && staffRoles.includes(req.user.role);
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    const isSensitivePath = req.path.includes('login') || req.path.includes('logout');

    if (isStaff && isStateChanging && !isSensitivePath) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await securityService.logActivity({
            userId: req.user.id || req.user._id,
            username: req.user.username || req.user.fullName,
            action: `staff_action_${req.method.toLowerCase()}`,
            level: 'info',
            ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
            payload: req.body,
            reason: `Staff performed ${req.method} on ${req.path}`
        });
    }
    next();
};

module.exports = { threatDetector, auditLogger, securityService };
