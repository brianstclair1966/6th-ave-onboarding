import Link from 'next/link'

const TOTAL_PAGES = 5

export default function TopBar({ currentPage }) {
  const percentage = (currentPage / TOTAL_PAGES) * 100

  return (
    <div className="sticky top-24 z-40 bg-white border-b border-gray-100 py-3">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Breadcrumbs on left - only show on pages 2+ */}
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <>
                <Link href="/page/1" className="text-sm text-brand-coral hover:text-brand-coral/80 font-medium transition-colors">
                  ← Back to Start
                </Link>
                <span className="text-gray-300">|</span>
                <div className="flex gap-2">
                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((pageNum) => (
                    <div key={pageNum}>
                      {pageNum === currentPage ? (
                        <button
                          disabled
                          className="px-3 py-1 text-sm font-bold bg-brand-coral text-white rounded cursor-default"
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <Link
                          href={`/page/${pageNum}`}
                          className="px-3 py-1 text-sm font-medium text-brand-coral hover:bg-brand-coral/10 rounded transition-colors"
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
          <div className="flex items-center gap-3 ml-4">
            <span className="text-sm text-brand-taupe font-medium">Page {currentPage} of {TOTAL_PAGES}</span>
            <span className="text-lg font-bold text-brand-coral">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
