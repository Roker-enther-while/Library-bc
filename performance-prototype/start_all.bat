@echo off
echo Starting Performance Validation Prototype...

start cmd /k "title AUTH-SERVICE && npm run start-auth"
start cmd /k "title PRODUCT-SERVICE && npm run start-product"
timeout /t 2
start cmd /k "title API-GATEWAY && npm run start-gateway"

echo.
echo All services are starting...
echo 1. Open Browser to http://localhost:3000/api/products
echo 2. Run 'npm run load-test' in a new terminal to validate performance.
pause
