import Link from 'next/link'
import { useState, useEffect } from 'react'
import useCheckboxState from '../hooks/useCheckboxState'

const TOTAL_PAGES = 8

export default function TopBar({ currentPage, sectionTitle }) {
  const { getCompletionPercentage } = useCheckboxState(currentPage)
  const [, setRefresh] = useState(0)

  // Re-render when checkbox state is updated (triggered by form submissions or checkbox toggles)
  useEffect(() => {
    const handleCheckboxUpdate = () => {
      setRefresh(prev => prev + 1)
    }

    // Listen for checkbox state updates
    window.addEventListener('checkboxStateUpdated', handleCheckboxUpdate)

    return () => {
      window.removeEventListener('checkboxStateUpdated', handleCheckboxUpdate)
    }
  }, [])

  // Pages 1-5: Onboarding system. Pages 6-8: Orientation system (separate)
  const isOrientation = currentPage >= 6
  const displayPageNum = isOrientation ? currentPage - 5 : currentPage
  const displayTotalPages = isOrientation ? 3 : 5
  const systemStartPage = isOrientation ? 6 : 1

  // Calculate percentage based on checkboxes checked
  const percentage = getCompletionPercentage()

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
