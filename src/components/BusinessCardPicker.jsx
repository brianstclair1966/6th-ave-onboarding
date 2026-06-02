import { useState, useEffect } from 'react'
import { markDone, markUndone } from '../lib/progress'

// The five card designs. Images live in /public/cards/. The `value` is exactly
// what gets written to the Google Sheet so Brian knows which design to order.
const CARDS = [
  { value: 'Design 1', img: '/cards/card-1.png' },
  { value: 'Design 2', img: '/cards/card-2.png' },
  { value: 'Design 3', img: '/cards/card-3.png' },
  { value: 'Design 4', img: '/cards/card-4.png' },
  { value: 'Design 5', img: '/cards/card-5.png' },
]

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

      // Persist locally and unlock the page gate.
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
      <p className="text-sm text-gray-600 mb-4">
        Pick one design. We'll order your first 100 cards in the style you choose. You can only select one.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {CARDS.map((card) => {
          const isSelected = selected === card.value
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => handleSelect(card.value)}
              disabled={saving}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                isSelected
                  ? 'border-brand-coral bg-brand-coral/5 shadow-md'
                  : 'border-gray-200 hover:border-brand-coral/50'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              style={{ flex: '1 1 150px', maxWidth: '200px', minWidth: '130px' }}
            >
              <img
                src={card.img}
                alt={card.value}
                style={{ width: '100%', aspectRatio: '7 / 4', objectFit: 'cover', borderRadius: '8px' }}
              />
              <span
                className={`flex items-center justify-center rounded-full border-2 ${
                  isSelected ? 'bg-brand-coral border-brand-coral text-white' : 'bg-white border-gray-300 text-transparent'
                }`}
                style={{ width: '28px', height: '28px', fontSize: '16px', lineHeight: 1 }}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={`text-sm font-semibold ${isSelected ? 'text-brand-coral' : 'text-brand-navy'}`}>
                {card.value}
              </span>
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
