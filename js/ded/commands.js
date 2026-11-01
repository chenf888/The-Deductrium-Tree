// The command box. The original drives it through FSCmd + FSGui (~3000 DOM lines); this port keeps
// the SAME command set and the SAME kernel calls, and replaces only the gui layer. The logic is the
// kernel's: fs.deduct / fs.generateDeductionByToken / fs.addHypothese / fs.addMacro /
// fs.inlineMacroInProp / fs.meta* — see src/fs/cmd.ts:226-251 for the dispatch this mirrors.

var DED_PARSER = null

function DED_parser() {
    if (DED_PARSER !== null) return DED_PARSER
    if (!DED_kernelReady()) { DED_PARSER = false; return false }
    try {
        DED_PARSER = new (DED_KERNEL.req("fs/astparser.js").ASTParser)()
    } catch (e) {
        DED_PARSER = false
        DED.error = String(e && e.message ? e.message : e)
    }
    return DED_PARSER
}

function DED_bootCommander() {
    if (!DED_boot()) return false
    DED_parser()
    if (!DED.cmd) DED.cmd = { last: null, hyp: false, escClear: true }
    return true
}

// --- AST → text ---------------------------------------------------------------------------------
// The kernel's own stringifier lives in a class; when it is unavailable the tables still have to
// render, and the AST shape is fixed: {type, name, nodes?} (src/fs/astmgr.ts:1).
function DED_astText(ast) {
    if (!ast) return ""
    var p = DED_parser()
    if (p && p.stringifyTight) { try { return String(p.stringifyTight(ast)) } catch (e) { } }
    if (p && p.stringify) { try { return String(p.stringify(ast)) } catch (e) { } }
    return DED_astFallback(ast, false)
}

function DED_astFallback(ast, bracket) {
    if (!ast) return ""
    if (!ast.nodes || !ast.nodes.length) return String(ast.name || "")
    var inner = "("
    for (var i = 0; i < ast.nodes.length; i++) {
        if (i) inner += ","
        inner += DED_astFallback(ast.nodes[i], true)
    }
    return inner + ")" + String(ast.name || "") + (bracket ? "" : "")
}

