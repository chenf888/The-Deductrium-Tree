// ded — the deduction workspace. Row 0, the anchor layer: 推理素 in, 演绎 (deductions) out.
// This is the layer the original game IS: the command box, the theorem table, the rule table.
// type:"custom" because the prestige also has to clear the workspace, which no stock formula does.
addLayer("ded", {
    name: "Deduction",
    symbol: "D",
    color: "#4BDC13",
    resource: "deductions",
    baseResource: "Deductriums",
    row: 0,
    position: 0,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
            cmd: "d",                 // never "" or numeric: toValue() would coerce it to a Number
            table: [],                // propositions in the live workspace (source text)
            rules: [],                // rules the player named this run
            macros: [],
            proved: new Decimal(0),
            surge: 0,                 // seconds of stockpiled production (K9, upgrade 32)
            keepTable: false,         // milestone 5 grants it
            autoDeduct: false,
            // Written by DED_dispatchKeywords when a map tile grants a metarule/symbol and read by
            // six upgrades; without these declarations the first rewarding tile throws (audit_fields).
            fastmetarules: "",
            symbols: "",
            lastRule: "",
            notes: [],
        }
    },

    type: "custom",
    baseAmount() { return player.points },
    requires: function () { return tunRequires("ded") },
    exponent: tunExponent("ded"),

    // The gain itself is the stock normal formula, delegated so the softcap curve stays the engine's.
    getResetGain() { return tunNormalGain(this.layer) },
    getNextAt(canMax) { return tunNormalNextAt(this.layer) },
    canReset() {
        return player.points.gte(tmp[this.layer].requires) && player.ded.proved.gte(3)
    },
    // Sim-only: the "3 proved theorems" gate is content the headless harness never produces
    // (it does not type into the command box). The pacing lower bound uses the currency gate.
    simCanReset() { return player.points.gte(tunRequires("ded")) },

    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("ded", 33)) mult = mult.times(tunCross(player.zfc.points, 0.2))
        return mult
    },
    gainExp() {
        // A shape change, not a multiplier: the curve itself bends (upgrade 34).
        if (hasUpgrade(this.layer, 34)) return new Decimal(1.05)
        return new Decimal(1)
    },
    directMult() {
        let m = new Decimal(1)
        if (hasUpgrade(this.layer, 24)) m = m.times(2)
        if (hasMilestone(this.layer, 4)) m = m.times(2)
        return m
    },
    softcap() {
        return tunSoftcap("ded").times(hasUpgrade("ded", 22) ? 10 : 1)
    },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.ded, Decimal.min(player.ded.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.ded + "，", " (×" + TUNING.effectBase.ded + " per level, ") +
            TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    resetDescription() { return L("收束证明，换取 ", "Close the proof for ") },
    prestigeButtonText() {
        if (!canReset(this.layer)) {
            return L("需要 ", "Requires ") + formatWhole(tmp[this.layer].requires) +
                L(" 推理素与至少 3 条已证定理（当前 ", " Deductriums and 3 proved theorems (have ") +
                formatWhole(player.ded.proved) + L("）", ")")
        }
        return L("收束证明，换取 ", "Close the proof for ") + formatWhole(tmp[this.layer].resetGain) +
            " " + L("演绎。之后推理素归零", " deductions. Your Deductriums are spent")
    },

    onPrestige(gain) {
        player.theoremsProved = player.theoremsProved.add(player.ded.proved)
        if (!hasMilestone(this.layer, 5) && !player.ded.keepTable) DED_resetWorkspace()
        player.ded.proved = new Decimal(0)
    },

    // 07 F17: the engine calls this hook for this layer's OWN prestige and for row-mates too, and the
    // gain is already banked — only a DEEPER row may sweep. 07 F18: arrays cannot ride the keep list.
    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        // A deeper run starts from an empty page unless milestone 5 (or the flag) keeps the table.
        // Learned knowledge — metarule letters and symbols from map tiles — is not a per-run resource.
        let keepTable = hasMilestone(this.layer, 5) || player.ded.keepTable
        let table = keepTable ? (player.ded.table || []).slice() : []
        let rules = (player.ded.rules || []).slice()
        let macros = (player.ded.macros || []).slice()
        layerDataReset(this.layer, ["unlocked", "best", "total", "cmd", "autoDeduct", "keepTable", "surge", "fastmetarules", "symbols"])
        player.ded.rules = rules
        player.ded.macros = macros
        player.ded.table = table
        // The kernel's propositions survive layerDataReset (it only touches `player`); keeping the
        // table means keeping that workspace. Only an actual fresh run must clear it.
        if (!keepTable) DED_resetWorkspace()
        else if (typeof DED_syncTableText === "function" && DED.sys && DED.sys.fs) DED_syncTableText(DED.sys.fs)
    },

    passiveGeneration() {
        // meta.m0 grants it (brief §6 step 2). Must be a plain NUMBER (N-PGBOOL).
        if (hasMilestone("meta", 0)) return 1
        return 0
    },

    update(diff) {
        if (!player[this.layer].unlocked) return
        DED_boot()
        ACH_backfill()
        if (player.ded.surge > 0) {
            let seconds = Math.min(diff, player.ded.surge)
            player.ded.surge -= seconds
            DED_grant(getPointGen().times(seconds))
        }
    },

    layerShown() { return true },

    hotkeys: [
        {
            key: "c",
            description: L("c：收束证明，把推理素换成演绎", "c: close the proof, trading Deductriums for deductions"),
            onPress() { if (player.ded.unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "证明": {
            buttonStyle() { return { "min-width": "90px" } },
            content: [
                ["display-text", function () { return mainLine("ded", 0) }],
                ["display-text", function () { return baseLine("ded") + " · " + L("已证 ", "proved ") + formatWhole(player.ded.proved) }],
                ["display-text", function () { return softcapWarning("ded") }],
                ["display-text", function () { return DED_prodCapLine() }],
                "prestige-button",
                "blank",
                ["raw-html", function () { return DED_renderCommandBox() }],
                ["text-input", "cmd"],
                ["clickables", [1]],
                ["raw-html", function () { return DED_renderTheorems() }],
                "blank",
                ["bar", "queue"],
                ["microtabs", "workspace"],
                ["blank", "40px"],
            ],
        },
        "统计": {
            content: [
                ["display-text", function () { return mainLine("ded", 0) }],
                "resource-display",
                ["raw-html", function () { return DED_renderRules() }],
            ],
        },
    },

    microtabs: {
        workspace: {
            "定理表": {
                content: [["raw-html", function () { return DED_renderTheorems() }]],
            },
            "规则表": {
                unlocked() { return hasUpgrade("ded", 15) },
                content: [["raw-html", function () { return DED_renderRules() }]],
            },
            "推导深度": {
                unlocked() { return hasMilestone("ded", 3) },
                content: [["raw-html", function () { return DED_renderDepth() }]],
            },
            "里程碑": {
                content: [["blank", "15px"], "milestones"],
            },
        },
    },

    bars: {
        queue: {
            direction: RIGHT,
            width: 400,
            height: 24,
            instant: true,
            display() { return formatWhole(DED_tableRows()) + " / " + DED_tableCap() + L(" 定理占位", " propositions seated") },
            progress() { return DED_tableRows() / DED_tableCap() },
            fillStyle: { "background-image": "linear-gradient(to right, #4BDC13, #a6ff8f)" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("第一次推理", "First Inference") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(1),
            effect() { return new Decimal(2) },
        },
        12: {
            title: function () { return L("反证法", "Proof by Contradiction") },
            description: function () { return L("全局收入 ×(演绎+1)^0.4。", "All production ×(deductions+1)^0.4.") },
            cost: new Decimal(5),
            unlocked() { return hasUpgrade(this.layer, 11) },
            effect() { return tunSelf(player[this.layer].points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("更宽的纸面", "A Wider Page") },
            description: function () { return L("定理表多容纳 3 行。", "The theorem table holds 3 more rows.") },
            cost: new Decimal(25),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        14: {
            title: function () { return L("走过的位置", "Ground Walked") },
            description: function () { return L("全局收入 ×(1 + lg 格位)。", "All production ×(1 + log₁₀ tiles).") },
            cost: new Decimal(80),
            unlocked() { return player.geo.unlocked },
            effect() { return Decimal.add(1, player.geo.points.max(1).log10()) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        15: {
            title: function () { return L("规则表展开", "Open the Rule Table") },
            description: function () { return L("解锁“规则表”子标签。", "Unlocks the Rules subtab.") },
            cost: new Decimal(150),
        },
        21: {
            title: function () { return L("宏就地展开", "Inline Macros") },
            description: function () { return L("宏在推导中自动就地展开一层。", "Macros expand one level inline during a deduction.") },
            cost: new Decimal(300),
            tooltip: function () { return L("展开的次数不是乘数——它改变推导的形状。", "Not a multiplier: it changes how a proof expands.") },
        },
        22: {
            title: function () { return L("公理化野心", "Axiomatic Ambition") },
            description: function () { return L("演绎软上限 ×10（当前 ", "Deduction softcap ×10 (currently ") + format(tunSoftcap("ded").times(10)) + L("）。", ").") },
            cost: new Decimal(600),
            unlocked() { return player.ded.points.gte(60) },
        },
        23: {
            title: function () { return L("再宽一点", "Wider Still") },
            description: function () { return L("定理表再多容纳 4 行。", "The theorem table holds 4 more rows.") },
            cost: new Decimal(1200),
            unlocked() { return hasUpgrade(this.layer, 13) },
        },
        24: {
            title: function () { return L("收束的仪式", "The Closing Ritual") },
            description: function () { return L("每次收束的证明 ×2。", "Each closed proof yields ×2.") },
            cost: new Decimal(3000),
            unlocked() { return player.ded.points.gte(150) },
            effect() { return new Decimal(2) },
        },
        25: {
            title: function () { return L("假设的引入", "Introducing Hypotheses") },
            description: function () { return L("解锁“盲推”挑战。", "Unlocks the Blind Deduction challenge.") },
            cost: new Decimal(7000),
        },
        31: {
            title: function () { return L("断言工具", "Assertion Tools") },
            description: function () { return L("解锁 #nf / #rp / #crp 断言按钮。", "Unlocks the #nf / #rp / #crp assertion buttons.") },
            cost: new Decimal(2e4),
            unlocked() { return player.meta.unlocked },
        },
        32: {
            title: function () { return L("灵光一现", "Flash of Insight") },
            description: function () { return L("购买后立即获得 60 秒的生产。", "Instantly grants 60 seconds of production.") },
            cost: new Decimal(6e4),
            onPurchase() { player[this.layer].surge += 60 },
        },
        33: {
            title: function () { return L("集合论的底气", "Set-Theoretic Nerve") },
            description: function () { return L("每条已采纳的 ZFC 公理使演绎收益 +20%。", "Each adopted ZFC axiom gives deductions +20%.") },
            cost: new Decimal(15e4),
            unlocked() { return player.zfc.unlocked },
            effect() { return tunCross(player.zfc.points, 0.2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        34: {
            title: function () { return L("曲线的弯度", "Bending the Curve") },
            description: function () { return L("演绎的指数由 0.5 变为 0.525。", "The deduction exponent becomes 0.525 instead of 0.5.") },
            cost: new Decimal(4e5),
            unlocked() { return hasMilestone(this.layer, 2) },
        },
        35: {
            title: function () { return L("队列的第二排", "A Second Row") },
            description: function () { return L("解锁“证明队列”买可购物。", "Unlocks the proof-queue buyable.") },
            cost: new Decimal(1e6),
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(TUNING.automation.dedSafe) + L(" 演绎（历史最高）", " deductions (best)") },
            effectDescription() { return L("采纳公理不再清掉你的这一局", "adopting axioms no longer wipes your run") },
            done() { return player[this.layer].best.gte(TUNING.automation.dedSafe) },
        },
        1: {
            requirementDescription() { return formatWhole(12) + L(" 演绎", " deductions") },
            effectDescription() { return L("定理表 +2 行", "theorem table +2 rows") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].best.gte(12) },
        },
        2: {
            requirementDescription() { return formatWhole(25) + L(" 演绎", " deductions") },
            effectDescription() { return L("全局收入 ×3", "all production ×3") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(25) },
        },
        3: {
            requirementDescription() { return formatWhole(60) + L(" 演绎", " deductions") },
            effectDescription() { return L("解锁“推导深度”子标签", "unlocks the Proof Depth subtab") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(60) },
        },
        4: {
            requirementDescription() { return formatWhole(150) + L(" 累计演绎", " deductions made") },
            effectDescription() { return L("收束 ×2", "closing ×2") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].total.gte(150) },
        },
        5: {
            requirementDescription() { return formatWhole(400) + L(" 累计演绎", " deductions made") },
            effectDescription() { return L("收束不再清空定理表", "closing keeps the theorem table") },
            unlocked() { return hasMilestone(this.layer, 4) },
            done() { return player[this.layer].total.gte(400) },
        },
    },

    buyables: {
        11: {
            title: function () { return L("证明队列", "Proof Queue") },
            cost(x) { return Decimal.pow(2, x.add(1)).times(3).floor() },
            effect(x) { return x.times(2) },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("每次 +2 定理占位（已 ", "+2 proposition seats each (have ") + formatWhole(d.bought) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("演绎", "deductions")
            },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            unlocked() { return hasUpgrade("ded", 35) },
        },
    },

    clickables: {
        11: {
            title: function () { return "#nf" },
            display() { return L("否定引入", "negation intro") },
            canClick() { return hasUpgrade("ded", 31) && DED_boot() },
            onClick() { DED_exec("#nf") },
            style: { "background-color": "#374151" },
        },
        12: {
            title: function () { return "#rp" },
            display() { return L("重言式", "repetition") },
            canClick() { return hasUpgrade("ded", 31) && DED_boot() },
            onClick() { DED_exec("#rp") },
            style: { "background-color": "#374151" },
        },
        13: {
            title: function () { return "#crp" },
            display() { return L("矛盾重言", "contradiction") },
            canClick() { return hasUpgrade("ded", 31) && DED_boot() },
            onClick() { DED_exec("#crp") },
            style: { "background-color": "#374151" },
        },
        14: {
            title: function () { return "check" },
            display() { return L("检查依赖", "check dependencies") },
            canClick() { return DED_boot() },
            onClick() { DED_exec("check") },
            style: { "background-color": "#374151" },
        },
        15: {
            title: function () { return "unwrap" },
            display() { return L("剥开假设", "unwrap hypotheses") },
            canClick() { return DED_boot() },
            onClick() { DED_exec("unwrap") },
            style: { "background-color": "#374151" },
        },
        16: {
            // The engine's text-input only writes player.ded.cmd (components.js:558) and has no
            // submit event, so the run button is what turns the box into a command line.
            title: function () { return L("执行", "run") },
            display() { return L("运行输入框里的命令（Enter 不会自动执行）", "run the command in the box (Enter does not submit)") },
            canClick() { return DED_bootCommander() && String(player.ded.cmd || "").trim().length > 0 },
            onClick() { DED_exec(player.ded.cmd) },
            style: { "background-color": "#2f6f3f" },
        },
    },

    challenges: {
        11: {
            name: function () { return L("盲推", "Blind Deduction") },
            challengeDescription() {
                return L("定理表不再贡献任何收入——只有已经买下的东西在说话。",
                    "The theorem table contributes no production at all — only what you already own speaks.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/3"
            },
            goalDescription() { return L("在本挑战内证出 20 条定理", "prove 20 theorems inside the challenge") },
            canComplete() { return player.ded.proved.gte(20) },
            // The count is a per-run metric; entry must start it (and the table) from zero.
            onEnter() { DED_resetWorkspace() },
            rewardDescription() { return L("全局收入 ×2，每完成一次再 ×2", "all production ×2, another ×2 per completion") },
            rewardEffect() { return Decimal.pow(2, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 3,
            unlocked() { return hasUpgrade("ded", 25) },
        },
    },
})

// Table capacity: the base slots, plus every promise that widens the page (upgrades 13/23,
// milestone 1) and the queue buyable. getPointGen reads the same function, so the number you see
// is the number that is paid.
function DED_tableCap() {
    let cap = TUNING.tableSlots
    if (typeof player !== "undefined" && player.ded) {
        if (hasUpgrade("ded", 13)) cap += 3
        if (hasUpgrade("ded", 23)) cap += 4
        if (hasUpgrade("fol", 12)) cap += 3
        if (hasUpgrade("meta", 23)) cap += 2
        if (hasMilestone("ded", 1)) cap += 2
        cap += Math.floor(getBuyableAmount("ded", 11).toNumber()) * 2
    }
    return cap
}
