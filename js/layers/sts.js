// sts — Statistics 统计. A row:"side" layer: no prestige, no doReset (side layers are never
// auto-reset), no type field (side layers default to "none"). This is the ONLY one of the four
// files allowed to read DED — display-only, guarded, never inside an economy formula.
addLayer("sts", {
    name: "Statistics 统计",
    symbol: "S",
    color: "#C0C0C0",
    resource: "statistics",
    row: "side",
    position: 0,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
        }
    },

    layerShown() { return player.ded.unlocked },

    tabFormat: [
        ["display-text", function () { return "<h2 style=\"color:#C0C0C0\">" + L("统计", "Statistics") + "</h2>" }],
        ["raw-html", function () {
            if (!player.ded) return ""
            let rows = [
                [L("推理素（当前）", "Deductriums (now)"), fmtDed(player.points)],
                [L("推理素（累计）", "Deductriums (lifetime)"), fmtDed(player.totalDeductriums)],
                [L("已证定理（累计）", "Theorems proved (lifetime)"), formatWhole(player.theoremsProved)],
                [L("已证定理（本局）", "Theorems proved (this run)"), formatWhole(player.ded.proved)],
                [L("已拆闸", "Gates destructed"), formatWhole(player.gatesDestructed)],
                [L("走过的格", "Tiles seen"), formatWhole(player.tilesSeen)],
                [L("序数", "Ordinals"), formatWhole(player.ord.points) + " / " + TUNING.caps.ord],
                [L("成就收集", "Achievements collected"), formatWhole(DED_achievementCount())],
            ]
            let html = "<table style=\"border-collapse:collapse;color:#cfd8dc;font-size:16px\">"
            for (let i = 0; i < rows.length; i++) {
                html += "<tr><td style=\"padding:3px 18px 3px 0;text-align:left\">" + rows[i][0] +
                    "</td><td style=\"padding:3px 0;text-align:right;font-weight:bold\">" + rows[i][1] + "</td></tr>"
            }
            return html + "</table>"
        }],
        ["display-text", function () {
            if (!player.fol) return ""
            let ax = ["fol", "pea", "zfc", "num", "hott"]
            let out = L("已采纳公理：", "Axioms adopted: ")
            for (let i = 0; i < ax.length; i++) {
                out += L(ax[ax.length - 1] === ax[i] ? "" : "，", ", ") + layers[ax[i]].name + " " +
                    formatWhole(player[ax[i]].points) + "/" + tunCap(ax[i])
            }
            return out
        }],
        ["display-text", function () {
            if (typeof DED === "undefined" || !DED.world) return L("内核未载入：地图统计不可用。", "Kernel not loaded: map statistics unavailable.")
            let tile = DED_currentBlock()
            if (!tile) return L("当前格：（尚无定位）", "Current tile: (no position yet)")
            return L("当前格：", "Current tile: ") + DED_tileLabel() +
                (tile.text ? " · " + TRC(tile.text) : "")
        }],
        ["infobox", function () {
            return "<h3>" + L("度量衡单位", "Metric Units") + "</h3><br>" +
                L("推理素沿袭原版的度量衡读数：µg / mg / g / kg / T 依次等于 1 / 1000 / 1e6 / 1e9 / 1e12。",
                    "Deductriums keep the original's metric readout: µg / mg / g / kg / T stand for 1 / 1000 / 1e6 / 1e9 / 1e12 in turn.") +
                "<br>" +
                L("树里的每一行都坐在一个前缀上：第一行是 mg，第二行 g，第三行 kg，第四行 T。你走过的门槛，正是这张表上的一次跳位。",
                    "Each row of the tree sits on one prefix: row 1 is mg, row 2 g, row 3 kg, row 4 T. Every gate you pass is a single step up this table.")
        }],
        ["raw-html", function () { return DED_langButton() }],
    ],
})
