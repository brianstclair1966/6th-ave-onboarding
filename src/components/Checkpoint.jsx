import { useState, useEffect } from 'react'

/**
 * Checkpoint Component
 *
 * A simple checkbox component that automatically logs completion status to Google Sheets.
 * Place this anywhere in your pages to add checkpoints.
 *
 * Props:
 * - label: string - The label to display next to the checkbox
 * - checkpointName: string - The name of the checkpoint column in Google Sheets
 * - disabled: boolean (optional) - Whether the checkbox should be disabled
 */
export default function Checkpoint({ label, checkpointName, disabled = false }) {
  const [isChecked, setIsChecked] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState(null)
  const [agentInfo, setAgentInfo] = useState(null)
  const [success, setSuccess] = useState(false)

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
    const checked = e.target.checked
    setIsChecked(checked)
    setError(null)

    if (checked && agentInfo && checkpointName) {
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
            checkpointLabel: checkpointName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to log checkpoint')
        }

        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } catch (err) {
        console.error('Checkpoint logging error:', err)
        setError(err.message)
        setIsChecked(false) // Uncheck if logging failed
      } finally {
        setIsLogging(false)
      }
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center h-6 pt-0.5">
        <input
          type="checkbox"
          id={`checkpoint-${checkpointName}`}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled || isLogging || !agentInfo}
          className="w-5 h-5 rounded cursor-pointer accent-brand-coral disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <label
        htmlFor={`checkpoint-${checkpointName}`}
        className={`text-sm flex-1 ${
          disabled || isLogging || !agentInfo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {label}
      </label>

      {isLogging && (
        <span className="text-xs text-gray-500 ml-2">Saving...</span>
      )}

      {success && (
        <span className="text-xs text-green-600 ml-2">✓ Saved</span>
      )}

      {error && (
        <span className="text-xs text-red-600 ml-2">Error: {error}</span>
      )}
    </div>
  )
}
