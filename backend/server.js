require('dotenv').config();
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

// CORS – allow both localhost dev and Vercel production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL, // e.g. https://thuvien.vercel.app
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// express-mongo-sanitize is incompatible with Express 5 (req.query is read-only).
// Sanitize only req.body manually to prevent NoSQL injection.
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    next();
});

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
app.use('/api/borrow', require('./routes/borrowRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));


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
