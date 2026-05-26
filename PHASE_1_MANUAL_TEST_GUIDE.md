# Phase 1 Manual Testing Guide

This guide walks you through testing Phase 1 (State Management & Hydration) of the engagement pass implementation.

## Prerequisites

- Project running locally with `npm run dev`
- Browser open to `http://localhost:3000`
- Browser DevTools open (F12 or Cmd+Option+I)

---

## Test 1: Checkpoint Persistence (Page 3)

### Setup
1. Navigate to `http://localhost:3000/page/3`
2. Open DevTools Console

### Steps
1. **Check a checkbox**
   - Click the first checkbox: "Submitted your bio to brian@6thavehomes.com"
   - Observe it visually checks (input is marked)

2. **Verify localStorage**
   - In DevTools Console, type:
     ```javascript
     JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
     ```
   - Expected output:
     ```javascript
     { v1: { page_3: [true, false, false] } }
     ```

3. **Reload page**
   - Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
   - Page reloads

4. **Verify persistence**
   - First checkbox should remain checked
   - localStorage still contains the same data

### Expected Result
✓ Checkbox persists across page reload  
✓ No console errors  
✓ localStorage key exists and is valid JSON

---

## Test 2: Navigation Preserves State

### Setup
1. Still on page 3 from Test 1

### Steps
1. **Check all remaining checkboxes**
   - Click the second checkbox: "Filled out the All About You form"
   - Click the third checkbox: "Updated your online profiles..."
   - All three should now be checked

2. **Verify localStorage**
   ```javascript
   JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
   ```
   - Expected: `{ v1: { page_3: [true, true, true] } }`

3. **Navigate forward**
   - Click the "Next →" button at the bottom
   - Page advances to `/page/4`

4. **Navigate back**
   - Click the "← Back" button
   - Page returns to `/page/3`

5. **Verify state persists**
   - All three checkboxes should still be checked
   - No reload required; page just re-renders

### Expected Result
✓ Checkboxes remain checked after forward/back navigation  
✓ State hydrates from localStorage on page mount  
✓ No flashing or unchecking during re-render

---

## Test 3: Page 3 No Longer Gates Advance

### Setup
1. Navigate to `http://localhost:3000/page/3`
2. Open DevTools Console (watch for any alert dialogs)

### Steps
1. **Do NOT check any checkboxes**
   - Leave all three checkboxes unchecked

2. **Attempt to navigate forward**
   - Click the "Next →" button

3. **Observe behavior**
   - ❌ OLD behavior (before fix): Alert dialog saying "Please complete all items before moving forward."
   - ✓ NEW behavior (after fix): Page silently advances to Page 4

### Expected Result
✓ No alert dialog appears  
✓ Navigation to next page succeeds unconditionally  
✓ Engagement is now honor-system (voluntary checkboxes)

---

## Test 4: Reset Functionality (Console Test)

### Setup
1. Navigate to `http://localhost:3000/page/3`
2. Check all three checkboxes
3. Verify localStorage contains state:
   ```javascript
   JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
   ```

### Steps
1. **Clear localStorage manually**
   ```javascript
   localStorage.removeItem('onboarding_checkboxes_v1')
   ```

2. **Reload page**
   - Cmd+Shift+R or Ctrl+Shift+R

3. **Verify reset**
   - All checkboxes should be unchecked
   - localStorage should be empty

### Expected Result
✓ localStorage cleared  
✓ All checkboxes revert to unchecked on reload  
✓ No console errors

---

## Test 5: Completion Percentage Calculation

### Setup
1. Navigate to `http://localhost:3000/page/3`
2. Open DevTools Console

### Steps
1. **Check 1 of 3 checkboxes on page 3**

