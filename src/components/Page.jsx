export default function Page({ children }) {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="bg-brand-navy text-white py-4">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-xl font-semibold">6th Ave Homes</h1>
          <p className="text-sm text-gray-300">Agent Onboarding</p>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-100 text-gray-600 text-xs py-4 mt-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p>© 2026 6th Ave Homes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
