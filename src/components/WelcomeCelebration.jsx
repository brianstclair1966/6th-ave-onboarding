import { useEffect, useRef, useState } from 'react'

// Dependency-free confetti: several bursts from the bottom corners, arcing up and
// inward, in brand colors. Bigger pieces and multiple waves so it reads as a real
// celebration and lasts a good few seconds. Self-cleans when the pieces fall off.
function fireConfetti() {
  if (typeof window === 'undefined') return
  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:70;'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const W = canvas.width
  const H = canvas.height
  const colors = ['#ED6758', '#043853', '#F8F0E6', '#ffffff', '#ffcf5c', '#ff7f6b']
  const parts = []
  const spawn = (side) => {
    for (let i = 0; i < 120; i++) {
      parts.push({
        x: side === 'l' ? -10 : W + 10,
        y: H * 0.5 + Math.random() * H * 0.45,
        vx: (side === 'l' ? 1 : -1) * (7 + Math.random() * 9),
        vy: -(9 + Math.random() * 12),
        g: 0.18 + Math.random() * 0.1,
        size: 10 + Math.random() * 12,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
      })
    }
  }

  // Multiple waves spread over ~1.3s extend the show without a heavy one-shot burst.
  ;[0, 600, 1300].forEach((delay) => {
    setTimeout(() => {
      if (!document.body.contains(canvas)) return
      spawn('l')
      spawn('r')
    }, delay)
  })

  let frame = 0
  const tick = () => {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    parts.forEach((p) => {
      p.vy += p.g
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })
    const anyOnScreen = parts.some((p) => p.y < canvas.height + 60)
    // Keep running until the last wave has spawned and its pieces have fallen.
    if (frame < 130 || anyOnScreen) {
      requestAnimationFrame(tick)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(tick)
}

// The page-9 finale: when the page is completed (not on later revisits), the
// "Welcome to 6th Ave Homes" line pops, confetti fires, and a closeable
// "Welcome to the team!" card appears.
export default function WelcomeCelebration({ complete }) {
  const [celebrating, setCelebrating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const prev = useRef(complete)

  useEffect(() => {
    if (complete && !prev.current) {
      setCelebrating(true)
      setShowModal(true)
      fireConfetti()
    }
    prev.current = complete
  }, [complete])

  // Allow Escape to close the modal.
  useEffect(() => {
    if (!showModal) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  return (
    <>
      <p
        className={`welcome-celebrate${celebrating ? ' is-celebrating' : ''}`}
        style={{
          color: '#ED6758',
          fontSize: '2.75rem',
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: 'center',
          margin: '2rem 0 0.5rem',
        }}
      >
        Welcome to 6th Ave Homes
      </p>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to the team"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,56,83,0.55)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '40px 28px 32px',
              textAlign: 'center',
              boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
              border: '1px solid #eee',
              position: 'relative',
              animation: 'welcomePop 0.45s cubic-bezier(0.18,0.89,0.32,1.28)',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                fontSize: '26px',
                lineHeight: 1,
                color: '#9aa3a7',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <img
              src="/Logos/6AH_Seal_Coral.png"
              alt="6th Ave Homes"
              style={{ height: '90px', width: 'auto', margin: '0 auto 16px', display: 'block' }}
            />
            <h2 style={{ color: '#043853', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 10px' }}>
              Welcome to the team!
            </h2>
            <p style={{ color: '#5f6e74', fontSize: '1rem', lineHeight: 1.55, margin: '0 0 24px' }}>
              You've completed your onboarding. We're so glad you're here — let's go build
              something great together.
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: '#ED6758',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '12px 30px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Let's go! →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
