# Max SMP · Season 3 Wrapped

A Spotify-Wrapped-style stats site for the **Max SMP Season 3** Minecraft world.
Homepage shows every player as a card (live current skin head + headline stats);
click a card to walk through that player's animated, scroll-through "Wrapped".

Dark red / orange / black ember theme, built with React + Vite + Tailwind + Framer Motion.

![logo](public/logo.png)

## What it shows

**Homepage**
- Server totals (hours, blocks mined/placed, mobs slain, distance, deaths, diamonds, trades)
- **Hall of Fame** — 17 season superlatives (The Architect, The Nomad, The Menace, The Reaper,
  The Fisherman, The Mole, …), each awarded to the **true #1** in that stat, with the winning
  number shown for transparency
- Interactive **leaderboards** (8 categories)
- Grid of all players → each links to their Wrapped

**Per-player Wrapped** (full-screen scroll-snap story)
1. Intro (live 3D skin render)
2. Playtime, reframed into days lived
3. The death reel — deaths, your *nemesis*, cause breakdown
4. Grind identity — diamonds vs. what you *actually* mined, signature block, builder-vs-destroyer
5. **Your palette** — the blocks your base is secretly made of (top placed blocks + textures)
6. Combat log — mob kills, top kills, damage dealt/taken
7. Movement fingerprint — dominant travel mode + distance, with an adaptive real-world comparison
8. Consumption & chaos — food, TNT, trades, jumps, enchants, chests, sleep
9. Your season title(s)
10. Outro recap + share link

## Data source

**All gameplay stats come only from the world folder** — nothing is pulled from any
other server directory:

```
C:\Users\wattb\Downloads\world (2)\world\stats\*.json        (vanilla statistics)
C:\Users\wattb\Downloads\world (2)\world\advancements\*.json (advancement counts)
```

The only thing not stored in the world is player *identity* — a stats file is keyed by
UUID. So `build_data.py` calls Mojang **once per UUID** purely to turn a UUID into its
**current username**, and skin heads render live from `mc-heads.net` (that's what
"current skin" means — it can't come from the world save). Block/item textures are
downloaded once at build time into `public/textures/` so the app is otherwise
self-contained.

Offline/Bedrock (Geyser) alt accounts can't be resolved by Mojang and had negligible
playtime, so they're skipped. 26 Java players are included.

## Run it

```bash
cd max-smp-wrapped
npm install
npm run dev        # http://localhost:5173
```

## Rebuild the stats

Re-run the pipeline after pointing `WORLD` in `build_data.py` at a fresh save
(usernames + textures are cached in `.names.json` / `public/textures`, so this is fast):

```bash
npm run data       # = python build_data.py  -> writes src/wrapped.json
```

## Build for hosting

```bash
npm run build      # static site in dist/  — drop on any static host
npm run preview
```

## Notes / limitations

Some Wrapped ideas need a server-side logging plugin that records position and events
over time (death coordinates, PvP kill-by-player, proximity "your person", chat words,
cursed locations, AFK ratio, session lengths). Vanilla `stats/*.json` doesn't retain
those, so this build covers everything derivable from the save. If the server keeps
those logs, they could be layered in later as extra segments.
