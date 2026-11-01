# Design Brief — `The Deductrium Tree`

> Stage 2 document. Sources: `assets/blueprints.json` (`blueprints.medium`), `assets/balance-defaults.json`,
> `assets/fun-quota.json` (`byBlueprint.medium` + `staticCheckThresholds`), `assets/type-registry.json`
> (`types.active-click`, modifiers). Every deviation names the default it overrides in §10.
> Target game folder: `E:\Idle-Skill\The-Deductrium-Tree` (moved in at Stage 3).

## 1. Identity

| Field | Value |
|---|---|
| Game name | The Deductrium Tree |
| Author (`modInfo.author`) | `chenf888 (port) · Hqak (original Deductrium)` |
| Points name (`modInfo.pointsName`) | `Deductriums` (中文渲染：推理素) |
| `modInfo.id` (permanent, never change) | `the-deductrium-tree-69hzqe` — written by `scaffold.js` at Stage 3; it keys the localStorage savefile (07 hard rule 3) |
| Language mode (interview Q7) | Bilingual (T2 pair, P17 ternaries through one `L(zh, en)` helper) |
| Default language (bilingual+ only, Q7) | English (`window.chinesemode = false`) |
| One-line pitch | 原版 Deductrium 的形式系统（Hilbert 风格演绎 + 双曲 {6,4} 地图 + 类型论战术）搬进 TMT 的声望树：命令行、公理、元规则、宏、假设、序数全部保留，推理素成为主货币，行阶梯就是它的度量衡前缀。 |
| Blueprint | `blueprints.medium` — 10–16 layers, 10–30 h, rows 0…4 |
| Upstream licence | 原作者 **Hqak 已授权**复用（移植者于 2026-11-01 确认）；内核源码全部放在可整目录删除的 `js/deductrium/`，版权仍归 Hqak（用户 Q：「复用＋注明来源待授权」→ 现已获授权） |

## 2. Interview record (answers → parameters) — the question ledger

Every Answer cell is the user's own answer, verbatim where quoted.

| # | Question | Answer | Locked parameter |
|---|---|---|---|
| S0 | Theme (only if the user gave none) | 用户自带主题：移植 `github.com/wxyhly/deductrium`，「尽最大保留原版玩法」 | feeds Q1 |
| Q1 | Theme-structure confirmation | 「确认为此结构」 | theme = structure mapping in §3 |
| Q1b | 推理交互保真度 | 「保留命令行输入框」 | `text-input` 绑定 `player.ded.cmd` + 命令状态机（§4b M-行、§10 D3） |
| Q2 | Scale | 「中 10–16 层」 | `blueprints.medium`（12 主层 + 3 侧层） |
| Q3 | Natural ceilings | 「混合（推荐）」 | cap table §8：6 个主题硬上限（fol/pea/zfc/num/hott/ord 的 `canReset()` 上限 + buyable `purchaseLimit`）+ 其余 softcap |
| Q4 | Pacing | 「mostly active 为主动手」 | 主动层为主；生产由「演绎」命令驱动（P15 只允许一个核心循环层：`ded`） |
| Q4b | Type + modifier multi-select | see §2b | §2b rows |
| Q5 | Side content | 「Full 再加侧层」 | 侧层 `ach`(80 成就) + `sts`(统计) + `sto`(章节)；挑战每层 1 个 |
| Q6 | Automation & timewalls | 「经典 4–6 步」 | 自动化阶梯 6 步（§6），不自动 `ded` 命令本身 |
| Q7 | Language & style | 「T2 双语·英文默认」 | P17 + handbook 15 §2：所有文案是 `function`，`main-display` 全部被替换（07 F7） |
| Q8 | Endgame flavor | 「Consumable reset」 | `ord` 层（M19）：每上一层序数 = 烧掉整局（§7/§8） |
| extra-1 | 上游无 LICENSE 如何处理 | 先「复用＋注明来源待授权」，2026-11-01 作者 Hqak 已授权 | `js/deductrium/` 原样拷贝 + `ATTRIBUTION.md`（Hqak，已授权） |
| extra-2 | 游戏名 | 「The Deductrium Tree」 | §1 |
| extra-3 | `modInfo.author` | 「作者是Hqak，我移植者chenf888」 | §1 |
| extra-4 | 几何层移植规模 | 「全部 1612 条指令」 | `js/ded/mapdata.js` 收录全部 1612 条放置指令、350 个命名格 |

Confirmed Q1 theme-structure recap:

- **Currencies (in order):** 推理素 Deductriums (`player.points`, 度量衡 µg/mg/g/kg/T) → 演绎 deductions (`ded`) → 格位 tiles (`geo`) / 元规则 metarules (`meta`) / 命题公理 axioms (`fol`) → 字面量 literals (`lit`) / 谓词公理 (`pea`) / 宏 macros (`mac`) → ZFC 公理 (`zfc`) / 数论公理 (`num`) / 类型 types (`typ`) → 同伦路径 paths (`hott`) / 序数 ordinals (`ord`)
- **Layer topology:** 5 行 × 12 主层，行的分界 = 推理素的度量衡前缀（mg/g/kg/T）；形式系统的逻辑强度 = 行序（命题 → 谓词 → ZFC → 类型 → 同伦/序数）；双曲地图不作为 TMT 树，而是 `geo` 层内部的 `grid` 面板
- **Ceilings:** 公理条数（命题 5 / 谓词 5 / ZFC 9 / 数论 4 / HoTT 6）是主题硬上限；其余货币软上限

## 2b. Game type profile (Q4b — required)

| Field | Value |
|---|---|
| Type (`type-registry.json` id) | `active-click` |
| User confirmation (verbatim) | 「active-click 为主」 |
| Confidence + margin from classify.js | `classify.js` 返回 `action: "ask-type"`（无自动路由，兜底 passive-prestige 0.43 与游戏交互性矛盾）→ 按 §3 提问，用户直接命名类型 = **explicit 信号，floor 0.75，terminal**，不再计算 margin |
| Components this type makes mandatory | `clickables`（`requiredModules: [clickables, layers]`）：`geo` 行走盘 6 键、`ded` 断言工具 5 键、`ord` 破闸 4 键；每个 clickable 有 `canClick()` + `onClick()`，状态在 `startData` 且只是 number/string |
| Components this type forbids | `Decimal` 作为 clickable 状态；使用 `this` 的箭头函数 `onClick` |
| Rules exempt for this type | 无豁免（`exemptRules: []`）；`requireRules: T-CLICKABLE, N-GHOSTFIELD, D-MICROTABS` |
| 未选修饰符的落点 | `score-attack`(M2) / `minigame`(M3) / `boss-rush`(M12) / `gacha`(M13) / `casino`(M14) 全部未选，逐个理由见下表。注意 `active-click` 的 `codeContract.forbid` 只禁「Decimal 作为 clickable 状态」与「用 `this` 的箭头 `onClick`」，并**不**禁 score-attack —— M2 是依赖可满足（type `active-*` + `sim` 齐备）而主动不选，理由在下一表 |

Modifiers (max **one interaction type**; everything else is a modifier here):

| Modifier | Requires | Included? | Notes / why dropped |
|---|---|---|---|
| `sim` | — | **yes** | `ded` / `geo` / `typ` = 3 个 `type:"custom"` + 手写 `update()`，正好用完 3 层预算（预算上限即「内核宿主层」） |
| `score-attack` (M2) | type `active-*` + `sim` | **no** | 依赖可满足但主动不选：原版没有任何分数玩法，且 M2 是手写惯用法（引擎无 `scoreAttack` API），加进去只会变成与主题无关的第二动词 |
| `minigame` (M3) | type `active-*` | **no** | 原版的「小游戏」就是演绎本身；再加一个随机点击小游戏会稀释核心动词 |
| `boss-rush` (M12) | `active-*` + `sim` | **no** | 原版无 Boss |
| `gacha` (M13) | `active-*` | **no** | 原版无抽卡 |
| `casino` (M14) | `active-*` | **no** | 原版无博彩 |
| `story` (M15) | — | **yes** | 侧层 `sto`：8 个章节（对应原版的叙事碎片），infobox + 解锁条件数组；数据驱动的过场引擎属 large，不做（§10 D7） |
| `board` | — | **yes** | `geo.grid`（`grid: {` 单数、base-100 id、`getStartData` 必备）承载 {6,4} 双曲地图；T-GRID 负责校验 |
| `challenges` (M1) | — | **yes** | 15 个挑战，全部 `canComplete()` 方言（语料多数 45/57） |
| `caps` | — | **yes** | §8 的 6 个主题硬上限 |

