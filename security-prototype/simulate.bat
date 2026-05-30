@echo off
echo =================================================================
echo 🛡️  RUNNING AUTOMATED SECURITY VALIDATION SIMULATION 🛡️
echo =================================================================
echo.

cd /d "%~dp0"

echo 🍃 [1/2] Seeding security_demo MongoDB database...
call npm run seed
echo.

echo 🚀 [2/2] Running automated scenario attacks and checks against API Gateway...
call npm run simulate

echo.
echo -----------------------------------------------------------------
echo ✅ Validation suite execution completed.
echo    - Make sure to review the logs printed in the Gateway & Service terminals to see how attacks were detected, logged, and auto-locked in real-time.
echo.
pause
