import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { hydrate } from '../lib/progress'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Restore saved progress from localStorage once, on the client, after mount
    // (keeps server/client first render identical, then updates the bar).
    hydrate()
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-brand-cream text-gray-900 font-sans">
      <Component {...pageProps} />
    </div>
  )
}