2. **Navigate to page 6**
   - Click "Next →" button twice (page 4 has no checkboxes, so you'll go 3→4→5, then page 6)
   - Actually, let me correct: page 5 is the last activation page. After page 5, page 6 is orientation.
   - Click "Next →" to go 3→4→5→6

3. **On page 6, check some checkboxes** (if page 6 has checkboxes)

4. **Back to page 3 and manually calculate**
   - Assume page 3 has 3 checkboxes, you checked 1
   - Assume page 6 has 4 checkboxes, you checked 2
   - Total: 7 checkboxes, 3 checked
   - Completion %: (3 / 7) * 100 ≈ 43%

5. **Verify in localStorage**
   ```javascript
   JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
   // Should show: { v1: { page_3: [true, false, false], page_6: [true, true, false, false] } }
   ```

### Expected Result
✓ State accumulates across all pages with checkboxes  
✓ localStorage keys are page-namespaced (page_3, page_6, etc.)  
✓ Completion can be calculated: (total_checked / total_checkboxes) * 100

---

## Test 6: Multiple Pages with Checkboxes

### Setup
- Pages 3, 6, 7, 8 have checkboxes
- Pages 1, 2, 4, 5 have no checkboxes

### Steps
1. **Navigate through all pages**
   - Page 1: No checkboxes ✓
   - Page 2: No checkboxes ✓
   - Page 3: 3 checkboxes ✓
   - Page 4: No checkboxes ✓
   - Page 5: No checkboxes ✓
   - Page 6: Checkboxes ✓
   - Page 7: Checkboxes ✓
   - Page 8: Checkboxes ✓

2. **Check boxes on pages 3, 6, 7, 8**
   - On each page with checkboxes, check at least one

3. **Verify localStorage accumulates**
   ```javascript
   JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
   ```
   - Should have keys: page_3, page_6, page_7, page_8

### Expected Result
✓ Only pages with checkboxes store state  
✓ Pages without checkboxes are skipped (no empty page_N keys)  
✓ All state coexists in one localStorage entry

---

## Console Helper Commands

### View full state
```javascript
console.log(JSON.parse(localStorage.getItem('onboarding_checkboxes_v1')))
```

### Clear all checkpoints
```javascript
localStorage.removeItem('onboarding_checkboxes_v1')
```

### Check if localStorage is available
```javascript
typeof localStorage !== 'undefined'
```

### Monitor localStorage changes
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'onboarding_checkboxes_v1') {
    console.log('Checkpoints updated:', JSON.parse(e.newValue))
  }
})
```

---

## Troubleshooting

### Issue: Checkboxes not persisting
**Diagnosis:**
1. Check DevTools Application tab → Storage → localStorage
2. Look for key: `onboarding_checkboxes_v1`
3. If missing, the hook's `saveToStorage` isn't firing

**Solution:**
- Verify no console errors in DevTools
- Check that `onChange` handler is attached to checkboxes
- Open DevTools Console, check localStorage manually

### Issue: Checkboxes appear unchecked after reload even though localStorage has data
**Diagnosis:**
1. Check localStorage contains data:
   ```javascript
   JSON.parse(localStorage.getItem('onboarding_checkboxes_v1'))
   ```
2. Check DevTools Elements tab for `<input type="checkbox" class="page-checkbox">`

**Solution:**
- Verify hook hydration is running (useEffect on mount)
- Check that the DOM query finds checkboxes:
   ```javascript
   document.querySelectorAll('.page-checkbox').length
   ```

### Issue: No localStorage key exists
**Diagnosis:**
- localStorage may be disabled in browser
- Private browsing mode sometimes restricts localStorage

**Solution:**
- Try in a regular (non-private) browser tab
- Check browser settings: Settings → Privacy & Security → Cookies & site data

---

## Success Criteria

- [ ] Test 1: Checkpoint persists across reload
- [ ] Test 2: Navigation preserves state
- [ ] Test 3: Page 3 no longer blocks advance
- [ ] Test 4: Reset clears state
- [ ] Test 5: Completion percentage calculates
- [ ] Test 6: Multiple pages accumulate state correctly
- [ ] No console errors on any page
- [ ] localStorage quota not exceeded

---

## Notes for Brian

- Phase 1 is foundational; all other phases depend on this working correctly
- localStorage quota is ~5-10MB per domain; checkpoint data is <1KB even with many pages
- If you want to reset everything: `localStorage.clear()` (clears ALL localStorage, not just checkpoints)
- Next phase (Phase 2) will refactor ProgressIndicator to show completion % instead of page position
