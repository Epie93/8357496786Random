@echo off
chcp 65001 >nul
REM Changer vers le répertoire du script
cd /d "%~dp0"
echo ============================================
echo   Démarrage du serveur de développement
echo ============================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si npm est installé
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

REM Nettoyer le cache si nécessaire (optionnel - commenter si trop long)
REM echo Nettoyage du cache...
REM if exist ".next" (
REM     rmdir /s /q .next 2>nul
REM )

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo Installation des dépendances...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] L'installation des dépendances a échoué
        pause
        exit /b 1
    )
    echo.
)

echo Démarrage du serveur Next.js sur http://localhost:3000
echo.
echo La fenêtre du serveur va s'ouvrir dans un instant...
echo Appuyez sur Ctrl+C dans la fenêtre du serveur pour l'arrêter
echo.

REM Lancer le serveur de développement dans une nouvelle fenêtre
start "Next.js Dev Server - localhost:3000" cmd /k "cd /d %~dp0 && npm run dev"

REM Attendre que le serveur démarre
echo Attente du démarrage du serveur...
timeout /t 8 /nobreak >nul

REM Ouvrir le navigateur
echo Ouverture du navigateur...
start http://localhost:3000

echo.
echo ============================================
echo Le serveur est en cours d'exécution !
echo Ouvrez votre navigateur sur: http://localhost:3000
echo ============================================
echo.
echo Cette fenêtre peut être fermée, le serveur tourne dans l'autre fenêtre.
echo.
pause