## 3. Theme = structure mapping (P14 — required)

1. **度量衡前缀 = 行阶梯。** 原版把推理素显示为 µg / mg / g / kg / T。移植后每一「行」的解锁门槛正好落在一个单位上：row1 = 1 mg (1e3)、row2 = 1 g (1e6)、row3 = 1 kg (1e9)、row4 = 1 T (1e12)。主题不只命名了结构，它**就是**结构的刻度（`balance-defaults.adjacentRowRequiresRatio` 的 ×10–×100 带内取 ×62.5，见 §4）。
2. **逻辑强度 = 行序。** 命题逻辑 → 谓词逻辑 → ZFC → 类型论 → 同伦/序数，正是 Deductrium 里「越来越强的公理系统」的顺序；每上一层就多一套可用的推理规则。
3. **形式系统的三类对象 = 三类组件。** [P] 定理表 + [D] 规则表 → `ded` 层面板与 `player.ded` 状态；宏 → `mac` 层；元规则 → `meta` 层（其升级几乎全是 K4「给具名机制加力」，天然是一个 M8 商店层）。
4. **公理的「恰好 N 条」= 硬上限。** ZFC 恰好 9 条、命题/谓词各 5 条、数论 4 条、HoTT 6 条 → `canReset()` 上限 + `purchaseLimit`，不是软上限（Q3「混合」中的「有自然上限」那一半）。
5. **闸门 = 消耗性重置。** 原版 11 种 gate 消耗推理素开新路 → `ord` 层每上一层把整局烧掉（M19），这是 Q8 选定的 endgame 动词。
6. **双曲地图不进树。** {6,4} 铺嵌在 TMT 里读不通（一个格子一个节点会毁掉树的可读性），所以地图 = `geo` 层内的 `grid` 组件 + 行走 clickable 盘；TMT 的树保持「逻辑层级」这一个可读隐喻。
7. **命令行 = 核心动词。** `text-input` 绑定 `player.ded.cmd`，保留原版的 `ded`/`hyp`/`inln`/`entr`/`check` 等指令；`getPointGen()` 的收入里有一项就是「当前定理表的行数」，所以打字本身就是生产。引擎在输入框聚焦时不派发快捷键（`utils.js:308`），WASD 行走与打字不冲突。

## 4. Layer chain table

`requires` 一律以推理素（`player.points`）计价 —— 原版的闸门费用就是这一种货币。
id 规则：升级 `row*10+col`（列 ≤5，07 F5）；grid tile id base-100（07 F26）。

| id | name (theme voice) | row | pos | type | base resource → baseAmount | requires | exp/base | upgrades | milestones | challenges | buyables | automation granted (by which milestone, of which layer) | softcap plan | doReset keeps | branches |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ded | Deduction 演绎 | 0 | 0 | custom | Deductriums → player.points | 10 | 0.5 (在 getResetGain 内) | 15 (5x3) | 6 | 1 | 1 | 由 meta.m0 获得 passiveGeneration(ded)；ded.m0 是所有静态公理层 resetsNothing 的门 | 层 softcap 1e3 / power 0.5（在委托的 normal 公式内生效） | 自身 doReset 保留 `"unlocked","points","best","total","autoDeduct"` + 手抄数组字段（07 F18） | — |
| geo | Geometry 格位 | 1 | 0 | custom | Deductriums → player.points | 1e3 | 0.5 | 12 (5x3 minus 3) | 5 | 2 | 2 | geo.m1 → passiveGeneration(geo) | 层 softcap 1e3 / power 0.5 | doReset: `row > this.row` 时 layerDataReset 保留 `"unlocked","points","best","total","seen","gateOpen"`（手抄） | [["ded","green",4]] |
| meta | Metarule 元规则 | 1 | 1 | normal | Deductriums → player.points | 4e3 | exp 0.333 | 10 (5x2) | 4 | 1 | 0 | meta.m0 → passiveGeneration(ded)（跨层） | 层 softcap 3e2 / power 0.5；cap-raise 升级 u25（×10，可见才卖） | doReset: 更深行 → 保留 `"unlocked","points","best","total"` | [["ded","green",4]] |
| fol | Axiom 命题公理 | 1 | 2 | static | Deductriums → player.points | 1.6e4 | base 2 / exp 1，**上限 5** | 10 (5x2) | 4 | 1 | 0 | ded.m0 → resetsNothing(fol)；pea.m2 → autoPrestige(fol)；mac.m4 → autoUpgrade(fol) | 主题硬上限：`canReset()` 在 floors≥5 时 false（不靠 softcap） | 同左：更深行 → 保留 `"unlocked","points","best","total","auto"` | [["meta","red",2]] |
| lit | Literal 字面量 | 2 | 0 | normal | Deductriums → player.points | 1e6 | exp 0.25 | 12 (5x3 minus 3) | 4 | 1 | 2 | lit.m0 → 驱动 autoBuyable(lit.b11)（在 mac.automate 内） | 层 softcap 1e3 / power 0.5 | 更深行 → 保留 `"unlocked","points","best","total"` | [["geo","blue",2]] |
| pea | Predicate 谓词公理 | 2 | 1 | static | Deductriums → player.points | 4e6 | base 2 / exp 1，**上限 5** | 10 (5x2) | 4 | 1 | 0 | ded.m0 → resetsNothing(pea)；pea.m2 → autoPrestige(pea)；mac.m4 → autoUpgrade(pea) | 主题硬上限 5 | 更深行 → 保留 `"unlocked","points","best","total","auto"` | [["fol","red",2],["lit","blue",2]] |
| mac | Macro 宏 | 2 | 2 | normal | Deductriums → player.points | 1.6e7 | exp 0.25 | 12 (5x3 minus 3) | 5 | 1 | 2 | mac.m4 → autoUpgrade(fol,pea,lit,mac) | 层 softcap 1e3 / power 0.5 | 更深行 → 保留 `"unlocked","points","best","total"` | [["lit","blue",2],["pea","red",2]] |
| zfc | ZFC 公理 | 3 | 0 | static | Deductriums → player.points | 1e9 | base 2 / exp 1，**上限 9** | 12 (5x3 minus 3) | 5 | 1 | 1 | ded.m0 → resetsNothing(zfc)（cap-raise 类升级不卖） | 主题硬上限 9（原版 ZFC 恰好 9 条） | 更深行 → 保留 `"unlocked","points","best","total","auto"` | [["pea","red",2],["mac","blue",2]] |
| num | Numeral 数论公理 | 3 | 1 | static | Deductriums → player.points | 4e9 | base 2 / exp 1，**上限 4** | 10 (5x2) | 4 | 1 | 0 | ded.m0 → resetsNothing(num)；zfc.m4 → autoPrestige(num) | 主题硬上限 4 | 更深行 → 保留 `"unlocked","points","best","total","auto"` | [["zfc","red",2]] |
| typ | Type 类型论 | 3 | 2 | custom | Deductriums → player.points | 1.6e10 | 0.4 (getResetGain 内) | 14 (5x3 minus 1) | 5 | 2 | 1 | typ.m4 → autoUpgrade(typ) | 层 softcap 1e2 / power 0.5；cap-raise 升级 u33（×10，只在 `typ` 面板显示上限时卖） | 更深行 → 保留 `"unlocked","points","best","total","solved","puzzle"`（手抄） | [["num","red",2],["mac","blue",2]] |
| hott | Homotopy 同伦路径 | 4 | 0 | static | Deductriums → player.points | 1e12 | base 2 / exp 1，**上限 6** | 10 (5x2) | 4 | 1 | 0 | ded.m0 → resetsNothing(hott)；zfc.m4 → autoPrestige(hott) | 主题硬上限 6 | 更深行 → 保留 `"unlocked","points","best","total","auto"` | [["typ","pink",2]] |
| ord | Ordinal 序数 | 4 | 1 | static | Deductriums → player.points | 4e12 | base 10 / exp 1，**上限 12**，`getResetGain()` 覆盖为**每次恰好 1 级** | 12 (5x3 minus 3) | 6 | 1 | 0 | **不自动化**（无 autoPrestige / 无 resetsNothing）= Q8 的消耗性重置 | 主题硬上限 12（= 原版 ordBase 15 的前 12 级，§10 D8）；不写 softcap | 无 doReset：`ord` 自己破闸时故意全盘清（M19）；更深行不存在 | [["hott","magenta",2],["typ","pink",2]] |

