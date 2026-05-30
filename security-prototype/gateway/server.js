const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../database/connection');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'security_prototype_super_secret_key_2026';

const SERVICES = {
    auth: 'http://localhost:4001',
    library: 'http://localhost:4002'
};

app.use(express.json());

// Enable basic security headers manually (equivalent to helmet subset)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By'); // Hide tech stack
    next();
});

// --- LAYER 1: RATE LIMITER (Brute Force / DDoS protection on Auth) ---
const rateLimitWindowMs = 10000; // 10 seconds
const rateLimitMaxRequests = 5;  // max 5 requests per window
const rateLimitMap = new Map();

const loginRateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }
    
    const requestTimes = rateLimitMap.get(ip).filter(time => now - time < rateLimitWindowMs);
    requestTimes.push(now);
    rateLimitMap.set(ip, requestTimes);
    
    if (requestTimes.length > rateLimitMaxRequests) {
        console.error(`🚨 [Gateway] [RATE LIMIT] Rate limit exceeded for IP: ${ip} on ${req.path}`);
        return res.status(429).json({
            success: false,
            message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 10 giây.'
        });
    }
    next();
};

// --- LAYER 2: NOSQL INJECTION SANITIZER (Mongo Injection prevention) ---
const sanitizeObject = (obj) => {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'object' && obj[i] !== null) {
                sanitizeObject(obj[i]);
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
            if (key.startsWith('$') || key.includes('.')) {
                console.warn(`🛡️ [Gateway] [NOSQL SANITIZER] Stripping malicious Mongo operator/key: "${key}"`);
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        });
    }
};

const noSqlSanitizer = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    next();
};

// --- LAYER 3: THREAT DETECTOR (XSS & SQLi filter + Auto Lock) ---
const detectThreats = (payload) => {
    const patterns = {
        xss: /<script|javascript:|on\w+=/i,
        sqli: /SELECT|INSERT|UPDATE|DELETE|DROP|UNION|--|;/i
    };

    const stringified = JSON.stringify(payload);
    if (patterns.xss.test(stringified)) return 'XSS Attempt';
    if (patterns.sqli.test(stringified)) return 'SQLi Attempt';

    return null;
};

const threatDetector = async (req, res, next) => {
    const threatType = detectThreats({ ...req.body, ...req.query });
    
    if (threatType) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.error(`🚨 [Gateway] [SECURITY ALERT] Malicious ${threatType} detected from IP ${ip} on path ${req.path}!`);
        
        let userId = null;
        let username = 'ANONYMOUS_ATTACKER';
        
        // Try decoding JWT to associate threat with a logged-in user
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                username = decoded.username;
            } catch (err) {
                // Ignore decoding error, keep anonymous
            }
        }

        // Save a 'danger' security log in MongoDB
        try {
            await SecurityLog.create({
                userId,
                username,
                action: 'malicious_input_detected',
                level: 'danger',
                ip,
                userAgent: req.headers['user-agent'] || 'HTTP-Client',
                path: req.path,
                method: req.method,
                payload: { body: req.body, query: req.query },
                reason: `${threatType} detected in input parameters.`
            });
            console.log(`📝 [Gateway] Threat log recorded in MongoDB (Level: danger). Checking user violations...`);
            
            // Check Auto-Lock criteria (3 danger violations)
            if (userId) {
                const dangerLogs = await SecurityLog.find({ userId, level: 'danger' });
                const violationCount = dangerLogs.length;
                console.log(`ℹ️ [Gateway] User "${username}" now has ${violationCount} security violations.`);
                
                if (violationCount >= 3) {
                    await User.findByIdAndUpdate(userId, { cardStatus: 'locked' });
                    
                    await SecurityLog.create({
                        userId,
                        username,
                        action: 'account_auto_lock',
                        level: 'danger',
                        ip,
                        userAgent: req.headers['user-agent'] || 'HTTP-Client',
                        reason: `User account "${username}" automatically LOCKED due to reaching ${violationCount} security violations.`
                    });
                    
                    console.error(`🚨 [Gateway] [AUTO-LOCK] Account "${username}" has been automatically LOCKED due to persistent threats!`);
                }
            }
        } catch (err) {
            console.error('❌ [Gateway] Failed to save threat logs:', err.message);
        }

        return res.status(403).json({
            success: false,
            message: 'Hành vi bất thường (tấn công SQLi/XSS) bị phát hiện và đã được ghi lại. Yêu cầu của bạn đã bị từ chối.'
        });
    }
    next();
};

// Apply global sanitizers and threat detectors
app.use(noSqlSanitizer);
app.use(threatDetector);

// --- ROUTE FORWARDING / PROXYING TO MICROSERVICES ---

// Forward to Auth Service
app.use('/api/auth/login', loginRateLimiter, async (req, res) => {
    try {
        console.log(`🔀 [Gateway] Proxying POST /api/auth/login to Auth-Service`);
        const response = await axios.post(`${SERVICES.auth}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(error.response?.data || { success: false, message: 'Auth Service Down' });
    }
});

// Forward to Library Service (any endpoint under /api/library/)
app.use('/api/library', async (req, res) => {
    const targetPath = req.path; // e.g. /books
    const method = req.method;
    const authHeader = req.headers.authorization;
    
    try {
        console.log(`🔀 [Gateway] Proxying ${method} /api/library${targetPath} to Library-Service`);
        
        const response = await axios({
            method,
            url: `${SERVICES.library}${targetPath}`,
            data: req.body,
            params: req.query,
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(error.response?.data || { success: false, message: 'Library Service Down' });
    }
});

// Endpoint to view Security Logs directly (Gateway dashboard capability)
app.get('/api/security/logs', async (req, res) => {
    try {
        const logs = await SecurityLog.find({})
            .sort({ timestamp: -1 })
            .limit(50);
        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Gateway
connectDB('API-Gateway').then(() => {
    app.listen(PORT, () => {
        console.log(`🛡️ [Gateway] running at http://localhost:${PORT}`);
        console.log('--- Gateway Security Layers Initialized: ---');
        console.log('  1. Manual Security Headers (Helmet equivalents)');
        console.log('  2. NoSQL Mongo Injection Filter');
        console.log('  3. Threat Injection Detection (SQLi/XSS prevention)');
        console.log('  4. Login Brute Force Rate Limiter');
        console.log('  5. Dynamic Intrusion Auto-Lock Engine');
        console.log('--------------------------------------------');
    });
});
