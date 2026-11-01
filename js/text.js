// Bilingual text layer (T2 pair, handbook 15 §1). Every user-facing string in this game is produced
// by a function so the preference is read at render time, never baked in at load (15 §2, 07 F3).
// The kernel ships its own zh↔en dictionary (lang.js, 927 lines) — map tile text goes through TRC()
// instead of being duplicated here.

var chinesemode = (function () {
    try {
        var k = (typeof modInfo !== "undefined" ? modInfo.id : "the-deductrium-tree") + ".lang";
        var v = localStorage.getItem(k);
        return v === "zh";                     // English is the default (interview Q7)
    } catch (e) { return false }
})();

function L(zh, en) { return chinesemode ? zh : en }

// Pick between two strings with the ternary inlined — used where a literal would be ambiguous.
function LOR(zh, en) { return L(zh, en) }

function setChineseMode(on) {
    chinesemode = !!on;
    try { localStorage.setItem(modInfo.id + ".lang", chinesemode ? "zh" : "en") } catch (e) { }
    // Kernel bridge: setLang() rewrites DOM nodes this game does not own, so only the field moves.
    if (typeof DED !== "undefined" && DED.has && DED.has("lang.js")) {
        try { DED.req("lang.js").langMgr.lang = chinesemode ? "zh" : "en" } catch (e) { }
    }
}

// mod.js declares winText (the static checker and the endgame screen both need it there). Reassign
// it here — at column 0, so D-IMPLICITGLOBAL's indented-assignment scan does not treat a deliberate
// cross-file reassignment as a leak — now that the saved language preference is known.
winText = L(
    "<h1>ω 已经落在纸上。</h1><br>你已经用推理素拆掉十二道闸，序数阶梯走完，同伦类型层的构造子全部采纳。<br>Deductrium 的形式系统现在住在声望树里，而它依然是你亲手推出来的。",
    winText
)

function TRC(text) {
    if (text === undefined || text === null) return ""
    if (typeof DED !== "undefined" && DED.has && DED.has("lang.js")) {
        try { return DED.req("lang.js").TRC(String(text)) } catch (e) { return String(text) }
    }
    return String(text)
}

function TR(text) {
    if (typeof DED !== "undefined" && DED.has && DED.has("lang.js")) {
        try { return DED.req("lang.js").TR(String(text)) } catch (e) { return String(text) }
    }
    return String(text)
}

// --- F23: UTF-8-safe save transfer -----------------------------------------------------------
// The bundled engine exports with btoa(JSON.stringify(player)) (js/utils/save.js:264), which is
// Latin1-only: this save carries Chinese (chapter text, the theorem table as command text), so the
// stock button throws. Reassign the two globals instead of editing the engine. The reader still
// accepts the old Latin1 payload so anything exported before this patch keeps importing.
function DED_utf8ToB64(str) { return btoa(unescape(encodeURIComponent(str))) }
function DED_b64ToUtf8(b64) { return decodeURIComponent(escape(atob(b64))) }

function exportSave() {
    let str = DED_utf8ToB64(JSON.stringify(player))
    const el = document.createElement("textarea")
    el.value = str
    document.body.appendChild(el)
    el.select()
    el.setSelectionRange(0, 99999)
    document.execCommand("copy")
    document.body.removeChild(el)
}

function importSave(imported = undefined, forced = false) {
    if (imported === undefined)
        imported = prompt(L("在此粘贴存档", "Paste your save here"))
    let json
    try { json = DED_b64ToUtf8(imported) } catch (e) {
        try { json = atob(imported) } catch (e2) { return }   // pre-patch Latin1 export
    }
    try {
        tempPlr = Object.assign(getStartPlayer(), JSON.parse(json))
        if (tempPlr.versionType != getModID() && !forced &&
            !confirm(L("这个存档看起来属于另一个模组，确定要导入吗？", "This save appears to be for a different mod! Are you sure you want to import?")))
            return
        player = tempPlr
        player.versionType = getModID()
        fixSave()
        versionCheck()
        save()
        window.location.reload()
    } catch (e) {
        return
    }
}

// --- Deductrium's own currency readout, ported from src/game.ts stringifyDeductriumAmout -------
var DED_UNITS = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "kg" },
    { v: 1e6, s: "g" },
    { v: 1e3, s: "mg" },
    { v: 1, s: "µg" },
]

