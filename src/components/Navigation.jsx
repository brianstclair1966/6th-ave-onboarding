export default function Navigation({ pageNumber, onPrev, onNext, totalPages, nextDisabled = false }) {
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
              disabled={nextDisabled}
              className={`px-10 py-3 text-white font-bold rounded-lg min-h-12 flex items-center justify-center tracking-wide uppercase text-sm transition-all duration-200 ${
                nextDisabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-brand-coral hover:shadow-lg hover:shadow-brand-coral/50'
              }`}
            >
              Next →
            </button>
          ) : (
            <a
              href="https://www.6thavehomesagents.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-3 bg-green-600 text-white font-bold rounded-lg min-h-12 flex items-center justify-center tracking-wide uppercase text-sm hover:bg-green-700 transition-all duration-200 cursor-pointer"
            >
              Go to the Backsite
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
