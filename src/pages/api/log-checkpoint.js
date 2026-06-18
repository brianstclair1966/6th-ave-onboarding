import { google } from 'googleapis'
import {
  GOOGLE_SHEETS_CONFIG,
  AGENT_PROGRESS_COLUMNS,
  getCheckpointTargetHeader,
  resolveColumnIndex,
  columnIndexToLetter,
  lastColumnLetter,
} from '@/config/sheets'
import { sendMail } from '@/lib/mailer'

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// The W-9 and Credit Card Authorization forms are emailed by the agent directly
// to Rachel — that sensitive data never touches this app. When an agent checks
// one of those boxes, send Rachel a heads-up (name + which document only, no
// SSN/card data) so she can follow up if the agent's email doesn't arrive.
async function maybeNotifyRachel(label, firstName, lastName, email) {
  const l = String(label || '').toLowerCase()
  let doc = null
  if (/w-?9/.test(l)) doc = 'W-9'
  else if (/auto-?pay|resource-?fee|credit card/.test(l)) doc = 'Credit Card Authorization'
  if (!doc) return

  const agent = [firstName, lastName].filter(Boolean).join(' ') || email
  const note =
    doc === 'Credit Card Authorization'
      ? ' (Part-time agents check this box without sending a form, so this one may be N/A.)'
      : ''
  await sendMail({
    to: 'rachel@6thavehomes.com',
    replyTo: email || undefined,
    subject: `${doc} marked complete — ${agent}`,
    text:
      `${agent} (${email}) just marked their ${doc} step complete in onboarding and ` +
      `should be emailing the completed form to you.${note}\n\n` +
      `Automated heads-up only — no W-9, SSN, or card details are included here.`,
    html:
      `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px">` +
      `<h2 style="color:#043853;margin:0 0 8px">${doc} marked complete</h2>` +
      `<p style="color:#043853;margin:0 0 8px"><strong>${escapeHtml(agent)}</strong> ` +
      `(${escapeHtml(email)}) just marked their ${doc} step complete in onboarding and ` +
      `should be emailing the completed form to you.${note}</p>` +
      `<p style="color:#9aa3a7;font-size:12px;margin-top:16px">Automated heads-up only — ` +
      `no W-9, SSN, or card details are included here.</p></div>`,
  })
}

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

// Parse the 1-based row number out of an append updatedRange like
// "Agent Progress!A7:AE7" -> 7
function parseAppendedRowNumber(updatedRange) {
  if (!updatedRange) return -1
  const m = updatedRange.match(/![A-Z]+(\d+)/)
  return m ? parseInt(m[1], 10) : -1
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
        error: 'Missing required fields: firstName, lastName, email, checkpointLabel',
      })
    }

    // Notify Rachel about W-9 / Credit Card Authorization completions. Runs before
    // the sheet logic so it fires whether or not the checkbox maps to a column.
    // Best-effort: never blocks checkpoint logging.
    try {
      await maybeNotifyRachel(checkpointLabel, firstName, lastName, email)
    } catch (e) {
      console.error('Rachel notification failed:', e.message)
    }

    // Map the checkpoint label to a canonical column header. Operational /
    // honor-system checkboxes map to null and are intentionally NOT logged
    // (rather than being written to the wrong column).
    const targetHeader = getCheckpointTargetHeader(checkpointLabel)
    if (!targetHeader) {
      console.log(`Checkpoint not tracked (operational): "${checkpointLabel}"`)
      return res.status(200).json({
        success: true,
        tracked: false,
        message: 'Checkpoint acknowledged (not a tracked column)',
      })
    }

    const sheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId
    if (!sheetId) {
      console.warn('GOOGLE_SHEETS_ID not configured')
      return res.status(200).json({
        success: true,
        message: 'Checkpoint logged locally (Google Sheets ID not configured)',
      })
    }

    let sheets
    try {
      sheets = await getGoogleSheetsClient()
    } catch (authError) {
      console.warn('Google Sheets auth failed:', authError.message)
      return res.status(200).json({
        success: true,
        message: 'Checkpoint logged locally (Google Sheets credentials issue: ' + authError.message + ')',
      })
    }

    const lastCol = lastColumnLetter()

    // Read the live header row + all agent rows in one request.
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `Agent Progress!A:${lastCol}`,
    })

    const rows = dataResponse.data.values || []
    const headerRow = rows[0] || AGENT_PROGRESS_COLUMNS

    // Resolve the target column by HEADER NAME against the live sheet.
    const columnIndex = resolveColumnIndex(targetHeader, headerRow)
    if (columnIndex < 0) {
      console.warn(`Could not resolve column for header "${targetHeader}"`)
      return res.status(500).json({
        error: `Could not resolve a column for "${targetHeader}". ` +
          `Make sure the Agent Progress header row includes that column.`,
      })
    }

    // Find the agent's row by email (column D, index 3). Skip header (row 1).
    let agentRowNumber = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][3] === email) {
        agentRowNumber = i + 1 // 1-based sheet row
        break
      }
    }

    // If the agent isn't registered yet, create their row (Welcome included).
    if (agentRowNumber === -1) {
      const newRow = new Array(AGENT_PROGRESS_COLUMNS.length).fill('')
      newRow[0] = new Date().toISOString()
      newRow[1] = firstName
      newRow[2] = lastName
      newRow[3] = email
      const welcomeIdx = AGENT_PROGRESS_COLUMNS.indexOf('Welcome')
      if (welcomeIdx >= 0) newRow[welcomeIdx] = '✓'

      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `Agent Progress!A:${lastCol}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] },
      })

      agentRowNumber = parseAppendedRowNumber(appendResponse.data.updates?.updatedRange)
      if (agentRowNumber === -1) {
        // Fall back to appending after the last known row.
        agentRowNumber = rows.length + 1
      }
      console.log(`Created new agent row for ${email} at row ${agentRowNumber}`)
    }

    const cellColumn = columnIndexToLetter(columnIndex)
    const cellToUpdate = `Agent Progress!${cellColumn}${agentRowNumber}`

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellToUpdate,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['✓']] },
    })

    console.log(
      `Checkpoint logged: "${checkpointLabel}" -> ${targetHeader} (${cellColumn}${agentRowNumber}) for ${email}`
    )

    return res.status(200).json({
      success: true,
      tracked: true,
      message: `Checkpoint "${checkpointLabel}" logged successfully`,
      checkpoint: checkpointLabel,
      header: targetHeader,
      column: cellColumn,
      pageNumber: pageNumber ?? null,
    })
  } catch (error) {
    console.error('Checkpoint logging error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to log checkpoint',
    })
  }
}
