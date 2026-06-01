import { google } from 'googleapis'
import {
  GOOGLE_SHEETS_CONFIG,
  AGENT_PROGRESS_COLUMNS,
  WELCOME_COLUMN_INDEX,
  columnIndexToLetter,
  lastColumnLetter,
} from '@/config/sheets'

const sheets = google.sheets('v4')

// Compare the live header row against the canonical schema (case/space-insensitive).
function headersMatchCanonical(liveHeaders) {
  if (!Array.isArray(liveHeaders)) return false
  if (liveHeaders.length < AGENT_PROGRESS_COLUMNS.length) return false
  for (let i = 0; i < AGENT_PROGRESS_COLUMNS.length; i++) {
    const live = (liveHeaders[i] ?? '').toString().toLowerCase().trim()
    const want = AGENT_PROGRESS_COLUMNS[i].toLowerCase().trim()
    if (live !== want) return false
  }
  // Any extra non-empty columns beyond the canonical set => needs repair.
  for (let i = AGENT_PROGRESS_COLUMNS.length; i < liveHeaders.length; i++) {
    if ((liveHeaders[i] ?? '').toString().trim() !== '') return false
  }
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email' })
    }

    console.log('Agent registration - Email:', email, 'Name:', firstName, lastName)

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
      console.warn('Google Sheets not configured, skipping agent registration')
      return res.status(200).json({
        success: true,
        message: 'Agent info saved locally (Google Sheets not configured)',
      })
    }

    const lastCol = lastColumnLetter()

    // Ensure the canonical header row is present and correct. Because the sheet
    // resolves columns by header NAME, a correct header row is what keeps
    // logging aligned. Repair it if it drifts (safe to run on every register).
    try {
      const headerCheckResponse = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        // Read a generous width so we can detect (and clear) leftover columns.
        range: 'Agent Progress!A1:BZ1',
      })

      const existingHeaders = headerCheckResponse.data.values?.[0] || []

      if (!headersMatchCanonical(existingHeaders)) {
        // Write canonical headers across A1:<lastCol>1 ...
        await sheets.spreadsheets.values.update({
          auth,
          spreadsheetId,
          range: `Agent Progress!A1:${lastCol}1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [AGENT_PROGRESS_COLUMNS] },
        })

        // ... and clear any stale header cells to the right of the schema.
        if (existingHeaders.length > AGENT_PROGRESS_COLUMNS.length) {
          const firstExtra = columnIndexToLetter(AGENT_PROGRESS_COLUMNS.length)
          await sheets.spreadsheets.values.clear({
            auth,
            spreadsheetId,
            range: `Agent Progress!${firstExtra}1:BZ1`,
          })
        }
        console.log('Agent Progress headers repaired to canonical schema')
      }
    } catch (headerError) {
      console.warn('Error checking/repairing headers:', headerError.message)
    }

    // Check if agent already exists (email is column D, index 3).
    try {
      const checkResponse = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `Agent Progress!A:${lastCol}`,
      })
      const existingRows = checkResponse.data.values || []
      for (let i = 1; i < existingRows.length; i++) {
        if (existingRows[i] && existingRows[i][3] === email) {
          console.log('Agent already registered:', email)
          return res.status(200).json({
            success: true,
            message: 'Agent already registered',
            isNew: false,
          })
        }
      }
    } catch (checkError) {
      console.error('Error checking existing agents:', checkError.message)
    }

    // Build the new agent row with Welcome pre-checked.
    const agentRow = new Array(AGENT_PROGRESS_COLUMNS.length).fill('')
    agentRow[0] = new Date().toISOString()
    agentRow[1] = firstName
    agentRow[2] = lastName
    agentRow[3] = email
    if (WELCOME_COLUMN_INDEX >= 0) agentRow[WELCOME_COLUMN_INDEX] = '✓'

    try {
      const appendResponse = await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `Agent Progress!A:${lastCol}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [agentRow] },
      })

      console.log('Agent registered successfully, updates:', appendResponse.data.updates)
      return res.status(200).json({
        success: true,
        message: 'Agent registered successfully',
        isNew: true,
        updates: appendResponse.data.updates,
      })
    } catch (sheetsError) {
      console.error('Google Sheets error:', sheetsError.message)
      return res.status(500).json({
        error: 'Failed to register agent',
        message: sheetsError.message,
      })
    }
  } catch (error) {
    console.error('Agent registration error:', error)
    return res.status(500).json({
      error: 'Failed to register agent',
      message: error.message,
    })
  }
}
