/*
 * build_kernel.js — Stage 4 build step for The Deductrium Tree.
 *
 * Turns Deductrium's compiled ES-module kernel into ONE classic script that TMT's
 * loader (js/technical/loader.js inserts plain <script src>) can execute synchronously.
 *
 *   in : C:/Users/Administrator/AppData/Local/Temp/deductrium/js/<roots + closure>
 *   out: <game>/js/deductrium/kernel.js
 *
 * Transform, per module:
 *   - `import {a,b} from "./x.js"`  -> `const {a,b} = __dedReq("<x>")` at the top of the factory
 *   - `export class/function/const` -> declaration with `export ` stripped, names collected into
 *     `Object.assign(__exp, {...})` at the bottom
 *   - every module body runs inside its own function scope, so duplicate top-level names across
 *     modules (ASTParser in fs/ and tt/, SavesParser x3, Core in tt/core + tt/newcore ...) are safe
 *   - a cycle-crossing name is rebound LAZILY (`__dedReq(m).NAME`) at its use sites, because a
 *     destructured snapshot taken mid-cycle is undefined for the rest of the module's life
 *
 * Attribution: Deductrium is Hqak's work (github.com/wxyhly/deductrium), upstream ships NO
 * licence file; this copy is reproduced with credit under the author's permission (granted
 * 2026-11-01) — see js/deductrium/ATTRIBUTION.md. Delete that directory and the game still
 * boots: the TMT-side adapter degrades to read-only when DED.req is absent.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2] || "C:/Users/Administrator/AppData/Local/Temp/deductrium/js";
const OUT = process.argv[3] || path.join(__dirname, "..", "js", "deductrium", "kernel.js");

// DOM-bound modules of the original game are NOT ported: TMT renders the UI.
const DENY = new Set(["fs/gui.js", "fs/cmd.js", "fs/itemdragger.js", "hy/gui.js", "hy/HyperGui.js",
    "hy/draw.js", "tt/gui.js", "game.js", "saveload.js"]);

const ROOTS = ["fs/initial.js", "fs/metainln.js", "fs/complete.js", "fs/savesparser.js",
    "hy/maploader.js", "hy/hworld.js", "hy/map.js", "hy/ordinal.js", "hy/savesparser.js",
    "tt/initial.js", "tt/check.js", "tt/HoTT.js", "tt/savesparser.js", "tt/assist.js"];

const key = (p) => p.replace(/\\/g, "/").replace(/^\.\//, "");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8").replace(/\n\/\/# sourceMappingURL=[^\n]*\n?/g, "\n");

// ---------------------------------------------------------------- parse
function parse(f) {
    const s = read(f);
    const dir = path.posix.dirname(f);
    const imports = [];
    for (const m of s.matchAll(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)"\s*;?\s*$/gm)) {
        imports.push({
            names: m[1].split(",").map(x => x.trim()).filter(Boolean),
            from: key(path.posix.normalize(path.posix.join(dir, m[2]))),
        });
    }
    const odd = s.match(/^import\s+(?!\{).*(?:from)?\s*"[^"]+".*$/gm);
    if (odd) for (const o of odd) if (!/^import\s*\{/.test(o)) console.log("  !! unparsed import in " + f + ": " + o.trim());
    const exports = {};
    for (const m of s.matchAll(/^export\s+(?:abstract\s+)?(class|function|const|let|var)\s+(\w+)/gm)) exports[m[2]] = m[1];
    const tail = s.match(/^export\s*\{([^}]*)\}\s*;?\s*$/gm);
    if (tail) console.log("  !! tail export set in " + f + ": " + tail.join(" "));
    return { id: f, s, imports, exports };
}

const mods = new Map();
const deniedHits = new Set();
(function closure() {
    const queue = ROOTS.map(key);
    while (queue.length) {
        const f = queue.shift();
        if (mods.has(f)) continue;
        if (!fs.existsSync(path.join(SRC, f))) { console.log("  !! missing module " + f); continue; }
        const m = parse(f);
        mods.set(f, m);
        for (const i of m.imports) {
            if (DENY.has(i.from)) { deniedHits.add(f + " -> " + i.from); continue; }
            if (!mods.has(i.from)) queue.push(i.from);
        }
    }
})();

console.log("modules: " + mods.size + "   lines: " + [...mods.values()].reduce((n, m) => n + m.s.split("\n").length, 0));
if (deniedHits.size) console.log("DENIED IMPORTS (kept as lazy stubs that throw if reached):\n  " + [...deniedHits].join("\n  "));

// ---------------------------------------------------------------- cycles
const edges = [...mods.values()].map(m => [m.id, m.imports.map(i => i.from).filter(d => mods.has(d))]);
const state = new Map(), cycles = [];
(function () {
    function dfs(f, stack) {
        if (state.get(f) === 2) return;
        if (state.get(f) === 1) { const i = stack.indexOf(f); cycles.push(stack.slice(i).concat(f)); return; }
        state.set(f, 1);
        for (const [from, list] of edges) if (from === f) for (const d of list) dfs(d, stack.concat(f));
        state.set(f, 2);
    }
    for (const [f] of edges) dfs(f, []);
})();
const lazy = new Map(); // "file#NAME" -> module to resolve at call time
for (const c of cycles) {
    for (let i = 0; i + 1 < c.length; i++) {
        const a = c[i], b = c[i + 1];
        const imp = mods.get(a).imports.find(x => x.from === b);
        if (!imp) continue;
        for (const n of imp.names) lazy.set(a + "#" + n, b);
        console.log("cycle edge " + a + " -> " + b + " : lazily rebinds " + imp.names.join(", "));
    }
}

// ---------------------------------------------------------------- emit
const order = [];
(function () {
    const seen = new Set();
    function visit(f) {
        if (seen.has(f)) return;
        seen.add(f);
        for (const i of mods.get(f).imports) if (mods.has(i.from)) visit(i.from);
        order.push(f);
    }
    for (const f of mods.keys()) visit(f);
})();

const chunks = [];
chunks.push(`/* ============================================================================
 * Deductrium kernel — ES modules converted to one classic script by tools/build_kernel.js.
 * Original work: Hqak (wxyhly) — github.com/wxyhly/deductrium. Upstream publishes no LICENSE
 * file; this reproduction ships with credit under the author's permission (granted 2026-11-01).
 * It is self-contained: delete js/deductrium/ and the TMT layers degrade to read-only instead of
 * crashing.
 * UI modules (gui/cmd/canvas) are deliberately NOT ported: The Modding Tree renders them.
 * ==========================================================================*/
