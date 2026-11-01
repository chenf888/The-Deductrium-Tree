// fol — Axioms 命题公理. Row 1, position 2. A capped static layer: every adoption is one floor, and
// the theme ceiling (5) is a fact about propositional logic, not a tuning knob (design-brief §8).
// Upgrades are paid in Deductriums (currencyInternalName "points" resolves to the root currency —
// js/utils.js:41), so the upgrade ladder spans orders of magnitude like a normal layer (D-COSTSPAN).
// Nothing in this file touches DED/DED_KERNEL: the headless simulator can run it without the kernel.

addLayer("fol", {
    name: "Axioms 命题公理",
    symbol: "A",
    color: "#E0535A",
    resource: "命题公理",
    baseResource: "推理素",
    row: 1,
    position: 2,
    type: "static",
    base: 2,
    exponent: 1,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
        }
    },

    requires: function () { return tunRequires("fol") },
    baseAmount() { return player.points },
    // Buy-max would skip floors: with a fixed ceiling (5, 5, 9, 4, 6) one press must buy exactly one
    // floor, and canReset() refuses past the ceiling. (Measured: buy-max took hott from 0 to 29.)
    canBuyMax() { return false },
    resetsNothing() { return hasMilestone("ded", 0) },
    // N-AUTOWIPE: autoPrestige's set must imply resetsNothing's — the conjunction is explicit.
    autoPrestige() { return hasMilestone("ded", 0) && hasMilestone("pea", 2) },
    autoUpgrade() { return hasMilestone("mac", 4) },
    canReset() { return tunStaticCanReset(this.layer) },

    effect() { return Decimal.pow(TUNING.effectBase.axiom, player.fol.points) },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每条公理 ×" + TUNING.effectBase.axiom + "）", " (×" + TUNING.effectBase.axiom + " per axiom)")
    },

    // A static layer's own gain is a floor count; upgrades 13/23 bend how many floors one adoption
    // buys (gainMult divides the price, so 2 = "cheaper axiom") — never more than the ceiling.
    gainMult() {
        let m = new Decimal(1)
        // On a STATIC layer gainMult multiplies the next price (game.js getNextAt), so 0.5 = cheaper.
        if (hasUpgrade(this.layer, 15)) m = m.times(0.5)
        if (hasMilestone(this.layer, 1)) m = m.times(0.5)
        return m
    },

    prestigeButtonText() { return staticButtonText(this.layer) },

    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        layerDataReset(this.layer, ["unlocked", "best", "total"])
        // ord.u12 — one adopted proposition survives the final consumable reset (K4, named mechanic).
        if (resettingLayer === "ord" && hasUpgrade("ord", 12) && player.fol.points.lt(1)) player.fol.points = new Decimal(1)
    },

    layerShown() { return player.ded.best.gte(8) },

    hotkeys: [
        {
            key: "f",
            description: L("f：采纳下一条命题公理", "f: adopt the next propositional axiom"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "公理": {
            content: [
                ["display-text", function () { return mainLine("fol") }],
                ["display-text", function () { return capLine("fol", player.fol.points, tunCap("fol")) }],
                "prestige-button",
                ["bar", "reach"],
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
            "挑战": { unlocked() { return hasMilestone("fol", 0) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(tunAxiomPrice("fol", player.fol.points)) + L(" 推理素", " Deductriums")
            },
            progress() { return staticReach("fol") },
            fillStyle: { "background-color": "#E0535A" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("命题公理可用", "Propositional Axioms Online") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(2e4),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            effect() { return new Decimal(2) },
        },
        12: {
            title: function () { return L("更深的展开", "Deeper Unfolding") },
            description: function () { return L("定理表多容纳 3 行（活定理表是收入来源）。",
                "The theorem table holds 3 more rows (the live table is a production source).") },
            cost: new Decimal(4e4),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
        },
        13: {
            title: function () { return L("元规则的回声", "Echo of the Metarules") },
            description: function () { return L("全局收入 ×(1 + 元规则层 × 0.3)。", "All production ×(1 + metarule layer × 0.3).") },
            cost: new Decimal(8e4),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.meta.unlocked && player[this.layer].points.gte(1) },
        },
        14: {
            title: function () { return L("公理面板", "The Axiom Panel") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(2e5),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        15: {
            title: function () { return L("自举的公理", "Self-Bootstrapping Axioms") },
            description: function () { return L("每次采纳的层数 ×2（公理更便宜）。", "Each adoption buys ×2 floors (axioms get cheaper).") },
            cost: new Decimal(5e5),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        21: {
            title: function () { return L("重言式工厂", "Tautology Works") },
            description: function () { return L("全局收入 ×(已采纳公理+1)^0.5。", "All production ×(axioms+1)^0.5.") },
            cost: new Decimal(1.5e6),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        22: {
            title: function () { return L("字面量的呼应", "A Literal Echo") },
            description: function () { return L("全局收入 ×(1 + 字面量 × 0.2)。", "All production ×(1 + literals × 0.2).") },
            cost: new Decimal(4e6),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.lit.unlocked && player[this.layer].points.gte(3) },
            effect() { return tunCross(player.lit.points, 0.2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        23: {
            title: function () { return L("闸后的公理", "Axioms Beyond the Gate") },
            description: function () { return L("已破至少一道闸时，全局收入 ×2。", "Once a gate has been destructed, all production ×2.") },
            cost: new Decimal(1e7),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
        },
        24: {
            title: function () { return L("c 规则的草稿", "Drafting the c-rule") },
            description: function () { return L("把元规则 c 加入快速规则带。", "Adds the c metarule to the fast rule bar.") },
            cost: new Decimal(3e7),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("c") < 0) player.ded.fastmetarules += "c"
            },
        },
        25: {
            title: function () { return L("纯句法的赌局", "The Purely Syntactic Wager") },
            description: function () { return L("解锁“纯句法”挑战。", "Unlocks the Purely Syntactic challenge.") },
            cost: new Decimal(1e8),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(5) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 条命题公理", " propositional axiom") },
            effectDescription() { return L("解锁挑战面板", "unlocks the Challenges panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(6) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("公理更便宜（采纳层数 ×2）", "axioms get cheaper (×2 floors per adoption)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(6) },
        },
        2: {
            requirementDescription() { return formatWhole(12) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("全局收入 ×3", "all production ×3") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].total.gte(12) },
        },
        3: {
            requirementDescription() { return formatWhole(5) + L(" 条公理", " axioms at once") },
            effectDescription() { return L("挑战奖励上限翻倍", "challenge rewards cap doubles") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(5) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("纯句法", "Purely Syntactic") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的十分之一——公理本身不关心经济。",
                    "Inside this run Deductriums flow at one tenth — axioms do not care about economics.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内采纳 2 条公理", "adopt 2 axioms inside the challenge") },
            canComplete() { return player.fol.points.gte(2) },
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
