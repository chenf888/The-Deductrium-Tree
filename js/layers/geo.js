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
            key: "w", description: L("w：向上（北）一步", "w: step up (north)"),
            onPress() { GEO_hotkey(1) }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "a", description: L("a：向左（西）一步", "a: step left (west)"),
            onPress() { GEO_hotkey(4) }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "s", description: L("s：向下（南）一步", "s: step down (south)"),
            onPress() { GEO_hotkey(3) }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "d", description: L("d：向右（东）一步", "d: step right (east)"),
            onPress() { GEO_hotkey(2) }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "q", description: L("q：向左上（斜）一步", "q: step up-left (diagonal)"),
            onPress() { GEO_hotkey(5) }, unlocked() { return player[this.layer].unlocked },
        },
        {
            key: "e", description: L("e：向右上（斜）一步", "e: step up-right (diagonal)"),
            onPress() { GEO_hotkey(0) }, unlocked() { return player[this.layer].unlocked },
        },
    ],

    tabFormat: [
        ["display-text", function () { return mainLine("geo", 0) }],
        ["display-text", function () { return baseLine("geo") + " · " + L("走过 ", "walked ") + formatWhole(DED_visitedCount()) + L(" 格", " tiles") }],
        ["display-text", function () { return softcapWarning("geo") }],
        "prestige-button",
        "blank",
        ["raw-html", function () { return GEO_currentTilePanel() }],
        ["bar", "toll"],
        ["bar", "reach"],
        ["display-text", function () { return L("点邻格移动（W/A/S/D，斜边 Q/E）。", "Click a neighbour to move (W/A/S/D, Q/E for diagonals).") }],
        "grid",
        ["microtabs", "map"],
        ["blank", "40px"],
    ],

    microtabs: {
        map: {
            "地图": {
                content: [["blank", "15px"], ["raw-html", function () { return GEO_mapLegend() }]],
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

    // The movement pad. TMT fills grid ids row-major as row*100+col, NOT 101,102,… — the old
    // `id - 101` lookup is why rows 2–3 were blank. GEO_PAD fixes the layout explicitly:
    //   row 1:  far    Q      W      E     far
    //   row 2:  far    A      ★      D     far
    //   row 3:  far  legend   S    legend  far
    // Every immediate neighbour is one of the six {6,4} edges; far cells show the distance-2 ring.
    grid: {
        rows: 3,
        cols: 5,
        getStartData(id) { return 0 },
        getUnlocked(id) { return DED_boot() },
        getCanClick(data, id) {
            let c = GEO_padCell(id)
            return !!(c.kind === "dir" && c.entry && c.entry.hash && c.entry.type >= 0 && c.entry.type !== 1)
        },
        getDisplay(data, id) { return GEO_padDisplay(id) },
        getStyle(data, id) { return GEO_padStyle(id) },
        getTooltip(data, id) { return GEO_padTooltip(id) },
        onClick(data, id) {
            let c = GEO_padCell(id)
            if (c.kind === "dir") GEO_tryStep(c.entry)
        },
    },

    bars: {
        toll: {
            direction: RIGHT,
            width: 360,
            height: 28,
            // Only meaningful while standing on a toll tile; otherwise it is a dead bar.
            unlocked() {
                let tile = DED_currentBlock()
                return !!(tile && (tile.type === 2 || tile.type === 4))
            },
            display() {
                let tile = DED_currentBlock()
                if (!tile || (tile.type !== 2 && tile.type !== 4)) return L("脚下不是闸门", "no gate underfoot")
                if (DED_gateOpen(DED_currentHash())) return L("此处的闸已开", "this toll is already open")
                let price = DED_gatePrice(DED_currentHash())
                return fmtDed(player.points) + " / " + fmtDed(price) + L(" 开此闸", " to open this gate")
            },
            progress() {
                let tile = DED_currentBlock()
                if (!tile || (tile.type !== 2 && tile.type !== 4)) return 1
                if (DED_gateOpen(DED_currentHash())) return 1
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

    challenges: {
        11: {
            name: function () { return L("只走一步", "One Step Only") },
            challengeDescription() {
                return L("邻域视图收成一格：只能靠按键和脚下这一格推理。",
                    "The neighbourhood shrinks to a single tile: only the keys and whatever is underfoot.") +
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

// --- movement pad ------------------------------------------------------------------------------
// Edge numbers are the tiling's own (getNeighborAndDir), not geography: the original rotated its
// camera by dragging, so the port fixes one six-way layout and draws it. q/e are the two edges
// WASD never reached.
var GEO_EDGE_KEY = { 5: "q", 1: "w", 0: "e", 4: "a", 3: "s", 2: "d" }
var GEO_PAD = {
    102: { edge: 5 }, 103: { edge: 1 }, 104: { edge: 0 },
    202: { edge: 4 }, 203: { here: true }, 204: { edge: 2 },
    303: { edge: 3 },
    101: { far: 0 }, 105: { far: 1 }, 201: { far: 2 }, 205: { far: 3 }, 301: { far: 4 }, 305: { far: 5 },
    302: { legend: "click" }, 304: { legend: "diag" },
}

function GEO_neighbor(edge) {
    if (!DED_boot()) return null
    let atlas = DED_atlas()
    if (!atlas || !atlas.getNeighborAndDir || !DED.world) return null
    let res = null
    try { res = atlas.getNeighborAndDir(DED.world.currentTile, edge, true) } catch (e) { return null }
    let hash = res ? DED_hashOf(res[0]) : ""
    if (!hash) return null
    let entry = GEO_ringEntry(hash)
    entry.edge = edge
    entry.key = GEO_EDGE_KEY[edge] || "?"
    if ((entry.type === 2 || entry.type === 4) && !DED_gateOpen(hash)) entry.price = DED_gatePrice(hash)
    return entry
}

var GEO_farCache = { key: null, list: [] }
function GEO_farList() {
    let anchors = Math.floor(getBuyableAmount("geo", 11).toNumber())
    if (anchors <= 0 || !DED_boot()) return []
    let key = DED_currentHash() + "|" + hasUpgrade("geo", 32) + "|" + anchors +
        "|" + Object.keys(player.geo.openGates || {}).length + "|" + Object.keys(player.geo.taken || {}).length
    if (GEO_farCache.key === key) return GEO_farCache.list
    let atlas = DED_atlas(), current = DED.world.currentTile, out = []
    if (!atlas || !atlas.getNeighborAndDir) return []
    let seen = {}
    for (let edge = 0; edge < 6; edge++) {
        let res = null
        try { res = atlas.getNeighborAndDir(current, edge, true) } catch (e) { res = null }
        let hash = res ? DED_hashOf(res[0]) : ""
        if (hash) seen[hash] = true
    }
    let wide = hasUpgrade("geo", 32) ? 12 : 6
    for (let edge = 0; edge < 6 && out.length < wide; edge++) {
        let res = null
        try { res = atlas.getNeighborAndDir(current, edge, true) } catch (e) { res = null }
        let mid = res ? res[0] : null
        if (!mid) continue
        for (let e2 = 0; e2 < 6 && out.length < wide; e2++) {
            let r2 = null
            try { r2 = atlas.getNeighborAndDir(mid, e2, true) } catch (e) { r2 = null }
            let hash = r2 ? DED_hashOf(r2[0]) : ""
            if (!hash || seen[hash]) continue
            seen[hash] = true
            out.push(GEO_ringEntry(hash))
        }
    }
    GEO_farCache = { key: key, list: out }
    return out
}

function GEO_ringEntry(hash) {
    let tile = DED_blockAt(hash)
    // -1 = the tiling has a neighbour here, but the 2096-tile map does not. Reporting it as
    // "road" made cells look walkable while HWorld.hitTest() refused them.
    let type = tile ? tile.type : -1
    let steppable = type >= 0
    if (type === 1 || type === -1) steppable = false
    return {
        hash: hash,
        type: type,
        exists: !!tile,
        name: tile && tile.name ? tile.name : "",
        text: tile ? tile.text : "",
        short: hash.length > 10 ? hash.slice(-8) : hash,
        steppable: steppable,
    }
}

function GEO_typeGlyph(type) {
    if (Number(type) < 0) return "?"
    return [L("路", "Rd"), L("墙", "Wl"), L("闸", "Gt"), L("奖", "Rw"), L("序", "Or")][Math.max(0, Math.min(4, Number(type) || 0))]
}

function GEO_padCell(id) {
    let def = GEO_PAD[id]
    if (!def) return { kind: "blank" }
    if (def.here) return { kind: "here" }
    if (def.legend) return { kind: "legend", legend: def.legend }
    // Challenge 11 is "one step only": the pad hides the neighbourhood, leaving the keys blind.
    if ((def.edge !== undefined || def.far !== undefined) && typeof inChallenge === "function" && inChallenge("geo", 11))
        return { kind: "blank" }
    if (def.edge !== undefined) {
        let entry = GEO_neighbor(def.edge)
        return entry ? { kind: "dir", entry: entry } : { kind: "blank" }
    }
    if (def.far !== undefined) {
        let t = GEO_farList()[def.far]
        return t ? { kind: "far", entry: t } : { kind: "blank" }
    }
    return { kind: "blank" }
}

function GEO_padDisplay(id) {
    let c = GEO_padCell(id)
    if (c.kind === "here")
        return "<div style='font-size:22px'>★</div><div style='font-size:11px;opacity:.95'>" + L("你在这", "here") + "</div>"
    if (c.kind === "legend")
        return "<div style='font-size:9px;opacity:.6;line-height:1.3'>" +
            (c.legend === "diag" ? L("Q/E<br>斜边", "Q/E<br>diagonals") : L("点格<br>或按键", "click a<br>tile or key")) + "</div>"
    if (c.kind === "far")
        return "<div style='font-size:14px;opacity:.55'>" + GEO_typeGlyph(c.entry.type) +
            "</div><div style='font-size:9px;opacity:.45'>" + L("两格外", "2 away") + "</div>"
    if (c.kind === "dir") {
        let e = c.entry
        let out = "<div style='font-size:16px'>" + GEO_typeGlyph(e.type) + "</div>" +
            "<div style='font-size:11px;opacity:.9'>" + e.key.toUpperCase() + "</div>"
        if (e.price) out += "<div style='font-size:9px;color:#f0d060'>" + fmtDed(e.price) + "</div>"
        return out
    }
    return ""
}

function GEO_padStyle(id) {
    let c = GEO_padCell(id)
    if (c.kind === "here")
        return { "background-color": "#0f5f57", "border": "2px solid #9ef2e5", "box-shadow": "0 0 14px #41BEB1" }
    if (c.kind === "far") return { "background-color": "#12161a", "opacity": .8 }
    if (c.kind === "legend" || c.kind === "blank")
        return { "background-color": "transparent", "border": "1px dashed rgba(255,255,255,0.08)", "box-shadow": "none" }
    if (c.kind !== "dir") return { "background-color": "#12161a" }
    let e = c.entry, colors = ["#2b3138", "#3a1616", "#6b5a1e", "#1f4a2b", "#3a1f5e"]
    if (e.type < 0) return { "background-color": "#0e1013", opacity: .45, border: "1px dashed rgba(255,255,255,0.12)" }
    let style = { "background-color": colors[Math.max(0, Math.min(4, e.type))] }
    if (e.type === 1) { style.opacity = .55; style.border = "1px solid #5a2020" }
    else if (e.type === 2 || e.type === 4) {
        if (!e.price) style.border = "1px solid #4a7a5a"
        else style.border = player.points.gte(e.price) ? "1px solid #f0d060" : "1px solid rgba(240,208,96,0.35)"
    }
    return style
}

function GEO_padTooltip(id) {
    let c = GEO_padCell(id)
    if (c.kind === "here") {
        let tile = DED_currentBlock()
        return "<b>" + L("你在这里", "you are here") + "</b><br>#" + (DED_currentHash() || "root") +
            (tile ? "<br>" + DED_blockTypeName(tile.type) : "") +
            (tile && tile.text ? "<br>" + String(TRC(tile.text)).replace(/\n/g, "<br>") : "")
    }
    if (c.kind === "far") {
        let what = c.entry.type < 0 ? L("地图之外", "outside the map") : DED_blockTypeName(c.entry.type)
        return L("两格之外 · ", "two tiles away · ") + what +
            (c.entry.text ? "<br>" + String(TRC(c.entry.text)).replace(/\n/g, "<br>") : "")
    }
    if (c.kind !== "dir") return ""
    let e = c.entry
    if (e.type < 0) return "<b>" + e.key.toUpperCase() + "</b><br>" + L("地图之外：这里没有登记格子。", "outside the map: no tile is registered here.")
    let txt = "<b>" + e.key.toUpperCase() + " · " + DED_blockTypeName(e.type) + "</b>"
    if (e.type === 2 || e.type === 4) {
        if (!DED_gateOpen(e.hash)) txt += "<br>" + L("需要 ", "needs ") + fmtDed(DED_gatePrice(e.hash))
        else txt += "<br>" + L("已通过", "already passed")
    }
    if (e.name) txt += "<br>" + e.name
    if (e.text) txt += "<br>" + String(TRC(e.text)).replace(/\n/g, "<br>")
    return txt
}

function GEO_hotkey(edge) {
    if (typeof player === "undefined" || !player.geo || !player.geo.unlocked) return
    GEO_tryStep(GEO_neighbor(edge))
}

function GEO_tryStep(entry) {
    if (!entry || !entry.hash) { DED_note(L("那个方向没有格子。", "no tile that way."), "map"); return }
    if (entry.type < 0) { DED_note(L("那个方向是地图之外。", "that way is outside the map."), "map"); return }
    if (entry.type === 1) { DED_note(L("那个方向是墙。", "that way is a wall."), "map"); return }
    let ok = DED_stepTo(entry.hash, DED_currentHash())
    if (ok) { DED_note(L("移动到 ", "moved to ") + DED_tileLabel(), "map"); return }
    // A toll tile explains itself through DED_handleGate ("not enough Deductriums: needs …").
    if (!entry.price) DED_note(L("无法通过。", "cannot pass."), "map")
}

function GEO_currentTilePanel() {
    let hash = DED_currentHash()
    let tile = DED_currentBlock()
    let ord = player.geo && player.geo.ordinals ? player.geo.ordinals[DED_hashKey(hash)] : null
    let label = DED_tileLabel(), hashLabel = hash || "root"
    let html = "<div class='tmt-left' style='max-width:760px;margin:0 auto;padding:10px 14px;border-radius:10px;background:#10232b;border:1px solid #2c6b74'>"
    html += "<div><span style='font-size:18px'>📍</span> <b style='color:#9ef2e5;letter-spacing:.5px'>" + L("当前位置", "YOU ARE HERE") + "</b> "
    html += "<span style='font-family:Consolas,monospace;color:#e6f7f5'>" + label + "</span>"
    if (label !== hashLabel) html += "<span style='opacity:.5;font-family:Consolas,monospace;font-size:12px'> #" + hashLabel + "</span>"
    if (tile && tile.type === 4 && ord) html += " <span style='opacity:.8'>· " + L("序数 ω^", "ordinal ω^") + ord + "</span>"
    else if (tile) html += " <span style='opacity:.8'>· " + DED_blockTypeName(tile.type) + "</span>"
    html += "</div>"
    html += "<div style='opacity:.7;font-size:13px'>" + L("已走 ", "walked ") + formatWhole(DED_visitedCount()) + L(" 格", " tiles") +
        " · " + L("已开闸 ", "gates opened ") + formatWhole(DED_openGateCount()) + "</div>"
    if (tile && tile.text)
        html += "<div style='opacity:.85;font-size:13px;margin-top:4px;white-space:pre-line'>" + TRC(tile.text) + "</div>"
    return html + "</div>" + DED_notesRender("map")
}

function GEO_mapLegend() {
    let rows = [
        [GEO_typeGlyph(0), DED_blockTypeName(0), "#2b3138", L("可以直接走进去", "walk straight in")],
        [GEO_typeGlyph(1), DED_blockTypeName(1), "#3a1616", L("走不过去", "cannot pass")],
        [GEO_typeGlyph(2), DED_blockTypeName(2), "#6b5a1e", L("点击付推理素，开门后通过", "click to pay Deductriums, then pass")],
        [GEO_typeGlyph(3), DED_blockTypeName(3), "#1f4a2b", L("走上去自动拾取", "step on it to collect")],
        [GEO_typeGlyph(4), DED_blockTypeName(4), "#3a1f5e", L("记录此处的序数", "records the ordinal here")],
    ]
    let html = "<div class='tmt-left' style='max-width:760px;margin:0 auto;font-size:13px'>"
    html += "<div style='opacity:.8;margin-bottom:6px'>" + L("中间的 ★ 是你，六个方向各有一格；格子上写着该方向的按键。", "The ★ in the middle is you; each of the six directions has one tile, labelled with its key.") + "</div>"
    html += "<table style='border-collapse:collapse'>"
    for (let i = 0; i < rows.length; i++) {
        html += "<tr><td style='padding:2px 10px 2px 0'><span style='display:inline-block;min-width:26px;text-align:center;padding:1px 5px;border-radius:4px;background:" + rows[i][2] + "'>" + rows[i][0] + "</span></td>" +
            "<td style='padding:2px 10px;font-weight:bold'>" + rows[i][1] + "</td><td style='padding:2px 0;opacity:.75'>" + rows[i][3] + "</td></tr>"
    }
    html += "</table>"
    html += "<div style='opacity:.65;margin-top:6px'>" + L("按键：W/A/S/D 走四边，Q/E 走两条斜边；也可以直接点邻格。原版靠拖动旋转视角，这里把它固定成这张盘。", "Keys: W/A/S/D for four edges, Q/E for the two diagonals; or click a neighbour. The original rotated the camera by dragging; this port fixes that into one pad.") + "</div>"
    if (GEO_farList().length)
        html += "<div style='opacity:.65'>" + L("两侧的深色格显示两格之外的格子（要先走到邻格才走得过去）。", "The dark cells on the sides show tiles two steps away (walk to a neighbour first).") + "</div>"
    return html + "</div>"
}
