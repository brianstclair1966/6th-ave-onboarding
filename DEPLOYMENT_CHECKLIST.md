# Deployment Checklist

Complete this checklist before deploying the form integration system to production.

## Pre-Deployment Testing (Local)

### Setup & Installation
- [ ] Run `npm install` to install googleapis dependency
- [ ] Create `.env.local` with `GOOGLE_SHEETS_CREDENTIALS`
- [ ] Verify Google Sheet ID is correct: `1o2r9VD_Ee0V4rVlZAzkfJeHANoQ1MBuX7BDbMhgUZSU`
- [ ] Confirm Google service account has edit access to the sheet

### Component Testing
- [ ] Test AgentInfoForm in incognito/private window
  - [ ] Form validates required fields
  - [ ] Data stores in localStorage
  - [ ] Success message displays
  - [ ] Form hides on refresh
- [ ] Test EmergencyContactForm
  - [ ] Validates all required fields
  - [ ] Fetches agent info from localStorage correctly
  - [ ] Form submits without errors
  - [ ] Data appears in "Emergency Contact" sheet within 5 seconds
- [ ] Test AboutYouForm
  - [ ] Validates all required fields
  - [ ] Fetches agent email from localStorage
  - [ ] Form submits without errors
  - [ ] Data appears in "All About You" sheet within 5 seconds
- [ ] Test Checkpoint component
  - [ ] Checkbox can be clicked
  - [ ] Shows "Saving..." state while logging
  - [ ] Shows "✓ Saved" confirmation
  - [ ] Data appears in "Agent Progress" sheet with correct checkpoint column
  - [ ] Checkpoint marks with "X" for checked agent
  - [ ] Unchecks if logging fails

### API Endpoint Testing
- [ ] POST to `/api/log-checkpoint` with valid data returns success
- [ ] POST to `/api/log-checkpoint` with missing field returns 400 error
- [ ] POST to `/api/submit-form` with formType 'emergency-contact' appends to correct sheet
- [ ] POST to `/api/submit-form` with formType 'about-you' appends to correct sheet
- [ ] POST to `/api/submit-form` with invalid formType returns 400 error

### Google Sheets Verification
- [ ] "Agent Progress" sheet exists with correct columns
  - [ ] Timestamp, First Name, Last Name, Email columns
  - [ ] Checkpoint columns (Page 1, Page 2, etc.)
- [ ] "Emergency Contact" sheet exists with all expected columns
  - [ ] Email, TREC License #, License Expiry, Cell Phone, Birthday, etc.
- [ ] "All About You" sheet exists with all expected columns
  - [ ] Email, Beverage, Current Obsession, Can't Live Without, etc.
- [ ] Service account email added to sheet with Editor role

### Full Flow Testing
- [ ] Complete entire flow: Profile → Emergency → About You → Checkpoints
- [ ] Verify all data appears in Google Sheets
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile (responsive design)
- [ ] Test with slow network (check loading states)
- [ ] Test offline then reconnect (localStorage persistence)

### Error Handling
- [ ] Disconnect Google Sheets API, verify error message displays
- [ ] Test with invalid email format, verify client-side validation
- [ ] Test with missing required fields, verify validation errors
- [ ] Test network timeout, verify appropriate error message

### Browser Console
- [ ] No JavaScript errors in console
- [ ] No CORS errors
- [ ] No missing file 404 errors
- [ ] No Google API authentication errors

## Vercel Deployment

### Pre-Deployment Checks
- [ ] All code committed to git
- [ ] No console.log statements left in production code
- [ ] FORM_INTEGRATION_GUIDE.md up to date
- [ ] IMPLEMENTATION_EXAMPLES.md matches your actual pages
- [ ] package.json includes googleapis dependency

### Environment Variables
- [ ] Add `GOOGLE_SHEETS_CREDENTIALS` to Vercel project settings
  - [ ] Settings > Environment Variables
  - [ ] Paste full JSON string
  - [ ] Select all environments (Production, Preview, Development)
- [ ] Verify no other secrets are exposed in code

### Build & Deployment
- [ ] Run `npm run build` locally - should complete without errors
- [ ] Push code to main/master branch
- [ ] Trigger Vercel deployment
- [ ] Monitor build logs for errors
- [ ] Deployment completes successfully
- [ ] Verify deployment URL works

### Post-Deployment Testing

