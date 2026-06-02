import { google } from 'googleapis'
import {
  GOOGLE_SHEETS_CONFIG,
  resolveColumnIndex,
  columnIndexToLetter,
  lastColumnLetter,
} from '@/config/sheets'

const sheets = google.sheets('v4')

// The column header this endpoint writes the selected card design into.
const TARGET_HEADER = 'Business Card'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, selection } = req.body

    if (!email || !selection) {
      return res.status(400).json({ error: 'Missing required fields: email, selection' })
    }

    const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS
    const spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId
    const hasGoogleSheets = credentialsStr && spreadsheetId

    let auth = null
    if (hasGoogleSheets) {
      let credentials
      try {
        credentials = JSON.parse(credentialsStr)
      } catch (e) {
        console.error('Failed to parse credentials JSON:', e.message)
      }
      if (credentials && credentials.type) {
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
      }
    }

    if (!auth) {
      console.warn('Google Sheets not configured, skipping card selection save')
      return res.status(200).json({ success: true, message: 'Saved locally (Sheets not configured)' })
    }

    // Retry transient Sheets failures (rate limits / brief unavailability).
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

    const lastCol = lastColumnLetter()
    let columnIndex = -1
    let agentRowNumber = -1

    // The agent row is created at registration (page 1). By page 3 it exists, but
    // retry the lookup to be safe under tight timing / eventual consistency.
    for (let attempt = 0; attempt < 8; attempt++) {
      const progressResponse = await withRetry(() =>
        sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: `Agent Progress!A:${lastCol}`,
        })
      )
      const rows = progressResponse.data.values || []
      columnIndex = resolveColumnIndex(TARGET_HEADER, rows[0] || [])
      agentRowNumber = -1
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i][3] === email) {
          agentRowNumber = i + 1
          break
        }
      }
      if (agentRowNumber >= 0 && columnIndex >= 0) break
      await new Promise((r) => setTimeout(r, 600))
    }

    if (columnIndex < 0 || agentRowNumber < 0) {
      console.warn(`log-card: could not resolve row/column for ${email} (col ${columnIndex}, row ${agentRowNumber})`)
      return res.status(502).json({
        error: 'Could not save your card selection right now. Please try again.',
      })
    }

    const columnLetter = columnIndexToLetter(columnIndex)
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `Agent Progress!${columnLetter}${agentRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[selection]] },
      })
    )

    console.log(`Card selection saved: ${email} -> ${selection}`)
    return res.status(200).json({ success: true, selection })
  } catch (error) {
    console.error('Card selection error:', error)
    return res.status(500).json({ error: 'Failed to save card selection', message: error.message })
  }
}
