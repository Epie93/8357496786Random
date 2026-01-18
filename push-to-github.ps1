# Script PowerShell pour push le dossier render-deploy sur GitHub

Write-Host "=== Push vers GitHub ===" -ForegroundColor Cyan

# Vérifier si Git est installé
try {
    $gitVersion = git --version
    Write-Host "✅ Git trouvé: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Téléchargez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Aller dans le dossier render-deploy
$deployPath = Join-Path $PSScriptRoot "."
Set-Location $deployPath
Write-Host "📁 Dossier actuel: $(Get-Location)" -ForegroundColor Cyan

# Initialiser Git si nécessaire
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initialisation de Git..." -ForegroundColor Yellow
    git init
}

# Ajouter tous les fichiers
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m "Ready for Render deployment" 2>&1 | Out-Null

# Configurer la branche
Write-Host "🌿 Configuration de la branche..." -ForegroundColor Yellow
git branch -M main

# Ajouter le remote (ou le mettre à jour)
Write-Host "🔗 Configuration du remote..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/Epie93/8357496786Random.git"
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote existant trouvé, mise à jour..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
}

# Push
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Cela va écraser le contenu actuel sur GitHub" -ForegroundColor Red
$confirm = Read-Host "Continuer ? (O/N)"
if ($confirm -eq "O" -or $confirm -eq "o") {
    git push -u origin main --force
    Write-Host "✅ Push terminé !" -ForegroundColor Green
} else {
    Write-Host "❌ Push annulé" -ForegroundColor Yellow
}