Side layers (`row: "side"`, never auto-reset):

| id | role | contents |
|---|---|---|
| ach | achievements | **81 个**（原版 `src/game.ts` 的 `achievementsTable` 全量移植，9x9 id 网格），`type:"none"`；`effect()` 为 P11 回填，一律带 `!hasUpgrade/!hasMilestone` 守卫；每个 effect ×1.05，81 个的终局乘积 ≈ ×52（见 §10 D10 的预算说明） |
| sts | statistics | `raw-html` + `display-text`：累计推理素（`addedPlayerData().totalDeductriums`，07 F10）、已破闸数、定理总数、走过的格数、`genOrd()` 的 BigInt 序数读数 |
| sto | story (M15) | 8 个章节 infobox，`storyUnlocked` 数组 + 条件表（由主层里程碑喂）；未解锁显示「暂未解锁」 |

Rules the table must obey — verification inline:

- requires ladder monotonic ✓ 10 < 1e3 < 4e3 < 1.6e4 < 1e6 < 4e6 < 1.6e7 < 1e9 < 4e9 < 1.6e10 < 1e12 < 4e12；相邻行 ×62.5（row0→row1 = ×100，带内上沿，§10 D1）
- first layer requires 2–10 ✓ `ded: 10`
- every main layer ≥10 upgrades + ≥3 milestones ✓（最少 10 升级 / 4 里程碑）
- every new layer wires ≥2 older layers in its `gainMult` ✓（§4.1 的 K3/K4 计划列）
- automation ladder 4–8 steps in P4 order, one chore per step ✓ 6 步（§6，符合 Q6「经典 4–6 步」）
- every unbounded feedback loop has a softcap plan ✓（表内 `softcap plan` 列 + §8）

### 4.1 Fun density table (handbook 10 §2/§5 — per layer)

K1 ≤ 40%（`byBlueprint.medium.maxK1SharePerLayer`）；每层 ≥3 个非 K1 种类；K7 不计入 K1 分母。
「consumer」列同时是检查 12（N-UNWIRED）与检查 23（N-BUYABLEDEAD）的接线合同。

| id | content items | effect-kind plan (which upgrades are K2/K3/K4/K5/K7/K8/K9) | K1 share | organization (tabFormat sections / microtabs) | mechanics used here |
|---|---|---|---|---|---|
| ded | 15U+6M+1C+1B+5click+1bar = 29 | K2 u12 `points.pow(0.4)`（本层唯一自缩放）· K3 u14 `log10(player.geo.points)` · K4 u21「宏展开快 1 步」= 具名机制 · K5 u22 把 ded softcap 抬到 1e4 · K7 u11/u31 解锁子标签与断言工具 · K9 u32 每次破闸立即给 60 s 生产（原版无此项 → §10 D6） | 6/15 = 40% | tabFormat: main(命令框+表) / microtabs `ded`: Proofs \| Rules \| Macros \| Milestones | M4(update+bar) M5(次级货币=定理表行数) M7(custom 仪式层) |
| geo | 12U+5M+2C+2B+2buy+6click = 29 | K2 u12 `tiles.pow(0.5)` · K3 u13 读 `player.fol.points`（公理越多，视野越远）· K3 u22 读 `player.meta.points` · K7 u15 解锁第二组 buyable · K5 u21 抬 geo softcap ×10 · K8 b11/b12 产「路标」→ 供 `ded` 消费 · K1 = u11/u14/u23/u24 | 4/12 = 33% | tabFormat: 地图 grid + 行走盘 + bar / microtabs `geo`: Map \| Waypoints \| Milestones \| Challenges | M4(行走盘 clickable) M16 的精神替代（网格地图）|
| meta | 10U+4M+1C = 15 | 全部具名机制：K4 u11「c 规则可用于任何公理」· K4 u12「q 规则乘数 +1」· K3 u13 元规则乘 typ 收入 · K7 u14 解锁 `sto` 侧层 · K5 u22 softcap 上移 · K2 u24 `metarules.log(10).pow(2)` | 3/10 = 30% | tabFormat + microtabs `meta`: Metarules \| Milestones | **M8 商店层**（卖的全是元效果）|
| fol | 10U+4M+1C = 15 | K7 u11 解锁 `pea` · K4 u12「演绎深度 +1 步」(具名机制) · K2 u21 `axioms.pow(0.5)` · K3 u22 读 `player.lit.points` · K6 u23 仅在已破第 1 道闸时生效 · K1 余 3 | 3/10 = 30% | tabFormat: main / Upgrades / Milestones（<12 项，可不用 microtabs → 用了也无害） | M1 挑战 |
| lit | 12U+4M+1C+2buy = 19 | K8 b11 产「字面量预算」(消费方 = `geo.gainMult` + `ded` 收入) · K8 b12 产 BigInt 字面量规则 · K2 u12 `pow(0.4)` · K3 u13 读 fol 层 · K5 u24 抬上限 · K7 u31 解锁 autoBuyable(=m0) | 4/12 = 33% | tabFormat + microtabs `lit`: Literals \| Generators \| Milestones | M5 次级货币 · autoBuyable 目标 |
| pea | 10U+4M+1C = 15 | K7 u11 解锁 zfc · K4 u12「∀ 引入可用」(具名机制) · K2 u21 `pow(0.5)` · K3 u22 读 `player.mac.points` · K1 余 3 | 3/10 = 30% | tabFormat 三段 | M1 |
| mac | 12U+5M+1C+2buy = 20 | K4 u12「宏体可嵌套一层」· K4 u13「conditionIdxs 重基自动」· K8 b11/b12 产宏槽位 · K2 u21 `pow(0.4)` · K3 u24 读 typ · K7 m4 授 autoUpgrade（跨层） | 4/12 = 33% | tabFormat + microtabs `mac`: Macros \| Slots \| Milestones | M1 · 自动化宿主（`automate()` 驱动 lit.b11） |
| zfc | 12U+5M+1C+1buy = 19 | K7 u11 解锁 num/typ · K4 u12「替换表 $ 可用」· K4 u13「内联宏」· K2 u21 `pow(0.5)` · K3 u22 读 ord · K5 u31（唯一「卖上限」：ZFC 上限保持 9，u31 抬的是 `typ` 的软上限，见 §10 D5） · K8 b11 产选择公理计数 | 4/12 = 33% | tabFormat + microtabs `zfc`: Axioms \| Shop \| Milestones | M1 |
| num | 10U+4M+1C = 15 | K2 u12 `pow(0.5)` · K3 u13 读 lit · K4 u14「数值比较规则可用」· K7 u11 解锁 hott · K1 余 3 | 3/10 = 30% | tabFormat 三段 | M1 |
| typ | 14U+5M+2C+1buy+1bar = 23 | K2 u12 `pow(0.4)` · K3 u13 读 zfc/num · K4 u14「whnf 一步到位」· K4 u15「definitional equality 可用」· K6 u21 依 `puzzleDefs` 通过数缩放 · K7 u31/u32 解锁战术面板与 `ord` · K5 u33 抬 typ softcap ×10（面板可见）· K9 b11 每次解谜给 30 s 生产 | 5/14 = 36% | tabFormat + microtabs `typ`: Types \| Tactics \| Puzzles \| Milestones | M1 · M4(战术 clickable 用 raw-html 呈现，见 D4) |
| hott | 10U+4M+1C = 15 | K2 u12 `pow(0.5)` · K3 u13 读 typ · K4 u14「路径合成可用」· K7 u11 解锁 ord · K1 余 3 | 3/10 = 30% | tabFormat 三段 | M1 |
| ord | 12U+6M+1C+4click = 23 | K4 u12「破闸保留 1 条公理」· K4 u13「破闸保留推理素 ×%」(M19 的选择性保留) · K2 u21 `ordinals.pow(0.5)` · K3 u22 读 `player.hott.points` · K6 u31 依 `destructedGates` 分档 · K7 u32/u33 解锁 `sts`/终局子标签 · K5 u34（唯一「可见才卖」的闸门宽度上限 ×10） | 4/12 = 33% | tabFormat: 破闸面板（4 个 clickable：算闸 / 预览代价 / 交闸费 / 阶梯）+ bar / microtabs `ord`: Gates \| Ladder \| Endgame | **M19 消耗性重置** |
| ach | 80 achievements | K4/K7 混合（P11 回填：给 fol/pea 的 floor、给 `sto` 的章节） | n/a | `["display-text", 计数行]` + `achievements`（10 §3.10 要求计数行；引擎 `achievementStyle` 已把未达成的置灰而非隐藏 → N-ACHVIS ✓） | M10 收集 |
| sts | 4 bars + raw-html | n/a（纯显示） | n/a | tabFormat: raw-html 统计 + bars | — |
| sto | 8 infoboxes | K7 | n/a | 每章一个 infobox，`unlocked()` 门控 | M15 |

