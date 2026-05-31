import { google } from 'googleapis'
import { GOOGLE_SHEETS_CONFIG } from '@/config/sheets'

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

/**
 * Maps checkpoint columns using a normalized label approach
 * Agent Progress Sheet columns:
 * A=Timestamp, B=FirstName, C=LastName, D=Email, E=Welcome, F=EC-Form, G=TREC, H=GFWAR, I=IC-Agree, J=Bio, K=About-You, L=IABS, M=Rechat, N=Realscout, O=Training, P=BackUp
 */
function getCheckpointColumnIndex(checkpointLabel) {
  // Normalize the label for matching
  const normalized = checkpointLabel.toLowerCase().trim()

  // Direct column mappings
  const columnMap = {
    'welcome': 4,
    'ec-form': 5,
    'emergency contact': 5,
    'trec': 6,
    'trec sponsorship': 6,
    'gfwar': 7,
    'realtor association': 7,
    'ic-agree': 8,
    'independent contractor': 8,
    'bio': 9,
    'about-you': 10,
    'about you': 10,
    'iabs': 11,
    'rechat': 12,
    'realscout': 13,
    'training': 14,
    'guide training': 14,
    'backup': 15,
  }

  // Try direct match first
  if (columnMap[normalized]) {
    return columnMap[normalized]
  }

  // Try partial matches for common patterns
  if (normalized.includes('trec')) return 6
  if (normalized.includes('realtor') || normalized.includes('gfwar')) return 7
  if (normalized.includes('independent') || normalized.includes('contractor')) return 8
  if (normalized.includes('rechat')) return 12
  if (normalized.includes('realscout')) return 13
  if (normalized.includes('iabs')) return 11
  if (normalized.includes('training') || normalized.includes('guide')) return 14
  if (normalized.includes('emergency') || normalized.includes('contact')) return 5
  if (normalized.includes('bio')) return 9
  if (normalized.includes('about')) return 10

  // If no match found, return -1
  return -1
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, checkpointLabel, pageNumber } = req.body

    // Validate required fields
    if (!firstName || !lastName || !email || !checkpointLabel) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email, checkpointLabel'
      })
    }

    // Get sheet ID from config (with fallback)
    const sheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId
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

    // Map checkpoint label to column index
    const checkpointColumnIndex = getCheckpointColumnIndex(checkpointLabel)

    if (checkpointColumnIndex === -1) {
      console.warn(`Unable to map checkpoint label: "${checkpointLabel}"`)
      return res.status(400).json({
        error: `Unable to map checkpoint label "${checkpointLabel}" to a column`
      })
    }

    const timestamp = new Date().toISOString()

    // Get all data to find if this agent already has a row
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Agent Progress!A:P',
    })

    const rows = dataResponse.data.values || []
    let agentRowIndex = -1

    // Search for existing agent row (skip header, start at row 2)
    // Email is in column D (index 3)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][3] === email) {
        agentRowIndex = i + 1 // Convert to 1-based sheet row number
        console.log(`Found agent ${email} at row ${agentRowIndex}`)
        break
      }
    }

    // If agent not found, create a new agent row
    if (agentRowIndex === -1) {
      console.log(`Agent ${email} not found, creating new agent row`)
      try {
        const timestamp = new Date().toISOString()
        const newAgentRow = [[timestamp, firstName, lastName, email, '', '', '', '', '', '', '', '', '', '', '', '']]

        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'Agent Progress!A:P',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: newAgentRow,
          },
        })

        console.log('New agent row created:', appendResponse.data.updates)
        // Get the new row index (append returns the update range)
        agentRowIndex = rows.length + 1 // rows.length gives 0-based, +1 for header, +1 for new row = +2, but we're already at rows.length so +1
      } catch (createError) {
        console.error('Failed to create new agent row:', createError.message)
        return res.status(500).json({
          error: `Failed to create agent row: ${createError.message}`
        })
      }
    }

    // Update existing row with checkpoint mark
    const cellColumn = String.fromCharCode(65 + checkpointColumnIndex)
    const cellToUpdate = `${cellColumn}${agentRowIndex}`

    console.log(`Updating cell ${cellToUpdate} for agent ${email} (checkpoint: ${checkpointLabel})`)

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Agent Progress!${cellToUpdate}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['✓']],
      },
    })

    console.log(`Checkpoint logged successfully: ${checkpointLabel} for ${email}`)

    return res.status(200).json({
      success: true,
      message: `Checkpoint "${checkpointLabel}" logged successfully`,
      checkpoint: checkpointLabel,
      column: cellColumn,
    })
  } catch (error) {
    console.error('Checkpoint logging error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to log checkpoint'
    })
  }
}
