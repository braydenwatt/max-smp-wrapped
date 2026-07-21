#!/usr/bin/env python3
"""
Max SMP Wrapped - data pipeline.

Reads ONLY from the world folder's stats/ and advancements/ directories.
Mojang is used solely to turn a UUID into its CURRENT username + skin head
(that identity/skin is not stored in the world, by definition).

Output: src/wrapped.json  (consumed by the React app)
"""
import json, os, re, sys, time, urllib.request

WORLD = r"C:\Users\wattb\Downloads\world (2)\world"
STATS = os.path.join(WORLD, "stats")
ADV   = os.path.join(WORLD, "advancements")
OUT   = os.path.join(os.path.dirname(__file__), "src", "wrapped.json")
NAME_CACHE = os.path.join(os.path.dirname(__file__), ".names.json")
TEX_DIR = os.path.join(os.path.dirname(__file__), "public", "textures")
TEX_CDN = "https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets/data/1.21.1"

TICKS_PER_SEC = 20

# ---------- helpers ----------
def pretty(mc_id: str) -> str:
    """minecraft:diamond_ore -> Diamond Ore"""
    s = mc_id.split(":")[-1]
    return s.replace("_", " ").title()

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def is_offline_uuid(u: str) -> bool:
    # Floodgate/Bedrock + offline players use 00000000-0000-0000-0009-...
    return u.startswith("00000000-0000-0000")

# ---------- username resolution (identity only, via Mojang) ----------
def resolve_names(uuids):
    cache = {}
    if os.path.exists(NAME_CACHE):
        try: cache = load_json(NAME_CACHE)
        except: cache = {}
    for u in uuids:
        if u in cache: continue
        if is_offline_uuid(u):
            cache[u] = None
            continue
        raw = u.replace("-", "")
        url = f"https://sessionserver.mojang.com/session/minecraft/profile/{raw}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "maxsmp-wrapped/1.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                d = json.load(r)
            cache[u] = d.get("name")
            print(f"  resolved {u} -> {cache[u]}")
        except Exception as e:
            print(f"  FAILED {u}: {e}")
            cache[u] = None
        time.sleep(1.1)  # be gentle with the API
    with open(NAME_CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)
    return cache

# ---------- distance real-world comparison ----------
def distance_comparison(km):
    """Adaptive real-world comparison. Picks the largest reference the player
    clears, then expresses it as a clean multiplier ("2.4x the length of Italy")
    so every distance — short or absurd — gets a well-fitted line.
    The word "about" is added by the caller, so we never prefix it here."""
    refs = [
        (5, "a morning hike"),
        (21.1, "a half marathon"),
        (42.2, "a full marathon"),
        (100, "a 100 km ultramarathon"),
        (343, "the drive from London to Paris"),
        (1200, "the length of Italy"),
        (2400, "the length of the Mississippi River"),
        (4400, "the width of the United States"),
        (8000, "the flight from New York to Rome"),
        (12742, "a straight line through the centre of the Earth"),
        (20037, "a pole-to-pole trip across the planet"),
        (40075, "a full lap around the equator"),
        (100000, "two and a half laps of the planet"),
        (384400, "the entire distance to the Moon"),
    ]
    if km <= 0:
        return "barely a step"
    chosen = None
    for ref_km, phrase in refs:
        if km >= ref_km * 0.9:      # clear ~90% of it -> "about" or "Nx"
            chosen = (ref_km, phrase)
    if chosen is None:              # shorter than the smallest reference
        ref_km, phrase = refs[0]
        return f"{round(km / ref_km * 100)}% of {phrase}"
    ref_km, phrase = chosen
    ratio = km / ref_km
    if ratio <= 1.15:
        return phrase
    n = round(ratio, 1)
    n = int(round(n)) if n >= 10 else (int(n) if n == int(n) else n)
    return f"{n}x {phrase}"