层密度 15–29 项，全部落在 11 §1 的 8–30 带内 ✓；挑战 15 / 升级 149 = 10.1%，且单层最高 2/14 = 14.3% ≤ 15% ✓。
≥12 项的层（ded/geo/meta/lit/mac/zfc/typ/ord）全部有 microtabs，符合 `microtabsWarnAtContentItems: 10` / `microtabsFailAt: 12` ✓。

### 4b. Game-level fun plan (handbook 10 §5 quota row, `byBlueprint.medium`)

| Quota (medium) | Planned | Where |
|---|---|---|
| Distinct mechanics M1–M10 ≥ 4 | **7**：M1 挑战、M4 主动生产、M5 次级货币、M7 custom 仪式层、M8 商店层、M10 收集成就、M16 的精神替代（网格地图） | ded / lit+mac / ded / geo+typ / meta / ach / geo |
| Challenge layer required | 12 个主层各 1（geo、typ 各 2）= 15，`canComplete()` 方言；nerf 用 `inChallenge()` 写在**更旧**层的公式里 | §4 表 challenges 列 |
| Clickables ≥ 1 group | 3 组：geo 行走盘(6)、ded 断言工具(5)、ord 破闸(4) | 满足 `requiredModules: clickables` |
| Bars ≥ 1 | 5：ded 证明队列、geo 闸门充能 + 行走进度、typ 目标类型、ord 序数到达 | 全部 `progress()` 用 `UP/RIGHT` 常量、除数 = `update()` 比较的同一个上限 |
| Layers with `update()` ≥ 3 | 4：`ded`（表→收入、autoDeduct）、`geo`（行走/充能）、`typ`（归约步进）、`ord`（峰值记录） | 每个首行 `if (!player[this.layer].unlocked) return`（07 F28 / D-UPDATELOCK） |
| Secondary currency ≥ 1 | 2：`player.ded.table` 行数（活的定理表）、`player.typ.solved` | ded / typ |
| Shop/meta layer ≥ 1 | `meta`（元规则商店，升级全是 K4/K5） | §4.1 |
| Custom-type ritual layer (optional) | `ded`「收束证明」+ `geo`「重投影流形」 | 两个都在 `sim` 预算内 |
| autoBuyableDrivers ≥ 1 | 1：`mac.automate()` 用闭式根反解 `lit.b11` 的成本曲线并 `setBuyableAmount`（P54，绝不 +1/帧） | §6 步 3 |
| Rebirth/NG+ | 不需要（large-only） | — |
| K1 ≤ 40% per layer | 每层 30–40%，见 §4.1 | — |
| Microtabs at ≥12 items | 8 个层有 microtabs | §4.1 |
| tabFormat everywhere | 12 主层 + 3 侧层全部自定义 tabFormat（并把 `main-display` 换成本地化 `display-text`，07 F7） | §10 D9 |
| Deep-read addenda: story chapters (M15, 0+) | `sto` 8 章 | 用户选的修饰符 |
| Deep-read addenda: endgame verb M19–M21 | **M19 消耗性重置**（`ord`），用户 Q8 指定 | §7 |

## 5. Tree sketch (ASCII)

```
row4:            [ HoT ]   [ Ω ord ]
row3:      [ Z zfc ]  [ N num ]  [ T typ ]
row2:      [ L lit ]  [ P pea ]  [ M mac ]
row1:      [ G geo ]  [ M meta ] [ F fol ]
row0:                    [ D ded ]
side:  (A ach 8x10)  (S sts)  (sto chapters)
```

`js/tree.js`: `layoutInfo.startTab = "ded"`, `startNavTab = "tree-tab"`, `showTree = true`,
`treeLayout` 留空（由 row/position 自动布局），并放 2 个 `addNode` 装饰节点做行分隔提示
（`ghost` 占位，07 F25：绝不对真实层 id 调 `addNode`）。

## 6. Automation ladder

6 步（Q6「经典 4–6 步」，`balance-defaults.automationLadder.stepsPerGame = [4,8]`），
P4 顺序 keep-on-reset → passiveGeneration → autoBuyable → autoPrestige → autoUpgrade，一步杀一个杂活，全部跨层授予。

| Step | Grants (what chore dies) | Granted by (layer.milestone) | Threshold | Gate must imply `resetsNothing` |
|---|---|---|---|---|
| 1 | 为采纳一条公理而重打整局 —— fol/pea/zfc/num/hott 的 `resetsNothing` 生效 | `ded.m0` | `player.ded.best ≥ 5` | 这是安全门本身（`autoPrestige` 全部以它为合取项） |
| 2 | 手按 `ded` 的收束按钮 | `meta.m0` | `player.meta.best ≥ 3` | n/a（passiveGeneration 不清盘） |
| 3 | 反复回购字面量 buyable | `lit.m0` | `player.lit.points ≥ 5` | n/a |
| 4 | 手按 `geo` 的重投影按钮 | `geo.m1` | `player.geo.best ≥ 12` | n/a |
| 5 | 手按公理计数层（fol/pea）的「采纳下一条」 | `pea.m2` | `player.pea.points ≥ 3` | `autoPrestige = hasMilestone("ded",0) && hasMilestone("pea",2)` ⊇ `resetsNothing = hasMilestone("ded",0)` ✓ |
| 6 | 一层一层手买升级 | `mac.m4` | `player.mac.best ≥ 10` | n/a（`autoUpgrade` 不重置任何东西） |

**永不被自动化的事**：`ded` 的演绎命令本身、`ord` 的破闸。前者是这局游戏的手感（用户要求保留玩法），
后者是玩家应当自己决定的消耗性重置（作者 #40「不要把游戏从玩家手里拿走」）。
`resetsNothing` 全部写成 `hasMilestone` 形式以便 N-AUTOWIPE 做集合比较；`num`/`hott` 的 autoPrestige 复用同一条 ded.m0 门。
`toggles` 只出现在 `ded.autoDeduct`（行走/连打开关）与 `fol/pea.auto`：`player[layer].auto` 确实被 `automate()` 读取 ✓（03 §4.1 不变量 2 的后半句）。

## 7. Endgame definition

- `isEndgame()`：`player.ord.points.gte(TUNING.endgameRungs) && player.hott.points.gte(TUNING.endgameHott)`
  具体 Decimal：`ord ≥ 12`（序数阶梯 12 级）且 `hott = 6`（HoTT 六条全采纳）。
