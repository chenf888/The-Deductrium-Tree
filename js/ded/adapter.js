// TMT-side glue for the Deductrium kernel: the hyperbolic world, the formal system handle, the
// reward and gate economy, and the read-only fallback. The command grammar lives in ded/commands.js.
//
// Deleting js/deductrium/ must not break the game: DED.available stays false, every reader here
// falls back to the state mirrored in player.*, and the prestige tree stays playable.
//
// Kernel facts used below come from src/hy/hworld.ts, src/hy/ordinal.ts, src/hy/maploader.ts and the
// conversion report in tools/kernel_plan2.js — notably that HWorld.stepTo() is dead upstream
// (game.ts:508 calls getNeighborAndDir with 2 arguments), so tileFromDir() is the walking path.

var DED = {
    available: false,
    world: null,            // HWorld
    sys: null,              // FormalSystem returned by initFormalSystem(false)
    cmd: null,              // FSCmd, built by ded/commands.js
    error: "",
    canvas: null,           // offscreen surface HWorld's LocalDraw expects
    lobby: null,            // hash string of the "." tile the player starts on
}

function DED_kernelReady() {
    if (DED.available) return true
    if (typeof DED_KERNEL === "undefined" || !DED_KERNEL || !DED_KERNEL.has) return false
    if (!DED_KERNEL.has("hy/hworld.js") || !DED_KERNEL.has("fs/initial.js")) return false
    DED.available = true
    return true
}

// HWorld's constructor builds a LocalDraw, which wants a 2d context. This port never draws with it
// — the map is rendered through TMT's own grid component — so a no-op surface is used. That keeps
// the headless harness and the browser on the same code path (tools/smoke.js has no document).
function DED_canvas() {
    if (DED.canvas) return DED.canvas
    var ctx = new Proxy({}, {
        get: function (t, k) {
            if (k === "canvas") return canvas
            if (typeof t[k] !== "undefined") return t[k]
            return function () { return ctx }
        },
        set: function (t, k, v) { t[k] = v; return true },
    })
    var canvas = { width: 240, height: 160, style: {}, getContext: function () { return ctx } }
    DED.canvas = canvas
    return canvas
}

function DED_boot() {
    if (DED.world) return true
    if (!DED_kernelReady()) return false
    try {
        var canvas = DED_canvas()
        if (!canvas) return false
        DED.world = new (DED_KERNEL.req("hy/hworld.js").HWorld)(canvas)
        if (!DED.world || !DED.world.atlasTile) { DED.world = null; return false }
        DED_wireWorld()
        DED.lobby = DED_hashOf(DED.world.currentTile)          // the root tile is the lobby: "[]" ↔ ""
        if (!DED.sys) DED.sys = DED_KERNEL.req("fs/initial.js").initFormalSystem(false)
        DED_syncWorldFromSave()
        return true
    } catch (e) {
        DED.error = String(e && e.message ? e.message : e)
        if (typeof console !== "undefined" && console.warn) console.warn("[deductrium] boot failed: " + DED.error)
        DED.world = null
        return false
    }
}

// HWorld.hitTest() is the original's own gate: it consults onPassGate and hitReward, and the game
// answers through those two callbacks (src/hy/hworld.ts:92-112). Wiring them here means walking and
// paying stay on the upstream code path instead of a reimplementation of it.
function DED_wireWorld() {
    DED.world.onPassGate = function (name, tile, hash) {
        return DED_handleGate(name, tile, hash)
    }
    DED.world.onGetReward = function (hash, tile, isLoading) {
        if (isLoading) return
        DED_handleReward(hash, tile)
    }
    DED.world.onStepToAnotherTile = function () {
        player.tilesSeen = player.tilesSeen.add(1)
        player.geo.visited[DED_hashOf(DED.world.currentTile)] = true
        DED_syncWorldToSave()
    }
    DED.world.onStateChange = function () { }
    DED.world.onPassOrd = function (hash, ord) {
        player.geo.ordinals[DED_hashKey(hash)] = ord && ord.join ? ord.join(",") : String(ord)
    }
}

