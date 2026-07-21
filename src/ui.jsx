import React, { useEffect, useRef, useState } from 'react'
import { animate, motion } from 'framer-motion'

/* ---------- scroll-based reveal ----------
   Drives "is this element in view" from scroll + resize events and
   getBoundingClientRect — NOT IntersectionObserver — so it works in every
   environment, including scroll-snap containers where IO can be unreliable. */
export function useReveal({ once = true, amount = 0.12 } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let sc = el.parentElement
    while (sc && sc !== document.body) {
      const oy = getComputedStyle(sc).overflowY
      if (oy === 'auto' || oy === 'scroll') break
      sc = sc.parentElement
    }
    const target = sc && sc !== document.body ? sc : window
    let done = false
    const check = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const visible = r.top < vh * (1 - amount) && r.bottom > vh * amount
      if (visible) {
        setShown(true)
        if (once) cleanup()
      } else if (!once) setShown(false)
    }
    const onVis = () => document.visibilityState === 'visible' && check()
    const cleanup = () => {
      if (done) return
      done = true
      target.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      document.removeEventListener('visibilitychange', onVis)
    }
    target.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    document.addEventListener('visibilitychange', onVis)
    const raf = requestAnimationFrame(check) // initial check after layout
    const t = setTimeout(check, 250) // fallback if rAF is paused (e.g. tab was hidden on load)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      cleanup()
    }
  }, [once, amount])
  return [ref, shown]
}

/* Drop-in fade/rise reveal, triggered by useReveal (no IntersectionObserver). */
export function Reveal({ children, className = '', y = 28, delay = 0, once = true, amount = 0.12 }) {
  const [ref, shown] = useReveal({ once, amount })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- skins (current skin via mc-heads.net, keyed by UUID) ---------- */
export const headUrl = (uuid, size = 128) => `https://mc-heads.net/avatar/${uuid}/${size}`
export const head3dUrl = (uuid, size = 128) => `https://mc-heads.net/head/${uuid}/${size}`
export const bodyUrl = (uuid, size = 340) => `https://mc-heads.net/body/${uuid}/${size}`

/* ---------- formatting ---------- */
export const fmt = (n) => (n == null ? '—' : Math.round(n).toLocaleString('en-US'))
export const fmt1 = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 }))

export function hoursToHuman(h) {
  const d = Math.floor(h / 24)
  const r = Math.round(h % 24)
  if (d <= 0) return `${Math.round(h)}h`
  return `${d}d ${r}h`
}
export function ticksToDuration(ticks) {
  const sec = ticks / 20
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/* ---------- count-up number that fires when scrolled into view ----------
   Observes intersection against the nearest scrollable ancestor (so it works
   both on the document-scrolled homepage AND inside the scroll-snap story). */
const fmtLocale = (v, decimals) =>
  v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })

export function Counter({ value, decimals = 0, className = '', prefix = '', suffix = '' }) {
  const [ref, shown] = useReveal({ amount: 0.05 })
  const started = useRef(false)
  const [txt, setTxt] = useState(() => fmtLocale(0, decimals))
  useEffect(() => {
    if (!shown || started.current) return
    started.current = true
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setTxt(fmtLocale(v, decimals)),
    })
    return controls.stop
  }, [shown, value, decimals])
  return (
    <span ref={ref} className={`stat-num ${className}`}>
      {prefix}
      {txt}
      {suffix}
    </span>
  )
}

/* ---------- Minecraft block/item texture (bundled locally at build time) ----
   build_data.py downloads each referenced texture into public/textures, so the
   app is fully self-contained. Hides gracefully if a texture wasn't available. */
export function BlockIcon({ id, size = 40, className = '' }) {
  const name = (id || '').split(':').pop()
  const [ok, setOk] = useState(true)
  if (!name || !ok) return null
  return (
    <img
      src={`${import.meta.env.BASE_URL}textures/${name}.png`}
      onError={() => setOk(false)}
      width={size}
      height={size}
      alt={name}
      className={`pixelated ${className}`}
    />
  )
}

