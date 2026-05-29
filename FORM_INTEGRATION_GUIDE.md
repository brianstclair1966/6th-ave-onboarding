# Form Integration System - Developer Guide

## Overview

This guide explains how to use the form components and API endpoints in the 6th Ave onboarding system. The system consists of:

1. **API Endpoints** for Google Sheets integration
2. **React Components** for form UI and checkpoint logging
3. **localStorage Integration** for agent data persistence

## Setup

### 1. Environment Configuration

Add your Google Sheets credentials to your `.env.local` file:

```bash
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

The credentials should be a service account JSON file from Google Cloud. The string must be properly escaped as JSON.

### 2. Install Dependencies

The required `googleapis` package is already in `package.json`:

```bash
npm install
```

### 3. Google Sheets Setup

Ensure your Google Sheet has the following sheets:
- **Agent Progress** - For tracking checkpoint completions
- **Emergency Contact** - For emergency contact form submissions
- **All About You** - For personal info form submissions

Each sheet should have columns matching the expected data structure (see API documentation below).

## API Endpoints

### POST /api/log-checkpoint

Logs when an agent completes a checkpoint.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "checkpointLabel": "Page 1"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "error": "Missing required fields: firstName, lastName, email, checkpointLabel"
}
```

**Behavior:**
- If the agent doesn't exist in the sheet, creates a new row with all their info
- If the agent exists, updates their row to mark the checkpoint as complete
- Checkpoints are marked with an "X" in their respective column

### POST /api/submit-form

Submits form data to the appropriate Google Sheet.

**Request:**
```json
{
  "formType": "emergency-contact",
  "data": {
    "Email": "john@example.com",
    "TREC License #": "123456",
    "License Expiry": "2026-12-31",
    "Cell Phone": "555-1234",
    "Birthday": "1990-01-15",
    "Home Address City": "Dallas",
    "Home Address Zip": "75201",
    "Emergency Contact Name": "Jane Doe",
    "Emergency Contact Phone": "555-5678",
    "Emergency Contact Email": "jane@example.com",
    "Location Access": "Yes"
  }
}
```

**Valid formTypes:**
- `"emergency-contact"` - Appends to "Emergency Contact" sheet
- `"about-you"` - Appends to "All About You" sheet

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "error": "Invalid formType. Must be 'emergency-contact' or 'about-you'"
}
```

## React Components

### AgentInfoForm

Collects initial agent information (name and email) on Page 1. Stores data in localStorage.

**Usage:**
```jsx
import AgentInfoForm from '@/components/AgentInfoForm'

export default function Page1() {
  return (
    <div>
      <h1>Welcome!</h1>
      <AgentInfoForm />
    </div>
  )
}
```

**Features:**
- Validates email format and required fields
- Stores agent info in `localStorage['agentInfo']` as JSON
- Shows success message on submission
- Hides form if agent info already exists
- Responsive design with error messages

**localStorage Format:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

### EmergencyContactForm

Collects emergency contact information on Page 2.

**Usage:**
```jsx
import EmergencyContactForm from '@/components/EmergencyContactForm'

export default function Page2() {
  return (
    <div>
      <h1>Emergency Contact</h1>
      <EmergencyContactForm />
    </div>
  )
}
```

**Features:**
- Validates all required fields
- Automatically uses agent email from localStorage
- Submits to `/api/submit-form` with formType: 'emergency-contact'
- Shows loading state during submission
- Handles errors gracefully
- Groups fields into logical sections

**Fields:**
- TREC License #
- License Expiry (date)
- Cell Phone
- Birthday (date)
- Home Address City
- Home Address Zip
- Emergency Contact Name
- Emergency Contact Phone
- Emergency Contact Email
- Location Access (checkbox)

### AboutYouForm

Collects personal information on Page 3.

**Usage:**
```jsx
import AboutYouForm from '@/components/AboutYouForm'

export default function Page3() {
  return (
    <div>
      <h1>All About You</h1>
      <AboutYouForm />
    </div>
  )
}
```

**Features:**
- Validates all required fields
- Automatically uses agent email from localStorage
- Submits to `/api/submit-form` with formType: 'about-you'
- Shows loading state during submission
- Handles errors gracefully
- Text and textarea inputs for longer responses

**Fields:**
- Beverage (favorite drink)
- Current Obsession
- Can't Live Without
- Non-Profit (to support)
- Favorite Meal FW (Fort Worth)
- Favorite Bar FW (Fort Worth)
- What Love About Job (textarea)
- Interesting Fact (textarea)
- Enneagram Type

### Checkpoint

Simple checkbox component that logs completions to Google Sheets.

**Usage:**
```jsx
import Checkpoint from '@/components/Checkpoint'

export default function Page1() {
  return (
    <div>
      <h1>Page 1: Get Started</h1>
      <Checkpoint label="I've reviewed the onboarding overview" checkpointName="Page 1" />
      <Checkpoint label="I've watched the welcome video" checkpointName="Page 1" />
    </div>
  )
}
```

**Props:**
- `label` (required): String to display next to checkbox
- `checkpointName` (required): Column name in Google Sheets (e.g., "Page 1", "Page 2")
- `disabled` (optional, default: false): Whether checkbox is disabled

**Features:**
- Auto-logs completion when checked
- Shows "Saving..." while logging
- Shows "✓ Saved" confirmation
- Shows error message if logging fails
- Automatically unchecks if logging fails
- Disabled if agent info not found in localStorage
- Uses `accent-brand-coral` for styling

### CheckpointLogger (Advanced)

Hook-based component for more control over checkpoint logging.

**Usage with Hook:**
```jsx
import { useCheckpointLogger } from '@/components/CheckpointLogger'

