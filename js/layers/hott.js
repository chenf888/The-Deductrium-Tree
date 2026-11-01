// hott — Homotopy 同伦路径. Row 4, position 0. Cap 6: the six constructors the original's HoTT layer
// adopts, and half of isEndgame() (design-brief §4). Paid in Deductriums, capped by theme.

addLayer("hott", {
    name: "Homotopy 同伦路径",
    symbol: "H",
    color: "#E84393",
    resource: "同伦构造子",
    baseResource: "推理素",
    row: 4,
    position: 0,
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

    requires: function () { return tunRequires("hott") },
    baseAmount() { return player.points },
    // Buy-max would skip floors: with a fixed ceiling (5, 5, 9, 4, 6) one press must buy exactly one
    // floor, and canReset() refuses past the ceiling. (Measured: buy-max took hott from 0 to 29.)
    canBuyMax() { return false },
    resetsNothing() { return hasMilestone("ded", 0) },
    autoPrestige() { return hasMilestone("ded", 0) && hasMilestone("zfc", 4) },
    autoUpgrade() { return hasMilestone("mac", 4) },
    canReset() { return tunStaticCanReset(this.layer) },

    effect() { return Decimal.pow(TUNING.effectBase.axiom, player.hott.points) },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每个构造子 ×" + TUNING.effectBase.axiom + "）", " (×" + TUNING.effectBase.axiom + " per constructor)")
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
        if (resettingLayer === "ord" && hasUpgrade("ord", 12) && player.hott.points.lt(1)) player.hott.points = new Decimal(1)
    },

    layerShown() { return player.typ.best.gte(1) },

    hotkeys: [
        {
            key: "h",
            description: L("h：采纳下一个同伦构造子", "h: adopt the next homotopy constructor"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "构造子": {
            content: [
                ["display-text", function () { return mainLine("hott") }],
                ["display-text", function () { return capLine("hott", player.hott.points, tunCap("hott")) }],
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
            "挑战": { unlocked() { return hasMilestone("hott", 0) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(tunAxiomPrice("hott", player.hott.points)) + L(" 推理素", " Deductriums")
            },
            progress() { return staticReach("hott") },
            fillStyle: { "background-color": "#E84393" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("路径上线", "Paths Online") },
            description: function () { return L("全局收入 ×5。", "All production ×5.") },
            cost: new Decimal(2e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            effect() { return new Decimal(5) },
        },
        12: {
            title: function () { return L("路径的曲率", "Curvature of Paths") },
            description: function () { return L("全局收入 ×(构造子+1)^0.5。", "All production ×(constructors+1)^0.5.") },
            cost: new Decimal(4e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("类型的回响", "Echo of the Type Layer") },
            description: function () { return L("全局收入 ×(1 + 类型层 × 0.3)。", "All production ×(1 + type layer × 0.3).") },
            cost: new Decimal(9e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.typ.unlocked && player[this.layer].points.gte(1) },
            effect() { return tunCross(player.typ.points, 0.3) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("路径合成", "Path Composition") },
            description: function () { return L("把元规则 v 加入快速规则带。", "Adds the v metarule to the fast rule bar.") },
            cost: new Decimal(2e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf("v") < 0) player.ded.fastmetarules += "v"
            },
        },
        15: {
            title: function () { return L("反转的路径", "Reversed Paths") },
            description: function () { return L("每次采纳的层数 ×2（构造子更便宜）。", "Each adoption buys ×2 floors.") },
            cost: new Decimal(5e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        21: {
            title: function () { return L("同伦面板", "The Homotopy Panel") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(1.2e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        22: {
            title: function () { return L("圆的直觉", "Intuition of the Circle") },
            description: function () { return L("解锁“无回路”的挑战。", "Unlocks the Loopless challenge.") },
            cost: new Decimal(3e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
        },
        23: {
            title: function () { return L("高阶的路", "Higher Paths") },
            description: function () { return L("全局收入 ×1.5。", "All production ×1.5.") },
            cost: new Decimal(8e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            effect() { return new Decimal(1.5) },
        },
        24: {
            title: function () { return L("序数的桥", "A Bridge to the Ordinals") },
            description: function () { return L("已破至少一道闸时，全局收入 ×2。", "Once a gate has fallen, all production ×2.") },
            cost: new Decimal(2e15),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.ord.unlocked && player[this.layer].points.gte(4) },
        },
        25: {
            title: function () { return L("同伦的野心", "Homotopic Ambition") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(5e15),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            effect() { return new Decimal(2) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 个构造子", " constructor") },
            effectDescription() { return L("解锁挑战面板", "unlocks the Challenges panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(4) + L(" 累计构造子", " constructors adopted") },
            effectDescription() { return L("构造子更便宜（采纳层数 ×2）", "constructors get cheaper (×2 floors per adoption)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(4) },
        },
        2: {
            requirementDescription() { return formatWhole(3) + L(" 个构造子（历史最高）", " constructors (best)") },
            effectDescription() { return L("解锁“序数”面板", "unlocks the Ordinal panel") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(3) },
        },
        3: {
            requirementDescription() { return formatWhole(4) + L(" 个构造子（历史最高）", " constructors (best)") },
            effectDescription() { return L("全局收入 ×(1 + 序数 × 3)", "all production ×(1 + ordinals × 3)") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(4) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("无回路", "Loopless") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的十分之一——每一步都必须从头走过去。",
                    "Inside this run Deductriums flow at one tenth — every step must be walked afresh.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内采纳 2 个构造子", "adopt 2 constructors inside the challenge") },
            canComplete() { return player.hott.points.gte(2) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×2，每完成一次再 ×2", "all production ×2, another ×2 per completion") },
            rewardEffect() { return Decimal.pow(2, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 2,
            unlocked() { return hasUpgrade(this.layer, 22) },
        },
    },
})