// A gate pays 推理素 and stays open (the original's gateTest costs, src/game.ts:99-211).
function DED_handleGate(name, tile, hash) {
    var price = DED_gatePrice(hash)
    if (DED_gateOpen(hash)) return true
    if (player.points.lt(price)) {
        DED_note(L("推理素不足：需要 ", "not enough Deductriums: needs ") + fmtDed(price))
        return false
    }
    player.points = player.points.sub(price).max(0)
    player.geo.openGates[DED_hashKey(hash)] = true
    player.gatesDestructed = player.gatesDestructed.add(1)
    DED_note(L("拆开闸门 ", "gate destructed: ") + TRC(tile.text || name || hash))
    DED_dispatchKeywords(tile.text, "gate")
    DED_log("gate " + hash + " for " + fmtDed(price))
    return true
}

function DED_handleReward(hash, tile) {
    var key = DED_hashKey(hash)
    if (player.geo.taken[key]) return
    player.geo.taken[key] = true
    var amount = DED_parseAmount(tile.text)
    if (amount.lte(0)) amount = new Decimal(TUNING.gateRewardBase).times(Math.pow(TUNING.rewardStep, DED_tileRow(hash)))
    DED_grant(amount.times(DED_rewardMult()))
    DED_note(L("拾取 ", "picked up ") + fmtDed(amount) + (tile.text ? " · " + TRC(tile.text) : ""))
    DED_dispatchKeywords(tile.text, "reward")
    DED_log("reward " + key + " = " + fmtDed(amount))
}

// --- tile access --------------------------------------------------------------------------------
// A TileHash is a Polygon object (with .to/.transformBy/.equals); its wire form is "1,2,3,…".
function DED_atlas() { return DED.world ? DED.world.atlasTile : null }

function DED_hashOf(tile) {
    if (tile === null || tile === undefined) return ""
    if (typeof tile === "string") return tile
    var atlas = DED_atlas()
    if (atlas && atlas.toStr) { try { return String(atlas.toStr(tile)) } catch (e) { } }
    if (tile.hash !== undefined) return String(tile.hash)
    if (Array.isArray(tile)) return tile.join(",")
    return String(tile)
}

function DED_blocks() {
    if (!DED_kernelReady()) return null
    try { return DED_KERNEL.req("hy/maploader.js").blockMap } catch (e) { return null }
}

function DED_names() {
    if (!DED_kernelReady()) return null
    try { return DED_KERNEL.req("hy/maploader.js").nameMap } catch (e) { return null }
}

function DED_nameToHash(name) {
    var map = DED_names()
    if (!map) return null
    try { return map.get(name) || map.get("[[" + name + "]]") || null } catch (e) { return null }
}

// Road=0 Wall=1 Gate=2 Reward=3 Ordinal=4 (TileBlockType, src/hy/maploader.ts)
function DED_blockTypeName(type) {
    var zh = ["道路", "墙", "闸门", "奖励", "序数"]
    var en = ["road", "wall", "gate", "reward", "ordinal"]
    return (chinesemode ? zh : en)[Math.max(0, Math.min(4, Number(type) || 0))]
}

function DED_blockAt(hash) {
    var blocks = DED_blocks()
    if (!blocks || hash === null || hash === undefined) return null
    try { return blocks.get(String(hash)) || null } catch (e) { return null }
}

function DED_currentHash() { return DED.world ? DED_hashOf(DED.world.currentTile) : "" }

function DED_currentBlock() { return DED_blockAt(DED_currentHash()) }

function DED_tileLabel(hash) {
    hash = hash === undefined ? DED_currentHash() : hash
    var tile = DED_blockAt(hash)
    if (tile && tile.name) return String(tile.name)
    if (hash === null || hash === undefined) return "—"
    return String(hash).length > 28 ? String(hash).slice(0, 25) + "…" : String(hash)
}

// --- walking ------------------------------------------------------------------------------------
// The {6,4} tiling gives every tile six neighbours, and Polygon.getNeighborAndDir(current, edge, true)
// is the upstream edge walk. The original's WASD is a camera-relative approximation on its canvas;
// with a grid view the six edges are the controls (deviation D16): w = deeper, a/s/d the other
// children, e = back to the parent, q = the q=4 rotation edge.
var DED_DIRS = { w: 1, d: 2, s: 3, a: 4, q: 5, e: 0 }

