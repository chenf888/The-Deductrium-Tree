/* kernel_test.js — headless self-test of the converted Deductrium kernel.
   Run: node tools/kernel_test.js            (from the game folder)
   Purpose: prove the ESM->classic conversion, the cycle rebinding, and the three
   entry points the layers depend on (formal system, hyperbolic map, type theory). */
"use strict";
const fs = require("fs");
const vm = require("vm");
global.window = global;
vm.runInThisContext(fs.readFileSync("js/deductrium/kernel.js", "utf8"), { filename: "kernel.js" });

const DED = global.DED;
function step(label, fn) {
    try { const r = fn(); console.log("PASS " + label + (r === undefined ? "" : "  ->  " + String(r).slice(0, 200))); return r; }
    catch (e) { console.log("FAIL " + label + "  ->  " + (e && e.stack ? String(e.stack).split("\n").slice(0, 3).join(" | ") : e)); return null; }
}

console.log("== bundled modules ==");
const ids = ["lang.js", "fs/astmgr.js", "fs/astparser.js", "fs/assertion.js", "fs/proof.js", "fs/metarule.js",
    "fs/metainln.js", "fs/formalsystem.js", "fs/savesparser.js", "fs/initial.js", "fs/complete.js",
    "hy/algebra.js", "hy/group.js", "hy/tiling.js", "hy/hworld.js", "hy/map.js",
    "hy/maploader.js", "hy/ordinal.js", "hy/savesparser.js", "tt/astparser.js", "tt/core.js",
    "tt/assist.js", "tt/check.js", "tt/initial.js", "tt/HoTT.js", "tt/savesparser.js"];
let missing = 0;
for (const id of ids) if (!DED.has(id)) { missing++; console.log("  NOT BUNDLED " + id); }
console.log("checked " + ids.length + ", missing " + missing);

console.log("\n== exports ==");
for (const id of ids) step("exports " + id, () => Object.keys(DED.req(id)).join(","));

console.log("\n== behaviour ==");
const sys = step("initFormalSystem(false)", () => { const s = DED.req("fs/initial.js").initFormalSystem(false); global.__sys = s; return s && s.theorems ? "theorems=" + s.theorems.length : typeof s; });
step("formal system api", () => Object.keys(Object.getPrototypeOf(sys)).slice(0, 30).join(","));
step("deduct a theorem", () => { const before = sys.theorems.length; sys.generateDeduction && sys.generateDeduction(); return before + " -> " + sys.theorems.length; });
step("mapData length", () => (DED.req("hy/map.js").mapData || "").length);
step("maploader api", () => Object.keys(DED.req("hy/maploader.js")).join(","));
step("initMap over mapData", () => { const ml = DED.req("hy/maploader.js"); ml.initMap(DED.req("hy/map.js").mapData); return "nameMap=" + Object.keys(ml.nameMap).length + " blockMap=" + ml.blockMap.size; });
step("HWorld construct (stub canvas)", () => {
    const ctx = new Proxy({}, { get: (t, k) => (k === "canvas" ? 1 : () => ctx), set: () => true });
    const canvas = { width: 800, height: 600, getContext: () => ctx, style: {} };
    const hw = new (DED.req("hy/hworld.js").HWorld)(canvas);
    global.__hw = hw;
    return "keys=" + Object.keys(hw).slice(0, 14).join(",");
});
step("walk the tiling", () => { const p = global.__hw.player || global.__hw.p || global.__hw.me; if (!p) return "no player field; keys=" + Object.keys(global.__hw).join(","); const n = p.getNeighborAndDir ? "has getNeighborAndDir" : "api=" + Object.keys(p).slice(0, 10).join(","); return n; });
step("tt init", () => { const t = DED.req("tt/initial.js"); const f = t.initTypeSystem || t.initTT || t.default; return f ? String(typeof f) : "keys=" + Object.keys(t).join(","); });
step("tt/core api", () => Object.keys(DED.req("tt/core.js")).join(","));
step("ordinal api", () => Object.keys(DED.req("hy/ordinal.js")).join(","));
step("genOrd", () => { const o = DED.req("hy/ordinal.js"); const f = o.genOrd || o.calcMaxReachOrd; return f ? String(f(1)) : "none"; });
step("TR lookup", () => JSON.stringify(DED.req("lang.js").TR("推理")) + " / " + JSON.stringify(DED.req("lang.js").TRC("推理")));
