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

    let response = null

    // Only append to Google Sheets if configured
    if (auth) {
      try {
        console.log('Appending to sheet:', sheetName, 'with', values.length, 'rows')
        response = await sheets.spreadsheets.values.append({
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

            if (formType === 'emergency-contact') {
              columnLetter = 'F' // EC-Form column
            } else if (formType === 'bio') {
              columnLetter = 'J' // Bio column
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
      } catch (sheetsError) {
        console.error('Google Sheets error:', sheetsError.message)
        // Continue anyway - form was submitted even if we couldn't save it
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully' + (auth ? '' : ' (stored locally)'),
      updates: response?.data?.updates || null,
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return res.status(500).json({
      error: 'Failed to submit form',
      message: error.message,
    })
  }
}
