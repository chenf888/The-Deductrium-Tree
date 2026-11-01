// geo — the hyperbolic {6,4} map. Row 1, the layer the player walks. type:"custom" because
// prestiging it re-projects the manifold instead of merely converting currency, and because the
// tile state (open gates, picked-up rewards) is kernel state that the stock formulas know nothing
// about. The map data itself is the original's: 2096 blocks, 500 named tiles, all 1612 placement
// instructions, loaded by the bundled hy/maploader.js.
addLayer("geo", {
    name: "Geometry",
    symbol: "G",
    color: "#41BEB1",
    resource: "tiles",
    baseResource: "Deductriums",
    row: 1,
    position: 0,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            total: new Decimal(0),
            best: new Decimal(0),
            at: "",                     // current tile hash string, mirrored from HWorld
            openGates: {},              // hash -> true, permanent (the original rewrites the tile)
            taken: {},                  // reward tiles already picked up
            visited: {},                // every tile the player has stood on
            path: {},                   // tiles used to reach another tile (for the map readout)
            ordinals: {},               // ordinal tiles found, hash -> ord text
            unlocks: {},                // the map's own 解锁X层 markers
            runStart: 0,
            seen: 0,                    // tiles drawn in the local ring (upgrade 32 raises it)
        }
    },

    type: "custom",
    baseAmount() { return player.points },
    requires: function () { return tunRequires("geo") },
    exponent: tunExponent("geo"),

    getResetGain() { return tunNormalGain(this.layer) },
    getNextAt(canMax) { return tunNormalNextAt(this.layer) },
    canReset() { return player.points.gte(tmp[this.layer].requires) && DED_visitedCount().gte(4) },
    // Sim-only: walking 4 tiles is content the headless harness does not model; the lower
    // bound keeps the currency gate (same reason as ded.simCanReset).
    simCanReset() { return player.points.gte(tunRequires("geo")) },

    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade(this.layer, 22)) mult = mult.times(Decimal.add(1, DED_openGateCount().times(0.1)))
        if (hasUpgrade(this.layer, 31)) mult = mult.times(Decimal.add(1, getBuyableAmount("geo", 11).times(0.25)))
        // literals are the lens: the deeper the numeral machinery, the further the map is visible
        if (hasUpgrade(this.layer, 13)) mult = mult.times(Decimal.add(1, getBuyableAmount("lit", 11).times(0.5)))
        return mult
    },
    gainExp() {
        if (hasUpgrade(this.layer, 21)) return new Decimal(1.05)
        return new Decimal(1)
    },
    directMult() {
        let m = new Decimal(1)
        if (hasUpgrade(this.layer, 25)) m = m.times(2)
        if (hasChallenge(this.layer, 11)) m = m.times(2)
        return m
    },
    softcap() { return tunSoftcap("geo").times(hasUpgrade("geo", 23) ? 10 : 1) },
    softcapPower: TUNING.softcapPower,

    effect() {
        return Decimal.pow(TUNING.effectBase.geo, Decimal.min(player.geo.points, TUNING.effectLevelCap))
    },
    effectDescription() {
        return L("全局收入 ×", "all production ×") + format(this.effect()) +
            L("（每级 ×" + TUNING.effectBase.geo + "，", " (×" + TUNING.effectBase.geo + " per level, ") + TUNING.effectLevelCap + L(" 级封顶）", " levels, saturated)")
    },

    resetDescription() { return L("重投影流形，换取 ", "Re-project the manifold for ") },
    prestigeButtonText() {
        if (!canReset(this.layer)) {
            return L("需要 ", "Requires ") + formatWhole(tmp[this.layer].requires) +
                L(" 推理素并踩过 4 个格子（已踩 ", " Deductriums and 4 tiles stood on (") +
                formatWhole(DED_visitedCount()) + L("）", ")")
        }
        return L("重投影流形，换取 ", "Re-project the manifold for ") + formatWhole(tmp[this.layer].resetGain) +
            " " + L("格位。已开的闸与已拾的奖励都会留下。", " tiles. Open gates and picked rewards stay open.")
    },

    onPrestige(gain) {
        player.geo.seen = 0
    },

    doReset(resettingLayer) {
        if (!(layers[resettingLayer].row > this.row)) return
        let open = Object.assign({}, player.geo.openGates)
        let taken = Object.assign({}, player.geo.taken)
        let visited = Object.assign({}, player.geo.visited)
        let ordinals = Object.assign({}, player.geo.ordinals)
        let unlocks = Object.assign({}, player.geo.unlocks)
        let at = player.geo.at
        layerDataReset(this.layer, ["unlocked", "best", "total"])
        player.geo.openGates = open
        player.geo.taken = taken
        player.geo.visited = visited
        player.geo.ordinals = ordinals
        player.geo.unlocks = unlocks
        player.geo.at = at
        DED_syncWorldFromSave()
    },

    passiveGeneration() {
        if (hasMilestone(this.layer, 1)) return 1
        return 0
    },

    update(diff) {
        if (!player[this.layer].unlocked) return
        DED_boot()
    },

    layerShown() { return true },

    hotkeys: [
        {
            key: "g",
            description: L("g：重投影流形（把推理素换成格位）", "g: re-project the manifold, turning Deductriums into tiles"),
            onPress() { if (player[this.layer].unlocked && canReset(this.layer)) doReset(this.layer) },
            unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "w", description: L("w：向北一步（双曲移动）", "w: step north (hyperbolic move)"),
            onPress() { if (player[this.layer].unlocked) DED_walkDir("w") }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "a", description: L("a：向西一步", "a: step west"),
            onPress() { if (player[this.layer].unlocked) DED_walkDir("a") }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "s", description: L("s：向南一步", "s: step south"),
            onPress() { if (player[this.layer].unlocked) DED_walkDir("s") }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "d", description: L("d：向东一步（双曲移动）", "d: step east (hyperbolic move)"),
            onPress() { if (player[this.layer].unlocked) DED_walkDir("d") }, unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: [
        ["display-text", function () { return mainLine("geo", 0) }],
        ["display-text", function () { return baseLine("geo") + " · " + L("走过 ", "walked ") + formatWhole(DED_visitedCount()) + L(" 格", " tiles") }],
        ["display-text", function () { return softcapWarning("geo") }],
        "prestige-button",
        "blank",
        ["raw-html", function () { return GEO_currentTilePanel() }],
        ["clickables", [1]],
        ["bar", "toll"],
        ["bar", "reach"],
        "grid",
        ["microtabs", "map"],
        ["blank", "40px"],
    ],

    microtabs: {
        map: {
            "地图": {
                content: [["blank", "15px"], ["raw-html", function () { return GEO_ringTable() }]],
            },
            "路标": {
                unlocked() { return hasUpgrade("geo", 15) },
                content: [["blank", "15px"], ["display-text", function () { return L("路标与锚点都花格位——它们改变你能看见什么，不是乘数。", "Waypoints and anchors are paid in tiles. They change what you can see, not a multiplier.") }], "buyables"],
            },
            "里程碑": { content: [["blank", "15px"], "milestones"] },
            "挑战": {
                unlocked() { return hasUpgrade("geo", 33) },
                content: [["blank", "15px"], "challenges"],
            },
        },
    },

    // The neighbourhood view: the current tile plus its six {6,4} neighbours, then the ring beyond.
    grid: {
        rows: 3,
        cols: 5,
        getStartData(id) { return 0 },
        getUnlocked(id) { return DED_boot() },
        getCanClick(data, id) {
            let t = GEO_ring()[id - 101]
            return !!(t && t.steppable)
        },
        getTitle(data, id) {
            let t = GEO_ring()[id - 101]
            if (!t) return "·"
            return t.hash ? DED_blockTypeName(t.type) + " · " + (t.name || t.short) : L("脚下", "here")
        },
        getDisplay(data, id) {
            let t = GEO_ring()[id - 101]
            if (!t) return "·"
            if (!t.hash) return "★"
            return ["路", "墙", "闸", "奖", "序"][Math.max(0, Math.min(4, t.type))]
        },
        getStyle(data, id) {
            let t = GEO_ring()[id - 101]
            if (!t) return { "background-color": "#1b1f24" }
            if (!t.hash) return { "background-color": "#41BEB1" }
            let colors = ["#2b3138", "#4a1f1f", "#6b5a1e", "#1f4a2b", "#3a1f5e"]
            return { "background-color": colors[Math.max(0, Math.min(4, t.type))] }
        },
        getTooltip(data, id) {
            let t = GEO_ring()[id - 101]
            if (!t || !t.hash) return ""
            return t.hash + (t.text ? "<br>" + TRC(t.text) : "")
        },
        onClick(data, id) {
            let t = GEO_ring()[id - 101]
            if (!t || !t.steppable) return
            DED_stepTo(t.hash, DED_currentHash())
        },
    },

    bars: {
        toll: {
            direction: RIGHT,
            width: 360,
            height: 28,
            display() {
                let tile = DED_currentBlock()
                if (!tile || tile.type !== 2) return L("脚下不是闸门", "no gate underfoot")
                let price = DED_gatePrice(DED_currentHash())
                return fmtDed(player.points) + " / " + fmtDed(price) + L(" 开此闸", " to open this gate")
            },
            progress() {
                let tile = DED_currentBlock()
                if (!tile || tile.type !== 2) return 1
                return player.points.div(DED_gatePrice(DED_currentHash())).toNumber()
            },
            fillStyle: { "background-image": "linear-gradient(to right, #41BEB1, #9ef2e5)" },
        },
        reach: {
            direction: RIGHT,
            width: 360,
            height: 28,
            unlocked() { return player.ord.unlocked },
            display() { return L("序数 ", "ordinal ") + formatWhole(player.ord.points) + " / " + tunCap("ord") },
            progress() { return player.ord.points.div(tunCap("ord")).toNumber() },
            fillStyle: { "background-color": "#DD00FF" },
        },
    },

    upgrades: {
        11: {
            title: function () { return L("把圆盘画大", "A Bigger Disk") },
            description: function () { return L("全局收入 ×3。", "All production ×3.") },
            cost: new Decimal(1),
            effect() { return new Decimal(3) },
        },
        12: {
            title: function () { return L("测地线直觉", "Geodesic Instinct") },
            description: function () { return L("全局收入 ×(格位+1)^0.5。", "All production ×(tiles+1)^0.5.") },
            cost: new Decimal(4),
            unlocked() { return hasUpgrade(this.layer, 11) },
            effect() { return tunSelf(player[this.layer].points, 0.5) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        13: {
            title: function () { return L("字面量作透镜", "Literals as a Lens") },
            description: function () { return L("每有一个字面量路标，格位收益 +50%。", "Each literal waypoint gives tiles +50%.") },
            cost: new Decimal(20),
            unlocked() { return player.lit.unlocked },
            effect() { return Decimal.add(1, getBuyableAmount("lit", 11).times(0.5)) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        14: {
            title: function () { return L("拾荒者", "Scavenger") },
            description: function () { return L("格子上拾到的推理素 ×2。", "Deductriums picked up on tiles ×2.") },
            cost: new Decimal(60),
        },
        15: {
            title: function () { return L("钉住路标", "Pinning Waypoints") },
            description: function () { return L("解锁“路标”子标签与第二组买可购物。", "Unlocks the Waypoints subtab and the second buyable.") },
            cost: new Decimal(150),
        },
        21: {
            title: function () { return L("曲率的弯度", "Curvature's Bend") },
            description: function () { return L("格位的指数由 0.5 变为 0.525。", "The tile exponent becomes 0.525 instead of 0.5.") },
            cost: new Decimal(400),
            unlocked() { return hasMilestone(this.layer, 1) },
        },
        22: {
            title: function () { return L("开门越多，路越熟", "Doors Known") },
            description: function () { return L("每道已开之闸使格位收益 +10%。", "Each open gate gives tiles +10%.") },
            cost: new Decimal(900),
            effect() { return Decimal.add(1, DED_openGateCount().times(0.1)) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        23: {
            title: function () { return L("更远的投影", "A Farther Projection") },
            description: function () { return L("格位软上限 ×10（当前 ", "Tile softcap ×10 (currently ") + format(tunSoftcap("geo").times(10)) + L("）。", ").") },
            cost: new Decimal(3e3),
            unlocked() { return player.geo.points.gte(100) },
        },
        24: {
            title: function () { return L("拾取的技艺", "The Art of Picking Up") },
            description: function () { return L("格子奖励再乘一次。", "Multiplies tile rewards again.") },
            cost: new Decimal(1.2e4),
            effect() { return new Decimal(3) },
            effectDisplay() { return "×3" },
        },
        25: {
            title: function () { return L("重投影的仪式", "The Re-projection Rite") },
            description: function () { return L("每次重投影 ×2。", "Each re-projection ×2.") },
            cost: new Decimal(5e4),
            effect() { return new Decimal(2) },
        },
        31: {
            title: function () { return L("锚定此格", "Anchoring This Tile") },
            description: function () { return L("每个锚点使格位收益 +25%。", "Each anchor gives tiles +25%.") },
            cost: new Decimal(2e5),
            unlocked() { return hasUpgrade(this.layer, 15) },
            effect() { return Decimal.add(1, getBuyableAmount("geo", 12).times(0.25)) },
            effectDisplay() { return "×" + format(this.effect()) },
        },
        32: {
            title: function () { return L("拖动画布", "Drag the Canvas") },
            description: function () { return L("邻域视图从 6 格扩到 14 格。", "Widens the neighbourhood view from 6 to 14 tiles.") },
            cost: new Decimal(8e5),
        },
        33: {
            title: function () { return L("封路的挑战", "Sealed Roads") },
            description: function () { return L("解锁“挑战”子标签。", "Unlocks the Challenges subtab.") },
            cost: new Decimal(4e6),
        },
    },

    milestones: {
        0: {
            requirementDescription() { return formatWhole(4) + L(" 格位", " tiles") },
            effectDescription() { return L("解锁“路标”页签的入口", "unlocks the way in to the Waypoints tab") },
            done() { return player[this.layer].best.gte(4) },
        },
        1: {
            requirementDescription() { return formatWhole(TUNING.automation.geoPassive) + L(" 格位", " tiles") },
            effectDescription() { return L("自动重投影（每帧产出等于按钮的量）", "re-projects on its own (produces as much as the button)") },
            unlocked() { return hasMilestone(this.layer, 0) },
            done() { return player[this.layer].best.gte(TUNING.automation.geoPassive) },
        },
        2: {
            requirementDescription() { return formatWhole(30) + L(" 格位", " tiles") },
            effectDescription() { return L("已开之闸不再被墙遮蔽", "open gates stop being hidden by walls") },
            unlocked() { return hasMilestone(this.layer, 1) },
            done() { return player[this.layer].best.gte(30) },
        },
        3: {
            requirementDescription() { return formatWhole(60) + L(" 格位", " tiles") },
            effectDescription() { return L("全局收入 ×(1 + 元规则/2)", "all production ×(1 + metarules/2)") },
            unlocked() { return hasMilestone(this.layer, 2) },
            done() { return player[this.layer].best.gte(60) },
        },
        4: {
            requirementDescription() { return formatWhole(120) + L(" 累计格位", " tiles made") },
            effectDescription() { return L("格子奖励 ×5", "tile rewards ×5") },
            unlocked() { return hasMilestone(this.layer, 3) },
            done() { return player[this.layer].total.gte(120) },
        },
    },

    buyables: {
        11: {
            title: function () { return L("路标", "Waypoint") },
            cost(x) { return Decimal.pow(3, x.add(1)).times(2).floor() },
            effect(x) { return x.times(2) },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("路标使远方格位可拾（已 ", "waypoints make distant tiles reachable (have ") + formatWhole(d.bought) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("格位", "tiles")
            },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            unlocked() { return hasUpgrade("geo", 15) },
        },
        12: {
            title: function () { return L("锚点", "Anchor") },
            cost(x) { return Decimal.pow(4, x.add(1)).times(8).floor() },
            effect(x) { return x },
            display() {
                let d = tmp[this.layer].buyables[this.id]
                return L("锚点撑开邻域（已 ", "anchors widen the neighbourhood (have ") + formatWhole(d.bought) +
                    L("）\n花费 ", ")\ncosts ") + format(d.cost) + " " + L("格位", "tiles")
            },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            purchaseLimit: new Decimal(6),
            unlocked() { return hasUpgrade("geo", 31) },
        },
    },

    clickables: {
        11: {
            title: function () { return L("北 W", "north W") },
            display() { return "↑" },
            canClick() { return DED_boot() },
            onClick() { DED_walkDir("w") },
        },
        12: {
            title: function () { return L("西 A", "west A") },
            display() { return "←" },
            canClick() { return DED_boot() },
            onClick() { DED_walkDir("a") },
        },
        13: {
            title: function () { return L("脚下", "here") },
            display() { return "★" },
            canClick() { return DED_boot() },
            onClick() {
                let tile = DED_currentBlock()
                DED_note(L("此格：", "this tile: ") + (tile ? TRC(tile.text || "") + " [" + DED_blockTypeName(tile.type) + "]" : L("无名", "unnamed")))
            },
        },
        14: {
            title: function () { return L("东 D", "east D") },
            display() { return "→" },
            canClick() { return DED_boot() },
            onClick() { DED_walkDir("d") },
        },
        15: {
            title: function () { return L("南 S", "south S") },
            display() { return "↓" },
            canClick() { return DED_boot() },
            onClick() { DED_walkDir("s") },
        },
        16: {
            title: function () { return L("开闸", "open gate") },
            display() {
                let tile = DED_currentBlock()
                if (!tile || tile.type !== 2) return "—"
                return fmtDed(DED_gatePrice(DED_currentHash()))
            },
            canClick() {
                let tile = DED_currentBlock()
                return !!(tile && tile.type === 2 && !DED_gateOpen(DED_currentHash()) && player.points.gte(DED_gatePrice(DED_currentHash())))
            },
            onClick() { DED_openGate() },
            style() {
                let tile = DED_currentBlock()
                return tile && tile.type === 2 ? { "background-color": "#6b5a1e" } : {}
            },
        },
    },

    challenges: {
        11: {
            name: function () { return L("只走一步", "One Step Only") },
            challengeDescription() {
                return L("邻域视图缩成一格：只能靠 WASD 与脚下这一格推理。",
                    "The neighbourhood shrinks to one tile: only WASD and whatever is underfoot.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/1"
            },
            goalDescription() { return L("在本挑战内打开 2 道闸", "open 2 gates inside the challenge") },
            canComplete() { return DED_gatesOpenedThisRun().gte(2) },
            rewardDescription() { return L("格位收益 ×2", "tile gain ×2") },
            rewardEffect() { return new Decimal(2) },
            rewardDisplay() { return "×2" },
            unlocked() { return hasUpgrade("geo", 33) },
            onEnter() { player.geo.runStart = DED_openGateCount() },
        },
        12: {
            name: function () { return L("无奖励之行", "Run Without Rewards") },
            challengeDescription() {
                return L("格子不再付推理素——只有你的收入在付账。",
                    "Tiles pay no Deductriums: only your own income pays the tolls.") +
                    "<br>" + challengeCompletions(this.layer, this.id) + "/1"
            },
            goalDescription() { return L("走到 8 层深的格", "reach a tile 8 steps deep") },
            canComplete() { return DED_deepestSeen().gte(8) },
            rewardDescription() { return L("拾取奖励 ×3", "tile rewards ×3") },
            rewardEffect() { return new Decimal(3) },
            rewardDisplay() { return "×3" },
            unlocked() { return hasChallenge("geo", 11) },
        },
    },
})

// --- geo's map helpers (the ring the grid renders, and the counters the challenges read) --------
function DED_visitedCount() {
    if (typeof player === "undefined" || !player.geo) return new Decimal(0)
    return new Decimal(Object.keys(player.geo.visited || {}).length)
}

function DED_openGateCount() {
    if (typeof player === "undefined" || !player.geo) return new Decimal(0)
    return new Decimal(Object.keys(player.geo.openGates || {}).length)
}

function DED_gatesOpenedThisRun() {
    if (typeof player === "undefined" || !player.geo) return new Decimal(0)
    return DED_openGateCount().sub(new Decimal(player.geo.runStart || 0)).max(0)
}

function DED_deepestSeen() {
    if (typeof player === "undefined" || !player.geo) return new Decimal(0)
    let best = 0
    let visited = player.geo.visited || {}
    for (var hash in visited) {
        let depth = String(hash).split(",").length
        if (depth > best) best = depth
    }
    return new Decimal(best)
}

// The tiling's own neighbourhood: getNeighborAndDir(current, edge, true) for edge 0..5 in {6,4}.
function GEO_ring() {
    let out = []
    let here = { hash: "", type: 0, name: L("脚下", "here"), steppable: false, short: "" }
    out.push(here)
    if (!DED_boot()) { while (out.length < 15) out.push({ hash: "", type: 1, steppable: false }); return out }
    let atlas = DED_atlas(), current = DED.world.currentTile
    if (!atlas || !current || !atlas.getNeighborAndDir) { while (out.length < 15) out.push({ hash: "", type: 1, steppable: false }); return out }
    let wide = hasUpgrade("geo", 32) ? 14 : 6
    wide += Math.floor(getBuyableAmount("geo", 12).toNumber()) * 2
    let seenHashes = {}
    for (let edge = 0; edge < 6 && out.length - 1 < wide; edge++) {
        let res = null
        try { res = atlas.getNeighborAndDir(current, edge, true) } catch (e) { res = null }
        let hash = res ? DED_hashOf(res[0]) : ""
        if (!hash) continue
        seenHashes[hash] = true
        out.push(GEO_ringEntry(hash))
    }
    let anchors = Math.floor(getBuyableAmount("geo", 11).toNumber())
    if (anchors > 0) {
        for (let edge = 0; edge < 6 && out.length - 1 < wide; edge++) {
            let res = null
            try { res = atlas.getNeighborAndDir(current, edge, true) } catch (e) { res = null }
            let mid = res ? res[0] : null
            if (!mid) continue
            for (let e2 = 0; e2 < 6 && out.length - 1 < wide; e2++) {
                let r2 = null
                try { r2 = atlas.getNeighborAndDir(mid, e2, true) } catch (e) { r2 = null }
                let hash = r2 ? DED_hashOf(r2[0]) : ""
                if (!hash || seenHashes[hash]) continue
                seenHashes[hash] = true
                out.push(GEO_ringEntry(hash))
            }
        }
    }
    while (out.length < 15) out.push({ hash: "", type: 1, steppable: false, short: "·" })
    return out
}

function GEO_ringEntry(hash) {
    let tile = DED_blockAt(hash)
    let type = tile ? tile.type : 0
    let steppable = true
    if (type === 1) steppable = false
    if (type === 2 && !DED_gateOpen(hash)) steppable = false
    return {
        hash: hash,
        type: type,
        name: tile && tile.name ? tile.name : "",
        text: tile ? tile.text : "",
        short: hash.length > 10 ? hash.slice(-8) : hash,
        steppable: steppable,
    }
}

function GEO_currentTilePanel() {
    let tile = DED_currentBlock()
    let head = "<div style='max-width:720px;margin:0 auto;text-align:left'>"
    head += "<b>" + L("所在：", "standing at: ") + DED_tileLabel() + "</b>"
    if (!tile) return head + "<div style='opacity:.6'>" + L("此格没有登记内容。", "this tile carries no note.") + "</div></div>"
    head += "<div style='opacity:.8'>" + (TRC(tile.text || "") || L("无文字。", "no text.")) + "</div>"
    head += "<div style='opacity:.6;font-size:13px'>" + DED_blockTypeName(tile.type) +
        (tile.type === 2 && !DED_gateOpen(DED_currentHash()) ? " · " + fmtDed(DED_gatePrice(DED_currentHash())) : "") + "</div>"
    return head + "</div>" + DED_notesRender()
}

function GEO_ringTable() {
    let ring = GEO_ring()
    let out = "<div style='font-family:Consolas,monospace;text-align:left;max-width:760px;margin:0 auto;font-size:13px'>"
    for (let i = 1; i < ring.length; i++) {
        let t = ring[i]
        if (!t.hash) continue
        out += "<div><span style='opacity:.5'>" + (i) + "</span> " + DED_blockTypeName(t.type) + " " +
            (t.name || t.short) + (t.text ? " · " + TRC(t.text).slice(0, 60) : "") + "</div>"
    }
    return out + "</div>"
}
