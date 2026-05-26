---
date: 2026-05-26
topic: Onboarding engagement pass implementation plan
status: ready-for-work
source: /ce-plan phase following 2026-05-26-onboarding-engagement-pass-requirements.md
---

# Onboarding Engagement Pass — Implementation Plan

## Executive Summary

Refactor the existing checkbox infrastructure from raw DOM state into a centralized React state layer with localStorage persistence. Pages 3, 6, 7, 8 already contain checkbox items; pages 1, 2, 4, 5 have none (content work deferred). The completion-based progress indicator will replace the current page-position indicator. No new UI frameworks or major architectural changes.

## Critical Decisions (Confirmed)

### 1. Page 3 Gate Removal
**Decision:** Remove the blocking behavior from page 3. Checkboxes become voluntary acknowledgment, not progression gates.

**Context:** Page 3 currently blocks advance until all checkboxes are checked. The brainstorm explicitly rejected gated navigation ("Gated navigation… Engagement is honor-system here"). This decision applies system-wide, including page 3.

**Action:** Remove any logic that prevents `next` button or navigation advance on page 3 until checkboxes are complete.

### 2. Pages 1, 2, 4, 5 Checkpoint Inventory
**Decision:** Pages 1, 2, 4, 5 will support the checkbox infrastructure but will have NO checkbox items in their content for now. This is content work, deferred.

**Inventory:**
- **Page 1 (Getting Started):** No checkboxes currently. Could eventually include items like "I've logged into my brokerage account" or "I understand the 6th Ave Homes onboarding flow," but not in this phase.
- **Page 2 (Lead Sources & ILS):** No checkboxes currently. Could include "I've configured my Lead Source," but not in this phase.
- **Page 3 (IABS Setup):** Has checkboxes. Includes "I've installed IABS", "I've imported my contacts", "I've created my first campaign." Keep as-is.
- **Page 4 (Follow-Up Cadence):** No checkboxes currently. Could include "I understand the 90-day cadence," but not in this phase.
- **Page 5 (Orientation →):** No checkboxes currently. Could include "I've reviewed my phone scripts" or "I'm ready for guide orientation," but not in this phase.
- **Page 6 (Operational Onboarding):** Has checkboxes. Keep as-is.
- **Page 7 (Success Stories):** Has checkboxes. Keep as-is.
- **Page 8 (Metrics & Feedback):** Has checkboxes. Keep as-is.

**Action:** The build will support checkboxes on all pages, but pages 1, 2, 4, 5 content will remain unchanged. After launch, Brian (or team) can add checkpoint items to these pages as a follow-up content pass.

### 3. Renderer Approach
**Decision:** Keep the existing regex-based markdown renderer (`renderMarkdown` in `Page.jsx`). Add a React hydration layer post-render that takes control of existing checkbox DOM elements.

**Why:** The current regex approach is working and would require significant rewrite to swap to `react-markdown`. The hydration approach is less risky: parse the rendered HTML checkboxes into React state on mount, hand control to React, and serialize state back to localStorage on change.

**Action:** 
- Keep `renderMarkdown` as-is (it already renders `- [ ]` to `<input type="checkbox">`).
- In `Page.jsx` (or a new `useCheckboxState` hook), on mount: query `document.querySelectorAll('input[type="checkbox"]')`, map to a state object keyed by page ID and index, hydrate from localStorage if present.
- Wrap each checkbox with React's `onChange` handler (using a click handler on the rendered input).
- On any checkbox change, save state to localStorage under a versioned key (e.g., `onboarding_checkboxes_v1`).
- On page change or refresh, restore from localStorage.

## Technical Scope

### In Scope

1. **New `useCheckboxState` Hook**
   - Manages checkbox state for all pages (local to `Page.jsx` or extracted to `src/hooks/`).
   - Initializes from localStorage on mount.
   - Provides: `isChecked(pageId, index)`, `toggle(pageId, index)`, `reset()`, `getCompletionPercentage()`.
   - Saves to localStorage on any change.

2. **Checkpoint Schema (localStorage)**
   - Key: `onboarding_checkboxes_v1` (version included for future schema changes).
   - Value: JSON object mapping pages to arrays of boolean values.
   ```json
   {
     "v1": {
       "page_3": [true, true, false],
       "page_6": [true, false, true, false],
       "page_7": [false, false],
       "page_8": [true, true, true]
     }
   }
   ```
   - On schema change, clear old storage and treat as empty state.

3. **ProgressIndicator Refactor**
   - Change from page-position % (e.g., "Page 3 of 8") to completion %.
   - Calculate: `(total_checked / total_checkboxes_across_all_pages) * 100`.
   - Pages with no checkboxes contribute 0 to numerator and denominator.
   - Display format: e.g., "6 of 9 complete" or "67%".
   - Accept completion % and current page as props from parent.

4. **Checkpoint Element Control**
   - On `Page.jsx` mount, query existing checkbox inputs rendered by `renderMarkdown`.
   - Wrap with React `onChange` handlers (or use event delegation).
   - Visual feedback: checkboxes visually check/uncheck in real-time; persist on change.
   - No reload required; state is immediate.

