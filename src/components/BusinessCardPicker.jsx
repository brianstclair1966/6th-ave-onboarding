import { useState, useEffect } from 'react'
import { markDone } from '../lib/progress'

// The eight card options. Each option has a front and a back image (shown side by
// side). Images live in /public/cards/. The `value` is exactly what gets written
// to the Google Sheet so Brian knows which option to order.
const OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: `Option ${i + 1}`,
  front: `/cards/option-${i + 1}-front.png`,
  back: `/cards/option-${i + 1}-back.png`,
}))

const STORAGE_KEY = 'businessCardSelection'
const PROGRESS_ID = 'cards:3'

export default function BusinessCardPicker({ agentInfo: propAgentInfo }) {
  const [selected, setSelected] = useState(null)
  const [agentInfo, setAgentInfo] = useState(propAgentInfo)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Restore a previous pick (and keep the progress bar / gate in sync) on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSelected(stored)
        setSaved(true)
        markDone(PROGRESS_ID)
      }
    } catch (e) {
      /* ignore */
    }
    if (!agentInfo) {
      try {
        const a = localStorage.getItem('agentInfo')
        if (a) setAgentInfo(JSON.parse(a))
      } catch (e) {
        /* ignore */
      }
    }
  }, [])

  const handleSelect = async (value) => {
    if (saving) return
    const prev = selected
    setSelected(value)
    setError('')
    setSaved(false)

    // Read the freshest registration straight from localStorage (state can be
    // stale after client-side navigation from page 1).
    let liveAgent = agentInfo
    try {
      const a = localStorage.getItem('agentInfo')
      if (a) liveAgent = JSON.parse(a)
    } catch (e) {
      /* fall back to state */
    }

    setSaving(true)
    try {
      const response = await fetch('/api/log-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: liveAgent?.firstName || '',
          lastName: liveAgent?.lastName || '',
          email: liveAgent?.email || '',
          selection: value,
        }),
      })
      if (!response.ok) throw new Error('Failed to save selection')

      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch (e) {
        /* no-op */
      }
      markDone(PROGRESS_ID)
      setSaved(true)
    } catch (err) {
      console.error('Card selection error:', err)
      setError('Could not save your selection. Please try again.')
      setSelected(prev) // revert UI
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-1 text-brand-navy">Choose Your Business Card</h3>
      <p className="text-sm text-gray-600 mb-5">
        Each option shows the front and back. Pick the one you'd like — we'll order your first 100 cards
        in that design. You can only select one.
      </p>

      <div className="flex flex-wrap gap-5 justify-center">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              aria-pressed={isSelected}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                isSelected
                  ? 'border-brand-coral bg-brand-coral/5 shadow-md'
                  : 'border-gray-200 hover:border-brand-coral/50'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              style={{ flex: '1 1 230px', maxWidth: '280px', minWidth: '210px' }}
            >
              {/* Front + back, side by side */}
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {[
                  { src: opt.front, label: 'Front' },
                  { src: opt.back, label: 'Back' },
                ].map((face) => (
                  <div key={face.label} style={{ flex: 1 }}>
                    <img
                      src={face.src}
                      alt={`${opt.value} ${face.label}`}
                      style={{ width: '100%', aspectRatio: '7 / 4', objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <div className="text-center text-gray-400 mt-0.5" style={{ fontSize: '11px' }}>
                      {face.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Centered checkbox + label under the design */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`flex items-center justify-center border-2 ${
                    isSelected ? 'bg-brand-coral border-brand-coral text-white' : 'bg-white border-gray-400 text-transparent'
                  }`}
                  style={{ width: '20px', height: '20px', borderRadius: '4px', fontSize: '13px', lineHeight: 1 }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className={`text-sm font-semibold ${isSelected ? 'text-brand-coral' : 'text-brand-navy'}`}>
                  {opt.value}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm text-center">
          {error}
        </div>
      )}
      {saved && selected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm text-center">
          ✓ {selected} selected — we'll order this design for you.
        </div>
      )}
    </div>
  )
}
