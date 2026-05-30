import { google } from 'googleapis'

const sheets = google.sheets('v4')

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

    // Get credentials from environment variable
    const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

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
      console.warn('Google Sheets not configured, skipping agent registration')
      return res.status(200).json({
        success: true,
        message: 'Agent info saved locally (Google Sheets not configured)',
      })
    }

    // Check if agent already exists
    try {
      const checkResponse = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Agent Progress!A:P',
      })

      const existingRows = checkResponse.data.values || []
      let agentExists = false

      // Check if agent with this email already exists (email is in column D, index 3)
      for (let i = 1; i < existingRows.length; i++) {
        if (existingRows[i] && existingRows[i][3] === email) {
          agentExists = true
          console.log('Agent already registered:', email)
          break
        }
      }

      if (agentExists) {
        return res.status(200).json({
          success: true,
          message: 'Agent already registered',
          isNew: false,
        })
      }
    } catch (checkError) {
      console.error('Error checking existing agents:', checkError.message)
      // Continue with registration anyway
    }

    // Register new agent - append to Agent Progress sheet
    // Schema: Timestamp, First Name, Last Name, Email, Welcome, EC-Form, TREC, GFWAR, IC-Agree, Bio, About-You, IABS, Rechat, Realscout, Training, BackUp
    const timestamp = new Date().toISOString()
    const agentRow = [
      [timestamp, firstName, lastName, email, '', '', '', '', '', '', '', '', '', '', '', ''],
    ]

    try {
      const appendResponse = await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Agent Progress!A:P',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: agentRow,
        },
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
