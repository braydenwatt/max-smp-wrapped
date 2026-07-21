import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import data from './wrapped.json'
import { Icon, Counter, Reveal, headUrl, fmt, fmt1, hoursToHuman } from './ui.jsx'

const totalsMeta = [
  { key: 'hours', label: 'Hours played', icon: 'clock' },
  { key: 'blocksMined', label: 'Blocks mined', icon: 'pickaxe' },
  { key: 'blocksPlaced', label: 'Blocks placed', icon: 'hammer' },
  { key: 'mobKills', label: 'Mobs slain', icon: 'skull' },
  { key: 'distanceKm', label: 'Kilometres travelled', icon: 'compass' },
  { key: 'deaths', label: 'Total deaths', icon: 'ghost' },
  { key: 'diamonds', label: 'Diamonds mined', icon: 'sparkles' },
  { key: 'trades', label: 'Villager trades', icon: 'coins' },
]

function tagFor(p) {
  const sup = data.superlatives.find((s) => s.uuid === p.uuid)
  if (sup) return sup.title
  const dm = p.movement.dominant
  if (dm && dm.label.includes('Elytra')) return 'Sky Dweller'
  if (p.grind.totalPlaced > p.grind.totalMined) return 'Builder'
  if (p.combat.mobKills > 20000) return 'Mob Slayer'
  return dm ? dm.label : 'Survivor'
}

export default function Home() {
  const { players, totals, superlatives, leaderboards, season, server } = data
  const [board, setBoard] = useState(0)
  const podium = superlatives
  const lb = leaderboards[board]

  return (
    <div className="ember-bg grain min-h-screen relative">
      {/* ---------- HERO ---------- */}
      <header className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-6 sm:pt-16 text-center relative z-10">
          <motion.img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Max SMP"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-3xl shadow-2xl ring-1 ring-ember-500/30 animate-floaty"
          />
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-6 font-display font-bold text-5xl sm:text-7xl tracking-tight"
          >
            <span className="gradient-heat text-glow">{server}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6 }}
            className="mt-2 text-lg sm:text-2xl font-semibold uppercase tracking-[0.35em] text-ember-200"
          >
            {season} · Wrapped
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            className="mt-5 text-ember-100/60 max-w-xl mx-auto"
          >
            {totals.players} players. One world. A whole season of grinding, dying, building and
            flying — measured to the last block. Pick your name below.
          </motion.p>
        </div>
      </header>

      {/* ---------- SERVER TOTALS ---------- */}
      <section className="max-w-6xl mx-auto px-5 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {totalsMeta.map((t, i) => (
            <Reveal key={t.key} delay={i * 0.04} y={20} className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 text-ember-300/80 mb-2">
                <Icon name={t.icon} className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">{t.label}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ember-50">
                <Counter value={totals[t.key]} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- SUPERLATIVES ---------- */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <SectionTitle icon="trophy" kicker="Season Superlatives" title="The Hall of Fame" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {podium.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.06} y={24}>
              <Link to={`/player/${s.uuid}`} className="card card-hover p-5 flex items-center gap-4 group">
                <img
                  src={headUrl(s.uuid, 96)}
                  alt={s.winner}
                  className="w-16 h-16 rounded-xl pixelated ring-1 ring-ember-500/30"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-gold">
                    <Icon name={s.icon} className="w-4 h-4 shrink-0" />
                    <span className="font-display font-bold text-lg truncate">{s.title}</span>
                  </div>
                  <div className="text-ember-50 font-semibold truncate">{s.winner}</div>
                  <div className="text-xs text-ember-100/50">{s.desc}</div>
                  <div className="mt-1 stat-num text-sm text-ember-300 font-semibold">
                    {s.stat} <span className="text-ember-100/40 font-normal">{s.unit}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- LEADERBOARD ---------- */}
      <section className="max-w-6xl mx-auto px-5 py-6">
        <SectionTitle icon="grid" kicker="Leaderboards" title="Who Topped the Charts" />
        <div className="flex flex-wrap gap-2 mt-6">
          {leaderboards.map((b, i) => (
            <button
              key={b.key}
              onClick={() => setBoard(i)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${
                i === board
                  ? 'bg-ember-500 text-ink shadow-lg shadow-ember-600/40'
                  : 'card text-ember-100/70 hover:text-ember-50'
              }`}
            >
              {b.key}
            </button>
          ))}
        </div>
        <div className="card mt-4 divide-y divide-ember-500/10">
          {lb.rows.map((r, i) => {
            const max = lb.rows[0].value || 1
            return (
              <Link
                key={r.uuid}
                to={`/player/${r.uuid}`}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-ember-500/5 transition relative"
              >
                <span
                  className={`w-7 text-center font-display font-bold ${
                    i === 0 ? 'text-gold text-xl' : i < 3 ? 'text-ember-300' : 'text-ember-100/40'
                  }`}
                >
                  {i + 1}
                </span>
                <img src={headUrl(r.uuid, 48)} alt="" className="w-9 h-9 rounded-lg pixelated" />
                <span className="font-semibold text-ember-50 w-32 sm:w-44 truncate">{r.name}</span>
                <div className="flex-1 hidden sm:block">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-ember-600 to-ember-400"
                    style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                  />
                </div>
                <span className="stat-num font-bold text-ember-100 tabular-nums w-24 text-right">
                  {fmt1(r.value)}
                  <span className="text-ember-100/40 text-xs ml-1">{lb.unit}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ---------- PLAYERS ---------- */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <SectionTitle icon="compass" kicker={`${players.length} Players`} title="Open Your Wrapped" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {players.map((p, i) => (
            <Reveal key={p.uuid} delay={(i % 4) * 0.05} y={24}>
              <Link to={`/player/${p.uuid}`} className="card card-hover p-4 sm:p-5 block group h-full">
                <div className="flex items-start justify-between">
                  <img
                    src={headUrl(p.uuid, 128)}
                    alt={p.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl pixelated ring-1 ring-ember-500/25 group-hover:ring-ember-400/60 transition"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-ember-500/15 text-ember-200 border border-ember-500/20">
                    {tagFor(p)}
                  </span>
                </div>
                <div className="mt-3 font-bold text-lg text-ember-50 truncate">{p.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-ember-100/55 text-sm">
                  <Icon name="clock" className="w-3.5 h-3.5" />
                  {hoursToHuman(p.playHours)} played
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ember-100/50">{fmt(p.combat.mobKills)} kills</span>
                  <span className="text-ember-300 font-semibold group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
                    View <Icon name="arrow-left" className="w-3.5 h-3.5 rotate-180" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="pb-10" />
    </div>
  )
}

function SectionTitle({ icon, kicker, title }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-ember-300 text-xs uppercase tracking-[0.25em] font-bold">
        <Icon name={icon} className="w-4 h-4" />
        {kicker}
      </div>
      <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-ember-50">{title}</h2>
    </div>
  )
}
