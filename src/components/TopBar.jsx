import Link from 'next/link'

const TOTAL_PAGES = 5

export default function TopBar({ currentPage }) {
  const percentage = (currentPage / TOTAL_PAGES) * 100

  return (
    <div className="fixed top-20 md:top-28 left-0 right-0 z-40 bg-white border-b border-gray-100 py-4">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Breadcrumbs on left - only show on pages 2+ */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 min-w-0">
            {currentPage > 1 && (
              <>
                <Link href="/page/1" className="text-xs md:text-sm text-brand-coral hover:text-brand-coral/80 font-medium transition-colors whitespace-nowrap">
                  ← Back
                </Link>
                <span className="text-gray-300 hidden md:inline">|</span>
                <div className="flex gap-0.5 md:gap-2">
                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((pageNum) => (
                    <div key={pageNum}>
                      {pageNum === currentPage ? (
                        <button
                          disabled
                          className="px-1.5 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-bold bg-brand-coral text-white rounded cursor-default"
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <Link
                          href={`/page/${pageNum}`}
                          className="px-1.5 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium text-brand-coral hover:bg-brand-coral/10 rounded transition-colors"
                        >
                          {pageNum}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Progress bar on right */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <span className="text-xs md:text-sm text-brand-navy font-medium whitespace-nowrap">Page {currentPage} of {TOTAL_PAGES}</span>
            <span className="text-xs md:text-sm font-bold text-brand-coral">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
