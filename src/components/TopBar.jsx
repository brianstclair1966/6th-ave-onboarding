import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { getPercentage, resetProgress, PROGRESS_EVENT } from '../lib/progress'

const TOTAL_PAGES = 8

export default function TopBar({ currentPage, sectionTitle, totalItems }) {
  const router = useRouter()
  const [, setRefresh] = useState(0)

  // Re-render when session progress changes (checkbox toggles or form submissions).
  useEffect(() => {
    const handleProgressUpdate = () => {
      setRefresh(prev => prev + 1)
    }

    window.addEventListener(PROGRESS_EVENT, handleProgressUpdate)

    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleProgressUpdate)
    }
  }, [])

  // Pages 1-5: Onboarding system. Pages 6-8: Orientation system (separate)
  const isOrientation = currentPage >= 6
  const displayPageNum = isOrientation ? currentPage - 5 : currentPage
  const displayTotalPages = isOrientation ? 3 : 5
  const systemStartPage = isOrientation ? 6 : 1

  // Progress: completed items out of the build-time total (persists across visits).
  const percentage = getPercentage(totalItems)

  // A short milestone label shown alongside the percentage for emotional momentum.
  const milestone =
    percentage >= 100
      ? 'Ready to operate'
      : percentage >= 67
      ? 'Almost ready to operate'
      : percentage >= 34
      ? 'Foundation built'
      : percentage >= 1
      ? 'Building your foundation'
      : "Let's get started"

  // Reset progress to 0%, uncheck any visible boxes, and return to onboarding page 1.
  const handleStartOver = () => {
    resetProgress()
    document.querySelectorAll('.page-checkbox').forEach((cb) => {
      cb.checked = false
      cb.disabled = false
      cb.style.opacity = '1'
    })
    // Also clear the saved business-card pick and bio draft so they match the bar.
    try {
      localStorage.removeItem('businessCardSelection')
      localStorage.removeItem('businessCardDetails')
      localStorage.removeItem('bioDraft')
    } catch (e) {
      /* no-op */
    }
    router.push('/page/1')
  }

  return (
    <div className="fixed top-24 md:top-28 left-0 right-0 z-40 bg-white border-b border-gray-100 pt-3 pb-1 md:pt-6 md:pb-1">
      <div className="max-w-4xl md:max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Breadcrumbs - show on all pages */}
          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0 min-w-0">
            <Link href={currentPage >= 6 ? '/page/6' : '/page/1'} className="text-brand-coral hover:text-brand-coral/80 font-bold transition-colors flex flex-col items-center leading-none gap-0">
              {currentPage >= 6 ? (
                <>
                  <span className="text-xs">←</span>
                  <span className="text-xxs">Orientation</span>
                  <span className="text-xxs">Home</span>
                </>
              ) : (
                '← Home'
              )}
            </Link>
            <span className="text-brand-coral hidden md:inline text-xs">|</span>
            <div className="flex gap-0.5 md:gap-1.5">
              {Array.from({ length: displayTotalPages }, (_, i) => i + 1).map((displayNum) => {
                // Calculate actual page number (6-8 for orientation, 1-5 for onboarding)
                const actualPageNum = systemStartPage + displayNum - 1
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

          {/* Right side: Navigation link (orientation/onboarding) + Progress percentage */}
          <div className="ml-auto flex flex-col items-end gap-1">
            {isOrientation ? (
              <Link href="/page/1" className="text-xxs text-brand-taupe hover:text-brand-coral transition-colors font-medium whitespace-nowrap">
                ← Onboarding
              </Link>
            ) : (
              <Link href="/page/6" className="text-xxs text-brand-taupe hover:text-brand-coral transition-colors font-medium whitespace-nowrap">
                Orientation →
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xxs text-brand-taupe hidden sm:inline whitespace-nowrap">{milestone}</span>
              <span className="text-xs md:text-sm font-bold text-brand-coral">{percentage.toFixed(0)}%</span>
              <button
                type="button"
                onClick={handleStartOver}
                title="Reset your progress back to 0%"
                className="text-xxs text-brand-taupe hover:text-brand-coral underline transition-colors whitespace-nowrap"
              >
                Start over
              </button>
            </div>
          </div>
        </div>

        {/* Reassurance: progress is saved so agents never fear losing their place */}
        <p className="text-xxs text-brand-taupe/80 mt-0.5 text-right leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          ✓ Your progress saves automatically.
        </p>

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
