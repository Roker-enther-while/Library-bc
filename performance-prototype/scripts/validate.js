const axios = require('axios');

async function validatePerformance() {
    const iterations = [10, 50, 100];
    const url = 'http://localhost:3000/api/products';

    console.log('=== ARCHITECTURE PERFORMANCE VALIDATION ===\n');
    
    for (const count of iterations) {
        console.log(`Testing ${count} sequential requests...`);
        const times = [];
        
        for (let i = 0; i < count; i++) {
            const start = Date.now();
            await axios.get(url);
            times.push(Date.now() - start);
        }

        const avg = times.reduce((a, b) => a + b, 0) / count;
        const min = Math.min(...times);
        const max = Math.max(...times);

        console.log(`Results for ${count} requests:`);
        console.log(`- Average: ${avg.toFixed(2)}ms`);
        console.log(`- Min: ${min}ms`);
        console.log(`- Max: ${max}ms`);
        console.log(`- Status: ${avg <= 2000 ? '✅ PASS' : '❌ FAIL'}\n`);
    }
}

validatePerformance().catch(err => {
    console.error('Error: Make sure all services (Gateway, Auth, Product) are running!');
});
