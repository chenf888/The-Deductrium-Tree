# The Deductrium Tree

A port of **[Deductrium](https://github.com/wxyhly/deductrium)** by **Hqak** into **[The Modding Tree](https://github.com/Acamaeda/The-Modding-Tree)** v2.7. Original game logic, map data and text are reused with credit **under the author's permission** (granted by Hqak, recorded 2026-11-01); see `js/deductrium/ATTRIBUTION.md` for the current status. Deleting that one directory removes all reused code without breaking the tree.

Author field: `chenf888 (port) · Hqak (original Deductrium)`.

## What this is

Deductrium is a Hilbert-style formal-system puzzle game: you walk a hyperbolic {6,4} tiling, pay 推理素 (Deductriums) at gates, and prove theorems by composing rules in a command box. This port keeps all of that and wraps it in a 12-layer prestige tree whose rows are the metric prefixes the original already used for its currency:

| row | threshold | layers |
|---|---|---|
| 0 | 10 | `ded` 演绎 — the command box, theorem table, rule table |
| 1 | mg (1e3 …) | `geo` 格位 (the map) · `meta` 元规则 · `fol` 命题公理 (5 axioms) |
| 2 | g (1e6 …) | `lit` 字面量 · `pea` 谓词公理 (5) · `mac` 宏 |
| 3 | kg (1e9 …) | `zfc` ZFC (exactly 9 axioms) · `num` 数论 (4) · `typ` 类型论 |
| 4 | T (1e12 …) | `hott` 同伦 (6) · `ord` 序数 — the consumable-reset endgame |
| side | — | `ach` 81 achievements · `sts` statistics · `sto` 8 chapters |

## Run it

Open `index.html` through any static server (a `file://` open blocks the mod files in some browsers):

```
node tools/serve.js .
```

The port has no build step at runtime. `js/deductrium/kernel.js` is generated from the original's compiled ES modules by `node tools/build_kernel.js <upstream-js-dir>`; the generated file is committed, so nothing is needed to play.

## Controls

- **Command box** (`ded` tab): type into the input, then press the green **run** button — the engine's text input has no Enter-submit, so Enter alone only commits the text. The five assertion buttons (`#nf`, `#rp`, `#crp`, `check`, `unwrap`) sit next to it. Commands: `d <rule> [condition rows] [values]`, a bare rule name, `meta <cdt|dt|idt|cvt|vt|et|q|c|f|prd|cmt|ifft|cpt>`, `m <pos> <name>` (record macro), `mm`, `inln`, `entr`, `hyp <proposition>` / `hyp pop`, `del`, `rename`, `pop`, `clear`. The fast-metarule token language (`v u c < > e # : ,`) is the kernel's own.
- **Axiom layers** (fol/pea/zfc/num/hott) charge their upgrades in Deductriums; adopt an axiom with the prestige button or its hotkey.
- **Language:** the button at the bottom of the Statistics side tab switches between English (default) and 中文 and reloads.
- **Hotkeys:** `d` close the proof (ded) · `g` re-project the manifold · `w/a/s/d` step the tiling's edges · `q` the q=4 rotation edge · `e` back to the parent tile · `t` type theory · `o` destruct a gate · `y` metarules · plus one per axiom layer. Hotkeys are suppressed while the command box has focus, so typing `d` never moves you.
- **Map:** click a neighbour in the grid, or use the walk pad. Six edges, because a {6,4} tiling has six neighbours (the original's WASD was a camera-relative approximation on its canvas).

## Development harness

Not part of the shipped game (never listed in `modFiles`):

```
node tools/smoke.js .        # load-time smoke: every mod file loads, hooks answer a fresh save
node tools/simulate.js .     # headless pacing sim (see design-brief.md §11 for the measured result)
node tools/adapter_test.js   # drives the kernel glue: world boot, 2096 tiles, walking, gates, commands
node tools/kernel_test.js    # kernel self-test: 27 modules, formal system, map, type theory
node tools/build_kernel.js   # regenerate js/deductrium/kernel.js from the upstream sources
```

Static rule checker (from the skill, outside this folder):
`node ../TMT-Skill/scripts/static_checks.js .`

## Layout

```
js/mod.js               economy root: getPointGen, isEndgame, display lines, modFiles
js/tuning.js            every pacing constant + the shared prestige formulas (game and sim read it)
js/text.js              T2 bilingual L(zh,en), the µg/mg/g/kg/T formatter, chrome lines
js/deductrium/          the ported kernel (see ATTRIBUTION.md) — deletable
js/ded/adapter.js       world + formal-system glue, rewards, gates, save mirroring
js/ded/commands.js      the command box, rendered as plain HTML
js/ded/types.js         type-theory glue (Core / tactics / puzzle tests)
js/layers/*.js          the 12 main layers + 3 side layers, bottom row first
tools/                  harnesses (not shipped)
design-brief.md         the Stage-2 design document this build was generated from
```

## Licence

- Engine: The Modding Tree, see `LICENSE` and `Prestige-tree-license`.
- Original game: © Hqak, reused with credit under the author's permission (granted 2026-11-01; details in `js/deductrium/ATTRIBUTION.md`).
- Port code (`js/layers/*`, `js/ded/*`, `js/tuning.js`, `js/text.js`, `tools/*`): follow whichever licence the port is published under; it adds no claim over Hqak's material.
