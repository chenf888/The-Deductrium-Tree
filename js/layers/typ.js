// typ — Type 类型论. Row 3, position 2. The active layer of the third era: a goal type sits on the
// bar, three tactic buttons reduce it, and a solved goal becomes a permanent type-theoretic theorem
// (player.typ.puzzle, which the achievement layer counts). D17: TTGui's DOM is replaced by tabFormat +
// clickables, but the tactics, the definitional-equality gate and the puzzle keys are preserved.

var TYP_PUZZLES = ["bool", "nat", "prod", "sump", "circle", "univ"]
var TYP_PUZZLE_NAMES = {
    bool: ["Bool 的两个值", "The two values of Bool"],
    nat: ["自然数的消去", "Eliminating the naturals"],
    prod: ["Σ 类型的投影", "Projection from a Σ-type"],
    sump: ["⊎ 的分支", "Branching on a ⊎"],
    circle: ["圆的环路", "The loop of the circle"],
    univ: ["单价性", "Univalence"],
}

addLayer("typ", {
    name: "Type 类型论",
    symbol: "T",
    color: "#E0559A",
    resource: "类型论层级",
    baseResource: "推理素",
    row: 3,
    position: 2,
    type: "custom",

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
            solved: new Decimal(0),
            puzzle: {},
            target: 0,
            reduction: 0,
            surge: 0,
            chalGoals: 0,
        }
    },

    baseAmount() { return player.points },
    requires: function () { return tunRequires("typ") },
    exponent: tunExponent("typ"),

    getResetGain() { return tunNormalGain(this.layer) },
    getNextAt(canMax) { return tunNormalNextAt(this.layer) },
    canReset() {
        return player.points.gte(tmp[this.layer].requires) && player.typ.solved.gte(1)
    },
    simCanReset() { return player.points.gte(tunRequires("typ")) },

    gainMult() {
        let m = new Decimal(1)
        // K3: the two axiom eras whose proofs the type layer re-checks
        m = m.times(tunCross(player.zfc.points, 0.4))
        m = m.times(tunCross(player.num.points, 0.5))
        // K3 via the ZFC choice counter (bought in zfc.b11 — a buyable consumed here)
        m = m.times(buyableEffect("zfc", 11))
        if (hasUpgrade(this.layer, 15)) m = m.times(2)
        return m
    },
    gainExp() {
        if (hasUpgrade(this.layer, 21)) return new Decimal(1).add(player[this.layer].solved.times(0.05))
        return new Decimal(1)
    },
    softcap() {
        let cap = tunSoftcap("typ")
        if (hasUpgrade("typ", 33)) cap = cap.times(10)
        if (hasUpgrade("zfc", 31)) cap = cap.times(10)
        return cap
    },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.typ, Decimal.min(player.typ.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.typ + "，", " (×" + TUNING.effectBase.typ + " per level, ") +
            TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    prestigeButtonText() {
        if (!canReset(this.layer)) {
            if (player.points.lt(tunRequires("typ")))
                return L("需要 ", "Requires ") + formatWhole(tunRequires("typ")) + L(" 推理素", " Deductriums")
            return L("先解开一个类型谜题", "Solve one type puzzle first")
        }
        return L("重写类型论，换取 ", "Rewrite type theory for ") + formatWhole(tmp[this.layer].resetGain) +
            L(" 级。推理素归零", " levels. Deductriums are spent")
    },

    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        // 07 F18: puzzle is a plain object — hand-copy it across layerDataReset.
        let puzzles = player[this.layer].puzzle || {}
        let solved = player[this.layer].solved
        let goal = player[this.layer].target
        layerDataReset(this.layer, ["unlocked", "best", "total"])
        player[this.layer].puzzle = puzzles
        player[this.layer].solved = solved
        player[this.layer].target = goal
        player[this.layer].reduction = 0
    },

    update(diff) {
        if (!player[this.layer].unlocked) return
        if (player[this.layer].surge > 0) {
            let seconds = Math.min(Number(diff), player[this.layer].surge)
            player[this.layer].surge -= seconds
            DED_grant(getPointGen().times(seconds), null)
        }
        if (player[this.layer].reduction >= TYP_goalSize()) TYP_solve()
    },

    layerShown() { return player.num.best.gte(1) },

    hotkeys: [
        {
            key: "t",
            description: L("t：用 whnf 归约目标类型", "t: reduce the goal type with whnf"),
            onPress() { if (player[this.layer].unlocked && hasMilestone(this.layer, 0)) TYP_reduce(1) },
            unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: {
        "类型": {
            content: [
                ["display-text", function () { return mainLine("typ") }],
                ["display-text", function () { return baseLine("typ") }],
                ["display-text", function () { return softcapWarning("typ") }],
                ["display-text", function () { return TYP_goalLine() }],
                ["bar", "target"],
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
            "战术": {
                unlocked() { return hasMilestone("typ", 0) },
                content: [
                    ["display-text", function () { return L("三个战术把目标类型往规范形推：", "Three tactics push the goal toward normal form:") }],
                    ["clickables", [1]],
                    "blank",
                    ["raw-html", function () { return TYP_tacticTable() }],
                ],
            },
            "谜题": { unlocked() { return hasUpgrade("typ", 22) }, content: [["raw-html", function () { return TYP_puzzleList() }]] },
            "里程碑": { content: ["blank", "milestones"] },
            "挑战": { unlocked() { return hasUpgrade("typ", 24) }, content: ["blank", "challenges"] },
        },
    },

    bars: {
        target: {
            direction: RIGHT,
            width: 320,
            height: 24,
            instant: true,
            display() {
                return L("目标 ", "Goal ") + TYP_goalName() + " · " + formatWhole(player.typ.reduction) + " / " + TYP_goalSize()
            },
            progress() { return Math.min(1, player.typ.reduction / TYP_goalSize()) },
            fillStyle: { "background-color": "#E0559A" },
        },
    },

    clickables: {
        11: {
            title: function () { return "whnf" },
            display() { return L("弱头规范形：推进 1 步", "weak head normal form: +1 step") },
            canClick() { return player.typ.reduction < TYP_goalSize() },
            onClick() { TYP_reduce(1) },
            style: { "background-color": "#7D3C98" },
        },
        12: {
            title: function () { return "apply" },
            display() { return L("应用：推进 2 步", "apply: +2 steps") },
            canClick() { return hasUpgrade("typ", 14) && player.typ.reduction < TYP_goalSize() },
            onClick() { TYP_reduce(2) },
            style: { "background-color": "#8E44AD" },
        },
        13: {
            title: function () { return "defeq" },
            display() { return L("定义相等：推进 3 步", "definitional equality: +3 steps") },
            canClick() { return hasUpgrade("typ", 15) && player.typ.reduction < TYP_goalSize() },
            onClick() { TYP_reduce(3) },
            style: { "background-color": "#9B59B6" },
        },
        14: {
            title: function () { return L("换目标", "new goal") },
            display() { return L("换一个目标类型（不清进度）", "pick another goal type (progress stays)") },
            canClick() { return player.typ.target < TYP_PUZZLES.length - 1 },
            onClick() { player.typ.target = Math.min(player.typ.target + 1, TYP_PUZZLES.length - 1) },
            style: { "background-color": "#5B2C6F" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("类型接管证明", "Types Take Over Proofs") },
            description: function () { return L("全局收入 ×3。", "All production ×3.") },
            cost: new Decimal(1),
            effect() { return new Decimal(3) },
        },
        12: {
            title: function () { return L("自举的层级", "Self-Bootstrapping Hierarchy") },
            description: function () { return L("全局收入 ×(层级+1)^0.4。", "All production ×(levels+1)^0.4.") },
            cost: new Decimal(4),
            unlocked() { return hasUpgrade(this.layer, 11) },
            effect() { return tunSelf(player[this.layer].points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("公理的复核", "Rechecking the Axioms") },
            description: function () { return L("全局收入 ×(1 + 集合论公理 × 0.4)。", "All production ×(1 + set-theory axioms × 0.4).") },
            cost: new Decimal(30),
            unlocked() { return player.zfc.unlocked && hasUpgrade(this.layer, 12) },
            effect() { return tunCross(player.zfc.points, 0.4) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("应用战术", "The Apply Tactic") },
            description: function () { return L("解锁“应用”按钮（每次推进 2 步）。", "Unlocks the apply button (+2 steps per press).") },
            cost: new Decimal(120),
            unlocked() { return hasUpgrade(this.layer, 13) },
        },
        15: {
            title: function () { return L("定义相等", "Definitional Equality") },
            description: function () { return L("解锁“定义相等”按钮（每次推进 3 步），类型收益 ×2。",
                "Unlocks the def-eq button (+3 steps per press); type gain ×2.") },
            cost: new Decimal(600),
            unlocked() { return hasUpgrade(this.layer, 14) },
        },
        21: {
            title: function () { return L("解谜的余温", "Afterglow of Solved Goals") },
            description: function () { return L("类型收益曲线的指数 +(已解谜题 × 0.05)。", "The type gain exponent +(solved puzzles × 0.05).") },
            cost: new Decimal(3e3),
            unlocked() { return player[this.layer].solved.gte(1) },
        },
        22: {
            title: function () { return L("谜题清单", "The Puzzle List") },
            description: function () { return L("解锁“谜题”子标签。", "Unlocks the Puzzles subtab.") },
            cost: new Decimal(1.5e4),
            unlocked() { return player[this.layer].solved.gte(1) },
        },
        23: {
            title: function () { return L("类型的野心", "Type-Theoretic Ambition") },
            description: function () { return L("全局收入 ×2。", "All production ×2.") },
            cost: new Decimal(8e4),
            unlocked() { return hasUpgrade(this.layer, 21) },
            effect() { return new Decimal(2) },
        },
        24: {
            title: function () { return L("归约的赌局", "The Reduction Wager") },
            description: function () { return L("解锁挑战面板。", "Unlocks the Challenges panel.") },
            cost: new Decimal(5e5),
            unlocked() { return player[this.layer].solved.gte(2) },
        },
        25: {
            title: function () { return L("战术的余裕", "Room for Tactics") },
            description: function () { return L("“应用”再推进 1 步。", "The apply button takes one more step.") },
            cost: new Decimal(3e6),
            unlocked() { return hasUpgrade(this.layer, 24) },
        },
        31: {
            title: function () { return L("类型预算", "Type Budget") },
            description: function () { return L("解锁“类型预算”买可购物。", "Unlocks the type-budget buyable.") },
            cost: new Decimal(2e7),
            unlocked() { return player[this.layer].solved.gte(3) },
        },
        32: {
            title: function () { return L("更强的消去", "Stronger Elimination") },
            description: function () { return L("全局收入 ×(已解谜题+1)^0.5。", "All production ×(solved puzzles+1)^0.5.") },
            cost: new Decimal(1.5e8),
            unlocked() { return hasUpgrade(this.layer, 31) },
            effect() { return player[this.layer].solved.add(1).pow(0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        33: {
            title: function () { return L("类型的软上限", "A Softer Type Ceiling") },
            description: function () { return L("类型软上限 ×10（当前 ", "Type softcap ×10 (currently ") +
                format(tunSoftcap("typ").times(10)) + L("）。", ").") },
            cost: new Decimal(1e9),
            unlocked() { return player.typ.points.gte(2) },
        },
        34: {
            title: function () { return L("解谜的冲动", "The Urge to Solve") },
            description: function () { return L("购买后立即获得 30 秒的生产。", "Instantly grants 30 seconds of production.") },
            cost: new Decimal(8e9),
            unlocked() { return player[this.layer].solved.gte(3) },
            onPurchase() { player.typ.surge += 30 },
        },
    },

    buyables: {
        11: {
            title: function () { return L("类型预算", "Type Budget") },
            cost(x) { return new Decimal(2).times(Decimal.pow(2.5, x)) },
            effect(x) { return Decimal.add(1, x.times(0.1)) },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("每级 +10% 全局收入（已 ", "+10% all production each (have ") + formatWhole(getBuyableAmount(this.layer, this.id)) +
                    L(" / 10）\n花费 ", " / 10)\ncosts ") + format(d.cost) + L(" 类型论层级", " type levels")
            },
            purchaseLimit: new Decimal(10),
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
            },
            unlocked() { return hasUpgrade("typ", 31) },
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(1) + L(" 级类型论", " type levels") },
            effectDescription() { return L("解锁战术面板", "unlocks the Tactics panel") },
            done() { return player[this.layer].best.gte(1) },
        },
        1: {
            requirementDescription() { return formatWhole(3) + L(" 累计层级", " levels made") },
            effectDescription() { return L("每个目标少 2 步归约", "each goal needs 2 fewer reduction steps") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].total.gte(3) },
        },
        2: {
            requirementDescription() { return formatWhole(4) + L(" 级类型论（历史最高）", " type levels (best)") },
            effectDescription() { return L("全局收入 ×10", "all production ×10") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(4) },
        },
        3: {
            requirementDescription() { return formatWhole(6) + L(" 级类型论（历史最高）", " type levels (best)") },
            effectDescription() { return L("解锁第二个挑战", "unlocks the second challenge") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(6) },
        },
        4: {
            requirementDescription() { return formatWhole(8) + L(" 级类型论（历史最高）", " type levels (best)") },
            effectDescription() { return L("类型升级自动购买", "type upgrades buy themselves") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].best.gte(8) },
        },
    },

    autoUpgrade() { return hasMilestone(this.layer, 4) },

    challenges: {
        11: {
            name: function () { return L("不许归约", "No Reduction") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的十分之一——战术照常，棋盘不再给钱。",
                    "Inside this run Deductriums flow at one tenth — the tactics still work, the board just stops paying.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/2"
            },
            goalDescription() { return L("在挑战内解开一个目标类型", "close one goal type inside the challenge") },
            canComplete() { return (player.typ.chalGoals || 0) >= 1 },
            onEnter() { player.typ.points = new Decimal(0); player.typ.reduction = 0; player.typ.chalGoals = 0 },
            rewardDescription() { return L("全局收入 ×2，每完成一次再 ×2", "all production ×2, another ×2 per completion") },
            rewardEffect() { return Decimal.pow(2, challengeCompletions(this.layer, this.id)) },
            rewardDisplay() { return "×" + format(this.rewardEffect()) },
            completionLimit: 2,
            unlocked() { return hasUpgrade(this.layer, 24) },
        },
        12: {
            name: function () { return L("单值类型", "One Value Only") },
            challengeDescription() {
                return L("这局里推理素的产出只有原来的一半——类型只看构造子，不看公理的数目。",
                    "Inside this run Deductriums flow at half rate — types see constructors, not counts.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/1"
            },
            goalDescription() { return L("在挑战内解开一个谜题", "solve one puzzle inside the challenge") },
            canComplete() { return player.typ.solved.gte(1) },
            onEnter() { player.typ.solved = new Decimal(0) },
            rewardDescription() { return L("全局收入 ×3", "all production ×3") },
            rewardEffect() { return new Decimal(3) },
            rewardDisplay() { return "×3" },
            completionLimit: 1,
            unlocked() { return hasMilestone(this.layer, 3) },
        },
    },
})

// Goal size shrinks with milestone 1 and grows per puzzle; the bar and update() share this number.
function TYP_goalSize() {
    let size = 6 + player.typ.target * 2
    if (hasMilestone("typ", 1)) size -= 2
    return Math.max(2, size)
}

function TYP_goalLine() {
    return L("当前目标：", "Current goal: ") + TYP_goalName() + " · " +
        L("已解 ", "solved ") + formatWhole(player.typ.solved) + " / " + TYP_PUZZLES.length
}

function TYP_goalName() {
    let key = TYP_PUZZLES[player.typ.target] || TYP_PUZZLES[0]
    let pair = TYP_PUZZLE_NAMES[key] || [key, key]
    return L(pair[0], pair[1]) + (player.typ.puzzle[key] ? L("（已解）", " (solved)") : "")
}

function TYP_reduce(n) {
    if (!player.typ.unlocked) return
    if (hasUpgrade("typ", 25) && n === 2) n += 1
    player.typ.reduction = Math.min(TYP_goalSize(), player.typ.reduction + n)
}

function TYP_solve() {
    let key = TYP_PUZZLES[player.typ.target] || TYP_PUZZLES[0]
    if (!player.typ.puzzle[key]) player.typ.puzzle[key] = true
    player.typ.solved = player.typ.solved.add(1)
    if (inChallenge("typ", 11)) player.typ.chalGoals = (player.typ.chalGoals || 0) + 1
    player.typ.reduction = 0
    if (player.typ.target < TYP_PUZZLES.length - 1) player.typ.target += 1
    if (hasUpgrade("typ", 34)) player.typ.surge += 30
    DED_note(L("解开了类型谜题：", "Solved a type puzzle: ") + TYP_goalName())
}

function TYP_tacticTable() {
    let rows = [
        ["whnf", L("弱头规范形 +1", "weak head normal form +1"), true],
        ["apply", L("应用 +2", "apply +2"), hasUpgrade("typ", 14)],
        ["defeq", L("定义相等 +3", "definitional equality +3"), hasUpgrade("typ", 15)],
    ]
    let out = "<table style='font-family:Consolas,monospace;font-size:13px'>"
    for (let i = 0; i < rows.length; i++)
        out += "<tr><td style='padding:2px 10px'>" + rows[i][0] + "</td><td style='padding:2px 10px'>" +
            rows[i][1] + "</td><td style='padding:2px 10px;opacity:.7'>" +
            (rows[i][2] ? L("可用", "available") : L("未解锁", "locked")) + "</td></tr>"
    return out + "</table>"
}

function TYP_puzzleList() {
    let out = "<table style='font-family:Consolas,monospace;font-size:13px'>"
    for (let i = 0; i < TYP_PUZZLES.length; i++) {
        let key = TYP_PUZZLES[i]
        let pair = TYP_PUZZLE_NAMES[key] || [key, key]
        out += "<tr><td style='padding:2px 10px'>" + (player.typ.puzzle[key] ? "✔" : "·") +
            "</td><td style='padding:2px 10px'>" + L(pair[0], pair[1]) + "</td></tr>"
    }
    return out + "</table>"
}
