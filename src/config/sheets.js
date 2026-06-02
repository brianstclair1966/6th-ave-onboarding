// Google Sheets Configuration
// This file contains the public Sheets configuration that can be safely committed to the repo

export const GOOGLE_SHEETS_CONFIG = {
  // Spreadsheet ID for the Onboarding Results sheet
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1o2r9VD_Ee0V4rVlZAzkfJeHANoQ1MBuX7BDbMhgUZSU',

  // Sheet names for the different submission types
  sheets: {
    agentProgress: 'Agent Progress',
    emergencyContact: 'Emergency Contact',
    bioSubmissions: 'Bio Submissions',
    aboutYouSubmissions: 'About You Submissions',
  },

  // Column ranges
  ranges: {
    agentProgress: 'Agent Progress!A:AG',
    emergencyContact: 'Emergency Contact!A:Z',
    bioSubmissions: 'Bio Submissions!A:Z',
    aboutYouSubmissions: 'About You Submissions!A:Z',
  },
}

export default GOOGLE_SHEETS_CONFIG

/**
 * CANONICAL Agent Progress schema — the single source of truth.
 *
 * Every column corresponds to exactly one real, trackable event from the
 * onboarding flow (a checkbox, a form submission, or registration). The array
 * index IS the 0-based column index (0 = A, 4 = E, 30 = AE, ...).
 *
 * IMPORTANT: The logging APIs resolve columns BY HEADER NAME against the live
 * sheet, not by hardcoded position. So you can safely reorder this list (or the
 * sheet's columns) without breaking logging, as long as the header strings here
 * stay in sync with the header text written by register-agent.js.
 */
export const AGENT_PROGRESS_COLUMNS = [
  'Timestamp',            // A  (0)
  'First Name',           // B  (1)
  'Last Name',            // C  (2)
  'Email',                // D  (3)
  'Welcome',              // E  (4)  set on registration (page 1)
  'EC-Form',              // F  (5)  page 2 Emergency Contact form
  'TREC',                 // G  (6)  page 2 checkbox
  'GFWAR',                // H  (7)  page 2 checkbox (Realtor Assoc / MLS)
  'IC-Agree',             // I  (8)  page 3 checkbox (ICA)
  'Bio',                  // J  (9)  page 3 Bio form
  'About-You',            // K  (10) page 3 About You form
  'Profiles',             // L  (11) page 3 checkbox (updated online profiles)
  'IABS',                 // M  (12) page 4 checkbox
  'Rechat',               // N  (13) page 4 checkbox
  'Realscout',            // O  (14) page 4 checkbox
  'Resources',            // P  (15) page 5 checkbox (aware of backsite resources)
  'Mastermind',           // Q  (16) page 6 checkbox (knows weekly Mastermind meeting)
  'Slack',                // R  (17) page 6 checkbox (explore Slack)
  'Connections',          // S  (18) page 6 checkbox (20 people from sphere)
  'Review',               // T  (19) page 6 checkbox (read page again)
  'Early Communication',  // U  (20) page 7 checkbox
  'Mentorship',           // V  (21) page 7 checkbox
  'Support Request',      // W  (22) page 7 checkbox (ask for support)
  'Ask Questions',        // X  (23) page 7 checkbox
  'Support Differs',      // Y  (24) page 7 checkbox
  'Certainty',            // Z  (25) page 8 checkbox (clients borrow certainty)
  'Consistency',          // AA (26) page 8 checkbox
  'Judgment',             // AB (27) page 8 checkbox
  'Systems',              // AC (28) page 8 checkbox
  'Reputation',           // AD (29) page 8 checkbox
  'Principles',           // AE (30) page 8 checkbox
  'Culture Index',        // AF (31) page 3 checkbox (Culture Index survey)
  'Business Card',        // AG (32) page 3 single-select (which card design to order)
]

// 0-based column index of the Welcome column, set at registration time.
export const WELCOME_COLUMN_INDEX = AGENT_PROGRESS_COLUMNS.indexOf('Welcome')

