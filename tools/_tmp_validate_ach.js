// temporary validator for js/layers/ach.js — deleted after the check
const fs = require("fs");
const path = require("path");
const game = path.join(__dirname, "..");
const Decimal = require(path.join(game, "js/technical/break_eternity.js"));
const src = fs.readFileSync(path.join(game, "js/layers/ach.js"), "utf8");

// --- static text checks ---------------------------------------------------
const problems = [];
if (/^\s*(import|export)\b/m.test(src)) problems.push("module syntax present");
if (/\bDED\b|\bDED_KERNEL\b/.test(src)) problems.push("kernel identifier present");
if (/TODO|…|\.\.\./.test(src)) problems.push("placeholder/ellipsis text present");
if (/\uD83C|\uD83D|\uD83E/.test(src)) problems.push("emoji present");
const addLayerCalls = (src.match(/addLayer\s*\(/g) || []).length;
if (addLayerCalls !== 1) problems.push("addLayer calls = " + addLayerCalls);

// --- load it --------------------------------------------------------------
global.window = global;
global.Decimal = Decimal;
global.chinesemode = true;
global.L = (zh, en) => zh + "|" + en;
const LAYERS = {};
global.addLayer = (id, def) => { LAYERS[id] = def; };
global.layers = LAYERS;
const mk = () => ({ unlocked: false, points: new Decimal(0), best: new Decimal(0), total: new Decimal(0),
  upgrades: [], milestones: [], achievements: [], buyables: {}, challenges: {} });
global.player = {
  points: new Decimal(0), totalDeductriums: new Decimal(0), theoremsProved: new Decimal(0),
  gatesDestructed: new Decimal(0), tilesSeen: new Decimal(0),
  ach: { unlocked: true, points: new Decimal(0), achievements: [] },
};
["ded","geo","meta","fol","lit","pea","mac","zfc","num","typ","hott","ord"].forEach((l) => { player[l] = mk(); });
player.ded.table = [];
player.geo.openGates = {};
player.geo.taken = {};
player.typ.puzzle = {};
player.sto = { unlocked: true, chapters: [] };
global.hasUpgrade = (l, id) => !!player[l] && player[l].upgrades.includes(Number(id));
global.hasMilestone = (l, id) => !!player[l] && player[l].milestones.includes(Number(id));
global.hasAchievement = () => false;
global.hasChallenge = (l, id) => !!(player[l] && player[l].challenges[id]);
global.inChallenge = () => false;
global.getBuyableAmount = (l, id) => (player[l] && player[l].buyables[id]) || new Decimal(0);

eval.call(global, src);

const A = LAYERS.ach.achievements;
const ids = Object.keys(A).map(Number).sort((a, b) => a - b);
console.log("entries:", ids.length, " ACH_TOTAL:", global.ACH_TOTAL, " version:", typeof ACH_backfill);
if (global.ACH_TOTAL !== ids.length) problems.push("ACH_TOTAL mismatch: " + global.ACH_TOTAL + " vs " + ids.length);

const seen = new Set();
for (const id of ids) {
  const row = Math.floor(id / 10), col = id % 10;
  if (row < 1 || row > 9 || col < 1 || col > 9) problems.push("bad id layout " + id);
  if (seen.has(id)) problems.push("dup id " + id);
  seen.add(id);
  const a = A[id];
  for (const f of ["name", "tooltip", "done", "effect"]) {
    if (typeof a[f] !== "function") problems.push(id + ": " + f + " is not a function");
  }
  if (!/\blayer\b|\bthis\b/.test("")) { /* noop */ }
}
// rows / cols histogram
const byRow = {};
ids.forEach((id) => { const r = Math.floor(id / 10); byRow[r] = (byRow[r] || 0) + 1; });
console.log("per-row counts:", JSON.stringify(byRow));

// --- fresh-save evaluation: nothing throws, done() false, effect shape -----
let grants = 0;
for (const id of ids) {
  const a = A[id];
  let d;
  try { d = a.done(); } catch (e) { problems.push(id + ": done() threw on fresh save: " + e.message); continue; }
  if (typeof d !== "boolean") problems.push(id + ": done() returned " + typeof d);
  if (d) problems.push(id + ": done() true on a fresh save (should be a real feat)");
  try { const n = a.name(); if (!n.includes("|")) problems.push(id + ": name() not bilingual"); } catch (e) { problems.push(id + ": name threw " + e.message); }
  try { const t = a.tooltip(); if (!t.includes("|")) problems.push(id + ": tooltip() not bilingual"); } catch (e) { problems.push(id + ": tooltip threw " + e.message); }
  let eff;
  try { eff = a.effect(); } catch (e) { problems.push(id + ": effect threw " + e.message); continue; }
  if (Decimal.isDecimal(eff)) { if (!eff.eq(1.05)) problems.push(id + ": effect = " + eff + " not 1.05"); }
  else if (eff && (eff.grantUpgrade || eff.grantMilestone)) grants++;
  else problems.push(id + ": effect returned " + JSON.stringify(eff));
}
console.log("backfill-granting achievements:", grants);
if (grants > 8) problems.push("more than 8 grants");

// grant effects must be honest when the target already exists
ids.forEach((id) => {
  const a = A[id];
  const eff = a.effect();
  if (eff && eff.grantUpgrade) { const t = eff.grantUpgrade; player[t[0]].upgrades.push(Number(t[1])); if (a.effect().grantUpgrade) problems.push(id + ": still grants after owned"); player[t[0]].upgrades = []; }
  if (eff && eff.grantMilestone) { const t = eff.grantMilestone; player[t[0]].milestones.push(Number(t[1])); if (a.effect().grantMilestone) problems.push(id + ": still grants milestone after owned"); player[t[0]].milestones = []; }
});

// --- ACH_backfill: run it twice, assert idempotence ------------------------
function snapshot() {
  const o = {};
  ["ded","geo","meta","fol","lit","pea","mac","zfc","num","typ","hott","ord"].forEach((l) => { o[l] = player[l].upgrades.join(",") + "#" + player[l].milestones.join(","); });
  return JSON.stringify(o);
}
player.ach.achievements = ids.map(String);
ACH_backfill();
const s1 = snapshot();
ACH_backfill();
const s2 = snapshot();
console.log("backfill first pass:", s1);
if (s1 !== s2) problems.push("ACH_backfill is not idempotent");

// every achievement earnable somewhere on the ladder? report done() flags at max state
["ded","geo","meta","fol","lit","pea","mac","zfc","num","typ","hott","ord"].forEach((l) => {
  player[l].points = new Decimal(1e6); player[l].best = new Decimal(1e6); player[l].total = new Decimal(1e6);
  player[l].challenges[11] = 1; player[l].challenges[12] = 1;
  for (let i = 1; i <= 9; i++) { player[l].upgrades.push(l === "typ" ? 30 + i : 10 + i); }
  for (let i = 1; i <= 6; i++) player[l].milestones.push(i);
  player[l].buyables[11] = new Decimal(20);
});
player.fol.points = new Decimal(5); player.pea.points = new Decimal(5); player.num.points = new Decimal(4);
player.zfc.points = new Decimal(9); player.hott.points = new Decimal(6); player.ord.points = new Decimal(12);
player.points = new Decimal(1e15); player.totalDeductriums = new Decimal(1e15);
player.theoremsProved = new Decimal(100000); player.tilesSeen = new Decimal(100000);
player.gatesDestructed = new Decimal(40);
player.ded.table = ["a", "b", "c"];
for (let i = 0; i < 200; i++) { player.geo.openGates["g" + i] = true; player.geo.taken["t" + i] = true; }
for (let i = 0; i < 12; i++) player.typ.puzzle["p" + i] = true;
player.sto.chapters = [0, 1, 2, 3, 4, 5, 6, 7];
const unearnable = ids.filter((id) => { try { return !A[id].done(); } catch (e) { problems.push(id + " threw at max state: " + e.message); return true; } });
console.log("not earnable even at a fully maxed save:", unearnable.join(",") || "none");

// tooltip/name bilingual in english mode too
global.chinesemode = false;
const badEn = ids.filter((id) => A[id].name().startsWith("|") || A[id].tooltip().startsWith("|"));
if (badEn.length) problems.push("empty english half: " + badEn.join(","));

console.log("\n" + (problems.length ? "PROBLEMS:\n - " + problems.join("\n - ") : "ALL CHECKS PASSED"));