export default function CustomCheckpoint() {
  const { logCheckpoint, isLogging, agentInfo } = useCheckpointLogger('Page 1')

  const handleClick = async () => {
    const success = await logCheckpoint()
    if (success) {
      console.log('Checkpoint logged!')
    }
  }

  return (
    <button onClick={handleClick} disabled={!agentInfo || isLogging}>
      Mark as Complete
    </button>
  )
}
```

**Hook Return Value:**
```javascript
{
  logCheckpoint: async () => boolean,  // Returns true if successful
  isLoading: boolean,                  // True while logging
  agentInfo: { firstName, lastName, email } | null  // Agent data from localStorage
}
```

## Integration Examples

### Example: Page 1 - Agent Onboarding

```jsx
import Page from '@/components/Page'
import AgentInfoForm from '@/components/AgentInfoForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page1() {
  return (
    <Page pageNumber={1} sectionTitle="Agent Onboarding">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-navy mb-8">Welcome to 6th Ave!</h1>
        
        <AgentInfoForm />
        
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-brand-navy">Learning Checkpoints</h2>
          <Checkpoint label="I've completed my profile" checkpointName="Page 1" />
          <Checkpoint label="I understand the onboarding process" checkpointName="Page 1" />
        </div>
      </div>
    </Page>
  )
}
```

### Example: Page 2 - Emergency Contact

```jsx
import Page from '@/components/Page'
import EmergencyContactForm from '@/components/EmergencyContactForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page2() {
  return (
    <Page pageNumber={2} sectionTitle="Emergency Information">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-navy mb-8">Emergency Contact</h1>
        
        <EmergencyContactForm />
        
        <div className="mt-8">
          <Checkpoint label="I've provided emergency contact information" checkpointName="Page 2" />
        </div>
      </div>
    </Page>
  )
}
```

### Example: Page 3 - About You

```jsx
import Page from '@/components/Page'
import AboutYouForm from '@/components/AboutYouForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page3() {
  return (
    <Page pageNumber={3} sectionTitle="Get to Know You">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-navy mb-8">All About You</h1>
        
        <AboutYouForm />
        
        <div className="mt-8">
          <Checkpoint label="I've shared my personal information" checkpointName="Page 3" />
        </div>
      </div>
    </Page>
  )
}
```

## Data Flow

### Agent Registration Flow

```
1. User fills AgentInfoForm on Page 1
2. Data stored in localStorage['agentInfo']
3. User can proceed to other pages
4. All forms and checkpoints use this data
```

### Form Submission Flow

```
1. User fills form (EmergencyContactForm, AboutYouForm, etc.)
2. Form validates all required fields
3. On submit, form retrieves agent email from localStorage
4. POST request sent to /api/submit-form
5. API appends row to appropriate Google Sheet
6. Success message displayed to user
7. Form resets for potential next entry
```

### Checkpoint Logging Flow

```
1. User checks a Checkpoint box
2. Component retrieves agent info from localStorage
3. POST request sent to /api/log-checkpoint
4. API either:
   a. Creates new row if agent doesn't exist
   b. Updates existing row to mark checkpoint
5. Checkbox shows "✓ Saved" confirmation
```

## Troubleshooting

### Forms Not Submitting

1. **Check agent info**: Ensure `AgentInfoForm` has been completed on Page 1
2. **Check localStorage**: Open DevTools > Application > localStorage to verify `agentInfo` exists
3. **Check Google credentials**: Verify `GOOGLE_SHEETS_CREDENTIALS` env var is set correctly
4. **Check Sheet ID**: Verify the sheet ID in API endpoints matches your Google Sheet

### Checkpoints Not Logging

1. **Agent info missing**: User must complete `AgentInfoForm` first
2. **Network error**: Check browser console for fetch errors
3. **Sheet columns**: Ensure the checkpoint column exists in the "Agent Progress" sheet
4. **Service account permissions**: Verify the service account has edit access to the sheet

### localStorage Issues

1. **Private browsing**: localStorage may be disabled in private/incognito mode
2. **Different domains**: localStorage is domain-specific
3. **Clear data**: Test by opening in new incognito window to rule out stale data

## Best Practices

1. **Always use AgentInfoForm first**: All other components depend on agent data in localStorage
2. **Test in incognito mode**: Ensures clean localStorage for testing
3. **Use meaningful checkpoint names**: Column names should match actual page/section names
4. **Handle network errors**: Users may have connectivity issues - show appropriate feedback
5. **Validate on client**: Reduce server load by validating required fields before submission
6. **Log errors**: Monitor API errors to catch Google Sheets API issues early

## Security Notes

- **Never expose credentials**: Keep `GOOGLE_SHEETS_CREDENTIALS` in `.env.local` only
- **Validate server-side**: All API endpoints validate input before writing to sheets
- **Email validation**: Client validates email format, server validates structure
- **Service account**: Use a dedicated service account with minimal permissions

## Performance Considerations

- **localStorage limits**: Typical limit is 5-10MB - our data is small
- **Network requests**: Each form submission and checkpoint requires a network call
- **Sheet API limits**: Google Sheets API has rate limits - consider caching if needed
- **Batch operations**: For bulk imports, consider direct Google Sheets API calls

## Future Enhancements

- Offline mode with sync when connectivity returns
- Automatic form autosave to avoid data loss
- Progress persistence across sessions
- PDF export of completed forms
- Admin dashboard for reviewing submissions
- Email confirmations for form submissions
