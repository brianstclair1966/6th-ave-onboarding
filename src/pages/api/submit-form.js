import { google } from 'googleapis'
import {
  GOOGLE_SHEETS_CONFIG,
  resolveColumnIndex,
  columnIndexToLetter,
  lastColumnLetter,
} from '@/config/sheets'

const sheets = google.sheets('v4')

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