5. **Reset Affordance**
   - Small, unobtrusive button (e.g., "Reset my progress") in a hidden location (e.g., footer or in TopBar dropdown).
   - On click: clear localStorage, reload page.
   - Optional: add a confirmation modal.

6. **Completion Feedback States** (Visual Polish)
   - Per-section completion: subtle color shift or icon for sections with all checkboxes checked (e.g., brief teal highlight or checkmark icon).
   - Per-page completion: when all checkboxes on a page are checked, highlight page heading or add a small icon.
   - 100% completion: satisfying moment (e.g., brief animation, color change, or notification) when the last checkbox on the final page is checked.
   - Visual treatment: use existing brand palette (navy, coral, taupe, cream). Prioritize clarity over decoration.

### Out of Scope

- Authentication, user accounts, passwords.
- Server-side storage of any kind.
- Multi-device sync.
- Admin dashboard for visibility into who completed.
- Gated navigation.
- Email notifications on completion.
- Changes to `renderMarkdown` or markdown syntax.
- New UI frameworks or state management libraries (React hooks sufficient).

## Implementation Steps

### Phase 1: State Management & Hydration

1. **Create `src/hooks/useCheckboxState.js`**
   - Hook function signature: `useCheckboxState(pageId)`.
   - Returns: `{ isChecked, toggle, reset, completionPercentage, allCheckboxes }`.
   - Manages localStorage schema versioning (current: `v1`).
   - Initializes state on mount by querying the rendered DOM.

2. **Update `src/components/Page.jsx`**
   - Import `useCheckboxState`.
   - Call hook in effect (after markdown is rendered).
   - Attach `onChange` handlers to rendered checkboxes.
   - Save state on any toggle.

3. **Test Hydration**
   - Render page 3 (has checkboxes).
   - Check a box.
   - Refresh page; box should remain checked.
   - Navigate to another page and back; state should persist.

### Phase 2: Progress Indicator Refactor

4. **Update `src/components/ProgressIndicator.jsx`**
   - Accept props: `completionPercentage`, `currentPage`.
   - Remove page-position logic.
   - Display completion info (e.g., "6 of 9 complete" or just "%").
   - Add visual indicator (e.g., progress bar or circular progress).

5. **Update `[[...page]].js` (or parent component)**
   - Provide `completionPercentage` from `useCheckboxState` to `ProgressIndicator`.

### Phase 3: Visual Feedback

6. **Add Completion States**
   - Per-section: add subtle styling (e.g., CSS class `section-complete`) to rendered sections with all checkboxes checked.
   - Per-page: highlight page heading or add a checkmark icon when all checkboxes on the page are checked.
   - 100% completion: trigger a brief animation or toast notification when the last checkbox is checked.
   - Use CSS transitions for smoothness.

### Phase 4: Reset Affordance

7. **Add Reset Button**
   - Place in TopBar dropdown or footer.
   - On click: confirm, then clear localStorage and reload.
   - Style to be unobtrusive (e.g., small secondary button).

### Phase 5: Testing & Polish

8. **Manual Testing**
   - Test checkbox toggle and persistence across pages.
   - Test page 3 gate removal (verify advance is possible even with unchecked boxes).
   - Test reset functionality.
   - Test localStorage versioning (manually change key, verify graceful fallback to empty).
   - Test 100% completion moment on all browsers.

9. **Content Inventory Review**
   - Verify pages 3, 6, 7, 8 have clear, actionable checkbox items.
   - Document what pages 1, 2, 4, 5 *could* have in future content pass.

## File Changes Summary

| File | Change | Notes |
|------|--------|-------|
| `src/hooks/useCheckboxState.js` | New | State management and persistence |
| `src/components/Page.jsx` | Update | Hydrate checkboxes, attach handlers, save state |
| `src/components/ProgressIndicator.jsx` | Refactor | Replace page-position with completion % |
| `[[...page]].js` | Update | Pass completion % and current page |
| `src/components/TopBar.jsx` | Minor | Add reset button (optional location) |
| `content/page-*.md` | No change | Content remains as-is |

## Success Criteria

- [ ] Checkboxes persist across page reloads and navigation.
- [ ] Progress indicator shows completion %, not page position.
- [ ] Page 3 does not block advance; checkboxes are voluntary.
- [ ] 100% completion produces a visible, satisfying moment.
- [ ] Pages 1, 2, 4, 5 have no checkbox items (by design, not accident).
- [ ] Reset affordance is present and works correctly.
- [ ] All visual changes are consistent with brand palette.
- [ ] No console errors; localStorage quota is not exceeded.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Existing DOM-based checkbox logic conflicts with React handlers | Hydrate from DOM on mount; prevent double-binding |
| localStorage schema changes orphan old data | Version the storage key; graceful fallback to empty state |
| 100% completion moment feels underwhelming | Plan feedback carefully; solicit feedback in early testing |
| Pages 1, 2, 4, 5 left feeling incomplete | Document clearly that this is intentional; flag for future content pass |
| Browser doesn't support localStorage | Graceful degradation: state still works within the session; refresh wipes it |

## Handoff to `/ce-work`

Once this plan is approved, work begins with Phase 1 (State Management & Hydration). Each phase is a logical stopping point for testing and feedback.

**Ready to code?** Confirm, and Phase 1 is next.
