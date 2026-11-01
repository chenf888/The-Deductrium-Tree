/* adapter_test.js — headless micro-gate for the kernel glue (Stage 4 per-layer gate).
   Loads the bundle + js/ded/*.js with minimal engine stubs and drives the paths the layers call:
   world boot, walking, tile rewards, gates, and the command executor. Run: node tools/adapter_test.js */
"use strict";
const fs = require("fs"), vm = require("vm");
global.window = global;
global.Decimal = require("E:/Idle-Skill/TMT-Skill/template/js/technical/break_eternity.js")
global.chinesemode = false
global.logArray = []
global.L = (zh) => zh
global.TRC = t => String(t)
global.fmtDed = n => String(n)
global.format = (n, p) => String(n)
global.formatWhole = n => String(n)
global.UI = { get: k => k }
// mod.js declares winText in the browser; text.js reassigns it, so the stub must exist here too.
global.winText = ""
global.hasUpgrade = () => true
global.hasMilestone = () => true
global.hasChallenge = () => false
global.challengeEffect = () => new Decimal(1)
global.getBuyableAmount = () => new Decimal(0)
global.upgradeEffect = () => new Decimal(2)

function dec(n) { return new Decimal(n || 0) }
global.player = {
    points: new Decimal(1e6), totalDeductriums: dec(), theoremsProved: dec(), gatesDestructed: dec(), tilesSeen: dec(),
    ded: { unlocked: true, points: dec(5), best: dec(5), total: dec(5), cmd: "d", table: [], rules: [], macros: [], proved: dec(), surge: 0, keepTable: false, autoDeduct: false, notes: [], fastmetarules: "cvuqe><:#zZQR", symbols: "", lastRule: "" },
    geo: { unlocked: true, points: dec(3), best: dec(3), total: dec(3), at: "", openGates: {}, taken: {}, visited: {}, path: {}, ordinals: {}, unlocks: {}, runStart: 0, seen: 0, buyables: { 11: dec(), 12: dec() } },
    lit: { buyables: { 11: dec() } }, ord: { points: dec(), unlocked: false }, hott: { points: dec() }, zfc: { points: dec() },
    typ: { points: dec() }, meta: { points: dec() }, fol: { points: dec() }, pea: { points: dec() }, mac: { points: dec() }, num: { points: dec() },
    ach: { achievements: [] }, sto: { chapters: [] }, sts: {},
}
global.tmp = {}
global.layers = {}

vm.runInThisContext(fs.readFileSync("js/tuning.js", "utf8"), { filename: "tuning.js" })
vm.runInThisContext(fs.readFileSync("js/text.js", "utf8"), { filename: "text.js" })
vm.runInThisContext(fs.readFileSync("js/deductrium/kernel.js", "utf8"), { filename: "kernel.js" })
vm.runInThisContext(fs.readFileSync("js/ded/adapter.js", "utf8"), { filename: "adapter.js" })
vm.runInThisContext(fs.readFileSync("js/ded/commands.js", "utf8"), { filename: "commands.js" })

let fails = 0
function check(label, cond, detail) {
    console.log((cond ? "PASS " : "FAIL ") + label + (detail === undefined ? "" : "  ->  " + String(detail).slice(0, 120)))
    if (!cond) fails++
}

check("world boots headless", DED_boot() === true, DED.error)
check("map loaded", DED_blocks() && DED_blocks().size === 2096, DED_blocks() && DED_blocks().size)
check("lobby found (root tile = empty hash)", DED.lobby === "", JSON.stringify(DED.lobby))
check("standing on the lobby tile", DED_currentHash() === "", DED_tileLabel())
check("command: a1 A B", DED_exec("a1 0 1 A B") !== "" || DED_tableRows() > 0, DED_tableRows())
const before = DED_tableRows()
DED_exec("mp 0 1")
check("command: mp adds a row", DED_tableRows() >= before, before + " -> " + DED_tableRows())
check("proved counter", player.ded.proved.gt(0), player.ded.proved.toString())
check("table text mirrored", (player.ded.table || []).length === DED_tableRows(), player.ded.table.length)
check("unknown name is refused as a rule", /cancelled|取消/.test(DED_exec("zzznope") || ""), DED_exec("zzznope"))
check("hyp is gated but runs", typeof DED_exec("hyp A") === "string")
const start = DED_currentHash()
check("walk w", DED_walkDir("w") === true, DED_currentHash() !== start)
check("visited recorded", Object.keys(player.geo.visited).length >= 1, Object.keys(player.geo.visited).length)
check("amount literal parsed", DED_parseAmount("获取1000mg推理素").eq(1e6), DED_parseAmount("获取1000mg推理素").toString())
check("gate price positive", DED_gatePrice(start).gt(0), DED_gatePrice(start).toString())
const pts = player.points
DED_grant(new Decimal(100))
check("grant writes points and lifetime", player.points.gt(pts) && player.totalDeductriums.gte(100), fmtDed(player.totalDeductriums))
check("render helpers produce html", DED_renderTheorems().length > 20 && DED_renderRules().length > 20 && DED_renderDepth().length > 20, DED_renderTheorems().slice(0,40))

// Keyword dispatcher: the map's reward text is the payload, so substring traps matter.
player.ded.fastmetarules = ""
DED_dispatchKeywords("解锁元规则#cdt", "test")
check("metarule cdt grants c only", player.ded.fastmetarules === "c", JSON.stringify(player.ded.fastmetarules))
DED_dispatchKeywords("元规则#q可用 元规则#dt可用", "test")
check("metarule letters appended once", player.ded.fastmetarules === "c>q", JSON.stringify(player.ded.fastmetarules))
player.ded.symbols = ""
DED_dispatchKeywords("解锁推理层与符号“→”（>）", "test")
check("symbol with quotes parsed", player.ded.symbols === "→", JSON.stringify(player.ded.symbols))
DED_dispatchKeywords("解锁逻辑符号\n“∧”（&）与“∨”（|）", "test")
check("spaced symbol line parsed", player.ded.symbols === "→ ∧", JSON.stringify(player.ded.symbols))
DED_dispatchKeywords("符号 mp", "test")
check("plain spaced symbol parsed", player.ded.symbols === "→ ∧ mp", JSON.stringify(player.ded.symbols))

// log10(0) is NaN in this Decimal build and .max(0) cannot repair it, so a zeroed layer poisons
// getPointGen forever unless the input is clamped to >= 1 first.
const unsafeLog = ["js/mod.js", "js/layers/ded.js", "js/layers/lit.js", "js/layers/mac.js"]
    .map((f) => fs.readFileSync(f, "utf8")).join("\n")
check("no unguarded points.log10()", !/\.points\.log10\(\)/.test(unsafeLog) && new Decimal(0).max(1).log10().eq(0),
    new Decimal(0).log10().toString())
console.log(fails ? "\n" + fails + " FAIL" : "\nall adapter checks pass")
process.exit(fails ? 1 : 0)
