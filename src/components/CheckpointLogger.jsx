import { useState, useEffect } from 'react'

/**
 * CheckpointLogger Component
 *
 * A wrapper component that handles logging checkpoint completions to Google Sheets.
 * Use this component as a wrapper around checkboxes to automatically log completions.
 *
 * Props:
 * - checkpointLabel: string - The name of the checkpoint column in Google Sheets (e.g., "Page 1", "Page 2", etc.)
 * - children: ReactNode - The checkbox input element to wrap
 * - onSuccess: function (optional) - Callback when checkpoint is successfully logged
 * - onError: function (optional) - Callback if checkpoint logging fails
 */
export default function CheckpointLogger({
  checkpointLabel,
  children,
  onSuccess,
  onError,
}) {
  const [agentInfo, setAgentInfo] = useState(null)
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    // Get agent info from localStorage
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAgentInfo(parsed)
      } catch (e) {
        console.error('Error parsing stored agent info:', e)
      }
    }
  }, [])

  const handleChange = async (e) => {
    // Call the original onChange if it exists
    const originalCheckbox = e.target
    if (originalCheckbox.checked && agentInfo && checkpointLabel) {
      setIsLogging(true)
      try {
        const response = await fetch('/api/log-checkpoint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: agentInfo.firstName,
            lastName: agentInfo.lastName,
            email: agentInfo.email,
            checkpointLabel: checkpointLabel,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to log checkpoint')
        }

        if (onSuccess) {
          onSuccess()
        }
      } catch (err) {
        console.error('Checkpoint logging error:', err)
        if (onError) {
          onError(err.message)
        }
        // Uncheck the box if logging failed
        originalCheckbox.checked = false
      } finally {
        setIsLogging(false)
      }
    }
  }

  // Clone the children and inject the handleChange handler
  if (!children) {
    return null
  }

  return (
    <>
      {typeof children === 'function'
        ? children({ handleChange, isLogging, agentInfo })
        : (() => {
            // If children is a React element, we need to clone it with the new onChange
            const clonedChild = children.type(
              {
                ...children.props,
                onChange: (e) => {
                  // Call original onChange if exists
                  if (children.props.onChange) {
                    children.props.onChange(e)
                  }
                  // Then call our logging handler
                  handleChange(e)
                },
              },
              children.props.children
            )
            return clonedChild
          })()}
    </>
  )
}

/**
 * Utility hook for checkpoint logging
 * Use this if you want to handle logging directly in your component
 */
export function useCheckpointLogger(checkpointLabel) {
  const [agentInfo, setAgentInfo] = useState(null)
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAgentInfo(parsed)
      } catch (e) {
        console.error('Error parsing stored agent info:', e)
      }
    }
  }, [])

  const logCheckpoint = async () => {
    if (!agentInfo || !checkpointLabel) {
      console.warn('Missing agentInfo or checkpointLabel for logging')
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/log-checkpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: agentInfo.firstName,
          lastName: agentInfo.lastName,
          email: agentInfo.email,
          checkpointLabel: checkpointLabel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to log checkpoint')
      }

      return true
    } catch (err) {
      console.error('Checkpoint logging error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { logCheckpoint, isLogging, agentInfo }
}
