// num — Numeral 数论公理. Row 3, position 1. Cap 4: the four arithmetic axioms the original adopts.
// Small ceiling, so the upgrade ladder is paid in Deductriums (currencyInternalName "points").

addLayer("num", {
    name: "Numeral 数论公理",
    symbol: "N",
    color: "#E67E22",
    resource: "数论公理",
    baseResource: "推理素",
    row: 3,
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

    requires: function () { return tunRequires("num") },
    baseAmount() { return player.points },
    // Buy-max would skip floors: with a fixed ceiling (5, 5, 9, 4, 6) one press must buy exactly one
    // floor, and canReset() refuses past the ceiling. (Measured: buy-max took hott from 0 to 29.)
    canBuyMax() { return false },
    resetsNothing() { return hasMilestone("ded", 0) },
    autoPrestige() { return hasMilestone("ded", 0) && hasMilestone("zfc", 4) },
    autoUpgrade() { return hasMilestone("mac", 4) },
    canReset() { return tunStaticCanReset(this.layer) },

    effect() { return Decimal.pow(TUNING.effectBase.axiom, player.num.points) },
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
        if (resettingLayer === "ord" && hasUpgrade("ord", 12) && player.num.points.lt(1)) player.num.points = new Decimal(1)
    },

    layerShown() { return player.zfc.best.gte(1) },

    hotkeys: [
        {
            key: "n",
            description: L("n：采纳下一条数论公理", "n: adopt the next number-theory axiom"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "公理": {
            content: [
                ["display-text", function () { return mainLine("num") }],
                ["display-text", function () { return capLine("num", player.num.points, tunCap("num")) }],
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
            "挑战": { unlocked() { return hasMilestone("num", 0) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(tunAxiomPrice("num", player.num.points)) + L(" 推理素", " Deductriums")
            },
            progress() { return staticReach("num") },
            fillStyle: { "background-color": "#E67E22" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("数论的算术", "Arithmetic of Numerals") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(6e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            effect() { return new Decimal(2) },
        },
        12: {
            title: function () { return L("归纳法的台阶", "Steps of Induction") },
            description: function () { return L("全局收入 ×(已采纳公理+1)^0.5。", "All production ×(axioms+1)^0.5.") },
            cost: new Decimal(1.2e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("字面量的计数", "Counting Literals") },
            description: function () { return L("全局收入 ×(1 + 字面量 × 0.25)。", "All production ×(1 + literals × 0.25).") },
            cost: new Decimal(2.5e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.lit.unlocked && player[this.layer].points.gte(1) },
            effect() { return tunCross(player.lit.points, 0.25) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("数值比较", "Comparing Numerals") },
            description: function () { return L("把元规则 < 加入快速规则带。", "Adds the < metarule to the fast rule bar.") },
            cost: new Decimal(6e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("<") < 0) player.ded.fastmetarules += "<"
            },
        },
        15: {
            title: function () { return L("乘法的捷径", "A Shortcut Through Multiplication") },
            description: function () { return L("每次采纳的层数 ×2（公理更便宜）。", "Each adoption buys ×2 floors.") },
            cost: new Decimal(1.5e11),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        21: {
            title: function () { return L("数论面板", "The Numeral Panel") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(4e11),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        22: {
            title: function () { return L("质数的赌局", "The Prime Wager") },
            description: function () { return L("解锁“整除”的挑战。", "Unlocks the Divisibility challenge.") },
            cost: new Decimal(1e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
        },
        23: {
            title: function () { return L("同伦的门槛", "The Homotopy Threshold") },
            description: function () { return L("同伦层解锁时，全局收入 ×2。", "Once the homotopy layer unlocks, all production ×2.") },
            cost: new Decimal(2.5e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.hott.unlocked && player[this.layer].points.gte(3) },
        },
        24: {
            title: function () { return L("算术的野心", "Arithmetic Ambition") },
            description: function () { return L("全局收入 ×1.5。", "All production ×1.5.") },
            cost: new Decimal(6e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            effect() { return new Decimal(1.5) },
        },
        25: {
            title: function () { return L("无穷的阶梯", "The Ladder to Infinity") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(2e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            effect() { return new Decimal(2) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 条数论公理", " number-theory axiom") },
            effectDescription() { return L("解锁挑战面板", "unlocks the Challenges panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(4) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("公理更便宜（采纳层数 ×2）", "axioms get cheaper (×2 floors per adoption)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(4) },
        },
        2: {
            requirementDescription() { return formatWhole(2) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("解锁“挑战”子标签", "unlocks the Challenges subtab") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(2) },
        },
        3: {
            requirementDescription() { return formatWhole(3) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("全局收入 ×(1 + 类型层 × 0.5)", "all production ×(1 + type layer × 0.5)") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(3) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("整除", "Divisibility") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的一半——整除只留整数。",
                    "Inside this run Deductriums flow at half rate — divisibility keeps only integers.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内采纳 2 条数论公理", "adopt 2 number-theory axioms inside the challenge") },
            canComplete() { return player.num.points.gte(2) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×1.8，每完成一次再 ×1.8", "all production ×1.8, another ×1.8 per completion") },
            rewardEffect() { return Decimal.pow(1.8, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 2,
            unlocked() { return hasUpgrade(this.layer, 22) },
        },
    },
})