// --- input tokenising ---------------------------------------------------------------------------
// src/fs/cmd.ts:48-97: Enter splits on whitespace, then re-glues operator tokens so that
// "a b" inside a name survives; ` is read as '.
function DED_tokenize(line) {
    var s = String(line === undefined || line === null ? "" : line).replace(/`/g, "'").trim()
    if (!s) return []
    s = s.replace(/\s([@=+\-*XUI><&|\\]|<>)\s/g, "$1")
    return s.split(/\s+/)
}

// --- the executor -------------------------------------------------------------------------------
// Returns the text the box should show; every branch mirrors the original's dispatch table
// (src/fs/cmd.ts:226-251) and the kernel does the reasoning.
function DED_exec(input) {
    var buf = Array.isArray(input) ? input.slice() : DED_tokenize(input)
    if (!buf.length) return ""
    if (!DED_bootCommander()) { DED_note(L("内核未载入。", "kernel not loaded.")); return "" }
    var sys = DED.sys, fs = sys && sys.fs
    if (!fs) { DED_note(L("形式系统未就绪。", "formal system not ready.")); return "" }

    var before = fs.propositions.length
    var out = ""
    var head = String(buf[0])
    try {
        if (head === "meta") out = DED_cmdMeta(buf)
        else if (head === "mm" || head === "meta-macro" || head === "metamacro") out = DED_cmdMetaMacro(buf, fs)
        else if (head === "m" || head === "macro") out = DED_cmdMacro(buf, fs)
        else if (head === "inln") out = DED_cmdInline(buf, fs)
        else if (head === "entr") out = DED_cmdExpand(buf, fs)
        else if (head === "hyp") out = DED_cmdHyp(buf, fs)
        else if (head === "del") out = DED_cmdDel(buf, sys, fs)
        else if (head === "rename") out = DED_cmdRename(buf, sys, fs)
        else if (head === "clear") out = DED_cmdClear(buf, fs)
        else if (head === "pop") out = DED_cmdPop(fs)
        else if (head === "d") out = DED_cmdDeduct(buf.slice(1))
        else if (DED_ruleExists(head)) out = DED_cmdDeduct(buf)          // bare rule name = "d <name>"
        else out = L("未知命令：", "unknown command: ") + head
    } catch (e) {
        out = L("推理失败：", "rejected: ") + String(e && e.message ? e.message : e)
        DED_note(out)
        return out
    }

    var added = fs.propositions.length - before
    if (added > 0) {
        player.ded.proved = player.ded.proved.add(added)
        DED_grant(new Decimal(TUNING.theoremBurst).times(DED_theoremBurstMult()), false)
        DED_syncTableText(fs)
        DED_note(L("新增 ", "+") + added + L(" 条定理。", " propositions."))
    } else if (out) DED_note(out)
    return out
}

function DED_ruleExists(name) {
    var sys = DED.sys
    if (!sys || !sys.fs || !name) return false
    if (sys.fs.deductions[String(name)]) return true
    if (String(name) === ".") return !!DED.cmd.last
    // The composed fast-metarule language (v u c < > e # : ,) is resolved by the kernel itself.
    return /[<>cveu#:]/.test(String(name))
}

function DED_theoremBurstMult() {
    var m = new Decimal(1)
    if (hasUpgrade("ded", 11)) m = m.times(2)
    if (hasMilestone("ded", 2)) m = m.times(3)
    return m
}

// d <rule> [condIdx…] [replaceValues…] — negative condition indices count from the end
// (src/fs/cmd.ts:593), and the preview probe is deduct(step, undefined, true) (:641).
function DED_cmdDeduct(args) {
    var fs = DED.sys && DED.sys.fs
    if (!args.length) return L("用法：d <规则名> [条件行号] [替换量]", "usage: d <rule> [condition rows] [values]")
    var rule = String(args[0])
    if (rule === ".") rule = DED.cmd.last || rule
    var rest = args.slice(1)
    var conds = [], values = []
    while (rest.length && /^-?\d+$/.test(rest[0])) conds.push(Number(rest.shift()))
    while (rest.length) values.push(DED_parseAstText(rest.shift()))
    var total = (fs.propositions || []).length
    var step = {
        deductionIdx: rule,
        replaceValues: values,
        conditionIdxs: conds.map(function (c) { return c < 0 ? total + c : c }),
    }
    if (!DED_ruleUsable(step)) return L("推理已取消：未找到推理规则 ", "deduction cancelled: no such rule ") + rule
    fs.deduct(step)
    DED.cmd.last = rule
    return L("使用规则 ", "used rule ") + rule
}

// The grey-out rule of the original, kept honest: a row is offered only while the kernel can still
// generate it (src/fs/gui.ts:939-973 — getDeduction returns null, execDeduct prints 推理已取消).
function DED_ruleUsable(step) {
    var fs = DED.sys && DED.sys.fs
    if (!fs.deductions[step.deductionIdx]) return false
    try {
        fs.deduct({ deductionIdx: step.deductionIdx, replaceValues: step.replaceValues || [], conditionIdxs: step.conditionIdxs || [] }, undefined, true)
        return true
    } catch (e) { return false }
}

function DED_parseAstText(text) {
    var p = DED_parser()
    if (p && p.parse) { try { return p.parse(String(text)) } catch (e) { } }
    return { type: "meta", name: String(text) }
}

// meta <name> [conds…] [args…] — the eight metarules the original implements (cmd.ts:471-548).
function DED_cmdMeta(buf) {
    var fs = DED.sys && DED.sys.fs
    var name = String(buf[1] || "")
    var rest = buf.slice(2)
    var args = []
    while (rest.length && /^[-]?\d+$/.test(rest[0])) rest.shift()
    while (rest.length) args.push(rest.shift())
    var call = {
        q: function () { return fs.metaQuantifyAxiomSchema(args[0], "元规则生成*") },
        c: function () { return fs.metaNewConstant(args.map(function (a) { return DED_parseAstText(a) }), "元规则生成*") },
        f: function () { return fs.metaNewFunction([DED_parseAstText(args[0]), DED_parseAstText(args[1]), DED_parseAstText(args[2]), String(args[3] || "").split(",")], "元规则生成*") },
        prd: function () { return fs.metaNewVerb([DED_parseAstText(args[0]), DED_parseAstText(args[1]), String(args[2] || "").split(",")], "元规则生成*") },
        cdt: function () { return fs.metaConditionTheorem(args[0], "元规则生成*") },
        dt: function () { return fs.metaDeductTheorem(args[0], "元规则生成*") },
        idt: function () { return fs.metaInvDeductTheorem(args[0], "元规则生成*") },
        et: function () { return fs.metaExistTheorem(args[0], "元规则生成*") },
        vt: function () { return fs.metaUniversalTheorem(args[0], "元规则生成*") },
        cvt: function () { return fs.metaConditionUniversalTheorem(args[0], "元规则生成*") },
        cmt: function () { return fs.metaCombineTheorem([args[0]], args[1], "元规则生成*") },
        ifft: function () { return fs.metaIffTheorem(args[0], [DED_parseAstText(args[1]), DED_parseAstText(args[2])], args[3], "元规则生成*", false) },
        cpt: function () { return fs.metaCompleteTheorem(DED_parseAstText(args[0]), args[1], "元规则生成*") },
    }
    if (!call[name]) throw L("很抱歉，该规则暂未被作者实现", "sorry, that metarule is not implemented")
    call[name]()
    return L("元规则 ", "metarule ") + name + L(" 已应用。", " applied.")
}

// m <pos> <name>: record the current proposition list as a macro (cmd.ts:692-704).
function DED_cmdMacro(buf, fs) {
    var name = String(buf[buf.length - 1] || "")
    if (!name) return L("用法：m <位置> <名字>", "usage: m <position> <name>")
    fs.addMacro(name, "录制*")
    if (player.ded.macros.indexOf(name) < 0) player.ded.macros.push(name)
    return L("已录制宏 ", "macro recorded: ") + name
}

function DED_cmdMetaMacro(buf, fs) {
    var name = String(buf[1] || "")
    var params = String(buf[2] || "").split(",").filter(Boolean)
    var tree = buf[3] ? fs.getDeductionTokens(buf[3]) : null
    if (!name || !tree) return L("用法：mm <名字> <参数表> <规则表达式>", "usage: mm <name> <params> <rule expression>")
    fs.addMetaMacro(name, params, tree, "元宏录制*")
    return L("已录制元宏 ", "metamacro recorded: ") + name
}

// inln: the original forces every metarule on for the expansion and restores it after (cmd.ts:396).
function DED_cmdInline(buf, fs) {
    var keep = fs.fastmetarules
    try {
        fs.fastmetarules = "cvuqe><:#zZQR"
        var arg = String(buf[1] || "")
        if (/^\d+$/.test(arg)) fs.inlineMacroInProp(Number(arg))
        else fs.expandMacroWithDefaultValue(arg)
        return L("宏已就地展开。", "macro expanded inline.")
    } finally {
        fs.fastmetarules = keep
    }
}

// entr <n|name>: unfold one macro nesting level, over a proposition or a rule (cmd.ts:287-367).
function DED_cmdExpand(buf, fs) {
    var arg = String(buf[1] || "")
    if (/^\d+$/.test(arg)) { fs.expandMacroWithProp(Number(arg)); return L("已展开该行的宏。", "expanded the macro in that row.") }
    var keep = fs.fastmetarules
    try {
        fs.fastmetarules = "cvuqe><:#zZQRR"
        fs.expandMacroWithDefaultValue(arg)
        return L("已展开规则 ", "expanded rule ") + arg
    } finally { fs.fastmetarules = keep }
}

// hyp <proposition> | hyp pop — hypotheses go to the FRONT of the table (formalsystem.ts:234-238).
function DED_cmdHyp(buf, fs) {
    if (!hasUpgrade("ded", 15) && !hasMilestone("ded", 3)) throw L("假设尚未解锁。", "hypotheses are not unlocked yet.")
    if (buf[1] === "pop") {
        fs.removePropositions(1)
        DED.cmd.hyp = false
        return L("已撤回假设。", "hypothesis retracted.")
    }
    var text = buf.slice(1).join(" ")
    if (!text) return L("用法：hyp <命题> 或 hyp pop", "usage: hyp <proposition> | hyp pop")
    fs.addHypothese(DED_parseAstText(text))
    DED.cmd.hyp = true
    if (player.ded.table.indexOf(text) < 0) player.ded.table.push("hyp " + text)
    return L("已引入假设 ", "hypothesis added: ") + text
}

function DED_cmdDel(buf, sys, fs) {
    var name = String(buf[1] || "")
    if (!name) return L("用法：del <规则名>", "usage: del <rule>")
    var ok = fs.removeDeduction(name)
    if (ok === false) return L("该规则仍被引用：等待它先失效。", "still referenced — it cannot be removed yet.")
    var i = sys.arrD.indexOf(name)
    if (i >= 0) sys.arrD.splice(i, 1)
    return L("已删除规则 ", "rule removed: ") + name
}

function DED_cmdRename(buf, sys, fs) {
    var from = String(buf[1] || ""), to = String(buf[2] || "")
    if (!from || !to) return L("用法：rename <旧名> <新名>", "usage: rename <old> <new>")
    if (/[*\s]/.test(to)) throw L("名字不能含空格或星号。", "a name may not contain spaces or a star.")
    fs.renameDeduction(from, to)
    var i = sys.arrD.indexOf(from)
    if (i >= 0) sys.arrD[i] = to
    return L("已重命名 ", "renamed ") + from + L(" 为 ", " to ") + to
}

function DED_cmdClear(buf, fs) {
    var n = Number(buf[1])
    if (isFinite(n) && n > 0) { fs.removePropositions(n); return L("已删除 ", "removed ") + n + L(" 行。", " rows.") }
    fs.propositions = []
    return L("定理表已清空。", "theorem table cleared.")
}

function DED_cmdPop(fs) {
    fs.removePropositions(1)
    return L("已弹出最后一行。", "popped the last row.")
}

// The workspace is saved as command text, so a reload replays it exactly.
function DED_syncTableText(fs) {
    var rows = []
    var props = fs.propositions || []
    for (var i = 0; i < props.length; i++) {
        var p = props[i]
        rows.push((p.from ? "" : "hyp ") + DED_astText(p.value))
    }
    player.ded.table = rows
    if (DED.cmd && DED.cmd.last) player.ded.lastRule = DED.cmd.last
}

// --- rendering -----------------------------------------------------------------------------------
function DED_renderCommandBox() {
    var hint = L(
        "命令：<规则名> 或 d <规则名> [条件行号] [替换量] · meta <cdt|dt|idt|cvt|vt|et|q|c|f|prd|cmt|ifft|cpt> · m 录制宏 · inln · entr · hyp · del · rename · pop · clear",
        "commands: <rule> or d <rule> [condition rows] [values] · meta <cdt|dt|idt|cvt|vt|et|q|c|f|prd|cmt|ifft|cpt> · m record macro · inln · entr · hyp · del · rename · pop · clear")
    return "<div style='font-family:Consolas,monospace;font-size:12px;opacity:.65;max-width:720px;margin:6px auto'>" + hint +
        (DED.error ? "<div style='color:#ff8080'>kernel: " + DED.error + "</div>" : "") + "</div>"
}

function DED_renderTheorems() {
    var head = "<h3>" + L("定理表", "Theorem table") + "</h3>"
    if (!DED_kernelReady()) return head + "<div>" + L("内核未载入：删除 js/deductrium/ 时的只读状态（内核按作者授权复用，见 ATTRIBUTION.md）。","kernel not loaded: the read-only state when js/deductrium/ is absent (the kernel is reused under the author's permission — see ATTRIBUTION.md).") + "</div>"
    var fs = DED.sys && DED.sys.fs
    var props = (fs && fs.propositions) || player.ded.table || []
    if (!props.length) return head + "<div style='opacity:.6'>" + L("空表——先按下面的按钮或输入一条规则。", "empty — run a rule, or type one below.") + "</div>" + DED_notesRender()
    var out = "<div style='font-family:Consolas,monospace;text-align:left;max-width:760px;margin:0 auto;font-size:14px'>"
    for (var i = 0; i < props.length; i++) {
        var p = props[i], text
        if (p && p.value !== undefined) text = DED_astText(p.value)
        else text = String(p)
        var from = p && p.from ? (p.from.deductionIdx || "") : L("假设", "hyp")
        var unused = p && p.from ? "" : ""
        out += "<div style='border-bottom:1px solid #222;padding:2px 0'><span style='opacity:.5'>" + i +
            "</span> " + text + " <span style='opacity:.55'>[" + from + "]</span>" + unused + "</div>"
    }
    out += "</div>" + DED_notesRender()
    return out
}

function DED_renderRules() {
    var head = "<h3>" + L("规则表", "Rule table") + "</h3>"
    var sys = DED.sys
    if (!sys || !sys.arrD) return head + "<div>" + L("内核未载入：删除 js/deductrium/ 时的只读状态（内核按作者授权复用，见 ATTRIBUTION.md）。","kernel not loaded: the read-only state when js/deductrium/ is absent (the kernel is reused under the author's permission — see ATTRIBUTION.md).") + "</div>"
    var fs = sys.fs
    var out = "<div style='font-family:Consolas,monospace;text-align:left;max-width:760px;margin:0 auto;font-size:13px'>"
    var shown = 0
    for (var i = 0; i < sys.arrD.length && shown < 60; i++) {
        var name = sys.arrD[i]
        if (!name || name.indexOf("< f >") === 0) continue
        var d = fs.deductions[name]
        if (!d) continue
        shown++
        var usable = DED_ruleUsable({ deductionIdx: name, replaceValues: [], conditionIdxs: [] })
        var conclusion = d.conclusion ? DED_astText(d.conclusion) : ""
        out += "<div style='opacity:" + (usable ? "1" : ".35") + ";padding:2px 0'><b>" + name + "</b> " +
            conclusion + (d.replaceNames && d.replaceNames.length ? " <span style='opacity:.55'>" + d.replaceNames.join(" ") + "</span>" : "") + "</div>"
    }
    out += "</div>"
    return out + (shown ? "" : "<div>" + L("规则表为空。", "no rules yet.") + "</div>")
}

function DED_renderDepth() {
    var fs = DED.sys && DED.sys.fs
    var out = "<div style='text-align:left;max-width:760px;margin:0 auto'>"
    out += "<h3>" + L("推导深度", "Proof depth") + "</h3>"
    out += "<div>" + L("已证定理 ", "theorems proved this run: ") + formatWhole(player.ded.proved) + "</div>"
    out += "<div>" + L("规则数 ", "rules: ") + (DED.sys && DED.sys.arrD ? DED.sys.arrD.length : 0) +
        " · " + L("元宏 ", "metamacros: ") + (fs && fs.metaMacro ? Object.keys(fs.metaMacro).length : 0) + "</div>"
    out += "<div>" + L("已解锁的快速元规则 ", "fast metarule letters: ") +
        (fs && fs.fastmetarules ? fs.fastmetarules : player.ded.fastmetarules) + "</div>"
    out += "<div>" + L("宏 ", "macros: ") + ((player.ded.macros || []).join(", ") || "—") + "</div>"
    return out + "</div>" + DED_notesRender()
}

