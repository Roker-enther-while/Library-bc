const SecurityLog = require('../models/SecurityLog');

class SecurityRepository {
    async create(logData) {
        return SecurityLog.create(logData);
    }

    async findLatest(limit = 100) {
        return SecurityLog.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('userId', 'fullName role');
    }

    async countByLevel(level) {
        return SecurityLog.countDocuments({ level });
    }
}

module.exports = new SecurityRepository();
