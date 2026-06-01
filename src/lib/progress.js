// Persistent onboarding progress store.
//
// Holds a Set of completed item IDs, persisted to localStorage so progress
// survives a page refresh or a return visit on the same device. The bar:
//   - starts at 0% for a brand-new browser (nothing stored yet),
//   - remembers progress across refreshes / closing the tab and returning,
//   - reaches exactly 100% on the final action, and
//   - can be wiped to 0% via resetProgress() ("Start over").
//
// IDs are stable strings:
//   - checkboxes: `cb:<pageNumber>:<indexOnPage>`
//   - forms:      `form:agentInfo` | `form:emergency` | `form:bio` | `form:about`
//
// NOTE: This is the agent's *visible* progress only. The authoritative record
// is the Google Sheet (server-side); this store is a UX convenience.

const STORAGE_KEY = 'onboarding_progress_v2'

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

function persist() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]))
  } catch (e) {
    /* storage unavailable — progress just won't persist this session */
  }
}

/**
 * Load any saved progress from localStorage into the in-memory set. Safe to
 * call multiple times. Call once on the client after mount (see _app.js) to
 * avoid a server/client hydration mismatch.
 */
export function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return
    let changed = false
    arr.forEach((id) => {
      if (typeof id === 'string' && !completed.has(id)) {
        completed.add(id)
        changed = true
      }
    })
    if (changed) notify()
  } catch (e) {
    /* ignore corrupt storage */
  }
}

export function markDone(id) {
  if (!id) return
  if (!completed.has(id)) {
    completed.add(id)
    persist()
    notify()
  }
}

export function markUndone(id) {
  if (!id) return
  if (completed.has(id)) {
    completed.delete(id)
    persist()
    notify()
  }
}

export function isDone(id) {
  return completed.has(id)
}

export function getCompletedCount() {
  return completed.size
}

/** Whole-number percentage (0-100) of `totalItems` completed. */
export function getPercentage(totalItems) {
  if (!totalItems || totalItems <= 0) return 0
  return Math.min(100, Math.round((completed.size / totalItems) * 100))
}

/** Clear all progress (the "Start over" control), including persisted storage. */
export function resetProgress() {
  completed.clear()
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      /* no-op */
    }
  }
  notify()
}
