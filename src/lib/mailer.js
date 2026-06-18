import nodemailer from 'nodemailer'

// Lightweight email helper for onboarding notifications.
//
// Delivery is Gmail / Google Workspace SMTP, authenticated with an app password.
// Set these in Vercel (Settings > Environment Variables):
//   GMAIL_USER          the sending account, e.g. notifications@6thavehomes.com
//   GMAIL_APP_PASSWORD  a 16-char app password for that account (2FA required)
//
// If those aren't set, sendMail() is a safe no-op — the app still runs and forms
// still save to Google Sheets; emails simply don't go out until the secret is added.

let cachedTransport

function getTransport() {
  const user = process.env.GMAIL_USER
  // App passwords are shown in groups of four with spaces; strip any whitespace.
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
  if (!user || !pass) return null
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })
  }
  return cachedTransport
}

export function mailerConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

// Sends an email. Resolves with {sent:false, skipped:true} when not configured,
// so callers can always await it without guarding. Throwing is left to the caller
// to catch — submission flows treat email as best-effort.
export async function sendMail({ to, cc, subject, text, html, replyTo }) {
  const transport = getTransport()
  if (!transport) {
    console.warn('[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping email:', subject)
    return { sent: false, skipped: true }
  }
  const from = `"6th Ave Onboarding" <${process.env.GMAIL_USER}>`
  const info = await transport.sendMail({ from, to, cc, subject, text, html, replyTo })
  return { sent: true, id: info.messageId }
}