- Reachability estimate（**已被 Stage 6 实测取代**，见 §11）：
  - row0：1 推理素/秒，10 秒到第一次收束；ded 阶梯 ×1.5/floor，到 row1 需 1e3 推理素 → 约 12 次收束。
  - 每行乘数区（保证的部分）：ded 1.5^12≈1.3e2 · geo 2^10≈1e3 · meta 2^8≈2.6e2 · fol/pea/zfc/num/hott 公理乘积 ≈1e3 → 行末产出约 ×1e8 于开局。
  - requires 阶梯跨 12 个数量级（10 → 4e12），手工估计 ≈ 9–14 h（目标带 10–30 h）。
  - **实测**：`tools/simulate.js --click 60 --dt {0.5,1,2}` → 12 层首次重置全部在 **3–18 分钟**内，`isEndgame()` 在 **0.41–0.48 h**（sim 下界；真实玩家约 ×4）。原因与修正见 §11：手工估计假设了「每行都要等产出」，但 TMT 的 normal 层收益公式让点数与产出互相喂养；实测后收紧了 softcap/xp 指数、把跨层线性乘数改成对数、并加了产出上限。§11 是权威。
  - `ord` 12 级，第 x 级价 `4e12 × 2^x`（第 12 级 = 8.2e15 推理素；D20 把底数从 10 降到 2，否则第 12 级 4e23 会超过产出上限）；`getResetGain()` 钉死每次只上 1 级，且每次破闸烧掉整局 ⇒ 终局是 **12 次「把整座塔推倒重来」的决策**（D13）。
- `winText`（函数化，绝不在顶层插值 —— 07 F3）：`"ω 已经落在纸上。"` 的双语句 + 「keep going」。

## 8. Cap table (per currency)

| Currency | Ceiling? | Cap mechanism | Where |
|---|---|---|---|
| 推理素 `player.points` | **yes 1e18/s** | 产出上限 `TUNING.prodCap`（§11 #6；触顶时面板明说） | `getPointGen()` |
| 演绎 `ded.points` | 每次重置收益 **1e3** | 层 `softcap = 1e3`, `softcapPower = 0`（硬收益顶，§11 #5；custom 层委托 normal 公式时生效） | `ded` 层属性 |
| 格位 `geo.points` | 每次重置收益 **1e3** | 层 `softcap = 1e3`, power 0（§11 #5） | `geo` |
| 元规则 `meta.points` | 每次重置收益 **3e2** | 层 `softcap = 3e2`, power 0；u22 卖 ×10 上移（§11 #5；面板显示当前上限 → 检查 17 ✓） | `meta` |
| 命题公理 `fol.points` | **yes 5** | `canReset()` 在 `points ≥ 5` 时 false + 文本 `n / 5 axioms` | `fol` |
| 字面量 `lit.points` | 每次重置收益 **1e3** | 层 softcap 1e3, power 0（§11 #5）；`lit.b11/b12` 用 `purchaseLimit` 与成本 softcap（01 §7 idiom） | `lit` |
| 谓词公理 `pea.points` | **yes 5** | `canReset()` 上限 5 | `pea` |
| 宏 `mac.points` | 每次重置收益 **1e3** | 层 softcap 1e3, power 0（§11 #5） | `mac` |
| ZFC 公理 `zfc.points` | **yes 9** | `canReset()` 上限 9 —— 原版 ZFC 恰好 9 条公理 | `zfc` |
| 数论公理 `num.points` | **yes 4** | `canReset()` 上限 4 | `num` |
| 类型 `typ.points` | 每次重置收益 **1e2** | 层 softcap 1e2, power 0；u33 卖 ×10 上移（§11 #5，可见） | `typ` |
| 同伦路径 `hott.points` | **yes 6** | `canReset()` 上限 6 | `hott` |
| 序数 `ord.points` | **yes 12** | `canReset()` 上限 12（= endgame）+ `getResetGain()` 覆盖为每次 1 级（偏差 D13） | `ord` |
| 定理表行数 | yes | 槽位上限 `TUNING.tableSlots`（灰掉 `partialTest`，非货币） | `ded` 面板 |
| 成就乘积 | no | 每个 ×1.05，81 个 → 终局 ×52（计入 sim 偏差，见 §11） | `ach` |

未封顶的循环及其防线（P12 三处）：`table 行数 → 收入 → 收束 → 更多公理 → 收入`。
① 层 softcap（表内）② `effect()` 内 `softcap(x, cap, 0)`（所有 K2 自缩放项）③ 定理表槽位硬上限。
成本优先于软上限（作者 #6/检查 17）：normal 层的成本阶梯跨 3–5 个数量级（每层货币的自然上界由 requires 阶梯决定，见 §9 检查 13 / 偏差 D12），softcap 只用来兜住上面这一条真会 runaway 的环。

## 9. Self-check results (SKILL.md Stage 2, all 23)

- [x] 1 — requires ladder 单调 10→4e12；相邻行 ×62.5（带内 10–100），row0→row1 ×100 = 带上沿（§10 D1）
- [x] 2 — 首层 `ded.requires = 10` ∈ [2,10]
- [x] 3 — 12 个主层全部 ≥10 升级 + ≥3 里程碑（最少 10/4）
- [x] 4 — 每层在 `gainMult` 里接线 ≥2 个更旧层（§4.1 K3/K4 计划：geo←fol, meta←typ, fol←lit, lit←fol, pea←mac, mac←typ, zfc←ord, num←lit, typ←zfc+num, hott←typ, ord←hott）；且 `meta.u13`、`fol.u22`、`num.u13` 直接给 `ded` 加成（A7 反例不出现）
- [x] 5 — 自动化阶梯 6 步、P4 顺序、一步一杂活、跨层授予（§6）
- [x] 6 — 每个无界环都有 softcap 方案；6 个主题硬上限用 `canReset()` 而非 softcap（§8）
- [x] 7 — A1–A10 扫描：A1 无倒退阶梯 ✓ A2 无「一里程碑给全部」 ✓ A3 无孤立首层 ✓ A4 无薄层 ✓ A5 无一次性挑战墙 ✓ A6 无隐藏乘数 ✓ A7 见 4 ✓ A8 见 5 ✓ A9 无「升级只是 ×n 的墙」（K1 ≤40%）✓ A10 无数值溢出环（softcap 表）✓
- [x] 8 — K1 份额 30–40% ≤ `maxK1SharePerLayer 0.4`；每层 ≥3 个非 K1 种类（§4.1）
- [x] 9 — 12+3 层全部自定义 tabFormat；≥3 内容组的 8 个层有 microtabs；每个 tab 顶部有上下文 display-text（base amount / best / softcap 警告）
- [x] 10 — 游戏级 fun 配额 7 个机制、15 挑战、3 clickable 组、5 bar、4 个 `update()` 层、2 个次级货币、1 商店层、2 个 custom 仪式层（§4b）
- [x] 11 — 乘数预算：每层恰好 1 个自缩放升级（全部 `pow ≤ 0.5` 且套 `softcap`）；任一 `gainMult` 里 Σ 自指数 ≤ 0.6（每个 `gainMult` 最多读 1 个自身曲线）；row0 结束时**保证**的平乘积 ≈ 1.3e2 ≪ 1e4 ✓（N-SELFTOTAL）
- [x] 12 — 接线计划：§4.1 每个升级要么标 K7（token，无 `effect`），要么标出消费方（`gainMult` / `gainExp` / `getPointGen` / `passiveGeneration` / `automate`）；无第三类（N-UNWIRED）
- [x] 13 — 成本阶梯：normal 层跨 **3–5 个数量级**（`meta` 的 10 条：`1 → 3 → 25 → 5e2 → 2e3 → 6e3 → 4e4 → 2e5 → 9e5 → 8e6`，含 u13 = 5 的刻意「钥匙」价，11 §3）—— 每层货币的自然上界由 requires 阶梯决定（`meta.best` 终局约 1e3–1e6），硬凑 6 个数量级会造出永远买不起的死升级，故记为偏差 **D12**；机器门 `D-COSTSPAN ≥3` 通过 ✓。static 层按 `costSpanMinOrdersStatic = 1`（floor 价 `1.6e4×2^n` 跨 1.5 个数量级，正是 checker 注释里 1,2,4,8,16 的合法形状）；≥30% 升级用 pow/log 形状（`D-EFFECTSHAPE`：每层都有 `pow`/`log` 项，见 §4.1 K2/K3）
- [x] 14 — 组件密度 15–29/层 ∈ [8,30]；挑战 ≤15% 升级（单层最高 14.3%）；无界环有层 softcap
- [x] 15 — 作者节奏：首个升级 `ded.u11` 成本 1 推理素、基础 1/秒 → ≤10 s ✓；超过 1 分钟的每次重置都有收益（static 层采纳公理、normal 层得 floor）✓；major reset 从第一秒就变快（deductions 立刻乘 `1.5^n` 抬 `getPointGen`）✓；无硬重置（`fixOldSave` 只调数值，作者 #4）✓
- [x] 16 — 升级纪律：每升级 1 个生产收益；无「升级强化另一个升级的隐藏数字」（K4 全部指向具名机制：c 规则、q 规则、宏嵌套、whnf、路径合成）✓；层的开启靠阈值（`requires` + 里程碑）而非「先买再用还要再付」（`resetsNothing` 那类 QoL 走里程碑，0 个 N-UNLOCKPAYGATE 风险）✓
- [x] 17 — 成本先于 softcap ✓（§8 末段）；只有面板显示当前上限的层（meta / typ / ord）卖 cap-raise 升级
- [x] 18 — 行节奏写成两个常量：`TUNING.REQ_STEP = 62.5`（requires 步长）÷ `TUNING.OUTPUT_STEP = 48`（每行输出倍率）→ **×1.30/行**，落在 ×1.1–×1.6 ✓；行内 `×4` 位置比 ÷ `×2.8` 输出 = ×1.43 ✓。两个常量都写进 `js/tuning.js` 并被 sim 读取
- [x] 19 — 重置生命周期：读 `best`/`total` 里程碑的层全部保留两者（§4 表 `doReset keeps` 列：11 个层定义 `doReset` 并保留 `"unlocked","points","best","total"`（+ 各自的 `auto` / 手抄数组字段）；`ord` 故意不定义 —— 它的破闸就是全盘清，且它的里程碑只读 `player.ord.points`）✓；`autoPrestige` 的条件集 ⊇ `resetsNothing` 的条件集（§6 第 5 步显式合取 ded.m0）✓；`update()` 绝不赋值 `player[layer].points`（用 `addPoints`）✓；每个 `doReset` 用原版守卫 `if (layers[resettingLayer].row > this.row)`（07 F17）✓；数组/对象保留字段先手抄再 `layerDataReset`（07 F18）✓；**6 个 static 层全部定义 `canBuyMax()`**（fol/pea/zfc/num/hott/ord）✓
- [x] 20 — 类型合同：`active-click` 必备 `clickables`（3 组）✓；forbid（Decimal clickable 状态、箭头 `onClick`）不出现 ✓；`requireRules` T-CLICKABLE / N-GHOSTFIELD / D-MICROTABS 已规划 ✓；修饰符依赖全部成立（`sim`≤3 层、`board` 有 `grid: {`、`story` 无依赖、`caps`、`challenges`），被放弃的 5 个（score-attack/minigame/boss-rush/gacha/casino）在 §2b 各有一句理由 ✓
- [x] 21 — 测量计划：所有节奏常量集中到 `js/tuning.js`（`REQ_STEP`、`OUTPUT_STEP`、各层 `requires`、`softcap`、5 个公理上限、`endgameRungs`、`tableSlots`、成就乘积），游戏与 `tools/simulate.js` 同时读取；每个节奏量可调用（`hardCap(layer)`、`nextAxiomCost(layer, n)`、`pointMult()`）✓
- [x] 22 — 问题台账：S0 + Q1–Q8 + Q1b + Q4b 类型与两轮修饰符多选 + 4 个追加问题（授权/名字/作者/地图规模）全部有 §2 行，无空白
- [x] 23 — buyable 持久化：`lit.b11/b12`（消费方 = `geo.gainMult` 与 `ded.getPointGen`，跨层）✓；`geo.b11/b12`（消费方 = `ded` 面板的槽位与 `mac` 的宏深度上限，跨层）✓；`mac.b11/b12`（消费方 = `zfc.gainMult`）✓；`zfc.b11`、`typ.b11` 在 §4.1 标记为 capped phase content（受 `purchaseLimit` 与主题上限约束）且各有 1 个跨层读取方；自动化阶梯含 P4 step-5 的 autoBuyable（闭式反解，非 +1/帧）= `autoBuyableDrivers ≥1` ✓

