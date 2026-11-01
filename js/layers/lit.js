// lit — Literals 字面量. Row 2, position 0. Deductriums are minted into literal constants here; the
// prestige currency is literals. Pure port-layer: NOTHING in this file touches DED/DED_KERNEL, so the
// headless simulator can run it without the kernel (brief §2b sim exclusion).

// lit/11's own cost curve, inverted in closed form by both buy() and mac.automate(). Cost is geometric
// (×3 per level) while its effect is additive and spent cross-layer, so no self-funding loop detonates
// (07 F13). Kept as file constants because a buyable cost curve is this layer's own ladder, not a
// pacing knob the simulator reads.
var LIT_B11_BASE = new Decimal(2)
var LIT_B11_RATIO = new Decimal(3)
var LIT_B11_LIMIT = new Decimal(20)
var LIT_B12_BASE = new Decimal(4)
var LIT_B12_RATIO = new Decimal(3)
var LIT_B12_LIMIT = new Decimal(12)

addLayer("lit", {
    name: "Literals 字面量",
    symbol: "L",
    color: "#A6C625",
    resource: "literals",
    baseResource: "Deductriums",
    row: 2,
    position: 0,
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
    requires: function () { return tunRequires("lit") },
    exponent: tunExponent("lit"),

    canReset() { return player.points.gte(tmp[this.layer].requires) },

    // Literals gained per reset. Base Decimal(1) and it reads its own upgrades (D-LOCALWIRE);
    // the challenge handicap lives here so only THIS layer pays for it (15 §).
    gainMult() {
        let m = new Decimal(1)
        if (inChallenge(this.layer, 11)) return m
        if (hasUpgrade(this.layer, 15)) m = m.times(new Decimal(1.5))
        if (hasMilestone(this.layer, 2) && hasUpgrade(this.layer, 14)) m = m.times(3)
        if (hasUpgrade(this.layer, 33)) m = m.times(Decimal.add(1, player.geo.points.max(1).log10()))
        return m
    },
    // A shape change on the gain curve, not another multiplier (ded.js gainExp idiom).
    gainExp() {
        let e = new Decimal(1)
        if (hasUpgrade(this.layer, 21)) e = e.plus(new Decimal(0.1))
        if (hasUpgrade(this.layer, 31)) e = e.plus(new Decimal(0.1))
        return e
    },
    // Selling a cap raise is legal only because the tab prints the live cap (softcapWarning below).
    softcap() {
        return tunSoftcap("lit").times(hasUpgrade("lit", 22) ? 10 : 1)
    },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.lit, Decimal.min(player.lit.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.lit + "，", " (×" + TUNING.effectBase.lit + " per level, ") +
            TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    resetDescription() { return L("凝出字面量，换取 ", "Crystallize literals for ") },
    prestigeButtonText() {
        if (!canReset(this.layer)) {
            return L("需要 ", "Requires ") + formatWhole(tmp[this.layer].requires) +
                L(" 推理素", " Deductriums")
        }
        return L("凝出字面量，换取 ", "Crystallize literals for ") + formatWhole(tmp[this.layer].resetGain) +
            " " + L("字面量。之后推理素归零", " literals. Your Deductriums are spent")
    },

    // 07 F17: the engine also calls this hook for this layer's own prestige and its row-mates, AFTER
    // the gain is banked — only a DEEPER row may sweep. 07 F18: no array/object fields ride the keep
    // list, so nothing to hand-copy here (spentOnBuyables is a Decimal).
    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        layerDataReset(this.layer, ["unlocked", "best", "total"])
    },

    // meta.m0-style passive grant; must be a plain NUMBER (N-PGBOOL).
    passiveGeneration() {
        if (hasMilestone(this.layer, 1)) return 1
        return 0
    },

    // mac.m4 grants auto-buy for this layer's own upgrades too (brief §6 step 6).
    autoUpgrade() { return hasMilestone("mac", 4) },

    layerShown() { return player.geo.unlocked },

    hotkeys: [
        {
            key: "l",
            description: L("l：把推理素凝成字面量", "l: crystallize your Deductriums into literals"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "字面量": {
            buttonStyle() { return { "min-width": "90px" } },
            content: [
                ["display-text", function () { return mainLine("lit") }],
                ["display-text", function () { return baseLine("lit") }],
                ["display-text", function () { return softcapWarning("lit") }],
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
            "Generators": {
                unlocked() { return hasUpgrade("lit", 24) },
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
            title: function () { return L("字面量库", "Literal Store") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(1),
            effect() { return new Decimal(2) },
        },
        12: {
            title: function () { return L("自举的字面量", "Self-Bootstrapping Literals") },
            description: function () { return L("全局收入 ×(字面量+1)^0.4。", "All production ×(literals+1)^0.4.") },
            cost: new Decimal(3),
            unlocked() { return hasUpgrade(this.layer, 11) },
            effect() { return tunSelf(player[this.layer].points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("命题字面量", "Propositional Literals") },
            description: function () { return L("全局收入 ×(1 + 命题公理 × 0.2)。", "All production ×(1 + fol axioms × 0.2).") },
            cost: new Decimal(20),
            unlocked() { return player.fol.unlocked },
            effect() { return tunCross(player.fol.points, 0.2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("谓词的余温", "Predicate Warmth") },
            description: function () { return L("当累计字面量里程碑已达成时，每次凝炼的字面量 ×3。",
                "While the literal-total milestone stands, literals crystallized ×3.") },
            cost: new Decimal(60),
            unlocked() { return player.pea.unlocked },
        },
        15: {
            title: function () { return L("常量表", "Constant Table") },
            description: function () { return L("每次收束的字面量 ×1.5。", "Literals per reset ×1.5.") },
            cost: new Decimal(250),
            effect() { return new Decimal(1.5) },
        },
        21: {
            title: function () { return L("内联展开", "Inline Expansion") },
            description: function () { return L("字面量收益曲线的指数 +0.1（具名机制：宏就地展开一层）。",
                "The literal gain curve exponent +0.1 (named mechanic: macros expand one level inline).") },
            cost: new Decimal(900),
            tooltip: function () { return L("这不是乘数——它改变字面量的增长形状。", "Not a multiplier: it bends how literals grow.") },
        },
        22: {
            title: function () { return L("字面量的野心", "Literal Ambition") },
            description: function () { return L("字面量软上限 ×10（当前 ", "Literal softcap ×10 (currently ") +
                format(tunSoftcap("lit").times(10)) + L("）。", ").") },
            cost: new Decimal(3e3),
            unlocked() { return player.lit.points.gte(60) },
        },
        23: {
            title: function () { return L("重复的字面量", "Repeated Literals") },
            description: function () { return L("全局收入 ×1.5。", "All production ×1.5.") },
            cost: new Decimal(15),
            unlocked() { return hasUpgrade(this.layer, 13) },
            effect() { return new Decimal(1.5) },
        },
        24: {
            title: function () { return L("生成器上线", "Generators Online") },
            description: function () { return L("解锁“生成器”子标签（字面量预算 / 字面量规则）。",
                "Unlocks the Generators subtab (literal budget / literal rule).") },
            cost: new Decimal(1.2e4),
        },
        31: {
            title: function () { return L("解析深度", "Parsing Depth") },
            description: function () { return L("字面量收益曲线指数再 +0.1（具名机制：嵌套字面量解析）。",
                "Literal gain curve exponent +0.1 more (named mechanic: nested literal parsing).") },
            cost: new Decimal(1.2e5),
            unlocked() { return hasUpgrade(this.layer, 21) },
        },
        32: {
            title: function () { return L("盲写之闸", "The Blind Gate") },
            description: function () { return L("解锁“盲写字面量”挑战。", "Unlocks the Blind Literals challenge.") },
            cost: new Decimal(8e5),
        },
        33: {
            title: function () { return L("走过的字面量", "Literals Walked") },
            description: function () { return L("每次收束的字面量 ×(1 + lg 格位)。", "Literals per reset ×(1 + log₁₀ tiles).") },
            cost: new Decimal(4e6),
            unlocked() { return player.geo.unlocked },
            effect() { return Decimal.add(1, player.geo.points.max(1).log10()) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(TUNING.automation.litAutoBuy) + L(" 字面量（历史最高）", " literals (best)") },
            effectDescription() { return L("字面量生成器自动回购（由宏层驱动）", "the literal generator auto-rebuys (driven by the Macro layer)") },
            done() { return player[this.layer].best.gte(TUNING.automation.litAutoBuy) },
        },
        1: {
            requirementDescription() { return formatWhole(12) + L(" 字面量", " literals") },
            effectDescription() { return L("字面量开始被动生产", "literals begin generating passively") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].best.gte(12) },
        },
        2: {
            requirementDescription() { return formatWhole(150) + L(" 累计字面量", " literals made") },
            effectDescription() { return L("全局收入 ×2", "all production ×2") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].total.gte(150) },
        },
        3: {
            requirementDescription() { return formatWhole(40) + L(" 字面量（历史最高）", " literals (best)") },
            effectDescription() { return L("全局收入 ×(1 + 谓词公理数)", "all production ×(1 + predicate axioms adopted)") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(40) },
        },
    },

    buyables: {
        11: {
            title: function () { return L("字面量预算", "Literal Budget") },
            cost(x) { return LIT_B11_BASE.times(LIT_B11_RATIO.pow(x)) },
            effect(x) { return x.times(2) },
            canAfford() {
                let cur = getBuyableAmount("lit", 11)
                if (cur.gte(LIT_B11_LIMIT)) return false
                return player[this.layer].points.gte(litCurveSpent(cur, litCurveTarget(player[this.layer].points, cur, LIT_B11_LIMIT)))
            },
            buy() {
                let cur = getBuyableAmount(this.layer, this.id)
                if (cur.gte(LIT_B11_LIMIT)) return
                let target = litCurveTarget(player[this.layer].points, cur, LIT_B11_LIMIT)
                if (target.lte(cur)) return
                let spent = litCurveSpent(cur, target)
                player[this.layer].points = player[this.layer].points.sub(spent)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(spent)
                setBuyableAmount(this.layer, this.id, target)
            },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("每级 +2 字面量预算（已 ", "+2 literal budget each (have ") +
                    formatWhole(getBuyableAmount(this.layer, this.id)) + L(" / ", " / ") + formatWhole(LIT_B11_LIMIT) +
                    L("）\n下一级花费 ", ")\nnext level costs ") + format(d.cost) + " " + L("字面量", "literals")
            },
            purchaseLimit: LIT_B11_LIMIT,
            unlocked() { return hasUpgrade("lit", 24) },
        },
        12: {
            title: function () { return L("字面量规则", "Literal Rule") },
            cost(x) { return LIT_B12_BASE.times(LIT_B12_RATIO.pow(x)) },
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
                return L("每级 ×1.2 BigInt 字面量规则强度（已 ", "×1.2 BigInt literal-rule strength each (have ") +
                    formatWhole(getBuyableAmount(this.layer, this.id)) + L(" / ", " / ") + formatWhole(LIT_B12_LIMIT) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("字面量", "literals")
            },
            purchaseLimit: LIT_B12_LIMIT,
            unlocked() { return hasUpgrade("lit", 24) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("盲写字面量", "Blind Literals") },
            challengeDescription() {
                return L("在这局里，字面量的所有收益升级全部静默——只有曲线本身还在长。",
                    "Inside this run every literal gain upgrade falls silent — only the raw curve keeps growing.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/1"
            },
            goalDescription() { return L("在本挑战内凝出 8 个字面量", "crystallize 8 literals inside the challenge") },
            canComplete() { return player.lit.points.gte(8) },
            // TMT does not reset the active layer's own points on entry (game.js:262 resets only
            // lower rows), so a points-based goal would start pre-satisfied. Rebuild inside.
            onEnter() { player[this.layer].points = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×2", "all production ×2") },
            rewardEffect() { return new Decimal(2) },
            rewardDisplay() { return "×2" },
            completionLimit: 1,
            unlocked() { return hasUpgrade("lit", 32) },
        },
    },
})

// Cross-layer getters. geo.js reads getBuyableAmount("lit", 11) and may consume litBudgetValue();
// these expose buyableEffect() so the buyables are not dead in this file (N-BUYABLEDEAD).
function litBudgetValue(id) {
    let e = buyableEffect("lit", id)
    if (e === undefined || e === null) return new Decimal(1)
    return e
}

// Production bonus for 推理素 that is NOT hard-wired in mod.js's getPointGen: the K3 upgrades (13) and
// the m2 milestone reward. The user calls this from getPointGen.
function litProdMult() {
    let m = new Decimal(1)
    if (hasUpgrade("lit", 13)) m = m.times(tunCross(player.fol.points, 0.2))
    if (hasMilestone("lit", 2)) m = m.times(2)
    return m
}

// --- closed-form helpers for the lit/11 curve (pure: they only return Decimals) ------------------
// cumulative literals to lift lit/11 from cur up to target, summing the geometric cost(x)=base*ratio^x
function litCurveSpent(cur, target) {
    if (target.lte(cur)) return new Decimal(0)
    return LIT_B11_BASE.times(LIT_B11_RATIO.pow(target).minus(LIT_B11_RATIO.pow(cur))).div(LIT_B11_RATIO.minus(1))
}

// the inverse of the same curve (a log root solve), clamped to [cur, limit] — the automator buys every
// affordable level in one step, never +1/tick (P54).
function litCurveTarget(budget, cur, limit) {
    let arg = budget.times(LIT_B11_RATIO.minus(1)).div(LIT_B11_BASE).plus(LIT_B11_RATIO.pow(cur))
    let t = arg.log10().div(LIT_B11_RATIO.log10()).floor().max(cur)
    return Decimal.min(t, limit)
}
