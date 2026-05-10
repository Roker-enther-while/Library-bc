const autocannon = require('autocannon');

async function runTest(name, url, connections, duration) {
    console.log(`\n🚀 Starting Load Test: ${name}`);
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
    console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} Mb/sec`);
    
    if (result.latency.average <= 2000) {
        console.log('\n✅ PERFORMANCE VALIDATED: Average response time is below 2s.');
    } else {
        console.log('\n❌ PERFORMANCE FAILED: Average response time exceeds 2s.');
    }
}

async function main() {
    // 1. Test Single Request (Simulation of 10-50-100 is done by increasing connections)
    await runTest('Product List - 10 Concurrent Users', 'http://localhost:3000/api/products', 10, 5);
    await runTest('Product List - 50 Concurrent Users', 'http://localhost:3000/api/products', 50, 5);
    await runTest('Product List - 100 Concurrent Users', 'http://localhost:3000/api/products', 100, 5);
    await runTest('STRESS TEST - 500 Concurrent Users', 'http://localhost:3000/api/products', 500, 5);
}

main().catch(console.error);
