const User = require('../models/User');

class SecurityService {
    constructor(securityRepo) {
        this.securityRepo = securityRepo;
    }

    async logActivity(data) {
        return this.securityRepo.create(data);
    }

    async logThreat(data) {
        const log = await this.securityRepo.create({
            ...data,
            level: 'danger'
        });

        // Auto-lock logic for critical violations
        if (data.userId && data.level === 'danger') {
            const userLogs = await this.securityRepo.findLatest(10);
            const violations = userLogs.filter(l => l.userId?.toString() === data.userId && l.level === 'danger').length;

            if (violations >= 3) {
                await User.findByIdAndUpdate(data.userId, { cardStatus: 'locked' });
                await this.securityRepo.create({
                    userId: data.userId,
                    action: 'account_auto_lock',
                    level: 'danger',
                    reason: 'Multiple security violations detected',
                    ip: data.ip
                });
            }
        }
        return log;
    }

    /**
     * Detects common attack patterns in data
     */
    detectThreats(payload) {
        const patterns = {
            xss: /<script|javascript:|on\w+=/i,
            sqli: /SELECT|INSERT|UPDATE|DELETE|DROP|UNION|--|;/i
        };

        const stringified = JSON.stringify(payload);
        if (patterns.xss.test(stringified)) return 'XSS Attempt';
        if (patterns.sqli.test(stringified)) return 'SQLi Attempt';

        return null;
    }
}

module.exports = SecurityService;
