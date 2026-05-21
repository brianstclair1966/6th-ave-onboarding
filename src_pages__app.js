import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-brand-cream text-gray-900 font-sans">
      <Component {...pageProps} />
    </div>
  )
}
