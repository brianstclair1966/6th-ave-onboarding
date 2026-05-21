import { useState } from 'react'

const TERMS = {
  'TREC': 'Texas Real Estate Commission — the regulatory body that licenses real estate professionals in Texas.',
  'IC Agreement': 'Independent Contractor Agreement — the contract that establishes you as a self-employed agent, not an employee.',
  'Independent Contractor': 'A self-employed worker who manages their own business, taxes, schedule, and expenses.',
  'MLS': 'Multiple Listing Service — the database of all properties for sale in your market.',
  'IABS': 'Information About Brokerage Services — a required Texas form you must give to every client at first contact.',
  'Realtor Association': 'A professional organization that provides MLS access, training, and resources to licensed agents.',
  'CDA': 'Compensation Disbursement Agreement — the form you submit to get paid your commission at closing.',
  'Rechat': 'Your client relationship management tool where you manage conversations, deals, and follow-ups.',
  'RealScout': 'Your lead generation and marketing platform — a branded search portal you share with clients.',
  'eKEY': 'Electronic key system for accessing lockboxes on properties.',
  'SUPRA Key': 'The physical or digital keybox system used to access properties for showings.',
  'Matrix': 'The MLS platform used in the DFW area for property searches and transactions.',
  'Unlock MLS': 'The MLS platform used in the Austin area for property searches and transactions.',
  'Headshot': 'Professional photograph of you featured on your bio page.',
  'Email Signature': 'The block of text at the bottom of your emails with your name, contact info, and legal disclosures.',
  'Brokerage': 'The real estate company (6th Ave Homes) that sponsors your license.',
  'NAR': 'National Association of Realtors — the national organization that sets the Code of Ethics.',
  'Code of Ethics': 'The professional standards and rules that all Realtors must follow.',
}

const sortedTerms = Object.entries(TERMS).sort(([a], [b]) => a.localeCompare(b))

export default function Glossary() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTerms = sortedTerms.filter(([term, def]) =>
    term.toLowerCase().includes(search.toLowerCase()) ||
    def.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-brand-coral text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:bg-brand-coral/90 transition-all duration-200 flex items-center justify-center"
        title="Open glossary"
        aria-label="Open glossary"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-brand-navy text-white p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Real Estate Terms</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white"
                aria-label="Close glossary"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-coral"
                autoFocus
              />
            </div>

            {/* Terms list */}
            <div className="overflow-y-auto flex-1 p-6">
              {filteredTerms.length > 0 ? (
                <div className="space-y-6">
                  {filteredTerms.map(([term, definition]) => (
                    <div key={term}>
                      <h3 className="font-bold text-brand-navy text-lg mb-2">{term}</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">{definition}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No terms found matching "{search}"</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