# ---------- movement modes ----------
MOVE_MODES = {
    "minecraft:walk_one_cm":          ("Walked",      "boot"),
    "minecraft:sprint_one_cm":        ("Sprinted",    "flame"),
    "minecraft:crouch_one_cm":        ("Sneaked",     "eye"),
    "minecraft:swim_one_cm":          ("Swam",        "wave"),
    "minecraft:walk_on_water_one_cm": ("Strode water","wave"),
    "minecraft:walk_under_water_one_cm":("Walked seabed","wave"),
    "minecraft:fall_one_cm":          ("Fell",        "arrow-down"),
    "minecraft:climb_one_cm":         ("Climbed",     "arrow-up"),
    "minecraft:fly_one_cm":           ("Flew",        "sparkles"),
    "minecraft:aviate_one_cm":        ("Elytra-flew", "wings"),
    "minecraft:boat_one_cm":          ("Boated",      "boat"),
    "minecraft:minecart_one_cm":      ("Minecarted",  "cart"),
    "minecraft:horse_one_cm":         ("Rode a horse","horse"),
    "minecraft:strider_one_cm":       ("Rode a strider","lava"),
    "minecraft:pig_one_cm":           ("Rode a pig",  "pig"),
    "minecraft:happy_ghast_one_cm":   ("Rode a ghast","cloud"),
    "minecraft:nautilus_one_cm":      ("Dolphin-rode","dolphin"),
}

FOOD_ITEMS = {
    "minecraft:cooked_beef","minecraft:cooked_porkchop","minecraft:cooked_chicken",
    "minecraft:cooked_mutton","minecraft:cooked_rabbit","minecraft:cooked_cod",
    "minecraft:cooked_salmon","minecraft:bread","minecraft:golden_carrot",
    "minecraft:golden_apple","minecraft:enchanted_golden_apple","minecraft:apple",
    "minecraft:carrot","minecraft:potato","minecraft:baked_potato","minecraft:beetroot",
    "minecraft:melon_slice","minecraft:sweet_berries","minecraft:glow_berries",
    "minecraft:cookie","minecraft:pumpkin_pie","minecraft:cake","minecraft:mushroom_stew",
    "minecraft:rabbit_stew","minecraft:beetroot_soup","minecraft:suspicious_stew",
    "minecraft:dried_kelp","minecraft:honey_bottle","minecraft:chorus_fruit",
    "minecraft:tropical_fish","minecraft:cod","minecraft:salmon","minecraft:pufferfish",
    "minecraft:beef","minecraft:porkchop","minecraft:chicken","minecraft:mutton",
    "minecraft:rabbit","minecraft:rotten_flesh","minecraft:spider_eye",
    "minecraft:poisonous_potato","minecraft:milk_bucket","minecraft:glow_berry",
}

# Authoritative set of real block IDs (loaded at build time from minecraft-data).
# "minecraft:used" counts EVERY item use — eating, equipping armor, swinging tools —
# so we only treat a used item as "placed" if it's genuinely a block.
BLOCK_NAMES = set()
BLOCKS_CACHE = os.path.join(os.path.dirname(__file__), ".blocks.json")
BLOCKS_URL = "https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-data/data/pc/1.21.1/blocks.json"

