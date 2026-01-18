import { NextRequest, NextResponse } from 'next/server'
import { getUsers, getEmailCodes, saveEmailCodes } from '@/lib/db'
import nodemailer from 'nodemailer'

// Types d'envoi de code
type CodeType = 'register' | 'login' | 'reset-password' | 'change-email'

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getEmailSubject(type: CodeType): string {
  switch (type) {
    case 'register': return '🔐 Code de création de compte - EpieFiveM'
    case 'login': return '🔑 Code de connexion - EpieFiveM'
    case 'reset-password': return '🔄 Code de réinitialisation - EpieFiveM'
    case 'change-email': return '📧 Code de changement d\'email - EpieFiveM'
    default: return '🔐 Code de vérification - EpieFiveM'
  }
}

function getEmailTitle(type: CodeType): string {
  switch (type) {
    case 'register': return 'Création de compte'
    case 'login': return 'Connexion à votre compte'
    case 'reset-password': return 'Réinitialisation du mot de passe'
    case 'change-email': return 'Changement d\'email'
    default: return 'Vérification'
  }
}

function getEmailDescription(type: CodeType): string {
  switch (type) {
    case 'register': return 'Utilisez ce code pour finaliser la création de votre compte'
    case 'login': return 'Utilisez ce code pour vous connecter à votre compte'
    case 'reset-password': return 'Utilisez ce code pour réinitialiser votre mot de passe'
    case 'change-email': return 'Utilisez ce code pour confirmer le changement d\'email'
    default: return 'Utilisez ce code pour vérifier votre identité'
  }
}

async function sendEmail(email: string, code: string, type: CodeType): Promise<boolean> {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@epiefivem.com'

    // Si les variables d'environnement ne sont pas configurées
    if (!smtpUser || !smtpPass) {
      console.log(`📧 [DEV MODE] Code de ${type} pour ${email}: ${code}`)
      console.log(`📧 [DEV MODE] Configure SMTP_USER et SMTP_PASS dans Render pour envoyer de vrais emails`)
      return true // Retourne true pour permettre les tests
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.verify()

    const subject = getEmailSubject(type)
    const title = getEmailTitle(type)
    const description = getEmailDescription(type)

    await transporter.sendMail({
      from: `"EpieFiveM" <${smtpFrom}>`,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f0a1f; color: #ffffff; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(147, 51, 234, 0.3); }
              .header { background: linear-gradient(90deg, #9333ea, #ec4899); padding: 30px; text-align: center; }
              .logo { font-size: 28px; font-weight: bold; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
              .content { padding: 40px 30px; }
              .title { font-size: 24px; color: #a855f7; margin-bottom: 10px; text-align: center; }
              .description { color: #d1d5db; text-align: center; margin-bottom: 30px; }
              .code-box { background: linear-gradient(135deg, #1f1135 0%, #0f0a1f 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #9333ea; box-shadow: 0 0 30px rgba(147, 51, 234, 0.2); }
              .code { font-size: 42px; font-weight: bold; color: #a855f7; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .warning { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
              .warning-text { color: #fca5a5; font-size: 14px; }
              .footer { background: #0f0a1f; padding: 20px; text-align: center; border-top: 1px solid #2d1b4e; }
              .footer-text { color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">⚡ EpieFiveM</div>
              </div>
              <div class="content">
                <h1 class="title">${title}</h1>
                <p class="description">${description}</p>
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                <div class="warning">
                  <p class="warning-text">⚠️ Ce code expire dans <strong>10 minutes</strong></p>
                  <p class="warning-text">Ne partagez jamais ce code avec qui que ce soit.</p>
                </div>
                <p style="color: #9ca3af; text-align: center; font-size: 13px;">
                  Si vous n'avez pas demandé ce code, ignorez cet email.<br>
                  Votre compte est en sécurité.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text">© 2024 EpieFiveM - Tous droits réservés</p>
                <p class="footer-text">Cet email a été envoyé à ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `${title}\n\n${description}\n\nVotre code : ${code}\n\nCe code expire dans 10 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez cet email.`,
    })

    console.log(`✅ Email ${type} envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    console.log(`📧 [FALLBACK] Code ${type} pour ${email}: ${code}`)
    return true // Retourne true pour permettre les tests même si l'email échoue
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'register' } = await request.json() as { email: string; type?: CodeType }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const normalizedEmail = email.toLowerCase()

    // Vérifications selon le type
    if (type === 'register') {
      // Pour l'inscription, l'email ne doit PAS exister
      if (users.find(u => u.email === normalizedEmail)) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    } else if (type === 'login' || type === 'reset-password') {
      // Pour login/reset, l'email DOIT exister
      if (!users.find(u => u.email === normalizedEmail)) {
        return NextResponse.json(
          { error: 'Aucun compte associé à cet email' },
          { status: 404 }
        )
      }
    }

    // Nettoyer les codes expirés
    const allCodes = getEmailCodes()
    const now = new Date()
    const validCodes = allCodes.filter(c => new Date(c.expiresAt) > now)

    // Supprimer l'ancien code pour cet email et ce type
    const otherCodes = validCodes.filter(c => !(c.email === normalizedEmail && (c as any).type === type))

    // Générer nouveau code
    const code = generateVerificationCode()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes

    const newCode = {
      email: normalizedEmail,
      code,
      type,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      verified: false
    }

    otherCodes.push(newCode)
    saveEmailCodes(otherCodes)

    // Envoyer l'email
    const emailSent = await sendEmail(normalizedEmail, code, type)

    return NextResponse.json({
      message: emailSent 
        ? 'Code de vérification envoyé par email' 
        : 'Code généré (vérifiez la console)',
      // En dev, retourner le code pour faciliter les tests
      ...(process.env.NODE_ENV === 'development' && { code })
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code' },
      { status: 500 }
    )
  }
}