/* ---------- SVG icons (no emoji) ---------- */
const P = ({ d, ...r }) => <path d={d} {...r} />
export function Icon({ name, className = 'w-5 h-5', stroke = 2 }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const paths = {
    clock: <><circle cx="12" cy="12" r="9" /><P d="M12 7v5l3 2" /></>,
    skull: <><P d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14Z" /><circle cx="9" cy="12" r="1.6" fill="currentColor" /><circle cx="15" cy="12" r="1.6" fill="currentColor" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><P d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    pickaxe: <><P d="M3 21 12 12" /><P d="M4 9c4-4 10-5 16-4-4-2-9-2-13 1" /><P d="M9 4c4 4 5 10 4 16 2-4 2-9-1-13" /></>,
    sword: <><P d="M14.5 3.5 21 4l-.5 6.5L9 22l-3-3L17.5 7.5Z" /><P d="m6 19-3 2 1-4" /></>,
    hammer: <><P d="M14 6l4 4" /><P d="M17 3l4 4-3 3-4-4 3-3Z" /><P d="M14.5 9.5 4 20l-1-1L13.5 8.5" /></>,
    heart: <P d="M12 20s-7-4.6-9.3-9.2C1 7.5 2.7 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.3 0 5 3 3.3 6.3C19 15.4 12 20 12 20Z" />,
    drumstick: <><P d="M15 5a4 4 0 0 0-6 5l-1 1a2.5 2.5 0 1 0 3 3l1-1a4 4 0 0 0 5-6" /><P d="m5 19 2-2" /></>,
    bomb: <><circle cx="11" cy="14" r="7" /><P d="m16 9 2-2" /><P d="M18 7c0-1 .8-2 2-2" /></>,
    coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><P d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3" /><P d="M9 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><ellipse cx="15" cy="12" rx="6" ry="3" /></>,
    trophy: <><P d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><P d="M16 5h3v1a3 3 0 0 1-3 3M8 5H5v1a3 3 0 0 0 3 3" /><P d="M12 12v4M9 20h6M10 20v-2h4v2" /></>,
    wand: <><P d="m4 20 10-10" /><P d="M14 4v2M18 6v2M20 10h-2M16 8h-2" /><P d="m15 5 2 2" /></>,
    ghost: <><P d="M5 21v-9a7 7 0 0 1 14 0v9l-2.3-1.6L14 21l-2-1.6L10 21l-2.7-1.6L5 21Z" /><circle cx="9.5" cy="11" r="1" fill="currentColor" /><circle cx="14.5" cy="11" r="1" fill="currentColor" /></>,
    chest: <><rect x="3" y="8" width="18" height="12" rx="1.5" /><P d="M3 12h18M11 8V6a1 1 0 0 1 1-1 1 1 0 0 1 1 1v2" /><rect x="10.5" y="11" width="3" height="3" rx="0.5" fill="currentColor" /></>,
    sheep: <><P d="M7 13a4 4 0 1 1 3-7 4 4 0 0 1 5 1 3 3 0 0 1 1 6c0 2-2 3-5 3s-5-1-5-3Z" /><P d="M9 16v3M15 16v3" /></>,
    swords: <><P d="M14.5 3.5 21 4l-.5 6.5L14 17l-3-3 3.5-10.5Z" /><P d="M9.5 3.5 3 4l.5 6.5L10 17l3-3L9.5 3.5Z" /></>,
    spring: <><P d="M6 20h12" /><P d="M8 20c0-3 8-3 8-6s-8-3-8-6 8-3 8-4" /></>,
    boot: <><P d="M6 4h4v9l6 3a3 3 0 0 1 2 3v1H4v-6" /></>,
    flame: <P d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-1.5-.5-2 2 1 3.5 3 3.5 6a5 5 0 0 1-10 0c0-4 4-6 5-11Z" />,
    wings: <><P d="M12 4v14" /><P d="M12 6C9 4 5 4 3 6c0 5 3 8 9 9 6-1 9-4 9-9-2-2-6-2-9 0" /></>,
    wave: <P d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
    arrowUp: <><P d="M12 20V5" /><P d="m6 11 6-6 6 6" /></>,
    arrowDown: <><P d="M12 4v15" /><P d="m6 13 6 6 6-6" /></>,
    sparkles: <><P d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" /><P d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" /></>,
    boat: <><P d="M3 14h18l-2 5H5l-2-5Z" /><P d="M6 14V8l5-2 5 4v4" /></>,
    cart: <><rect x="4" y="9" width="16" height="7" rx="1" /><circle cx="8" cy="19" r="1.6" /><circle cx="16" cy="19" r="1.6" /></>,
    horse: <P d="M5 21c0-6 3-9 6-9l-1-3 3 1 2-3 1 4c2 1 3 3 3 6M5 21h4M15 21h4" />,
    pig: <><circle cx="12" cy="13" r="7" /><ellipse cx="12" cy="14" rx="3" ry="2" /><circle cx="10.5" cy="14" r=".7" fill="currentColor" /><circle cx="13.5" cy="14" r=".7" fill="currentColor" /></>,
    cloud: <P d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A3.5 3.5 0 0 1 17 18H7Z" />,
    dolphin: <P d="M4 12c6-8 16-6 16-6-2 4-1 8-6 10-4 1.6-8 0-10-2 2 0 3 0 4-1" />,
    lava: <P d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c2 1 3.5 3 3.5 6a5 5 0 0 1-10 0c0-4 4-6 5-11Z" />,
    eye: <><P d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    arrowLeft: <><P d="M19 12H5" /><P d="m12 19-7-7 7-7" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><P d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
    tnt: <><rect x="4" y="9" width="16" height="10" rx="1" /><P d="M4 12h16M12 9V6l2-2" /></>,
    bed: <><P d="M3 18v-6a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v4" /><P d="M3 14h18M3 18v-2M21 18v-4" /><circle cx="7" cy="12" r="1.4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  }
  const key = { 'arrow-up': 'arrowUp', 'arrow-down': 'arrowDown', 'arrow-left': 'arrowLeft' }[name] || name
  return (
    <svg {...common} aria-hidden="true">
      {paths[key] || paths.sparkles}
    </svg>
  )
}