#### Quick Smoke Test
- [ ] Navigate to live site
- [ ] Fill out AgentInfoForm - data saves
- [ ] Submit EmergencyContactForm - appears in sheet
- [ ] Submit AboutYouForm - appears in sheet
- [ ] Click Checkpoint - data logs to sheet
- [ ] Check Google Sheet for all submissions

#### Full End-to-End Testing
- [ ] Test on production URL with fresh browser session
- [ ] Complete all 3 form pages in order
- [ ] Verify all checkpoints work
- [ ] Check Google Sheets for all data
- [ ] Test on multiple browsers/devices
- [ ] Verify loading states and error handling

#### Monitoring
- [ ] Check Vercel logs for any runtime errors
- [ ] Monitor API response times
- [ ] Check for any 500 errors
- [ ] Verify CORS headers are correct

### Backup & Safety

Before deploying to production with real users:
- [ ] Backup existing Google Sheet (File > Manage versions)
- [ ] Test with dummy data first
- [ ] Have rollback plan ready
- [ ] Keep `.env.local` file backed up securely
- [ ] Document the Google Sheets URL and sheet names

## Pages Integration

### Update All Pages Using Forms
- [ ] Page 1: Import and add AgentInfoForm component
- [ ] Page 1: Add checkpoints for Page 1 objectives
- [ ] Page 2: Import and add EmergencyContactForm component
- [ ] Page 2: Add checkpoints for Page 2 objectives
- [ ] Page 3: Import and add AboutYouForm component
- [ ] Page 3: Add checkpoints for Page 3 objectives
- [ ] Pages 4-8: Add Checkpoint components as appropriate
- [ ] Verify all pages load without errors

### Styling & UX
- [ ] Forms match brand colors (navy, coral, taupe, cream)
- [ ] Forms are responsive on mobile
- [ ] Form fields have appropriate spacing
- [ ] Error messages are visible and helpful
- [ ] Success messages provide clear feedback
- [ ] Checkpoints align with page layout
- [ ] Loading states are visible to users

## Security Checklist

- [ ] No credentials in code (only in .env.local)
- [ ] No console.logs with sensitive data
- [ ] No plaintext passwords or keys
- [ ] Email validation on both client and server
- [ ] Form data validated before sending to API
- [ ] API endpoints validate all input
- [ ] Service account permissions are minimal
- [ ] Google Sheet is not shared publicly

## Documentation

- [ ] QUICK_START.md reviewed and accurate
- [ ] FORM_INTEGRATION_GUIDE.md complete
- [ ] IMPLEMENTATION_EXAMPLES.md matches your pages
- [ ] DEPLOYMENT_CHECKLIST.md (this file) reviewed
- [ ] Team notified of new form system
- [ ] Onboarding instructions updated for agents

## Post-Launch Monitoring

### First Week
- [ ] Monitor Vercel logs daily
- [ ] Check Google Sheets for submissions
- [ ] Verify checkpoint data is logging correctly
- [ ] Address any user issues immediately
- [ ] Monitor API response times

### Ongoing
- [ ] Monthly check of Google Sheets data
- [ ] Review any error patterns
- [ ] Test forms monthly to ensure they still work
- [ ] Update documentation if anything changes
- [ ] Monitor Google API usage/quotas

## Rollback Plan

If something goes wrong:

1. **Immediate**: Revert Vercel deployment to previous version
2. **Communication**: Notify team of issue
3. **Investigation**: Check logs and error messages
4. **Testing**: Fix issue locally and test thoroughly
5. **Redeploy**: Push corrected code to Vercel
6. **Verification**: Verify fix works on production

### Rollback Command
```bash
# In Vercel dashboard: Settings > Git > Deployment History
# Click the previous working deployment and select "Redeploy"
```

## Success Criteria

Form integration is ready for production when:
- [ ] All tests pass locally and on Vercel
- [ ] No console errors in production
- [ ] All data correctly saves to Google Sheets
- [ ] Checkpoints log correctly with agent info
- [ ] Forms validate properly
- [ ] Error handling works as expected
- [ ] Documentation is complete
- [ ] Team understands the system

## Sign-Off

- [ ] Technical review: _____________________ Date: _______
- [ ] Team lead approval: __________________ Date: _______
- [ ] Ready for agent testing: _____________ Date: _______

---

## Contact & Support

If you encounter issues:

1. Check FORM_INTEGRATION_GUIDE.md for troubleshooting
2. Review Vercel logs for errors
3. Check browser DevTools console
4. Verify Google Sheet credentials
5. Test with fresh browser session (incognito)
6. Reach out to the development team
