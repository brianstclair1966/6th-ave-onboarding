import { useRouter } from 'next/router'
import Link from 'next/link'

const PAGE_TITLES = {
  1: 'Welcome',
  2: 'Getting Active',
  3: 'Foundation',
  4: 'Client-Facing',
  5: 'Training',
}

export default function Breadcrumb({ currentPage }) {
  const router = useRouter()

  return (
    <nav className="max-w-4xl mx-auto px-6 py-4 text-sm">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/page/1" className="text-brand-coral hover:text-brand-coral/80 font-medium">
            Onboarding
          </Link>
        </li>
        {currentPage > 1 && (
          <>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-700">Step {currentPage} of 5</span>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700 font-medium">{PAGE_TITLES[currentPage]}</li>
          </>
        )}
      </ol>
    </nav>
  )
}
