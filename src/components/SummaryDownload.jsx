import { useState, useEffect } from 'react'
import { getPercentage, PROGRESS_EVENT } from '../lib/progress'

/**
 * Appears only once the agent reaches 100% completion. Offers a calm,
 * professional download of the onboarding summary PDF (a keepsake/reference).
 */
export default function SummaryDownload({ totalItems }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const update = () => setPct(getPercentage(totalItems))
    update()
    window.addEventListener(PROGRESS_EVENT, update)
    return () => window.removeEventListener(PROGRESS_EVENT, update)
  }, [totalItems])

  if (pct < 100) return null

  return (
    <div className="mt-12 p-6 md:p-8 bg-brand-cream border border-brand-coral/40 rounded-xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-coral mb-2">
        Onboarding &amp; Orientation Complete
      </p>
      <h3 className="text-xl md:text-2xl font-bold text-brand-navy mb-2">
        You've completed everything.
      </h3>
      <p className="text-brand-navy/80 mb-6 max-w-xl mx-auto">
        Here's your First 90-Day Reference Guide — office access, who to ask, your
        systems, and how we operate. Save it; you'll come back to it.
      </p>
      <a
        href="/6th-ave-first-90-days.pdf"
        download="6th Ave Homes - First 90-Day Reference Guide.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-8 py-3 bg-brand-coral text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-coral/50 transition-all duration-200 min-h-12 uppercase text-sm tracking-wide"
      >
        Download your 90-Day Reference Guide (PDF)
      </a>
    </div>
  )
}
