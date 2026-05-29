import { google } from 'googleapis'
import nodemailer from 'nodemailer'

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

    // Get credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')

    if (!credentials.type) {
      return res.status(500).json({ error: 'Google credentials not configured' })
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet ID not configured' })
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

    // Append data to sheet
    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

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

    // Send email for bio and about-you forms
    if ((formType === 'bio' || formType === 'about-you') && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        })

        let emailSubject = ''
        let emailHtml = ''

        if (formType === 'bio') {
          const agentName = `${data.firstName || ''} ${data.lastName || ''}`.trim()
          emailSubject = `New Bio Submission from ${agentName}`
          emailHtml = `
            <h2>New Bio Submission</h2>
            <p><strong>Agent:</strong> ${agentName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <h3>Bio:</h3>
            <p>${(data.bio || '').replace(/\n/g, '<br>')}</p>
          `
        } else if (formType === 'about-you') {
          emailSubject = `New About You Submission from ${data.Email}`
          emailHtml = `
            <h2>New About You Submission</h2>
            <p><strong>Email:</strong> ${data.Email}</p>
            <h3>Responses:</h3>
            <ul>
              <li><strong>Go-to Beverage:</strong> ${data.Beverage}</li>
              <li><strong>Current Obsession:</strong> ${data['Current Obsession']}</li>
              <li><strong>Can't Live Without:</strong> ${data["Can't Live Without"]}</li>
              <li><strong>Non-Profit:</strong> ${data['Non-Profit']}</li>
              <li><strong>Favorite Meal in FW:</strong> ${data['Favorite Meal FW']}</li>
              <li><strong>Favorite Bar/Venue in FW:</strong> ${data['Favorite Bar FW']}</li>
              <li><strong>What Love About Job:</strong> ${data['What Love About Job']}</li>
              <li><strong>Interesting Fact:</strong> ${data['Interesting Fact']}</li>
              <li><strong>Enneagram Type:</strong> ${data.Enneagram}</li>
            </ul>
          `
        }

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: 'brian@6thavehomes.com',
          subject: emailSubject,
          html: emailHtml,
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails
      }
    }

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
