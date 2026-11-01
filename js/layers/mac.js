// mac — Macros 宏. Row 2, position 2. Reusable proof templates bought out of Deductriums; this layer
// also DRIVES the game's one autoBuyable step (lit/11) via automate(), and grants autoUpgrade for
// fol/pea/lit/mac via mac.m4. Pure port-layer: NO DED/DED_KERNEL reference (headless sim safe).

// mac/11 costs 推理素 (Deductriums) — a cross-currency buyable gated on geo — so its geometric curve
// (×100/level, capped at 4) is a file constant, never a runaway (07 F13). mac/12 costs macros.
var MAC_B11_BASE = new Decimal(5)
var MAC_B11_RATIO = new Decimal(100)
var MAC_B11_LIMIT = new Decimal(4)
var MAC_B12_BASE = new Decimal(2)
var MAC_B12_RATIO = new Decimal(3)
var MAC_B12_LIMIT = new Decimal(12)

addLayer("mac", {
    name: "Macros 宏",
    symbol: "Ma",
    color: "#F7CA18",
    resource: "macros",
    baseResource: "Deductriums",
    row: 2,
    position: 2,
    type: "normal",

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
            spentOnBuyables: new Decimal(0),
        }
    },

    baseAmount() { return player.points },
    requires: function () { return tunRequires("mac") },
    exponent: tunExponent("mac"),

    canReset() { return player.points.gte(tmp[this.layer].requires) },

    // Macros gained per reset. Reads its own upgrades (D-LOCALWIRE); the challenge handicap lives here.
    gainMult() {
        let m = new Decimal(1)
        if (inChallenge(this.layer, 11)) return m
        if (hasMilestone(this.layer, 0)) m = m.times(2)
        if (hasUpgrade(this.layer, 22)) m = m.times(1.5)
        if (player.geo.unlocked && hasUpgrade(this.layer, 14)) m = m.times(3)
        return m
    },
    // Shape change on the gain curve, driven by two named-mechanic upgrades.
    gainExp() {
        let e = new Decimal(1)
        if (hasUpgrade(this.layer, 12)) e = e.plus(new Decimal(0.1))
        if (hasUpgrade(this.layer, 13)) e = e.plus(new Decimal(0.1))
        return e
    },
    softcap() {
        return tunSoftcap("mac").times(hasUpgrade("mac", 31) ? 10 : 1)
    },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.mac, Decimal.min(player.mac.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.mac + "，", " (×" + TUNING.effectBase.mac + " per level, ") +
            TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    resetDescription() { return L("定义宏，换取 ", "Define macros for ") },
    prestigeButtonText() {
        if (!canReset(this.layer)) {
            return L("需要 ", "Requires ") + formatWhole(tmp[this.layer].requires) +
                L(" 推理素", " Deductriums")
        }
        return L("定义宏，换取 ", "Define macros for ") + formatWhole(tmp[this.layer].resetGain) +
            " " + L("宏。之后推理素归零", " macros. Your Deductriums are spent")
    },

    // 07 F17 guard first — deeper rows only. 07 F18: no array/object fields, nothing to hand-copy.
    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        layerDataReset(this.layer, ["unlocked", "best", "total"])
    },

    // brief §6 step 6: mac.m4 kills the chore of buying one upgrade at a time, across four layers.
    autoUpgrade() { return hasMilestone(this.layer, 4) },

    // The automation driver (an official hook — already excluded from the every-tick scan). It buys
    // lit/11 in one closed-form step (no +1/tick, P54) and tops up mac/11 from Deductriums.
    automate() {
        if (!hasMilestone("lit", 0)) return
        if (!player.lit.unlocked) return

        let b = tmp.lit.buyables[11]
        if (b && b.unlocked) {
            let cur = getBuyableAmount("lit", 11)
            if (cur.lt(LIT_B11_LIMIT)) {
                let target = litCurveTarget(player.lit.points, cur, LIT_B11_LIMIT)
                if (target.gt(cur)) {
                    let spent = litCurveSpent(cur, target)
                    if (player.lit.points.gte(spent)) {
                        player.lit.points = player.lit.points.sub(spent)
                        player.lit.spentOnBuyables = player.lit.spentOnBuyables.add(spent)
                        setBuyableAmount("lit", 11, target)
                    }
                }
            }
        }

        if (player.geo.unlocked && player.mac.unlocked) {
            let mcur = getBuyableAmount("mac", 11)
            if (mcur.lt(MAC_B11_LIMIT)) {
                let budget = player.points
                let arg = budget.times(MAC_B11_RATIO.minus(1)).div(MAC_B11_BASE).plus(MAC_B11_RATIO.pow(mcur))
                let target = Decimal.min(arg.log10().div(MAC_B11_RATIO.log10()).floor().max(mcur), MAC_B11_LIMIT)
                if (target.gt(mcur)) {
                    let spent = MAC_B11_BASE.times(MAC_B11_RATIO.pow(target).minus(MAC_B11_RATIO.pow(mcur))).div(MAC_B11_RATIO.minus(1))
                    if (budget.gte(spent)) {
                        player.points = budget.sub(spent)
                        player.mac.spentOnBuyables = player.mac.spentOnBuyables.add(spent)
                        setBuyableAmount("mac", 11, target)
                    }
                }
            }
        }
    },

    layerShown() { return player.lit.unlocked },

    hotkeys: [
        {
            key: "m",
            description: L("m：把推理素定义为宏", "m: define your Deductriums as macros"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "宏": {
            buttonStyle() { return { "min-width": "90px" } },
            content: [
                ["display-text", function () { return mainLine("mac") }],
                ["display-text", function () { return baseLine("mac") }],
                ["display-text", function () { return softcapWarning("mac") }],
                "prestige-button",
                "blank",
                ["microtabs", "stuff"],
            ],
        },
    },

    microtabs: {
        stuff: {
            "Upgrades": {
                unlocked() { return true },
                content: ["blank", "upgrades"],
            },
            "Slots": {
                unlocked() { return hasUpgrade("mac", 33) },
                content: ["blank", "buyables"],
            },
            "Milestones": {
                unlocked() { return true },
                content: ["blank", "milestones"],
            },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("宏库", "Macro Library") },
            description: function () { return L("全局收入 ×3。", "All production ×3.") },
            cost: new Decimal(1),
            effect() { return new Decimal(3) },
        },
        12: {
            title: function () { return L("宏体嵌套", "Nested Macro Bodies") },
            description: function () { return L("宏体可嵌套一层——宏收益曲线指数 +0.1（具名机制）。",
                "Macro bodies nest one level deep — the macro gain curve exponent +0.1 (named mechanic).") },
            cost: new Decimal(3),
            unlocked() { return hasUpgrade(this.layer, 11) },
            tooltip: function () { return L("这不是乘数——它改变宏的展开形状。", "Not a multiplier: it changes how macros unfold.") },
        },
        13: {
            title: function () { return L("条件重基", "Condition Rebasing") },
            description: function () { return L("conditionIdxs 自动重基——宏收益曲线指数再 +0.1（具名机制）。",
                "conditionIdxs rebase themselves — the macro gain curve exponent +0.1 more (named mechanic).") },
            cost: new Decimal(20),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        14: {
            title: function () { return L("地图上的宏", "Macros in the Field") },
            description: function () { return L("当格位已解锁时，每次收束的宏 ×3。",
                "While tiles are unlocked, macros per reset ×3.") },
            cost: new Decimal(60),
            unlocked() { return player.geo.unlocked },
        },
        15: {
            title: function () { return L("盲宏之闸", "The Blind Gate") },
            description: function () { return L("解锁“盲宏”挑战。", "Unlocks the Blind Macros challenge.") },
            cost: new Decimal(250),
        },
        21: {
            title: function () { return L("宏的复利", "Compound Macros") },
            description: function () { return L("全局收入 ×(宏+1)^0.4。", "All production ×(macros+1)^0.4.") },
            cost: new Decimal(900),
            unlocked() { return hasUpgrade(this.layer, 14) },
            effect() { return tunSelf(player[this.layer].points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        22: {
            title: function () { return L("展开缓存", "Expansion Cache") },
            description: function () { return L("每次收束的宏 ×1.5。", "Macros per reset ×1.5.") },
            cost: new Decimal(3e3),
            effect() { return new Decimal(1.5) },
        },
        23: {
            title: function () { return L("廉价的一次替换", "A Cheap Substitution") },
            description: function () { return L("全局收入 ×2（钥匙价：打开宏乘数链）。",
                "All production ×2 (a key price: it opens the macro multiplier chain).") },
            cost: new Decimal(15),
            unlocked() { return hasUpgrade(this.layer, 21) },
            effect() { return new Decimal(2) },
        },
        24: {
            title: function () { return L("类型的宏", "Typed Macros") },
            description: function () { return L("全局收入 ×(1 + 类型 × 0.25)。", "All production ×(1 + types × 0.25).") },
            cost: new Decimal(1.2e4),
            unlocked() { return player.typ.unlocked },
            effect() { return tunCross(player.typ.points, 0.25) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        31: {
            title: function () { return L("宏的野心", "Macro Ambition") },
            description: function () { return L("宏软上限 ×10（当前 ", "Macro softcap ×10 (currently ") +
                format(tunSoftcap("mac").times(10)) + L("）。", ").") },
            cost: new Decimal(1.2e5),
            unlocked() { return player.mac.points.gte(60) },
        },
        32: {
            title: function () { return L("元规则的宏", "Metarule Macros") },
            description: function () { return L("全局收入 ×(1 + 元规则 × 0.2)。", "All production ×(1 + metarules × 0.2).") },
            cost: new Decimal(8e5),
            unlocked() { return player.meta.unlocked },
            effect() { return tunCross(player.meta.points, 0.2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        33: {
            title: function () { return L("槽位上线", "Slots Online") },
            description: function () { return L("解锁“槽位”子标签（宏槽位 / 宏展开）。",
                "Unlocks the Slots subtab (macro slot / macro expansion).") },
            cost: new Decimal(4e6),
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(5) + L(" 宏（历史最高）", " macros (best)") },
            effectDescription() { return L("每次收束的宏 ×2", "macros per reset ×2") },
            done() { return player[this.layer].best.gte(5) },
        },
        1: {
            requirementDescription() { return formatWhole(12) + L(" 宏（历史最高）", " macros (best)") },
            effectDescription() { return L("全局收入 ×2", "all production ×2") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].best.gte(12) },
        },
        2: {
            requirementDescription() { return formatWhole(150) + L(" 累计宏", " macros made") },
            effectDescription() { return L("全局收入 ×(1 + 字面量数 × 0.25)", "all production ×(1 + literals × 0.25)") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].total.gte(150) },
        },
        3: {
            requirementDescription() { return formatWhole(40) + L(" 宏（历史最高）", " macros (best)") },
            effectDescription() { return L("全局收入 ×(1 + lg 格位)", "all production ×(1 + log₁₀ tiles)") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(40) },
        },
        4: {
            requirementDescription() { return formatWhole(TUNING.automation.macAutoUpg) + L(" 宏（历史最高）", " macros (best)") },
            effectDescription() { return L("自动购买 fol/pea/lit/mac 的升级", "auto-buys the fol/pea/lit/mac upgrades") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].best.gte(TUNING.automation.macAutoUpg) },
        },
    },

    buyables: {
        11: {
            title: function () { return L("宏槽位", "Macro Slot") },
            cost(x) { return MAC_B11_BASE.times(MAC_B11_RATIO.pow(x)) },
            effect(x) { return x.times(0.5).plus(1) },
            canAfford() { return player.points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                if (player.points.lt(cost)) return
                player.points = player.points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("每级 ×(1 + 0.5·槽位) 生产（已 ", "×(1 + 0.5·slot) production each (have ") +
                    formatWhole(getBuyableAmount(this.layer, this.id)) + L(" / ", " / ") + formatWhole(MAC_B11_LIMIT) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("推理素", "Deductriums")
            },
            purchaseLimit: MAC_B11_LIMIT,
            unlocked() { return hasUpgrade("mac", 33) },
        },
        12: {
            title: function () { return L("宏展开", "Macro Expansion") },
            cost(x) { return MAC_B12_BASE.times(MAC_B12_RATIO.pow(x)) },
            effect(x) { return Decimal.pow(1.2, x) },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("每级 ×1.2 宏展开深度（已 ", "×1.2 macro expansion depth each (have ") +
                    formatWhole(getBuyableAmount(this.layer, this.id)) + L(" / ", " / ") + formatWhole(MAC_B12_LIMIT) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("宏", "macros")
            },
            purchaseLimit: MAC_B12_LIMIT,
            unlocked() { return hasUpgrade("mac", 33) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("盲宏", "Blind Macros") },
            challengeDescription() {
                return L("在这局里，宏的所有收益升级全部静默——只有曲线本身还在长。",
                    "Inside this run every macro gain upgrade falls silent — only the raw curve keeps growing.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/1"
            },
            goalDescription() { return L("在本挑战内定义 8 个宏", "define 8 macros inside the challenge") },
            canComplete() { return player.mac.points.gte(8) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×2", "all production ×2") },
            rewardEffect() { return new Decimal(2) },
            rewardDisplay() { return "×2" },
            completionLimit: 1,
            unlocked() { return hasUpgrade("mac", 15) },
        },
    },
})

// Cross-layer getter: macProdMult() consumes both buyables, so they are not dead in this file
// (N-BUYABLEDEAD); the user calls macProdMult() from getPointGen, which reaches the economy.
function macValue(id) {
    let e = buyableEffect("mac", id)
    if (e === undefined || e === null) return new Decimal(1)
    return e
}

// Production bonus for 推理素 that is NOT hard-wired in mod.js's getPointGen: the K1/K3 upgrades
// (23/24/32), the m1/m3 milestone multipliers, the challenge reward, and the two buyables.
function macProdMult() {
    let m = new Decimal(1)
    m = m.times(macValue(11))
    m = m.times(macValue(12))
    if (hasUpgrade("mac", 23)) m = m.times(2)
    if (hasUpgrade("mac", 24)) m = m.times(tunCross(player.typ.points, 0.25))
    if (hasUpgrade("mac", 32)) m = m.times(tunCross(player.meta.points, 0.2))
    if (hasMilestone("mac", 1)) m = m.times(2)
    if (hasMilestone("mac", 3)) m = m.times(Decimal.add(1, player.geo.points.max(1).log10()))
    if (hasChallenge("mac", 11)) m = m.times(challengeEffect("mac", 11))
    return m
}
