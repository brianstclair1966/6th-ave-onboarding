export default function Navigation({ pageNumber, onPrev, onNext, totalPages }) {
  const showBack = pageNumber > 1
  const showNext = pageNumber < totalPages

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 py-8 shadow-lg shadow-gray-200">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center gap-6">
          {showBack ? (
            <button
              onClick={onPrev}
              className="px-8 py-3 bg-gray-100 text-brand-navy font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 min-h-12 flex items-center justify-center tracking-wide uppercase text-sm"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {showNext ? (
            <button
              onClick={onNext}
              className="px-10 py-3 bg-brand-coral text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-coral/50 transition-all duration-200 min-h-12 flex items-center justify-center tracking-wide uppercase text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              disabled
              className="px-10 py-3 bg-green-600 text-white font-bold rounded-lg min-h-12 flex items-center justify-center tracking-wide uppercase text-sm"
            >
              ✓ You're Ready
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
