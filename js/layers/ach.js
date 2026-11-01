// The Deductrium Tree — side layer `ach`: the original Deductrium achievement set, ported.
// Every entry is the original's own achievement string (src/game.ts achievementsTable + the
// finishAchievement call sites) kept verbatim in Chinese; done() reads the ported state only.

// An achievement that backfills content returns { grantUpgrade: [layer, id] } or
// { grantMilestone: [layer, id] } from effect(); everything else returns the ×1.05 that
// getPointGen already pays out once per earned achievement (TUNING.achMult).
function ACH_backfill() {
    if (typeof player === "undefined" || !player.ach || typeof layers === "undefined" || !layers.ach) return
    var earned = player.ach.achievements || []
    for (var i = 0; i < earned.length; i++) {
        var ach = layers.ach.achievements[earned[i]]
        if (!ach || typeof ach.effect !== "function") continue
        var grant = ach.effect()
        if (!grant || !grant.grantUpgrade && !grant.grantMilestone) continue
        if (grant.grantUpgrade) {
            var up = grant.grantUpgrade
            if (player[up[0]] && player[up[0]].upgrades && !hasUpgrade(up[0], up[1])) player[up[0]].upgrades.push(up[1])
        }
        if (grant.grantMilestone) {
            var ms = grant.grantMilestone
            if (player[ms[0]] && player[ms[0]].milestones && !hasMilestone(ms[0], ms[1])) player[ms[0]].milestones.push(ms[1])
        }
    }
}

var ACH_TOTAL = 81

