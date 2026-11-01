const fs = require("fs");
const base = "C:/Users/Administrator/AppData/Local/Temp/deductrium/";
const lang = fs.readFileSync(base + "src/lang.ts", "utf8");
const dict = {};
const re = /^[ \t]*"((?:[^"\\]|\\.)*)":[ \t]*"((?:[^"\\]|\\.)*)",[ \t]*$/gm;
let m;
while ((m = re.exec(lang))) dict[m[1]] = m[2];
const html = fs.readFileSync(base + "index.html", "utf8");
const sec = html.match(/<div id="ach">([\s\S]*?)<div id="creer"/)[1];
const items = [...sec.matchAll(/<div>([\s\S]*?)<\/div>/g)]
  .map((x) => x[1].trim())
  .filter((s) => !/成就统计/.test(s))
  .map((s) => s.split("&lt;").join("<").split("&gt;").join(">"));
let i = 0;
for (const zh of items) console.log((++i < 100 ? String(i) : i) + " | " + zh + " | " + (dict[zh] || "MISSING"));
