# Attribution — the bundled kernel in this directory

`kernel.js` is a mechanical conversion of source from **Deductrium** by **Hqak** (GitHub: [`wxyhly/deductrium`](https://github.com/wxyhly/deductrium)), rebuilt by [`tools/build_kernel.js`](../../tools/build_kernel.js) from the author's compiled ES modules.

## Licence status — author permission obtained

The author of Deductrium, **Hqak**, has granted this port permission to reuse the kernel. The porter (**chenf888**) recorded that authorisation on 2026-11-01; the exact scope and any conditions are those agreed between Hqak and the porter.

The upstream repository still publishes no LICENSE file, so this directory carries no open-source licence and the port asserts no licence of its own over the reused material. The repository's `Prestige-tree-license` file covers The Modding Tree engine only and says nothing about Deductrium.

If the permission is ever withdrawn, delete this directory. Nothing else in the game depends on it at build time: every reader in `js/ded/adapter.js`, `js/ded/commands.js` and `js/ded/types.js` checks for the kernel and degrades to a read-only panel, and all twelve prestige layers remain playable. A single `rm -rf js/deductrium` is a complete removal.

## What was taken, and what was not

- **Taken (27 modules, 14.5k lines):** `fs/` astparser, astmgr, assertion, proof, metarule, metainln, formalsystem, initial, complete, savesparser; `hy/` map, maploader, map2-free subset of tiling/group/algebra/hworld/ordinal/savesparser/localdraw; `tt/` core, astparser, assist, check, initial, HoTT, savesparser; `lang.js` (the zh↔en dictionary, which is why the port is bilingual for free inside kernel panels).
- **Not taken:** every DOM module — `fs/gui.js`, `fs/cmd.js`, `hy/gui.js`, `hy/HyperGui.js`, `tt/gui.js`, `game.js`, `saveload.js`, `itemdragger.js`. The Modding Tree renders the interface, so `js/ded/commands.js` reimplements only the command dispatch table (against the same kernel calls, mirroring `src/fs/cmd.ts:226-251`) and `js/ded/types.js` only the non-DOM part of `TTGui`.
- **Kept verbatim:** `hy/map.js`'s `mapData` — all 1612 placement instructions, 2096 tiles, 500 named tiles, including the three fidelity bugs the original ships (two tiles whose text makes them unreachable at their stated price, and a reward tile that re-arms itself). They are preserved rather than fixed, because "尽最大保留原版玩法" was the brief.

## Transformations applied, in order

1. `import {a,b} from "./x.js"` → `const {a,b} = __dedReq("<x>")` at the head of the module factory.
2. `export class/function/const` → the same declaration with `export ` stripped; names collected into `Object.assign(__exp, {…})` at the tail.
3. Each module runs inside its own function scope, so the six names that collide across modules in a flat script (`ASTParser` in `fs/` and `tt/`, `SavesParser` ×3, `Core` and `wrapVar`/`wrapApply` in `tt/core` and `tt/newcore`, `mapData` in `hy/map` and `hy/map2`) stay distinct.
4. Five import edges that form two import cycles are re-bound **lazily** — `(__dedReq("mod").NAME)` at the call site — because a destructured snapshot taken mid-cycle is `undefined` for the rest of the module's life. The cycles are `lang → hy/maploader → hy/ordinal → lang` and `fs/initial → fs/savesparser → fs/initial`; each crossing name (`blockMap`, `genOrdTiles`, `TRC`, `SavesParser`, `initFormalSystem`) is used only inside function bodies upstream, so call-time resolution is behaviour-preserving.
5. `//# sourceMappingURL` lines and the `.map` files were dropped; nothing else was edited.

## Original copyright

All code and text in `kernel.js`, including the Chinese game text and the `lang.js` translation table, is © its author Hqak. This port adds no claim of its own to that material.
