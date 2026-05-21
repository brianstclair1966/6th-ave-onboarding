import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/page/1')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-cream">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy mb-4">
          6th Ave Homes Onboarding
        </h1>
        <p className="text-brand-taupe">Loading...</p>
      </div>
    </div>
  )
}
