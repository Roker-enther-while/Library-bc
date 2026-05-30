@echo off
echo =================================================================
echo 🛡️  STARTING SECURITY PROTOTYPE SERVICES (PORT 4000/4001/4002) 🛡️
echo =================================================================
echo.

:: Start Auth Service in a new cmd window
start cmd /k "title SECURITY-AUTH-SERVICE (Port 4001) && cd /d "%~dp0" && npm run start-auth"

:: Start Library Service in a new cmd window
start cmd /k "title SECURITY-LIBRARY-SERVICE (Port 4002) && cd /d "%~dp0" && npm run start-library"

:: Wait 2 seconds for microservices to connect to MongoDB and start
timeout /t 2 /nobreak > nul

:: Start API Gateway in a new cmd window
start cmd /k "title SECURITY-API-GATEWAY (Port 4000) && cd /d "%~dp0" && npm run start-gateway"

echo.
echo 🍃 Services spawned successfully!
echo -----------------------------------------------------------------
echo ⚙️ Next steps:
echo 1. Keep these 3 terminals running.
echo 2. Run 'simulate.bat' inside the security-prototype folder to run the automated attacks validation scenario.
echo.
pause
