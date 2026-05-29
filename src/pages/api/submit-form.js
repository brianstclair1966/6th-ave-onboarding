import { google } from 'googleapis'

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

const FORM_TYPE_SHEETS = {
  'emergency-contact': 'Emergency Contact',
  'about-you': 'All About You',
}

const FORM_FIELD_ORDER = {
  'emergency-contact': [
    'Email',
    'TREC License #',
    'License Expiry',
    'Cell Phone',
    'Birthday',
    'Home Address City',
    'Home Address Zip',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Email',
    'Location Access',
  ],
  'about-you': [
    'Email',
    'Beverage',
    'Current Obsession',
    "Can't Live Without",
    'Non-Profit',
    'Favorite Meal FW',
    'Favorite Bar FW',
    'What Love About Job',
    'Interesting Fact',
    'Enneagram',
  ],
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { formType, data } = req.body

    // Validate formType
    if (!formType || !FORM_TYPE_SHEETS[formType]) {
      return res.status(400).json({
        error: 'Invalid formType. Must be "emergency-contact" or "about-you"'
      })
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid data object' })
    }

    const sheets = await getGoogleSheetsClient()
    const sheetId = '1o2r9VD_Ee0V4rVlZAzkfJeHANoQ1MBuX7BDbMhgUZSU'
    const sheetName = FORM_TYPE_SHEETS[formType]
    const fieldOrder = FORM_FIELD_ORDER[formType]

    // Get header row to validate columns
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    })

    const headers = headerResponse.data.values[0] || []

    // Build row data in the correct order
    const rowData = fieldOrder.map(field => {
      return data[field] !== undefined ? String(data[field]) : ''
    })

    // Append the row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData],
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Form submission error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to submit form'
    })
  }
}
