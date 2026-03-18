@echo off
cls
echo ==========================================
echo  ChromaCanvas GitHub Push Helper
echo ==========================================
echo.
echo [1/2] Connecting to GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/hammarbae/chroma-canvas.git
git branch -M main

echo.
echo [2/2] Pushing code to GitHub...
echo >> If any login popup or browser window appears, please approve it!
echo.

git push -u origin main

echo.
echo ==========================================
echo Process Finished. Please check above screen.
echo ==========================================
pause
