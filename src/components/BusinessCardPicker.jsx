import { useState, useEffect } from 'react'
import { markDone, isDone } from '../lib/progress'

// The eight card options. Each has a front and a back image in /public/cards/.
const OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: `Option ${i + 1}`,
  front: `/cards/option-${i + 1}-front.png`,
  back: `/cards/option-${i + 1}-back.png`,
}))

const SEL_KEY = 'businessCardSelection'
const DETAILS_KEY = 'businessCardDetails'
const PROGRESS_ID = 'cards:3'

// Format a US phone number as the agent types: "(817) 360-5555".
function formatPhoneNumber(value) {
  let raw = String(value).replace(/\D/g, '')
  if (raw.length === 11 && raw[0] === '1') raw = raw.slice(1)
  const d = raw.slice(0, 10)
  if (d.length === 0) return ''
  if (d.length < 4) return `(${d}`
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export default function BusinessCardPicker({ agentInfo: propAgentInfo }) {
  const [agentInfo, setAgentInfo] = useState(propAgentInfo)
  const [selected, setSelected] = useState(null)
  const [zoom, setZoom] = useState(null) // { src, label }
  const [form, setForm] = useState({ name: '', email: '', phone: '', instagram: '', website: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // On mount: load registration, restore any prior choice/details, else prefill
  // the name + email from the page-1 registration so there's less to type.
  useEffect(() => {
    let ai = propAgentInfo
    try {
      const a = localStorage.getItem('agentInfo')
      if (a) ai = JSON.parse(a)
    } catch (e) {
      /* ignore */
    }
    if (ai) setAgentInfo(ai)

    let savedDetails = null
    try {
      const d = localStorage.getItem(DETAILS_KEY)
      if (d) savedDetails = JSON.parse(d)
      const s = localStorage.getItem(SEL_KEY)
      if (s) setSelected(s)
    } catch (e) {
      /* ignore */
    }

    setForm((f) => ({
      ...f,
      ...(savedDetails || {}),
      name: (savedDetails && savedDetails.name) || (ai ? [ai.firstName, ai.lastName].filter(Boolean).join(' ') : ''),
      email: (savedDetails && savedDetails.email) || (ai ? ai.email || '' : ''),
    }))

    if (isDone(PROGRESS_ID)) setSaved(true)
  }, [])

  const setField = (key) => (e) => {
    const v = key === 'phone' ? formatPhoneNumber(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [key]: v }))
  }

  const canSubmit =
    !!selected && form.name.trim() && form.email.trim() && form.phone.trim() && !saving && !saved

  const handleSubmit = async () => {
    if (!selected) {
      setError('Please pick a card design first — check the box under your favorite.')
      return
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email, and phone so we can print your cards.')
      return
    }
    setError('')
    setSaving(true)

    let liveAgent = agentInfo
    try {
      const a = localStorage.getItem('agentInfo')
      if (a) liveAgent = JSON.parse(a)
    } catch (e) {
      /* ignore */
    }

    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'business-card',
          data: {
            Email: form.email.trim() || liveAgent?.email || '',
            'Agent Name': form.name.trim(),
            'Card Option': selected,
            Phone: form.phone.trim(),
            Instagram: form.instagram.trim(),
            Website: form.website.trim(),
          },
        }),
      })
      if (!res.ok) throw new Error('save failed')

      try {
        localStorage.setItem(SEL_KEY, selected)
        localStorage.setItem(DETAILS_KEY, JSON.stringify(form))
      } catch (e) {
        /* ignore */
      }
      markDone(PROGRESS_ID)
      setSaved(true)
    } catch (e) {
      console.error('Business card save error:', e)
      setError('Could not save your card order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-coral bg-white text-base disabled:bg-gray-100'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-1 text-brand-navy">Choose Your Business Card</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tap any card to zoom in and read it. Browse all eight designs, then check the box under your
        favorite (pick one). Fill in your details below so we can print and order your cards.
      </p>

      <div className="flex flex-wrap gap-5 justify-center">
        {OPTIONS.map((opt) => {
          const isSel = selected === opt.value
          return (
            <div
              key={opt.value}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${
                isSel ? 'border-brand-coral bg-brand-coral/5 shadow-md' : 'border-gray-200'
              }`}
              style={{ flex: '1 1 230px', maxWidth: '280px', minWidth: '210px' }}
            >
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {[
                  { src: opt.front, label: 'Front' },
                  { src: opt.back, label: 'Back' },
                ].map((face) => (
                  <div key={face.label} style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={face.src}
                        alt={`${opt.value} ${face.label}`}
                        onClick={() => setZoom(face)}
                        title="Tap to zoom in"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '120px',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          cursor: 'zoom-in',
                        }}
                      />
                    </div>
                    <div className="text-center text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                      {face.label}
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 mt-2 cursor-pointer" style={{ minHeight: '32px' }}>
                <input
                  type="checkbox"
                  checked={isSel}
                  disabled={saved}
                  onChange={() => setSelected(isSel ? null : opt.value)}
                  style={{ width: '20px', height: '20px' }}
                />
                <span className={`text-sm font-semibold ${isSel ? 'text-brand-coral' : 'text-brand-navy'}`}>
                  {opt.value}
                </span>
              </label>
            </div>
          )
        })}
      </div>

      {/* Print details so Victoria knows what to put on the cards */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-brand-navy mb-2">What goes on your cards</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Agent name" value={form.name} onChange={setField('name')} disabled={saved} />
          <input className={inputCls} type="email" placeholder="Email address" value={form.email} onChange={setField('email')} disabled={saved} />
          <input
            className={inputCls}
            type="tel"
            inputMode="numeric"
            maxLength={14}
            placeholder="Phone — (817) 360-5555"
            value={form.phone}
            onChange={setField('phone')}
            disabled={saved}
          />
          <input className={inputCls} placeholder="@instagram (optional)" value={form.instagram} onChange={setField('instagram')} disabled={saved} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Website (optional)" value={form.website} onChange={setField('website')} disabled={saved} />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm text-center">{error}</div>
      )}

      {saved ? (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm text-center">
          ✓ {selected} saved — we'll print and order your cards with these details.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full px-6 py-3 bg-brand-coral text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-coral/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide"
        >
          {saving ? 'Saving...' : 'Save My Card Choice & Details'}
        </button>
      )}

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={zoom.src}
            alt={zoom.label}
            style={{ maxWidth: '96vw', maxHeight: '86vh', borderRadius: '10px', boxShadow: '0 12px 48px rgba(0,0,0,0.6)' }}
          />
          <p style={{ color: 'white', marginTop: '14px', fontSize: '14px' }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  )
}
