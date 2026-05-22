import Breadcrumb from './Breadcrumb'
import Glossary from './Glossary'

export default function Page({ children, pageNumber }) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <header className="sticky top-0 z-50 bg-brand-navy text-white py-3 border-b-4 border-brand-coral">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-6">
            <img src="/images/6th-ave-logo.png" alt="6th Ave Homes" className="h-16" />
            <div className="w-1 h-16 bg-brand-coral"></div>
            <h2 className="text-4xl font-bold text-white tracking-tight">AGENT ONBOARDING</h2>
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
