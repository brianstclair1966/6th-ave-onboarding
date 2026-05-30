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
   * Accounts for:
   * - 1 AgentInfoForm (2%)
   * - 46 checkboxes across pages 2-8 (46 × 2% = 92%)
   * - 3 forms: Emergency Contact, Bio, About You (3 × 2% = 6%)
   * Total: 50 items = 100%
   */
  const getCompletionPercentage = useCallback(() => {
    let completedItems = 0
    const totalItems = 50 // 1 agentinfo + 46 checkboxes + 3 forms

    // Check if AgentInfoForm was completed
    try {
      const agentInfo = localStorage.getItem('agentInfo')
      if (agentInfo) {
        completedItems++ // AgentInfoForm = 1 item
      }
    } catch (e) {
      console.warn('Failed to read agentInfo:', e)
    }

    // Count completed checkboxes from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const allState = parsed.v1 || {}

        Object.values(allState).forEach(pageCheckboxes => {
          if (typeof pageCheckboxes === 'object') {
            Object.values(pageCheckboxes).forEach(isCheckedVal => {
              if (isCheckedVal) completedItems++
            })
          }
        })
      }
    } catch (e) {
      console.warn('Failed to read checkboxes from storage:', e)
    }

    // Count completed forms from localStorage
    try {
      const formState = localStorage.getItem('completedForms_v1')
      if (formState) {
        const forms = JSON.parse(formState)
        completedItems += Object.values(forms).filter(v => v === true).length
      }
    } catch (e) {
      console.warn('Failed to read completed forms:', e)
    }

    // Calculate percentage: each of 50 items = 2%
    const percentage = Math.round((completedItems / totalItems) * 100)
    return Math.min(percentage, 100) // Cap at 100%
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
