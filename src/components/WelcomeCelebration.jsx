import { useEffect, useRef, useState } from 'react'

// Dependency-free confetti: two bursts from the bottom corners, arcing up and
// inward, in brand colors. Self-cleans when the particles fall off screen.
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
    for (let i = 0; i < 80; i++) {
      parts.push({
        x: side === 'l' ? -10 : W + 10,
        y: H * 0.55 + Math.random() * H * 0.4,
        vx: (side === 'l' ? 1 : -1) * (6 + Math.random() * 8),
        vy: -(7 + Math.random() * 10),
        g: 0.22 + Math.random() * 0.12,
        size: 6 + Math.random() * 8,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
      })
    }
  }
  spawn('l')
  spawn('r')
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
    if (frame < 260 && parts.some((p) => p.y < canvas.height + 40)) {
      requestAnimationFrame(tick)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(tick)
}

// The page-8 finale: "Welcome to 6th Ave Homes" that pops + sets off confetti
// the moment the page is completed (not on later revisits).
export default function WelcomeCelebration({ complete }) {
  const [celebrating, setCelebrating] = useState(false)
  const prev = useRef(complete)

  useEffect(() => {
    if (complete && !prev.current) {
      setCelebrating(true)
      fireConfetti()
    }
    prev.current = complete
  }, [complete])

  return (
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
  )
}
