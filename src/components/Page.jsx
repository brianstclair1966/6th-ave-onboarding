import Breadcrumb from './Breadcrumb'
import Glossary from './Glossary'

export default function Page({ children, pageNumber }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <header className="bg-brand-navy text-white py-6 border-b-4 border-brand-coral">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight">6th Ave Homes</h1>
            <div className="w-1 h-6 bg-brand-coral"></div>
            <p className="text-sm font-light text-gray-200 tracking-wide">AGENT ONBOARDING</p>
          </div>
        </div>
      </header>

      {pageNumber > 1 && <Breadcrumb currentPage={pageNumber} />}

      <main className="flex-1">
        {children}
      </main>

      <Glossary />

      <footer className="bg-brand-navy text-gray-300 text-xs py-8 mt-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border-t border-gray-700 pt-6">
            <p className="text-center">© 2026 6th Ave Homes. All rights reserved.</p>
            <p className="text-center text-gray-400 mt-2">Welcome to the team.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
