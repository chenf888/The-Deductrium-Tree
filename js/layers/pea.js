// pea — Predicates 谓词公理. Row 2, position 1. Second capped static layer (ceiling 5). Its milestone
// 2 is where the axiom ladder becomes hands-off: autoPrestige for fol AND pea (design-brief §6 step 3).
// Upgrades are paid in Deductriums via currencyInternalName "points" (js/utils.js:41).

addLayer("pea", {
    name: "Predicates 谓词公理",
    symbol: "P",
    color: "#D9534F",
    resource: "谓词公理",
    baseResource: "推理素",
    row: 2,
    position: 1,
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

    requires: function () { return tunRequires("pea") },
    baseAmount() { return player.points },
    // Buy-max would skip floors: with a fixed ceiling (5, 5, 9, 4, 6) one press must buy exactly one
    // floor, and canReset() refuses past the ceiling. (Measured: buy-max took hott from 0 to 29.)
    canBuyMax() { return false },
    resetsNothing() { return hasMilestone("ded", 0) },
    autoPrestige() { return hasMilestone("ded", 0) && hasMilestone("pea", 2) },
    autoUpgrade() { return hasMilestone("mac", 4) },
    canReset() { return tunStaticCanReset(this.layer) },

    effect() { return Decimal.pow(TUNING.effectBase.axiom, player.pea.points) },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每条公理 ×" + TUNING.effectBase.axiom + "）", " (×" + TUNING.effectBase.axiom + " per axiom)")
    },

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
        if (resettingLayer === "ord" && hasUpgrade("ord", 12) && player.pea.points.lt(1)) player.pea.points = new Decimal(1)
    },

    layerShown() { return player.fol.best.gte(1) },

    hotkeys: [
        {
            key: "p",
            description: L("p：采纳下一条谓词公理", "p: adopt the next predicate axiom"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "公理": {
            content: [
                ["display-text", function () { return mainLine("pea") }],
                ["display-text", function () { return capLine("pea", player.pea.points, tunCap("pea")) }],
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
            "挑战": { unlocked() { return hasMilestone("pea", 0) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(tunAxiomPrice("pea", player.pea.points)) + L(" 推理素", " Deductriums")
            },
            progress() { return staticReach("pea") },
            fillStyle: { "background-color": "#D9534F" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("谓词公理可用", "Predicate Axioms Online") },
            description: function () { return L("全局收入 ×3。", "All production ×3.") },
            cost: new Decimal(5e6),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            effect() { return new Decimal(3) },
        },
        12: {
            title: function () { return L("∀ 引入", "∀ Introduction") },
            description: function () { return L("把元规则 u 加入快速规则带。", "Adds the u metarule to the fast rule bar.") },
            cost: new Decimal(1e7),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("u") < 0) player.ded.fastmetarules += "u"
            },
        },
        13: {
            title: function () { return L("全称的重言", "Universal Tautology") },
            description: function () { return L("全局收入 ×(已采纳公理+1)^0.5。", "All production ×(axioms+1)^0.5.") },
            cost: new Decimal(2e7),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("宏的语料", "Corpus of Macros") },
            description: function () { return L("全局收入 ×(1 + 宏层 × 0.2)。", "All production ×(1 + macro layer × 0.2).") },
            cost: new Decimal(5e7),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.mac.unlocked && player[this.layer].points.gte(2) },
            effect() { return tunCross(player.mac.points, 0.2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        15: {
            title: function () { return L("量词的折叠", "Folding the Quantifiers") },
            description: function () { return L("每次采纳的层数 ×2（公理更便宜）。", "Each adoption buys ×2 floors.") },
            cost: new Decimal(1.2e8),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        21: {
            title: function () { return L("谓词面板", "The Predicate Panel") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(4e8),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
        },
        22: {
            title: function () { return L("∃ 消去", "∃ Elimination") },
            description: function () { return L("把元规则 e 加入快速规则带。", "Adds the e metarule to the fast rule bar.") },
            cost: new Decimal(1e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("e") < 0) player.ded.fastmetarules += "e"
            },
        },
        23: {
            title: function () { return L("外延的张力", "Tension of Extension") },
            description: function () { return L("全局收入 ×1.5。", "All production ×1.5.") },
            cost: new Decimal(3e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            effect() { return new Decimal(1.5) },
        },
        24: {
            title: function () { return L("集合论的门槛", "The Set-Theory Threshold") },
            description: function () { return L("集合论层解锁时，全局收入 ×2。", "Once set theory unlocks, all production ×2.") },
            cost: new Decimal(1e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.zfc.unlocked && player[this.layer].points.gte(4) },
        },
        25: {
            title: function () { return L("量词的赌局", "The Quantifier Wager") },
            description: function () { return L("解锁“无 witnesses”挑战。", "Unlocks the No-Witnesses challenge.") },
            cost: new Decimal(4e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(5) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 条谓词公理", " predicate axiom") },
            effectDescription() { return L("解锁挑战面板", "unlocks the Challenges panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(8) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("公理更便宜（采纳层数 ×2）", "axioms get cheaper (×2 floors per adoption)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(8) },
        },
        2: {
            requirementDescription() { return formatWhole(TUNING.automation.peaAuto) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("命题与谓词公理自动采纳（需先达成演绎安全）", "propositional and predicate axioms adopt themselves (needs the deduction-safety milestone)") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(TUNING.automation.peaAuto) },
        },
        3: {
            requirementDescription() { return formatWhole(10) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("全局收入 ×4", "all production ×4") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].total.gte(10) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("无 witnesses", "No Witnesses") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的一半——谓词抓不到具体的项。",
                    "Inside this run Deductriums flow at half rate — predicates find no terms.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内采纳 2 条公理", "adopt 2 axioms inside the challenge") },
            canComplete() { return player.pea.points.gte(2) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×1.5，每完成一次再 ×1.5", "all production ×1.5, another ×1.5 per completion") },
            rewardEffect() { return Decimal.pow(1.5, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 2,
            unlocked() { return hasUpgrade(this.layer, 25) },
        },
    },
})
