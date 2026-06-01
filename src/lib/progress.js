// In-memory, session-scoped onboarding progress store.
//
// This module holds a Set of completed item IDs in memory. Because module state
// is re-initialized on a full page load but preserved across Next.js client-side
// route changes, the progress bar:
//   - starts at 0% on every fresh load / hard refresh, and
//   - climbs as the user completes checkboxes + forms during a single session,
//     reaching exactly 100% on the final action.
//
// IDs are stable strings:
//   - checkboxes: `cb:<pageNumber>:<indexOnPage>`
//   - forms:      `form:agentInfo` | `form:emergency` | `form:bio` | `form:about`

const completed = new Set()

export const PROGRESS_EVENT = 'progressUpdated'

function notify() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(PROGRESS_EVENT))
    } catch (e) {
      /* no-op */
    }
  }
}

export function markDone(id) {
  if (!id) return
  if (!completed.has(id)) {
    completed.add(id)
    notify()
  }
}

export function markUndone(id) {
  if (!id) return
  if (completed.has(id)) {
    completed.delete(id)
    notify()
  }
}

export function isDone(id) {
  return completed.has(id)
}

export function getCompletedCount() {
  return completed.size
}

/** Whole-number percentage (0-100) of `totalItems` completed this session. */
export function getPercentage(totalItems) {
  if (!totalItems || totalItems <= 0) return 0
  return Math.min(100, Math.round((completed.size / totalItems) * 100))
}

/** Clear all session progress (used by an optional "Start over" control). */
export function resetProgress() {
  if (completed.size) {
    completed.clear()
    notify()
  }
}
