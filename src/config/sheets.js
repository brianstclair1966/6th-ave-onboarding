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
    agentProgress: 'Agent Progress!A:P',
    emergencyContact: 'Emergency Contact!A:Z',
    bioSubmissions: 'Bio Submissions!A:Z',
    aboutYouSubmissions: 'About You Submissions!A:Z',
  },
}

export default GOOGLE_SHEETS_CONFIG
