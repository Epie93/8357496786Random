# 📧 Guide de Configuration Email - EpieFiveM

Ce guide explique comment configurer l'envoi d'emails de vérification pour ton site.

---

## 🎯 Ce que fait le système

Le système envoie des codes de vérification à 6 chiffres pour :
- ✅ **Création de compte** - Vérifie que l'email appartient à l'utilisateur
- ✅ **Connexion** - Double authentification (2FA)
- ✅ **Réinitialisation du mot de passe** - Sécurise le changement de mot de passe
- ✅ **Changement d'email** - Vérifie le nouvel email

---

## 🔧 Option 1 : Gmail (Recommandé pour débuter)

### Étape 1 : Activer l'authentification à 2 facteurs sur Gmail

1. Va sur https://myaccount.google.com/security
2. Active "Validation en deux étapes" si ce n'est pas fait

### Étape 2 : Créer un mot de passe d'application

1. Va sur https://myaccount.google.com/apppasswords
2. Sélectionne "Autre (nom personnalisé)"
3. Entre "EpieFiveM" comme nom
4. Clique sur "Générer"
5. **Copie le mot de passe de 16 caractères** (ex: `abcd efgh ijkl mnop`)

### Étape 3 : Configurer sur Render

1. Va sur https://dashboard.render.com
2. Clique sur ton service "fivem-cheat-website"
3. Va dans l'onglet **Environment**
4. Ajoute ces variables :

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `ton-email@gmail.com` |
| `SMTP_PASS` | `abcdefghijklmnop` (le mot de passe d'app sans espaces) |
| `SMTP_FROM` | `ton-email@gmail.com` |

5. Clique sur **Save Changes**
6. Render va automatiquement redéployer

---

## 🔧 Option 2 : Outlook/Hotmail

### Variables d'environnement

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `smtp-mail.outlook.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `ton-email@outlook.com` |
| `SMTP_PASS` | `ton-mot-de-passe` |
| `SMTP_FROM` | `ton-email@outlook.com` |

---

## 🔧 Option 3 : Services Professionnels (Pour la production)

### SendGrid (Gratuit jusqu'à 100 emails/jour)

1. Crée un compte sur https://sendgrid.com
2. Va dans Settings > API Keys > Create API Key
3. Configure sur Render :

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASS` | `SG.xxxxxx` (ta clé API) |
| `SMTP_FROM` | `noreply@tondomaine.com` |

### Mailgun (Plus fiable)

1. Crée un compte sur https://mailgun.com
2. Récupère tes credentials SMTP

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `smtp.mailgun.org` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `postmaster@ton-domaine.mailgun.org` |
| `SMTP_PASS` | `ta-clé-smtp` |
| `SMTP_FROM` | `noreply@ton-domaine.com` |

---

## 🧪 Tester en Local

### Mode Développement

En local, si les variables SMTP ne sont pas configurées, le code apparaîtra dans :
1. La console du terminal (où `npm run dev` tourne)
2. La réponse de l'API (pour les tests)

### Créer un fichier `.env.local`

```env
# Copie ces lignes dans un fichier .env.local à la racine du projet
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton-email@gmail.com
SMTP_PASS=tonmotdepasseapp
SMTP_FROM=ton-email@gmail.com
```

---

## 📡 API Endpoints

### Envoyer un code

```
POST /api/auth/send-verification-code
```

**Body:**
```json
{
  "email": "user@example.com",
  "type": "register"  // ou "login", "reset-password", "change-email"
}
```

**Réponse:**
```json
{
  "message": "Code de vérification envoyé par email"
}
```

### Vérifier un code

```
POST /api/auth/verify-email-code
```

**Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "register"
}
```

**Réponse:**
```json
{
  "message": "Code vérifié avec succès",
  "verified": true,
  "type": "register"
}
```

---

## ⚠️ Problèmes Courants

### "Authentication failed"
- Vérifie que tu utilises bien un **mot de passe d'application**, pas ton mot de passe Gmail normal
- Le mot de passe doit être sans espaces

### "Connection refused"
- Vérifie `SMTP_HOST` et `SMTP_PORT`
- Certains hébergeurs bloquent le port 587, essaie 465 avec `SMTP_PORT=465`

### "Email not sent" mais pas d'erreur
- Vérifie les logs sur Render (onglet Logs)
- Le code s'affiche dans les logs même si l'email échoue

### Les emails arrivent en spam
- Utilise un service comme SendGrid ou Mailgun
- Configure SPF/DKIM sur ton domaine

---

## 🎉 C'est prêt !

Une fois configuré sur Render, les emails seront envoyés automatiquement :

1. **Inscription** → Code envoyé avant de créer le compte
2. **Connexion** → Code envoyé après vérification du mot de passe
3. **Reset password** → Code envoyé pour autoriser le changement

Les codes expirent après **10 minutes** pour la sécurité.

---

## 📞 Besoin d'aide ?

- Vérifie les logs sur Render
- Le code apparaît toujours dans les logs même si l'email échoue
- En mode dev, le code est retourné dans la réponse API
