// zfc — ZFC 公理. Row 3, position 0. Twelve upgrades are more than the nine axioms, so half of this
// layer is metatheory: the shop sells what the axiom list cannot (design-brief §4.1). Milestone 4 is
// the automation step that hands num and hott over to the engine (TUNING.automation.numAuto).

addLayer("zfc", {
    name: "ZFC 公理",
    symbol: "Z",
    color: "#E74C3C",
    resource: "ZFC 公理",
    baseResource: "推理素",
    row: 3,
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

    requires: function () { return tunRequires("zfc") },
    baseAmount() { return player.points },
    // Buy-max would skip floors: with a fixed ceiling (5, 5, 9, 4, 6) one press must buy exactly one
    // floor, and canReset() refuses past the ceiling. (Measured: buy-max took hott from 0 to 29.)
    canBuyMax() { return false },
    resetsNothing() { return hasMilestone("ded", 0) },
    autoUpgrade() { return hasMilestone("mac", 4) },
    canReset() { return tunStaticCanReset(this.layer) },

    effect() { return Decimal.pow(TUNING.effectBase.axiom, player.zfc.points) },
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
        if (resettingLayer === "ord" && hasUpgrade("ord", 12) && player.zfc.points.lt(1)) player.zfc.points = new Decimal(1)
    },

    layerShown() { return player.pea.best.gte(1) },

    hotkeys: [
        {
            key: "z",
            description: L("z：采纳下一条 ZFC 公理", "z: adopt the next ZFC axiom"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "公理": {
            content: [
                ["display-text", function () { return mainLine("zfc") }],
                ["display-text", function () { return capLine("zfc", player.zfc.points, tunCap("zfc")) }],
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
            "选择公理": { unlocked() { return hasUpgrade("zfc", 22) }, content: ["blank", "buyables"] },
            "里程碑": { content: ["blank", "milestones"] },
            "挑战": { unlocked() { return hasMilestone("zfc", 0) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(tunAxiomPrice("zfc", player.zfc.points)) + L(" 推理素", " Deductriums")
            },
            progress() { return staticReach("zfc") },
            fillStyle: { "background-color": "#C0392B" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("集合论开门", "Set Theory Opens") },
            description: function () { return L("全局收入 ×4。", "All production ×4.") },
            cost: new Decimal(1.5e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            effect() { return new Decimal(4) },
        },
        12: {
            title: function () { return L("替换表上手", "The Replacement Table") },
            description: function () { return L("把元规则 : 加入快速规则带。", "Adds the : metarule to the fast rule bar.") },
            cost: new Decimal(3e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf(":") < 0) player.ded.fastmetarules += ":"
            },
        },
        13: {
            title: function () { return L("内联的集合", "Inlined Sets") },
            description: function () { return L("把元规则 > 加入快速规则带。", "Adds the > metarule to the fast rule bar.") },
            cost: new Decimal(6e9),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            onPurchase() {
                if (player.ded.fastmetarules.indexOf(">") < 0) player.ded.fastmetarules += ">"
            },
        },
        14: {
            title: function () { return L("等级的重言", "Rank Tautology") },
            description: function () { return L("全局收入 ×(已采纳公理+1)^0.5。", "All production ×(axioms+1)^0.5.") },
            cost: new Decimal(1.5e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        15: {
            title: function () { return L("幂集的富饶", "Riches of the Power Set") },
            description: function () { return L("每次采纳的层数 ×2（公理更便宜）。", "Each adoption buys ×2 floors.") },
            cost: new Decimal(4e10),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        21: {
            title: function () { return L("序数的投影", "Projection of Ordinals") },
            description: function () { return L("全局收入 ×(1 + 序数 × 0.5)。", "All production ×(1 + ordinals × 0.5).") },
            cost: new Decimal(1e11),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.ord.unlocked && player[this.layer].points.gte(3) },
            effect() { return tunCross(player.ord.points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        22: {
            title: function () { return L("选择的自由", "Freedom of Choice") },
            description: function () { return L("解锁“选择公理”面板。", "Unlocks the Axiom of Choice panel.") },
            cost: new Decimal(2.5e11),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
        },
        23: {
            title: function () { return L("良序的视野", "Well-Ordered Horizon") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(8e11),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            effect() { return new Decimal(2) },
        },
        24: {
            title: function () { return L("破闸的集合", "Sets Beyond the Gate") },
            description: function () { return L("已破至少三道闸时，全局收入 ×2。", "Once three gates have fallen, all production ×2.") },
            cost: new Decimal(2.5e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(5) },
        },
        25: {
            title: function () { return L("基数的赌局", "The Cardinal Wager") },
            description: function () { return L("解锁“没有选择”的挑战。", "Unlocks the Choice Denied challenge.") },
            cost: new Decimal(8e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(6) },
        },
        31: {
            title: function () { return L("类型的软上限", "A Softer Type Ceiling") },
            description: function () { return L("类型论的软上限 ×10（在类型层面板可见）。", "The type layer's softcap ×10 (visible on its panel).") },
            cost: new Decimal(2e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player.typ.unlocked && player[this.layer].points.gte(7) },
        },
        32: {
            title: function () { return L("顿悟的集合", "Set-Theoretic Insight") },
            description: function () { return L("购买后立即获得 60 秒的生产。", "Instantly grants 60 seconds of production.") },
            cost: new Decimal(1e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(8) },
            onPurchase() { player.ded.surge += 60 },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 条 ZFC 公理", " ZFC axiom") },
            effectDescription() { return L("解锁挑战面板", "unlocks the Challenges panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(5) + L(" 累计公理", " axioms adopted") },
            effectDescription() { return L("公理更便宜（采纳层数 ×2）", "axioms get cheaper (×2 floors per adoption)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(5) },
        },
        2: {
            requirementDescription() { return formatWhole(4) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("全局收入 ×8", "all production ×8") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(4) },
        },
        3: {
            requirementDescription() { return formatWhole(6) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("解锁“选择公理”面板", "unlocks the Axiom of Choice panel") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(6) },
        },
        4: {
            requirementDescription() { return formatWhole(TUNING.automation.numAuto) + L(" 条公理（历史最高）", " axioms (best)") },
            effectDescription() { return L("数论与同伦公理自动采纳", "number-theory and homotopy axioms adopt themselves") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].best.gte(TUNING.automation.numAuto) },
        },
    },

    buyables: {
        11: {
            title: function () { return L("选择公理", "Axiom of Choice") },
            // paid in adopted ZFC floors: buying a choice spends an axiom you can re-adopt
            cost(x) { return new Decimal(1).add(x) },
            effect(x) { return x.add(1) },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("选择强度 ×", "Choice strength ×") + format(d.effect) + L("（已 ", " (have ") +
                    formatWhole(getBuyableAmount(this.layer, this.id)) + L(" 次）\n花费 ", " times)\ncosts ") +
                    format(d.cost) + L(" 条 ZFC 公理", " ZFC axioms")
            },
            purchaseLimit: new Decimal(3),
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
            },
            unlocked() { return hasUpgrade("zfc", 22) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("没有选择", "Choice Denied") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的一半——没有选择的时候，路要自己走。",
                    "Inside this run Deductriums flow at half rate — with no choice, every road must be walked.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内采纳 3 条 ZFC 公理", "adopt 3 ZFC axioms inside the challenge") },
            canComplete() { return player.zfc.points.gte(3) },
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
