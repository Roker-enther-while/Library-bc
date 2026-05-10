const express = require('express');
const mongoose = require('mongoose');
const timingMiddleware = require('../scripts/timingMiddleware');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(timingMiddleware('Product-Service'));

// Connect to the local MongoDB used in the library project
const MONGO_URI = 'mongodb://localhost:27017/performance_demo';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 Product Service connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String
});

const Product = mongoose.model('Product', ProductSchema);

app.get('/list', async (req, res) => {
    const dbStart = process.hrtime();
    
    try {
        const products = await Product.find({}).limit(50).lean();
        
        const dbDiff = process.hrtime(dbStart);
        const dbTime = (dbDiff[0] * 1e3 + dbDiff[1] * 1e-6).toFixed(3);
        
        // Pass DB time in headers
        res.setHeader('X-Time-Database', dbTime);
        
        res.json({
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`📦 Product Service running at http://localhost:${PORT}`);
});
