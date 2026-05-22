import Link from 'next/link'

const TOTAL_PAGES = 5

export default function Breadcrumb({ currentPage }) {
  return (
    <nav className="sticky top-20 z-40 bg-white border-b border-gray-200 py-4">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Home link */}
          <Link href="/page/1" className="text-sm text-brand-coral hover:text-brand-coral/80 font-medium transition-colors">
            ← Back to Start
          </Link>

          <span className="text-gray-300">|</span>

          {/* Step indicators */}
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
        </div>
      </div>
    </nav>
  )
}
