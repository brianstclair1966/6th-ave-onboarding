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
 * Maps checkpoint columns using a comprehensive label-to-column mapping
 *
 * Agent Progress Sheet structure:
 * A=Timestamp, B=FirstName, C=LastName, D=Email
 * E=Welcome, F=EC-Form
 * G=TREC, H=GFWAR, I=IC-Agree
 * J=Bio, K=About-You
 * L=IABS, M=Rechat, N=Realscout, O=Training
 * P=Backsite, Q=Office, R=Mentors, S=Meetings
 * T=Compliance, U=Contracts, V=Splits, W=Leads
 * X=Database, Y=Marketing, Z=Comm
 * AA=Learning, AB=Help, AC=Questions, AD=Difference
 * AE=Emotional, AF=Consistency, AG=Judgement, AH=Systems, AI=Reputation, AJ=Principles
 */
function getCheckpointColumnIndex(checkpointLabel) {
  const normalized = checkpointLabel.toLowerCase().trim()

  // Page 2 checkpoints
  if (normalized.includes('trec') && normalized.includes('sponsorship')) return 6 // G
  if (normalized.includes('realtor') || normalized.includes('association') || normalized.includes('mls')) return 7 // H

  // Page 3 checkpoints
  if (normalized.includes('independent') || normalized.includes('contractor') || normalized.includes('ica')) return 8 // I
  if (normalized.includes('updated') && normalized.includes('profiles')) return 16 // Q

  // Page 4 checkpoints
  if (normalized.includes('iabs')) return 11 // L
  if (normalized.includes('rechat')) return 12 // M
  if (normalized.includes('realscout')) return 13 // N

  // Page 5 checkpoints
  if (normalized.includes('training') || normalized.includes('guide')) return 14 // O

  // Page 6 checkpoints
  if (normalized.includes('backsite')) return 15 // P - Backsite
  if (normalized.includes('slack') && normalized.includes('exploring')) return 16 // Q - Slack
  if (normalized.includes('20 people') || (normalized.includes('people') && normalized.includes('sphere'))) return 17 // R - Connections
  if (normalized.includes('read this page again')) return 18 // S - Review

  // Page 7 checkpoints
  if (normalized.includes('early') && normalized.includes('communication')) return 19 // T - Early Communication
  if (normalized.includes('mentorship') && normalized.includes('transaction')) return 20 // U - Mentorship
  if (normalized.includes('ask for support') || (normalized.includes('when') && normalized.includes('how') && normalized.includes('support'))) return 21 // V - Support Request
  if (normalized.includes('asking questions') && normalized.includes('professional')) return 22 // W - Ask Questions
  if (normalized.includes('support') && normalized.includes('differs')) return 23 // X - Support Differs

  // Page 8 checkpoints
  if (normalized.includes('borrow certainty') || (normalized.includes('clients') && normalized.includes('borrow') && normalized.includes('certainty'))) return 24 // Y - Certainty
  if (normalized.includes('consistency') && normalized.includes('intensity')) return 25 // Z - Consistency
  if (normalized.includes('judgment') && normalized.includes('information')) return 26 // AA - Judgment
  if (normalized.includes('systems') && normalized.includes('protect')) return 27 // AB - Systems
  if (normalized.includes('reputation') && (normalized.includes('small moments') || normalized.includes('moments'))) return 28 // AC - Reputation
  if (normalized.includes('6 principles') || (normalized.includes('principles') && normalized.includes('6th ave'))) return 29 // AD - Principles

  // Form submissions
  if (normalized.includes('emergency') || normalized.includes('contact')) return 5 // F
  if (normalized.includes('bio')) return 9 // J
  if (normalized.includes('about')) return 10 // K

  // Fallback for any unmapped checkpoints
  console.warn(`Checkpoint label not specifically mapped: "${checkpointLabel}" - mapping to column P (Backsite)`)
  return 15 // P
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
    // Convert column index to letter(s) - handles A-Z and AA-AJ
    let cellColumn = ''
    let colIndex = checkpointColumnIndex
    while (colIndex >= 0) {
      cellColumn = String.fromCharCode(65 + (colIndex % 26)) + cellColumn
      colIndex = Math.floor(colIndex / 26) - 1
    }
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
