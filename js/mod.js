// The Deductrium Tree — economy root. Original game: Deductrium by Hqak (wxyhly); this is a
// The-Modding-Tree port, kernel reused with credit under the author's permission (js/deductrium/).
let modInfo = {
	name: "The Deductrium Tree",
	id: "the-deductrium-tree-69hzqe",   // savefile key — set once, NEVER change (07 hard rule 3)
	author: "chenf888 (port) · Hqak (original Deductrium)",
	pointsName: "Deductriums",
	modFiles: [
		"tuning.js",
		"text.js",
		"deductrium/kernel.js",
		"ded/adapter.js",
		"ded/commands.js",
		"layers/ded.js",
		"layers/geo.js",
		"layers/meta.js",
		"layers/fol.js",
		"layers/lit.js",
		"layers/pea.js",
		"layers/mac.js",
		"layers/zfc.js",
		"layers/num.js",
		"layers/typ.js",
		"layers/hott.js",
		"layers/ord.js",
		"layers/ach.js",
		"layers/sts.js",
		"layers/sto.js",
		"tree.js",
	],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(10),  // mirrors TUNING.initialStartPoints: mod.js loads BEFORE tuning.js
	offlineLimit: 1,  // mirrors TUNING.offlineLimitHours, same load-order reason
}

