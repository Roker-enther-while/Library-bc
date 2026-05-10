const express = require('express');
const timingMiddleware = require('../scripts/timingMiddleware');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(timingMiddleware('Auth-Service'));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simulate some logic processing
    // In real app, this would query DB
    setTimeout(() => {
        if (username === 'admin' && password === 'password') {
            res.json({ success: true, user: { id: 1, name: 'Performance Tester' } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    }, 50); // Simulate 50ms processing
});

app.listen(PORT, () => {
    console.log(`🔑 Auth Service running at http://localhost:${PORT}`);
});
