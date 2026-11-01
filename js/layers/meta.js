// meta — Metarule 元规则. Row 1, position 1. The shop layer (M8): nearly every upgrade here is a
// named mechanic or a cap move, never "another ×n" (design-brief §4.1). Its milestone 0 is where the
// deduction layer starts generating on its own (ded.passiveGeneration reads it).

addLayer("meta", {
    name: "Metarules 元规则",
    symbol: "M",
    color: "#3F8ED8",
    resource: "元规则",
    baseResource: "推理素",
    row: 1,
    position: 1,
    type: "normal",

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
        }
    },

    baseAmount() { return player.points },
    requires: function () { return tunRequires("meta") },
    exponent: tunExponent("meta"),

    canReset() { return player.points.gte(tmp[this.layer].requires) },
    // Sim-only: the harness has no map/command context, so the currency gate is the lower bound.
    simCanReset() { return player.points.gte(tunRequires("meta")) },

    gainMult() {
        let m = new Decimal(1)
        if (player.typ && player.typ.points) m = m.times(tunCross(player.typ.points, 0.4))
        if (hasUpgrade(this.layer, 21)) m = m.times(tunSelf(player[this.layer].points, 0.5))
        if (hasMilestone(this.layer, 3)) m = m.times(2)
        return m
    },
    softcap() { return tunSoftcap("meta").times(hasUpgrade("meta", 22) ? 10 : 1) },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.meta, Decimal.min(player.meta.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.meta + "，", " (×" + TUNING.effectBase.meta + " per level, ") +
            TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    resetDescription() { return L("整理元规则，换取 ", "Tidy the metarules for ") },
    prestigeButtonText() {
        if (!canReset(this.layer)) return L("需要 ", "Requires ") + formatWhole(tmp[this.layer].requires) + L(" 推理素", " Deductriums")
        return L("整理元规则，换取 ", "Tidy the metarules for ") + formatWhole(tmp[this.layer].resetGain) +
            L(" 元规则。推理素归零", " metarules. Deductriums are spent")
    },

    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        layerDataReset(this.layer, ["unlocked", "best", "total"])
    },

    passiveGeneration() { return hasMilestone(this.layer, 1) ? 0.02 : 0 },

    layerShown() { return player.ded.best.gte(5) },

    hotkeys: [
        {
            key: "r",
            description: L("r：整理元规则", "r: tidy the metarules"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "元规则": {
            content: [
                ["display-text", function () { return mainLine("meta") }],
                ["display-text", function () { return baseLine("meta") }],
                ["display-text", function () { return softcapWarning("meta") }],
                "prestige-button",
                "blank",
                ["microtabs", "stuff"],
                ["blank", "40px"],
            ],
        },
    },

    microtabs: {
        stuff: {
            "升级": { content: ["blank", "upgrades"] },
            "里程碑": { content: ["blank", "milestones"] },
            "挑战": { unlocked() { return hasMilestone("meta", 1) }, content: ["blank", "challenges"] },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("元规则上线", "Metarules Online") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(1),
            effect() { return new Decimal(2) },
        },
        12: {
            title: function () { return L("q 规则的乘数", "The q-rule Multiplier") },
            description: function () { return L("把元规则 q 加入快速规则带。", "Adds the q metarule to the fast rule bar.") },
            cost: new Decimal(3),
            unlocked() { return hasUpgrade(this.layer, 11) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("q") < 0) player.ded.fastmetarules += "q"
            },
        },
        13: {
            title: function () { return L("类型的回音", "Echo of Types") },
            description: function () { return L("每次整理的元规则 ×(1 + 类型层 × 0.4)。", "Metarules per reset ×(1 + type layer × 0.4).") },
            cost: new Decimal(25),
            unlocked() { return player.typ.unlocked && hasUpgrade(this.layer, 12) },
            effect() { return tunCross(player.typ.points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("挑战的草稿", "Drafting a Challenge") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(120),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        15: {
            title: function () { return L("规则的余温", "Afterglow of Rules") },
            description: function () { return L("每次整理的元规则 ×2。", "Metarules per reset ×2.") },
            cost: new Decimal(500),
            unlocked() { return hasUpgrade(this.layer, 13) },
            effect() { return new Decimal(2) },
        },
        21: {
            title: function () { return L("元规则的自举", "Metarule Bootstrapping") },
            description: function () { return L("每次整理的元规则 ×(元规则+1)^0.5。", "Metarules per reset ×(metarules+1)^0.5.") },
            cost: new Decimal(2e3),
            unlocked() { return hasUpgrade(this.layer, 15) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        22: {
            title: function () { return L("更宽的书页", "A Wider Page") },
            description: function () { return L("元规则软上限 ×10（当前 ", "Metarule softcap ×10 (currently ") +
                format(tunSoftcap("meta").times(10)) + L("）。", ").") },
            cost: new Decimal(6e3),
            unlocked() { return player.meta.points.gte(15) },
        },
        23: {
            title: function () { return L("定理表的边缘", "Edge of the Theorem Table") },
            description: function () { return L("定理表多容纳 2 行。", "The theorem table holds 2 more rows.") },
            cost: new Decimal(4e4),
            unlocked() { return hasUpgrade(this.layer, 21) },
        },
        24: {
            title: function () { return L("元层面的凝视", "The Metalevel Gaze") },
            description: function () { return L("全局收入 ×lg(元规则+1)^2。", "All production ×lg(metarules+1)^2.") },
            cost: new Decimal(2e5),
            unlocked() { return player.meta.points.gte(40) },
            effect() { return player[this.layer].points.add(1).log10().pow(2).max(1) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        25: {
            title: function () { return L("元规则的赌局", "The Metarule Wager") },
            description: function () { return L("解锁“无元规则”挑战。", "Unlocks the Metarule-less challenge.") },
            cost: new Decimal(9e5),
            unlocked() { return hasMilestone(this.layer, 2) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(TUNING.automation.metaPassive) + L(" 元规则（历史最高）", " metarules (best)") },
            effectDescription() { return L("演绎层开始被动生产推理素", "the Deduction layer starts producing Deductriums passively") },
            done() { return player[this.layer].best.gte(TUNING.automation.metaPassive) },
        },
        1: {
            requirementDescription() { return formatWhole(8) + L(" 累计元规则", " metarules made") },
            effectDescription() { return L("元规则被动增长，并解锁挑战面板", "metarules grow passively, and the Challenges panel opens") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(8) },
        },
        2: {
            requirementDescription() { return formatWhole(6) + L(" 元规则（历史最高）", " metarules (best)") },
            effectDescription() { return L("全局收入 ×4", "all production ×4") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(6) },
        },
        3: {
            requirementDescription() { return formatWhole(20) + L(" 累计元规则", " metarules made") },
            effectDescription() { return L("元规则收益 ×2", "metarule gain ×2") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].total.gte(20) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("无元规则", "Metarule-less") },
            challengeDescription() {
                return L("这局里推理素产出只有十分之一——规则不能谈论规则。",
                    "Inside this run Deductriums flow at one tenth — rules may not talk about rules.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内整理出 2 条元规则", "tidy 2 metarules inside the challenge") },
            canComplete() { return player.meta.points.gte(2) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×2，每完成一次再 ×2", "all production ×2, another ×2 per completion") },
            rewardEffect() { return Decimal.pow(2, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 2,
            unlocked() { return hasUpgrade(this.layer, 25) },
        },
    },
})
