const express = require('express');
const axios = require('axios');
const timingMiddleware = require('../scripts/timingMiddleware');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(timingMiddleware('Gateway'));

const SERVICES = {
    auth: 'http://localhost:3001',
    product: 'http://localhost:3002'
};

// Route to Auth Service
app.post('/api/auth/login', async (req, res) => {
    try {
        const start = Date.now();
        const response = await axios.post(`${SERVICES.auth}/login`, req.body);
        const total = Date.now() - start;

        // Collect downstream timings
        const authTime = response.headers['x-time-auth-service'];
        
        console.log(`[Gateway] Total Roundtrip for Login: ${total}ms (Auth: ${authTime}ms)`);
        
        res.setHeader('X-Total-Time', total);
        res.status(response.status).json({
            ...response.data,
            metrics: {
                gateway_overhead: (total - parseFloat(authTime)).toFixed(2),
                auth_service: authTime,
                total: total
            }
        });
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
    }
});

// Route to Product Service
app.get('/api/products', async (req, res) => {
    try {
        const start = Date.now();
        const response = await axios.get(`${SERVICES.product}/list`);
        const total = Date.now() - start;

        const productTime = response.headers['x-time-product-service'];
        const dbTime = response.headers['x-time-database'];

        console.log(`[Gateway] Total Roundtrip for Products: ${total}ms (ProductSvc: ${productTime}ms, DB: ${dbTime}ms)`);

        res.setHeader('X-Total-Time', total);
        res.json({
            ...response.data,
            metrics: {
                gateway_overhead: (total - parseFloat(productTime)).toFixed(2),
                product_service: productTime,
                database: dbTime,
                total: total
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway running at http://localhost:${PORT}`);
});