/** Convert a 0-based column index to an A1 column letter (0->A, 26->AA, 30->AE). */
export function columnIndexToLetter(index) {
  let letter = ''
  let n = index
  while (n >= 0) {
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

/** A1 letter of the last canonical column (e.g. "AE"). */
export function lastColumnLetter() {
  return columnIndexToLetter(AGENT_PROGRESS_COLUMNS.length - 1)
}

/**
 * Map a checkpoint label (the full checkbox text sent from the frontend) to the
 * canonical column HEADER NAME it should mark, or null if the checkbox is an
 * operational / honor-system item that we deliberately do NOT track.
 *
 * Patterns are intentionally specific so that operational checkboxes and
 * lookalike words (e.g. "communiCAtion" contains "ica") never collide with a
 * tracked column. Order matters: more specific rules come first.
 */
export function getCheckpointTargetHeader(checkpointLabel) {
  if (!checkpointLabel) return null
  const n = String(checkpointLabel).toLowerCase().trim()

  // --- Page 2 ---
  if (n.includes('trec')) return 'TREC'
  if (n.includes('mls') || n.includes('realtor association') ||
      (n.includes('association') && n.includes('completed'))) return 'GFWAR'

  // --- Page 3 ---
  // "ica" also appears inside "communication", so require an ICA-specific cue.
  if (n.includes('ica') && (n.includes('email') || n.includes('sign'))) return 'IC-Agree'
  if (n.includes('profiles')) return 'Profiles'
  if (n.includes('culture index')) return 'Culture Index'

  // --- Page 4 ---
  if (n.includes('iabs')) return 'IABS'
  if (n.includes('rechat')) return 'Rechat'
  if (n.includes('realscout')) return 'Realscout'

  // --- Page 5 ---
  // New label "I am aware of the resources on the 6th Ave backsite" also
  // contains "backsite", so this MUST stay above the Page 6 backsite rule.
  if (n.includes('aware') && n.includes('resources')) return 'Resources'

  // --- Page 6 ---
  if (n.includes('mastermind')) return 'Mastermind'
  if (n.includes('slack') && n.includes('exploring')) return 'Slack'
  if (n.includes('20 people') || (n.includes('people') && n.includes('sphere'))) return 'Connections'
  if (n.includes('this page') && n.includes('first week')) return 'Review'

  // --- Page 7 ---
  if (n.includes('early communication')) return 'Early Communication'
  if (n.includes('mentorship') && (n.includes('transaction') || n.includes('model'))) return 'Mentorship'
  if (n.includes('ask for support')) return 'Support Request'
  if (n.includes('asking questions')) return 'Ask Questions'
  if (n.includes('support') && n.includes('differs')) return 'Support Differs'

  // --- Page 8 ---
  if (n.includes('borrow certainty') || (n.includes('clients') && n.includes('certainty'))) return 'Certainty'
  if (n.includes('consistency') && n.includes('intensity')) return 'Consistency'
  if ((n.includes('judgment') || n.includes('judgement')) && n.includes('information')) return 'Judgment'
  if (n.includes('systems') && n.includes('protect')) return 'Systems'
  if (n.includes('reputation') && n.includes('moment')) return 'Reputation'
  if (n.includes('6 principles') || (n.includes('principles') && n.includes('6th ave'))) return 'Principles'

  // Operational / untracked checkbox — do not write anything.
  return null
}

/**
 * Resolve a canonical header NAME to a 0-based column index using the live
 * header row read from the sheet (case/space-insensitive). Falls back to the
 * canonical schema position if the header isn't found in the live row.
 * Returns -1 if it can't be resolved at all.
 */
export function resolveColumnIndex(headerName, liveHeaderRow) {
  if (!headerName) return -1
  const target = headerName.toLowerCase().trim()
  if (Array.isArray(liveHeaderRow)) {
    for (let i = 0; i < liveHeaderRow.length; i++) {
      const h = liveHeaderRow[i]
      if (h != null && String(h).toLowerCase().trim() === target) return i
    }
  }
  return AGENT_PROGRESS_COLUMNS.findIndex(
    (c) => c.toLowerCase().trim() === target
  )
}
