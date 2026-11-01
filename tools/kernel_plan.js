const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/Administrator/AppData/Local/Temp/deductrium/js";
const want = ["lang.js","fs/astmgr.js","fs/astparser.js","fs/assertion.js","fs/proof.js","fs/metarule.js","fs/metainln.js","fs/formalsystem.js","fs/initial.js","fs/complete.js","fs/savesparser.js","hy/tiling.js","hy/group.js","hy/algebra.js","hy/hworld.js","hy/map.js","hy/map2.js","hy/maploader.js","hy/ordinal.js","hy/savesparser.js","tt/core.js","tt/astparser.js","tt/assist.js","tt/check.js","tt/initial.js","tt/newcore.js","tt/HoTT.js","tt/savesparser.js"];
const mods = {};
for (const f of want) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) { console.log("MISSING " + f); continue; }
    const s = fs.readFileSync(p, "utf8");
    const list = [];
    for (const m of s.matchAll(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)"\s*;?\s*$/gm))
        list.push({ from: path.posix.normalize(path.posix.join(path.posix.dirname(f), m[2])), names: m[1].split(",").map(x => x.trim()).filter(Boolean) });
    for (const m of s.matchAll(/^import\s+\*\s+as\s+(\w+)\s+from\s+"([^"]+)"/gm)) list.push({ ns: m[1], from: path.posix.normalize(path.posix.join(path.posix.dirname(f), m[2])) });
    for (const m of s.matchAll(/^import\s+"([^"]+)"/gm)) list.push({ bare: true, from: m[1] });
    mods[f] = { src: s, list };
}
const outside = new Set();
for (const f of want) for (const i of mods[f].list) if (i.from && !mods[i.from]) outside.add(f + " -> " + i.from);
console.log("IMPORTS OUTSIDE SUBSET:", [...outside].join(" | ") || "(none)");
const seen = new Set(), order = [];
(function () { function visit(f) { if (seen.has(f)) return; seen.add(f); for (const i of mods[f].list) if (i.from && mods[i.from]) visit(i.from); order.push(f); } for (const f of want) visit(f); })();
console.log("\nTOPO ORDER (" + order.length + "):"); console.log(order.join("\n"));
for (const f of want) { const odd = mods[f].src.match(/^export\s+(default|\{)/gm); if (odd) console.log("ODD EXPORT", f, odd); }
const names = {};
for (const f of want) for (const m of mods[f].src.matchAll(/^export\s+(?:abstract\s+)?(class|function|const|let|var)\s+(\w+)/gm)) (names[m[2]] = names[m[2]] || []).push(f + ":" + m[1]);
const dup = Object.entries(names).filter(([, v]) => v.length > 1);
console.log("\nEXPORTED TOP-LEVEL NAMES:", Object.keys(names).length, " COLLIDING:", dup.length);
for (const [k, v] of dup) console.log("  " + k + " = " + v.join(", "));
let total = 0; for (const f of order) total += mods[f].src.split("\n").length;
console.log("\nTOTAL LINES IN SUBSET:", total);
for (const f of order) {
    const s = mods[f].src;
    const importsMulti = [...s.matchAll(/^import[\s\S]*?$/gm)].length;
    const exports = [...s.matchAll(/^export\s+(?:abstract\s+)?(class|function|const|let|var)\s+(\w+)/gm)].map(m => m[2]);
    console.log(f.padEnd(22) + " lines=" + String(s.split("\n").length).padStart(5) + "  exports=" + exports.length);
}
