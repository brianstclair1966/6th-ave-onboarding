import Link from 'next/link'

const TOTAL_PAGES = 6

export default function TopBar({ currentPage, sectionTitle }) {
  const percentage = (currentPage / TOTAL_PAGES) * 100

  // For pages 6+, show relative numbering (1-3) within the orientation phase
  const displayPageNum = currentPage >= 6 ? currentPage - 5 : currentPage
  const orientationPageCount = 3
  const displayTotalPages = currentPage >= 6 ? orientationPageCount : TOTAL_PAGES

  return (
    <div className="fixed top-24 md:top-28 left-0 right-0 z-40 bg-white border-b border-gray-100 pt-3 pb-1 md:pt-6 md:pb-1">
      <div className="max-w-4xl md:max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Breadcrumbs - show on all pages */}
          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0 min-w-0">
            <Link href={currentPage >= 6 ? '/page/6' : '/page/1'} className="text-xs md:text-sm text-brand-coral hover:text-brand-coral/80 font-bold transition-colors whitespace-nowrap">
              ← Home
            </Link>
            <span className="text-brand-coral hidden md:inline text-xs">|</span>
            <div className="flex gap-0.5 md:gap-1.5">
              {Array.from({ length: displayTotalPages }, (_, i) => i + 1).map((displayNum) => {
                // Calculate actual page number for navigation
                const actualPageNum = currentPage >= 6 ? displayNum + 5 : displayNum
                return (
                  <div key={actualPageNum}>
                    {displayNum === displayPageNum ? (
                      <button
                        disabled
                        className="px-1 md:px-2 py-0.5 text-xs font-bold bg-brand-coral text-white rounded cursor-default"
                      >
                        {displayNum}
                      </button>
                    ) : (
                      <Link
                        href={`/page/${actualPageNum}`}
                        className="px-1 md:px-2 py-0.5 text-xs font-medium text-brand-coral hover:bg-brand-coral/10 rounded transition-colors"
                      >
                        {displayNum}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress percentage on right */}
          <div className="ml-auto">
            <span className="text-xs md:text-sm font-bold text-brand-coral">{percentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Section title for pages 6+ */}
        {sectionTitle && currentPage >= 6 && (
          <div className="mt-2 md:mt-3">
            <p className="text-xs md:text-sm text-brand-navy font-medium">{sectionTitle}</p>
          </div>
        )}
      </div>
    </div>
  )
}
