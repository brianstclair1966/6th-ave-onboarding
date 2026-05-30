import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'onboarding_checkboxes_v1'

/**
 * useCheckboxState
 *
 * Manages checkbox state for onboarding pages with localStorage persistence.
 * Client-side only hook - returns empty state on server.
 *
 * @param {number} pageId - The current page number (used as key in storage)
 * @returns {object} { isChecked, toggle, reset, getCompletionPercentage, allCheckboxes }
 */
export default function useCheckboxState(pageId) {
  // Return empty implementation on server
  if (typeof window === 'undefined') {
    return {
      isChecked: () => false,
      toggle: () => {},
      reset: () => {},
      getCompletionPercentage: () => 0,
      allCheckboxes: () => ({}),
    }
  }

  const [state, setState] = useState({})
  const [hydrated, setHydrated] = useState(false)

  // Persist state to localStorage whenever it changes
  const saveToStorage = useCallback((newState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v1: newState }))

      // Dispatch custom event so TopBar and other components know to re-render
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('checkboxStateUpdated', {
          detail: { newState }
        })
        window.dispatchEvent(event)
      }
    } catch (e) {
      console.warn('Failed to save checkpoint state:', e)
    }
  }, [])

  // Save to localStorage whenever state changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      saveToStorage(state)
    }
  }, [state, hydrated, saveToStorage])

  // Load state from localStorage and initialize from DOM on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.v1 && typeof parsed.v1 === 'object') {
            return parsed.v1
          }
        }
      } catch (e) {
        console.warn('Failed to parse checkpoint storage:', e)
      }
      return {}
    }

    const initializeFromDOM = () => {
      const pageKey = `page_${pageId}`
      const checkboxes = document.querySelectorAll('.page-checkbox')
      const pageState = {}

      checkboxes.forEach((checkbox, index) => {
        pageState[index] = checkbox.checked
      })

      if (Object.keys(pageState).length > 0) {
        return { [pageKey]: pageState }
      }
      return {}
    }

    const storedState = loadFromStorage()
    const domState = initializeFromDOM()
    const mergedState = { ...storedState, ...domState }
    setState(mergedState)
    setHydrated(true)
  }, [pageId])

  // Attach change handlers to checkboxes after hydration
  useEffect(() => {
    if (!hydrated) return

    const checkboxes = document.querySelectorAll('.page-checkbox')
    const pageKey = `page_${pageId}`

    const handleChange = (e) => {
      const index = Array.from(checkboxes).indexOf(e.target)
      if (index === -1) return

      setState(prevState => {
        const newState = { ...prevState }
        if (!newState[pageKey]) {
          newState[pageKey] = {}
        }
        newState[pageKey][index] = !newState[pageKey][index]
        return newState
      })
    }

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleChange)
    })

    return () => {
      checkboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', handleChange)
      })
    }
  }, [hydrated, pageId])

  /**
   * Check if a specific checkbox is checked
   */
  const isChecked = useCallback((pageNum, index) => {
    const pageKey = `page_${pageNum}`
    return state[pageKey]?.[index] ?? false
  }, [state])

  /**
   * Toggle a checkbox
   */
  const toggle = useCallback((pageNum, index) => {
    const pageKey = `page_${pageNum}`
    setState(prevState => {
      const newState = { ...prevState }
      if (!newState[pageKey]) {
        newState[pageKey] = {}
      }
      newState[pageKey][index] = !newState[pageKey][index]
      return newState
    })
  }, [])

  /**
   * Reset all checkpoint state
   */
  const reset = useCallback(() => {
    setState({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear checkpoint storage:', e)
    }
  }, [])

  /**
   * Get completion percentage across all pages
   * Reads directly from localStorage to ensure always up-to-date
   */
  const getCompletionPercentage = useCallback(() => {
    let totalCheckboxes = 0
    let checkedCount = 0

    // Read directly from localStorage to avoid state sync issues during navigation
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const allState = parsed.v1 || {}

        Object.values(allState).forEach(pageCheckboxes => {
          if (typeof pageCheckboxes === 'object') {
            Object.values(pageCheckboxes).forEach(isCheckedVal => {
              totalCheckboxes++
              if (isCheckedVal) checkedCount++
            })
          }
        })
      }
    } catch (e) {
      console.warn('Failed to read completion percentage from storage:', e)
      // Fallback to current state
      Object.values(state).forEach(pageCheckboxes => {
        if (typeof pageCheckboxes === 'object') {
          Object.values(pageCheckboxes).forEach(isCheckedVal => {
            totalCheckboxes++
            if (isCheckedVal) checkedCount++
          })
        }
      })
    }

    if (totalCheckboxes === 0) return 0
    return Math.round((checkedCount / totalCheckboxes) * 100)
  }, [])

  /**
   * Get all checkboxes across all pages
   */
  const allCheckboxes = useCallback(() => state, [state])

  return {
    isChecked,
    toggle,
    reset,
    getCompletionPercentage,
    allCheckboxes,
  }
}
