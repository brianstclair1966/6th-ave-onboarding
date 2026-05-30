import { useState, useEffect } from 'react'
import useCheckboxState from '../hooks/useCheckboxState'

export default function BioForm({ agentInfo: propAgentInfo }) {
  const { toggle } = useCheckboxState(3)
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [agentInfo, setAgentInfo] = useState(propAgentInfo)

  useEffect(() => {
    // If agentInfo not passed as prop, try to load from localStorage
    if (!agentInfo) {
      const stored = localStorage.getItem('agentInfo')
      if (stored) {
        try {
          setAgentInfo(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing stored agent info:', e)
        }
      }
    }
  }, [agentInfo])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!bio.trim()) {
      setError('Please write your bio before submitting.')
      return
    }

    if (bio.trim().length < 50) {
      setError('Please write at least 50 characters for your bio.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'bio',
          data: {
            email: agentInfo?.email || 'unknown@example.com',
            firstName: agentInfo?.firstName || 'Agent',
            lastName: agentInfo?.lastName || '',
            bio: bio.trim(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit bio')
      }

      // Auto-check the corresponding checkbox
      toggle(3, 0)

      // Mark form as completed for percentage calculation
      try {
        const completedForms = JSON.parse(localStorage.getItem('completedForms_v1') || '{}')
        completedForms.bio = true
        localStorage.setItem('completedForms_v1', JSON.stringify(completedForms))
        // Dispatch event so TopBar re-renders
        window.dispatchEvent(new CustomEvent('checkboxStateUpdated', { detail: { formType: 'bio' } }))
      } catch (e) {
        console.warn('Failed to mark bio form as completed:', e)
      }

      setSubmitted(true)
      setIsDisabled(true)
      // Keep bio visible - do NOT clear it
    } catch (err) {
      console.error('Bio submission error:', err)
      setError('Failed to save bio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-brand-navy">Write Your Bio</h3>

      <form onSubmit={handleSubmit}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write your bio here... (150–300 words recommended)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-coral resize-none"
          rows="6"
          disabled={loading || isDisabled}
        />

        <div className="mt-2 text-sm text-gray-600">
          {bio.length > 0 ? `${bio.length} characters` : 'Recommended: 150–300 words'}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {submitted && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Bio saved successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isDisabled}
          className="mt-4 w-full px-6 py-2 bg-brand-coral text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-coral/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isDisabled ? '✓ Saved' : 'Save Bio'}
        </button>
      </form>
    </div>
  )
}
