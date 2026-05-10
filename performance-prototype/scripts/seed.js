const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/performance_demo';

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String
});

const Product = mongoose.model('Product', ProductSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB...');
        
        await Product.deleteMany({});
        console.log('Cleared existing products.');

        const products = [];
        for (let i = 1; i <= 1000; i++) {
            products.push({
                name: `Product ${i}`,
                price: Math.floor(Math.random() * 1000) + 1,
                category: ['Electronics', 'Books', 'Clothing', 'Home'][Math.floor(Math.random() * 4)]
            });
        }

        await Product.insertMany(products);
        console.log(`Successfully seeded ${products.length} products.`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