## 9.1 Static-warning acceptance (Stage 5 output)

`node scripts/static_checks.js .` 的结果：**0 FAIL**（全部 8 个曾有的 FAIL 都是 `M-FILES`/`S-MISSING`，在补齐层文件后消失）。

| Check | Layers | Why accepted (or: fixed — how) |
|---|---|---|
| D-IMPLICITGLOBAL ×64 on `js/deductrium/kernel.js` | 27 个内核模块（14.5k 行） | 上游 TS 编译产物，按 `tools/build_kernel.js` 机械转换；逐条改动会破坏「可整目录删除 + 可复现构建」的授权条件（`ATTRIBUTION.md` 第 4 条列了全部 5 处人工改动）。vendor 代码，接受 |
| D-IMPLICITGLOBAL `js/text.js:30` (`winText`) | text.js | **已修**：`winText` 的定义从 mod.js 移入 text.js，改为 `var winText = L(...)`，既消掉隐式全局，又让双语选择在语言偏好读取之后才求值（07 F3） |
| N-CONTRAST `js/layers/sto.js:3` | sto | **已修**：`#9A3EAB` → `#C77DFF`，作为正文颜色在 `#0f0f0f` 上的对比度回到可读区间（12 §6-34） |
| T-TICKREG | mod.js | 初版列了 5 个不存在的函数名（DED_walk/DED_payGate/…），已改为实际存在的 16 个动作函数；当前 0 WARN |
| D-LOCALWIRE ×6（fol/pea/zfc/num/hott/ord） | 6 个公理层 | 这些层的 `effect()` 型升级全部是全局产出（`getPointGen`）或具名机制（元规则字母、破闸保留、挑战解锁），层内唯一的本地杠杆是「采纳价格」（u15 + 里程碑 → `gainMult`）。规则想抓的是「升级什么都不做」，而这些升级都有消费者（`js/mod.js` 的 `gainMult` 之外的接线）。接受 |
| D-MICROTABS / D-COSTSPAN / D-EFFECTSHAPE | 各主层 | 当前 0 WARN（见 §9 检查 9/13） |

其余 WARN 若在补齐层文件后出现，逐条补进本表；未在本表出现的 WARN 视为待修。

## 10. Deviations & open questions

