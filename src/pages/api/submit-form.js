import { google } from 'googleapis'

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
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

    if (!credentialsStr || !spreadsheetId) {
      console.error('Missing env vars - Credentials:', !!credentialsStr, 'SheetID:', !!spreadsheetId)
      return res.status(500).json({
        error: 'Configuration error',
        details: `Missing: ${!credentialsStr ? 'GOOGLE_SHEETS_CREDENTIALS ' : ''}${!spreadsheetId ? 'GOOGLE_SHEETS_ID' : ''}`
      })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsStr)
    } catch (e) {
      console.error('Failed to parse credentials JSON:', e.message)
      return res.status(500).json({ error: 'Invalid credentials format' })
    }

    if (!credentials.type) {
      return res.status(500).json({ error: 'Google credentials incomplete' })
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

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
    } else {
      return res.status(400).json({ error: 'Unknown form type' })
    }

    // Append data to sheet
    console.log('Appending to sheet:', sheetName, 'with', values.length, 'rows')
    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })
    console.log('Sheet append successful, updates:', response.data.updates)

    // Update Agent Progress sheet
    const agentEmail = data.Email || data.email || ''
    if (agentEmail) {
      try {
        // Determine which column to update based on form type
        let columnLetter = ''
        let firstName = data.firstName || ''
        let lastName = data.lastName || ''

        if (formType === 'emergency-contact') {
          columnLetter = 'F' // EC-Form column
          // Extract name from email or use data provided
        } else if (formType === 'bio') {
          columnLetter = 'J' // Bio column
          firstName = data.firstName || ''
          lastName = data.lastName || ''
        } else if (formType === 'about-you') {
          columnLetter = 'K' // About-You column
        }

        if (columnLetter) {
          // Read Agent Progress sheet to find agent row
          const progressResponse = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: 'Agent Progress!A:D',
          })

          const progressRows = progressResponse.data.values || []
          let agentRowIndex = -1

          // Find the row with matching email
          for (let i = 1; i < progressRows.length; i++) {
            if (progressRows[i] && progressRows[i][3] === agentEmail) {
              agentRowIndex = i
              break
            }
          }

          // If agent found, update the appropriate column
          if (agentRowIndex >= 0) {
            const updateRange = `Agent Progress!${columnLetter}${agentRowIndex + 1}`
            await sheets.spreadsheets.values.update({
              auth,
              spreadsheetId,
              range: updateRange,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [['✓']],
              },
            })
          }
        }
      } catch (progressError) {
        console.error('Agent Progress update error:', progressError)
        // Don't fail the entire request if progress update fails
      }
    }

    // Email functionality temporarily disabled - will be re-enabled with proper setup

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
      updates: response.data.updates,
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return res.status(500).json({
      error: 'Failed to submit form',
      message: error.message,
    })
  }
}
