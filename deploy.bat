@echo off
cd /d "%~dp0"
echo === 清理并生成静态文件 ===
call npx hexo clean && npx hexo generate
if %errorlevel% neq 0 (
    echo 生成失败，退出。
    pause
    exit /b 1
)

echo === 部署到 GitHub Pages ===
if exist .deploy_git (
    rmdir /s /q .deploy_git
)
mkdir .deploy_git
xcopy /e /q public\* .deploy_git\ >nul
copy public\.nojekyll .deploy_git\ >nul

cd .deploy_git
git init >nul
git checkout -b pages >nul 2>&1
git add -A >nul
git commit -m "Site updated: %DATE% %TIME%" >nul
git remote add origin https://github.com/Fogjw/Fogjw.github.io.git >nul 2>&1
git push -f origin pages
cd ..

echo.
echo === 完成！请访问 https://fogjw.github.io ===
pause