| Default overridden | Value used | Why |
|---|---|---|
| D1 `adjacentRowRequiresRatio` 中位 ×25 | row0→row1 取 ×100，其余 ×62.5 | 让 4 行的门槛正好落在原版的度量衡前缀 mg/g/kg/T 上（§3.1），主题即结构 |
| D2 `rowPlan.row1.type = [normal, custom]` | row1 加了 1 个 static 层（fol） | 命题逻辑「恰好 5 条公理」需要计数器上限（`whenDefaultsMustMove.themeWithNaturalCeilings`）|
| D3 手册 04 §6「clickables 不要做状态机以外的东西」 | `ded` 用 `text-input` + 全局函数 `DED_exec()` 承载命令状态机 | 用户 Q1b 明确「保留命令行输入框」；`text-input` 只能绑 `player[layer][data]`，初值必须是**非数字字符串**（建议 `"d"`），否则 `toValue` 会把 `""` 折成 Number |
| D4 `active-click` 用 clickable 承载交互；原版 19 个 tactic | 战术面板用 `raw-html` + 内联 `onclick` | 哪个战术可用取决于目标类型的形状，是每帧变化的函数，固定 clickable 网格会把不可用项也画出来（原版的灰掉语义丢了）。可点击的 clickable 组仍保留 3 处满足类型合同 |
| D5 `zfc` 上限 9 不可卖 | `zfc.u31` 抬的是 `typ` 的软上限而不是 ZFC 的公理条数 | 「ZFC 恰好 9 条」是主题真理，卖它等于撒谎 |
| D6 K9 效果种类（一次性 N 秒生产）在原版没有对应 | `ded.u32`、`typ.b11` | K9 需要至少一处才凑够每层 ≥3 非 K1 种类；已在 §4.1 标明是移植新增 |
| D7 `story` 修饰符的过场引擎（09 P32）仅 large | `sto` 用 8 个 infobox + 条件数组 | medium 预算 |
| D8 原版序数是 BigInt 结构（ordBase 15→1、`genOrd`） | 经济层用 12 个 floor 计数，`genOrd()` 的 BigInt 读数放进 `sts` 展示 | TMT 货币是 Decimal，装不下原版的序数树；展示端保留真实序数 |
| D9 05 §1 允许直接用 `"main-display"` | 每层 tabFormat 用本地化 `display-text` 替换它 | 07 F7：`main-display` 硬编码英文 `You have`；T2 双语必须替换，且不编辑引擎文件 |
| D10 `blueprints.medium.sideLayers.achievements.grid = 5x10`（50 个） | 9x9 = 81 个 | 用户要求「尽最大保留原版玩法」，原版 `achievementsTable` 的 81 条全部移植。代价记录在 §11：成就乘积 ×1.05 每个 = 终局 ×52，是 sim 排除项的一部分 |
| D11 内核源码复用 | `js/deductrium/`（21k 行编译产物里的 DOM-free 子集）+ `ATTRIBUTION.md` | 上游无 LICENSE 文件，但原作者 Hqak 已于 2026-11-01 授权复用；整目录仍可一键删除且不阻塞其余 12 层运行（适配器在无内核时退化为「只读」模式） |
| D12 检查 13 / 11 §3「成本阶梯跨 ≥6 个数量级」 | normal 层跨 **3–5** 个数量级 | 每层货币的自然上界由 requires 阶梯决定（`meta.best` 终局 ≈1e3–1e6）；照抄 6 个数量级会造出永远买不起的死升级。硬门 `D-COSTSPAN ≥3` 仍通过 |
| D13 `balance-defaults.staticLayer`（static 层用引擎公式即可） | `ord` 覆盖 `getResetGain() { return new Decimal(1) }` | base 10 / exp 1 的 static 层在 buy-max 下会一次算出 12 级 —— 终局会在单次点击里被跨过（07 F15 的失败形态）。钉死「一次破闸 = 一级序数」既修掉它，也正是原版「交一次闸费，开一段路」的语义 |
| D14 `04` 的组件用法 / 原版 cmd.ts 的 FSCmd | 不打包 `fs/cmd.js`、`fs/gui.js`，改由 `js/ded/commands.js` 按 `src/fs/cmd.ts:226-251` 的分派表重写命令层，调用同一批内核方法 | 上游命令层与 FSGui 是 3000 行 DOM 代码；移植它等于把原版界面塞进 TMT 的 tab 里。命令集（d / meta / m / mm / inln / entr / hyp / del / rename / clear / pop + 快速元规则语言）逐条保留，逻辑仍在内核 |
| D15 原版五个 FormalSystem 实例（`initFormalSystem` + `#switchsys`） | 只保留一个命题系统，采用某条公理时把该理论的公理注册进同一系统 | 五个实例的构造代码在未移植的 `fs/gui.js` 里；一个系统 + 逐条注册保留了「公理越多、能用的规则越多」的手感，且省掉 5 份状态同步 |
| D16 原版 WASD = 相机切向移动（`hy/gui.ts:104-119`） | 六个方向键直接对应 {6,4} 的六条邻边（w=深入、a/s/d=其余子边、e=退回父格、q=q=4 旋转边） | 本移植用 TMT 的 `grid` 渲染邻域而不是 canvas 拖拽；六条边才是双曲铺嵌真正的邻接关系，WASD 只是原版在画布上的近似 |
| D17 `TTGui` 的 19 个战术与 17 个黑盒测试 | `js/ded/types.js` 重写非 DOM 部分；黑盒测试按 `src/tt/gui.ts:835-958` 逐条转写（未转写的在代码里注明，返回 false 而不是伪造通过） | TTGui 同样是 DOM 类；战术名、解锁集合、axiom 开关语义逐项保留，界面由 tabFormat 提供 |
| D18 原版地图的三处保真缺陷 | 原样保留，不修 | 用户要求「尽最大保留原版玩法」：两个格子的文字让它们在标价下不可达，一个奖励格会自我重置。修掉它们等于改玩法；§12 里会记下观察结果 |
| D19 引擎的 Export 按钮是 Latin1 (`btoa`)，双语 `player` 里有中文会抛 InvalidCharacterError（07 F23） | 已修：`js/text.js` 尾部重定义 `exportSave`/`importSave` 为 UTF-8 安全版本（`btoa(unescape(encodeURIComponent(...)))`），导入仍兼容旧的 Latin1 载荷 | 不改引擎文件；设置面板按钮自动走新函数。导入失败仍静默返回，与引擎一致 |
| D20 §4 表写 `ord` 的 `base = 10`（第 12 级 4e23） | `TUNING.staticBase.ord = 2`（第 12 级 8.2e15） | §11 #6 的产出上限 1e18 是实测后加的；base 10 会让终局不可达。破闸次数（12）不变，只是价格阶梯放缓 |
| D21 §8 原计划「无界层用 softcap + 效果 20 级」 | 效果改 6 级封顶；normal 层收益用 `softcapPower = 0` 硬顶；全局产出上限 1e18 | 实测见 §11 #2–#6：原参数在 20 分钟内把产出推到 1e92。所有数字都在 `js/tuning.js`，面板会写出「6 级封顶」和触顶提示，玩家看到的与实际生效的一致 |

Numbers noticed while playing enter this table first — as a row, then a `js/tuning.js` constant, then a sim re-run. A layer-file literal edited mid-play is a §10 violation, not a fix.

## 11. Stage-6 measured retune (authoritative — only if the measurement contradicted the brief)

Run: `node tools/simulate.js . --click 60 --dt {0.5,1,2} --max-hours 24`（`--click 1` 的首次运行把 row0 每秒重置一次，导致上层永远等不到 1e3 推理素；60 s 是贴合「攒钱→按重置」的节流，也是手册 §6 要求的「用 click 锚定总量」）。

| # | Finding (measured) | Root cause | Fix, and where the constant lives |
|---|---|---|---|
| 1 | 静态公理层一按就跳到 29 层（`hott=29`，上限 6） | `canBuyMax()` 打开后引擎一次买满可负担的所有层，`canReset()` 只在按下前检查上限 | 5 个公理层改 `canBuyMax() { return false }`，一按一层（`js/layers/{fol,pea,zfc,num,hott}.js`）；`ord` 原本就钉死 1 |
| 2 | 45 秒产出 5e43、19 分钟 e92 | K3 交叉乘数写成 `1 + k × 另一层.points`：meta↔typ、zfc↔num↔typ 互为乘数，形成乘性环 | 新增 `tunCross(points, k) = 1 + k·log10(points+1)`，替换 35 处线性交叉项（`js/tuning.js`，mod.js + 各层） |
| 3 | 自缩放升级把点数再喂回全局产出（e45） | `points^0.4` 的输入点数随产出爆炸 | 新增 `tunSelf(points,p) = (min(points, selfScaleCap)+1)^p`，`selfScaleCap=100`（`js/tuning.js`） |
| 4 | 每分钟新增一项就 ×1.2^k 无限叠（sim 越过 `purchaseLimit`） | 通用买可购物策略直接调 `buy()`，绕过引擎的 `canBuyBuyable` 上限检查 | `tools/simulate.js` 的 `tryBuyBuyables` 增加 `purchaseLimit` 检查（引擎在 `js/utils.js` 里本就有） |
| 5 | 单次重置可获得 1e11 级 | normal 层收益无硬顶，`softcapPower=0.5` 只做 sqrt 折中 | `TUNING.softcapPower: 0.5 → 0`：softcap 变成「每次重置的硬收益顶」（`js/tuning.js`） |
| 6 | 产出仍达 1e38，远高于 requires 上沿 4e12 | 层效果 × 升级乘数叠满后没有天花板，所有剩余层一 tick 全解锁 | 新增 `TUNING.prodCap = 1e18` 并让 `getPointGen()` 返回 `min(gain, prodCap)`；`ord` 第 12 级 8.2e15 < 上限，终局仍然成立。上限在 ded 面板显示（`DED_prodCapLine`） |
| 7 | `ord` 第 12 级原价 4e23（base 10）高于产出上限 → 终局不可达 | 底数与产出上限不匹配 | `TUNING.staticBase.ord: 10 → 2`；第 12 级 = 8.2e15（D20） |
| 8 | 公理每条 ×3 → 29 条 = 6.9e13，单层就压过整条阶梯 | 公理乘数与 5 个上限层叠加 | `TUNING.effectBase.axiom: 3 → 1.2`（29 条 ≈ ×197） |
| 9 | 无界层 20 级 ×2 = 每层 ×1e6，6 层 = 1e36 | 效果等级上限过高 | `TUNING.effectLevelCap: 20 → 6`（每层 ×64） |
| 10 | 层收益 20 级即饱和，后期升级全无意义 | 同上 | 同上；效果在面板里写「6 级封顶」，与 sim 读到的是常量 |
| 11 | 首次 `ord` 重置后产出变 `NaN`，玩家永久卡死（审计后复测发现） | 本仓库的 break_eternity 里 `log10(0)` 返回 **NaN**，`NaN.max(0)` 仍是 NaN；`geo.points = 0` 时 `geo.points.log10().max(0)` 污染了 `macProdMult`（mac m3）以及 ded u14 / lit u33 / lit b11 的读数 | 五处统一改 `geo.points.max(1).log10()`（`js/mod.js`、`js/layers/{ded,lit,mac}.js`）；等于 0 时乘数为 1，语义不变 |

