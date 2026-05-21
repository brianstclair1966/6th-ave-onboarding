export default function Navigation({ pageNumber, onPrev, onNext, totalPages }) {
  const showBack = pageNumber > 1
  const showNext = pageNumber < totalPages

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 py-6">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex justify-between items-center gap-4">
          {showBack ? (
            <button
              onClick={onPrev}
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors min-h-12 flex items-center justify-center"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {showNext ? (
            <button
              onClick={onNext}
              className="px-8 py-3 bg-brand-coral text-white font-semibold rounded hover:bg-opacity-90 transition-colors min-h-12 flex items-center justify-center"
            >
              Next →
            </button>
          ) : (
            <button
              disabled
              className="px-8 py-3 bg-brand-coral text-white font-semibold rounded opacity-50 cursor-not-allowed min-h-12 flex items-center justify-center"
            >
              ✓ Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
