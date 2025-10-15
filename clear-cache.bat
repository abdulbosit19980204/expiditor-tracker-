@echo off
echo Clearing Next.js cache and restarting development server...
taskkill /f /im node.exe 2>nul
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cache cleared. Starting development server...
npm run dev
pause
