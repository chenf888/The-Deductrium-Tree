const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/Administrator/AppData/Local/Temp/deductrium/js";
const want = ["lang.js","fs/astmgr.js","fs/astparser.js","fs/assertion.js","fs/proof.js","fs/metarule.js","fs/metainln.js","fs/formalsystem.js","fs/initial.js","fs/complete.js","fs/savesparser.js","hy/tiling.js","hy/group.js","hy/algebra.js","hy/hworld.js","hy/localdraw.js","hy/map.js","hy/map2.js","hy/maploader.js","hy/ordinal.js","hy/savesparser.js","tt/core.js","tt/astparser.js","tt/assist.js","tt/check.js","tt/initial.js","tt/newcore.js","tt/HoTT.js","tt/savesparser.js"];
const dep = {}, exp = {};
for (const f of want) {
    const s = fs.readFileSync(path.join(ROOT, f), "utf8");
    dep[f] = [...s.matchAll(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)"\s*;?\s*$/gm)].map(m => path.posix.normalize(path.posix.join(path.posix.dirname(f), m[2])));
    exp[f] = [...s.matchAll(/^export\s+(?:abstract\s+)?(?:class|function|const|let|var)\s+(\w+)/gm)].map(m => m[1]);
    const tail = s.match(/^export\s*\{([^}]*)\}\s*;?\s*$/gm);
    if (tail) console.log("TAIL EXPORT SET " + f + ": " + tail.join(" "));
}
console.log("\n== cycles ==");
const state = {};
let cycles = 0;
function dfs(f, stack) {
    if (state[f] === 2) return;
    if (state[f] === 1) { cycles++; console.log("  CYCLE: " + stack.join(" -> ") + " -> " + f); return; }
    state[f] = 1;
    for (const d of dep[f]) if (dep[d] !== undefined) dfs(d, stack.concat(f));
    state[f] = 2;
}
for (const f of want) dfs(f, []);
if (!cycles) console.log("  (none)");

for (const f of ["lang.js", "hy/localdraw.js", "fs/complete.js", "tt/check.js", "fs/metainln.js"]) {
    const s = fs.readFileSync(path.join(ROOT, f), "utf8");
    const hits = [...s.matchAll(/^.*\b(document|window|canvas|getContext)\b.*$/gm)].map(m => m[0].trim());
    console.log("\n== " + f + " exports=" + JSON.stringify(exp[f]) + " domLines=" + hits.length);
    hits.slice(0, 8).forEach(h => console.log("   " + h.slice(0, 130)));
}
const mp = fs.readFileSync(path.join(ROOT, "hy/map.js"), "utf8");
console.log("\nhy/map.js mapData sample:\n" + mp.slice(mp.indexOf("mapData"), mp.indexOf("mapData") + 400));
const ml = fs.readFileSync(path.join(ROOT, "hy/maploader.js"), "utf8");
console.log("\nhy/maploader.js first 500:\n" + ml.slice(0, 500));
const mapLines = (mp.match(/["'][^"']*[#@\$O][^"']*["']/g) || []).length;
console.log("\nhy/map.js quoted tokens containing map glyphs:", mapLines);
