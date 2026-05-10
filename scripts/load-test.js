const autocannon = require('autocannon');

async function runTest(name, url, connections, duration) {
    console.log(`\n🚀 Testing REAL Client-Server Architecture: ${name}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👥 Connections: ${connections} | ⏱️ Duration: ${duration}s`);

    const result = await autocannon({
        url,
        connections,
        duration,
        pipelining: 1
    });

    console.log('\n--- PERFORMANCE RESULTS ---');
    console.log(`Average Latency: ${result.latency.average} ms`);
    console.log(`Min Latency: ${result.latency.min} ms`);
    console.log(`Max Latency: ${result.latency.max} ms`);
    console.log(`Requests/sec: ${result.requests.average}`);
    
    if (result.latency.average <= 2000) {
        console.log('\n✅ ARCHITECTURE VALIDATED: Average response time is below 2s.');
    } else {
        console.log('\n❌ ARCHITECTURE FAILED: Average response time exceeds 2s.');
    }
}

async function main() {
    // Test the real Library Backend
    await runTest('Library Books API - 10 Users', 'http://localhost:5000/api/books', 10, 5);
    await runTest('Library Books API - 100 Users', 'http://localhost:5000/api/books', 100, 5);
}

main().catch(console.error);