def load_block_names():
    global BLOCK_NAMES
    if os.path.exists(BLOCKS_CACHE):
        BLOCK_NAMES = set(load_json(BLOCKS_CACHE))
        return
    req = urllib.request.Request(BLOCKS_URL, headers={"User-Agent": "maxsmp-wrapped/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    BLOCK_NAMES = {b["name"] for b in data}
    with open(BLOCKS_CACHE, "w", encoding="utf-8") as f:
        json.dump(sorted(BLOCK_NAMES), f)
    print(f"  loaded {len(BLOCK_NAMES)} block ids")

def looks_like_block(item_id):
    return item_id.split(":")[-1] in BLOCK_NAMES

def top_n(d, n=5):
    return sorted(d.items(), key=lambda kv: -kv[1])[:n]

# ---------- per-player computation ----------
def compute_player(uuid, name, stats, adv_count):
    s = stats.get("stats", {})
    custom  = s.get("minecraft:custom", {})
    mined   = s.get("minecraft:mined", {})
    used    = s.get("minecraft:used", {})
    crafted = s.get("minecraft:crafted", {})
    killed  = s.get("minecraft:killed", {})
    killedby= s.get("minecraft:killed_by", {})
    picked  = s.get("minecraft:picked_up", {})
    broken  = s.get("minecraft:broken", {})

    def c(k): return custom.get("minecraft:" + k, 0)

    play_ticks = c("play_time") or c("play_one_minute")
    play_hours = play_ticks / TICKS_PER_SEC / 3600
    play_days  = play_hours / 24

    # ----- movement -----
    modes = []
    total_cm = 0
    for key,(label,icon) in MOVE_MODES.items():
        v = custom.get(key, 0)
        if v > 0:
            modes.append({"label": label, "icon": icon, "cm": v, "km": round(v/100000, 2)})
        if key != "minecraft:fall_one_cm":   # falling isn't "travel"
            total_cm += v
    modes.sort(key=lambda m: -m["cm"])
    total_km = round(total_cm / 100000, 1)
    dominant = modes[0] if modes else None

    # ----- deaths -----
    deaths = c("deaths")
    death_causes = {pretty(k): v for k,v in killedby.items()}
    nemesis = max(killedby.items(), key=lambda kv: kv[1]) if killedby else None

    # ----- mining / grind -----
    diamonds = mined.get("minecraft:diamond_ore",0) + mined.get("minecraft:deepslate_diamond_ore",0)
    total_mined = sum(mined.values())
    top_mined = mined and max(mined.items(), key=lambda kv: kv[1]) or None
    # deepslate only generates below y=0 -> a proxy for time spent deep underground
    deepslate_mined = sum(v for k,v in mined.items() if "deepslate" in k)
    # signature placed block (from used, block-like)
    placed_blocks = {k:v for k,v in used.items() if looks_like_block(k)}
    total_placed = sum(placed_blocks.values())
    signature = max(placed_blocks.items(), key=lambda kv: kv[1]) if placed_blocks else None
    # tools destroyed
    tools_broken = sum(broken.values())
    pick_broken = sum(v for k,v in broken.items() if "pickaxe" in k)

    # ----- combat -----
    mob_kills = c("mob_kills")
    player_kills = c("player_kills")
    dmg_dealt = c("damage_dealt")
    dmg_taken = c("damage_taken")
    dmg_blocked = c("damage_blocked_by_shield")
    top_kills = top_n(killed, 6)

    # ----- consumption / chaos -----
    food_eaten = {k:v for k,v in used.items() if k in FOOD_ITEMS}
    total_food = sum(food_eaten.values())
    fav_food = max(food_eaten.items(), key=lambda kv: kv[1]) if food_eaten else None
    slept = c("sleep_in_bed")
    tnt = used.get("minecraft:tnt",0)
    water_placed = used.get("minecraft:water_bucket",0)
    bred = c("animals_bred")
    enchants = c("enchant_item")
    traded = c("traded_with_villager")
    talked = c("talked_to_villager")
    jumps = c("jump")
    chests = c("open_chest") + c("open_barrel") + c("open_shulker_box") + c("open_enderchest")
    fish_caught = c("fish_caught")

    return {
        "uuid": uuid,
        "name": name,
        "playHours": round(play_hours, 1),
        "playDays": round(play_days, 1),
        "playTicks": play_ticks,
        "advancements": adv_count,
        "movement": {
            "totalKm": total_km,
            "comparison": distance_comparison(total_km),
            "dominant": dominant,
            "modes": modes,
        },
        "deaths": {
            "total": deaths,
            "causes": dict(sorted(death_causes.items(), key=lambda kv:-kv[1])),
            "nemesis": {"id": nemesis[0], "name": pretty(nemesis[0]), "count": nemesis[1]} if nemesis else None,
            "survivalStreakTicks": c("time_since_death"),
        },
        "grind": {
            "diamonds": diamonds,
            "totalMined": total_mined,
            "topMined": {"id": top_mined[0], "name": pretty(top_mined[0]), "count": top_mined[1]} if top_mined else None,
            "totalPlaced": total_placed,
            "signature": {"id": signature[0], "name": pretty(signature[0]), "count": signature[1]} if signature else None,
            "toolsBroken": tools_broken,
            "picksBroken": pick_broken,
            "deepslateMined": deepslate_mined,
            "topMinedList": [{"id":k,"name":pretty(k),"count":v} for k,v in top_n(mined,6)],
            "topPlacedList": [{"id":k,"name":pretty(k),"count":v} for k,v in top_n(placed_blocks,8)],
        },
        "combat": {
            "mobKills": mob_kills,
            "playerKills": player_kills,
            "damageDealt": dmg_dealt,
            "damageTaken": dmg_taken,
            "damageBlocked": dmg_blocked,
            "topKills": [{"id":k,"name":pretty(k),"count":v} for k,v in top_kills],
        },
        "life": {
            "totalFood": total_food,
            "favFood": {"id": fav_food[0], "name": pretty(fav_food[0]), "count": fav_food[1]} if fav_food else None,
            "slept": slept,
            "tnt": tnt,
            "waterPlaced": water_placed,
            "bred": bred,
            "enchants": enchants,
            "traded": traded,
            "talked": talked,
            "jumps": jumps,
            "chestsOpened": chests,
            "fishCaught": fish_caught,
        },
    }

# ---------- superlatives ----------
def build_superlatives(players):
    # (title, description, icon, value-fn, unit, decimals)
    # A "most X" award has exactly ONE correct holder — the true #1 in that stat.
    # We award it there, period. If one player genuinely dominates several
    # categories, they hold several titles: that's the honest result, not a bug.
    defs = [
        ("The Architect",       "Most blocks placed",   "hammer",    lambda p: p["grind"]["totalPlaced"],  "blocks placed", 0),
        ("The Nomad",           "Most distance travelled","compass",  lambda p: p["movement"]["totalKm"],   "km",            1),
        ("The Spelunker",       "Most blocks mined",    "pickaxe",   lambda p: p["grind"]["totalMined"],   "blocks mined",  0),
        ("The Menace",          "Most TNT detonated",   "bomb",      lambda p: p["life"]["tnt"],           "TNT",           0),
        ("The Reaper",          "Most mob kills",       "skull",     lambda p: p["combat"]["mobKills"],    "kills",         0),
        ("The Glutton",         "Most food eaten",      "drumstick", lambda p: p["life"]["totalFood"],     "eaten",         0),
        ("The Merchant",        "Most villager trades", "coins",     lambda p: p["life"]["traded"],        "trades",        0),
        ("The Cat-with-9-Lives","Most deaths",          "ghost",     lambda p: p["deaths"]["total"],       "deaths",        0),
        ("The Enchanter",       "Most items enchanted", "wand",      lambda p: p["life"]["enchants"],      "enchants",      0),
        ("The Grave Robber",    "Most chests opened",   "chest",     lambda p: p["life"]["chestsOpened"],  "chests",        0),
        ("The Shepherd",        "Most animals bred",    "sheep",     lambda p: p["life"]["bred"],          "bred",          0),
        ("The Marathoner",      "Most hours played",    "clock",     lambda p: p["playHours"],             "hours",         1),
        ("The Warlord",         "Most player kills",    "swords",    lambda p: p["combat"]["playerKills"], "PvP kills",     0),
        ("The Jumping Bean",    "Most jumps",           "spring",    lambda p: p["life"]["jumps"],         "jumps",         0),
        ("The Completionist",   "Most advancements",    "trophy",    lambda p: p["advancements"],          "advancements",  0),
        ("The Fisherman",       "Most fish caught",     "wave",      lambda p: p["life"]["fishCaught"],    "fish caught",   0),
        ("The Mole",            "Most deepslate mined", "pickaxe",   lambda p: p["grind"]["deepslateMined"],"deepslate mined",0),
    ]
    out = []
    for title, desc, icon, fn, unit, dec in defs:
        winner = max(players, key=lambda p: (fn(p) or 0))
        v = fn(winner) or 0
        if v <= 0:
            continue
        out.append({
            "title": title, "desc": desc, "icon": icon,
            "winner": winner["name"], "uuid": winner["uuid"],
            "value": v, "unit": unit,
            "stat": f"{v:,.{dec}f}",
        })
    return out

    # some blocks store their texture under a differently-named file
TEX_ALIAS = {
    "grass_block": "blocks/grass_block_side", "magma_block": "blocks/magma",
    "melon": "blocks/melon_side", "smooth_sandstone": "blocks/sandstone_top",
    "spruce_slab": "blocks/spruce_planks", "tall_grass": "blocks/tall_grass_top",
    "carrots": "blocks/carrots_stage3", "potatoes": "blocks/potatoes_stage3",
    "beetroots": "blocks/beetroots_stage3", "fire": "blocks/fire_0",
    "pale_oak_log": "blocks/pale_oak_log", "bee_nest": "blocks/bee_nest_front",
    "waxed_copper_block": "blocks/copper_block",
    # slabs / stairs / fences reuse their base block's texture
    "cherry_stairs": "blocks/cherry_planks", "cobblestone_slab": "blocks/cobblestone",
    "oak_fence": "blocks/oak_planks", "oak_slab": "blocks/oak_planks",
    "oak_stairs": "blocks/oak_planks", "spruce_stairs": "blocks/spruce_planks",
    "spruce_slab": "blocks/spruce_planks", "stone_brick_slab": "blocks/stone_bricks",
    "stone_slab": "blocks/stone", "smooth_stone_slab": "blocks/smooth_stone",
    "polished_deepslate_slab": "blocks/polished_deepslate",
    "bone_block": "blocks/bone_block_side", "snow_block": "blocks/snow",
    "crafting_table": "blocks/crafting_table_top", "white_bed": "blocks/white_wool",
    "scaffolding": "blocks/scaffolding_top", "ender_chest": "blocks/obsidian",
    "cherry_fence": "blocks/cherry_planks", "deepslate_tile_wall": "blocks/deepslate_tiles",
    "polished_tuff_wall": "blocks/polished_tuff", "chest": "blocks/oak_planks",
    "lectern": "blocks/oak_planks",
}

def download_textures(ids):
    """Download each referenced block/item texture locally so the app is fully
    self-contained (no runtime dependency on an external texture CDN)."""
    os.makedirs(TEX_DIR, exist_ok=True)
    names = sorted({(i or "").split(":")[-1] for i in ids if i})
    got, missing = 0, []
    for name in names:
        dest = os.path.join(TEX_DIR, name + ".png")
        if os.path.exists(dest):
            got += 1; continue
        candidates = [f"blocks/{name}", f"items/{name}"]
        if name in TEX_ALIAS:
            candidates.insert(0, TEX_ALIAS[name])
        ok = False
        for path in candidates:
            try:
                req = urllib.request.Request(f"{TEX_CDN}/{path}.png",
                                             headers={"User-Agent": "maxsmp-wrapped/1.0"})
                with urllib.request.urlopen(req, timeout=15) as r:
                    if r.status == 200:
                        with open(dest, "wb") as f:
                            f.write(r.read())
                        ok = True; got += 1; break
            except Exception:
                continue
        if not ok:
            missing.append(name)
    print(f"  textures: {got} downloaded, {len(missing)} missing" +
          (f" ({', '.join(missing[:8])}{'…' if len(missing) > 8 else ''})" if missing else ""))
    flatten_animated_textures()

def flatten_animated_textures():
    """Animated block textures (magma, prismarine, fire, ...) are stored as a
    vertical strip of frames (w x N*w). Crop each to its top square frame so it
    renders as a single still frame. Idempotent — square textures are left alone."""
    try:
        from PIL import Image
    except ImportError:
        print("  (Pillow not installed — skipping animated-texture flattening)")
        return
    flattened = 0
    for f in os.listdir(TEX_DIR):
        if not f.endswith(".png"):
            continue
        p = os.path.join(TEX_DIR, f)
        try:
            im = Image.open(p)
            w, h = im.size
            if h > w:  # vertical animation strip -> keep only the top frame
                im.crop((0, 0, w, w)).save(p)
                flattened += 1
        except Exception:
            continue
    if flattened:
        print(f"  flattened {flattened} animated textures to a single frame")

def build_leaderboards(players):
    def board(key, fn, unit):
        ranked = sorted(players, key=lambda p: -(fn(p) or 0))
        return {"key": key, "unit": unit,
                "rows": [{"name": p["name"], "uuid": p["uuid"], "value": fn(p)} for p in ranked[:10]]}
    return [
        board("Hours Played",     lambda p: p["playHours"], "h"),
        board("Distance (km)",    lambda p: p["movement"]["totalKm"], "km"),
        board("Mob Kills",        lambda p: p["combat"]["mobKills"], ""),
        board("Blocks Mined",     lambda p: p["grind"]["totalMined"], ""),
        board("Blocks Placed",    lambda p: p["grind"]["totalPlaced"], ""),
        board("Deaths",           lambda p: p["deaths"]["total"], ""),
        board("Diamonds",         lambda p: p["grind"]["diamonds"], ""),
        board("Villager Trades",  lambda p: p["life"]["traded"], ""),
    ]

# ---------- main ----------
def main():
    print("Loading block list...")
    load_block_names()
    files = [f for f in os.listdir(STATS) if f.endswith(".json")]
    uuids = [f[:-5] for f in files]
    print(f"Found {len(uuids)} stats files. Resolving names...")
    names = resolve_names(uuids)

    players = []
    for f in files:
        uuid = f[:-5]
        name = names.get(uuid)
        if not name:
            # offline/Bedrock alt we can't resolve -> skip (all are marginal accounts)
            continue
        stats = load_json(os.path.join(STATS, f))
        adv_count = 0
        adv_path = os.path.join(ADV, f)
        if os.path.exists(adv_path):
            try:
                a = load_json(adv_path)
                adv_count = sum(1 for k,v in a.items()
                                if isinstance(v, dict) and v.get("done") and not k.startswith("minecraft:recipes"))
            except: pass
        p = compute_player(uuid, name, stats, adv_count)
        if p["playHours"] < 0.1:
            continue
        players.append(p)

    players.sort(key=lambda p: -p["playHours"])
    print(f"Built {len(players)} players")

    # collect every block/item texture the UI references and pull them locally
    tex_ids = set()
    for p in players:
        if p["grind"]["signature"]: tex_ids.add(p["grind"]["signature"]["id"])
        for b in p["grind"]["topMinedList"]: tex_ids.add(b["id"])
        for b in p["grind"]["topPlacedList"]: tex_ids.add(b["id"])
    print("Downloading textures...")
    download_textures(tex_ids)

    # server totals
    totals = {
        "players": len(players),
        "hours": round(sum(p["playHours"] for p in players)),
        "deaths": sum(p["deaths"]["total"] for p in players),
        "mobKills": sum(p["combat"]["mobKills"] for p in players),
        "blocksMined": sum(p["grind"]["totalMined"] for p in players),
        "blocksPlaced": sum(p["grind"]["totalPlaced"] for p in players),
        "distanceKm": round(sum(p["movement"]["totalKm"] for p in players)),
        "diamonds": sum(p["grind"]["diamonds"] for p in players),
        "tnt": sum(p["life"]["tnt"] for p in players),
        "trades": sum(p["life"]["traded"] for p in players),
    }

    data = {
        "season": "Season 3",
        "server": "Max SMP",
        "players": players,
        "superlatives": build_superlatives(players),
        "leaderboards": build_leaderboards(players),
        "totals": totals,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {OUT}  ({os.path.getsize(OUT)//1024} KB)")

if __name__ == "__main__":
    main()