(function () {
    var registry = {}, instances = {};
    function def(id, factory) { registry[id] = factory; }
    function req(id) {
        if (instances[id]) return instances[id].exp;
        if (!registry[id]) throw new Error("Deductrium kernel module not bundled: " + id);
        var mod = { exp: {} };
        instances[id] = mod;
        registry[id](function (dep) { return req(dep); }, mod.exp);
        return mod.exp;
    }
    globalThis.DED_KERNEL = { def: def, req: req, has: function (id) { return !!registry[id]; },
        list: function () { return Object.keys(registry); } };
    globalThis.__dedReq = req;
    globalThis.DED_KERNEL_REQ = req;;
})();
`);

for (const f of order) {
    const m = mods.get(f);
    const lines = m.s.split("\n");
    const out = [];
    let stripped = 0;
    for (const line of lines) {
        if (/^import\s+\{.*\}\s+from\s+".*"\s*;?\s*$/.test(line)) { stripped++; continue; }
        if (/^\/\/# sourceMappingURL=/.test(line)) { stripped++; continue; }
        if (/^export\s*\{/.test(line)) { stripped++; continue; }
        out.push(line.replace(/^export\s+(?=(?:abstract\s+)?(?:class|function|const|let|var)\s)/, ""));
    }
    const body = out.join("\n");
    // lazily rebind cycle-crossing names: call sites use  __dedReq("<dep>").<NAME>
    let bodyOut = body;
    const lazyNotes = [];
    for (const [k, dep] of lazy) {
        const [file, name] = k.split("#");
        if (file !== f) continue;
        const re = new RegExp("(?<![\\w$.])" + name + "\\b", "g");
        const before = (bodyOut.match(re) || []).length;
        bodyOut = bodyOut.replace(re, "(__dedReq(" + JSON.stringify(dep) + ")." + name + ")");
        lazyNotes.push(name + "<-" + dep + " (" + before + " refs)");
    }
    const destructures = m.imports.filter(i => mods.has(i.from)).map(i => {
        const keep = i.names.filter(n => !lazy.has(f + "#" + n));
        return keep.length ? "    const { " + keep.join(", ") + " } = __dedReq(" + JSON.stringify(i.from) + ");" : "";
    }).filter(Boolean);
    const dropped = m.imports.filter(i => !mods.has(i.from));
    if (dropped.length) console.log("  note " + f + " imports unbundled: " + dropped.map(d => d.from).join(", "));
    const names = Object.keys(m.exports);
    chunks.push(
        "/* ==== " + f + " (" + lines.length + " lines) ==== */\n" +
        "DED_KERNEL.def(" + JSON.stringify(f) + ", function (__dedReq, __exp) {\n" +
        destructures.join("\n") + (destructures.length ? "\n" : "") +
        bodyOut + "\n" +
        "Object.assign(__exp, { " + names.join(", ") + " });\n" +
        "});\n" + (lazyNotes.length ? "/* lazy: " + lazyNotes.join(", ") + " */\n" : ""));
}

chunks.push(`/* init: every bundled module runs at load, so a broken module is a load-time
 * error (__bootErrors) and never a surprise three prestige layers later. */
(function () {
    var miss = [];
    var ids = DED_KERNEL.list();
    for (var i = 0; i < ids.length; i++) { try { DED_KERNEL.req(ids[i]); } catch (e) { miss.push(ids[i] + ": " + (e && e.message)); } }
    if (miss.length) console.warn("[deductrium kernel] init failed: " + miss.join(" | "));
    else console.log("[deductrium kernel] " + ids.length + " modules ready");
})();
`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const text = chunks.join("");
fs.writeFileSync(OUT, text, "utf8");
console.log("\nwrote " + OUT + "  (" + (text.length / 1024).toFixed(0) + " KB, " + text.split("\n").length + " lines, " + order.length + " modules)");