function DED_stepEdge(edge) {
    if (!DED_boot()) return false
    var atlas = DED_atlas()
    if (!atlas || !atlas.getNeighborAndDir) return false
    var res = null
    try { res = atlas.getNeighborAndDir(DED.world.currentTile, edge, true) } catch (e) { DED.error = String(e && e.message); return false }
    var next = res && res[0]
    if (!next) return false
    var hash = DED_hashOf(next)
    // hitTest is the original's own passability check; it answers through onPassGate / onGetReward,
    // which DED_wireWorld installed (src/hy/hworld.ts:92-112).
    var passable = false
    try { passable = DED.world.hitTest(next) } catch (e) { DED.error = String(e && e.message); return false }
    if (!passable) return false
    DED_teleport(hash)
    if (DED.world.onStepToAnotherTile) DED.world.onStepToAnotherTile()
    var tile = DED_blockAt(hash)
    if (tile && tile.type === 4) DED_noteOrdinal(hash, tile)
    return true
}

function DED_walkDir(key) {
    var edge = DED_DIRS[key]
    if (edge === undefined) return false
    return DED_stepEdge(edge)
}

// A hash string is the wire form of a TileHash (an array of edge indices); the root tile is "".
function DED_hashToArray(hash) {
    var s = String(hash === undefined || hash === null ? "" : hash)
    if (!s) return []
    var parts = s.split(",")
    var out = []
    for (var i = 0; i < parts.length; i++) out.push(Number(parts[i]))
    return out
}

function DED_teleport(hash) {
    if (!DED.world) return false
    var tile = DED_hashToArray(hash)
    DED.world.currentTile = tile
    var atlas = DED_atlas()
    if (atlas && atlas.generateRotors) { try { atlas.generateRotors(tile) } catch (e) { } }
    return true
}

// A jump from a click on a ring neighbour follows the same passability rules as a step.
function DED_stepTo(hash, from) {
    if (!DED.world) return false
    var tile = DED_hashToArray(hash)
    var passable = false
    try { passable = DED.world.hitTest(tile) } catch (e) { return false }
    if (!passable) return false
    if (from) player.geo.path[DED_hashKey(from)] = true
    DED_teleport(hash)
    if (DED.world.onStepToAnotherTile) DED.world.onStepToAnotherTile()
    return true
}

// Gates cost 推理素 and stay open forever; the original rewrites the tile to a road on passage.
function DED_gatePrice(hash) {
    var tile = DED_blockAt(hash)
    var text = tile && tile.text ? String(tile.text) + " " + TRC(tile.text) : ""
    var amount = DED_parseAmount(text)
    if (amount.gt(0)) return amount
    return new Decimal(TUNING.gateRewardBase).times(Math.pow(TUNING.rewardStep, DED_tileRow(hash)))
}

// "1000mg推理素" / "1kg" / "5µg" — the original's own currency literals (game.ts parseDeductriumAmout).
function DED_parseAmount(text) {
    var s = String(text === undefined || text === null ? "" : text)
    var m = s.match(/([0-9.]+)\s*(µg|mg|kg|g|T)/)
    if (!m) return new Decimal(0)
    var scale = { "µg": 1, "mg": 1e3, "g": 1e6, "kg": 1e9, "T": 1e12 }
    var n = Number(m[1])
    if (!isFinite(n)) return new Decimal(0)
    return new Decimal(n).times(scale[m[2]] || 1)
}

function DED_hashKey(hash) { return String(hash || "") }

function DED_gateOpen(hash) {
    return !!(player.geo.openGates && player.geo.openGates[DED_hashKey(hash)])
}

function DED_openGate(hash) {
    hash = DED_hashKey(hash === undefined ? DED_currentHash() : hash)
    var tile = DED_blockAt(hash)
    if (!tile || tile.type !== 2) return false
    return DED_handleGate(tile.name || hash, tile, hash)
}

function DED_claimReward(hash, tile) {
    DED_handleReward(hash, tile)
}

// The original's tiles also hand out metarules and named symbols (「解锁推理层与符号 mp」,
// 「元规则#q可用」), so the text is the payload and is read the way the map loader read it.
// fastmetarules is the kernel's own letter-bus string, appended in unlock order.
var DED_METARULE_KEYS = {
    "cdt": "c", "dt": ">", "idt": "<", "cvt": "v", "vt": "u", "et": "e", "cmt": ":", "q": "q",
}

