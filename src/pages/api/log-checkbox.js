import { google } from 'googleapis'

const sheets = google.sheets('v4')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, page, checkboxIndex, isChecked } = req.body

    if (!email || page === undefined || checkboxIndex === undefined || isChecked === undefined) {
      return res.status(400).json({ error: 'Missing required fields: email, page, checkboxIndex, isChecked' })
    }

    console.log(`Checkbox log - Email: ${email}, Page: ${page}, Index: ${checkboxIndex}, Checked: ${isChecked}`)

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
      }

      if (credentials && credentials.type) {
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
      }
    }

    if (!auth) {
      console.warn('Google Sheets not configured, skipping checkbox log')
      return res.status(200).json({ success: true, message: 'Checkbox logged locally' })
    }

    try {
      // Read Agent Progress sheet to find agent row
      const progressResponse = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Agent Progress!A:E',
      })

      const progressRows = progressResponse.data.values || []
      let agentRowIndex = -1

      // Find the row with matching email (assuming email is in column E for now)
      for (let i = 1; i < progressRows.length; i++) {
        if (progressRows[i]) {
          // Try to match email in different columns
          const rowEmail = progressRows[i][4] || progressRows[i][3] || ''
          if (rowEmail === email) {
            agentRowIndex = i
            break
          }
        }
      }

      if (agentRowIndex >= 0) {
        // Create unique identifier for this checkbox
        const checkboxId = `P${page}C${checkboxIndex}`
        const checkboxValue = isChecked ? '✓' : ''

        // For now, append checkbox clicks to a log at the end of Agent Progress
        // This creates a record of when each checkbox was checked
        const timestamp = new Date().toISOString()
        const logValues = [
          [
            timestamp,
            email,
            `Page ${page}, Checkbox ${checkboxIndex}`,
            isChecked ? 'Checked' : 'Unchecked',
          ],
        ]

        // Append to Agent Progress sheet (in a log section)
        const appendResponse = await sheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: 'Agent Progress!F:I',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: logValues,
          },
        })

        console.log('Checkbox logged to Agent Progress sheet')

        return res.status(200).json({
          success: true,
          message: 'Checkbox logged to Google Sheets',
          logged: true,
        })
      } else {
        // Agent not found in Agent Progress sheet
        console.warn(`Agent with email ${email} not found in Agent Progress sheet`)
        return res.status(200).json({
          success: true,
          message: 'Checkbox logged locally (agent not in Agent Progress sheet)',
          logged: false,
        })
      }
    } catch (sheetsError) {
      console.error('Google Sheets checkbox log error:', sheetsError.message)
      // Don't fail - just log locally
      return res.status(200).json({
        success: true,
        message: 'Checkbox logged locally (Google Sheets error)',
        logged: false,
      })
    }
  } catch (error) {
    console.error('Checkbox logging error:', error)
    return res.status(500).json({
      error: 'Failed to log checkbox',
      message: error.message,
    })
  }
}
