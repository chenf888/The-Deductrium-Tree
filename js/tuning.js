// Pacing constants for The Deductrium Tree. EVERY number that shapes time-to-goal lives here and
// is read by both the game and tools/simulate.js — a literal inside a layer file is a constant the
// simulator cannot see (handbook 14 §3.3). Ledger: design-brief.md §4 / §7 / §8 / §9 check 18.

var TUNING = {
    // economy root
    baseGen: 1,                    // 推理素/sec before any bonus
    initialStartPoints: new Decimal(10),        // matches modInfo.initialStartPoints
    tableSlots: 12,                // hard ceiling on live propositions feeding production (cap table §8)
    tableMultPer: 0.25,            // +25% production per proposition currently in the table
    theoremBurst: 5,               // 推理素 granted by one accepted deduction (µg in the original UI)
    gateRewardBase: 5,             // 推理素 from a $ reward tile, scaled by TUNING.rewardStep^row
    rewardStep: 1000,              // metric prefix per row: row1 tile pays 5 mg, row2 pays 5 g...

    // row pacing — brief §9 check 18: per-row time = REQ_STEP / OUTPUT_STEP = ×1.30 (band ×1.1–×1.6)
    REQ_STEP: 62.5,
    OUTPUT_STEP: 48,
    POS_STEP: 4,                   // within-row requires ratio between neighbouring positions
    rowRatios: { 1: 100, 2: 62.5, 3: 62.5, 4: 62.5 },   // row0→row1 sits on the band edge (deviation D1)

    requires: {
        ded: 10,
        geo: 1e3, meta: 4e3, fol: 1.6e4,
        lit: 1e6, pea: 4e6, mac: 1.6e7,
        zfc: 1e9, num: 4e9, typ: 1.6e10,
        hott: 1e12, ord: 4e12,
    },
    exponents: { ded: 0.5, geo: 0.5, meta: 0.333, lit: 0.25, mac: 0.25, typ: 0.4 },
    staticBase: { fol: 2, pea: 2, zfc: 2, num: 2, hott: 2, ord: 2 },
    softcap: { ded: 1e3, geo: 1e3, meta: 3e2, lit: 1e3, mac: 1e3, typ: 1e2 },
    // 0 makes the softcap a hard per-press gain ceiling: gain above it collapses to the cap.
    // Measured without it: one press of a normal layer yielded 1e11 levels and production hit e45.
    softcapPower: 0,

    // theme ceilings (brief §8): a cap is a fact about the theory, not a tuning knob
    caps: { fol: 5, pea: 5, zfc: 9, num: 4, hott: 6, ord: 12 },

    // layer effect bases — how much one unit of a layer's currency is worth
    effectBase: {
        ded: 1.5,     // ×1.5 production per deduction level
        geo: 2,       // ×2 per tile family secured
        meta: 2,
        lit: 2,
        mac: 2,
        typ: 2,
        axiom: 1.2,   // per adopted axiom in fol/pea/zfc/num/hott (retune §11: 3 detonated)
        ord: 2,       // per ordinal rung (retune §11: 10 made the endgame multiplier alone 1e12)
    },
    effectLevelCap: 6,             // uncapped layers saturate their ×base^n effect here (retune §11: 20 = ×1e6 per layer)
    selfScaleCap: 100,             // K2 upgrades read min(points, this): 100^0.5 = ×10 at the cap, never a runaway
    prodCap: 1e18,                 // hard ceiling on 推理素/sec — the last ordinal rung costs 8.2e15, so the
                                   // ladder still ends the game; without a ceiling the measured sim hit e38
    selfPowMax: 0.5,               // every self-scaling upgrade reads pow ≤ this (check 11)
    achMult: 1.05,                 // ×80 achievements ≈ ×49 endgame — deviation D10, a sim exclusion

    // automation ladder (brief §6) — thresholds are table-driven, never computed (07 F14)
    automation: {
        dedSafe: 5,                // ded.m0: makes the axiom counters non-destructive
        metaPassive: 3,            // meta.m0: ded passiveGeneration
        litAutoBuy: 5,             // lit.m0: autoBuyable on lit.11
        geoPassive: 12,            // geo.m1: geo passiveGeneration
        peaAuto: 3,                // pea.m2: fol/pea autoPrestige
        macAutoUpg: 10,            // mac.m4: autoUpgrade across four layers
        numAuto: 7,                // zfc.m4: num/hott autoPrestige
    },

    endgameRungs: 12,              // isEndgame(): ord floors
    endgameHott: 6,                // isEndgame(): all HoTT constructors
    offlineLimitHours: 1,
}

// --- accessors the layers and the simulator both call -----------------------------------------
function tunRequires(layer) { return new Decimal(TUNING.requires[layer]) }
function tunCap(layer) { return TUNING.caps[layer] }
function tunSoftcap(layer) { return TUNING.softcap[layer] ? new Decimal(TUNING.softcap[layer]) : new Decimal("1e7") }
function tunStaticBase(layer) { return new Decimal(TUNING.staticBase[layer] || 2) }
function tunExponent(layer) { return TUNING.exponents[layer] === undefined ? 0.5 : TUNING.exponents[layer] }

