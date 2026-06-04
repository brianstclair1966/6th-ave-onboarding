import TopBar from './TopBar'
import Glossary from './Glossary'

export default function Page({ children, pageNumber, sectionTitle, totalItems }) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-navy text-white py-2 md:py-3 border-b-4 border-brand-coral">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 md:gap-6">
            <img src="/images/6th-ave-logo.png" alt="6th Ave Homes" className="h-10 md:h-16" />
            <div className="w-1 h-10 md:h-16 bg-brand-coral"></div>
            <h2 className="text-xl md:text-4xl font-bold text-white tracking-tight">
              {pageNumber >= 7 ? 'GUIDE ORIENTATION' : 'AGENT ONBOARDING'}
            </h2>
          </div>
        </div>
      </header>

      <TopBar currentPage={pageNumber} sectionTitle={sectionTitle} totalItems={totalItems} />

      <main className="flex-1 pt-40 md:pt-52">
        {children}
      </main>

      <Glossary />

      <footer className="bg-brand-navy text-gray-300 text-xs py-5 mt-24">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
          <img src="/Logos/6AH_Seal_Coral.png" alt="6th Ave Homes — Real Estate with Soul, Est. 2016" className="h-28 w-auto" />
          <p className="text-center text-gray-400 mt-1">Fort Worth, Texas</p>
        </div>
      </footer>
    </div>
  )
}
