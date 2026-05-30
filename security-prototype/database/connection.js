const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/security_demo';

const connectDB = async (serviceName) => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`🍃 [${serviceName}] Connected to MongoDB: security_demo on ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ [${serviceName}] MongoDB connection error:`, error.message);
        process.exit(1);
    }
};

module.exports = { connectDB, MONGO_URI };
