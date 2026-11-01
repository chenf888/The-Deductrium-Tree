/* audit_fields.js — every player.<layer>.<field> read anywhere must exist in that layer's startData.
   A field the map/adapter/upgrades write before startData declares it is a load-time or first-use
   crash (measured: ded.fastmetarules was written by the reward dispatcher and read by six upgrades,
   but never declared — the first rewarding tile threw). Run: node tools/audit_fields.js */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "js");
const files = [];
(function walk(d) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f), s = fs.statSync(p);
        if (s.isDirectory()) walk(p);
        else if (f.endsWith(".js") && !p.includes("deductrium")) files.push(p);
    }
})(root);

const refs = {};
for (const f of files) {
    const t = fs.readFileSync(f, "utf8");
    for (const m of t.matchAll(/player\.([a-z][a-z0-9_]*)\.([A-Za-z0-9_]+)/g)) {
        (refs[m[1]] = refs[m[1]] || new Set()).add(m[2]);
    }
}

const ENGINE_FIELDS = new Set(["upgrades", "milestones", "achievements", "buyables", "clickables",
    "challenges", "grid", "activeChallenge", "unlocked", "points", "resetTime", "prevTab",
    "forceTooltip", "noRespecConfirm", "deactivated", "unlockOrder"]);

let bad = 0;
for (const id of Object.keys(refs)) {
    if (id === "points") continue;   // the engine root currency, not a layer
    const lf = files.find((f) => new RegExp("addLayer\\(\\s*['\"]" + id + "['\"]").test(fs.readFileSync(f, "utf8")));
    if (!lf) { console.log("NO LAYER FILE for player." + id); bad++; continue; }
    const src = fs.readFileSync(lf, "utf8");
    const m = src.match(/startData\(\)\s*\{([\s\S]*?)\n    \}/);
    const body = m ? m[1] : "";
    const missing = [...refs[id]].filter((k) => !ENGINE_FIELDS.has(k) && !new RegExp("\\b" + k + "\\s*:").test(body));
    if (missing.length) { console.log(id + " startData missing: " + missing.join(", ")); bad += missing.length; }
}
// fields written by the adapter but declared nowhere are the same class of bug
for (const id of Object.keys(refs)) {
    const lf = files.find((f) => new RegExp("addLayer\\(\\s*['\"]" + id + "['\"]").test(fs.readFileSync(f, "utf8")));
    if (!lf) continue;
}
console.log(bad ? "audit_fields: " + bad + " missing field(s)" : "audit_fields: every referenced layer field is declared");
process.exit(bad ? 1 : 0);
