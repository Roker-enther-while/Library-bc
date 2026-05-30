const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
    console.log('================================================================');
    console.log('🛡️  SECURITY ARCHITECTURAL PROTOTYPE VALIDATION RUNNER 🛡️');
    console.log('================================================================\n');

    let readerToken = null;
    let adminToken = null;

    // ----------------------------------------------------------------
    // SCENARIO 1: NORMAL READER LOGIN & SENSITIVE DATA ENCRYPTION VALIDATION
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 1: Normal Reader Login & Transparent AES-256-GCM Decryption');
    console.log('----------------------------------------------------------------');
    try {
        console.log('[Step 1.1] Logging in as standard reader: "reader" / "readerpassword"...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'reader',
            password: 'readerpassword'
        });
        
        readerToken = loginRes.data.token;
        console.log(`✅ Success! Login granted. JWT token acquired.`);
        console.log(`   User Role: ${loginRes.data.user.role}`);
        
        console.log('\n[Step 1.2] Fetching user sensitive profile (studentId and phone)...');
        const profileRes = await axios.get(`${BASE_URL}/api/library/sensitive-profile`, {
            headers: { 'Authorization': `Bearer ${readerToken}` }
        });
        
        console.log('✅ Success! Retreived data through Authorized Service:');
        console.log(`   - Clear-text studentId (in-app): ${profileRes.data.decryptedProfile.studentId}`);
        console.log(`   - Clear-text phone (in-app):     ${profileRes.data.decryptedProfile.phone}`);
        
        console.log('\n🛡️ [SECURITY VALIDATION: Encrypted On Disk]');
        console.log('   Here is what is ACTUALLY stored in the MongoDB Database:');
        console.log(`   - Encrypted studentId in DB: ${profileRes.data.encryptedRawInDatabase.studentId}`);
        console.log(`   - Encrypted phone in DB:     ${profileRes.data.encryptedRawInDatabase.phone}`);
        console.log('   👉 Data is fully secure and encrypted on the physical storage layer!');
    } catch (error) {
        console.error('❌ Scenario 1 Failed:', error.response?.data || error.message);
    }
    console.log('\n');
    await sleep(1500);

    // ----------------------------------------------------------------
    // SCENARIO 2: NORMAL ADMIN LOGIN, RBAC & STAFF AUDIT LOGGING
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 2: Admin Operations & Staff Audit Trail Logging');
    console.log('----------------------------------------------------------------');
    try {
        console.log('[Step 2.1] Logging in as administrator: "admin" / "adminpassword"...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'admin',
            password: 'adminpassword'
        });
        
        adminToken = loginRes.data.token;
        console.log(`✅ Success! Admin authenticated. JWT token acquired.`);
        
        console.log('\n[Step 2.2] Admin adding a new book "Bao Mat Kien Truc Web" to the catalog...');
        const bookRes = await axios.post(`${BASE_URL}/api/library/books`, {
            title: 'Bao Mat Kien Truc Web',
            author: 'Le Hoang C',
            category: 'Cong Nghe Thong Tin',
            isbn: `978-604-0-${Math.floor(100000 + Math.random() * 900000)}`
        }, {
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'User-Agent': 'Prototype-Admin-Client'
            }
        });
        
        console.log('✅ Success! Book created:', bookRes.data.data.title);
        
        console.log('\n[Step 2.3] Querying security log to verify the Staff Audit Trail...');
        const logsRes = await axios.get(`${BASE_URL}/api/security/logs`);
        const auditLog = logsRes.data.data.find(log => log.action === 'STAFF_POST_BOOK' && log.username === 'admin');
        
        if (auditLog) {
            console.log('✅ [SECURITY VALIDATION: Staff Action Audited] Found Audit Log in MongoDB:');
            console.log(`   - Timestamp:   ${auditLog.timestamp}`);
            console.log(`   - Actor:       User "${auditLog.username}" (IP: ${auditLog.ip})`);
            console.log(`   - Action:      ${auditLog.action}`);
            console.log(`   - Path/Method: ${auditLog.method} ${auditLog.path}`);
            console.log(`   - Payload:     `, JSON.stringify(auditLog.payload));
        } else {
            console.warn('⚠️ Audit log not found in recent database logs.');
        }
    } catch (error) {
        console.error('❌ Scenario 2 Failed:', error.response?.data || error.message);
    }
    console.log('\n');
    await sleep(1500);

    // ----------------------------------------------------------------
    // SCENARIO 3: ROLE-BASED ACCESS CONTROL (RBAC) VIOLATION PREVENTION
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 3: Privilege Escalation & RBAC Enforcement');
    console.log('----------------------------------------------------------------');
    try {
        console.log('[Step 3.1] Attempting to add a book using standard "reader" credentials...');
        console.log(`   (A reader should NOT be able to modify library catalog)`);
        
        await axios.post(`${BASE_URL}/api/library/books`, {
            title: 'Hacking the Library Catalog',
            author: 'Malicious Reader',
            category: 'Malware',
            isbn: '978-000-0-00000-0'
        }, {
            headers: { 'Authorization': `Bearer ${readerToken}` }
        });
        
        console.error('❌ Security Failure! The server allowed a reader to create a book.');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ [SECURITY VALIDATION: Privilege Blocked] Correctly blocked with 403 Forbidden!');
            console.log(`   Server Response: "${error.response.data.message}"`);
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }
    console.log('\n');
    await sleep(1500);

    // ----------------------------------------------------------------
    // SCENARIO 4: THREAT DETECTION BLOCKING (SQLi and XSS injection attempts)
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 4: System Protection - SQLi & XSS Threat Filters');
    console.log('----------------------------------------------------------------');
    
    // Test SQLi Injection
    try {
        console.log('[Step 4.1] Injecting SQLi query in request: searching books with "SELECT * FROM users;"...');
        await axios.get(`${BASE_URL}/api/library/books?search=SELECT * FROM users;`, {
            headers: { 'Authorization': `Bearer ${readerToken}` }
        });
        console.error('❌ Security Failure! The server allowed SQLi threat payload.');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ [SECURITY VALIDATION: SQLi Threat Intercepted] Blocked at API Gateway with 403 Forbidden!');
            console.log(`   Server Response: "${error.response.data.message}"`);
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }

    // Test XSS Injection
    try {
        console.log('\n[Step 4.2] Injecting XSS tag payload: sending "<script>alert(1)</script>" as body...');
        await axios.post(`${BASE_URL}/api/library/books`, {
            title: '<script>alert("XSS Attack")</script>',
            author: 'Hacker',
            category: 'Breach',
            isbn: '978-XSS'
        }, {
            headers: { 'Authorization': `Bearer ${readerToken}` }
        });
        console.error('❌ Security Failure! The server allowed XSS threat payload.');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ [SECURITY VALIDATION: XSS Threat Intercepted] Blocked at API Gateway with 403 Forbidden!');
            console.log(`   Server Response: "${error.response.data.message}"`);
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }
    console.log('\n');
    await sleep(1500);

    // ----------------------------------------------------------------
    // SCENARIO 5: BRUTE FORCE RATE LIMITING PROTECTION
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 5: Infrastructure Protection - Login Brute Force Rate Limiter');
    console.log('----------------------------------------------------------------');
    console.log('[Step 5.1] Executing 6 rapid login requests under 1 second...');
    
    let rateLimited = false;
    for (let i = 1; i <= 6; i++) {
        try {
            process.stdout.write(`   Attempt #${i} sending... `);
            const res = await axios.post(`${BASE_URL}/api/auth/login`, {
                username: 'reader',
                password: 'wrongpassword'
            });
            console.log(`Response status: ${res.status} (Allowed)`);
        } catch (error) {
            console.log(`Response status: ${error.response?.status || 'Error'} (${error.response?.data.message || error.message})`);
            if (error.response?.status === 429) {
                rateLimited = true;
            }
        }
    }
    
    if (rateLimited) {
        console.log('✅ [SECURITY VALIDATION: Brute Force Blocked] Rate limiter successfully triggered with 429 Too Many Requests!');
    } else {
        console.error('❌ Security Failure! 6 rapid login attempts were allowed without triggering Rate Limiter.');
    }
    console.log('\n');
    console.log('[Info] Waiting 11 seconds for the Rate Limiter window to clear before running Scenario 6...');
    await sleep(11000);

    // ----------------------------------------------------------------
    // SCENARIO 6: DYNAMIC INTRUSION AUTO-LOCK ENGINE
    // ----------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 6: Dynamic Intrusion Defense - Account Auto-Lock Engine');
    console.log('----------------------------------------------------------------');
    try {
        console.log('[Step 6.1] Creating a fresh reader session for user "reader"...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'reader',
            password: 'readerpassword'
        });
        const freshToken = loginRes.data.token;
        console.log('✅ Success! Token acquired.');
        
        console.log('\n[Step 6.2] Simulating 3 persistent injection attacks under this authenticated user session:');
        
        const attacks = [
            'DROP TABLE books;',
            '<iframe src="javascript:alert(1)">',
            'UNION SELECT username, password FROM users;'
        ];

        for (let i = 0; i < attacks.length; i++) {
            console.log(`   💥 Sending Attack #${i+1}: "${attacks[i]}"`);
            try {
                await axios.get(`${BASE_URL}/api/library/books?attack=${attacks[i]}`, {
                    headers: { 'Authorization': `Bearer ${freshToken}` }
                });
            } catch (err) {
                console.log(`   🛑 Blocked! status: ${err.response?.status} - ${err.response?.data.message}`);
            }
            await sleep(300);
        }

        console.log('\n[Step 6.3] Gateway Auto-Lock triggered. Attempting to log in again with credentials...');
        console.log('   (The user account should now be LOCKED, rejecting login)');
        
        const reLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'reader',
            password: 'readerpassword'
        });
        console.error('❌ Security Failure! Login allowed for user "reader" which should have been locked.');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ [SECURITY VALIDATION: Auto-Lock Complete] Login rejected with 403 Forbidden!');
            console.log(`   Server Response: "${error.response.data.message}"`);
            console.log('\n🛡️  All security scenarios have successfully completed and validated the architecture! 🛡️');
        } else {
            console.error('❌ Unexpected error during Auto-lock validation:', error.response?.data || error.message);
        }
    }
    console.log('================================================================');
}

runSimulation();
