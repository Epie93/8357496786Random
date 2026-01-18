@echo off
chcp 65001 >nul

echo ============================================
echo   Reinitialisation et Push vers GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [0/7] Nettoyage des anciens credentials Windows...
cmdkey /delete:git:https://github.com 2>nul
cmdkey /delete:LegacyGeneric:target=git:https://github.com 2>nul
for /f "tokens=1,2 delims= " %%a in ('cmdkey /list ^| findstr /i "github"') do cmdkey /delete:%%b 2>nul
echo [OK]
echo.

echo ============================================
echo   ENTREZ VOTRE TOKEN GITHUB (classic)
echo ============================================
echo.

set /p GITHUB_TOKEN="Token GitHub: "

if "%GITHUB_TOKEN%"=="" (
    echo [ERREUR] Token vide
    pause
    exit /b 1
)

echo.
echo [1/7] Suppression du depot Git local...
rmdir /s /q .git 2>nul
echo [OK]
echo.

echo [2/7] Initialisation d un nouveau depot...
git init
echo [OK]
echo.

echo [3/7] Configuration de Git...
git config user.email "Epie93@users.noreply.github.com"
git config user.name "Epie93"
git config credential.helper ""
git branch -M main
echo [OK]
echo.

echo [4/7] Configuration du remote avec token dans URL...
git remote add origin "https://Epie93:%GITHUB_TOKEN%@github.com/Epie93/8357496786Random.git"
echo [OK]
echo.

echo [5/7] Verification du remote...
git remote -v
echo.

echo [6/7] Ajout des fichiers et commit...
git add .
git commit -m "Initial commit - Clean project"
echo [OK]
echo.

echo [7/7] Push vers GitHub...
git push -u origin main --force 2>&1

set PUSH_ERROR=%errorlevel%
echo.
echo Code de retour du push: %PUSH_ERROR%
echo.

if %PUSH_ERROR% neq 0 (
    echo ============================================
    echo   ECHEC DU PUSH - Code erreur: %PUSH_ERROR%
    echo ============================================
    echo.
    echo Le token n a probablement pas les bonnes permissions.
    echo.
    echo Verifiez que:
    echo 1. C est un token CLASSIC (pas fine-grained)
    echo 2. Le scope "repo" est coche
    echo 3. Le token n est pas expire
    echo.
    echo Creez un nouveau token sur:
    echo https://github.com/settings/tokens/new
    echo.
) else (
    echo ============================================
    echo   SUCCES ! Projet pousse sur GitHub
    echo ============================================
    echo.
    git remote set-url origin "https://github.com/Epie93/8357496786Random.git"
    echo Remote nettoye.
)

echo.
pause