function DED_dispatchKeywords(text, kind) {
    if (!text) return
    var s = String(text)
    var gained = []
    // Longest key first, and consume every matched token: "cdt" must not donate its "dt" suffix
    // as a second metarule ("解锁元规则#cdt" grants c only, not c>).
    var work = s
    var keys = Object.keys(DED_METARULE_KEYS).sort(function (a, b) { return b.length - a.length })
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var marker = "元规则#" + key
        var hit = work.indexOf(marker) >= 0
        if (hit) work = work.split(marker).join("\u0000")
        if (work.indexOf(key) >= 0) {
            hit = true
            work = work.split(key).join("\u0000")
        }
        if (!hit) continue
        var letter = DED_METARULE_KEYS[key]
        if (player.ded.fastmetarules.indexOf(letter) < 0) player.ded.fastmetarules += letter
        gained.push(key)
    }
    var sym = s.match(/符号\s*[“"‘']?([^\s”"’'()（）]+)/)
    if (sym) {
        var name = sym[1].replace(/[)）.。,，]$/, "")
        if (player.ded.symbols.indexOf(name) < 0) player.ded.symbols += (player.ded.symbols ? " " : "") + name
        gained.push("symbol " + name)
    }
    if (s.indexOf("进度层") >= 0) player.geo.unlocks.progL = true
    if (s.indexOf("推理层") >= 0) player.geo.unlocks.dL = true
    if (s.indexOf("类型层") >= 0) player.geo.unlocks.tt = true
    if (gained.length) DED_log("unlocked (" + kind + "): " + gained.join(", "))
}

function DED_noteOrdinal(hash, tile) {
    var ord = DED_ordinalOf(hash)
    if (!ord) return
    player.geo.ordinals[DED_hashKey(hash)] = ord.join ? ord.join(",") : String(ord)
    DED_note(L("此处序数 ", "ordinal here ") + DED_printOrd(ord))
}

// ordBase 15→1: the deeper the ordinal ladder climbs, the smaller the base (src/hy/ordinal.ts).
function DED_ordBase() {
    var used = (typeof player !== "undefined" && player.ord) ? Math.floor(player.ord.points.toNumber()) : 0
    return Math.max(1, 15 - used)
}

function DED_ordinalOf(hash) {
    if (!DED_kernelReady()) return null
    try {
        var o = DED_KERNEL.req("hy/ordinal.js")
        if (!o.genOrd) return null
        return o.genOrd(DED_ordBase(), String(hash))
    } catch (e) { return null }
}

function DED_printOrd(ord) {
    if (!ord) return ""
    if (!DED_kernelReady()) return String(ord)
    try { return String(DED_KERNEL.req("hy/ordinal.js").printOrd(ord, 4)) } catch (e) { return String(ord) }
}

function DED_maxReachOrd() {
    if (!DED_kernelReady() || !DED.world) return null
    try {
        var o = DED_KERNEL.req("hy/ordinal.js")
        var blocks = DED_blocks()
        if (!blocks || !o.calcMaxReachOrd || !DED.world.currentTile) return null
        return o.calcMaxReachOrd(blocks, DED.world.currentTile, [DED_ordBase(), 1])
    } catch (e) { return null }
}

// How deep a tile sits in the tiling word ≈ how far into the game it is; rows 0..4.
function DED_tileRow(hash) {
    var h = DED_hashKey(hash)
    var depth = h ? h.split(",").length : 1
    return Math.max(0, Math.min(4, Math.floor((depth - 1) / 8)))
}

// --- the currency that pays for everything -----------------------------------------------------
function DED_grant(amount, reason) {
    var d = new Decimal(amount)
    if (d.lte(0)) return
    player.points = player.points.add(d)
    player.totalDeductriums = player.totalDeductriums.add(d)
    if (reason) DED_log(String(reason))
}

function DED_rewardMult() {
    var m = new Decimal(1)
    if (hasUpgrade("geo", 14)) m = m.times(2)
    if (hasUpgrade("geo", 24)) m = m.times(upgradeEffect("geo", 24))
    if (hasMilestone("geo", 4)) m = m.times(5)
    return m
}

