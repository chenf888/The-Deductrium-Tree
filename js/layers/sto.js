// sto — Chapters 章节. The `story` modifier M15: eight infobox chapters gated on real progression.
// A row:"side" layer, so layerDataReset never runs here and no doReset is defined.
addLayer("sto", {
    name: "Chapters 章节",
    symbol: "C",
    color: "#C77DFF",
    resource: "chapters",
    row: "side",
    position: 1,

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            chapters: [],
        }
    },

    layerShown() { return player.ded.unlocked },

    tabFormat: [
        ["display-text", function () {
            return L("章节 ", "Chapters ") + player.sto.chapters.length + " / 8"
        }],
        ["infobox", "c1"],
        ["infobox", "c2"],
        ["infobox", "c3"],
        ["infobox", "c4"],
        ["infobox", "c5"],
        ["infobox", "c6"],
        ["infobox", "c7"],
        ["infobox", "c8"],
    ],

    infoboxes: {
        c1: {
            title: function () { return L("第一章：纸上的系统", "Chapter I: The System on Paper") },
            body() {
                return L("你在双曲铺嵌的深处捡到一副 Hilbert 式的公理。棋盘上没有方向，只有蕴含：一枚 ¬，一行 ⊢，世界就开始讲道理。第一次按下收束证明的按钮，推理素像尘埃一样落下。",
                    "In the depths of a hyperbolic tiling you pick up a Hilbert-style axiom set. There is no direction on the board, only implication: a ¬, a line of ⊢, and the world begins to make sense. The first proof you close drops 推理素 like dust.")
            },
            unlocked() { return stoRecord(1) && player.ded.best.gte(1) },
        },
        c2: {
            title: function () { return L("第二章：闸与墙", "Chapter II: Gates and Walls") },
            body() {
                return L("闸门挡路，墙是拒绝。你学会用推理素交闸费，一格一格往外挪。地图不奖励莽撞，它奖励肯把每一步都写进定理表的人。",
                    "Gates bar the way; walls simply refuse. You learn to pay a toll in 推理素 and step outward, tile by tile. The map rewards not haste, but whoever writes every step into the theorem table.")
            },
            unlocked() { return stoRecord(2) && player.geo.unlocked },
        },
        c3: {
            title: function () { return L("第三章：谈论证明", "Chapter III: Talking About Proof") },
            body() {
                return L("当演绎累计到一定数目，你开始怀疑规则本身也能被推理。元层面的门开了一条缝：原来你不仅能证明命题，还能谈论「证明」这件事。",
                    "Once deductions pile past a certain count, you start to suspect the rules themselves can be reasoned about. A crack opens in the meta-level: you may not only prove propositions, but speak about the very act of proving.")
            },
            unlocked() { return stoRecord(3) && hasMilestone("ded", 2) },
        },
        c4: {
            title: function () { return L("第四章：三足公理", "Chapter IV: Three Standing Axioms") },
            body() {
                return L("命题的公理一条条被采纳，重言式变得廉价，反证法成了日常的扳手。三足鼎立之后，你第一次觉得这套系统能自己站住。",
                    "The propositional axioms are adopted one by one; tautologies grow cheap, and proof by contradiction becomes an everyday wrench. With three standing firm, you feel for the first time that this system holds itself upright.")
            },
            unlocked() { return stoRecord(4) && player.fol.points.gte(3) },
        },
        c5: {
            title: function () { return L("第五章：可调校的机器", "Chapter V: A Machine You Can Tune") },
            body() {
                return L("元规则上线。你现在能改写规则如何展开、如何缓存、如何就地替换。系统不再是死板的公理，而是一台你能调校的机器。",
                    "Metarules come online. You can now rewire how rules expand, cache, and substitute inline. The system stops being inert axioms and becomes a machine you can tune.")
            },
            unlocked() { return stoRecord(5) && player.meta.unlocked },
        },
        c6: {
            title: function () { return L("第六章：在纸上造一切", "Chapter VI: Building Everything on Paper") },
            body() {
                return L("集合论的大门打开：外延、配对、并集、分离——四条公理立起，数学里几乎所有对象都能被编码成集合。你终于能在纸上造出「一切」。",
                    "Set theory swings open: extension, pairing, union, separation — four axioms raised, and nearly every object in mathematics can be coded as a set. You can finally build 'everything' on paper.")
            },
            unlocked() { return stoRecord(6) && player.zfc.points.gte(4) },
        },
        c7: {
            title: function () { return L("第七章：命题即类型", "Chapter VII: Propositions as Types") },
            body() {
                return L("类型论接管了证明。命题不再是真或假，而是一个类型：它的证明就是一 inhabits 它的项。可互相转换的构造子彼此识别，战术一步步把目标类型归约到规范形。",
                    "Type theory takes over the proofs. A proposition is no longer true or false but a type: its proof is a term inhabiting it. Convertible constructors recognize one another, and tactics reduce the goal type toward normal form, step by step.")
            },
            unlocked() { return stoRecord(7) && player.typ.unlocked },
        },
        c8: {
            title: function () { return L("第八章：路径亮起", "Chapter VIII: Paths Light Up") },
            body() {
                return L("路径出现了。相等不再是一个二值的判断，而是一条可走、可合成的道路；同伦的直觉渗进形式系统，序数的阶梯也已在远处亮起。",
                    "Paths appear. Equality is no longer a binary verdict but a walkable, composable road; homotopical intuition seeps into the formal system, and the ordinal ladder begins to glow in the distance.")
            },
            unlocked() { return stoRecord(8) && player.hott.points.gte(3) },
        },
    },
})

// Records an unlocked chapter index into player.sto.chapters so the achievement layer can count them.
// Idempotent (only pushes when absent) and safe before the save is fully built.
function stoRecord(idx) {
    if (typeof player !== "undefined" && player.sto && player.sto.chapters && !player.sto.chapters.includes(idx)) {
        player.sto.chapters.push(idx)
    }
    return true
}