addLayer("ach", {
    name: "成就",
    symbol: "A",
    color: "#F7CA18",
    resource: L("个成就", "achievements"),
    row: "side",
    startData() { return { unlocked: true, points: new Decimal(0) } },
    tabFormat: [["display-text", function() { return L("已收集 ", "Collected ") + player.ach.achievements.length + " / " + ACH_TOTAL + L(" 个成就", " achievements") }], "blank", "achievements"],

    update(diff) {
        // Repair saves written before the stoRecord fix: "Uncountable" was awarded from chapters
        // recorded during rendering, before their unlock gate had been tested.
        if (stoChapterCount() >= 4) return
        let earned = player.ach.achievements || []
        for (let i = earned.length - 1; i >= 0; i--) {
            if (Number(earned[i]) === 96) earned.splice(i, 1)
        }
    },

    achievements: {
        // --- the opening six: the original's first unlocked row -------------------------------
        11: {
            name: function() { return L("解锁了成就", "Achievement Unlocked") },
            tooltip: function() { return L("完成第一次推理。奖励：全部收入 ×1.05。", "Make your first deduction. Reward: all production ×1.05.") },
            done() { return hasUpgrade("ded", 11) },
            effect() { return new Decimal(1.05) }
        },
        12: {
            name: function() { return L("我推出我", "I Proved Me") },
            tooltip: function() { return L("推出第一条定理。奖励：全部收入 ×1.05。", "Prove your first theorem. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        13: {
            name: function() { return L("收费站拆除", "Crash Toll Gate") },
            tooltip: function() { return L("拆掉第一道闸门。奖励：全部收入 ×1.05。", "Destruct your first gate. Reward: all production ×1.05.") },
            done() { return player.gatesDestructed.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        14: {
            name: function() { return L("你推出你，他推出他（⊢$0>$0）", "You Proved you, He Proved Him (⊢$0>$0)") },
            tooltip: function() { return L("累计推出 10 条定理。奖励：全部收入 ×1.05。", "Prove 10 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(10) },
            effect() { return new Decimal(1.05) }
        },
        // port: the original's "hyp" tile hands out hypotheses; the live workspace rows are their stand-in
        15: {
            name: function() { return L("If I were..", "If I were..") },
            tooltip: function() { return L("定理表里同时挂着 3 条命题。奖励：全部收入 ×1.05。", "Keep 3 propositions in the theorem table at once. Reward: all production ×1.05.") },
            done() { return (player.ded.table || []).length >= 3 },
            effect() { return new Decimal(1.05) }
        },
        16: {
            name: function() { return L("会跑的“⊢”（演绎元定理）", "Running '⊢' (Deduction Metatheorem)") },
            tooltip: function() { return L("买入第一条元规则。奖励：直接取得「元规则」的首条升级，另加全部收入 ×1.05。", "Buy your first metarule. Reward: the metarule layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.meta.points.gte(1) },
            effect() { if (!hasUpgrade("meta", 11)) return { grantUpgrade: ["meta", 11] }; return {} }
        },
        // --- denial, explosion, the first currency steps --------------------------------------
        17: {
            name: function() { return L("吃素啦", "Gather Deductrium") },
            tooltip: function() { return L("累计获得 20µg 推理素。奖励：全部收入 ×1.05。", "Accumulate 20µg of Deductriums. Reward: all production ×1.05.") },
            done() { return player.totalDeductriums.gte(20) },
            effect() { return new Decimal(1.05) }
        },
        // port: the original's `consumed` readout is exactly the gap between lifetime and current 推理素
        18: {
            name: function() { return L("第一次消费", "First Consume") },
            tooltip: function() { return L("第一次把推理素花掉（交闸门费）。奖励：全部收入 ×1.05。", "Spend Deductriums for the first time (a gate toll). Reward: all production ×1.05.") },
            done() { return player.points.lt(player.totalDeductriums) },
            effect() { return new Decimal(1.05) }
        },
        19: {
            name: function() { return L("敢于说不", "The Courage to Deny") },
            tooltip: function() { return L("采纳第一条命题公理。奖励：全部收入 ×1.05。", "Adopt your first propositional axiom. Reward: all production ×1.05.") },
            done() { return player.fol.points.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        21: {
            name: function() { return L("负负得正", "Double Negation Elimination") },
            tooltip: function() { return L("采纳 2 条命题公理。奖励：全部收入 ×1.05。", "Adopt 2 propositional axioms. Reward: all production ×1.05.") },
            done() { return player.fol.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        22: {
            name: function() { return L("否定爆炸", "Explosion Principle (exfalso)") },
            tooltip: function() { return L("累计推出 30 条定理。奖励：全部收入 ×1.05。", "Prove 30 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(30) },
            effect() { return new Decimal(1.05) }
        },
        23: {
            name: function() { return L("我推出你，你推出我（<>）", "I Proved You, You Proved Me (<>)") },
            tooltip: function() { return L("采纳 3 条命题公理。奖励：全部收入 ×1.05。", "Adopt 3 propositional axioms. Reward: all production ×1.05.") },
            done() { return player.fol.points.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        24: {
            name: function() { return L("素食主义者（累计获40µg推理素）", "Deductriumist (Accumulated 40µg of Deductrium)") },
            tooltip: function() { return L("累计获得 40µg 推理素。奖励：全部收入 ×1.05。", "Accumulate 40µg of Deductriums. Reward: all production ×1.05.") },
            done() { return player.totalDeductriums.gte(40) },
            effect() { return new Decimal(1.05) }
        },
        25: {
            name: function() { return L("逻辑门（与/或）", "Logic Gates (AND/OR)") },
            tooltip: function() { return L("字面量层首次进账。奖励：直接取得「字面量」的首条升级，另加全部收入 ×1.05。", "Prestige the literal layer once. Reward: the literal layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.lit.points.gte(1) },
            effect() { if (!hasUpgrade("lit", 11)) return { grantUpgrade: ["lit", 11] }; return {} }
        },
        26: {
            name: function() { return L("排中律是真的！(p|~p)", "LEM is True! (p|~p)") },
            tooltip: function() { return L("采纳 4 条命题公理。奖励：全部收入 ×1.05。", "Adopt 4 propositional axioms. Reward: all production ×1.05.") },
            done() { return player.fol.points.gte(4) },
            effect() { return new Decimal(1.05) }
        },
        27: {
            name: function() { return L("皮尔士定律((p>q)>p)>p", "Peirce's Law ((p>q)>p)>p") },
            tooltip: function() { return L("采纳满 5 条命题公理。奖励：全部收入 ×1.05。", "Adopt all 5 propositional axioms. Reward: all production ×1.05.") },
            done() { return player.fol.points.gte(5) },
            effect() { return new Decimal(1.05) }
        },
        // port: mcpt is the propositional auto-reasoner; the metarule shop's second milestone is its twin
        28: {
            name: function() { return L("命题逻辑自动推理", "Automated Propositional Reasoning") },
            tooltip: function() { return L("达成「元规则」的第二条里程碑。奖励：全部收入 ×1.05。", "Reach the metarule layer's second milestone. Reward: all production ×1.05.") },
            done() { return hasMilestone("meta", 2) },
            effect() { return new Decimal(1.05) }
        },
        29: {
            name: function() { return L("一阶逻辑", "1st-Order Logic") },
            tooltip: function() { return L("采纳第一条谓词公理。奖励：全部收入 ×1.05。", "Adopt your first predicate axiom. Reward: all production ×1.05.") },
            done() { return player.pea.points.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        // --- quantifiers, substitution, the first gift package ---------------------------------
        31: {
            name: function() { return L("约束与自由", "Bound and Free Variables") },
            tooltip: function() { return L("采纳 2 条谓词公理。奖励：全部收入 ×1.05。", "Adopt 2 predicate axioms. Reward: all production ×1.05.") },
            done() { return player.pea.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        32: {
            name: function() { return L("丢掉量词，尽情替换！", "Drop Quantifiers, Replace Freely!") },
            tooltip: function() { return L("宏层首次进账，再叠两层。奖励：全部收入 ×1.05。", "Reach the macro layer's second floor. Reward: all production ×1.05.") },
            done() { return player.mac.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        33: {
            name: function() { return L("众生平等", "Equality for All") },
            tooltip: function() { return L("买下「谓词公理」的首条升级。奖励：全部收入 ×1.05。", "Own the predicate layer's first upgrade. Reward: all production ×1.05.") },
            done() { return hasUpgrade("pea", 11) },
            effect() { return new Decimal(1.05) }
        },
        34: {
            name: function() { return L("概括一切（概括元定理）", "Generalize Everything (Metatheorem)") },
            tooltip: function() { return L("元规则买到第 3 条。奖励：全部收入 ×1.05。", "Own 3 metarules. Reward: all production ×1.05.") },
            done() { return player.meta.points.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        35: {
            name: function() { return L("命题逻辑大礼包", "Propositional Logic Toolkit") },
            tooltip: function() { return L("累计 150 条定理，并握有 2 条元规则。奖励：直接取得「命题公理」的首条升级，另加全部收入 ×1.05。", "Prove 150 theorems and own 2 metarules. Reward: the propositional layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.theoremsProved.gte(150) && player.meta.points.gte(2) },
            effect() { if (!hasUpgrade("fol", 11)) return { grantUpgrade: ["fol", 11] }; return {} }
        },
        36: {
            name: function() { return L("替换一切（互推替换元定理）", "Replace Everything (IFF Metatheorem)") },
            tooltip: function() { return L("元规则买到第 5 条。奖励：全部收入 ×1.05。", "Own 5 metarules. Reward: all production ×1.05.") },
            done() { return player.meta.points.gte(5) },
            effect() { return new Decimal(1.05) }
        },
        // port: the original cedes quantifier *territory* on the map; tile families secured stands in
        37: {
            name: function() { return L("割让量词的领土", "Quantifier Relinquishment") },
            tooltip: function() { return L("格位层保住 5 族格位。奖励：全部收入 ×1.05。", "Secure 5 tile families. Reward: all production ×1.05.") },
            done() { return player.geo.points.gte(5) },
            effect() { return new Decimal(1.05) }
        },
        38: {
            name: function() { return L("一阶逻辑大礼包", "1st-Order Logic Toolkit") },
            tooltip: function() { return L("采纳满 5 条谓词公理。奖励：直接取得「谓词公理」的首条升级，另加全部收入 ×1.05。", "Adopt all 5 predicate axioms. Reward: the predicate layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.pea.points.gte(5) },
            effect() { if (!hasUpgrade("pea", 11)) return { grantUpgrade: ["pea", 11] }; return {} }
        },
        39: {
            name: function() { return L("加大剂量（累计获1mg推理素）", "Dose Increased (Accumulated 1mg of Deductrium)") },
            tooltip: function() { return L("累计获得 1mg 推理素。奖励：全部收入 ×1.05。", "Accumulate 1mg of Deductriums. Reward: all production ×1.05.") },
            done() { return player.totalDeductriums.gte(1e3) },
            effect() { return new Decimal(1.05) }
        },
        // --- Peano and arithmetic ---------------------------------------------------------------
        41: {
            name: function() { return L("皮亚诺公理", "Peano Axioms") },
            tooltip: function() { return L("采纳第一条数论公理。奖励：直接取得「数论」的一条升级，另加全部收入 ×1.05。", "Adopt your first numeral axiom. Reward: a numeral layer upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.num.points.gte(1) },
            effect() { if (!hasUpgrade("num", 12)) return { grantUpgrade: ["num", 12] }; return {} }
        },
        42: {
            name: function() { return L("1+1=2", "1+1=2") },
            tooltip: function() { return L("累计推出 250 条定理。奖励：全部收入 ×1.05。", "Prove 250 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(250) },
            effect() { return new Decimal(1.05) }
        },
        43: {
            name: function() { return L("2*2=4", "2×2=4") },
            tooltip: function() { return L("采纳 2 条数论公理。奖励：全部收入 ×1.05。", "Adopt 2 numeral axioms. Reward: all production ×1.05.") },
            done() { return player.num.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        44: {
            name: function() { return L("加法交换律", "Commutativity of Addition") },
            tooltip: function() { return L("达成「数论」的第三条里程碑。奖励：全部收入 ×1.05。", "Reach the numeral layer's third milestone. Reward: all production ×1.05.") },
            done() { return hasMilestone("num", 3) },
            effect() { return new Decimal(1.05) }
        },
        45: {
            name: function() { return L("乘法分配率", "Distributivity of Multiplication") },
            tooltip: function() { return L("采纳满 4 条数论公理。奖励：全部收入 ×1.05。", "Adopt all 4 numeral axioms. Reward: all production ×1.05.") },
            done() { return player.num.points.gte(4) },
            effect() { return new Decimal(1.05) }
        },
        46: {
            name: function() { return L("致死剂量（累计获1g推理素）", "Lethal Dose (Accumulated 1g of Deductrium)") },
            tooltip: function() { return L("累计获得 1g 推理素。奖励：全部收入 ×1.05。", "Accumulate 1g of Deductriums. Reward: all production ×1.05.") },
            done() { return player.totalDeductriums.gte(1e6) },
            effect() { return new Decimal(1.05) }
        },
        // port: the ordering rule is bought with literal budget, so three units of lit.b11 stands in
        47: {
            name: function() { return L("3小于4", "3 is Less Than 4") },
            tooltip: function() { return L("字面量预算买到 3 级。奖励：全部收入 ×1.05。", "Buy the literal generator to level 3. Reward: all production ×1.05.") },
            done() { return (getBuyableAmount("lit", 11) || new Decimal(0)).gte(3) },
            effect() { return new Decimal(1.05) }
        },
        48: {
            name: function() { return L("5不整除6", "5 Does Not Divide 6") },
            tooltip: function() { return L("累计推出 400 条定理。奖励：全部收入 ×1.05。", "Prove 400 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(400) },
            effect() { return new Decimal(1.05) }
        },
        49: {
            name: function() { return L("解锁素数", "Prime Number Unlocked") },
            tooltip: function() { return L("累计推出 600 条定理。奖励：全部收入 ×1.05。", "Prove 600 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(600) },
            effect() { return new Decimal(1.05) }
        },
        // --- the type layer opens ---------------------------------------------------------------
        51: {
            name: function() { return L("任何数都有阶乘", "Factorials for All Numbers") },
            tooltip: function() { return L("累计推出 900 条定理。奖励：全部收入 ×1.05。", "Prove 900 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(900) },
            effect() { return new Decimal(1.05) }
        },
        // port: the original walks the prime tiles forever; 256 tiles is its own pre-ordinal threshold
        52: {
            name: function() { return L("质数有无穷个", "Infinitely Many Primes") },
            tooltip: function() { return L("走过 256 块格位。奖励：全部收入 ×1.05。", "Walk 256 tiles. Reward: all production ×1.05.") },
            done() { return player.tilesSeen.gte(256) },
            effect() { return new Decimal(1.05) }
        },
        53: {
            name: function() { return L("类型论", "Type Theory") },
            tooltip: function() { return L("类型层首次进账。奖励：直接取得「类型」的首条升级，另加全部收入 ×1.05。", "Prestige the type layer once. Reward: the type layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.typ.points.gte(1) },
            effect() { if (!hasUpgrade("typ", 11)) return { grantUpgrade: ["typ", 11] }; return {} }
        },
        54: {
            name: function() { return L("真理之门", "Gate of Truth") },
            tooltip: function() { return L("拆掉 3 道闸门。奖励：全部收入 ×1.05。", "Destruct 3 gates. Reward: all production ×1.05.") },
            done() { return player.gatesDestructed.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        55: {
            name: function() { return L("证明助手上线！", "Proof Assistant Hired!") },
            tooltip: function() { return L("类型层最好的一局达到 4 级。奖励：全部收入 ×1.05。", "Reach type level 4 in a single run. Reward: all production ×1.05.") },
            done() { return player.typ.best.gte(4) },
            effect() { return new Decimal(1.05) }
        },
        56: {
            name: function() { return L("相等类型", "Identity Types") },
            tooltip: function() { return L("类型层升到 2 级。奖励：全部收入 ×1.05。", "Raise the type layer to level 2. Reward: all production ×1.05.") },
            done() { return player.typ.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        57: {
            name: function() { return L("自然数的归纳法", "Induction on Natural Numbers") },
            tooltip: function() { return L("类型层升到 3 级。奖励：全部收入 ×1.05。", "Raise the type layer to level 3. Reward: all production ×1.05.") },
            done() { return player.typ.points.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        58: {
            name: function() { return L("True的值都是true", "All Values of True are true") },
            tooltip: function() { return L("解开第一个类型谜题。奖励：全部收入 ×1.05。", "Solve your first type puzzle. Reward: all production ×1.05.") },
            done() { return Object.keys(player.typ.puzzle || {}).length >= 1 },
            effect() { return new Decimal(1.05) }
        },
        59: {
            name: function() { return L("1+1=2类型论版", "1+1=2 in Type Theory") },
            tooltip: function() { return L("累计推出 1400 条定理。奖励：全部收入 ×1.05。", "Prove 1400 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(1400) },
            effect() { return new Decimal(1.05) }
        },
        // --- univalence and the circle ---------------------------------------------------------
        61: {
            name: function() { return L("相等的归纳法", "Induction on Equality") },
            tooltip: function() { return L("解开两个类型谜题。奖励：全部收入 ×1.05。", "Solve 2 type puzzles. Reward: all production ×1.05.") },
            done() { return Object.keys(player.typ.puzzle || {}).length >= 2 },
            effect() { return new Decimal(1.05) }
        },
        62: {
            name: function() { return L("数论达人(5不整除7)", "Number Theory Master (5 Does Not Divide 7)") },
            tooltip: function() { return L("累计推出 1900 条定理。奖励：全部收入 ×1.05。", "Prove 1900 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(1900) },
            effect() { return new Decimal(1.05) }
        },
        63: {
            name: function() { return L("顺时针一圈逆时针一圈，还是回到原点", "CW plus CCW Returns to Origin") },
            tooltip: function() { return L("采纳第一条同伦公理。奖励：全部收入 ×1.05。", "Adopt your first homotopy constructor. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        64: {
            name: function() { return L("我等价我", "I Am Equivalent to Me") },
            tooltip: function() { return L("采纳 2 条同伦公理。奖励：全部收入 ×1.05。", "Adopt 2 homotopy constructors. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        65: {
            name: function() { return L("泛等公理（ua）", "Univalence Axiom (ua)") },
            tooltip: function() { return L("采纳 3 条同伦公理。奖励：全部收入 ×1.05。", "Adopt 3 homotopy constructors. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        66: {
            name: function() { return L("圆圈跟圆点不同伦（loop不是rfl）", "Circle and Point Are Not Homotopic (loop is not rfl)") },
            tooltip: function() { return L("累计推出 2500 条定理。奖励：全部收入 ×1.05。", "Prove 2500 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(2500) },
            effect() { return new Decimal(1.05) }
        },
        67: {
            name: function() { return L("原来皮尔士跟他们是一伙的", "Peirce Is One of Them") },
            tooltip: function() { return L("买下「同伦」的首条升级。奖励：全部收入 ×1.05。", "Own the homotopy layer's first upgrade. Reward: all production ×1.05.") },
            done() { return hasUpgrade("hott", 11) },
            effect() { return new Decimal(1.05) }
        },
        // port: LEM only breaks inside the type layer's challenge, so one completion is the feat
        68: {
            name: function() { return L("排中律是个谎言！？", "LEM Is a Lie!?") },
            tooltip: function() { return L("完成一次「类型」的挑战。奖励：全部收入 ×1.05。", "Complete the type layer's challenge once. Reward: all production ×1.05.") },
            done() { return hasChallenge("typ", 11) },
            effect() { return new Decimal(1.05) }
        },
        69: {
            name: function() { return L("又是偶数", "Even Again") },
            tooltip: function() { return L("类型层升到 6 级。奖励：全部收入 ×1.05。", "Raise the type layer to level 6. Reward: all production ×1.05.") },
            done() { return player.typ.points.gte(6) },
            effect() { return new Decimal(1.05) }
        },
        // --- data types, extensionality, the infinite hotel -------------------------------------
        // port: the original's cons cells are the type layer's generator buyable
        71: {
            name: function() { return L("cons cons cons nil", "cons cons cons nil") },
            tooltip: function() { return L("类型的生成器买到 3 级。奖励：全部收入 ×1.05。", "Buy the type layer's generator to level 3. Reward: all production ×1.05.") },
            done() { return (getBuyableAmount("typ", 11) || new Decimal(0)).gte(3) },
            effect() { return new Decimal(1.05) }
        },
        72: {
            name: function() { return L("类型论版整数", "Integers in Type Theory") },
            tooltip: function() { return L("类型层升到 7 级。奖励：全部收入 ×1.05。", "Raise the type layer to level 7. Reward: all production ×1.05.") },
            done() { return player.typ.points.gte(7) },
            effect() { return new Decimal(1.05) }
        },
        73: {
            name: function() { return L("W自然数", "W-nat") },
            tooltip: function() { return L("采纳 4 条同伦公理。奖励：全部收入 ×1.05。", "Adopt 4 homotopy constructors. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(4) },
            effect() { return new Decimal(1.05) }
        },
        74: {
            name: function() { return L("外延公理(fnext)", "function extensionality axiom (fnext)") },
            tooltip: function() { return L("采纳 5 条同伦公理。奖励：全部收入 ×1.05。", "Adopt 5 homotopy constructors. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(5) },
            effect() { return new Decimal(1.05) }
        },
        75: {
            name: function() { return L("Bool=Bool=Bool", "Bool=Bool=Bool") },
            tooltip: function() { return L("买下「类型」的第二条升级。奖励：全部收入 ×1.05。", "Own the type layer's second upgrade. Reward: all production ×1.05.") },
            done() { return hasUpgrade("typ", 12) },
            effect() { return new Decimal(1.05) }
        },
        76: {
            name: function() { return L("isProp(是双射)", "isProp (is bijective)") },
            tooltip: function() { return L("累计推出 3200 条定理。奖励：全部收入 ×1.05。", "Prove 3200 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(3200) },
            effect() { return new Decimal(1.05) }
        },
        77: {
            name: function() { return L("来了无穷位客人住旅馆", "Infinite number of guests arrive at the hotel") },
            tooltip: function() { return L("走过 1000 块格位。奖励：全部收入 ×1.05。", "Walk 1000 tiles. Reward: all production ×1.05.") },
            done() { return player.tilesSeen.gte(1e3) },
            effect() { return new Decimal(1.05) }
        },
        78: {
            name: function() { return L("排列大师", "Master of permutation") },
            tooltip: function() { return L("达成「宏」的第二条里程碑。奖励：全部收入 ×1.05。", "Reach the macro layer's second milestone. Reward: all production ×1.05.") },
            done() { return hasMilestone("mac", 2) },
            effect() { return new Decimal(1.05) }
        },
        79: {
            name: function() { return L("路径消消乐", "Path Elimination") },
            tooltip: function() { return L("解开三个类型谜题。奖励：全部收入 ×1.05。", "Solve 3 type puzzles. Reward: all production ×1.05.") },
            done() { return Object.keys(player.typ.puzzle || {}).length >= 3 },
            effect() { return new Decimal(1.05) }
        },
        // --- spheres, then ZFC -------------------------------------------------------------------
        81: {
            name: function() { return L("徒手画圆(Sus Bool=S1)", "Drawing a circle freehand (Sus Bool=S1)") },
            tooltip: function() { return L("采纳满 6 条同伦公理。奖励：全部收入 ×1.05。", "Adopt all 6 homotopy constructors. Reward: all production ×1.05.") },
            done() { return player.hott.points.gte(6) },
            effect() { return new Decimal(1.05) }
        },
        82: {
            name: function() { return L("π₁(S¹)=Z", "π₁(S¹)=Z") },
            tooltip: function() { return L("累计推出 4000 条定理。奖励：全部收入 ×1.05。", "Prove 4000 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(4000) },
            effect() { return new Decimal(1.05) }
        },
        83: {
            name: function() { return L("Hopf纤维丛", "Hopf fibration") },
            tooltip: function() { return L("达成「同伦」的第三条里程碑。奖励：全部收入 ×1.05。", "Reach the homotopy layer's third milestone. Reward: all production ×1.05.") },
            done() { return hasMilestone("hott", 3) },
            effect() { return new Decimal(1.05) }
        },
        84: {
            name: function() { return L("ZFC集合论", "ZFC Set Theory") },
            tooltip: function() { return L("采纳第一条 ZFC 公理。奖励：直接取得「ZFC」的首条升级，另加全部收入 ×1.05。", "Adopt your first ZFC axiom. Reward: the ZFC layer's first upgrade is granted outright, plus all production ×1.05.") },
            done() { return player.zfc.points.gte(1) },
            effect() { if (!hasUpgrade("zfc", 11)) return { grantUpgrade: ["zfc", 11] }; return {} }
        },
        85: {
            name: function() { return L("我包含我", "I Contain Myself") },
            tooltip: function() { return L("采纳 2 条 ZFC 公理。奖励：全部收入 ×1.05。", "Adopt 2 ZFC axioms. Reward: all production ×1.05.") },
            done() { return player.zfc.points.gte(2) },
            effect() { return new Decimal(1.05) }
        },
        // port: a thousand-mile walk over the map — the original's own tile-hopping metric
        86: {
            name: function() { return L("千里之行，始于空集", "All things Begin with Empty Set") },
            tooltip: function() { return L("拾取 64 个奖励格位。奖励：全部收入 ×1.05。", "Pick up 64 reward tiles. Reward: all production ×1.05.") },
            done() { return Object.keys(player.geo.taken || {}).length >= 64 },
            effect() { return new Decimal(1.05) }
        },
        87: {
            name: function() { return L("ZFC简化大礼包", "Simplified ZFC Toolkit") },
            tooltip: function() { return L("采纳 5 条 ZFC 公理。奖励：全部收入 ×1.05。", "Adopt 5 ZFC axioms. Reward: all production ×1.05.") },
            done() { return player.zfc.points.gte(5) },
            effect() { return new Decimal(1.05) }
        },
        88: {
            name: function() { return L("ω^ω", "ω^ω") },
            tooltip: function() { return L("序数阶梯登上第 1 级。奖励：全部收入 ×1.05。", "Climb the first ordinal rung. Reward: all production ×1.05.") },
            done() { return player.ord.points.gte(1) },
            effect() { return new Decimal(1.05) }
        },
        89: {
            name: function() { return L("确定坐标，精确制导", "Target coordinates!") },
            tooltip: function() { return L("走过 4000 块格位。奖励：全部收入 ×1.05。", "Walk 4000 tiles. Reward: all production ×1.05.") },
            done() { return player.tilesSeen.gte(4e3) },
            effect() { return new Decimal(1.05) }
        },
        // --- the ZFC finale: choice, cardinals, ω^ω^ω^ω ------------------------------------------
        91: {
            name: function() { return L("皮亚诺，你被解雇啦！", "Peano, you are fired!") },
            tooltip: function() { return L("采纳 4 条 ZFC 公理，用集合重造自然数。奖励：全部收入 ×1.05。", "Adopt 4 ZFC axioms and rebuild the naturals from sets. Reward: all production ×1.05.") },
            done() { return player.zfc.points.gte(4) },
            effect() { return new Decimal(1.05) }
        },
        // port: dX builds the Cartesian product; the geometry milestone pays for exactly that reach
        92: {
            name: function() { return L("笛卡尔：积，故我在", "Descartes: Product, donc je suis") },
            tooltip: function() { return L("达成「格位」的第三条里程碑。奖励：全部收入 ×1.05。", "Reach the geometry layer's third milestone. Reward: all production ×1.05.") },
            done() { return hasMilestone("geo", 3) },
            effect() { return new Decimal(1.05) }
        },
        93: {
            name: function() { return L("正正负负(Z)", "Positive & Negative (Z)") },
            tooltip: function() { return L("累计推出 4800 条定理。奖励：全部收入 ×1.05。", "Prove 4800 theorems in total. Reward: all production ×1.05.") },
            done() { return player.theoremsProved.gte(4800) },
            effect() { return new Decimal(1.05) }
        },
        // port: the barber paradox is a ZFC-side contradiction hunt — one challenge run proves it
        94: {
            name: function() { return L("我给且只给所有不自己理发的人理发", "Russell's Barber Paradox") },
            tooltip: function() { return L("完成一次「ZFC」的挑战。奖励：全部收入 ×1.05。", "Complete the ZFC layer's challenge once. Reward: all production ×1.05.") },
            done() { return hasChallenge("zfc", 11) },
            effect() { return new Decimal(1.05) }
        },
        95: {
            name: function() { return L("集齐所有ZFC公理", "Collect All ZFC Axioms") },
            tooltip: function() { return L("采纳全部 9 条 ZFC 公理。奖励：直接取得「ZFC」的一条里程碑，另加全部收入 ×1.05。", "Adopt all 9 ZFC axioms. Reward: a ZFC milestone is granted outright, plus all production ×1.05.") },
            done() { return player.zfc.points.gte(9) },
            effect() { if (!hasMilestone("zfc", 2)) return { grantMilestone: ["zfc", 2] }; return {} }
        },
        // port: the diagonal arc is chapter 4 of the story layer, which the main milestones feed
        96: {
            name: function() { return L("不可数", "Uncountable") },
            tooltip: function() { return L("章节推进到第 4 章。奖励：全部收入 ×1.05。", "Unlock the fourth story chapter. Reward: all production ×1.05.") },
            done() { return stoChapterCount() >= 4 },
            effect() { return new Decimal(1.05) }
        },
        97: {
            name: function() { return L("一切皆可良序", "Everything Is Well-Ordered") },
            tooltip: function() { return L("7 条 ZFC 公理，且序数阶梯到第 3 级。奖励：全部收入 ×1.05。", "Hold 7 ZFC axioms and reach ordinal rung 3. Reward: all production ×1.05.") },
            done() { return player.zfc.points.gte(7) && player.ord.points.gte(3) },
            effect() { return new Decimal(1.05) }
        },
        98: {
            name: function() { return L("ω^ω^ω^ω", "ω^ω^ω^ω") },
            tooltip: function() { return L("序数阶梯登上第 6 级。奖励：全部收入 ×1.05。", "Climb to ordinal rung 6. Reward: all production ×1.05.") },
            done() { return player.ord.points.gte(6) },
            effect() { return new Decimal(1.05) }
        },
        99: {
            name: function() { return L("临界质量（累计获50.1kg推理素）", "Critical Mass (Accumulated 50.1kg of Deductrium)") },
            tooltip: function() { return L("累计获得 50.1kg 推理素。奖励：全部收入 ×1.05。", "Accumulate 50.1kg of Deductriums. Reward: all production ×1.05.") },
            done() { return player.totalDeductriums.gte(50.1e9) },
            effect() { return new Decimal(1.05) }
        },
    }
})