// Price of the (n+1)-th floor of a capped static counter layer, in 推理素.
function tunAxiomPrice(layer, n) {
    return tunRequires(layer).times(Decimal.pow(tunStaticBase(layer).toNumber(), n))
}

// The price the engine will actually charge. On STATIC layers gainMult multiplies the next cost
// (game.js getNextAt: extraCost × gainMult × requires) — the opposite sense from a normal layer —
// so "cheaper axioms" upgrades set gainMult to 0.5. The engine's own tmp[layer].nextAt already has
// this applied; use it when present, otherwise rebuild the same product (headless harness).
function tunStaticPrice(layer) {
    var t = tmp[layer]
    if (t && t.nextAt && typeof t.nextAt.lt === "function") return t.nextAt
    var price = tunAxiomPrice(layer, player[layer].points)
    var g = (typeof layers !== "undefined" && layers[layer]) ? layers[layer].gainMult : undefined
    if (typeof g === "function") { try { price = price.times(g.call(layers[layer])) } catch (e) { } }
    return price
}

// Hard ceiling for a capped layer's counter; 0 means "not a capped layer".
function tunIsCapped(layer) { return TUNING.caps[layer] !== undefined }

// Cross-layer (K3) multiplier, log-shaped on purpose. A linear "× otherLayer.points" edge looks
// harmless in a table but turns any two-way pair (meta↔typ, zfc↔num↔typ) into a multiplicative
// cycle: each press multiplies the other layer's count, which multiplies this one's next gain.
// The Stage-6 simulator measured exactly that — linear edges detonated production to 10^10^79 by
// 20 minutes. log10 keeps "more of X helps" without the runaway.
function tunCross(points, k) {
    return new Decimal(1).add(new Decimal(points).add(1).log10().times(k))
}

// Self-scaling (K2) multiplier: (min(points, selfScaleCap)+1)^p. The clamp is what keeps the
// "layer level → global production → larger level" loop from compounding without bound; measured
// at selfScaleCap absent, this game reached 10^92 income by 19 minutes.
function tunSelf(points, p) {
    return Decimal.min(new Decimal(points), TUNING.selfScaleCap).add(1).pow(p)
}

// Can a capped static layer adopt its next floor? Currency gate + theme ceiling, shared by every
// axiom layer and by tools/simulate.js (which calls canReset() through canPrestige()).
function tunStaticCanReset(layer) {
    if (typeof player === "undefined" || !player[layer]) return false
    if (player[layer].points.gte(tunCap(layer))) return false
    return player.points.gte(tunStaticPrice(layer))
}

// --- shared prestige formulas --------------------------------------------------------------------
// The engine fills tmp[layer] over several passes, so a hook can be asked for nextAt while
// tmp[layer].resetGain is still the initial `{}` (measured in the browser: tunNormalNextAt threw
// "t.resetGain.add is not a function" twice on load). Coerce every field before using it.
function tunDec(v, fallback) {
    if (v !== null && v !== undefined && typeof v.add === "function") return v
    if (typeof v === "number") return new Decimal(v)
    return fallback
}

// The engine's own normal-type gain, mirrored exactly (03 §3) so custom layers and the headless
// harness/simulator compute the same number without depending on the engine's global helpers.
function tunNormalGain(layer) {
    var t = tmp[layer]
    var base = tunDec(t.baseAmount, new Decimal(0))
    var req = tunDec(t.requires, new Decimal(0))
    if (req.lte(0) || base.lt(req)) return new Decimal(0)
    var gain = base.div(req).pow(tunDec(t.exponent, new Decimal(0.5)))
        .times(tunDec(t.gainMult, new Decimal(1)))
        .pow(tunDec(t.gainExp, new Decimal(1)))
    var cap = tunDec(t.softcap, new Decimal("e1e7"))
    var power = tunDec(t.softcapPower, new Decimal(0.5))
    if (gain.gte(cap)) gain = gain.pow(power).times(cap.pow(new Decimal(1).sub(power)))
    return gain.times(tunDec(t.directMult, new Decimal(1))).floor().max(0)
}

// The inverse (03 §3, "normal next cost"), softcap included, so the button can never lie.
function tunNormalNextAt(layer) {
    var t = tmp[layer]
    var cap = tunDec(t.softcap, new Decimal("e1e7"))
    var power = tunDec(t.softcapPower, new Decimal(0.5))
    var req = tunDec(t.requires, new Decimal(0))
    var grow = tunDec(t.gainExp, new Decimal(1))
    var mult = tunDec(t.gainMult, new Decimal(1))
    var direct = tunDec(t.directMult, new Decimal(1))
    var exp = tunDec(t.exponent, new Decimal(0.5))
    if (req.lte(0) || exp.lte(0) || grow.lte(0) || mult.lte(0) || direct.lte(0)) return new Decimal(Infinity)

    var target = tunDec(t.resetGain, new Decimal(0)).add(1)
    if (target.gte(cap)) {
        // a hard per-press cap (softcapPower 0) has no finite next cost — the ceiling is the last level
        if (power.lte(0)) return new Decimal(Infinity)
        target = target.div(cap.pow(new Decimal(1).sub(power))).pow(new Decimal(1).div(power))
    }
    target = target.div(direct).pow(new Decimal(1).div(grow)).div(mult)
    return req.times(target.pow(new Decimal(1).div(exp))).max(req)
}
