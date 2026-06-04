/**
 * Compact reference-guide download card shown near the end of Page 8.
 * Kept small on purpose — the page's "Welcome to 6th Ave Homes" line below it
 * carries the celebratory close, so this is just a clean grab-your-guide card.
 */
export default function SummaryDownload() {
  return (
    <div className="mt-8 px-4 py-4 bg-brand-cream border border-brand-coral/40 rounded-xl text-center max-w-md mx-auto">
      <h3 className="text-base font-bold text-brand-navy mb-1">Your First 90-Day Reference Guide</h3>
      <p className="text-sm text-brand-navy/80 mb-3">
        Office access, who to ask, your systems, and how we operate — save it and come back anytime.
      </p>
      <a
        href="/6th-ave-first-90-days.pdf"
        download="6th Ave Homes - First 90-Day Reference Guide.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-6 py-2.5 bg-brand-coral text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-coral/50 transition-all duration-200 uppercase text-xs tracking-wide"
      >
        Download the PDF
      </a>
    </div>
  )
}