function DED_tableRows() {
    if (DED.sys && DED.sys.fs && DED.sys.fs.propositions) return DED.sys.fs.propositions.length
    return (player.ded.table || []).length
}

// The original keeps five FormalSystem instances and swaps them with #switchsys; this port keeps one
// and registers each theory's axioms into it as the player adopts them (design-brief D15).
function DED_sysFor(layerId) { return DED.sys }

function DED_achievementCount() {
    var n = 0
    var withAchievements = ["ach", "ded", "geo", "meta", "fol", "lit", "pea", "mac", "zfc", "num", "typ", "hott", "ord"]
    for (var i = 0; i < withAchievements.length; i++) {
        var l = withAchievements[i]
        if (player[l] && player[l].achievements) n += player[l].achievements.length
    }
    return n
}

// Challenge rewards are read through challengeEffect so completions scale them.
function DED_challengeMult() {
    var m = new Decimal(1)
    var withRewards = { geo: [11, 12], typ: [11, 12], ded: [11], meta: [11], fol: [11], lit: [11], pea: [11], mac: [11], zfc: [11], num: [11], hott: [11], ord: [11] }
    for (var layer in withRewards) {
        var ids = withRewards[layer]
        for (var i = 0; i < ids.length; i++) {
            if (!hasChallenge(layer, ids[i])) continue
            var eff = challengeEffect(layer, ids[i])
            if (eff && eff.gt && eff.gt(1)) m = m.times(eff)
        }
    }
    return m
}

// --- world state mirrored into the save --------------------------------------------------------
// The kernel's SavesParser.serialize() takes an FSGui (a DOM object this port does not have), so map
// state lives as plain objects on player.geo, which TMT saves for us; load replays it onto the world.
function DED_syncWorldFromSave() {
    if (!DED.world) return
    var gates = player.geo.openGates || {}
    for (var hash in gates) {
        if (!gates[hash]) continue
        var tile = DED_blockAt(hash)
        if (tile && tile.type === 2) tile.type = 0
    }
    var taken = player.geo.taken || {}
    for (var h in taken) {
        var t = DED_blockAt(h)
        if (t && t.type === 3) t.type = 0
    }
    if (player.geo.at && DED_teleport(player.geo.at)) return
    if (DED.lobby) DED_teleport(DED.lobby)
}

function DED_syncWorldToSave() {
    if (!DED.world) return
    player.geo.at = DED_currentHash()
}

// --- workspace persistence ---------------------------------------------------------------------
// Saved as the SOURCE TEXT of what the player added and replayed on load — the same construction path
// initFormalSystem() uses (fs/initial.js builds its axioms from strings).
function DED_rebuildWorkspace() {
    if (!DED_kernelReady()) return
    var saved = (player.ded.table || []).slice()
    DED.sys = null
    DED.cmd = null
    DED_boot()
    DED_bootCommander()
    for (var i = 0; i < saved.length; i++) DED_exec(saved[i])
}

function DED_resetWorkspace() {
    if (DED.sys && DED.sys.fs && typeof DED.sys.fs.removePropositions === "function") {
        try { DED.sys.fs.removePropositions(0, DED.sys.fs.propositions.length) } catch (e) { DED.error = String(e && e.message) }
    }
    player.ded.table = []
    player.ded.proved = new Decimal(0)
    if (DED.cmd) { try { DED.cmd.hyp = false } catch (e) { } }
}

// --- output plumbing -----------------------------------------------------------------------------
function DED_log(msg) {
    if (typeof logArray === "undefined" || !logArray || !logArray.push) return
    logArray.push({ type: 0, msg: String(msg) })
}

function DED_note(msg) {
    if (!msg) return
    if (!player.ded.notes) player.ded.notes = []
    player.ded.notes.unshift(String(msg))
    if (player.ded.notes.length > 6) player.ded.notes.length = 6
}

function DED_notesRender() {
    var notes = (player.ded && player.ded.notes) || []
    if (!notes.length) return ""
    var out = "<div style='opacity:.75;font-size:13px;max-width:640px;margin:0 auto;text-align:left'>"
    for (var i = 0; i < notes.length; i++) out += "<div>" + String(notes[i]) + "</div>"
    return out + "</div>"
}
