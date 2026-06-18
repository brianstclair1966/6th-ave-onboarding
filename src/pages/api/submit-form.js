import { google } from 'googleapis'
import {
  GOOGLE_SHEETS_CONFIG,
  resolveColumnIndex,
  columnIndexToLetter,
  lastColumnLetter,
} from '@/config/sheets'
import { sendMail } from '@/lib/mailer'

const sheets = google.sheets('v4')

// Team notifications: who gets emailed when each form is submitted, and which
// fields (label -> data key, in order) to include. Email is best-effort and
// only fires after the submission is otherwise handled.
const TEAM_EMAILS = {
  'emergency-contact': {
    to: 'brian@6thavehomes.com',
    title: 'Emergency Contact',
    fields: [
      ['Agent Name', 'Agent Name'],
      ['Agent Email', 'Email'],
      ['TREC License #', 'TREC License #'],
      ['License Expiry', 'License Expiry'],
      ['Cell Phone', 'Cell Phone'],
      ['Birthday', 'Birthday'],
      ['Home Address — Street', 'Home Address Street'],
      ['Home Address — City', 'Home Address City'],
      ['Home Address — Zip', 'Home Address Zip'],
      ['Emergency Contact Name', 'Emergency Contact Name'],
      ['Emergency Contact Phone', 'Emergency Contact Phone'],
      ['Emergency Contact Email', 'Emergency Contact Email'],
      ['Location Access', 'Location Access'],
    ],
  },
  'about-you': {
    to: 'brian@6thavehomes.com',
    title: 'About You',
    fields: [
      ['Agent Name', 'Agent Name'],
      ['Agent Email', 'Email'],
      ['Go-to Beverage', 'Beverage'],
      ['Current Obsession', 'Current Obsession'],
      ["Can't Live Without", "Can't Live Without"],
      ['Non-Profit', 'Non-Profit'],
      ['Favorite Meal (FW)', 'Favorite Meal FW'],
      ['Favorite Bar (FW)', 'Favorite Bar FW'],
      ['What They Love About the Job', 'What Love About Job'],
      ['Interesting Fact', 'Interesting Fact'],
      ['Enneagram', 'Enneagram'],
    ],
  },
  'business-card': {
    to: 'victoria@6thavehomes.com',
    title: 'Business Card Order',
    fields: [
      ['Agent Name', 'Agent Name'],
      ['Email', 'Email'],
      ['Phone', 'Phone'],
      ['Instagram', 'Instagram'],
      ['Website', 'Website'],
      ['Card Selected', 'Card Option'],
    ],
  },
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function buildSubmissionEmail(cfg, data) {
  const name = data['Agent Name'] || data.Email || 'New agent'
  const rows = cfg.fields.map(([label, key]) => [label, data[key]])
  const text =
    `New ${cfg.title} submission from ${name}\n\n` +
    rows.map(([l, v]) => `${l}: ${v || '—'}`).join('\n') +
    '\n'
  const htmlRows = rows
    .map(
      ([l, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5f6e74;font-weight:600;vertical-align:top;white-space:nowrap">${escapeHtml(
          l
        )}</td><td style="padding:6px 0;color:#043853">${escapeHtml(v) || '—'}</td></tr>`
    )
    .join('')
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px">
    <h2 style="color:#043853;margin:0 0 4px">New ${escapeHtml(cfg.title)} submission</h2>
    <p style="color:#5f6e74;margin:0 0 16px">From <strong>${escapeHtml(name)}</strong></p>
    <table style="border-collapse:collapse;font-size:14px">${htmlRows}</table>
    <p style="color:#9aa3a7;font-size:12px;margin-top:20px">Sent automatically by the 6th Ave onboarding app.</p>
  </div>`
  return { text, html }
}

async function sendSubmissionEmail(formType, data) {
  const cfg = TEAM_EMAILS[formType]
  if (!cfg) return
  const name = data['Agent Name'] || data.Email || ''
  const { text, html } = buildSubmissionEmail(cfg, data)
  await sendMail({
    to: cfg.to,
    subject: `New ${cfg.title}${name ? ` — ${name}` : ''}`,
    text,
    html,
    replyTo: data.Email || undefined,
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { formType, data } = req.body

    if (!formType || !data) {
      return res.status(400).json({ error: 'Missing formType or data' })
    }

    console.log('Form submission - Type:', formType, 'Data keys:', Object.keys(data))

    // Get credentials from environment variable
    const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS
    const spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId

    // Check if Google Sheets is configured
    const hasGoogleSheets = credentialsStr && spreadsheetId

    let auth = null

    if (hasGoogleSheets) {
      let credentials
      try {
        credentials = JSON.parse(credentialsStr)
      } catch (e) {
        console.error('Failed to parse credentials JSON:', e.message)
        // Continue without Google Sheets if parsing fails
      }

      if (credentials && credentials.type) {
        // Create auth client
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
      }
    }

    if (!auth) {
      console.warn('Google Sheets not configured, skipping database save')
    }

    // Prepare row data based on form type
    let values = []
    let sheetName = 'Form Submissions'

    if (formType === 'emergency-contact') {
      sheetName = 'Emergency Contact'
      values = [
        [
          new Date().toISOString(),
          data.Email || '',
          data['TREC License #'] || '',
          data['License Expiry'] || '',
          data['Cell Phone'] || '',
          data['Birthday'] || '',
          data['Home Address Street'] || '',
          data['Home Address City'] || '',
          data['Home Address Zip'] || '',
          data['Emergency Contact Name'] || '',
          data['Emergency Contact Phone'] || '',
          data['Emergency Contact Email'] || '',
          data['Location Access'] || '',
        ],
      ]
    } else if (formType === 'bio') {
      sheetName = 'Bio Submissions'
      values = [
        [
          new Date().toISOString(),
          data.email || '',
          data.firstName || '',
          data.lastName || '',
          data.bio || '',
        ],
      ]
    } else if (formType === 'about-you') {
      sheetName = 'About You Submissions'
      values = [
        [
          new Date().toISOString(),
          data.Email || '',
          data.Beverage || '',
          data['Current Obsession'] || '',
          data["Can't Live Without"] || '',
          data['Non-Profit'] || '',
          data['Favorite Meal FW'] || '',
          data['Favorite Bar FW'] || '',
          data['What Love About Job'] || '',
          data['Interesting Fact'] || '',
          data.Enneagram || '',
        ],
      ]
    } else if (formType === 'business-card') {
      sheetName = 'Business Card Orders'
      values = [
        [
          new Date().toISOString(),
          data.Email || '',
          data['Agent Name'] || '',
          data['Card Option'] || '',
          data.Phone || '',
          data.Instagram || '',
          data.Website || '',
        ],
      ]
    } else {
      return res.status(400).json({ error: 'Unknown form type' })
    }

    let response = null
    let progressMark = { marked: false }

    // Retry transient Google Sheets failures (rate limits / brief unavailability)
    // with growing backoff. Real submissions succeed on the first try; this only
    // matters when many writes land in a short window.
    const withRetry = async (fn, attempts = 5) => {
      let lastErr
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn()
        } catch (e) {
          lastErr = e
          await new Promise((r) => setTimeout(r, 600 * (i + 1)))
        }
      }
      throw lastErr
    }

    // For order-style tabs (e.g. business cards) we create the sheet on first use.
    const ensureSheetExists = async (title, headerRow) => {
      try {
        const meta = await withRetry(() =>
          sheets.spreadsheets.get({ auth, spreadsheetId, fields: 'sheets.properties.title' })
        )
        const titles = (meta.data.sheets || []).map((s) => s.properties.title)
        if (titles.includes(title)) return
        await withRetry(() =>
          sheets.spreadsheets.batchUpdate({
            auth,
            spreadsheetId,
            requestBody: { requests: [{ addSheet: { properties: { title } } }] },
          })
        )
        if (headerRow) {
          await withRetry(() =>
            sheets.spreadsheets.values.update({
              auth,
              spreadsheetId,
              range: `${title}!A1`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [headerRow] },
            })
          )
        }
      } catch (e) {
        // If a concurrent request already created it, that's fine — the append still works.
        console.warn('ensureSheetExists:', title, e.message)
      }
    }

    // Only append to Google Sheets if configured
    if (auth) {
      // Make sure the business-card order tab exists before appending to it.
      if (formType === 'business-card') {
        await ensureSheetExists('Business Card Orders', [
          'Timestamp',
          'Email',
          'Agent Name',
          'Card Option',
          'Phone',
          'Instagram',
          'Website',
        ])
      }

      // 1) Save the form data to its detail tab. If this ultimately fails, surface
      //    an error so the agent can retry — never silently report success.
      try {
        response = await withRetry(() =>
          sheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values },
          })
        )
      } catch (sheetsError) {
        console.error('Google Sheets append failed after retries:', sheetsError.message)
        return res.status(502).json({
          error: 'Could not save your form right now. Please try again.',
          message: sheetsError.message,
        })
      }

      // 2) Mark the matching Agent Progress column. Non-fatal — the data is saved.
      // Prefer the registered email (page-1 agentInfo) passed as `agentEmail` for the
      // row lookup, so an edited or stale order email can't break the mark.
      const agentEmail = (req.body.agentEmail || data.Email || data.email || '').trim()
      // Most forms just stamp a ✓; the business card stamps which option was chosen.
      const markValue = formType === 'business-card' ? data['Card Option'] || '✓' : '✓'
      let targetHeader = ''
      if (formType === 'emergency-contact') targetHeader = 'EC-Form'
      else if (formType === 'bio') targetHeader = 'Bio'
      else if (formType === 'about-you') targetHeader = 'About-You'
      else if (formType === 'business-card') targetHeader = 'Business Card'

      if (agentEmail && targetHeader) {
        try {
          const lastCol = lastColumnLetter()
          const wanted = agentEmail.toLowerCase()
          let columnIndex = -1
          let agentRowNumber = -1

          // The agent row is created by register-agent; under tight timing it may
          // not be visible to the first read, so retry the lookup.
          for (let attempt = 0; attempt < 8; attempt++) {
            const progressResponse = await withRetry(() =>
              sheets.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `Agent Progress!A:${lastCol}`,
              })
            )
            const progressRows = progressResponse.data.values || []
            columnIndex = resolveColumnIndex(targetHeader, progressRows[0] || [])
            agentRowNumber = -1
            for (let i = 1; i < progressRows.length; i++) {
              if (progressRows[i] && String(progressRows[i][3] || '').trim().toLowerCase() === wanted) {
                agentRowNumber = i + 1
                break
              }
            }
            if (agentRowNumber >= 0) break
            await new Promise((resolve) => setTimeout(resolve, 600))
          }

          if (columnIndex >= 0 && agentRowNumber >= 0) {
            const columnLetter = columnIndexToLetter(columnIndex)
            await withRetry(() =>
              sheets.spreadsheets.values.update({
                auth,
                spreadsheetId,
                range: `Agent Progress!${columnLetter}${agentRowNumber}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[markValue]] },
              })
            )
            progressMark = { marked: true, header: targetHeader, column: columnLetter, row: agentRowNumber }
          } else {
            console.warn(
              `submit-form: agent row for ${agentEmail} not found after retries; skipped ${targetHeader} mark`
            )
            progressMark = { marked: false, reason: 'agent row not found', email: agentEmail }
          }
        } catch (progressError) {
          console.error('Agent Progress update error:', progressError)
          progressMark = { marked: false, reason: progressError.message }
          // Non-fatal: the form data is already saved.
        }
      }
    }

    // Notify the team by email (best-effort; never blocks or fails the submission).
    try {
      await sendSubmissionEmail(formType, data)
    } catch (mailErr) {
      console.error('Notification email failed:', mailErr.message)
    }

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully' + (auth ? '' : ' (stored locally)'),
      updates: response?.data?.updates || null,
      progress: progressMark,
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return res.status(500).json({
      error: 'Failed to submit form',
      message: error.message,
    })
  }
}
