// ord — Ordinal 序数. Row 4, position 1. The only DESTRUCTIVE reset (user's Q8 = consumable reset,
// M19): one gate per press, paid in Deductriums, and every lower row is swept. The theme ceiling is
// 12 rungs (TUNING.caps.ord); isEndgame() also needs hott 6. Two upgrades buy back part of the wipe,
// which is what makes a consumable reset a decision instead of a punishment (design-brief §7).

addLayer("ord", {
    name: "Ordinal 序数",
    symbol: "Ω",
    color: "#D36BE8",
    resource: "序数",
    baseResource: "推理素",
    row: 4,
    position: 1,
    type: "static",
    base: 10,
    exponent: 1,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
            kept: new Decimal(0),
            peak: new Decimal(0),
            ladder: 0,
            chalBase: new Decimal(0),
        }
    },

    requires: function () { return tunRequires("ord") },
    baseAmount() { return player.points },
    // D13: buy-max would cross the whole ladder in one press. One gate per press is the mechanic.
    canBuyMax() { return false },
    getResetGain() { return new Decimal(1) },
    getNextAt(canMax) {
        let price = tunAxiomPrice("ord", player.ord.points)
        if (hasUpgrade("ord", 24)) price = price.div(2)
        return price
    },
    canReset() {
        if (player.ord.points.gte(tunCap("ord"))) return false
        return player.points.gte(this.getNextAt(false))
    },
    // Sim-only: the harness never walks the map, so the currency gate is the honest lower bound.
    simCanReset() {
        return player.ord.points.lt(tunCap("ord")) && player.points.gte(tunAxiomPrice("ord", player.ord.points))
    },

    effect() { return Decimal.pow(TUNING.effectBase.ord, player.ord.points) },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每一级 ×" + TUNING.effectBase.ord + "）", " (×" + TUNING.effectBase.ord + " per rung)")
    },

    prestigeButtonText() {
        if (player.ord.points.gte(tunCap("ord"))) return L("序数阶梯已走完", "The ordinal ladder is complete")
        return L("拆掉下一道闸（", "Destruct the next gate (") + format(this.getNextAt(false)) +
            L(" 推理素），清空下面所有层", " Deductriums) — every lower layer is swept")
    },

    // Order matters (game.js:189-219): onPrestige runs BEFORE the gain is banked and before the
    // root currency is zeroed, so the kept fraction must be measured here and restored in doReset.
    onPrestige(gain) {
        if (hasUpgrade("ord", 13)) player.ord.kept = player.points.times(0.05)
    },

    doReset(resettingLayer) {
        if (resettingLayer === this.layer) {
            if (hasUpgrade("ord", 13) && player.ord.kept.gt(0)) player.points = player.points.add(player.ord.kept)
            player.ord.kept = new Decimal(0)
            return
        }
        if (!(layers[resettingLayer].row > this.row)) return
        layerDataReset(this.layer, ["unlocked", "best", "total", "peak", "ladder"])
    },

    update(diff) {
        if (!player[this.layer].unlocked) return
        player.ord.peak = player.ord.peak.max(player.points)
    },

    layerShown() { return player.hott.unlocked && player.hott.best.gte(1) },

    hotkeys: [
        {
            key: "o",
            description: L("o：拆掉下一道闸（消耗性重置）", "o: destruct the next gate (consumable reset)"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "破闸": {
            content: [
                ["display-text", function () { return mainLine("ord") }],
                ["display-text", function () { return capLine("ord", player.ord.points, tunCap("ord")) }],
                "prestige-button",
                ["bar", "reach"],
                ["clickables", [1]],
                "blank",
                ["microtabs", "stuff"],
                ["blank", "40px"],
            ],
        },
    },

    microtabs: {
        stuff: {
            "升级": { content: ["blank", "upgrades"] },
            "阶梯": { unlocked() { return player.ord.ladder >= 1 || hasUpgrade("ord", 14) }, content: ["blank", ["raw-html", function () { return ORD_ladder() }]] },
            "里程碑": { content: ["blank", "milestones"] },
            "挑战": { unlocked() { return hasMilestone("ord", 2) }, content: ["blank", "challenges"] },
            "终局": {
                unlocked() { return hasMilestone("ord", 3) },
                content: [["raw-html", function () { return ORD_endgame() }]],
            },
        },
    },

    bars: {
        reach: {
            direction: RIGHT,
            width: 320,
            height: 20,
            instant: true,
            display() {
                return format(player.points) + " / " + format(layers.ord.getNextAt(false)) + L(" 推理素", " Deductriums")
            },
            progress() {
                if (player.ord.points.gte(tunCap("ord"))) return 1
                return player.points.div(layers.ord.getNextAt(false)).max(0).min(1).toNumber()
            },
            fillStyle: { "background-color": "#D36BE8" },
        },
    },

    clickables: {
        11: {
            title: function () { return L("破闸", "destruct") },
            display() { return L("拆掉下一道序数闸", "destruct the next ordinal gate") },
            canClick() { return hasMilestone("ord", 0) && canReset("ord") },
            onClick() { if (canReset("ord")) doReset("ord") },
            style: { "background-color": "#5B2C6F" },
        },
        12: {
            title: function () { return L("算闸", "compute") },
            display() { return L("推算这一格能到的最大序数", "compute the furthest ordinal reachable from this tile") },
            canClick() { return hasMilestone("ord", 4) && DED_kernelReady() },
            onClick() {
                let o = DED_maxReachOrd()
                DED_log(o ? L("最远可到 ", "furthest reachable: ") + DED_printOrd(o) : L("此地没有出口", "no exit from here"))
            },
            style: { "background-color": "#4A235A" },
        },
        13: {
            title: function () { return L("交闸费", "pay the toll") },
            display() { return L("为脚下这道地图闸交推理素", "pay Deductriums for the map gate underfoot") },
            canClick() { return hasMilestone("ord", 0) && DED_boot() },
            onClick() { DED_openGate() },
            style: { "background-color": "#3E1F4A" },
        },
        14: {
            title: function () { return L("阶梯", "ladder") },
            display() { return L("翻开序数阶梯", "turn the ordinal ladder open") },
            canClick() { return player.ord.ladder < 1 },
            onClick() { player.ord.ladder = 1 },
            style: { "background-color": "#6C3483" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("同伦的余温", "Homotopic Afterglow") },
            description: function () { return L("全局收入 ×(1 + 同伦构造子 × 2)。", "All production ×(1 + homotopy constructors × 2).") },
            cost: new Decimal(8e12),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
            effect() { return tunCross(player.hott.points, 2) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        12: {
            title: function () { return L("保留一条公理", "Keep One Axiom") },
            description: function () { return L("破闸后每个公理层各保留 1 条（具名机制）。",
                "After a gate falls, every axiom layer keeps 1 axiom (named mechanic).") },
            cost: new Decimal(1.5e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(1) },
        },
        13: {
            title: function () { return L("纸上的余量", "What Stays on Paper") },
            description: function () { return L("破闸后保留 5% 推理素。", "After a gate falls, 5% of your Deductriums remains.") },
            cost: new Decimal(3e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        14: {
            title: function () { return L("梯子的第一级", "First Rung of the Ladder") },
            description: function () { return L("解锁“阶梯”子标签。", "Unlocks the Ladder subtab.") },
            cost: new Decimal(6e13),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(2) },
        },
        15: {
            title: function () { return L("序数的野心", "Ordinal Ambition") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(1.2e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            effect() { return new Decimal(2) },
        },
        21: {
            title: function () { return L("阶梯的弯度", "Bending the Ladder") },
            description: function () { return L("全局收入 ×(序数+1)^0.5。", "All production ×(ordinals+1)^0.5.") },
            cost: new Decimal(3e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(3) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        22: {
            title: function () { return L("高阶的闸", "Gates of Higher Order") },
            description: function () { return L("全局收入 ×(1 + 同伦构造子 × 3)。", "All production ×(1 + homotopy constructors × 3).") },
            cost: new Decimal(8e14),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
            effect() { return tunCross(player.hott.points, 3) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        23: {
            title: function () { return L("破闸的赌局", "The Gate-Destruction Wager") },
            description: function () { return L("解锁“全盘皆清”挑战。", "Unlocks the Total Wipe challenge.") },
            cost: new Decimal(2e15),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(4) },
        },
        24: {
            title: function () { return L("更窄的闸", "A Narrower Gate") },
            description: function () { return L("下一次破闸的费用减半。", "The next gate costs half as much.") },
            cost: new Decimal(6e15),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(5) },
        },
        25: {
            title: function () { return L("终局之眼", "The Endgame Eye") },
            description: function () { return L("解锁“终局”子标签。", "Unlocks the Endgame subtab.") },
            cost: new Decimal(1.5e16),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(5) },
        },
        31: {
            title: function () { return L("拆闸的老手", "Gate-Breaker") },
            description: function () { return L("每拆一道地图闸，全局收入 ×1.25。", "Each map gate destroyed: all production ×1.25.") },
            cost: new Decimal(4e16),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(6) },
            effect() { return Decimal.pow(1.25, player.gatesDestructed) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        32: {
            title: function () { return L("破闸的余波", "Aftershock of the Gate") },
            description: function () { return L("购买后立即获得 60 秒的生产。", "Instantly grants 60 seconds of production.") },
            cost: new Decimal(1e17),
            currencyInternalName: "points",
            currencyDisplayName: "推理素",
            unlocked() { return player[this.layer].points.gte(6) },
            onPurchase() { player.ded.surge += 60 },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 级序数", " ordinal rung") },
            effectDescription() { return L("解锁破闸按钮与交闸费", "unlocks the destruct button and the toll") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(2) + L(" 级序数", " ordinal rungs") },
            effectDescription() { return L("解锁“阶梯”子标签", "unlocks the Ladder subtab") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].best.gte(2) },
        },
        2: {
            requirementDescription() { return formatWhole(3) + L(" 级序数", " ordinal rungs") },
            effectDescription() { return L("解锁“挑战”子标签", "unlocks the Challenges subtab") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(3) },
        },
        3: {
            requirementDescription() { return formatWhole(6) + L(" 级序数", " ordinal rungs") },
            effectDescription() { return L("解锁“终局”子标签", "unlocks the Endgame subtab") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(6) },
        },
        4: {
            requirementDescription() { return formatWhole(9) + L(" 级序数", " ordinal rungs") },
            effectDescription() { return L("解锁“算闸”按钮", "unlocks the compute button") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].best.gte(9) },
        },
        5: {
            requirementDescription() { return formatWhole(TUNING.endgameRungs) + L(" 级序数", " ordinal rungs") },
            effectDescription() { return L("序数阶梯已走完；还需 ", "The ladder is complete; still need ") + TUNING.endgameHott + L(" 个构造子", " constructors") },
            unlocked() { return hasMilestone(this.layer, 4) },
            done() { return player[this.layer].best.gte(TUNING.endgameRungs) },
        },
    },

    challenges: {
        11: {
            name: function () { return L("全盘皆清", "Total Wipe") },
            challengeDescription() {
                return L("这局里推理素产出只有十分之一，而且破闸不给挑战外的任何东西。",
                    "Inside this run Deductriums flow at one tenth, and gates grant nothing outside it.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内拆掉一道闸", "destruct one gate inside the challenge") },
            canComplete() { return player.ord.points.gte(player.ord.chalBase.add(1)) },
            // A baseline, not a reset: ord's rungs are the endgame counter and must never be lost
            // for entering a challenge (the entry path does not reset the active layer anyway).
            onEnter() { player.ord.chalBase = player.ord.points },
            rewardDescription() { return L("全局收入 ×2，每完成一次再 ×2", "all production ×2, another ×2 per completion") },
            rewardEffect() { return Decimal.pow(2, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 1,
            unlocked() { return hasUpgrade(this.layer, 23) },
        },
    },
})

// The ladder readout: every rung with its price, the current one marked. Pure display.
function ORD_ladder() {
    let rows = ""
    let have = player.ord.points.toNumber()
    for (let i = 0; i < tunCap("ord"); i++) {
        let price = tunAxiomPrice("ord", i)
        let mark = i < have ? "✔" : (i === have ? "→" : "·")
        rows += "<tr><td style='padding:2px 8px'>" + mark + "</td><td style='padding:2px 8px'>ω·" + i +
            "</td><td style='padding:2px 8px;opacity:.8'>" + format(price) + " 推理素</td></tr>"
    }
    return "<table style='font-family:Consolas,monospace;font-size:13px'>" + rows + "</table>"
}

function ORD_endgame() {
    let here = L("拆闸 ", "gates destroyed ") + formatWhole(player.gatesDestructed) +
        L(" · 序数 ", " · ordinals ") + formatWhole(player.ord.points) + " / " + TUNING.endgameRungs +
        L(" · 构造子 ", " · constructors ") + formatWhole(player.hott.points) + " / " + TUNING.endgameHott
    let done = isEndgame()
    return "<div style='font-family:Consolas,monospace;line-height:1.7'>" + here + "<br>" +
        (done ? L("ω 已经落在纸上。", "ω is on paper.") : L("阶梯还在延伸。", "The ladder still extends.")) + "</div>"
}
