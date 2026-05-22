import Link from 'next/link'

const TOTAL_PAGES = 5

export default function TopBar({ currentPage }) {
  const percentage = (currentPage / TOTAL_PAGES) * 100

  return (
    <div className="fixed top-24 md:top-28 left-0 right-0 z-40 bg-white border-b border-gray-100 pt-3 pb-1 md:pt-6 md:pb-1">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Breadcrumbs - show on all pages */}
          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0 min-w-0">
            <Link href="/page/1" className="text-xs md:text-sm text-brand-coral hover:text-brand-coral/80 font-medium transition-colors whitespace-nowrap">
              ← Back
            </Link>
            <span className="text-gray-300 hidden md:inline text-xs">|</span>
            <div className="flex gap-0.5 md:gap-1.5">
              {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((pageNum) => (
                <div key={pageNum}>
                  {pageNum === currentPage ? (
                    <button
                      disabled
                      className="px-1 md:px-2 py-0.5 text-xs font-bold bg-brand-coral text-white rounded cursor-default"
                    >
                      {pageNum}
                    </button>
                  ) : (
                    <Link
                      href={`/page/${pageNum}`}
                      className="px-1 md:px-2 py-0.5 text-xs font-medium text-brand-coral hover:bg-brand-coral/10 rounded transition-colors"
                    >
                      {pageNum}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress percentage on right */}
          <div className="ml-auto">
            <span className="text-xs md:text-sm font-bold text-brand-coral">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