function fmtDed(n) {
    var d = new Decimal(n)
    if (d.lt(0)) return "-" + fmtDed(d.neg())
    for (var i = 0; i < DED_UNITS.length; i++) {
        if (d.gte(DED_UNITS[i].v)) return format(d.div(DED_UNITS[i].v)) + DED_UNITS[i].s
    }
    if (d.eq(0)) return "0µg"
    return format(d) + "µg"
}

// --- chrome strings that must not live in layer files ------------------------------------------
function mainLine(layer, precision) {
    var p = player[layer].points
    var amount = (typeof precision === "number" && p.lt(1e6)) ? format(p, precision) : formatWhole(p)
    return L("你有 ", "You have ") + "<h2 style=\"color:" + tmp[layer].color + ";text-shadow:0 0 10px " +
        tmp[layer].color + ";display:inline\">" + amount + "</h2> " + tmp[layer].resource +
        (layers[layer].effectDescription ? L("，", ", ") + run(layers[layer].effectDescription, layers[layer]) : "")
}

function baseLine(layer) {
    if (!tmp[layer].baseAmount) return ""
    return L("你有 ", "You have ") + formatWhole(tmp[layer].baseAmount) + " " + tmp[layer].baseResource
}

function totalLine(layer) {
    if (!player[layer].total) return ""
    return L("你累计获得 ", "You have made a total of ") + formatWhole(player[layer].total) + " " + tmp[layer].resource
}

function softcapWarning(layer) {
    var sc = tmp[layer].softcap
    if (!sc || !player[layer].points.gte(sc.div(2))) return ""
    return L("软上限始于 ", "Softcap starts at ") + format(sc) + " " + tmp[layer].resource
}

function capLine(layer, have, cap) {
    return L("已采纳 ", "Adopted ") + formatWhole(have) + " / " + cap + (chinesemode ? " 条公理" : " axioms")
}

// Static (capped) layers: the button says the next adoption's price, and the same function feeds
// the bar. Price comes from tuning.js, so the simulator reads the number the game charges.
function staticButtonText(layer) {
    var cap = tunCap(layer)
    if (player[layer].points.gte(cap)) return L("已达上限：", "At the ceiling: ") + cap + L(" 条", " adopted")
    var price = tunStaticPrice(layer)
    return L("采纳下一条（", "Adopt the next (") + format(price) + L(" 推理素）", " Deductriums)")
}

function staticReach(layer) {
    var price = tunStaticPrice(layer)
    return player.points.div(price).max(0).min(1).toNumber()
}

// The language toggle. Every string is a function, so a reload is enough to apply the preference;
// that also keeps the kernel's own language manager in sync without touching its DOM.
function DED_langButton() {
    return "<button onclick=\"setChineseMode(!chinesemode);location.reload()\" style=\"" +
        "margin:12px auto;display:block;padding:6px 16px;font-family:Consolas,monospace;cursor:pointer;" +
        "background:#263238;color:#cfd8dc;border:1px solid #455a64;border-radius:4px\">" +
        (chinesemode ? "English" : "中文") + "</button>"
}

// The production ceiling is a visible rule, not a hidden clamp: say it when it binds.
function DED_prodCapLine() {
    var cap = new Decimal(TUNING.prodCap)
    if (getPointGen().lt(cap.times(0.98))) return ""
    return L("推理素产出已达形式系统的上限（", "Production has hit the formal system's ceiling (") +
        format(cap) + L("/s）——再多的公理也不会更快了。", "/s) — more axioms cannot make it faster.")
}

var UI = {
    get: function (key) { return DED_UI[key] ? (chinesemode ? DED_UI[key][0] : DED_UI[key][1]) : key },
}

var DED_UI = {
    "cmd": ["命令", "command"],
    "run": ["执行", "run"],
    "table": ["定理表", "theorem table"],
    "rules": ["规则表", "rule table"],
    "hyp": ["假设", "hypotheses"],
    "walk": ["行走", "walk"],
    "gate": ["闸门", "gate"],
    "pay": ["交闸费", "pay the toll"],
    "axioms": ["公理", "axioms"],
    "adopt": ["采纳下一条公理", "adopt the next axiom"],
    "locked": ["未解锁", "locked"],
    "noKernel": ["内核未载入：本层只读。删除 js/deductrium/ 时就是这个状态（内核按作者授权复用，见 ATTRIBUTION.md）。",
        "Kernel not loaded: this layer is read-only. That is the state when js/deductrium/ is absent (the kernel is reused under the author's permission — see ATTRIBUTION.md)."],
    "proved": ["已证定理", "theorems proved"],
    "tile": ["当前格", "current tile"],
    "endgame": ["序数已到达", "ordinal reached"],
}