let VERSION = {
	num: "0.1",
	name: "Deductrium ported to a prestige tree",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.1</h3><br>
		- 12 prestige layers: the logic hierarchy (proposition → predicate → ZFC → type → homotopy → ordinal).<br>
		- The original formal system: command box, theorem table, rule table, metarules, macros, hypotheses.<br>
		- The full hyperbolic {6,4} map — every placement instruction of the original, 2096 tiles, 500 named.<br>
		- The type layer with its tactics and black-box puzzles.<br>
		- 80 achievements ported from the original, gate tolls as the consumable-reset endgame.`

// winText is shown on the endgame screen. English here (mod.js loads before every modFile and must
// not touch a later file's helpers — 07 F3); text.js reassigns it to the saved language at column 0
// once it has read the preference.
let winText = `<h1>ω is on paper.</h1><br>Twelve gates destructed with Deductriums, the ordinal ladder walked, every HoTT constructor adopted.<br>Deductrium&rsquo;s formal system now lives inside a prestige tree — and you still proved it by hand.`

// Action-functions live in js/ded/adapter.js; TMT caches every function inside `layers` each tick,
// so anything that mutates state is named here (07 hard rule 4).
var doNotCallTheseFunctionsEveryTick = [
	"DED_exec", "DED_walkDir", "DED_stepTo", "DED_openGate", "DED_claimReward", "DED_dispatchKeywords",
	"DED_grant", "DED_note", "DED_log", "DED_boot", "DED_bootCommander", "DED_rebuildWorkspace", "DED_resetWorkspace",
	"DED_syncWorldToSave", "DED_syncWorldFromSave", "DED_syncTableText", "GEO_ringEntry",
]

function getStartPoints() {
	return new Decimal(modInfo.initialStartPoints)
}

function canGenPoints() {
	return true
}

// --- the heart of the economy ------------------------------------------------------------------
// 推理素 (Deductriums) are produced by the formal system: what sits in the theorem table right now,
// what each theory layer contributes, and the flat bonuses bought along the way. Every promise made
// by an upgrade/milestone/achievement below has exactly one consumer here or in a gainMult().
function getPointGen() {
	if (!canGenPoints()) return new Decimal(0)

	let gain = new Decimal(TUNING.baseGen)

	// the live workspace: the interactive verb IS production (brief §3.7)
	let rows = DED_tableRows()
	gain = gain.times(Decimal.add(1, Decimal.mul(TUNING.tableMultPer, Decimal.min(rows, TUNING.tableSlots))))

	// uncapped theory layers: ×base per level, saturating at effectLevelCap levels (visible in the tab)
	const saturated = { ded: "ded", geo: "geo", meta: "meta", lit: "lit", mac: "mac", typ: "typ" }
	for (const layer in saturated) {
		let levels = Decimal.min(player[layer].points, TUNING.effectLevelCap)
		gain = gain.times(Decimal.pow(TUNING.effectBase[layer], levels))
	}

	// capped axiom layers: the theme ceiling bounds the loop (×3 per adopted axiom)
	const axioms = ["fol", "pea", "zfc", "num", "hott"]
	for (let i = 0; i < axioms.length; i++)
		gain = gain.times(Decimal.pow(TUNING.effectBase.axiom, player[axioms[i]].points))

	// the ordinal ladder — endgame only, ×10 per rung destructed
	gain = gain.times(Decimal.pow(TUNING.effectBase.ord, player.ord.points))

	// --- upgrades, one production bonus each (12 §3 rule 14) ---
	if (hasUpgrade("ded", 11)) gain = gain.times(2)                                  // 第一次推理
	if (hasUpgrade("ded", 12)) gain = gain.times(tunSelf(player.ded.points, 0.4))  // K2 self-shape
	if (hasUpgrade("ded", 14)) gain = gain.times(Decimal.add(1, player.geo.points.max(1).log10()))  // K3
	if (hasUpgrade("geo", 11)) gain = gain.times(3)
	if (hasUpgrade("geo", 12)) gain = gain.times(tunSelf(player.geo.points, 0.5))  // K2
	if (hasUpgrade("geo", 13)) gain = gain.times(Decimal.add(1, player.fol.points.pow(0.5)))        // K3
	if (hasUpgrade("meta", 11)) gain = gain.times(2)
	if (hasUpgrade("meta", 13)) gain = gain.times(tunCross(player.typ.points, 0.4))     // K3
	if (hasUpgrade("meta", 24)) gain = gain.times(player.meta.points.add(1).log10().pow(2).max(1))  // K2
	if (hasUpgrade("fol", 11)) gain = gain.times(2)                                  // 命题公理可用
	if (hasUpgrade("fol", 13)) gain = gain.times(tunCross(player.meta.points, 0.3))     // K3
	if (hasUpgrade("fol", 21)) gain = gain.times(tunSelf(player.fol.points, 0.5))                 // K2
	if (hasUpgrade("fol", 22)) gain = gain.times(tunCross(player.lit.points, 0.2))      // K3
	if (hasUpgrade("fol", 23) && player.gatesDestructed.gte(1)) gain = gain.times(2)                // K6
	if (hasUpgrade("pea", 11)) gain = gain.times(3)
	if (hasUpgrade("pea", 13)) gain = gain.times(tunSelf(player.pea.points, 0.5))                 // K2
	if (hasUpgrade("pea", 14)) gain = gain.times(tunCross(player.mac.points, 0.2))      // K3
	if (hasUpgrade("pea", 23)) gain = gain.times(1.5)
	if (hasUpgrade("pea", 24) && player.zfc.unlocked) gain = gain.times(2)                          // K6
	if (hasUpgrade("lit", 11)) gain = gain.times(2)
	if (hasUpgrade("lit", 12)) gain = gain.times(tunSelf(player.lit.points, 0.4))  // K2
	if (hasUpgrade("mac", 11)) gain = gain.times(3)
	if (hasUpgrade("mac", 21)) gain = gain.times(tunSelf(player.mac.points, 0.4))  // K2
	gain = gain.times(litProdMult())
	gain = gain.times(macProdMult())
	if (hasUpgrade("zfc", 11)) gain = gain.times(4)
	if (hasUpgrade("zfc", 14)) gain = gain.times(tunSelf(player.zfc.points, 0.5))                 // K2
	if (hasUpgrade("zfc", 21)) gain = gain.times(tunCross(player.ord.points, 0.5))      // K3
	if (hasUpgrade("zfc", 23)) gain = gain.times(2)
	if (hasUpgrade("zfc", 24) && player.gatesDestructed.gte(3)) gain = gain.times(2)                // K6
	if (hasUpgrade("num", 11)) gain = gain.times(2)
	if (hasUpgrade("num", 12)) gain = gain.times(tunSelf(player.num.points, 0.5))  // K2
	if (hasUpgrade("num", 13)) gain = gain.times(tunCross(player.lit.points, 0.25))     // K3
	if (hasUpgrade("num", 23) && player.hott.unlocked) gain = gain.times(2)                         // K6
	if (hasUpgrade("num", 24)) gain = gain.times(1.5)
	if (hasUpgrade("num", 25)) gain = gain.times(2)
	if (hasUpgrade("typ", 11)) gain = gain.times(3)
	if (hasUpgrade("typ", 12)) gain = gain.times(tunSelf(player.typ.points, 0.4))  // K2
	if (hasUpgrade("typ", 13)) gain = gain.times(tunCross(player.zfc.points, 0.4))      // K3
	if (hasUpgrade("typ", 23)) gain = gain.times(2)
	if (hasUpgrade("typ", 32)) gain = gain.times(player.typ.solved.add(1).pow(0.5))                 // K2 on the puzzle counter
	if (hasUpgrade("hott", 11)) gain = gain.times(5)
	if (hasUpgrade("hott", 12)) gain = gain.times(tunSelf(player.hott.points, 0.5))               // K2
	if (hasUpgrade("hott", 13)) gain = gain.times(tunCross(player.typ.points, 0.3))     // K3
	if (hasUpgrade("hott", 23)) gain = gain.times(1.5)
	if (hasUpgrade("hott", 24) && player.gatesDestructed.gte(1)) gain = gain.times(2)               // K6
	if (hasUpgrade("hott", 25)) gain = gain.times(2)
	if (hasUpgrade("ord", 11)) gain = gain.times(tunCross(player.hott.points, 2))       // K3
	if (hasUpgrade("ord", 15)) gain = gain.times(2)
	if (hasUpgrade("ord", 21)) gain = gain.times(tunSelf(player.ord.points, 0.5))                 // K2
	if (hasUpgrade("ord", 22)) gain = gain.times(tunCross(player.hott.points, 3))       // K3
	if (hasUpgrade("ord", 31)) gain = gain.times(Decimal.pow(1.25, player.gatesDestructed))         // K6 by gates
	// typ.b11 — the type budget buyable is spent here (N-BUYABLEDEAD's cross-layer consumer)
	if (getBuyableAmount("typ", 11).gt(0)) gain = gain.times(buyableEffect("typ", 11))

	// --- milestone rewards that are multipliers (the rest are automation / unlocks) ---
	if (hasMilestone("ded", 2)) gain = gain.times(3)
	if (hasMilestone("geo", 3)) gain = gain.times(tunCross(player.meta.points, 0.5))   // K3
	if (hasMilestone("meta", 2)) gain = gain.times(4)
	if (hasMilestone("fol", 2)) gain = gain.times(3)
	if (hasMilestone("lit", 3)) gain = gain.times(tunCross(player.pea.points, 1))               // K3
	if (hasMilestone("mac", 2)) gain = gain.times(tunCross(player.lit.points, 0.25))   // K3
	if (hasMilestone("zfc", 2)) gain = gain.times(8)
	if (hasMilestone("num", 3)) gain = gain.times(tunCross(player.typ.points, 0.5))    // K3
	if (hasMilestone("typ", 2)) gain = gain.times(10)
	if (hasMilestone("hott", 3)) gain = gain.times(tunCross(player.ord.points, 3))     // K3

	// --- challenge handicaps: the nerf lives in an OLDER layer's formula, never in the challenge ---
	if (inChallenge("meta", 11)) gain = gain.div(10)
	if (inChallenge("fol", 11)) gain = gain.div(10)
	if (inChallenge("pea", 11)) gain = gain.div(2)
	if (inChallenge("zfc", 11)) gain = gain.div(2)
	if (inChallenge("num", 11)) gain = gain.div(2)
	if (inChallenge("typ", 11)) gain = gain.div(10)
	if (inChallenge("typ", 12)) gain = gain.div(2)
	if (inChallenge("hott", 11)) gain = gain.div(10)
	if (inChallenge("ord", 11)) gain = gain.div(10)

	// --- challenge rewards (challengeEffect, scored on completions) ---
	gain = gain.times(DED_challengeMult())

	// --- achievements: 80 × ×1.05, an alternate automation/backfill path (P11) ---
	gain = gain.times(Decimal.pow(TUNING.achMult, DED_achievementCount()))

	// --- the original's own metric: cumulative 推理素 never resets, and pays a small bonus ---
	if (player.totalDeductriums.gte(1e6)) gain = gain.times(tunCross(player.totalDeductriums, 0.1))

	// A formal system can only derive so much per second (TUNING.prodCap). Without this ceiling the
	// Stage-6 simulator measured production at 1e38 by 19 minutes while the whole requires ladder
	// tops out at 4e12 — every remaining layer then unlocked in one tick.
	return Decimal.min(gain, new Decimal(TUNING.prodCap))
}

// Extra non-layer saved state. There is no player.totalPoints in this engine (07 F10), so lifetime
// currency and the kernel-derived counters are declared here.
function addedPlayerData() {
	return {
		totalDeductriums: new Decimal(0),
		theoremsProved: new Decimal(0),
		gatesDestructed: new Decimal(0),
		tilesSeen: new Decimal(0),
		endgameSeen: false,
	}
}

var displayThings = [
	function () {
		return L("推理素 ", "Deductriums ") + fmtDed(player.points) +
			L("（累计 ", " (lifetime ") + fmtDed(player.totalDeductriums) + L("）", ")")
	},
	function () {
		if (typeof DED === "undefined" || !DED.world) return ""
		let tile = DED_currentBlock()
		if (!tile) return ""
		return L("所在格 ", "at ") + DED_tileLabel() + (tile.text ? " · " + TRC(tile.text) : "")
	},
	function () {
		if (!player.ord.points.gt(0)) return ""
		return L("序数已达 ", "ordinal reached ") + formatWhole(player.ord.points) +
			L(" 级（拆闸 ", " (gates destructed ") + formatWhole(player.gatesDestructed) + "）"
	},
]

function isEndgame() {
	return player.ord.points.gte(TUNING.endgameRungs) && player.hott.points.gte(TUNING.endgameHott)
}

var backgroundStyle = {
	"background-color": "#0d1117",
	"background-image": "radial-gradient(circle at 30% 20%, #16202b 0%, #0d1117 60%)",
}

function maxTickLength() {
	return 3600
}

function fixOldSave(oldVersion) {
	// Balance changes go here as caps on resources — never as a forced reset (12 §1 rule 4).
}
