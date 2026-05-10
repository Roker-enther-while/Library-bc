# Architecture Performance Validation Prototype 🚀

This prototype validates that the microservices architecture meets the performance requirement of **Response Time <= 2 seconds** under load.

## 🏗 Architecture
**Client** -> **API Gateway (Port 3000)** -> **Service (Port 3001/3002)** -> **Database (MongoDB)**

## 🛠 Prerequisites
- Node.js installed
- MongoDB running locally on port 27017

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start Services (Open 3 separate terminals)
- **Terminal 1 (Auth Service):**
  ```bash
  npm run start-auth
  ```
- **Terminal 2 (Product Service):**
  ```bash
  npm run start-product
  ```
- **Terminal 3 (API Gateway):**
  ```bash
  npm run start-gateway
  ```

---

## 📺 Demo Scenario

### Step 1: Single Request Validation (Manual)
Use a browser or Postman to visit: `http://localhost:3000/api/products`

**Check the logs:**
- Gateway will print: `[Gateway] Total Roundtrip for Products: XXms`
- Product Service will print: `[Product-Service] GET /list - XXms`
- Logs will show the breakdown: Gateway overhead vs Service processing vs Database query.

### Step 2: Load Test Validation (Performance Benchmarking)
In a new terminal, run:
```bash
npm run load-test
```
This script will simulate 10, 50, and 100 concurrent users and print the Latency statistics.

---

## 📹 Video Demo Guide
1. **Intro:** Show the project folder structure.
2. **Setup:** Run `npm run seed` to show DB initialization.
3. **Run:** Start all 3 services in split-terminal view.
4. **Validation:** Send a manual request and point to the `Total Response Time` in the Gateway logs (e.g., 40ms).
5. **Stress Test:** Run `npm run load-test`.
6. **Conclusion:** Highlight the `Average Latency` in the output and confirm it is **< 2000ms (2s)**.

## 📊 Expected Performance Log Example
```text
[Gateway] GET /api/products - 45.230ms
[Product-Service] GET /list - 38.120ms
[Gateway] Total Roundtrip for Products: 45ms (ProductSvc: 38.120ms, DB: 12.450ms)
```

## ✅ Conclusion
The architecture demonstrates high efficiency by maintaining sub-100ms response times for standard queries, well within the 2-second SLA requirement.
