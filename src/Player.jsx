import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import data from './wrapped.json'
import {
  Icon, Counter, BlockIcon, useReveal, bodyUrl, headUrl, fmt, fmt1, hoursToHuman, ticksToDuration,
} from './ui.jsx'

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
}

export default function Player() {
  const { uuid } = useParams()
  const player = data.players.find((p) => p.uuid === uuid)
  const titles = useMemo(() => data.superlatives.filter((s) => s.uuid === uuid), [uuid])
  const [copied, setCopied] = useState(false)

  if (!player) {
    return (
      <div className="ember-bg min-h-screen grid place-items-center text-center px-6">
        <div>
          <p className="text-ember-100/70 mb-4">That player isn't in this season's Wrapped.</p>
          <Link to="/" className="text-ember-300 font-semibold underline">Back to all players</Link>
        </div>
      </div>
    )
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const p = player
  const mv = p.movement
  const topModes = mv.modes.slice(0, 6)
  const maxMode = topModes[0]?.cm || 1
  const causes = Object.entries(p.deaths.causes).slice(0, 4)
  const maxCause = causes[0]?.[1] || 1
  const buildTotal = p.grind.totalPlaced + p.grind.totalMined || 1
  const buildPct = Math.round((p.grind.totalPlaced / buildTotal) * 100)

  return (
    <div className="snap-y-story ember-bg grain relative">
      {/* fixed chrome */}
      <div className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-ink/80 to-transparent">
        <Link to="/" className="inline-flex items-center gap-2 text-ember-100/80 hover:text-ember-50 font-semibold text-sm">
          <Icon name="arrow-left" className="w-4 h-4" /> All players
        </Link>
        <button onClick={share} className="inline-flex items-center gap-2 text-ember-100/80 hover:text-ember-50 font-semibold text-sm">
          <Icon name="share" className="w-4 h-4" /> {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* 1 — INTRO */}
      <Section>
        <div className="text-center">
          <motion.img
            src={bodyUrl(p.uuid, 380)}
            alt={p.name}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-56 sm:h-72 mx-auto pixelated drop-shadow-[0_20px_40px_rgba(255,90,31,0.35)]"
          />
          <motion.p variants={rise} initial="hidden" animate="show" custom={1}
            className="mt-6 uppercase tracking-[0.4em] text-ember-300 text-xs sm:text-sm font-bold">
            {data.server} · {data.season}
          </motion.p>
          <motion.h1 variants={rise} initial="hidden" animate="show" custom={2}
            className="mt-3 font-display font-bold text-5xl sm:text-7xl gradient-heat text-glow">
            {p.name}
          </motion.h1>
          <motion.p variants={rise} initial="hidden" animate="show" custom={3}
            className="mt-4 text-ember-100/70 text-lg">
            Here's your season, wrapped.
          </motion.p>
          <motion.div variants={rise} initial="hidden" animate="show" custom={4}
            className="mt-10 text-ember-100/40 text-sm flex flex-col items-center gap-1">
            <span>Scroll to begin</span>
            <Icon name="arrow-down" className="w-5 h-5 animate-bounce" />
          </motion.div>
        </div>
      </Section>

      {/* 2 — PLAYTIME */}
      <Section tint="from-ember-600/10">
        <Reveal>
          <Kicker icon="clock">Time in the world</Kicker>
          <H>
            You played <span className="gradient-heat"><Counter value={p.playHours} decimals={0} suffix=" hours" /></span>
          </H>
          <Lead>
            That's <b className="text-ember-100">{p.playDays} full days</b> living inside {data.server} —
            not sleeping, not eating, just <i>here</i>.
          </Lead>
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg mx-auto">
            <Mini label="Days lived" value={<Counter value={p.playDays} decimals={1} />} />
            <Mini label="Times slept" value={<Counter value={p.life.slept} />} />
            <Mini label="Longest survival" value={ticksToDuration(p.deaths.survivalStreakTicks)} raw />
          </div>
        </Reveal>
      </Section>

      {/* 3 — DEATH REEL */}
      <Section tint="from-blood-600/15">
        <Reveal>
          <Kicker icon="skull">The death reel</Kicker>
          <H>
            You died <span className="text-blood-400"><Counter value={p.deaths.total} /></span> times
          </H>
          {p.deaths.nemesis && (
            <Lead>
              And your nemesis? <b className="text-blood-400">{p.deaths.nemesis.name}</b> got you{' '}
              <b className="text-ember-100">{p.deaths.nemesis.count}</b> times. You two have history.
            </Lead>
          )}
          <div className="mt-8 max-w-lg mx-auto space-y-2.5 text-left">
            {causes.map(([name, n], i) => (
              <BarRow key={name} label={name} value={n} pct={(n / maxCause) * 100} color="blood" i={i} />
            ))}
          </div>
        </Reveal>
      </Section>

      {/* 4 — GRIND IDENTITY */}
      <Section tint="from-ember-700/12">
        <Reveal>
          <Kicker icon="pickaxe">Who you really are</Kicker>
          <H>
            <span className="gradient-heat"><Counter value={p.grind.diamonds} /></span> diamonds mined
          </H>
          {p.grind.topMined && (
            <Lead>
              …but <b className="text-ember-100">{fmt(p.grind.topMined.count)} {p.grind.topMined.name}</b>.
              Be honest about who you are.
            </Lead>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
            {p.grind.signature && (
              <Tile>
                <div className="flex items-center gap-3">
                  <BlockIcon id={p.grind.signature.id} size={44} className="rounded-md" />
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wider text-ember-300">Signature block</div>
                    <div className="font-bold text-ember-50">{p.grind.signature.name}</div>
                    <div className="text-sm text-ember-100/50">{fmt(p.grind.signature.count)} placed</div>
                  </div>
                </div>
              </Tile>
            )}
            <Tile>
              <div className="text-xs uppercase tracking-wider text-ember-300 mb-2 text-left">Builder vs Destroyer</div>
              <div className="h-3 rounded-full overflow-hidden bg-blood-700/40 flex">
                <div className="bg-gradient-to-r from-ember-400 to-gold" style={{ width: `${buildPct}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1.5 text-ember-100/60">
                <span>{fmt(p.grind.totalPlaced)} placed</span>
                <span>{fmt(p.grind.totalMined)} mined</span>
              </div>
            </Tile>
          </div>
          {p.grind.topMinedList?.length > 0 && (
            <div className="mt-4 max-w-2xl mx-auto flex flex-wrap justify-center gap-2">
              {p.grind.topMinedList.slice(0, 6).map((b) => (
                <span key={b.id} className="card px-3 py-2 inline-flex items-center gap-2 text-sm">
                  <BlockIcon id={b.id} size={22} className="rounded-sm" />
                  <span className="text-ember-100/80">{b.name}</span>
                  <span className="stat-num text-ember-300 font-semibold">{fmt(b.count)}</span>
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4 max-w-2xl mx-auto">
            <Mini label="Blocks mined" value={<Counter value={p.grind.totalMined} />} />
            <Mini label="Tools worn out" value={<Counter value={p.grind.toolsBroken} />} />
            <Mini label="Advancements" value={<Counter value={p.advancements} />} />
          </div>
        </Reveal>
      </Section>

      {/* 5 — YOUR PALETTE (building) */}
      {p.grind.topPlacedList?.length > 0 && (
        <Section tint="from-ember-500/12">
          <Reveal>
            <Kicker icon="hammer">Your palette</Kicker>
            <H>
              You placed <span className="gradient-heat"><Counter value={p.grind.totalPlaced} /></span> blocks
            </H>
            <Lead>
              Every base has a secret recipe. This is what {p.name}'s world is quietly made of.
            </Lead>
            <div className="mt-8 max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.grind.topPlacedList.slice(0, 8).map((b, i) => (
                <PaletteTile key={b.id} b={b} i={i} max={p.grind.topPlacedList[0]?.count || 1} />
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {/* 6 — COMBAT */}
      <Section tint="from-blood-500/12">
        <Reveal>
          <Kicker icon="sword">The combat log</Kicker>
          <H>
            <span className="gradient-heat"><Counter value={p.combat.mobKills} /></span> mobs slain
          </H>
          <Lead>
            You dealt <b className="text-ember-100">{fmt(p.combat.damageDealt)}</b> damage and took{' '}
            <b className="text-blood-400">{fmt(p.combat.damageTaken)}</b> back.
            {p.combat.playerKills > 0 && <> {p.combat.playerKills} of those kills were… other players.</>}
          </Lead>
          <div className="mt-8 max-w-lg mx-auto space-y-2.5 text-left">
            {p.combat.topKills.slice(0, 5).map((k, i) => (
              <BarRow
                key={k.id}
                label={k.name}
                value={k.count}
                pct={(k.count / (p.combat.topKills[0]?.count || 1)) * 100}
                color="ember"
                i={i}
              />
            ))}
          </div>
        </Reveal>
      </Section>

      {/* 6 — MOVEMENT FINGERPRINT */}
      <Section tint="from-ember-500/12">
        <Reveal>
          <Kicker icon="compass">Your movement fingerprint</Kicker>
          {mv.dominant && (
            <H>
              You're {aOrAn(mv.dominant.label)}{' '}
              <span className="gradient-heat">{mv.dominant.label.replace('-flew', ' flyer').replace('flew', 'flyer')}</span>
            </H>
          )}
          <Lead>
            You covered <b className="text-ember-100">{fmt1(mv.totalKm)} km</b> this season — about{' '}
            <b className="text-ember-100">{mv.comparison}</b>.
          </Lead>
          <div className="mt-8 max-w-lg mx-auto space-y-2 text-left">
            {topModes.map((m, i) => (
              <MoveBar key={m.label} m={m} i={i} maxMode={maxMode} />
            ))}
          </div>
        </Reveal>
      </Section>

      {/* 7 — CHAOS & LIFE */}
      <Section tint="from-ember-600/10">
        <Reveal>
          <Kicker icon="drumstick">Consumption & chaos</Kicker>
          {p.life.favFood ? (
            <H>
              <span className="gradient-heat"><Counter value={p.life.totalFood} /></span> meals eaten
            </H>
          ) : (
            <H><span className="gradient-heat"><Counter value={p.life.tnt} /></span> TNT detonated</H>
          )}
          {p.life.favFood && (
            <Lead>
              Your comfort food was <b className="text-ember-100">{p.life.favFood.name}</b> —{' '}
              {fmt(p.life.favFood.count)} of them.
            </Lead>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto">
            <Mini icon="tnt" label="TNT lit" value={<Counter value={p.life.tnt} />} />
            <Mini icon="coins" label="Villager trades" value={<Counter value={p.life.traded} />} />
            <Mini icon="spring" label="Jumps" value={<Counter value={p.life.jumps} />} />
            <Mini icon="sheep" label="Animals bred" value={<Counter value={p.life.bred} />} />
            <Mini icon="wand" label="Items enchanted" value={<Counter value={p.life.enchants} />} />
            <Mini icon="chest" label="Chests opened" value={<Counter value={p.life.chestsOpened} />} />
            <Mini icon="bed" label="Nights slept" value={<Counter value={p.life.slept} />} />
            <Mini icon="wave" label="Water buckets" value={<Counter value={p.life.waterPlaced} />} />
          </div>
        </Reveal>
      </Section>

      {/* 8 — SUPERLATIVES (payoff) */}
      {titles.length > 0 && (
        <Section tint="from-gold/15">
          <Reveal>
            <Kicker icon="trophy">Your season title{titles.length > 1 ? 's' : ''}</Kicker>
            <div className="grid gap-4 mt-4 max-w-xl mx-auto">
              {titles.map((t) => (
                <div key={t.title} className="card p-6 text-center border-gold/30">
                  <Icon name={t.icon} className="w-10 h-10 mx-auto text-gold" />
                  <div className="mt-3 font-display font-bold text-4xl sm:text-5xl gradient-heat">{t.title}</div>
                  <div className="mt-2 text-ember-100/70">{t.desc} — <b className="text-ember-100">{t.stat} {t.unit}</b></div>
                  <div className="mt-1 text-xs text-ember-100/40">#1 on the entire server</div>
                </div>
              ))}
            </div>
          </Reveal>
        </Section>
      )}

      {/* 9 — OUTRO */}
      <Section tint="from-ember-700/12">
        <Reveal>
          <img src={headUrl(p.uuid, 96)} alt="" className="w-16 h-16 rounded-xl pixelated mx-auto ring-1 ring-ember-500/30" />
          <H className="mt-5">That's a wrap, {p.name}.</H>
          <Lead>{data.server} {data.season} · {p.playDays} days well spent.</Lead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto">
            <Mini label="Hours" value={hoursToHuman(p.playHours)} raw />
            <Mini label="Deaths" value={fmt(p.deaths.total)} raw />
            <Mini label="Mob kills" value={fmt(p.combat.mobKills)} raw />
            <Mini label="Distance" value={`${fmt(mv.totalKm)} km`} raw />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={share} className="px-5 py-3 rounded-full bg-ember-500 text-ink font-bold inline-flex items-center gap-2 shadow-lg shadow-ember-600/40 hover:bg-ember-400 transition">
              <Icon name="share" className="w-4 h-4" /> {copied ? 'Link copied!' : 'Share this Wrapped'}
            </button>
            <Link to="/" className="px-5 py-3 rounded-full card font-semibold text-ember-100 hover:text-ember-50 inline-flex items-center gap-2">
              <Icon name="grid" className="w-4 h-4" /> All players
            </Link>
          </div>
        </Reveal>
      </Section>
    </div>
  )
}

/* ---------- section primitives ---------- */
function Section({ children, tint }) {
  return (
    <section className="snap-section relative grid place-items-center px-5 py-20">
      {tint && <div className={`absolute inset-0 bg-gradient-to-b ${tint} to-transparent pointer-events-none`} />}
      <div className="relative w-full max-w-3xl">{children}</div>
    </section>
  )
}
function Reveal({ children }) {
  const [ref, shown] = useReveal({ amount: 0.1 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {children}
    </motion.div>
  )
}
function Kicker({ icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 text-ember-300 text-xs uppercase tracking-[0.3em] font-bold mb-4">
      <Icon name={icon} className="w-4 h-4" /> {children}
    </div>
  )
}
function H({ children, className = '' }) {
  return <h2 className={`font-display font-bold text-4xl sm:text-6xl leading-[1.05] text-ember-50 ${className}`}>{children}</h2>
}
function Lead({ children }) {
  return <p className="mt-5 text-lg sm:text-xl text-ember-100/70 max-w-xl mx-auto leading-relaxed">{children}</p>
}
function Mini({ label, value, raw, icon }) {
  return (
    <div className="card p-4">
      {icon && <Icon name={icon} className="w-4 h-4 text-ember-300 mx-auto mb-1.5" />}
      <div className="text-2xl font-extrabold text-ember-50">{raw ? value : value}</div>
      <div className="text-[11px] uppercase tracking-wider text-ember-100/50 mt-1">{label}</div>
    </div>
  )
}
function Tile({ children }) {
  return <div className="card p-4">{children}</div>
}
function MoveBar({ m, i, maxMode }) {
  const [ref, shown] = useReveal({ amount: 0.05 })
  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="w-6 text-ember-300"><Icon name={m.icon} className="w-4 h-4" /></span>
      <span className="w-28 text-sm text-ember-100/70 shrink-0">{m.label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-ember-700/25 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={shown ? { width: `${Math.max(3, (m.cm / maxMode) * 100)}%` } : { width: 0 }}
          transition={{ delay: i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-ember-600 to-ember-300"
        />
      </div>
      <span className="w-20 text-right stat-num text-sm text-ember-100/80">{fmt1(m.km)} km</span>
    </div>
  )
}
function PaletteTile({ b, i, max }) {
  const [ref, shown] = useReveal({ amount: 0.05 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`card p-3 flex flex-col items-center gap-1.5 ${i === 0 ? 'col-span-2 sm:col-span-1 ring-1 ring-gold/40' : ''}`}
    >
      <BlockIcon id={b.id} size={i === 0 ? 52 : 40} className="rounded-md" />
      <div className="text-[11px] text-ember-100/70 text-center leading-tight line-clamp-2">{b.name}</div>
      <div className="stat-num text-sm font-bold text-ember-200">{fmt(b.count)}</div>
      <div className="w-full h-1 rounded-full bg-ember-700/25 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={shown ? { width: `${Math.max(8, (b.count / max) * 100)}%` } : { width: 0 }}
          transition={{ delay: i * 0.05 + 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold"
        />
      </div>
    </motion.div>
  )
}
function BarRow({ label, value, pct, color, i, block }) {
  const grad = color === 'blood' ? 'from-blood-600 to-blood-400' : 'from-ember-600 to-ember-300'
  const [ref, shown] = useReveal({ amount: 0.05 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
      transition={{ delay: i * 0.07, duration: 0.5 }}
      className="flex items-center gap-3"
    >
      {block && <BlockIcon id={block} size={24} className="rounded-sm shrink-0" />}
      <span className="w-32 text-sm text-ember-100/75 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-ember-700/25 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={shown ? { width: `${Math.max(4, pct)}%` } : { width: 0 }}
          transition={{ delay: i * 0.07 + 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${grad}`}
        />
      </div>
      <span className="w-14 text-right stat-num text-sm text-ember-100/80">{fmt(value)}</span>
    </motion.div>
  )
}

function aOrAn(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}