**实测时间线**（下界，全部在修复 `points` keep-list、挑战 `onEnter`、`log10(0)` 之后重测；`--budget 150–300 s` 让 dt 0.5/1 跑完）：

| dt | 首次购买 | 首次重置（ded / geo / meta / fol / lit / pea / mac / zfc / num / typ / hott / ord） | 首次达到 1e18/s | `isEndgame()` |
|---|---|---|---|---|
| 0.5 s | 4 s | 60 / 172 / 494.5 / 723 / 752.5 / 845 / 845 / 855 / 857 / 858.5 / 894.5 / 898 s | 930.5 s | **0.43 h** |
| 1 s | 4 s | 60 / 172 / 495 / 724 / 754 / 980 / 989 / 1034 / 1039 / 1044 / 1073 / 1074 s | 1115 s | **0.48 h** |
| 2 s | 4 s | 60 / 172 / 490 / 732 / 758 / 792 / 792 / 792 / 800 / 800 / 818 / 828 s | 858 s | **0.41 h** |

三档总量相差 < 20% ⇒ 测的是游戏而不是步长。修复前表里的 0.31–0.35 h 是在「`points` 被 keep-list 保下来、深层重置并不真的清空货币」的 bug 状态下测到的；真正清空后各层仍要靠重复购买/里程碑立刻恢复，所以量级不变。sim 排除项（成就 ×52、命令行演绎、地图奖励、clickable）使它成为**下界**；乘上手册给的 ×4 经验系数，真实首周目约 **1.4–1.9 h**。§7 的 9–14 h 手工估计被这组实测取代：真正的时间成本在 §4b 的主动内容（写证明、走地图、解谜），不在数字曲线。若之后要把数字段拉长，先给 ord 以上再加一层 requires（保持 §4 的行节奏），不要回头改层内常量。

## 12. Browser-verification fixes (Stage 6.5)

浏览器：`node tools/serve.js 8395 .` → `http://127.0.0.1:8395/`（Chromium，`__bootErrors` 全程为 `[]`）。

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | 载入即抛两次 `t.resetGain.add is not a function`（`tunNormalNextAt`） | 引擎把 `tmp[layer]` 分几趟填；第一次问 `nextAt` 时 `resetGain` 还是占位的 `{}` | `tunNormalNextAt`/`tunNormalGain` 全部经 `tunDec()` 取数；`softcapPower = 0` 时 `nextAt` 返回 `Infinity`（硬顶上没有下一级） |
| 2 | 命令行输入框无法执行任何命令 | 引擎 `text-input` 只在 change 时写 `player.ded.cmd`（components.js:558），没有 submit 事件；ded 的 tabFormat 也没渲染 clickables | ded 增加 clickable 16「执行」→ `DED_exec(player.ded.cmd)`；tabFormat 增加 `["clickables", [1]]`，五个断言工具（#nf/#rp/#crp/check/unwrap）同时可见 |
| 3 | T2 双语没有切换入口 | `setChineseMode` 从未被 UI 调用 | `sts` 侧层底部加语言按钮（`DED_langButton`），写入 localStorage 后重载；已实测 zh↔en 双向切换，地图文字走内核 `langMgr` |
| 4 | 英文模式下累计读数以全角「）」结尾 | `displayThings` 的右括号写在 `L()` 外面 | 改为 `L("）", ")")` |
| 5 | 浏览器验证的其它项 | — | tab 切换 16 个全部无异常；树渲染 21 个节点；`a1 A B` → 定理表两行、`proved` 递增；收束按钮 → `ded=4`、根货币归零、定理表清空；移动 `q` 成功（`1,1 → 1,2,1`，visited 3）；`save()` → 重载后 `ded=4` 保留；`DED_utf8ToB64`/`DED_b64ToUtf8` 往返一致，`exportSave()` 不抛错 |
| 6 | 地图奖励文本「元规则#cdt」同时解锁了 `c` 与 `>`；「符号 mp」一个符号都没记下 | 分发器用子串匹配，`dt` 是 `cdt` 的后缀；符号正则只允许引号紧贴「符号」，不容忍空格 | `DED_dispatchKeywords` 按 key 长度从长到短匹配并消费已匹配片段；符号正则改为 `/符号\s*[“"‘']?([^\s”"’'()（）]+)/`（`js/ded/adapter.js`）。`tools/adapter_test.js` 加四条断言 |
| 7 | 第一块带奖励的地图格直接抛异常（`onPurchase` 读 `fastmetarules.indexOf`） | `ded.startData()` 没声明 `fastmetarules`/`symbols`/`lastRule`/`notes`，归档旧存档时也缺这些字段 | 补进 startData 并加入 `tools/audit_fields.js` 的扫描范围：「every referenced layer field is declared」 |
| 8 | 深层重置（geo 以上）不清空下层货币，整条阶梯可以免费点完 | 12 个 keep-list 都写了 `"points"`；`layerDataReset` 只保留 keep 列表里的字段 | 从全部 keep-list 移除 `"points"`，货币随层重置归零（浏览器实测 ord 重置后 geo/meta/fol/ded 均为 0） |
| 9 | 挑战一进入就是已完成（goal 是本层货币），退出后进度标记残留 | TMT 进入挑战时 force 重置不会清空**当前层自己的** points | 每个挑战加 `onEnter` 把目标货币/计数器归零（typ 用 `chalGoals`，ord 用 `chalBase` 差值）；ded 挑战额外 `DED_resetWorkspace()` |
| 10 | Info 页快捷键列表显示 `function () { return L(...) }` 源码；`d`（ded/geo）与 `m`（meta/mac）两个键被后加载的层覆盖，前者的快捷键实际上按不动 | 引擎只把字符串 `key.description` 直接插值（`systemComponents.js:147`，不会调用函数），`hotkeys` 全局表每个键只保留最后一个注册项 | 16 条 hotkey 描述全部改为加载期字符串 `L(zh,en)`（语言切换本来就整页 reload）；ded 收束改 `c`、meta 整理改 `r`，keys 现为 a/c/d/f/g/h/l/m/n/o/p/r/s/t/w/z 且不占用 q/e 两个六方向 |

Feel proxies, per layer (handbook 14 §5.3 — 观察，不是调参信号):

| Layer | First press (s) | Clicks to first upgrade | Next action named on screen? |
|---|---|---|---|
| ded | 10（攒到 requires=10） | 0（u11 成本 1，开局立刻可买） | 「Close the proof for N deductions」+ 命令提示行 |
| geo | ~60（1e3 推理素） | 1–2 | 需要 1e3 推理素 + 走过 4 格；行走盘与闸价在面板上 |
| meta+ | 由 §11 实测曲线给出（5–15 分钟层） | ≤3 | 每层按钮文本写出下一次采纳的价格 |

Final gates: static **90 PASS / 76 WARN / 0 FAIL**（WARN 逐条记在 §9.1）；i18n `no js/lang/ directory`（T2 用 `L()`，检查器按设计跳过）；smoke **0 FAIL / 0 WARN**；sim 三档 `0.41–0.48 h`（下界）。
