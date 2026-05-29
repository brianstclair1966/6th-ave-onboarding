# Quick Start - Form Integration

## Files Created

### API Endpoints
- `/src/pages/api/log-checkpoint.js` - Logs checkpoint completions
- `/src/pages/api/submit-form.js` - Submits form data to Google Sheets

### Components
- `/src/components/AgentInfoForm.jsx` - Initial agent registration (Page 1)
- `/src/components/EmergencyContactForm.jsx` - Emergency contact collection (Page 2)
- `/src/components/AboutYouForm.jsx` - Personal info collection (Page 3)
- `/src/components/Checkpoint.jsx` - Simple checkpoint logger
- `/src/components/CheckpointLogger.jsx` - Advanced checkpoint hook

### Documentation
- `FORM_INTEGRATION_GUIDE.md` - Complete developer guide

## Setup in 3 Steps

### Step 1: Set Environment Variable

Add to `.env.local`:
```
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

Get credentials from Google Cloud Console service account.

### Step 2: Update Package

```bash
npm install
```

(googleapis already added to package.json)

### Step 3: Add Components to Pages

**Page 1 (Get Started):**
```jsx
import AgentInfoForm from '@/components/AgentInfoForm'
import Checkpoint from '@/components/Checkpoint'

<AgentInfoForm />
<Checkpoint label="I've completed my profile" checkpointName="Page 1" />
```

**Page 2 (Emergency Info):**
```jsx
import EmergencyContactForm from '@/components/EmergencyContactForm'
import Checkpoint from '@/components/Checkpoint'

<EmergencyContactForm />
<Checkpoint label="Emergency info saved" checkpointName="Page 2" />
```

**Page 3 (About You):**
```jsx
import AboutYouForm from '@/components/AboutYouForm'
import Checkpoint from '@/components/Checkpoint'

<AboutYouForm />
<Checkpoint label="Profile completed" checkpointName="Page 3" />
```

## Testing

### Test Without Backend (Local Only)

Components work standalone - AgentInfoForm stores data in localStorage without needing the API.

### Test With Backend

1. Verify `.env.local` has credentials
2. Check Google Sheet exists and is accessible
3. Submit a form - should appear in the corresponding sheet

### Common Issues

| Issue | Solution |
|-------|----------|
| Forms not sending | Check DevTools console for errors |
| Checkpoints not saving | Ensure AgentInfoForm completed first |
| "Missing credentials" error | Verify GOOGLE_SHEETS_CREDENTIALS in .env.local |
| Data not in sheet | Check sheet tab name matches API (exact case) |

## File Locations

All new files in:
- `/src/pages/api/` - API endpoints
- `/src/components/` - React components

## Next Steps

1. Test locally with incognito browser window
2. Deploy to Vercel (env vars auto-loaded)
3. Monitor first agents through the flow
4. Check Google Sheets for submissions
5. Iterate on form fields based on feedback

## Support

See `FORM_INTEGRATION_GUIDE.md` for:
- Detailed API documentation
- Component prop reference
- Integration examples
- Troubleshooting guide
- Best practices
