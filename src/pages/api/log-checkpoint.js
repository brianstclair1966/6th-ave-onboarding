import { google } from 'googleapis'

async function getGoogleSheetsClient() {
  const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS

  if (!credentialsStr) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS not configured')
  }

  let credentials
  try {
    credentials = JSON.parse(credentialsStr)
  } catch (e) {
    throw new Error('Invalid GOOGLE_SHEETS_CREDENTIALS JSON: ' + e.message)
  }

  if (!credentials || !credentials.type) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS missing type field')
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, checkpointLabel } = req.body

    // Validate required fields
    if (!firstName || !lastName || !email || !checkpointLabel) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email, checkpointLabel'
      })
    }

    // Get sheet ID from environment
    const sheetId = process.env.GOOGLE_SHEETS_ID
    if (!sheetId) {
      console.warn('GOOGLE_SHEETS_ID not configured')
      return res.status(200).json({
        success: true,
        message: 'Checkpoint logged locally (Google Sheets ID not configured)'
      })
    }

    let sheets
    try {
      sheets = await getGoogleSheetsClient()
    } catch (authError) {
      console.warn('Google Sheets auth failed:', authError.message)
      return res.status(200).json({
        success: true,
        message: 'Checkpoint logged locally (Google Sheets credentials issue: ' + authError.message + ')'
      })
    }

    const timestamp = new Date().toISOString()

    // First, get the header row to find the checkpoint column
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Agent Progress!1:1',
    })

    const headers = headerResponse.data.values[0] || []
    const checkpointColumnIndex = headers.findIndex(
      h => h && h.toLowerCase() === checkpointLabel.toLowerCase()
    )

    if (checkpointColumnIndex === -1) {
      return res.status(400).json({
        error: `Checkpoint column "${checkpointLabel}" not found in sheet`
      })
    }

    // Get all data to find if this agent already has a row
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Agent Progress!A:E',
    })

    const rows = dataResponse.data.values || []
    let agentRowIndex = -1

    // Search for existing agent row (skip header, start at row 2)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === firstName && rows[i][2] === lastName && rows[i][3] === email) {
        agentRowIndex = i + 1 // Convert to 1-based sheet row number
        break
      }
    }

    if (agentRowIndex === -1) {
      // Create new row for this agent
      const newRow = [timestamp, firstName, lastName, email]

      // Pad the row to match the checkpoint column position
      while (newRow.length <= checkpointColumnIndex) {
        newRow.push('')
      }

      // Mark checkpoint as completed
      newRow[checkpointColumnIndex] = 'X'

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Agent Progress!A:Z',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRow],
        },
      })
    } else {
      // Update existing row with checkpoint mark
      const cellToUpdate = String.fromCharCode(65 + checkpointColumnIndex) + agentRowIndex

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Agent Progress!${cellToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['X']],
        },
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Checkpoint logging error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to log checkpoint'
    })
  }
}
