@echo off
chcp 65001 >nul

echo ============================================
echo   Push vers GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Ajout des fichiers...
git add .
echo [OK]
echo.

echo [2/3] Creation du commit...
git commit -m "Update project files" 2>nul
echo [OK]
echo.

echo [3/3] Push vers GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [INFO] Tentative avec force push...
    git push -u origin main --force
)

if errorlevel 1 (
    echo.
    echo [ERREUR] Le push a echoue
) else (
    echo.
    echo [OK] Push reussi!
)

echo.
pause
