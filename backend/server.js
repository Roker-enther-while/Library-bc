require('dotenv').config();
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { startCronJobs } = require('./services/cronJobs');

connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// Request logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// CORS – allow localhost and production frontend
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow if no origin (like mobile apps/curl/server-side)
        if (!origin) return callback(null, true);

        // Check if origin is in allowedOrigins OR matches a local IP pattern OR is a subdomain of authorized domain
        const isAllowed = allowedOrigins.some(ao => origin.startsWith(ao));
        const isLocal = origin.includes('localhost') ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://172.') ||
            origin.startsWith('http://10.');

        if (isAllowed || isLocal) {
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Security Monitor (Threat Detection)
const { threatDetector } = require('./middleware/securityMiddleware');
app.use(threatDetector);

// express-mongo-sanitize is incompatible with Express 5 (req.query is read-only).
// Sanitize only req.body manually to prevent NoSQL injection.
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    next();
});

// General Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Nới lỏng cho dev
    message: { message: 'Hệ thống đang bận. Vui lòng thử lại sau.' }
});
app.use('/api/', generalLimiter);

// Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.' }
});
app.use('/api/auth/login', authLimiter);

// Rate Limiting for AI Chat
const aiChatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: { message: 'Bạn đang chat quá nhanh. Vui lòng đợi một lát rồi thử lại.' }
});
app.set('aiChatLimiter', aiChatLimiter);


// Routes
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/authors', require('./routes/authorRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/borrows', require('./routes/borrowRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/ai', require('./ai/ai.routes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/copies', require('./routes/copyRoutes'));


app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Library API is running 📚' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    startCronJobs();
});
