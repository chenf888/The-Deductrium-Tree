const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/Administrator/AppData/Local/Temp/deductrium/js";
const want = ["lang.js","fs/astmgr.js","fs/astparser.js","fs/assertion.js","fs/proof.js","fs/metarule.js","fs/metainln.js","fs/formalsystem.js","fs/initial.js","fs/complete.js","fs/savesparser.js","hy/tiling.js","hy/group.js","hy/algebra.js","hy/hworld.js","hy/map.js","hy/map2.js","hy/maploader.js","hy/ordinal.js","hy/savesparser.js","tt/core.js","tt/astparser.js","tt/assist.js","tt/check.js","tt/initial.js","tt/newcore.js","tt/HoTT.js","tt/savesparser.js"];
const info = {};
for (const f of want) {
    let s = fs.readFileSync(path.join(ROOT, f), "utf8");
    s = s.replace(/\n\/\/# sourceMappingURL=[^\n]*\n?/, "\n");
    const imports = [...s.matchAll(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)"\s*;?\s*$/gm)].map(m => ({ names: m[1].split(",").map(x => x.trim()).filter(Boolean), from: path.posix.normalize(path.posix.join(path.posix.dirname(f), m[2])) }));
    const decl = {};
    for (const m of s.matchAll(/^export\s+(abstract\s+)?(class|function|const|let|var)\s+(\w+)/gm)) decl[m[3]] = m[2];
    info[f] = { s, imports, decl };
}
// find edges that participate in a cycle
const dep = {}; for (const f of want) dep[f] = info[f].imports.map(i => i.from).filter(d => dep[d] === undefined || info[d]);
const cycles = [];
const st = {};
function dfs(f, stack) {
    if (st[f] === 2) return;
    if (st[f] === 1) { const i = stack.indexOf(f); if (i >= 0) cycles.push(stack.slice(i).concat(f)); return; }
    st[f] = 1;
    for (const d of info[f].imports.map(i => i.from)) if (info[d]) dfs(d, stack.concat(f));
    st[f] = 2;
}
for (const f of want) dfs(f, []);
const edgeSet = new Set();
for (const c of cycles) for (let i = 0; i + 1 < c.length; i++) edgeSet.add(c[i] + " -> " + c[i + 1]);
console.log("CYCLE EDGES:", [...edgeSet].join(" | "));
console.log("\nLazy names that are used at MODULE TOP LEVEL (dangerous):");
for (const e of edgeSet) {
    const [a, b] = e.split(" -> ");
    const names = (info[a].imports.find(i => i.from === b) || { names: [] }).names;
    console.log("\n edge " + e + " imports " + JSON.stringify(names));
    for (const n of names) {
        const re = new RegExp("\\b" + n + "\\b", "g");
        const total = (info[a].s.match(re) || []).length;
        let topUses = 0;
        const lines = info[a].s.split("\n");
        let depth = 0;
        for (const line of lines) {
            const before = depth;
            for (const ch of line) { if (ch === "{" || ch === "(" || ch === "[") depth++; else if (ch === "}" || ch === ")" || ch === "]") depth--; }
            if (before === 0 && new RegExp("\\b" + n + "\\b").test(line) && !/^import/.test(line)) { topUses++; console.log("    top-level ref: " + line.trim().slice(0, 100)); }
        }
        console.log("    " + n + ": refs=" + total + " topLevelRefs=" + topUses + " kind-in-dep=" + (info[b].decl[n] || "?"));
    }
}
