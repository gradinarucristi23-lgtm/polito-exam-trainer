/* Chemistry (PoliTo, 1st year) — multiple-choice generator: 5 options, all values computed. */
(function (G) {
'use strict';
const { rnd, Fr, F, m, mk, opt, pickByLevel } = G.Core; const r = String.raw;
const mk5 = (topic, L, q, right, wrongs, sol, o = {}) => mk(topic, L, q, right, wrongs, sol, { ...o, n: 5 });
const ce = s => m(r`\ce{` + s + '}');

/* ---------------- periodic table data ---------------- */
// Z sym mass period group name
const ELS = `1 H 1.008 1 1 hydrogen|2 He 4.003 1 18 helium|3 Li 6.94 2 1 lithium|4 Be 9.012 2 2 beryllium|5 B 10.81 2 13 boron|6 C 12.01 2 14 carbon|7 N 14.01 2 15 nitrogen|8 O 16.00 2 16 oxygen|9 F 19.00 2 17 fluorine|10 Ne 20.18 2 18 neon|11 Na 22.99 3 1 sodium|12 Mg 24.31 3 2 magnesium|13 Al 26.98 3 13 aluminium|14 Si 28.09 3 14 silicon|15 P 30.97 3 15 phosphorus|16 S 32.06 3 16 sulfur|17 Cl 35.45 3 17 chlorine|18 Ar 39.95 3 18 argon|19 K 39.10 4 1 potassium|20 Ca 40.08 4 2 calcium|21 Sc 44.96 4 3 scandium|22 Ti 47.87 4 4 titanium|23 V 50.94 4 5 vanadium|24 Cr 52.00 4 6 chromium|25 Mn 54.94 4 7 manganese|26 Fe 55.85 4 8 iron|27 Co 58.93 4 9 cobalt|28 Ni 58.69 4 10 nickel|29 Cu 63.55 4 11 copper|30 Zn 65.38 4 12 zinc|31 Ga 69.72 4 13 gallium|32 Ge 72.63 4 14 germanium|33 As 74.92 4 15 arsenic|34 Se 78.97 4 16 selenium|35 Br 79.90 4 17 bromine|36 Kr 83.80 4 18 krypton|37 Rb 85.47 5 1 rubidium|38 Sr 87.62 5 2 strontium|39 Y 88.91 5 3 yttrium|40 Zr 91.22 5 4 zirconium|41 Nb 92.91 5 5 niobium|42 Mo 95.95 5 6 molybdenum|43 Tc 98 5 7 technetium|44 Ru 101.07 5 8 ruthenium|45 Rh 102.91 5 9 rhodium|46 Pd 106.42 5 10 palladium|47 Ag 107.87 5 11 silver|48 Cd 112.41 5 12 cadmium|49 In 114.82 5 13 indium|50 Sn 118.71 5 14 tin|51 Sb 121.76 5 15 antimony|52 Te 127.60 5 16 tellurium|53 I 126.90 5 17 iodine|54 Xe 131.29 5 18 xenon|55 Cs 132.91 6 1 caesium|56 Ba 137.33 6 2 barium|57 La 138.91 6 3 lanthanum|72 Hf 178.49 6 4 hafnium|73 Ta 180.95 6 5 tantalum|74 W 183.84 6 6 tungsten|75 Re 186.21 6 7 rhenium|76 Os 190.23 6 8 osmium|77 Ir 192.22 6 9 iridium|78 Pt 195.08 6 10 platinum|79 Au 196.97 6 11 gold|80 Hg 200.59 6 12 mercury|81 Tl 204.38 6 13 thallium|82 Pb 207.2 6 14 lead|83 Bi 208.98 6 15 bismuth|84 Po 209 6 16 polonium|85 At 210 6 17 astatine|86 Rn 222 6 18 radon|87 Fr 223 7 1 francium|88 Ra 226 7 2 radium|89 Ac 227 7 3 actinium`
  .split('|').map(s => { const [Z, sym, M, per, grp, ...nm] = s.split(' '); return { Z: +Z, sym, M: +M, per: +per, grp: +grp, name: nm.join(' ') }; });
const EL = Object.fromEntries(ELS.map(e => [e.sym, e]));
const BYZ = Object.fromEntries(ELS.map(e => [e.Z, e]));
const IE = { H: 1312, He: 2372, Li: 520, Be: 899, B: 801, C: 1086, N: 1402, O: 1314, F: 1681, Ne: 2081, Na: 496, Mg: 738, Al: 578, Si: 787, P: 1012, S: 1000, Cl: 1251, Ar: 1521, K: 419, Ca: 590, Ga: 579, Ge: 762, As: 947, Se: 941, Br: 1140, Kr: 1351, Rb: 403, Sr: 550, I: 1008, Cs: 376, Ba: 503 };
const EN = { H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.00, Ga: 1.81, Ge: 2.01, As: 2.18, Se: 2.55, Br: 2.96, Rb: 0.82, Sr: 0.95, I: 2.66, Cs: 0.79, Ba: 0.89 };
const RAD = { Li: 152, Be: 112, B: 85, C: 77, N: 75, O: 73, F: 72, Na: 186, Mg: 160, Al: 143, Si: 118, P: 110, S: 103, Cl: 99, K: 227, Ca: 197, Rb: 248, Sr: 215, Cs: 265, Ba: 222, Br: 114, I: 133, Se: 117, As: 120 };
const NA = 6.022e23, R_ATM = 0.0821, R_SI = 8.314, Hpl = 6.626e-34, Cl_ = 2.998e8, FARADAY = 96485, ME = 9.109e-31, RH_J = 2.18e-18;

/* ---------------- formulas, molar masses, balancing ---------------- */
function parseFormula(f) {
  let i = 0; f = f.replace(/\(([slgaq]+)\)$/, '');
  const num = () => { let s = ''; while (i < f.length && /[0-9]/.test(f[i])) s += f[i++]; return s ? +s : 1; };
  const group = () => { const c = {}; while (i < f.length) { const ch = f[i];
      if (ch === '(') { i++; const inner = group(); i++; const n = num(); for (const k in inner) c[k] = (c[k] || 0) + inner[k] * n; }
      else if (ch === ')') break;
      else if (/[A-Z]/.test(ch)) { let s = ch; i++; while (i < f.length && /[a-z]/.test(f[i])) s += f[i++]; const n = num(); c[s] = (c[s] || 0) + n; }
      else i++; }
    return c; };
  return group();
}
const MM = f => Object.entries(parseFormula(f)).reduce((s, [e, n]) => s + EL[e].M * n, 0);
const mmTex = f => sig(MM(f), 4);
function bg(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; }
function balance(reac, prod) {
  const sp = [...reac, ...prod], comps = sp.map(parseFormula), nC = sp.length;
  const els = [...new Set(comps.flatMap(c => Object.keys(c)))];
  const M = els.map(e => sp.map((s, j) => F((comps[j][e] || 0) * (j < reac.length ? 1 : -1))));
  const piv = []; let row = 0;
  for (let col = 0; col < nC && row < M.length; col++) {
    let p = row; while (p < M.length && M[p][col].isZero()) p++; if (p === M.length) continue;
    [M[row], M[p]] = [M[p], M[row]]; const lv = M[row][col]; M[row] = M[row].map(x => x.div(lv));
    for (let k = 0; k < M.length; k++) if (k !== row && !M[k][col].isZero()) { const f = M[k][col]; M[k] = M[k].map((x, j) => x.sub(f.mul(M[row][j]))); }
    piv.push(col); row++;
  }
  const free = []; for (let j = 0; j < nC; j++) if (!piv.includes(j)) free.push(j);
  if (free.length !== 1) return null;
  const x = Array(nC).fill(F(0)); x[free[0]] = F(1); piv.forEach((pc, ri) => { x[pc] = M[ri][free[0]].neg(); });
  let l = 1n; x.forEach(v => { l = l * v.d / bg(l, v.d); }); let ints = x.map(v => v.n * (l / v.d)); let g = 0n; ints.forEach(v => { g = bg(g, v); }); ints = ints.map(v => v / g);
  if (ints.every(v => v < 0n)) ints = ints.map(v => -v); if (!ints.every(v => v > 0n)) return null;
  return ints.map(Number);
}
function eqTex(reac, prod, co, arrow = '->') {
  const t = (f, c) => (c === 1 ? '' : c + ' ') + f;
  return reac.map((f, i) => t(f, co[i])).join(' + ') + ` ${arrow} ` + prod.map((f, i) => t(f, co[reac.length + i])).join(' + ');
}

/* ---------------- numbers ---------------- */
function sig(x, s = 3) {
  if (x === 0) return '0'; const ax = Math.abs(x);
  if (ax >= 1e-3 && ax < 1e5) { const t = Number(x.toPrecision(s)); const d = Math.max(0, s - 1 - Math.floor(Math.log10(Math.abs(t)))); return t.toFixed(d); }
  let e = Math.floor(Math.log10(ax)); let mt = Number((x / 10 ** e).toPrecision(s)); if (Math.abs(mt) >= 10) { mt /= 10; e++; }
  return `${mt.toFixed(s - 1)}\\times 10^{${e}}`;
}
const U = u => (u ? r`\ \mathrm{` + u + '}' : '');
function numQ(topic, L, q, val, wrongVals, unit, sol, s = 3, extra = {}) {
  const allInt = Number.isInteger(val) && wrongVals.every(v => Number.isInteger(v));
  const f = v => { const o = opt(m((allInt ? String(v) : sig(v, s)) + U(unit)), v); o.minRel = extra.minRel ?? 0.035; return o; };
  const generic = [val * 2, val / 2, val * 10, val / 10, val * 1.5, val / 1.5, val * 3];
  const W = wrongVals.filter(v => typeof v === 'number' && isFinite(v)).map(f);
  return mk5(topic, L, q, f(val), W.concat(extra.noGeneric ? [] : generic.map(f)), sol, extra);
}
const T = t => t + 273.15;

/* ---------------- ions & compounds ---------------- */
const CATIONS = [['Li', 1, 'lithium'], ['Na', 1, 'sodium'], ['K', 1, 'potassium'], ['Ag', 1, 'silver'], ['NH4', 1, 'ammonium', true], ['Cu', 1, 'copper(I)'], ['Mg', 2, 'magnesium'], ['Ca', 2, 'calcium'], ['Ba', 2, 'barium'], ['Zn', 2, 'zinc'], ['Fe', 2, 'iron(II)'], ['Cu', 2, 'copper(II)'], ['Pb', 2, 'lead(II)'], ['Al', 3, 'aluminium'], ['Fe', 3, 'iron(III)'], ['Cr', 3, 'chromium(III)']];
const ANIONS = [['F', 1, 'fluoride'], ['Cl', 1, 'chloride'], ['Br', 1, 'bromide'], ['I', 1, 'iodide'], ['OH', 1, 'hydroxide', true], ['NO3', 1, 'nitrate', true], ['NO2', 1, 'nitrite', true], ['ClO4', 1, 'perchlorate', true], ['ClO3', 1, 'chlorate', true], ['ClO', 1, 'hypochlorite', true], ['MnO4', 1, 'permanganate', true], ['HCO3', 1, 'hydrogen carbonate', true], ['CN', 1, 'cyanide', true], ['O', 2, 'oxide'], ['S', 2, 'sulfide'], ['SO4', 2, 'sulfate', true], ['SO3', 2, 'sulfite', true], ['CO3', 2, 'carbonate', true], ['Cr2O7', 2, 'dichromate', true], ['PO4', 3, 'phosphate', true]];
const SIBLING = { nitrate: 'nitrite', nitrite: 'nitrate', sulfate: 'sulfite', sulfite: 'sulfate', chlorate: 'perchlorate', perchlorate: 'chlorate', hypochlorite: 'chlorite', carbonate: 'hydrogen carbonate', 'hydrogen carbonate': 'carbonate', oxide: 'peroxide', sulfide: 'sulfate', chloride: 'chlorate', 'iron(II)': 'iron(III)', 'iron(III)': 'iron(II)', 'copper(I)': 'copper(II)', 'copper(II)': 'copper(I)' };
function gcdN(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function salt(cat, an, nc, na) {
  if (nc == null) { const l = cat[1] * an[1] / gcdN(cat[1], an[1]); nc = l / cat[1]; na = l / an[1]; }
  const part = (s, n, poly) => (n === 1 ? s : (poly ? `(${s})${n}` : s + n));
  return part(cat[0], nc, cat[3]) + part(an[0], na, an[3]);
}
const saltName = (cat, an) => cat[2] + ' ' + an[2];

/* ---------------- electron configurations ---------------- */
const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p'];
const CAP = { s: 2, p: 6, d: 10, f: 14 };
const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe']];
function config(Z, charge = 0) {
  let e = Z; const c = {};
  for (const o of ORDER) { if (e <= 0) break; const k = Math.min(e, CAP[o[1]]); c[o] = k; e -= k; }
  if ([24, 29, 42, 47].includes(Z)) { const n = Z < 30 ? '4' : '5', d = Z < 30 ? '3d' : '4d'; c[n + 's'] -= 1; c[d] = (c[d] || 0) + 1; }
  if (charge > 0) { let rem = charge; const ord = Object.keys(c).filter(k => c[k] > 0).sort((a, b) => (+b[0] - +a[0]) || ('spdf'.indexOf(b[1]) - 'spdf'.indexOf(a[1]))); for (const k of ord) { const t = Math.min(rem, c[k]); c[k] -= t; rem -= t; if (!rem) break; } }
  if (charge < 0) { let add = -charge; for (const o of ORDER) { const room = CAP[o[1]] - (c[o] || 0); if (room > 0) { const t = Math.min(room, add); c[o] = (c[o] || 0) + t; add -= t; } if (!add) break; } }
  for (const k of Object.keys(c)) if (!c[k]) delete c[k];
  return c;
}
function unpaired(c) { let u = 0; for (const [k, e] of Object.entries(c)) { const orb = CAP[k[1]] / 2; u += e <= orb ? e : 2 * orb - e; } return u; }
function cfgTex(c, useCore = true) {
  const tot = Object.values(c).reduce((a, b) => a + b, 0);
  const keys = Object.keys(c).sort((a, b) => (+a[0] - +b[0]) || ('spdf'.indexOf(a[1]) - 'spdf'.indexOf(b[1])));
  let core = null; if (useCore) for (const [z, s] of NOBLE) { if (z >= tot) break; const ref = config(z); if (Object.entries(ref).every(([k, v]) => c[k] === v)) core = [z, s]; }
  const skip = core ? config(core[0]) : {};
  const parts = keys.filter(k => !(k in skip)).map(k => `${k}^{${c[k]}}`);
  return ((core ? `[\\mathrm{${core[1]}}]\\,` : '') + parts.join('\\,')) || '\\text{no electrons}';
}
const ionTex = (sym, q) => r`\ce{` + sym + (q === 0 ? '' : '^{' + (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '-') + '}') + '}';

/* =====================================================================
   TOPICS
   ===================================================================== */
const ISO = [[1, 1], [6, 12], [6, 13], [6, 14], [7, 14], [7, 15], [8, 16], [8, 18], [9, 19], [11, 23], [12, 24], [12, 26], [13, 27], [14, 28], [15, 31], [16, 32], [16, 34], [17, 35], [17, 37], [19, 39], [20, 40], [21, 45], [22, 48], [23, 51], [24, 52], [25, 55], [26, 56], [27, 59], [28, 58], [29, 63], [29, 65], [30, 64], [34, 80], [35, 79], [35, 81]];
function atom(L) {
  const kind = pickByLevel(L, [[1, 3, 'iso'], [2, 4, 'ion'], [3, 6, 'avg'], [1, 2, 'def']]);
  if (kind === 'iso' || kind === 'ion') {
    const [Z, A] = rnd.pick(ISO); const e = BYZ[Z];
    let q = 0; if (kind === 'ion') { const ions = { 3: 1, 11: 1, 12: 2, 13: 3, 19: 1, 20: 2, 26: rnd.pick([2, 3]), 29: rnd.pick([1, 2]), 30: 2, 8: -2, 9: -1, 16: -2, 17: -1, 35: -1, 7: -3, 15: -3, 25: 2, 27: 2, 28: 2, 24: 3, 21: 3, 22: 4, 23: 3, 34: -2, 1: -1, 6: 0, 14: 0 }; q = ions[Z] ?? 0; }
    const el = Z - q, n = A - Z, u = unpaired(config(Z, q));
    const st = (a, b, c) => opt(m(`${a};\\ ${b};\\ ${c}`), null, `${a}|${b}|${c}`);
    const sp = q === 0 ? `an element with ${m('Z=' + Z)} has ${m('A=' + A)}` : `the ion ${m(r`\ce{^{${A}}_{${Z}}${e.sym}` + (Math.abs(q) === 1 ? '' : '^{' + Math.abs(q)) + (q > 0 ? (Math.abs(q) === 1 ? '^+' : '+}') : (Math.abs(q) === 1 ? '^-' : '-}')) + '}')}`;
    return mk5('atom', L, `${q === 0 ? 'The isotope of an element with ' + m('Z=' + Z) + ' has ' + m('A=' + A) : 'Consider ' + sp}. Select the correct sequence: number of electrons; number of neutrons; number of unpaired electrons${q === 0 ? '' : ' (in the ion)'}.`,
      st(el, n, u), [st(Z, A, u), st(el, A, u), st(el, n, u === 0 ? 2 : 0), st(el, n, u + 2), st(Z + q, n, u), st(el, n - 1, u), st(el, A - el, u)],
      `Electrons ${m(`=Z${q === 0 ? '' : (q > 0 ? '-' : '+') + Math.abs(q)}=${el}`)}, neutrons ${m(`=A-Z=${n}`)}. Configuration ${m(cfgTex(config(Z, q)))} → ${m(u)} unpaired electron(s) (Hund's rule).`);
  }
  if (kind === 'avg') {
    const [sym, i1, m1, i2, m2] = rnd.pick([['Cl', 35, 34.969, 37, 36.966], ['B', 10, 10.013, 11, 11.009], ['Cu', 63, 62.930, 65, 64.928], ['Br', 79, 78.918, 81, 80.916], ['Ga', 69, 68.926, 71, 70.925], ['Li', 6, 6.015, 7, 7.016]]);
    const p = rnd.int(15, 85) + rnd.pick([0, 0.5]); const avg = (p * m1 + (100 - p) * m2) / 100;
    if (rnd.chance(0.5)) return numQ('atom', L, `An element ${m(r`\ce{${sym}}`)} has two isotopes: ${m(`^{${i1}}\\mathrm{${sym}}`)} (mass ${m(m1 + r`\ \mathrm{u}`)}, abundance ${m(p + r`\%`)}) and ${m(`^{${i2}}\\mathrm{${sym}}`)} (mass ${m(m2 + r`\ \mathrm{u}`)}). Its average atomic mass is`, avg, [(m1 + m2) / 2, ((100 - p) * m1 + p * m2) / 100, p * m1 / 100 + m2, m1 + m2 * (100 - p) / 100 - 0.2], 'u', `${m(r`\bar m=${p / 100}\cdot ${m1}+${(100 - p) / 100}\cdot ${m2}=${sig(avg, 5)}`)}`, 5, { noGeneric: true, minRel: 0.0015 });
    const x = (m2 - avg) / (m2 - m1) * 100;
    return numQ('atom', L, `${m(r`\ce{${sym}}`)} has isotopes of mass ${m(m1 + r`\ \mathrm{u}`)} and ${m(m2 + r`\ \mathrm{u}`)}, and average atomic mass ${m(sig(avg, 5) + r`\ \mathrm{u}`)}. The abundance of the lighter isotope is`, x, [100 - x, x / 2 + 25, 50, Math.min(99, x + 15)], r`\%`, `Solve ${m(r`x\,${m1}+(1-x)\,${m2}=${sig(avg, 5)}`)}: ${m(r`x=\frac{${m2}-${sig(avg, 5)}}{${m2}-${m1}}`)}.`, 3, { noGeneric: true, minRel: 0.05 });
  }
  const B = [[r`Isotopes of the same element have the same number of`, 'protons, but a different number of neutrons', ['neutrons, but a different number of protons', 'nucleons', 'protons and neutrons, but a different number of electrons', 'electrons and neutrons']],
    [r`The mass number ${m('A')} of a nuclide is`, 'the number of protons plus neutrons', ['the number of protons', 'the number of neutrons', 'the atomic mass in grams', 'the number of protons plus electrons']],
    [r`An atom that gains two electrons becomes`, 'an anion with charge −2', ['a cation with charge +2', 'an isotope with A increased by 2', 'an anion with charge +2', 'a neutral atom of the next element']]];
  const [q, a, w] = rnd.pick(B); return mk5('atom', L, q, a, w, 'Definition from the theory of atomic structure.');
}
function quantum(L) {
  const kind = pickByLevel(L, [[1, 2, 'E'], [2, 3, 'nu'], [3, 4, 'mol'], [4, 6, 'H'], [5, 6, 'dB']]);
  if (kind === 'E') { const lam = rnd.pick([250, 300, 350, 400, 450, 486, 500, 550, 589, 600, 656, 700]); const E = Hpl * Cl_ / (lam * 1e-9);
    return numQ('quantum', L, `The energy of a photon with wavelength ${m(lam + r`\ \mathrm{nm}`)} is (${m(r`h=6.626\times10^{-34}\ \mathrm{J\,s}`)}, ${m(r`c=3.00\times10^{8}\ \mathrm{m/s}`)})`, E, [Hpl * Cl_ / lam, Hpl * lam * 1e-9 / Cl_, E * 1e3, Hpl * Cl_ / (lam * 1e-6)], 'J', `${m(r`E=\frac{hc}{\lambda}=\frac{6.626\times10^{-34}\cdot 3.00\times10^{8}}{${lam}\times10^{-9}}`)} (remember to convert nm to m).`); }
  if (kind === 'nu') { const lam = rnd.pick([200, 300, 400, 500, 600, 700, 800]); const nu = Cl_ / (lam * 1e-9);
    return numQ('quantum', L, `The frequency of radiation with ${m(r`\lambda=${lam}\ \mathrm{nm}`)} is`, nu, [Cl_ / lam, lam * 1e-9 / Cl_, nu / 1e3], r`s^{-1}`, `${m(r`\nu=\frac{c}{\lambda}`)} with ${m('\\lambda')} in metres.`); }
  if (kind === 'mol') { const lam = rnd.pick([250, 300, 400, 450, 500, 600, 650]); const E = Hpl * Cl_ / (lam * 1e-9) * NA / 1000;
    return numQ('quantum', L, `The energy of one mole of photons of wavelength ${m(lam + r`\ \mathrm{nm}`)} is`, E, [E * 1000, E / NA, E / 1000, Hpl * Cl_ / (lam * 1e-9)], 'kJ/mol', `${m(r`E=N_A\frac{hc}{\lambda}`)}, then divide by ${m(1000)} to get kJ.`); }
  if (kind === 'H') { const nf = rnd.pick([1, 2, 2, 3]); const ni = nf + rnd.int(1, 3); const dE = RH_J * (1 / nf ** 2 - 1 / ni ** 2); const lam = Hpl * Cl_ / dE * 1e9;
    return numQ('quantum', L, `In the hydrogen atom an electron falls from ${m('n=' + ni)} to ${m('n=' + nf)} (${m(r`E_n=-\frac{2.18\times10^{-18}}{n^2}\ \mathrm{J}`)}). The wavelength of the emitted photon is`, lam, [Hpl * Cl_ / (RH_J * (1 / nf - 1 / ni)) * 1e9, Hpl * Cl_ / (RH_J / ni ** 2) * 1e9, Hpl * Cl_ / (RH_J * (1 / nf ** 2 + 1 / ni ** 2)) * 1e9, lam / 1e9 * 1e6], 'nm', `${m(r`\Delta E=2.18\times10^{-18}\left(\frac{1}{${nf * nf}}-\frac{1}{${ni * ni}}\right)=${sig(dE)}\ \mathrm{J}`)}, then ${m(r`\lambda=\frac{hc}{\Delta E}`)}.`); }
  const v = rnd.pick([1e5, 5e5, 1e6, 2e6, 3e6]); const lam = Hpl / (ME * v) * 1e9;
  return numQ('quantum', L, `The de Broglie wavelength of an electron (${m(r`m_e=9.109\times10^{-31}\ \mathrm{kg}`)}) moving at ${m(sig(v, 2) + r`\ \mathrm{m/s}`)} is`, lam, [Hpl / (ME * v), Hpl * ME * v * 1e9, Hpl / (ME * v * v) * 1e9], 'nm', `${m(r`\lambda=\frac{h}{mv}`)}, then convert to nm.`);
}
function qnumbers(L) {
  const kind = pickByLevel(L, [[1, 2, 'range'], [1, 3, 'count'], [2, 4, 'label'], [3, 6, 'set']]);
  if (kind === 'range') {
    const B = [[r`The magnetic quantum number ${m('m_\\ell')} varies`, r`from ${m('-\\ell')} to ${m('\\ell')}`, [r`from ${m('-1/2')} to ${m('+1/2')}`, r`from ${m('0')} to ${m('\\infty')}`, r`from ${m('0')} to ${m('n-1')}`, r`from ${m('1')} to ${m('n-1')}`]],
      [r`The angular momentum quantum number ${m('\\ell')} varies`, r`from ${m('0')} to ${m('n-1')}`, [r`from ${m('-\\ell')} to ${m('\\ell')}`, r`from ${m('1')} to ${m('n')}`, r`from ${m('-1/2')} to ${m('+1/2')}`, r`from ${m('0')} to ${m('n')}`]],
      [r`The principal quantum number ${m('n')} can take the values`, r`${m('1,2,3,\\dots')}`, [r`${m('0,1,2,\\dots')}`, r`from ${m('-\\ell')} to ${m('\\ell')}`, r`${m('\\pm 1/2')}`, r`from ${m('0')} to ${m('\\ell')}`]],
      [r`The spin quantum number ${m('m_s')} can take the values`, r`${m('+1/2')} and ${m('-1/2')}`, [r`${m('0')} and ${m('1')}`, r`from ${m('-\\ell')} to ${m('\\ell')}`, r`${m('+1')} and ${m('-1')}`, r`any value from ${m('-1/2')} to ${m('+1/2')}`]]];
    const [q, a, w] = rnd.pick(B); return mk5('qnumbers', L, q, a, w, 'Allowed values: ' + m(r`n\ge 1`) + ', ' + m(r`0\le\ell\le n-1`) + ', ' + m(r`-\ell\le m_\ell\le\ell`) + ', ' + m(r`m_s=\pm\frac12`) + '.');
  }
  if (kind === 'count') {
    const t = rnd.int(1, 4); const n = rnd.int(2, 5); const l = rnd.int(0, Math.min(3, n - 1));
    const lab = 'spdf'[l];
    if (t === 1) return numQ('qnumbers', L, `The number of orbitals in a ${m(n + lab)} subshell is`, 2 * l + 1, [2 * (2 * l + 1), l, n, n * n, 2 * l], '', `A subshell with ${m(r`\ell=${l}`)} has ${m(r`2\ell+1=${2 * l + 1}`)} orbitals (${m(r`m_\ell=-\ell,\dots,\ell`)}).`, 3, { noGeneric: true, minRel: 0 });
    if (t === 2) return numQ('qnumbers', L, `The maximum number of electrons in the shell ${m('n=' + n)} is`, 2 * n * n, [n * n, 2 * n, n, 4 * n, 2 * n * n + 2], '', `The shell contains ${m(`n^2=${n * n}`)} orbitals, each with at most 2 electrons: ${m(`2n^2=${2 * n * n}`)}.`, 3, { noGeneric: true, minRel: 0 });
    if (t === 3) return numQ('qnumbers', L, `The maximum number of electrons that can share the quantum numbers ${m(`n=${n},\\ \\ell=${l}`)} is`, 2 * (2 * l + 1), [2 * l + 1, 2 * n * n, 2 * l, 2 * n, 4 * l + 4], '', `${m(`2(2\\ell+1)=${2 * (2 * l + 1)}`)}.`, 3, { noGeneric: true, minRel: 0 });
    return numQ('qnumbers', L, `How many electrons in an atom can have ${m(`n=${n}`)} and ${m(r`m_s=+\frac12`)}?`, n * n, [2 * n * n, n, 2 * n, n * n - 1, 4 * n], '', `There are ${m(`n^2=${n * n}`)} orbitals with ${m('n=' + n)}, each holding one electron with ${m(r`m_s=+\frac12`)}.`, 3, { noGeneric: true, minRel: 0 });
  }
  if (kind === 'label') {
    const bad = ['1p', '2d', '3f', '1d', '2f'], good = ['1s', '2p', '3d', '4f', '3s', '4d', '5f', '2s', '3p'];
    if (rnd.chance(0.5)) { const b = rnd.pick(bad); return mk5('qnumbers', L, 'Which of the following orbitals does <b>not</b> exist?', m(b), rnd.shuffle(good).slice(0, 6).map(m), `For ${m('n=' + b[0])} only ${m(r`\ell\le ${+b[0] - 1}`)} is allowed, so the ${m(b[1])} subshell does not exist.`); }
    const n = rnd.int(2, 5), l = rnd.int(0, Math.min(3, n - 1)); const lab = n + 'spdf'[l];
    return mk5('qnumbers', L, `The subshell with ${m(`n=${n}`)} and ${m(r`\ell=${l}`)} is`, m(lab), [m((n + 1) + 'spdf'[l]), m(n + 'spdf'[(l + 1) % 4]), m((n - 1) + 'spdf'[l]), m(n + 'spdf'[Math.max(0, l - 1)] === lab ? n + 'f' : n + 'spdf'[Math.max(0, l - 1)]), m(l + 'spdf'[Math.min(3, n - 1)])], `${m(r`\ell=0,1,2,3`)} correspond to s, p, d, f.`);
  }
  const not = rnd.chance(0.5);
  const valid = () => { const n = rnd.int(1, 5), l = rnd.int(0, n - 1), ml = rnd.int(-l, l); return [n, l, ml, rnd.pick(['+\\frac12', '-\\frac12'])]; };
  const invalid = () => { const t = rnd.int(1, 4); const n = rnd.int(1, 4);
    if (t === 1) return [n, n, 0, '+\\frac12'];
    if (t === 2) { const l = rnd.int(0, n - 1); return [n, l, l + 1, '-\\frac12']; }
    if (t === 3) { const l = rnd.int(0, n - 1); return [n, l, 0, rnd.pick(['0', '+1', '-1'])]; }
    return [0, 0, 0, '+\\frac12']; };
  const st = s => opt(m(`(n,\\ell,m_\\ell,m_s)=(${s.join(',')})`), null, s.join('|'));
  const right = st(not ? invalid() : valid()); const W = []; for (let i = 0; i < 12; i++) W.push(st(not ? valid() : invalid()));
  return mk5('qnumbers', L, `Which set of quantum numbers is <b>${not ? 'not' : ''} allowed</b>${not ? '' : ''} for an electron in an atom?`.replace('<b> allowed</b>', '<b>allowed</b>'), right, W, `Rules: ${m(r`n\ge 1`)}, ${m(r`0\le\ell\le n-1`)}, ${m(r`|m_\ell|\le\ell`)}, ${m(r`m_s=\pm\frac12`)}.`);
}
function cfgVariants(Z, q) {
  const c = config(Z, q), out = [];
  const tot = Z - q;
  let naive = {}; let e = tot; for (const o of ORDER) { if (e <= 0) break; const k = Math.min(e, CAP[o[1]]); naive[o] = k; e -= k; } out.push(naive);
  if (q > 0) { const wrong = config(Z, 0); let rem = q; const ord = ORDER.slice().reverse(); for (const o of ord) { if (!wrong[o]) continue; const t = Math.min(rem, wrong[o]); wrong[o] -= t; rem -= t; if (!rem) break; } for (const k of Object.keys(wrong)) if (!wrong[k]) delete wrong[k]; out.push(wrong); }
  const shifts = [['4s', '3d'], ['3d', '4s'], ['3s', '3p'], ['2p', '3s'], ['4p', '4s'], ['3p', '4s']];
  for (const [a, b] of shifts) if (c[a]) { const v = { ...c }; v[a] -= 1; if (!v[a]) delete v[a]; v[b] = (v[b] || 0) + 1; if (v[b] <= CAP[b[1]]) out.push(v); }
  out.push(config(Z + 1, q)); out.push(config(Z - 1 > 0 ? Z - 1 : Z + 2, q)); out.push(config(Z + 2, q)); if (Z > 3) out.push(config(Z - 2, q));
  const filled = ORDER.filter(o => c[o]); const last = filled[filled.length - 1], li = ORDER.indexOf(last);
  if (li + 1 < ORDER.length) { const v = { ...c }; v[last] -= 1; if (!v[last]) delete v[last]; v[ORDER[li + 1]] = 1; out.push(v); }
  if (filled.length > 1) { const prev = filled[filled.length - 2]; const v = { ...c }; if (v[last] < CAP[last[1]]) { v[prev] -= 1; if (!v[prev]) delete v[prev]; v[last] += 1; out.push(v); } }
  return out;
}
function cfgTopic(L) {
  const kind = pickByLevel(L, [[1, 2, 'cfg'], [2, 4, 'unp'], [3, 5, 'ion'], [4, 6, 'exc'], [5, 6, 'which']]);
  const pickZ = () => rnd.pick([3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35]);
  const IONS = [[26, 2], [26, 3], [29, 1], [29, 2], [30, 2], [25, 2], [24, 3], [27, 2], [28, 2], [22, 2], [21, 3], [17, -1], [8, -2], [16, -2], [7, -3], [11, 1], [20, 2], [13, 3], [35, -1], [12, 2], [19, 1], [15, -3], [23, 3]];
  if (kind === 'cfg' || kind === 'exc' || kind === 'ion') {
    let Z, q = 0; if (kind === 'exc') Z = rnd.pick([24, 29]); else if (kind === 'ion') [Z, q] = rnd.pick(IONS); else Z = pickZ();
    const c = config(Z, q); const sp = ionTex(BYZ[Z].sym, q);
    const right = opt(m(cfgTex(c)), null, cfgTex(c));
    return mk5('config', L, `The ground-state electron configuration of ${m(sp)}${q === 0 ? ` (${m('Z=' + Z)})` : ` (${m('Z=' + Z)} for ${BYZ[Z].name})`} is`, right, cfgVariants(Z, q).map(v => opt(m(cfgTex(v)), null, cfgTex(v))), `${q > 0 ? 'Cations lose electrons from the shell with the highest ' + m('n') + ' first (4s before 3d). ' : ''}${Z === 24 || Z === 29 ? 'Cr and Cu are exceptions: a half-filled / filled 3d subshell is more stable. ' : ''}Configuration: ${m(cfgTex(c))}.`);
  }
  if (kind === 'unp') {
    let Z, q = 0; if (rnd.chance(0.5)) Z = pickZ(); else [Z, q] = rnd.pick(IONS);
    const c = config(Z, q), u = unpaired(c);
    return numQ('config', L, `How many unpaired electrons does ${m(ionTex(BYZ[Z].sym, q))} have in its ground state (${m('Z=' + Z)})?`, u, [0, 1, 2, 3, 4, 5, 6].filter(x => x !== u), '', `Configuration ${m(cfgTex(c))}; by Hund's rule the partially filled subshell has ${m(u)} unpaired electron(s).`, 3, { noGeneric: true, minRel: 0 });
  }
  // which species has a given configuration
  const sets = [[[18, 0], [17, -1], [19, 1], [20, 2], [16, -2]], [[10, 0], [9, -1], [11, 1], [12, 2], [8, -2], [13, 3]], [[36, 0], [35, -1], [37, 1], [38, 2]]];
  const target = rnd.pick(sets); const [Z, q] = rnd.pick(target); const c = config(Z, q);
  const others = [[26, 2], [26, 3], [29, 1], [25, 2], [30, 2], [24, 3], [17, 0], [11, 0], [12, 0], [9, 0], [8, 0], [19, 0], [20, 0], [16, 0], [35, 0], [13, 0]].filter(([z, qq]) => cfgTex(config(z, qq)) !== cfgTex(c));
  const o = ([z, qq]) => opt(m(ionTex(BYZ[z].sym, qq)), null, z + ':' + qq);
  return mk5('config', L, `Which of the following species has the electron configuration ${m(cfgTex(c))}?`, o([Z, q]), rnd.shuffle(others).map(o), `Count the electrons: ${m(cfgTex(c))} contains ${m(Z - q)} electrons; ${m(ionTex(BYZ[Z].sym, q))} has ${m(`Z${q === 0 ? '' : (q > 0 ? '-' : '+') + Math.abs(q)}=${Z - q}`)}. The other species have a different number of electrons or a different configuration.`);
}
const PERIODS = { 2: ['Li', 'Be', 'B', 'C', 'N', 'O', 'F'], 3: ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'] };
const GROUPS = { 1: ['Li', 'Na', 'K', 'Rb', 'Cs'], 2: ['Be', 'Mg', 'Ca', 'Sr', 'Ba'], 17: ['F', 'Cl', 'Br', 'I'], 16: ['O', 'S', 'Se'], 15: ['N', 'P', 'As'] };
function periodic(L) {
  const prop = pickByLevel(L, [[1, 3, 'rad'], [2, 4, 'en'], [3, 6, 'ie'], [4, 6, 'ionrad']]);
  if (prop === 'ionrad') {
    const ser = rnd.pick([[['N', -3, 146], ['O', -2, 140], ['F', -1, 133], ['Na', 1, 102], ['Mg', 2, 72], ['Al', 3, 54]], [['S', -2, 184], ['Cl', -1, 181], ['K', 1, 138], ['Ca', 2, 100]]]);
    const pick = rnd.shuffle(ser).slice(0, 3); const sorted = pick.slice().sort((a, b) => a[2] - b[2]);
    const lab = arr => arr.map(x => ionTex(x[0], x[1])).join(' < ');
    const perms = permute(pick).map(p => opt(m(lab(p)), null, p.map(x => x[0]).join()));
    return mk5('periodic', L, `Order the following isoelectronic ions by <b>increasing</b> ionic radius: ${pick.map(x => m(ionTex(x[0], x[1]))).join(', ')}.`, opt(m(lab(sorted)), null, sorted.map(x => x[0]).join()), perms, `Isoelectronic ions: the larger the nuclear charge ${m('Z')}, the smaller the ion. Radii (pm): ${pick.map(x => `${x[0]} ${x[2]}`).join(', ')}.`);
  }
  const data = prop === 'rad' ? RAD : prop === 'en' ? EN : IE;
  const label = { rad: 'atomic radius', en: 'electronegativity', ie: 'first ionization energy' }[prop];
  let pool;
  for (let t = 0; t < 30; t++) { pool = rnd.chance(0.5) ? PERIODS[rnd.pick([2, 3])] : GROUPS[rnd.pick(Object.keys(GROUPS))]; pool = pool.filter(s => data[s] != null); if (pool.length >= 3) break; }
  const pick = rnd.shuffle(pool).slice(0, 3); const vals = pick.map(s => data[s]);
  if (new Set(vals).size < 3) throw new Error('tie');
  const inc = rnd.chance(0.5); const sorted = pick.slice().sort((a, b) => inc ? data[a] - data[b] : data[b] - data[a]);
  if (rnd.chance(0.35) && L >= 2) {
    const big = rnd.chance(0.5); const all = rnd.shuffle(pool.length >= 5 ? pool : Object.keys(data).filter(s => (EL[s].per === EL[pool[0]].per) || (EL[s].grp === EL[pool[0]].grp))).slice(0, 5);
    const best = all.slice().sort((a, b) => big ? data[b] - data[a] : data[a] - data[b])[0];
    if (all.filter(s => data[s] === data[best]).length > 1) throw new Error('tie');
    return mk5('periodic', L, `Which element has the <b>${big ? 'highest' : 'lowest'}</b> ${label}?`, opt(m(r`\ce{${best}}`), null, best), all.filter(s => s !== best).map(s => opt(m(r`\ce{${s}}`), null, s)), `Values: ${all.map(s => `${s} ${data[s]}`).join(', ')}${prop === 'ie' ? ' kJ/mol' : prop === 'rad' ? ' pm' : ''}.`);
  }
  const lab = arr => arr.map(s => r`\ce{${s}}`).join(inc ? ' < ' : ' > ');
  return mk5('periodic', L, `Order ${pick.map(s => m(r`\ce{${s}}`)).join(', ')} by <b>${inc ? 'increasing' : 'decreasing'}</b> ${label}.`, opt(m(lab(sorted)), null, sorted.join()), permute(pick).map(p => opt(m(lab(p)), null, p.join())),
    `${prop === 'rad' ? 'The radius decreases along a period and increases down a group.' : prop === 'en' ? 'Electronegativity increases along a period and decreases down a group.' : 'Ionization energy generally increases along a period and decreases down a group (exceptions: Be > B, N > O, Mg > Al, P > S).'} Values: ${pick.map(s => `${s} ${data[s]}`).join(', ')}${prop === 'ie' ? ' kJ/mol' : prop === 'rad' ? ' pm' : ''}.`);
}
function permute(a) { if (a.length <= 1) return [a]; const out = []; a.forEach((x, i) => permute(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([x, ...p]))); return out; }

const OX_SPECIES = [['KMnO4', 0, 'Mn'], ['K2Cr2O7', 0, 'Cr'], ['H2SO4', 0, 'S'], ['H2SO3', 0, 'S'], ['HNO3', 0, 'N'], ['HNO2', 0, 'N'], ['NH3', 0, 'N'], ['NH4', 1, 'N'], ['CO3', -2, 'C'], ['HClO4', 0, 'Cl'], ['HClO3', 0, 'Cl'], ['HClO', 0, 'Cl'], ['PO4', -3, 'P'], ['H3PO4', 0, 'P'], ['Fe2O3', 0, 'Fe'], ['SO2', 0, 'S'], ['SO3', 0, 'S'], ['N2O', 0, 'N'], ['NO2', 0, 'N'], ['N2O5', 0, 'N'], ['CrO4', -2, 'Cr'], ['MnO2', 0, 'Mn'], ['Na2S2O3', 0, 'S'], ['CH4', 0, 'C'], ['CO', 0, 'C'], ['MnO4', -1, 'Mn'], ['Cr2O7', -2, 'Cr'], ['NO3', -1, 'N'], ['ClO2', -1, 'Cl'], ['K2MnO4', 0, 'Mn'], ['CaH2', 0, 'Ca']];
const KNOWN_OX = { O: -2, H: 1, K: 1, Na: 1, Li: 1, Ca: 2, Mg: 2, Ba: 2 };
function nomenclature(L) {
  const kind = pickByLevel(L, [[1, 3, 'n2f'], [2, 4, 'f2n'], [3, 6, 'ox']]);
  if (kind === 'ox') {
    const [f, q, tgt] = rnd.pick(OX_SPECIES.filter(s => s[2] !== 'Ca')); const c = parseFormula(f);
    let known = 0; for (const [e, n] of Object.entries(c)) if (e !== tgt) known += KNOWN_OX[e] * n;
    const ox = F(q - known, c[tgt]); const v = ox.val();
    const show = r`\ce{` + f + (q === 0 ? '' : '^{' + (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '-') + '}') + '}';
    const st = x => opt(m((x > 0 ? '+' : '') + x), x, String(x));
    return mk5('nomenclature', L, `The oxidation number of ${m(r`\ce{${tgt}}`)} in ${m(show)} is`, st(v), [-v, v + 1, v - 1, v + 2, v - 2, q - known, 0].filter(x => Number.isInteger(x)).map(st), `With ${m('O=-2')}${c.H ? ', ' + m('H=+1') : ''}${['K', 'Na', 'Li', 'Ca', 'Mg', 'Ba'].filter(e => c[e]).map(e => ', ' + m(`\\mathrm{${e}}=+${KNOWN_OX[e]}`)).join('')}: ${m(`${c[tgt] === 1 ? '' : c[tgt]}x${known >= 0 ? '+' : ''}${known}=${q}`)}, so ${m('x=' + (v > 0 ? '+' : '') + v)}.`);
  }
  const cat = rnd.pick(CATIONS), an = rnd.pick(ANIONS);
  if (cat[0] === 'NH4' && ['O', 'S', 'OH'].includes(an[0])) throw new Error('odd salt');
  const f = salt(cat, an);
  if (kind === 'n2f') {
    const l = cat[1] * an[1] / gcdN(cat[1], an[1]); const nc = l / cat[1], na = l / an[1];
    const w = new Set([salt(cat, an, 1, 1), salt(cat, an, na, nc), salt(cat, an, nc, na + 1), salt(cat, an, Math.max(1, nc - 1) === nc ? nc + 1 : nc - 1, na), salt(cat, an, cat[1], an[1])]);
    const sib = ANIONS.find(a => a[2] === SIBLING[an[2]]); if (sib) w.add(salt(cat, sib));
    const csib = CATIONS.find(c => c[2] === SIBLING[cat[2]]); if (csib) w.add(salt(csib, an));
    w.delete(f);
    return mk5('nomenclature', L, `The formula of <i>${saltName(cat, an)}</i> is`, opt(ce(f), null, f), [...w].map(x => opt(ce(x), null, x)), `${ionTex(cat[0], cat[1]).replace(/^/, '')}`.length ? `Ions: ${m(ionTex(cat[0], cat[1]))} and ${m(ionTex(an[0], -an[1]))}; the total charge must be zero, giving ${ce(f)}.` : '');
  }
  const names = new Set([SIBLING[an[2]] ? cat[2] + ' ' + SIBLING[an[2]] : null, SIBLING[cat[2]] ? SIBLING[cat[2]] + ' ' + an[2] : null, cat[2] + ' ' + rnd.pick(ANIONS.filter(a => a[2] !== an[2]))[2], rnd.pick(CATIONS.filter(c => c[2] !== cat[2]))[2] + ' ' + an[2], cat[2] + ' ' + (an[2].endsWith('ate') ? an[2].replace(/ate$/, 'ide') : an[2].replace(/ide$/, 'ate'))].filter(Boolean));
  names.delete(saltName(cat, an));
  return mk5('nomenclature', L, `The name of ${ce(f)} is`, saltName(cat, an), [...names], `The compound contains ${m(ionTex(cat[0], cat[1]))} (${cat[2]}) and ${m(ionTex(an[0], -an[1]))} (${an[2]}).`);
}
function balancing(L) {
  const kind = pickByLevel(L, [[1, 2, 'simple'], [1, 3, 'meta'], [2, 4, 'comb'], [3, 5, 'neut'], [5, 6, 'redox']]);
  let reac, prod, names = null;
  if (kind === 'simple') { [reac, prod] = rnd.pick([[['Fe', 'O2'], ['Fe2O3']], [['Al', 'O2'], ['Al2O3']], [['KClO3'], ['KCl', 'O2']], [['Al', 'HCl'], ['AlCl3', 'H2']], [['Zn', 'HCl'], ['ZnCl2', 'H2']], [['N2', 'H2'], ['NH3']], [['Na', 'H2O'], ['NaOH', 'H2']], [['P4', 'O2'], ['P4O10']], [['NH4NO3'], ['N2O', 'H2O']], [['Mg', 'N2'], ['Mg3N2']], [['Fe2O3', 'CO'], ['Fe', 'CO2']], [['Fe2O3', 'Al'], ['Al2O3', 'Fe']]]); }
  else if (kind === 'meta') {
    for (let t = 0; t < 50; t++) { const c1 = rnd.pick(CATIONS.filter(c => !c[3])), c2 = rnd.pick(CATIONS.filter(c => !c[3] && c[0] !== c1[0])), a1 = rnd.pick(ANIONS.slice(0, 13)), a2 = rnd.pick(ANIONS.filter(a => a[0] !== a1[0] && a[0] !== 'O' && a[0] !== 'S'));
      if (a1[0] === 'OH' && a2[0] === 'OH') continue; reac = [salt(c1, a1), salt(c2, a2)]; prod = [salt(c1, a2), salt(c2, a1)]; names = [null, saltName(c2, a2), saltName(c1, a2), null]; if (balance(reac, prod)) break; }
  } else if (kind === 'comb') { const fuel = rnd.pick(['CH4', 'C2H6', 'C3H8', 'C4H10', 'C2H4', 'C2H2', 'C6H6', 'C8H18', 'CH3OH', 'C2H5OH', 'C6H12O6', 'C3H6']); reac = [fuel, 'O2']; prod = ['CO2', 'H2O']; }
  else if (kind === 'neut') { const acid = rnd.pick(['HCl', 'HNO3', 'H2SO4', 'H3PO4']), base = rnd.pick([[['Na', 1, 'sodium'], 'NaOH'], [['K', 1, 'potassium'], 'KOH'], [['Ca', 2, 'calcium'], 'Ca(OH)2'], [['Ba', 2, 'barium'], 'Ba(OH)2'], [['Al', 3, 'aluminium'], 'Al(OH)3']]);
    const an = { HCl: ['Cl', 1, 'chloride'], HNO3: ['NO3', 1, 'nitrate', true], H2SO4: ['SO4', 2, 'sulfate', true], H3PO4: ['PO4', 3, 'phosphate', true] }[acid]; reac = [acid, base[1]]; prod = [salt(base[0], an), 'H2O']; }
  else { [reac, prod] = rnd.pick([[['Cu', 'HNO3'], ['Cu(NO3)2', 'NO', 'H2O']], [['KMnO4', 'HCl'], ['KCl', 'MnCl2', 'Cl2', 'H2O']], [['K2Cr2O7', 'HCl'], ['KCl', 'CrCl3', 'Cl2', 'H2O']], [['FeS2', 'O2'], ['Fe2O3', 'SO2']], [['Cu', 'H2SO4'], ['CuSO4', 'SO2', 'H2O']], [['NH3', 'O2'], ['NO', 'H2O']], [['MnO2', 'HCl'], ['MnCl2', 'Cl2', 'H2O']], [['Zn', 'HNO3'], ['Zn(NO3)2', 'NH4NO3', 'H2O']]]); }
  const co = balance(reac, prod); if (!co) throw new Error('unbalanced');
  const show = (f, i) => (names && names[i] ? `\\text{${names[i]}}` : r`\ce{` + f + '}');
  const unbal = reac.map(show).join(' + ') + r` \longrightarrow ` + prod.map((f, i) => show(f, reac.length + i)).join(' + ');
  const qtxt = `Balance the reaction ${m(unbal)}`;
  const form = rnd.int(1, 3); const sol = `Balanced: ${m(r`\ce{` + eqTex(reac, prod, co) + '}')}.`;
  if (form === 1) {
    const pc = co.slice(reac.length); const st = a => opt(m(a.join(';\\ ')), null, a.join('|'));
    const W = [pc.map(x => x + 1), pc.slice().reverse(), pc.map((x, i) => (i === 0 ? x + 1 : x)), pc.map((x, i) => (i === pc.length - 1 ? Math.max(1, x - 1) : x)), pc.map((x, i) => (i === 0 ? x * 2 : x)), pc.map(x => x * 2), co.slice(0, reac.length).concat([]).slice(0, pc.length)];
    return mk5('balancing', L, qtxt + ' and select the stoichiometric coefficients of the <b>products</b>, in order (smallest whole numbers).', st(pc), W.filter(w => w.length === pc.length).map(st), sol);
  }
  if (form === 2) { const s = co.reduce((a, b) => a + b, 0); return numQ('balancing', L, qtxt + ' with the smallest whole-number coefficients. The sum of all coefficients is', s, [s + 1, s - 1, s + 2, s - 2, s + 3], '', sol, 3, { noGeneric: true, minRel: 0 }); }
  const i = rnd.int(0, co.length - 1); const sp = [...reac, ...prod][i];
  return numQ('balancing', L, qtxt + ` with the smallest whole-number coefficients. The coefficient of ${ce(sp)} is`, co[i], [co[i] + 1, co[i] - 1, co[i] + 2, co[i] * 2, co[i] + 3].filter(x => x > 0), '', sol, 3, { noGeneric: true, minRel: 0 });
}
const COMPOUNDS = ['H2O', 'CO2', 'NaCl', 'CaCO3', 'H2SO4', 'NaOH', 'C6H12O6', 'NH3', 'KMnO4', 'Ca(OH)2', 'Al2(SO4)3', 'Fe2O3', 'CuSO4', 'HNO3', 'C2H5OH', 'Mg(NO3)2', 'K2Cr2O7', 'Na2CO3', 'CH4', 'C3H8'];
function mole(L) {
  const kind = pickByLevel(L, [[1, 2, 'n'], [1, 3, 'pct'], [2, 3, 'atoms'], [3, 4, 'stoich'], [4, 5, 'emp'], [5, 6, 'limit'], [5, 6, 'yield']]);
  const f = rnd.pick(COMPOUNDS), M = MM(f);
  if (kind === 'n') { const mass = rnd.pick([5, 10, 12.5, 20, 25, 50, 75, 100, 150]); return numQ('mole', L, `How many moles are contained in ${m(mass + r`\ \mathrm{g}`)} of ${ce(f)}?`, mass / M, [mass * M, M / mass, mass / M * NA, mass / (M / 2)], 'mol', `${m(r`M(\ce{${f}})=${sig(M, 4)}\ \mathrm{g/mol}`)}; ${m(r`n=\frac{m}{M}`)}.`); }
  if (kind === 'pct') { const c = parseFormula(f); const els = Object.keys(c); const e = rnd.pick(els); const p = 100 * c[e] * EL[e].M / M;
    return numQ('mole', L, `The mass percentage of ${m(r`\ce{${e}}`)} in ${ce(f)} is`, p, [100 * EL[e].M / M, 100 * c[e] / Object.values(c).reduce((a, b) => a + b, 0), 100 - p, 100 * c[e] * EL[e].M / (M + EL[e].M)], r`\%`, `${m(r`\%\,\ce{${e}}=\frac{${c[e]}\cdot ${EL[e].M}}{${sig(M, 4)}}\cdot 100`)}.`, 3, { minRel: 0.03 }); }
  if (kind === 'atoms') { const c = parseFormula(f); const e = rnd.pick(Object.keys(c)); const mass = rnd.pick([1, 2, 5, 10, 20, 50]); const N = mass / M * c[e] * NA;
    return numQ('mole', L, `How many atoms of ${m(r`\ce{${e}}`)} are contained in ${m(mass + r`\ \mathrm{g}`)} of ${ce(f)}?`, N, [mass / M * NA, mass / EL[e].M * NA, N / NA, mass * M * NA], '', `${m(r`n=\frac{${mass}}{${sig(M, 4)}}`)} mol of ${ce(f)}, each formula unit contains ${m(c[e])} ${m(r`\ce{${e}}`)} atoms; multiply by ${m('N_A')}.`); }
  if (kind === 'emp') {
    const E = rnd.pick([['CH2O', 'C6H12O6'], ['CH2', 'C3H6'], ['CH', 'C6H6'], ['C2H5', 'C4H10'], ['NO2', 'N2O4'], ['P2O5', 'P4O10'], ['CH4N', 'C2H8N2'], ['C3H4O3', 'C6H8O6'], ['C2H6O', 'C2H6O'], ['Fe2O3', 'Fe2O3'], ['C2H4O', 'C4H8O2']]);
    const c = parseFormula(E[0]); const Me = MM(E[0]); const pcts = Object.entries(c).map(([e, n]) => [e, 100 * n * EL[e].M / Me]);
    const fake = [E[1] !== E[0] ? E[1] : null, ...Object.keys(c).map(e => E[0].replace(new RegExp(e + '(\\d*)'), (_, d) => e + ((+d || 1) + 1)))].filter(Boolean);
    return mk5('mole', L, `A compound contains ${pcts.map(([e, p]) => m(`${p.toFixed(1)}\\%\\ \\ce{${e}}`)).join(', ')} by mass. Its empirical formula is`, opt(ce(E[0]), null, E[0]), [...fake, 'CHO', 'CH3O', 'C2H3O2', 'CH3', 'N2O', 'NO', 'PO2', 'FeO', 'Fe3O4', 'C3H8O', 'CH2O2'].filter(x => x !== E[0]).map(x => opt(ce(x), null, x)), `Divide each percentage by the atomic mass and then by the smallest result: the ratio is ${m(Object.values(c).join(':'))}.`);
  }
  // reactions for stoichiometry
  const RX = [[['C3H8', 'O2'], ['CO2', 'H2O']], [['CH4', 'O2'], ['CO2', 'H2O']], [['Fe2O3', 'CO'], ['Fe', 'CO2']], [['N2', 'H2'], ['NH3']], [['Al', 'O2'], ['Al2O3']], [['CaCO3', 'HCl'], ['CaCl2', 'CO2', 'H2O']], [['Zn', 'HCl'], ['ZnCl2', 'H2']], [['C2H5OH', 'O2'], ['CO2', 'H2O']], [['Mg', 'O2'], ['MgO']], [['KClO3'], ['KCl', 'O2']]];
  const [re, pr] = rnd.pick(RX); const co = balance(re, pr); const eq = m(r`\ce{` + eqTex(re, pr, co) + '}');
  const pi = rnd.int(0, pr.length - 1), P = pr[pi], cP = co[re.length + pi];
  if (kind === 'stoich' || re.length === 1) { const A0 = re[0], cA = co[0]; const mA = rnd.pick([5, 10, 20, 25, 50, 100]); const mP = mA / MM(A0) * cP / cA * MM(P);
    return numQ('mole', L, `For the reaction ${eq}, the mass of ${ce(P)} obtained from ${m(mA + r`\ \mathrm{g}`)} of ${ce(A0)} (with excess of the other reactants) is`, mP, [mA / MM(A0) * MM(P), mA / MM(A0) * cA / cP * MM(P), mA * cP / cA, mP * 2], 'g', `${m(r`n(\ce{${A0}})=\frac{${mA}}{${sig(MM(A0), 4)}}`)}; ${m(r`n(\ce{${P}})=n(\ce{${A0}})\cdot\frac{${cP}}{${cA}}`)}; ${m('m=nM')}.`); }
  const [A0, B0] = re, cA = co[0], cB = co[1];
  const nA = rnd.pick([0.1, 0.2, 0.25, 0.4, 0.5, 1]), nB = nA * cB / cA * rnd.pick([0.5, 0.7, 1.3, 1.6, 2]);
  const mA = nA * MM(A0), mB = nB * MM(B0); const ext = Math.min(nA / cA, nB / cB); const mP = ext * cP * MM(P); const lim = nA / cA < nB / cB ? A0 : B0;
  if (kind === 'limit') return numQ('mole', L, `For the reaction ${eq}, ${m(sig(mA) + r`\ \mathrm{g}`)} of ${ce(A0)} react with ${m(sig(mB) + r`\ \mathrm{g}`)} of ${ce(B0)}. The maximum mass of ${ce(P)} formed is`, mP, [nA / cA * cP * MM(P), nB / cB * cP * MM(P), (nA + nB) * MM(P), ext * MM(P)], 'g', `Limiting reagent: compare ${m('n/\\nu')}: ${m(sig(nA / cA))} for ${ce(A0)} and ${m(sig(nB / cB))} for ${ce(B0)} → ${ce(lim)} is limiting.`);
  const yieldP = rnd.int(55, 95); const actual = mP * yieldP / 100;
  return numQ('mole', L, `For the reaction ${eq}, ${m(sig(mA) + r`\ \mathrm{g}`)} of ${ce(A0)} react with ${m(sig(mB) + r`\ \mathrm{g}`)} of ${ce(B0)} and ${m(sig(actual) + r`\ \mathrm{g}`)} of ${ce(P)} are obtained. The percent yield is`, yieldP, [100 * actual / (nA / cA * cP * MM(P)), 100 * actual / (nB / cB * cP * MM(P)), 100 - yieldP, Math.min(99, yieldP * 1.2)], r`\%`, `Theoretical mass from the limiting reagent (${ce(lim)}): ${m(sig(mP) + r`\ \mathrm{g}`)}; yield ${m(r`=\frac{\text{actual}}{\text{theoretical}}\cdot 100`)}.`, 3, { minRel: 0.04 });
}
/* bonding & structure */
const MOLS = [
  ['CH4', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', false], ['NH3', 'tetrahedral', 'trigonal pyramidal', 'sp^3', 1, '107', true], ['H2O', 'tetrahedral', 'bent', 'sp^3', 2, '104.5', true],
  ['CO2', 'linear', 'linear', 'sp', 0, '180', false], ['BF3', 'trigonal planar', 'trigonal planar', 'sp^2', 0, '120', false], ['SO2', 'trigonal planar', 'bent', 'sp^2', 1, '119', true],
  ['SO3', 'trigonal planar', 'trigonal planar', 'sp^2', 0, '120', false], ['PCl5', 'trigonal bipyramidal', 'trigonal bipyramidal', 'sp^3d', 0, '90,\\ 120', false], ['SF4', 'trigonal bipyramidal', 'seesaw', 'sp^3d', 1, '<120', true],
  ['ClF3', 'trigonal bipyramidal', 'T-shaped', 'sp^3d', 2, '<90', true], ['XeF2', 'trigonal bipyramidal', 'linear', 'sp^3d', 3, '180', false], ['SF6', 'octahedral', 'octahedral', 'sp^3d^2', 0, '90', false],
  ['BrF5', 'octahedral', 'square pyramidal', 'sp^3d^2', 1, '<90', true], ['XeF4', 'octahedral', 'square planar', 'sp^3d^2', 2, '90', false], ['BeCl2', 'linear', 'linear', 'sp', 0, '180', false],
  ['NH4+', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', false], ['H3O+', 'tetrahedral', 'trigonal pyramidal', 'sp^3', 1, '107', true], ['NO3-', 'trigonal planar', 'trigonal planar', 'sp^2', 0, '120', false],
  ['CO3^2-', 'trigonal planar', 'trigonal planar', 'sp^2', 0, '120', false], ['CCl4', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', false], ['PCl3', 'tetrahedral', 'trigonal pyramidal', 'sp^3', 1, '<109.5', true],
  ['H2S', 'tetrahedral', 'bent', 'sp^3', 2, '92', true], ['O3', 'trigonal planar', 'bent', 'sp^2', 1, '117', true], ['NO2-', 'trigonal planar', 'bent', 'sp^2', 1, '115', true],
  ['ClO4-', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', false], ['SO4^2-', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', false], ['CH2O', 'trigonal planar', 'trigonal planar', 'sp^2', 0, '120', true],
  ['ICl4-', 'octahedral', 'square planar', 'sp^3d^2', 2, '90', false], ['I3-', 'trigonal bipyramidal', 'linear', 'sp^3d', 3, '180', false], ['CHCl3', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', true], ['CH2Cl2', 'tetrahedral', 'tetrahedral', 'sp^3', 0, '109.5', true], ['HCN', 'linear', 'linear', 'sp', 0, '180', true]];
const GEOMS = ['linear', 'bent', 'trigonal planar', 'trigonal pyramidal', 'tetrahedral', 'T-shaped', 'seesaw', 'trigonal bipyramidal', 'square planar', 'square pyramidal', 'octahedral'];
const HYB = ['sp', 'sp^2', 'sp^3', 'sp^3d', 'sp^3d^2'];
function vsepr(L) {
  const pool = L <= 2 ? MOLS.filter(x => ['sp', 'sp^2', 'sp^3'].includes(x[3])) : MOLS;
  const t = rnd.int(1, L >= 3 ? 4 : 2);
  const neutral = x => !x[0].includes('+') && !x[0].includes('-');
  const [f, eg, mg, hy, lp, ang, polar] = rnd.pick(t === 4 ? pool.filter(neutral) : pool);
  const sol = `${ce(f)}: ${eg} electron-domain geometry with ${m(lp)} lone pair(s) on the central atom → ${mg} molecular geometry, hybridization ${m(hy)}${ang ? ', bond angle about ' + m(ang + '^\\circ') : ''}.`;
  if (t === 1) return mk5('vsepr', L, `According to VSEPR theory, the molecular geometry of ${ce(f)} is`, mg, GEOMS.filter(g => g !== mg), sol);
  if (t === 2) return mk5('vsepr', L, `The hybridization of the central atom in ${ce(f)} is`, m(hy), HYB.filter(h => h !== hy).map(m).concat([m('sp^3d^3'), m('dsp^2')]), sol);
  if (t === 3) return numQ('vsepr', L, `How many lone pairs are on the central atom of ${ce(f)}?`, lp, [0, 1, 2, 3, 4].filter(x => x !== lp), '', sol, 3, { noGeneric: true, minRel: 0 });
  const pl = MOLS.filter(x => x[6] === !polar); const right = f;
  return mk5('vsepr', L, `Which of the following species is ${polar ? '<b>polar</b>' : '<b>non-polar</b>'}?`, opt(ce(right), null, right), rnd.shuffle(pl.filter(x => !x[0].includes('+') && !x[0].includes('-'))).slice(0, 6).map(x => opt(ce(x[0]), null, x[0])), `A molecule is polar if its bond dipoles do not cancel: this depends on the molecular geometry (${ce(f)} is ${mg}).`);
}
const SIGMAPI = [['N2', 1, 2], ['O2', 1, 1], ['CO2', 2, 2], ['HCN', 2, 2], ['C2H4', 5, 1], ['C2H2', 3, 2], ['H2O', 2, 0], ['CH2O', 3, 1], ['C2H6', 7, 0], ['SO3', 3, 1], ['HCOOH', 4, 1], ['CH3CN', 5, 2]];
const BONDTYPE = [['NaCl', 'ionic'], ['KF', 'ionic'], ['MgO', 'ionic'], ['CaO', 'ionic'], ['LiF', 'ionic'], ['KCl', 'ionic'], ['BaO', 'ionic'], ['HCl', 'polar covalent'], ['H2O', 'polar covalent'], ['NH3', 'polar covalent'], ['CO', 'polar covalent'], ['Cl2', 'non-polar covalent'], ['H2', 'non-polar covalent'], ['O2', 'non-polar covalent'], ['N2', 'non-polar covalent'], ['F2', 'non-polar covalent'], ['Cu', 'metallic'], ['Fe', 'metallic'], ['Na', 'metallic']];
function bonding(L) {
  const kind = pickByLevel(L, [[1, 3, 'type'], [2, 5, 'sp'], [3, 6, 'lattice'], [4, 6, 'res']]);
  if (kind === 'type') { const [f, t] = rnd.pick(BONDTYPE); const all = ['ionic', 'polar covalent', 'non-polar covalent', 'metallic', 'hydrogen bond'];
    return mk5('bonding', L, `The chemical bond in ${ce(f)} is mainly`, t, all.filter(x => x !== t), `Compare electronegativities: a large difference (metal + non-metal) gives an ionic bond, a small non-zero difference a polar covalent bond, identical atoms a non-polar covalent bond; metals are held by metallic bonding.`, { fixed: all }); }
  if (kind === 'sp') { const [f, s, p] = rnd.pick(SIGMAPI); const st = (a, b) => opt(m(`${a}\\ \\sigma,\\ ${b}\\ \\pi`), null, a + '|' + b);
    return mk5('bonding', L, `How many ${m('\\sigma')} and ${m('\\pi')} bonds are there in ${ce(f)}?`, st(s, p), [st(s + p, 0), st(s, p + 1), st(s - 1, p + 1), st(s + 1, p), st(s + p, p), st(Math.max(1, s - 1), p)], 'Every single bond is one ' + m('\\sigma') + ' bond; a double bond is ' + m('1\\sigma+1\\pi') + '; a triple bond is ' + m('1\\sigma+2\\pi') + '. Draw the Lewis structure and count.'); }
  if (kind === 'lattice') { const set = rnd.pick([[['MgO', 4], ['NaCl', 1], ['KBr', 1], ['CaO', 4], ['NaF', 1]], [['Al2O3', 6], ['MgO', 4], ['NaCl', 1], ['KI', 1], ['CaF2', 2]], [['LiF', 1], ['NaF', 1], ['KF', 1], ['RbF', 1], ['CsF', 1]]]);
    const best = set[0][0]; const st = s => opt(ce(s), null, s);
    return mk5('bonding', L, 'Which ionic compound has the <b>largest</b> lattice energy?', st(best), set.slice(1).map(x => st(x[0])), 'Lattice energy grows with the product of the ionic charges and decreases with the distance between the ions (larger ions → smaller lattice energy).'); }
  const RES = [['O3', 2], ['NO3-', 3], ['CO3^2-', 3], ['SO2', 2], ['NO2-', 2], ['C6H6', 2], ['HCOO-', 2]]; const [f, n] = rnd.pick(RES);
  return numQ('bonding', L, `How many equivalent resonance structures (with octets on all atoms) can be drawn for ${ce(f)}?`, n, [1, 2, 3, 4, 5].filter(x => x !== n), '', `The multiple bond can be placed on ${m(n)} equivalent positions; the real structure is the hybrid of these ${m(n)} forms.`, 3, { noGeneric: true, minRel: 0 });
}
/* molecular orbitals */
function moFill(nval, mixed) {
  const orbs = mixed ? [['s2s', 1, 1], ['s*2s', 1, -1], ['p2p', 2, 1], ['s2p', 1, 1], ['p*2p', 2, -1], ['s*2p', 1, -1]] : [['s2s', 1, 1], ['s*2s', 1, -1], ['s2p', 1, 1], ['p2p', 2, 1], ['p*2p', 2, -1], ['s*2p', 1, -1]];
  let e = nval, b = 0, a = 0, u = 0;
  for (const [, deg, sgn] of orbs) { const k = Math.min(e, 2 * deg); e -= k; if (sgn > 0) b += k; else a += k; u += k <= deg ? k : 2 * deg - k; }
  return { bo: (b - a) / 2, unp: u };
}
const DIAT = [['H2', 2, 0, true], ['H2^+', 1, 0, true], ['He2', 4, 0, true], ['He2^+', 3, 0, true], ['Li2', 2, 1], ['Be2', 4, 1], ['B2', 6, 1], ['C2', 8, 1], ['N2', 10, 1], ['O2', 12, 0], ['F2', 14, 0], ['Ne2', 16, 0], ['O2^+', 11, 0], ['O2^-', 13, 0], ['O2^2-', 14, 0], ['N2^+', 9, 1], ['N2^-', 11, 0], ['C2^2-', 10, 1], ['NO', 11, 0], ['NO^+', 10, 1], ['CO', 10, 1], ['CN^-', 10, 1]];
function moInfo([f, ne, mix, first]) { if (first) { const b = Math.min(ne, 2), a = ne - b; return { bo: (b - a) / 2, unp: ne % 2 }; } return moFill(ne, !!mix); }
function moTopic(L) {
  const kind = pickByLevel(L, [[1, 3, 'bo'], [2, 5, 'para'], [4, 6, 'len'], [3, 5, 'exist']]);
  const pool = L <= 2 ? DIAT.filter(d => ['H2', 'He2', 'N2', 'O2', 'F2', 'Li2', 'B2', 'C2', 'Ne2', 'Be2'].includes(d[0])) : DIAT;
  if (kind === 'bo') { const d = rnd.pick(pool); const x = moInfo(d); const fr = v => (Number.isInteger(v) ? String(v) : `\\frac{${v * 2}}{2}`);
    const st = v => opt(m(fr(v)), v, String(v));
    return mk5('mo', L, `According to molecular orbital theory, the bond order of ${ce(d[0])} is`, st(x.bo), [0, 0.5, 1, 1.5, 2, 2.5, 3].filter(v => v !== x.bo).map(st), `${m(d[1])} valence electrons in the MO diagram${d[2] ? ' (with s-p mixing: ' + m(r`\pi_{2p}`) + ' below ' + m(r`\sigma_{2p}`) + ')' : ''}: bond order ${m(r`=\frac{\text{bonding}-\text{antibonding}}{2}=` + fr(x.bo))}, ${m(x.unp)} unpaired electron(s).`); }
  if (kind === 'para') { const para = rnd.chance(0.5); const cands = pool.filter(d => (moInfo(d).unp > 0) === para && moInfo(d).bo > 0); const others = pool.filter(d => (moInfo(d).unp > 0) !== para && moInfo(d).bo > 0);
    const d = rnd.pick(cands); const st = x => opt(ce(x[0]), null, x[0]);
    return mk5('mo', L, `Which of the following species is <b>${para ? 'paramagnetic' : 'diamagnetic'}</b>?`, st(d), rnd.shuffle(others).map(st), `${ce(d[0])} has ${m(moInfo(d).unp)} unpaired electron(s) in its MO configuration (${m(d[1])} valence electrons).`); }
  if (kind === 'len') { const set = rnd.pick([['O2^+', 'O2', 'O2^-', 'O2^2-'], ['N2', 'O2', 'F2'], ['B2', 'C2', 'N2'], ['O2^+', 'O2', 'O2^2-']]).map(s => DIAT.find(d => d[0] === s));
    const pick = rnd.shuffle(set).slice(0, 3); if (pick.length < 2) throw new Error('len'); if (new Set(pick.map(d => moInfo(d).bo)).size < pick.length) throw new Error('tie');
    const sorted = pick.slice().sort((a, b) => moInfo(b).bo - moInfo(a).bo); const lab = arr => arr.map(d => r`\ce{${d[0]}}`).join(' < ');
    return mk5('mo', L, `Order by <b>increasing bond length</b>: ${pick.map(d => ce(d[0])).join(', ')}.`, opt(m(lab(sorted)), null, sorted.map(d => d[0]).join()), permute(pick).map(p => opt(m(lab(p)), null, p.map(d => d[0]).join())), `Higher bond order → shorter bond. Bond orders: ${pick.map(d => `${d[0]}: ${moInfo(d).bo}`).join(', ')}.`); }
  const zero = DIAT.filter(d => moInfo(d).bo === 0), pos = DIAT.filter(d => moInfo(d).bo > 0); const d = rnd.pick(zero); const st = x => opt(ce(x[0]), null, x[0]);
  return mk5('mo', L, 'According to MO theory, which species is <b>not</b> expected to exist as a stable molecule?', st(d), rnd.shuffle(pos).map(st), `${ce(d[0])} has as many antibonding as bonding electrons: bond order ${m(0)}.`);
}
const IMF = [['H2O', 'hydrogen bonding'], ['NH3', 'hydrogen bonding'], ['HF', 'hydrogen bonding'], ['CH3OH', 'hydrogen bonding'], ['HCl', 'dipole-dipole forces'], ['CH2Cl2', 'dipole-dipole forces'], ['SO2', 'dipole-dipole forces'], ['H2S', 'dipole-dipole forces'], ['CH4', 'London (dispersion) forces'], ['Cl2', 'London (dispersion) forces'], ['CO2', 'London (dispersion) forces'], ['I2', 'London (dispersion) forces'], ['C6H14', 'London (dispersion) forces'], ['N2', 'London (dispersion) forces']];
const SOLIDS = [['NaCl', 'ionic solid'], ['MgO', 'ionic solid'], ['C (diamond)', 'covalent network solid'], ['SiO2 (quartz)', 'covalent network solid'], ['Cu', 'metallic solid'], ['Fe', 'metallic solid'], ['I2', 'molecular solid'], ['CO2 (dry ice)', 'molecular solid'], ['H2O (ice)', 'molecular solid']];
function imf(L) {
  const kind = pickByLevel(L, [[1, 3, 'imf'], [2, 4, 'solid'], [3, 6, 'bp']]);
  if (kind === 'imf') { const [f, t] = rnd.pick(IMF); const all = ['hydrogen bonding', 'dipole-dipole forces', 'London (dispersion) forces', 'ion-dipole forces', 'covalent bonds'];
    return mk5('imf', L, `The strongest intermolecular forces between molecules of ${ce(f)} (pure substance) are`, t, all.filter(x => x !== t), 'H bonded to N, O or F → hydrogen bonds; other polar molecules → dipole-dipole; non-polar molecules → only London dispersion forces.', { fixed: all }); }
  if (kind === 'solid') { const [f, t] = rnd.pick(SOLIDS); const all = ['ionic solid', 'covalent network solid', 'metallic solid', 'molecular solid', 'amorphous ionic glass'];
    const fm = f.replace(/ \(.*\)$/, ''), extra = f.includes('(') ? ' ' + f.slice(f.indexOf('(')) : '';
    return mk5('imf', L, `Solid ${ce(fm)}${extra} is classified as`, t, all.filter(x => x !== t), 'Ionic solids: ions in a lattice; covalent network: atoms joined by covalent bonds throughout; metallic: cations in a sea of electrons; molecular: molecules held by intermolecular forces.', { fixed: all }); }
  const sets = [[['CH4', -162], ['C2H6', -89], ['C3H8', -42], ['C4H10', -1]], [['F2', -188], ['Cl2', -34], ['Br2', 59], ['I2', 184]], [['H2S', -60], ['H2O', 100]], [['HCl', -85], ['HF', 20]], [['CH4', -162], ['NH3', -33], ['H2O', 100]], [['CH3OCH3', -24], ['C2H5OH', 78]], [['He', -269], ['Ne', -246], ['Ar', -186], ['Kr', -153]]];
  const set = rnd.pick(sets); const pick = rnd.shuffle(set).slice(0, Math.min(3, set.length)); const sorted = pick.slice().sort((a, b) => a[1] - b[1]); const lab = arr => arr.map(x => r`\ce{${x[0]}}`).join(' < ');
  if (pick.length === 2) { const hi = sorted[1]; return mk5('imf', L, `Which substance has the higher normal boiling point?`, opt(ce(hi[0]), null, hi[0]), [opt(ce(sorted[0][0]), null, sorted[0][0]), 'they boil at the same temperature', 'it depends only on the molar mass', 'it cannot be predicted'], `Stronger intermolecular forces → higher boiling point. Boiling points: ${pick.map(x => `${x[0]} ${x[1]}\u00b0C`).join(', ')}.`); }
  return mk5('imf', L, `Order by <b>increasing normal boiling point</b>: ${pick.map(x => ce(x[0])).join(', ')}.`, opt(m(lab(sorted)), null, sorted.map(x => x[0]).join()), permute(pick).map(p => opt(m(lab(p)), null, p.map(x => x[0]).join())), `Boiling points: ${pick.map(x => `${x[0]} ${x[1]}\u00b0C`).join(', ')}. Larger molecules have stronger dispersion forces; hydrogen bonding raises the boiling point.`);
}
/* gases */
const GASES = ['O2', 'N2', 'CO2', 'CH4', 'H2', 'He', 'NH3', 'SO2', 'Cl2', 'Ar', 'C3H8', 'NO2'];
function gases(L) {
  const kind = pickByLevel(L, [[1, 2, 'V'], [2, 3, 'P'], [2, 4, 'dens'], [3, 4, 'Mfromd'], [3, 5, 'dalton'], [4, 5, 'graham'], [5, 6, 'rms'], [4, 6, 'stp'], [1, 3, 'comb']]);
  const g = rnd.pick(GASES), M = MM(g);
  if (kind === 'V') { const mass = rnd.pick([2, 4, 8, 10, 16, 20, 32]); const tc = rnd.pick([0, 20, 25, 27, 50, 100]); const P = rnd.pick([0.5, 1, 1.5, 2, 3]); const V = mass / M * R_ATM * T(tc) / P;
    return numQ('gases', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(g)} at ${m(tc + r`\ ^\circ\mathrm{C}`)} and ${m(P + r`\ \mathrm{atm}`)} occupy a volume of (ideal gas, ${m(r`R=0.0821\ \mathrm{L\,atm\,mol^{-1}K^{-1}}`)})`, V, [mass / M * R_ATM * (tc || 1) / P, mass * R_ATM * T(tc) / P, mass / M * R_SI * T(tc) / P, mass / M * R_ATM * T(tc) * P], 'L', `${m(r`V=\frac{nRT}{P}`)} with ${m(r`n=\frac{${mass}}{${sig(M, 4)}}`)} mol and ${m(r`T=${T(tc)}\ \mathrm{K}`)}.`); }
  if (kind === 'P') { const n = rnd.pick([0.25, 0.5, 1, 1.5, 2]); const V = rnd.pick([2, 5, 10, 20]); const tc = rnd.pick([0, 25, 50, 127, 227]); const P = n * R_ATM * T(tc) / V;
    const mm = rnd.chance(0.4); const val = mm ? P * 760 : P;
    return numQ('gases', L, `${m(n + r`\ \mathrm{mol}`)} of an ideal gas in a ${m(V + r`\ \mathrm{L}`)} vessel at ${m(tc + r`\ ^\circ\mathrm{C}`)} exert a pressure of`, val, mm ? [P, n * R_ATM * (tc || 1) / V * 760, P * 760 / 1000, n * R_SI * T(tc) / V] : [P * 760, n * R_ATM * (tc || 1) / V, n * R_SI * T(tc) / V, V / (n * R_ATM * T(tc))], mm ? 'mmHg' : 'atm', `${m(r`P=\frac{nRT}{V}`)} (${m(r`1\ \mathrm{atm}=760\ \mathrm{mmHg}`)}).`); }
  if (kind === 'dens') { const tc = rnd.pick([0, 25, 100]); const P = rnd.pick([1, 2, 0.5]); const d = P * M / (R_ATM * T(tc));
    return numQ('gases', L, `The density of ${ce(g)} at ${m(tc + r`\ ^\circ\mathrm{C}`)} and ${m(P + r`\ \mathrm{atm}`)} is`, d, [P * M / (R_ATM * (tc || 1)), M / 22.4, R_ATM * T(tc) / (P * M), P * M / (R_SI * T(tc))], 'g/L', `${m(r`d=\frac{PM}{RT}`)}.`); }
  if (kind === 'Mfromd') { const tc = rnd.pick([25, 27, 100]); const P = rnd.pick([1, 0.8, 1.2]); const d = P * M / (R_ATM * T(tc));
    return numQ('gases', L, `A gas has density ${m(sig(d) + r`\ \mathrm{g/L}`)} at ${m(tc + r`\ ^\circ\mathrm{C}`)} and ${m(P + r`\ \mathrm{atm}`)}. Its molar mass is`, M, [d * R_ATM * tc / P, d * 22.4, P / (d * R_ATM * T(tc)), d * R_SI * T(tc) / P], 'g/mol', `${m(r`M=\frac{dRT}{P}`)}. (It could be ${ce(g)}.)`); }
  if (kind === 'dalton') { const [a, b] = rnd.shuffle(GASES.filter(x => x !== 'NO2')).slice(0, 2); const ma = rnd.pick([2, 4, 8, 16]), mb = rnd.pick([4, 7, 14, 28]); const V = rnd.pick([5, 10, 20]); const tc = rnd.pick([0, 25]);
    const na = ma / MM(a), nb = mb / MM(b); const Pa = na * R_ATM * T(tc) / V; const ask = rnd.chance(0.5);
    if (ask) return numQ('gases', L, `A ${m(V + r`\ \mathrm{L}`)} vessel at ${m(tc + r`\ ^\circ\mathrm{C}`)} contains ${m(ma + r`\ \mathrm{g}`)} of ${ce(a)} and ${m(mb + r`\ \mathrm{g}`)} of ${ce(b)}. The partial pressure of ${ce(a)} is`, Pa, [(na + nb) * R_ATM * T(tc) / V, nb * R_ATM * T(tc) / V, na / (na + nb), ma * R_ATM * T(tc) / V], 'atm', `${m(r`P_{\ce{${a}}}=\frac{n_{\ce{${a}}}RT}{V}`)} with ${m(r`n=\frac{${ma}}{${sig(MM(a), 4)}}`)}.`);
    return numQ('gases', L, `A gas mixture contains ${m(ma + r`\ \mathrm{g}`)} of ${ce(a)} and ${m(mb + r`\ \mathrm{g}`)} of ${ce(b)}. The mole fraction of ${ce(a)} is`, na / (na + nb), [ma / (ma + mb), nb / (na + nb), na / nb, MM(a) / (MM(a) + MM(b))], '', `${m(r`x=\frac{n_{\ce{${a}}}}{n_{\ce{${a}}}+n_{\ce{${b}}}}`)}.`, 3, { minRel: 0.04 }); }
  if (kind === 'graham') { let [a, b] = rnd.shuffle(GASES).slice(0, 2); if (MM(a) > MM(b)) [a, b] = [b, a]; const ratio = Math.sqrt(MM(b) / MM(a));
    return numQ('gases', L, `The ratio between the effusion rates of ${ce(a)} and ${ce(b)} (${m(r`v_{\ce{${a}}}/v_{\ce{${b}}}`)}) is`, ratio, [MM(b) / MM(a), 1 / ratio, Math.sqrt(MM(a) / MM(b)) * 0.9, ratio * ratio * ratio], '', `Graham's law: ${m(r`\frac{v_1}{v_2}=\sqrt{\frac{M_2}{M_1}}=\sqrt{\frac{${sig(MM(b), 4)}}{${sig(MM(a), 4)}}}`)}.`, 3, { noGeneric: true, minRel: 0.04 }); }
  if (kind === 'rms') { const tc = rnd.pick([0, 25, 100, 300]); const u = Math.sqrt(3 * R_SI * T(tc) / (M / 1000));
    return numQ('gases', L, `The root-mean-square speed of ${ce(g)} molecules at ${m(tc + r`\ ^\circ\mathrm{C}`)} is`, u, [Math.sqrt(3 * R_SI * T(tc) / M), Math.sqrt(3 * R_ATM * T(tc) / (M / 1000)), Math.sqrt(R_SI * T(tc) / (M / 1000)), Math.sqrt(3 * R_SI * (tc || 1) / (M / 1000))], 'm/s', `${m(r`u_{rms}=\sqrt{\frac{3RT}{M}}`)} with ${m(r`R=8.314`)} and ${m('M')} in kg/mol.`); }
  if (kind === 'stp') { const metal = rnd.pick([['Zn', 1], ['Mg', 1], ['Fe', 1], ['Al', 1.5]]); const mass = rnd.pick([1, 2, 5, 6.5, 10]); const V = mass / MM(metal[0]) * metal[1] * 22.414;
    return numQ('gases', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(metal[0])} react completely with excess ${ce('HCl')}. The volume of ${ce('H2')} produced at STP (${m(r`0\ ^\circ\mathrm{C}`)}, ${m(r`1\ \mathrm{atm}`)}) is`, V, [mass / MM(metal[0]) * 22.414, mass * 22.414, V * 2, mass / MM(metal[0]) * metal[1] * 24.5], 'L', `${metal[0] === 'Al' ? m(r`\ce{2Al + 6HCl -> 2AlCl3 + 3H2}`) : m(r`\ce{${metal[0]} + 2HCl -> ${metal[0]}Cl2 + H2}`)}; ${m(r`n(\ce{H2})=${metal[1] === 1 ? '' : '1.5\\,'}n(\ce{${metal[0]}})`)}, and ${m(r`V_m=22.4\ \mathrm{L/mol}`)} at STP.`); }
  const P1 = rnd.pick([1, 2, 1.5]), V1 = rnd.pick([2, 4, 5, 10]), t1 = rnd.pick([0, 25, 27]), P2 = rnd.pick([0.5, 3, 4, 2.5]), t2 = rnd.pick([100, 127, 50, 227]); const V2 = P1 * V1 * T(t2) / (T(t1) * P2);
  return numQ('gases', L, `A gas occupies ${m(V1 + r`\ \mathrm{L}`)} at ${m(P1 + r`\ \mathrm{atm}`)} and ${m(t1 + r`\ ^\circ\mathrm{C}`)}. Its volume at ${m(P2 + r`\ \mathrm{atm}`)} and ${m(t2 + r`\ ^\circ\mathrm{C}`)} is`, V2, [P1 * V1 * (t2 || 1) / ((t1 || 1) * P2), P2 * V1 * T(t2) / (T(t1) * P1), P1 * V1 * T(t1) / (T(t2) * P2), P1 * V1 / P2], 'L', `${m(r`\frac{P_1V_1}{T_1}=\frac{P_2V_2}{T_2}`)} with temperatures in kelvin.`);
}
function liquids(L) {
  const kind = pickByLevel(L, [[1, 3, 'concept'], [2, 3, 'vap'], [3, 5, 'heat'], [4, 6, 'cc']]);
  if (kind === 'concept') { const B = [['The normal boiling point of a liquid is the temperature at which', 'its vapour pressure equals 1 atm', ['its vapour pressure is zero', 'it starts to evaporate', 'its vapour pressure equals the critical pressure', 'the liquid and the solid coexist']], ['At the triple point of a pure substance', 'solid, liquid and vapour coexist at equilibrium', ['liquid and vapour become indistinguishable', 'the substance sublimes at 1 atm', 'the vapour pressure is 1 atm', 'only the solid is stable']], ['Above the critical temperature', 'the gas cannot be liquefied by increasing the pressure', ['the liquid boils at any pressure', 'the solid melts', 'the vapour pressure is zero', 'the substance is always a solid']], ['The solid–liquid line in the phase diagram of water has a negative slope because', 'ice is less dense than liquid water', ['water has hydrogen bonds in the vapour', 'ice sublimes at 1 atm', 'liquid water is less dense than ice', 'the triple point is at 1 atm']], ['Increasing the intermolecular forces of a liquid', 'decreases its vapour pressure and raises its boiling point', ['increases its vapour pressure', 'lowers its boiling point', 'does not affect its vapour pressure', 'lowers its viscosity']]];
    const [q, a, w] = rnd.pick(B); return mk5('liquids', L, q, a, w, 'Phase equilibria and the phase diagram.'); }
  if (kind === 'vap') { const sub = rnd.pick([['H2O', 40.7], ['C2H5OH', 38.6], ['CH3OH', 35.2], ['C6H6', 30.8]]); const mass = rnd.pick([10, 18, 25, 50, 100]); const q = mass / MM(sub[0]) * sub[1];
    return numQ('liquids', L, `The heat needed to vaporize ${m(mass + r`\ \mathrm{g}`)} of ${ce(sub[0])} at its boiling point (${m(r`\Delta H_{vap}=${sub[1]}\ \mathrm{kJ/mol}`)}) is`, q, [mass * sub[1], sub[1] / mass, q * 1000, mass / sub[1]], 'kJ', `${m(r`q=n\,\Delta H_{vap}`)} with ${m(r`n=\frac{${mass}}{${sig(MM(sub[0]), 4)}}`)}.`); }
  if (kind === 'heat') { const mass = rnd.pick([10, 20, 50, 100]); const t0 = rnd.pick([-20, -10, -5]); const t1 = rnd.pick([20, 40, 60, 80]);
    const q = (mass * 2.09 * (0 - t0) + mass / 18.02 * 6010 + mass * 4.184 * t1) / 1000;
    return numQ('liquids', L, `How much heat is required to turn ${m(mass + r`\ \mathrm{g}`)} of ice at ${m(t0 + r`\ ^\circ\mathrm{C}`)} into liquid water at ${m(t1 + r`\ ^\circ\mathrm{C}`)}? (${m(r`c_{ice}=2.09`)}, ${m(r`c_{water}=4.184\ \mathrm{J\,g^{-1}K^{-1}}`)}, ${m(r`\Delta H_{fus}=6.01\ \mathrm{kJ/mol}`)})`, q, [(mass * 4.184 * (t1 - t0)) / 1000, (mass * 2.09 * (-t0) + mass * 4.184 * t1) / 1000, (mass * 2.09 * (-t0) + mass * 6010 + mass * 4.184 * t1) / 1000, q * 1000 / 1000 + mass / 18.02 * 40.7], 'kJ', `Three steps: heat the ice to ${m(r`0\ ^\circ C`)}, melt it (${m(r`n\,\Delta H_{fus}`)}), heat the water to ${m(t1 + r`\ ^\circ C`)}.`); }
  const sub = rnd.pick([['H2O', 40.7, 100], ['C2H5OH', 38.6, 78.3], ['C6H6', 30.8, 80.1]]); const t2 = sub[2] - rnd.pick([20, 30, 40, 50]); const P2 = Math.exp(-sub[1] * 1000 / R_SI * (1 / T(t2) - 1 / T(sub[2])));
  return numQ('liquids', L, `${ce(sub[0])} boils at ${m(sub[2] + r`\ ^\circ\mathrm{C}`)} at ${m(r`1\ \mathrm{atm}`)}, with ${m(r`\Delta H_{vap}=${sub[1]}\ \mathrm{kJ/mol}`)}. Its vapour pressure at ${m(sig(t2, 3) + r`\ ^\circ\mathrm{C}`)} is (Clausius–Clapeyron)`, P2, [Math.exp(-sub[1] / R_SI * (1 / T(t2) - 1 / T(sub[2]))), 1 / P2, Math.exp(-sub[1] * 1000 / R_SI * (1 / t2 - 1 / sub[2])), P2 * 2.303], 'atm', `${m(r`\ln\frac{P_2}{P_1}=-\frac{\Delta H_{vap}}{R}\left(\frac{1}{T_2}-\frac{1}{T_1}\right)`)} with ${m(r`\Delta H`)} in J/mol and ${m('T')} in K.`);
}
const SOLUTES = [['NaCl', 2], ['KNO3', 2], ['C6H12O6', 1], ['CaCl2', 3], ['MgSO4', 2], ['K2SO4', 3], ['C12H22O11', 1], ['CO(NH2)2', 1], ['AlCl3', 4], ['NaOH', 2], ['CuSO4', 2], ['KCl', 2]];
function solutions(L) {
  const kind = pickByLevel(L, [[1, 2, 'M'], [1, 3, 'dil'], [2, 3, 'molal'], [3, 4, 'x'], [3, 5, 'wM'], [3, 5, 'fp'], [4, 6, 'bp'], [4, 6, 'osm'], [5, 6, 'molarmass'], [4, 6, 'raoult']]);
  const [s, i] = rnd.pick(SOLUTES), M = MM(s);
  if (kind === 'M') { const mass = rnd.pick([1, 2.5, 5, 10, 20, 25]); const V = rnd.pick([100, 250, 500, 1000]); const c = mass / M / (V / 1000);
    return numQ('solutions', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(s)} are dissolved in water to give ${m(V + r`\ \mathrm{mL}`)} of solution. The molar concentration is`, c, [mass / M / V, mass / (V / 1000), mass / M * (V / 1000), c * i], 'mol/L', `${m(r`c=\frac{n}{V}=\frac{${mass}/${sig(M, 4)}}{${V / 1000}\ \mathrm{L}}`)}.`); }
  if (kind === 'dil') { const c1 = rnd.pick([0.5, 1, 2, 6, 12]); const c2 = rnd.pick([0.05, 0.1, 0.25, 0.2]); const V2 = rnd.pick([100, 250, 500, 1000]); const V1 = c2 * V2 / c1;
    return numQ('solutions', L, `What volume of ${m(c1 + r`\ \mathrm{M}`)} stock solution is needed to prepare ${m(V2 + r`\ \mathrm{mL}`)} of a ${m(c2 + r`\ \mathrm{M}`)} solution?`, V1, [c1 * V2 / c2, c1 * c2 * V2, V2 - V1, c2 / (c1 * V2)], 'mL', `${m(r`c_1V_1=c_2V_2`)}.`); }
  if (kind === 'molal') { const mass = rnd.pick([5, 10, 18, 20, 30]); const w = rnd.pick([100, 200, 250, 500]); const b = mass / M / (w / 1000);
    return numQ('solutions', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(s)} are dissolved in ${m(w + r`\ \mathrm{g}`)} of water. The molality is`, b, [mass / M / w, mass / M / ((w + mass) / 1000), mass / (w / 1000), b * i], 'mol/kg', `${m(r`b=\frac{n_{solute}}{m_{solvent}\ (\mathrm{kg})}`)}.`); }
  if (kind === 'x') { const mass = rnd.pick([5, 10, 20, 30]); const w = rnd.pick([50, 100, 200]); const n1 = mass / M, n2 = w / MM('H2O'); const x = n1 / (n1 + n2);
    return numQ('solutions', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(s)} are dissolved in ${m(w + r`\ \mathrm{g}`)} of water. The mole fraction of the solute is`, x, [n1 / n2, mass / (mass + w), n2 / (n1 + n2), n1 / (n1 + w)], '', `${m(r`x=\frac{n_{solute}}{n_{solute}+n_{\ce{H2O}}}`)} with ${m(r`n_{\ce{H2O}}=\frac{${w}}{18.02}`)}.`, 3, { minRel: 0.04 }); }
  if (kind === 'wM') { const [a, w, d] = rnd.pick([['HCl', 37, 1.19], ['H2SO4', 96, 1.84], ['HNO3', 65, 1.39], ['NH3', 28, 0.90], ['CH3COOH', 99.5, 1.05]]); const c = 1000 * d * w / 100 / MM(a);
    return numQ('solutions', L, `A commercial ${ce(a)} solution is ${m(w + r`\%`)} by mass, with density ${m(d + r`\ \mathrm{g/mL}`)}. Its molar concentration is`, c, [d * w / 100 / MM(a), 1000 * w / 100 / MM(a), 1000 * d / MM(a), c / d], 'mol/L', `One litre has mass ${m(1000 * d + r`\ \mathrm{g}`)}, of which ${m(w + r`\%`)} is ${ce(a)}: ${m(r`c=\frac{${1000 * d}\cdot ${w / 100}}{${sig(MM(a), 4)}}`)}.`); }
  if (kind === 'fp' || kind === 'bp') { const mass = rnd.pick([5, 10, 20, 30, 50]); const w = rnd.pick([100, 200, 250, 500]); const b = mass / M / (w / 1000); const K = kind === 'fp' ? 1.86 : 0.512; const dT = i * K * b; const val = kind === 'fp' ? -dT : 100 + dT;
    const W = kind === 'fp' ? [-K * b, -i * K * mass / M / w, dT, -i * K * b * 1000 / 1000 * 2] : [100 + K * b, 100 + i * K * mass / M / w, 100 - dT, 100 + 2 * dT];
    return numQ('solutions', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(s)} (${i === 1 ? 'non-electrolyte' : 'strong electrolyte'}) are dissolved in ${m(w + r`\ \mathrm{g}`)} of water (${kind === 'fp' ? m(r`K_f=1.86`) : m(r`K_{eb}=0.512`)} ${m(r`\mathrm{K\,kg\,mol^{-1}}`)}). The ${kind === 'fp' ? 'freezing' : 'boiling'} point of the solution is`, val, W, r`^\circ C`, `${m(r`\Delta T=i\,K\,b`)} with ${m('i=' + i)} and ${m(r`b=${sig(b)}\ \mathrm{mol/kg}`)}: ${m(r`\Delta T=${sig(dT)}\ \mathrm{K}`)}.`, kind === 'bp' ? 5 : 3, { noGeneric: true, minRel: kind === 'bp' ? 0.0004 : 0.03 }); }
  if (kind === 'osm') { const c = rnd.pick([0.01, 0.05, 0.1, 0.15, 0.2]); const tc = rnd.pick([25, 37]); const p = i * c * R_ATM * T(tc);
    return numQ('solutions', L, `The osmotic pressure of a ${m(c + r`\ \mathrm{M}`)} solution of ${ce(s)} (${i === 1 ? 'non-electrolyte' : 'strong electrolyte'}) at ${m(tc + r`\ ^\circ\mathrm{C}`)} is`, p, [c * R_ATM * T(tc), i * c * R_ATM * tc, i * c * R_SI * T(tc), p * 760 / 1000], 'atm', `${m(r`\pi=i\,c\,R\,T`)} with ${m('i=' + i)}.`); }
  if (kind === 'raoult') { const [ns, nn] = rnd.pick([['C6H12O6', 1], ['C12H22O11', 1], ['CO(NH2)2', 1]]); const mass = rnd.pick([20, 50, 90, 100]); const w = rnd.pick([100, 200, 250]); const P0 = 23.8; const x = (w / 18.02) / (w / 18.02 + mass / MM(ns)); const P = x * P0; void nn;
    return numQ('solutions', L, `${m(mass + r`\ \mathrm{g}`)} of ${ce(ns)} (non-volatile) are dissolved in ${m(w + r`\ \mathrm{g}`)} of water at ${m(r`25\ ^\circ\mathrm{C}`)} (${m(r`P^\circ_{\ce{H2O}}=23.8\ \mathrm{mmHg}`)}). The vapour pressure of the solution is`, P, [(1 - x) * P0, P0 - x, P0 * w / (w + mass), P0 * x * x], 'mmHg', `Raoult: ${m(r`P=x_{\ce{H2O}}\,P^\circ`)} with ${m(r`x_{\ce{H2O}}=${sig(x, 4)}`)}.`, 3, { noGeneric: true, minRel: 0.004 }); }
  const Mx = rnd.pick([60, 92, 128, 180, 342]); const mass = rnd.pick([5, 10, 15, 20]); const w = rnd.pick([100, 200, 250]); const dT = 1.86 * mass / Mx / (w / 1000);
  return numQ('solutions', L, `Dissolving ${m(mass + r`\ \mathrm{g}`)} of a non-electrolyte in ${m(w + r`\ \mathrm{g}`)} of water lowers the freezing point by ${m(sig(dT) + r`\ \mathrm{K}`)} (${m(r`K_f=1.86`)}). The molar mass of the solute is`, Mx, [1.86 * mass / dT / w, dT * w / (1.86 * mass), 1.86 * mass / dT, Mx * 2], 'g/mol', `${m(r`b=\frac{\Delta T}{K_f}`)}, ${m(r`n=b\cdot m_{solvent}`)}, ${m(r`M=\frac{m}{n}`)}.`);
}
/* thermochemistry */
const HF = { 'CH4(g)': -74.87, 'C2H6(g)': -84.68, 'C3H8(g)': -103.8, 'C4H10(g)': -126.1, 'C2H4(g)': 52.47, 'C2H2(g)': 226.7, 'C6H6(l)': 49.04, 'C8H18(l)': -250.2, 'CH3OH(l)': -238.6, 'C2H5OH(l)': -277.0, 'CO(g)': -110.5, 'CO2(g)': -393.5, 'H2O(l)': -285.8, 'H2O(g)': -241.8, 'CaCO3(s)': -1207, 'CaO(s)': -635.1, 'MgO(s)': -601.2, 'Fe2O3(s)': -824.2, 'Fe3O4(s)': -1118, 'FeO(s)': -266.7, 'Al2O3(s)': -1676, 'NH3(g)': -45.94, 'NO(g)': 90.29, 'NO2(g)': 33.09, 'N2H4(g)': 95.19, 'SiO2(s)': -910.9, 'ZnO(s)': -348.3, 'BaO(s)': -553.4, 'BaCO3(s)': -1216, 'Ca(OH)2(s)': -986.1, 'LiOH(s)': -484.9, 'Li2O(s)': -598.7, 'Na2CO3(s)': -1131, 'Na2O(s)': -418.0, 'B2H6(g)': 35.61, 'B2O3(s)': -1272, 'HCN(g)': 135.1, 'CS2(g)': 280.3, 'H2S(g)': -20.50 };
const hf = s => (s in HF ? HF[s] : 0);
const RXN_H = [[['CH4(g)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C2H6(g)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C3H8(g)', 'O2(g)'], ['CO2(g)', 'H2O(g)']], [['C4H10(g)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C2H4(g)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C2H2(g)', 'O2(g)'], ['CO2(g)', 'H2O(g)']], [['C2H5OH(l)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['CH3OH(l)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C6H6(l)', 'O2(g)'], ['CO2(g)', 'H2O(l)']], [['C8H18(l)', 'O2(g)'], ['CO2(g)', 'H2O(g)']], [['CaCO3(s)'], ['CaO(s)', 'CO2(g)']], [['BaCO3(s)'], ['BaO(s)', 'CO2(g)']], [['Ca(OH)2(s)'], ['CaO(s)', 'H2O(g)']], [['Fe2O3(s)', 'CO(g)'], ['Fe(s)', 'CO2(g)']], [['Fe2O3(s)', 'Al(s)'], ['Al2O3(s)', 'Fe(s)']], [['NH3(g)', 'O2(g)'], ['NO(g)', 'H2O(g)']], [['NO(g)', 'O2(g)'], ['NO2(g)']], [['N2H4(g)', 'O2(g)'], ['N2(g)', 'H2O(g)']], [['C2H2(g)', 'H2(g)'], ['C2H6(g)']], [['C2H4(g)', 'H2(g)'], ['C2H6(g)']], [['CO(g)', 'H2O(g)'], ['CO2(g)', 'H2(g)']], [['CH4(g)', 'H2O(g)'], ['CO(g)', 'H2(g)']], [['ZnO(s)', 'CO(g)'], ['Zn(s)', 'CO2(g)']], [['SiO2(s)', 'C(s)'], ['Si(s)', 'CO(g)']], [['B2H6(g)', 'O2(g)'], ['B2O3(s)', 'H2O(g)']], [['LiOH(s)'], ['Li2O(s)', 'H2O(g)']]];
function dHr(re, pr, co) { let s = 0; pr.forEach((p, i) => { s += co[re.length + i] * hf(p); }); re.forEach((x, i) => { s -= co[i] * hf(x); }); return s; }
function thermo(L) {
  const kind = pickByLevel(L, [[1, 4, 'dH'], [2, 3, 'calor'], [3, 5, 'burn'], [3, 5, 'hess'], [4, 6, 'mix'], [4, 6, 'gibbs'], [5, 6, 'Tspont'], [1, 3, 'signs']]);
  if (kind === 'dH' || kind === 'burn') {
    const [re, pr] = rnd.pick(kind === 'burn' ? RXN_H.slice(0, 10) : RXN_H); const co = balance(re, pr); if (!co) throw new Error('bal');
    const dH = dHr(re, pr, co); const eq = m(r`\ce{` + eqTex(re, pr, co) + '}');
    if (kind === 'dH') { const wrong1 = -dH, wrong2 = pr.reduce((s, p) => s + hf(p), 0) - re.reduce((s, x) => s + hf(x), 0), wrong3 = dH + co[0] * hf(re[0]) * 2 * (re[0].endsWith('(l)') || re[0].endsWith('(g)') ? 1 : 0);
      return numQ('thermo', L, `Using the standard enthalpies of formation (table), ${m(r`\Delta H^\circ`)} of the reaction ${eq} is`, dH, [wrong1, wrong2, wrong3, dH / co[0], dH * 2], 'kJ', `${m(r`\Delta H^\circ=\sum\nu\,\Delta H^\circ_f(\text{products})-\sum\nu\,\Delta H^\circ_f(\text{reactants})`)}; elements in their standard state have ${m(r`\Delta H^\circ_f=0`)}.`, 4, { noGeneric: true, minRel: 0.02 }); }
    const fuel = re[0]; const mass = rnd.pick([1, 5, 10, 16, 20, 50, 100]); const n = mass / MM(fuel); const q = -dH / co[0] * n;
    return numQ('thermo', L, `For ${eq}, ${m(r`\Delta H^\circ=${sig(dH, 4)}\ \mathrm{kJ}`)}. The heat released by the combustion of ${m(mass + r`\ \mathrm{g}`)} of ${ce(fuel.replace(/\(.*\)/, ''))} is`, q, [-dH * n, -dH / co[0] * mass, -dH / co[0] / n, q * 1000], 'kJ', `${m(r`n=\frac{${mass}}{${sig(MM(fuel), 4)}}`)} mol; the given ${m(r`\Delta H^\circ`)} refers to ${m(co[0])} mol of fuel, so ${m(r`q=n\cdot\frac{|\Delta H^\circ|}{${co[0]}}`)}.`);
  }
  if (kind === 'calor') { const mass = rnd.pick([50, 100, 150, 200, 250]); const dT = rnd.pick([5, 10, 12.5, 20, 25]); const q = mass * 4.184 * dT / 1000;
    return numQ('thermo', L, `How much heat is needed to raise the temperature of ${m(mass + r`\ \mathrm{g}`)} of water by ${m(dT + r`\ \mathrm{K}`)}? (${m(r`c=4.184\ \mathrm{J\,g^{-1}K^{-1}}`)})`, q, [q * 1000, mass * dT / 1000, mass * 4.184 / dT / 1000, mass * 4.184 * (dT + 273.15) / 1000], 'kJ', `${m(r`q=m\,c\,\Delta T`)}.`); }
  if (kind === 'mix') { const [mt, c] = rnd.pick([['Fe', 0.449], ['Cu', 0.385], ['Al', 0.897], ['Pb', 0.128]]); const m1 = rnd.pick([50, 100, 200]), t1 = rnd.pick([80, 90, 100, 150]); const m2 = rnd.pick([100, 200, 250, 500]), t2 = rnd.pick([15, 20, 25]); const tf = (m1 * c * t1 + m2 * 4.184 * t2) / (m1 * c + m2 * 4.184);
    return numQ('thermo', L, `A ${m(m1 + r`\ \mathrm{g}`)} block of ${ce(mt)} (${m(r`c=${c}\ \mathrm{J\,g^{-1}K^{-1}}`)}) at ${m(t1 + r`\ ^\circ\mathrm{C}`)} is dropped into ${m(m2 + r`\ \mathrm{g}`)} of water at ${m(t2 + r`\ ^\circ\mathrm{C}`)}. The final temperature (no heat losses) is`, tf, [(t1 + t2) / 2, (m1 * t1 + m2 * t2) / (m1 + m2), (m1 * c * t1 + m2 * t2) / (m1 * c + m2), t2 + (t1 - t2) * c], r`^\circ C`, `Heat lost by the metal = heat gained by the water: ${m(r`m_1c_1(t_1-t_f)=m_2c_2(t_f-t_2)`)}.`, 3, { noGeneric: true, minRel: 0.01 }); }
  if (kind === 'hess') { const S = rnd.pick([
      [['C(s) + O2(g) -> CO2(g)', -393.5], ['2CO(g) + O2(g) -> 2CO2(g)', -566.0], 'C(s) + 1/2 O2(g) -> CO(g)', [1, -0.5]],
      [['N2(g) + O2(g) -> 2NO(g)', 180.6], ['2NO(g) + O2(g) -> 2NO2(g)', -114.1], 'N2(g) + 2O2(g) -> 2NO2(g)', [1, 1]],
      [['S(s) + O2(g) -> SO2(g)', -296.8], ['2SO2(g) + O2(g) -> 2SO3(g)', -197.8], 'S(s) + 3/2 O2(g) -> SO3(g)', [1, 0.5]],
      [['H2(g) + 1/2 O2(g) -> H2O(l)', -285.8], ['H2O(g) -> H2O(l)', -44.0], 'H2(g) + 1/2 O2(g) -> H2O(g)', [1, -1]],
      [['C(s) + 2H2(g) -> CH4(g)', -74.8], ['C(s) + O2(g) -> CO2(g)', -393.5], 'CH4(g) + O2(g) -> C(s) + 2H2(g) + O2(g)', [-1, 0]]].slice(0, 4));
    const [[r1, h1], [r2, h2], tgt, [a, b]] = S; const v = a * h1 + b * h2;
    return numQ('thermo', L, `Given (1) ${m(r`\ce{${r1}}`)} ${m(r`\Delta H_1=${h1}\ \mathrm{kJ}`)} and (2) ${m(r`\ce{${r2}}`)} ${m(r`\Delta H_2=${h2}\ \mathrm{kJ}`)}, the enthalpy change of ${m(r`\ce{${tgt}}`)} is`, v, [h1 + h2, h1 - h2, a * h1 - b * h2, 2 * v, -v], 'kJ', `Hess's law: target ${m(`=${a}\\cdot(1)${b >= 0 ? '+' : ''}${b}\\cdot(2)`)}, so ${m(r`\Delta H=${a}\cdot(${h1})${b >= 0 ? '+' : ''}${b}\cdot(${h2})`)}.`, 4, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'gibbs') { const dH = rnd.pick([-120, -92.2, -50, 40, 178, 92]); const dS = rnd.pick([-200, -150, -80, 50, 120, 160]); const tc = rnd.pick([25, 100, 500, 1000]); const G0 = dH - T(tc) * dS / 1000;
    return numQ('thermo', L, `For a reaction ${m(r`\Delta H^\circ=${dH}\ \mathrm{kJ}`)} and ${m(r`\Delta S^\circ=${dS}\ \mathrm{J/K}`)}. Assuming they do not depend on temperature, ${m(r`\Delta G^\circ`)} at ${m(tc + r`\ ^\circ\mathrm{C}`)} is`, G0, [dH - T(tc) * dS, dH - tc * dS / 1000, dH + T(tc) * dS / 1000, -G0], 'kJ', `${m(r`\Delta G^\circ=\Delta H^\circ-T\Delta S^\circ`)} with ${m('T')} in kelvin and ${m(r`\Delta S`)} converted to kJ/K.`, 3, { noGeneric: true, minRel: 0.03 }); }
  if (kind === 'Tspont') { const sgn = rnd.chance(0.5); const dH = sgn ? rnd.pick([50, 90, 120, 178]) : -rnd.pick([50, 90, 120]); const dS = sgn ? rnd.pick([100, 150, 160, 200]) : -rnd.pick([100, 150, 200]); const Tk = dH * 1000 / dS;
    return numQ('thermo', L, `For a reaction with ${m(r`\Delta H^\circ=${dH}\ \mathrm{kJ}`)} and ${m(r`\Delta S^\circ=${dS}\ \mathrm{J/K}`)}, the reaction is spontaneous (standard conditions) ${sgn ? 'above' : 'below'} the temperature`, Tk, [dH / dS, Tk - 273.15, dS / dH * 1000, Tk * 2], 'K', `Set ${m(r`\Delta G^\circ=0`)}: ${m(r`T=\frac{\Delta H^\circ}{\Delta S^\circ}=\frac{${dH * 1000}}{${dS}}`)}; ${sgn ? 'with ΔH > 0 and ΔS > 0 it is spontaneous at high T' : 'with ΔH < 0 and ΔS < 0 it is spontaneous at low T'}.`); }
  const all = ['spontaneous at all temperatures', 'non-spontaneous at all temperatures', 'spontaneous only at high temperature', 'spontaneous only at low temperature', 'always at equilibrium'];
  const c = rnd.int(0, 3); const H = c === 0 || c === 3 ? '<0' : '>0', Ssgn = c === 0 || c === 2 ? '>0' : '<0';
  return mk5('thermo', L, `A reaction has ${m(r`\Delta H` + H)} and ${m(r`\Delta S` + Ssgn)}. It is`, all[c], all.filter((_, i) => i !== c), `${m(r`\Delta G=\Delta H-T\Delta S`)}: look at the signs of the two terms.`, { fixed: all });
}
/* equilibrium */
const EQS = [['N2(g) + 3H2(g) <=> 2NH3(g)', -2], ['2SO2(g) + O2(g) <=> 2SO3(g)', -1], ['PCl5(g) <=> PCl3(g) + Cl2(g)', 1], ['N2O4(g) <=> 2NO2(g)', 1], ['CO(g) + Cl2(g) <=> COCl2(g)', -1], ['H2(g) + I2(g) <=> 2HI(g)', 0], ['CaCO3(s) <=> CaO(s) + CO2(g)', 1], ['2NO(g) + O2(g) <=> 2NO2(g)', -1]];
function equilibrium(L) {
  const kind = pickByLevel(L, [[1, 3, 'lechat'], [2, 4, 'kp'], [3, 5, 'Q'], [4, 6, 'ice']]);
  if (kind === 'kp') { const [eq, dn] = rnd.pick(EQS.filter(e => e[1] !== 0)); const Kc = rnd.pick([0.5, 1.2, 4.0, 25, 2.5e-3, 6.0e2]); const tc = rnd.pick([200, 300, 400, 500, 727]); const Kp = Kc * Math.pow(R_ATM * T(tc), dn);
    return numQ('equilibrium', L, `For ${m(r`\ce{${eq}}`)}, ${m(r`K_c=${sig(Kc)}`)} at ${m(tc + r`\ ^\circ\mathrm{C}`)}. Then ${m('K_p')} is`, Kp, [Kc * Math.pow(R_ATM * T(tc), -dn), Kc * Math.pow(R_ATM * tc, dn), Kc * Math.pow(R_SI * T(tc), dn), Kc], '', `${m(r`K_p=K_c(RT)^{\Delta n}`)} with ${m(r`\Delta n=${dn}`)} (moles of gaseous products − reactants).`); }
  if (kind === 'Q') { const all = ['it proceeds towards the products', 'it proceeds towards the reactants', 'it is already at equilibrium', 'it cannot be predicted without the temperature', 'the equilibrium constant changes']; const K = rnd.pick([0.5, 4, 10, 50]); const a = rnd.pick([0.1, 0.2, 0.5, 1]), b = rnd.pick([0.1, 0.2, 0.5, 1]), c = rnd.pick([0.1, 0.4, 1, 2]);
    const Q = c * c / (a * b); if (Math.abs(Q / K - 1) < 0.15) throw new Error('close'); const ans = Q < K ? 0 : 1;
    return mk5('equilibrium', L, `For ${m(r`\ce{H2(g) + I2(g) <=> 2HI(g)}`)}, ${m(r`K_c=${K}`)}. A mixture has ${m(r`[\ce{H2}]=${a}`)}, ${m(r`[\ce{I2}]=${b}`)}, ${m(r`[\ce{HI}]=${c}\ \mathrm{M}`)}. The reaction`, all[ans], all.filter((_, i) => i !== ans), `${m(r`Q=\frac{[\ce{HI}]^2}{[\ce{H2}][\ce{I2}]}=${sig(Q)}`)}; ${Q < K ? m('Q<K') + ': more products form' : m('Q>K') + ': it shifts back to reactants'}.`, { fixed: all }); }
  if (kind === 'ice') { const a = rnd.pick([0.1, 0.2, 0.5, 1.0]); const K = rnd.pick([4, 9, 16, 25, 49, 64]); const s = Math.sqrt(K); const x = a * s / (2 + s);
    return numQ('equilibrium', L, `${m(a + r`\ \mathrm{mol}`)} each of ${ce('H2')} and ${ce('I2')} are placed in a ${m(r`1\ \mathrm{L}`)} vessel: ${m(r`\ce{H2(g) + I2(g) <=> 2HI(g)}`)}, ${m(r`K_c=${K}`)}. The equilibrium concentration of ${ce('HI')} is`, 2 * x, [x, a * s / (1 + s), 2 * a, a * K / (1 + K)], 'mol/L', `ICE table: ${m(r`\frac{(2x)^2}{(${a}-x)^2}=${K}`)} → ${m(r`\frac{2x}{${a}-x}=${s}`)} → ${m(r`x=${sig(x)}`)}, ${m(r`[\ce{HI}]=2x`)}.`); }
  const B = [['For an exothermic equilibrium, raising the temperature', 'shifts the equilibrium towards the reactants and decreases K', ['shifts it towards the products and increases K', 'does not change K', 'shifts it towards the products, K unchanged', 'stops the reaction']], ['For ' + m(r`\ce{N2(g) + 3H2(g) <=> 2NH3(g)}`) + ', decreasing the volume of the container', 'shifts the equilibrium towards NH₃', ['shifts it towards N₂ and H₂', 'has no effect', 'changes the value of K', 'decreases the amount of NH₃']], ['Adding a catalyst to a system at equilibrium', 'does not shift the equilibrium', ['shifts it towards the products', 'increases K', 'shifts it towards the reactants', 'decreases the activation energy of the forward reaction only']], ['For ' + m(r`\ce{CaCO3(s) <=> CaO(s) + CO2(g)}`) + ', the equilibrium constant is', m(r`K_c=[\ce{CO2}]`), [m(r`K_c=\frac{[\ce{CaO}][\ce{CO2}]}{[\ce{CaCO3}]}`), m(r`K_c=\frac{[\ce{CaCO3}]}{[\ce{CO2}]}`), m(r`K_c=[\ce{CaO}]`), m(r`K_c=1`)]], ['For ' + m(r`\ce{H2(g) + I2(g) <=> 2HI(g)}`) + ', increasing the total pressure', 'does not shift the equilibrium', ['shifts it towards HI', 'shifts it towards H₂ and I₂', 'increases K', 'decreases K']]];
  const [q, a, w] = rnd.pick(B); return mk5('equilibrium', L, q, a, w, 'Le Chatelier: the system shifts to partially counteract the perturbation; only temperature changes K.');
}
/* acids & bases */
const WEAK = [['CH3COOH', 1.8e-5, 'acetic acid'], ['HF', 6.8e-4, 'hydrofluoric acid'], ['HNO2', 4.5e-4, 'nitrous acid'], ['HCOOH', 1.8e-4, 'formic acid'], ['HCN', 4.9e-10, 'hydrocyanic acid'], ['C6H5COOH', 6.3e-5, 'benzoic acid']];
const ph = h => -Math.log10(h);
function acidbase(L) {
  const kind = pickByLevel(L, [[1, 2, 'sa'], [1, 3, 'sb'], [3, 4, 'wa'], [3, 5, 'wb'], [4, 6, 'buf'], [5, 6, 'mix'], [2, 3, 'concept']]);
  const conc = () => rnd.pick([1, 2, 2.5, 5]) * Math.pow(10, -rnd.int(1, 4));
  if (kind === 'sa') { const a = rnd.pick(['HCl', 'HNO3', 'HClO4', 'HBr']); const c = conc(); return numQ('acidbase', L, `The pH of a ${m(sig(c, 2) + r`\ \mathrm{M}`)} solution of ${ce(a)} is`, ph(c), [14 - ph(c), -Math.log(c), ph(c / 2), ph(c) + 1, c], '', `Strong monoprotic acid: ${m(r`[\ce{H3O+}]=c`)}, ${m(r`\mathrm{pH}=-\log c`)}.`, 3, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'sb') { const [b, k] = rnd.pick([['NaOH', 1], ['KOH', 1], ['Ba(OH)2', 2], ['Ca(OH)2', 2]]); const c = conc(); const p = 14 + Math.log10(k * c);
    return numQ('acidbase', L, `The pH of a ${m(sig(c, 2) + r`\ \mathrm{M}`)} solution of ${ce(b)} (strong base) is`, p, [14 - p, 14 + Math.log10(c * (k === 1 ? 2 : 1)), -Math.log10(k * c), p - 1].filter(x => Math.abs(x - p) > 0.05), '', `${m(r`[\ce{OH-}]=${k === 1 ? '' : k}c`)}, ${m(r`\mathrm{pOH}=-\log[\ce{OH-}]`)}, ${m(r`\mathrm{pH}=14-\mathrm{pOH}`)}.`, 3, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'wa') { const [a, Ka, nm] = rnd.pick(WEAK); const c = rnd.pick([0.01, 0.05, 0.1, 0.2, 0.5, 1]); const h = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
    return numQ('acidbase', L, `The pH of a ${m(c + r`\ \mathrm{M}`)} solution of ${nm} (${ce(a)}, ${m(r`K_a=${sig(Ka, 2)}`)}) is`, ph(h), [ph(c), ph(Ka * c), 14 - ph(h), ph(Math.sqrt(Ka / c))], '', `${m(r`K_a=\frac{x^2}{c-x}`)}; ${m(r`x=[\ce{H3O+}]\approx\sqrt{K_a c}`)} (exact quadratic: ${m(sig(h))} M).`, 3, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'wb') { const [b, Kb, nm] = rnd.pick([['NH3', 1.8e-5, 'ammonia'], ['CH3NH2', 4.4e-4, 'methylamine']]); const c = rnd.pick([0.01, 0.05, 0.1, 0.2]); const oh = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * c)) / 2; const p = 14 - ph(oh);
    return numQ('acidbase', L, `The pH of a ${m(c + r`\ \mathrm{M}`)} solution of ${nm} (${m(r`K_b=${sig(Kb, 2)}`)}) is`, p, [ph(oh), 14 - ph(c), 14 + Math.log10(Kb * c), 14 - ph(Kb)], '', `${m(r`[\ce{OH-}]\approx\sqrt{K_b c}=${sig(oh)}`)}, then ${m(r`\mathrm{pH}=14-\mathrm{pOH}`)}.`, 3, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'buf') { const [a, Ka, nm] = rnd.pick(WEAK.slice(0, 4)); const ca = rnd.pick([0.1, 0.2, 0.5]), cb = rnd.pick([0.05, 0.1, 0.3, 0.4]); const p = ph(Ka) + Math.log10(cb / ca);
    return numQ('acidbase', L, `A buffer contains ${m(ca + r`\ \mathrm{M}`)} ${nm} (${m(r`K_a=${sig(Ka, 2)}`)}) and ${m(cb + r`\ \mathrm{M}`)} of its sodium salt. Its pH is`, p, [ph(Ka) + Math.log10(ca / cb), ph(Ka), ph(Ka * ca), 14 - p], '', `Henderson–Hasselbalch: ${m(r`\mathrm{pH}=\mathrm{p}K_a+\log\frac{[\text{base}]}{[\text{acid}]}`)}.`, 3, { noGeneric: true, minRel: 0.015 }); }
  if (kind === 'mix') { const Va = rnd.pick([20, 25, 50]), ca = rnd.pick([0.1, 0.2]), Vb = rnd.pick([10, 15, 30, 40]), cb = rnd.pick([0.1, 0.2]); const na = Va * ca, nb = Vb * cb; if (Math.abs(na - nb) < 0.2) throw new Error('eq'); const V = Va + Vb;
    const p = na > nb ? ph((na - nb) / V) : 14 + Math.log10((nb - na) / V);
    return numQ('acidbase', L, `${m(Va + r`\ \mathrm{mL}`)} of ${m(ca + r`\ \mathrm{M}`)} ${ce('HCl')} are mixed with ${m(Vb + r`\ \mathrm{mL}`)} of ${m(cb + r`\ \mathrm{M}`)} ${ce('NaOH')}. The pH of the mixture is`, p, [na > nb ? ph((na - nb) / Va) : 14 + Math.log10((nb - na) / Vb), 7, 14 - p, na > nb ? ph(ca) : 14 + Math.log10(cb)], '', `Excess ${na > nb ? m(r`\ce{H3O+}`) : m(r`\ce{OH-}`)}: ${m(sig(Math.abs(na - nb)) + r`\ \mathrm{mmol}`)} in ${m(V + r`\ \mathrm{mL}`)}.`, 3, { noGeneric: true, minRel: 0.02 }); }
  const B = [['The conjugate base of ' + ce('HSO4-') + ' is', ce('SO4^2-'), [ce('H2SO4'), ce('OH-'), ce('H3O+'), ce('HSO3-')]], ['According to Brønsted–Lowry, an acid is a species that', 'donates a proton', ['accepts a proton', 'accepts an electron pair', 'donates an electron pair', 'releases OH⁻ ions in water']], ['A solution of ' + ce('NH4Cl') + ' in water is', 'acidic', ['basic', 'neutral', 'acidic only if heated', 'basic only if concentrated']], ['A solution of ' + ce('CH3COONa') + ' in water is', 'basic', ['acidic', 'neutral', 'acidic only if diluted', 'it depends on the volume']], ['At 25 °C, a solution with ' + m(r`[\ce{H3O+}]=10^{-9}\ \mathrm{M}`) + ' has', m(r`\mathrm{pOH}=5`), [m(r`\mathrm{pOH}=9`), m(r`\mathrm{pH}=5`), m(r`[\ce{OH-}]=10^{-9}\ \mathrm{M}`), m(r`\mathrm{pH}=14`)]]];
  const [q, a, w] = rnd.pick(B); return mk5('acidbase', L, q, a, w, 'Brønsted–Lowry acid/base pairs; hydrolysis of salts; ' + m(r`\mathrm{pH}+\mathrm{pOH}=14`) + ' at 25 °C.');
}
/* electrochemistry (standard reduction potentials from the exam table) */
const COUPLES = [['Li', 1, -3.040], ['K', 1, -2.931], ['Ca', 2, -2.868], ['Na', 1, -2.71], ['Mg', 2, -2.372], ['Al', 3, -1.662], ['Mn', 2, -1.185], ['Zn', 2, -0.763], ['Cr', 3, -0.74], ['Fe', 2, -0.447], ['Cd', 2, -0.403], ['Co', 2, -0.28], ['Ni', 2, -0.257], ['Sn', 2, -0.137], ['Pb', 2, -0.126], ['Cu', 2, 0.337], ['Ag', 1, 0.800], ['Hg', 2, 0.851], ['Au', 3, 1.498]];
function electrochem(L) {
  const kind = pickByLevel(L, [[1, 3, 'E'], [2, 4, 'spont'], [3, 5, 'G'], [4, 6, 'nernst'], [4, 6, 'elys'], [1, 3, 'ox']]);
  const pair = () => { let a, b; do { [a, b] = rnd.shuffle(COUPLES).slice(0, 2); } while (Math.abs(a[2] - b[2]) < 0.2); return a[2] > b[2] ? [a, b] : [b, a]; };
  if (kind === 'E') { const [c, an] = pair(); const E = c[2] - an[2];
    return numQ('electrochem', L, `The standard emf of the galvanic cell ${m(r`\ce{${an[0]}|${an[0]}^{${an[1] === 1 ? '' : an[1]}+}||${c[0]}^{${c[1] === 1 ? '' : c[1]}+}|${c[0]}}`)} is (use the table of ${m('E^\\circ')})`, E, [c[2] + an[2], an[2] - c[2], Math.abs(c[2]) + Math.abs(an[2]) === E ? E + 0.5 : Math.abs(c[2]) + Math.abs(an[2]), c[2] * c[1] - an[2] * an[1], c[2]].filter(x => Math.abs(x - E) > 0.03), 'V', `${m(r`E^\circ_{cell}=E^\circ_{cathode}-E^\circ_{anode}=${c[2]}-(${an[2]})`)}. Potentials are intensive: do not multiply them by the stoichiometric coefficients.`, 3, { noGeneric: true, minRel: 0.02 }); }
  if (kind === 'spont') { const [c, an] = pair(); const yes = rnd.chance(0.5); const met = yes ? an : c, ion = yes ? c : an;
    const all = ['Yes, because the metal has the lower reduction potential', 'No, because the metal has the higher reduction potential', 'Yes, always: metals always reduce metal ions', 'No: a metal can never reduce another metal ion', 'Only if an electric current is supplied'];
    const ans = yes ? 0 : 1;
    return mk5('electrochem', L, `Does ${ce(met[0] + '(s)')} spontaneously reduce ${ce(ion[0] + '^{' + (ion[1] === 1 ? '' : ion[1]) + '+}(aq)')} under standard conditions?`, all[ans], all.filter((_, i) => i !== ans), `${m(r`E^\circ(\ce{${ion[0]}^{${ion[1] === 1 ? '' : ion[1]}+}/${ion[0]}})=${ion[2]}\ \mathrm{V}`)}, ${m(r`E^\circ(\ce{${met[0]}^{${met[1] === 1 ? '' : met[1]}+}/${met[0]}})=${met[2]}\ \mathrm{V}`)}: the reaction is spontaneous if ${m(r`E^\circ_{cell}=E^\circ_{red}(\text{ion})-E^\circ_{red}(\text{metal})>0`)}.`, { fixed: all }); }
  if (kind === 'G') { const [c, an] = pair(); const E = c[2] - an[2]; const n = c[1] * an[1] / gcdN(c[1], an[1]); const G0 = -n * FARADAY * E / 1000;
    return numQ('electrochem', L, `For the cell with cathode ${m(r`\ce{${c[0]}^{${c[1] === 1 ? '' : c[1]}+}/${c[0]}}`)} and anode ${m(r`\ce{${an[0]}^{${an[1] === 1 ? '' : an[1]}+}/${an[0]}}`)} (${m(r`E^\circ_{cell}=${sig(E, 3)}\ \mathrm{V}`)}), ${m(r`\Delta G^\circ`)} for the balanced reaction is`, G0, [-FARADAY * E / 1000, n * FARADAY * E / 1000, -n * FARADAY * E, -2 * n * FARADAY * E / 1000], 'kJ', `${m(r`\Delta G^\circ=-nFE^\circ`)} with ${m('n=' + n)} electrons exchanged and ${m(r`F=96485\ \mathrm{C/mol}`)}.`); }
  if (kind === 'nernst') { const [c, an] = rnd.pick([[COUPLES[15], COUPLES[7]], [COUPLES[15], COUPLES[9]], [COUPLES[16], COUPLES[15]], [COUPLES[15], COUPLES[12]], [COUPLES[17], COUPLES[7]]]); const n = c[1] * an[1] / gcdN(c[1], an[1]);
    const ca = rnd.pick([0.01, 0.1, 1, 0.5]), cc = rnd.pick([0.001, 0.01, 0.1, 2]); const Q = Math.pow(ca, n / an[1]) / Math.pow(cc, n / c[1]); const E0 = c[2] - an[2]; const E = E0 - 0.0592 / n * Math.log10(Q);
    return numQ('electrochem', L, `Compute the emf at ${m(r`25\ ^\circ\mathrm{C}`)} of ${m(r`\ce{${an[0]}|${an[0]}^{${an[1] === 1 ? '' : an[1]}+}}(${ca}\ \mathrm{M})\,\|\,\ce{${c[0]}^{${c[1] === 1 ? '' : c[1]}+}}(${cc}\ \mathrm{M})|\ce{${c[0]}}`)}.`, E, [E0, E0 + 0.0592 / n * Math.log10(Q), E0 - 0.0592 * Math.log10(Q), E0 - 0.0592 / n * Math.log(Q)], 'V', `Nernst: ${m(r`E=E^\circ-\frac{0.0592}{n}\log Q`)} with ${m(r`E^\circ=${sig(E0, 3)}\ \mathrm{V}`)}, ${m('n=' + n)}, ${m(r`Q=${sig(Q)}`)}.`, 3, { noGeneric: true, minRel: 0.008 }); }
  if (kind === 'elys') { const [mt, z] = rnd.pick([['Cu', 2], ['Ag', 1], ['Zn', 2], ['Ni', 2], ['Al', 3], ['Cr', 3]]); const I = rnd.pick([0.5, 1, 2, 2.5, 5]); const tmin = rnd.pick([10, 20, 30, 60, 90]); const mass = I * tmin * 60 / (z * FARADAY) * EL[mt].M;
    return numQ('electrochem', L, `A current of ${m(I + r`\ \mathrm{A}`)} flows for ${m(tmin + r`\ \mathrm{min}`)} through a solution of ${ce(mt + '^{' + (z === 1 ? '' : z) + '+}')}. The mass of ${ce(mt)} deposited at the cathode is`, mass, [mass * z, I * tmin / (z * FARADAY) * EL[mt].M, mass * 60, I * tmin * 60 / FARADAY], 'g', `${m(r`m=\frac{I\,t}{nF}M`)} with ${m('t')} in seconds and ${m('n=' + z)}.`); }
  const set = rnd.shuffle(COUPLES).slice(0, 5); const strongestOx = rnd.chance(0.5);
  const best = set.slice().sort((a, b) => strongestOx ? b[2] - a[2] : a[2] - b[2])[0];
  const lab = c => strongestOx ? ce(c[0] + '^{' + (c[1] === 1 ? '' : c[1]) + '+}') : ce(c[0]);
  return mk5('electrochem', L, `Among the following, which is the strongest ${strongestOx ? 'oxidizing' : 'reducing'} agent?`, opt(lab(best), null, best[0]), set.filter(c => c !== best).map(c => opt(lab(c), null, c[0])), `${strongestOx ? 'The highest' : 'The lowest'} standard reduction potential ${strongestOx ? '(the ion is most easily reduced)' : '(the metal is most easily oxidized)'}: ${set.map(c => `${c[0]} ${c[2]} V`).join(', ')}.`);
}
/* kinetics */
function kinetics(L) {
  const kind = pickByLevel(L, [[1, 2, 'units'], [2, 3, 'half'], [3, 4, 'frac'], [4, 6, 'law'], [5, 6, 'arr']]);
  if (kind === 'units') { const n = rnd.int(0, 3); const U2 = [r`\mathrm{M\,s^{-1}}`, r`\mathrm{s^{-1}}`, r`\mathrm{M^{-1}s^{-1}}`, r`\mathrm{M^{-2}s^{-1}}`, r`\mathrm{M^{2}s^{-1}}`];
    return mk5('kinetics', L, `The units of the rate constant of a reaction of overall order ${m(n)} are`, m(U2[n]), U2.filter((_, i) => i !== n).map(m), `${m(r`v=k[\mathrm{A}]^n`)} has units ${m(r`\mathrm{M\,s^{-1}}`)}, so ${m('k')} has units ${m(r`\mathrm{M^{1-n}s^{-1}}`)}.`); }
  if (kind === 'half') { const k = rnd.pick([1e-3, 2.5e-3, 5e-4, 0.01, 0.0231, 0.0462]); const t = Math.LN2 / k;
    return numQ('kinetics', L, `A first-order reaction has ${m(r`k=${sig(k, 3)}\ \mathrm{s^{-1}}`)}. Its half-life is`, t, [1 / k, 0.5 / k, k * Math.LN2, Math.log10(2) / k], 's', `${m(r`t_{1/2}=\frac{\ln 2}{k}`)}.`); }
  if (kind === 'frac') { const th = rnd.pick([5, 10, 20, 30]); const t = rnd.pick([10, 15, 25, 40, 60]); const f = Math.pow(0.5, t / th) * 100;
    return numQ('kinetics', L, `A first-order reaction has a half-life of ${m(th + r`\ \mathrm{min}`)}. The percentage of reactant left after ${m(t + r`\ \mathrm{min}`)} is`, f, [100 - f, 100 * (1 - t / (2 * th)) > 0 ? 100 * (1 - t / (2 * th)) : 5, 100 * th / t / 2, Math.exp(-t / th) * 100], r`\%`, `${m(r`\frac{[A]}{[A]_0}=\left(\frac12\right)^{t/t_{1/2}}=\left(\frac12\right)^{${sig(t / th, 3)}}`)}.`, 3, { noGeneric: true, minRel: 0.05 }); }
  if (kind === 'law') { const a = rnd.int(0, 2), b = rnd.int(0, 2); const k = rnd.pick([0.5, 1.2, 2.0, 3.5]); const A0 = 0.1, B0 = 0.1; const fa = rnd.pick([2, 3]), fb = rnd.pick([2, 3]);
    const v = (x, y) => k * Math.pow(x, a) * Math.pow(y, b);
    const rows = [[A0, B0], [A0 * fa, B0], [A0, B0 * fb]].map(([x, y]) => `${m(sig(x, 2))} & ${m(sig(y, 2))} & ${m(sig(v(x, y), 3))}`);
    const tbl = `<table style="width:auto;margin:6px 0"><tr><th>[A] (M)</th><th>[B] (M)</th><th>initial rate (M/s)</th></tr>${rows.map(rw => '<tr><td>' + rw.split(' & ').join('</td><td>') + '</td></tr>').join('')}</table>`;
    const law = (x, y) => opt(m(`v=k${x === 0 ? '' : x === 1 ? '[\\mathrm{A}]' : `[\\mathrm{A}]^{${x}}`}${y === 0 ? '' : y === 1 ? '[\\mathrm{B}]' : `[\\mathrm{B}]^{${y}}`}`), null, x + '|' + y);
    const W = []; for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) if (x !== a || y !== b) W.push(law(x, y));
    return mk5('kinetics', L, `For ${m(r`\mathrm{A}+\mathrm{B}\to\text{products}`)} the following initial rates were measured:${tbl}The rate law is`, law(a, b), W, `Multiplying [A] by ${m(fa)} multiplies the rate by ${m(Math.pow(fa, a))} → order ${m(a)} in A; multiplying [B] by ${m(fb)} multiplies the rate by ${m(Math.pow(fb, b))} → order ${m(b)} in B.`); }
  const Ea = rnd.pick([40, 50, 75, 100]); const t1 = rnd.pick([25, 27]), t2 = t1 + rnd.pick([10, 20, 30, 50]); const ratio = Math.exp(-Ea * 1000 / R_SI * (1 / T(t2) - 1 / T(t1)));
  return numQ('kinetics', L, `A reaction has ${m(r`E_a=${Ea}\ \mathrm{kJ/mol}`)}. By what factor does the rate constant increase going from ${m(t1 + r`\ ^\circ\mathrm{C}`)} to ${m(t2 + r`\ ^\circ\mathrm{C}`)}?`, ratio, [Math.exp(-Ea / R_SI * (1 / T(t2) - 1 / T(t1))), T(t2) / T(t1), t2 / t1, Math.exp(-Ea * 1000 / R_SI * (1 / t2 - 1 / t1))], '', `Arrhenius: ${m(r`\ln\frac{k_2}{k_1}=-\frac{E_a}{R}\left(\frac{1}{T_2}-\frac{1}{T_1}\right)`)}.`, 3, { noGeneric: true, minRel: 0.04 });
}

/* ---------------- concept questions (theory) ---------------- */
// [part (1 = midterm 1 topics, 2 = midterm 2 topics), level, question, right, wrongs (>= 4), explanation]
const CONCEPTS = [
  [1, 1, 'The number of protons in an atom determines', 'the element (its atomic number $Z$)', ['the isotope', 'the mass number', 'the charge of the ion', 'the number of neutrons'], 'Atoms of the same element always have the same $Z$.'],
  [1, 1, 'One mole of a substance contains', '$6.022\\times10^{23}$ elementary entities', ['1 g of the substance', '22.4 L of the substance in any physical state', '$6.022\\times10^{-23}$ entities', 'as many entities as there are atoms in 1 g of carbon-12'], 'Avogadro number $N_A$ (the number of atoms in 12 g of carbon-12).'],
  [1, 2, 'The molar mass of a compound is expressed in', 'g/mol', ['g', 'mol/g', 'mol', 'kg·mol'], '$M=m/n$.'],
  [1, 2, 'According to the Bohr model of the hydrogen atom', 'the energy of the electron is quantized: $E_n=-\\frac{2.18\\times10^{-18}}{n^2}\\ \\mathrm{J}$', ['the electron can have any energy', 'the energy grows like $n^2$', 'the orbits have continuously variable radii', 'the energy does not depend on $n$'], 'Only discrete orbits (and energies) are allowed; emission lines correspond to jumps between them.'],
  [1, 2, "Heisenberg's uncertainty principle states that", 'position and momentum of an electron cannot both be known exactly at the same time', ['the energy of the electron is not quantized', 'two electrons cannot have the same four quantum numbers', 'electrons fill the lowest-energy orbitals first', 'light behaves only as a wave'], '$\\Delta x\\,\\Delta p\\ge\\frac{h}{4\\pi}$.'],
  [1, 2, 'The Pauli exclusion principle states that', 'no two electrons in an atom can have the same four quantum numbers', ['electrons occupy degenerate orbitals singly before pairing', 'orbitals are filled in order of increasing energy', 'position and momentum cannot both be known exactly', 'two electrons in the same orbital have the same spin'], 'Consequence: at most 2 electrons per orbital, with opposite spins.'],
  [1, 2, "Hund's rule states that", 'electrons occupy degenerate orbitals singly, with parallel spins, before pairing', ['no two electrons can have the same four quantum numbers', 'electrons pair up before occupying a new orbital', 'the 3d subshell is filled before the 4s', 'orbitals are filled in order of increasing $n$ only'], 'This maximizes the number of unpaired electrons (total spin).'],
  [1, 3, 'In the photoelectric effect, the kinetic energy of the emitted electrons depends on', 'the frequency of the light', ['the intensity of the light only', 'the number of photons', 'how long the metal is illuminated', 'the temperature of the metal'], '$E_k=h\\nu-W$: intensity changes the number of electrons, not their energy.'],
  [1, 2, 'A 2p orbital', 'has a nodal plane through the nucleus (dumbbell shape)', ['is spherical', 'has no nodes', 'has four lobes', 'has the same energy as the 2s orbital in every atom'], 'p orbitals have $\\ell=1$: one angular node. In multi-electron atoms 2p is higher in energy than 2s.'],
  [1, 3, 'Elements in the same group of the periodic table have', 'the same valence electron configuration', ['the same number of electron shells', 'the same atomic mass', 'the same number of neutrons', 'the same electronegativity'], 'E.g. group 1: $ns^1$; this explains their similar chemistry.'],
  [1, 3, 'Moving down a group, the first ionization energy', 'decreases', ['increases', 'remains constant', 'first increases, then decreases', 'becomes zero for the noble gases'], 'The outer electrons are farther from the nucleus and more shielded.'],
  [1, 3, 'Electron affinity is', 'the energy change when a gaseous atom gains an electron', ['the energy needed to remove an electron from a gaseous atom', 'the ability of an atom in a bond to attract the shared electrons', 'the energy released when an ionic solid forms from gaseous ions', 'the attraction between the nuclei of two bonded atoms'], 'Not to be confused with ionization energy and electronegativity.'],
  [1, 3, 'Electronegativity is', 'the tendency of an atom in a molecule to attract the shared electrons', ['the energy change when a gaseous atom gains an electron', 'the energy needed to remove an electron', 'the charge of the nucleus', 'the number of valence electrons'], 'Pauling scale: maximum for F (3.98).'],
  [1, 1, 'The most electronegative element is', 'fluorine', ['oxygen', 'chlorine', 'caesium', 'helium'], 'Electronegativity increases along a period and decreases down a group.'],
  [1, 3, 'Noble gases are very unreactive because', 'they have a complete valence shell ($ns^2np^6$)', ['they are gases', 'they have a low ionization energy', 'they have no s electrons', 'they are radioactive'], 'Their ionization energies are very high and electron affinities are not favourable.'],
  [1, 2, 'An ionic bond typically forms between', 'a metal and a non-metal with a large electronegativity difference', ['two identical non-metal atoms', 'two metal atoms', 'atoms with equal electronegativity', 'two noble gas atoms'], 'Electrons are transferred, giving cations and anions held by electrostatic attraction.'],
  [1, 2, 'In a covalent bond', 'a pair of electrons is shared between two atoms', ['electrons are completely transferred from one atom to the other', 'cations are surrounded by a sea of electrons', 'protons are shared between the nuclei', 'ions of opposite charge attract each other'], 'Polar if the two atoms have different electronegativity.'],
  [1, 3, 'Metallic bonding is described as', 'cations in a sea of delocalized electrons', ['localized electron pairs shared between two atoms', 'complete transfer of electrons forming ions in a lattice', 'hydrogen bonds between atoms', 'dipole–dipole interactions'], 'Delocalized electrons explain electrical and thermal conductivity and malleability.'],
  [1, 4, 'The formal charge of an atom in a Lewis structure equals', 'valence electrons − non-bonding electrons − ½ bonding electrons', ['valence electrons − bonding electrons', 'the number of bonds of the atom', 'its oxidation number', 'valence electrons + lone-pair electrons'], 'The best Lewis structure minimizes formal charges.'],
  [1, 4, 'Resonance structures', 'differ only in the position of electrons, not of atoms', ['are different molecules in equilibrium', 'differ in the position of the atoms', 'alternate in time', 'have different numbers of electrons'], 'The real molecule is the resonance hybrid (e.g. the equal bonds in $\\ce{O3}$, $\\ce{NO3-}$, benzene).'],
  [1, 3, 'According to VSEPR theory, the shape of a molecule is determined by', 'the repulsion between the electron domains around the central atom', ['the masses of the atoms', 'only the electronegativity of the central atom', 'the number of protons', 'hydrogen bonds between molecules'], 'Electron domains (bonds and lone pairs) get as far apart as possible.'],
  [1, 4, 'Compared with bonding pairs, lone pairs on the central atom', 'occupy more space and reduce the bond angles', ['occupy less space', 'do not affect the geometry', 'increase the bond angles', 'are always located on the terminal atoms'], 'E.g. $\\ce{CH4}$ 109.5°, $\\ce{NH3}$ 107°, $\\ce{H2O}$ 104.5°.'],
  [1, 3, 'A molecule containing polar bonds', 'may be non-polar if the bond dipoles cancel (e.g. $\\ce{CO2}$)', ['is always polar', 'is always non-polar', 'always forms hydrogen bonds', 'is an ionic compound'], 'Polarity depends on both bond polarity and molecular geometry.'],
  [1, 4, 'In molecular orbital theory, a bonding molecular orbital', 'has lower energy than the atomic orbitals that form it', ['has higher energy than the atomic orbitals', 'has a node between the two nuclei', 'cannot contain electrons', 'is localized on a single atom'], 'Constructive overlap concentrates electron density between the nuclei.'],
  [1, 4, 'In MO theory, the bond order is', '(bonding electrons − antibonding electrons)/2', ['(bonding electrons + antibonding electrons)/2', 'the number of bonding electrons', 'antibonding electrons − bonding electrons', 'the number of unpaired electrons'], 'Bond order 0 means the molecule is not stable (e.g. $\\ce{He2}$).'],
  [1, 3, 'A species is paramagnetic if', 'it has unpaired electrons', ['all its electrons are paired', 'it is ionic', 'its bond order is zero', 'it contains a metal atom'], '$\\ce{O2}$ is paramagnetic: two unpaired electrons in the $\\pi^*$ orbitals.'],
  [1, 5, 'In a metal, according to band theory,', 'the valence band is partially filled or overlaps the conduction band', ['there is a large band gap', 'the valence band is full and separated by a large gap', 'electrons are localized on the atoms', 'there are no energy bands'], 'Electrons can move into nearby empty levels: high conductivity.'],
  [1, 5, 'A semiconductor has', 'a small band gap between the filled valence band and the empty conduction band', ['no band gap', 'a very large band gap', 'a partially filled valence band', 'only localized electrons'], 'Thermal energy can promote some electrons across the gap (e.g. Si, Ge).'],
  [1, 5, 'When the temperature increases, the electrical conductivity of a semiconductor', 'increases', ['decreases', 'does not change', 'drops to zero', 'first increases then becomes zero'], 'More electrons are promoted to the conduction band (opposite to metals).'],
  [1, 5, 'Doping silicon with phosphorus produces', 'an n-type semiconductor', ['a p-type semiconductor', 'an insulator', 'a metal', 'a superconductor'], 'P has 5 valence electrons: one extra electron per dopant atom.'],
  [1, 4, 'The four $sp^3$ hybrid orbitals point', 'towards the vertices of a tetrahedron (109.5°)', ['in a plane, at 120°', 'along a line, at 180°', 'at 90° from each other', 'in random directions'], 'One s + three p orbitals give four equivalent hybrids.'],
  [1, 5, 'A $\\pi$ bond', 'is formed by the side-by-side overlap of p orbitals', ['is formed by head-on overlap of orbitals', 'is stronger than a $\\sigma$ bond', 'can exist without a $\\sigma$ bond between the same atoms', 'allows free rotation around the bond axis'], 'Double bond = $\\sigma+\\pi$, triple bond = $\\sigma+2\\pi$.'],
  [1, 2, 'Isotopes of the same element have', 'practically the same chemical properties but different masses', ['different chemical properties', 'a different number of protons', 'the same mass', 'different electron configurations'], 'Chemistry depends on the electrons, which are the same.'],
  [1, 3, 'The oxidation number of an atom is', 'the charge it would have if all its bonds were ionic', ['the actual charge of the atom', 'the number of bonds it forms', 'its group number', 'its number of valence electrons'], 'Rules: O usually −2, H usually +1, sum = charge of the species.'],
  [2, 1, 'At constant temperature, if the pressure of an ideal gas doubles, its volume', 'halves', ['doubles', 'does not change', 'becomes four times larger', 'becomes one quarter'], "Boyle's law: $PV=$ constant."],
  [2, 2, 'At constant pressure, the volume of an ideal gas is proportional to', 'the absolute temperature (in K)', ['the temperature in °C', '$1/T$', '$T^2$', 'the pressure'], "Charles's law: $V/T=$ constant with $T$ in kelvin."],
  [2, 2, 'Equal volumes of different ideal gases at the same temperature and pressure contain', 'the same number of molecules', ['the same mass', 'the same density', 'a number of molecules proportional to their molar mass', 'the same number of atoms'], "Avogadro's principle."],
  [2, 3, 'The average kinetic energy of the molecules of an ideal gas depends only on', 'the temperature', ['the pressure', 'the molar mass', 'the volume', 'the number of molecules'], '$\\bar E_k=\\frac32 k_BT$.'],
  [2, 3, 'At the same temperature, lighter gas molecules', 'move faster on average', ['move slower on average', 'move at the same speed', 'have a higher average kinetic energy', 'have a lower average kinetic energy'], '$u_{rms}=\\sqrt{3RT/M}$; the kinetic energy is the same.'],
  [2, 4, 'Real gases deviate most from ideal behaviour', 'at high pressure and low temperature', ['at low pressure and high temperature', 'at low pressure and low temperature', 'only at very high temperature', 'never'], 'Molecular volume and attractions become important when molecules are close and slow.'],
  [2, 4, 'In the van der Waals equation, the constant $b$ accounts for', 'the finite volume of the molecules', ['the attractions between molecules', 'the temperature', 'the molar mass', 'the polarity of the molecules'], '$\\left(P+\\frac{an^2}{V^2}\\right)(V-nb)=nRT$: $a$ = attractions, $b$ = excluded volume.'],
  [2, 3, "Dalton's law of partial pressures states that", 'the total pressure of a mixture is the sum of the partial pressures', ['all partial pressures are equal', 'the pressure is proportional to the volume', 'the effusion rate is proportional to $1/\\sqrt M$', 'the solubility of a gas is proportional to its pressure'], '$P_i=x_iP_{tot}$.'],
  [2, 2, 'The vapour pressure of a liquid increases when', 'the temperature increases', ['the amount of liquid increases', 'the surface area decreases', 'the temperature decreases', 'the external pressure increases'], 'It depends only on the substance and on $T$ (Clausius–Clapeyron).'],
  [2, 3, 'A liquid boils when', 'its vapour pressure equals the external pressure', ['its vapour pressure is zero', 'it reaches 100 °C', 'it reaches its critical temperature', 'all molecules have the same speed'], 'At 1 atm this is the normal boiling point.'],
  [2, 3, 'At high altitude, water boils', 'below 100 °C', ['above 100 °C', 'exactly at 100 °C', 'never', 'at 0 °C'], 'The external pressure is lower, so a lower vapour pressure (temperature) suffices.'],
  [2, 2, 'Sublimation is the transition', 'solid → gas', ['gas → solid', 'liquid → gas', 'solid → liquid', 'gas → liquid'], 'Example: dry ice ($\\ce{CO2}$) at 1 atm.'],
  [2, 3, 'While a pure solid melts at constant pressure, its temperature', 'remains constant', ['increases', 'decreases', 'oscillates', 'first decreases then increases'], 'The heat supplied is used to break the solid structure (enthalpy of fusion).'],
  [2, 3, 'Colligative properties depend on', 'the number of solute particles, not on their nature', ['the chemical nature of the solute', 'only the molar mass of the solvent', 'the colour of the solute', 'the volume of the container'], 'Vapour-pressure lowering, boiling-point elevation, freezing-point depression, osmotic pressure.'],
  [2, 4, 'Compared with a 0.1 m glucose solution, a 0.1 m NaCl solution has', 'a lower freezing point', ['a higher freezing point', 'the same freezing point', 'a lower boiling point', 'a lower osmotic pressure'], 'NaCl gives about twice as many particles ($i\\approx2$).'],
  [2, 4, "Henry's law states that the solubility of a gas in a liquid is", 'proportional to the partial pressure of the gas above the liquid', ['inversely proportional to its partial pressure', 'independent of the pressure', 'proportional to the temperature', 'proportional to its molar mass'], '$c=k_HP$ (e.g. carbonated drinks).'],
  [2, 4, 'Osmosis is', 'the flow of solvent through a semipermeable membrane towards the more concentrated solution', ['the flow of solute through a membrane', 'the flow of solvent towards the more dilute solution', 'the diffusion of gases', 'the evaporation of a solvent'], 'It stops when the osmotic pressure $\\pi=icRT$ is reached.'],
  [2, 2, 'In an exothermic reaction', '$\\Delta H<0$ and heat is released to the surroundings', ['$\\Delta H>0$ and heat is released', '$\\Delta H<0$ and heat is absorbed', '$\\Delta H=0$', 'the surroundings cool down'], 'The products have lower enthalpy than the reactants.'],
  [2, 3, 'The standard enthalpy of formation of an element in its standard state is', 'zero', ['1 kJ/mol', 'always positive', 'always negative', 'equal to its bond energy'], 'By definition (e.g. $\\ce{O2(g)}$, $\\ce{Fe(s)}$, C(graphite)).'],
  [2, 3, 'Which of the following is a state function?', 'enthalpy', ['heat', 'work', 'the path followed', 'the reaction time'], 'State functions depend only on the initial and final states (Hess\'s law).'],
  [2, 4, 'The entropy of a system generally increases when', 'a solid dissolves or a liquid evaporates', ['a gas condenses', 'a liquid freezes', 'the number of moles of gas decreases', 'the temperature decreases'], 'More disorder / more accessible microstates.'],
  [2, 4, 'At constant temperature and pressure, a reaction is spontaneous if', '$\\Delta G<0$', ['$\\Delta G>0$', '$\\Delta H>0$', '$\\Delta S<0$', '$K<1$'], '$\\Delta G=\\Delta H-T\\Delta S$.'],
  [2, 5, 'The standard free-energy change and the equilibrium constant are related by', '$\\Delta G^\\circ=-RT\\ln K$', ['$\\Delta G^\\circ=RT\\ln K$', '$\\Delta G^\\circ=-nFK$', '$K=\\Delta G^\\circ/RT$', '$\\Delta G^\\circ=\\Delta H^\\circ-K$'], '$K>1$ corresponds to $\\Delta G^\\circ<0$.'],
  [2, 4, 'A catalyst', 'lowers the activation energy and speeds up both the forward and reverse reactions', ['shifts the equilibrium towards the products', 'changes $\\Delta H$ of the reaction', 'increases the equilibrium constant', 'is consumed by the reaction'], 'It provides an alternative mechanism; equilibrium composition is unchanged.'],
  [2, 4, 'Increasing the temperature usually increases the reaction rate because', 'a larger fraction of molecules has energy above the activation energy', ['the activation energy decreases', '$\\Delta H$ changes sign', 'the equilibrium shifts', 'the concentrations increase'], 'Arrhenius: $k=Ae^{-E_a/RT}$.'],
  [2, 5, 'For a first-order reaction, the half-life', 'does not depend on the initial concentration', ['is proportional to the initial concentration', 'is inversely proportional to the initial concentration', 'increases with time', 'depends on $\\Delta H$'], '$t_{1/2}=\\ln2/k$.'],
  [2, 4, 'The equilibrium constant of a reaction changes when', 'the temperature changes', ['the concentration of a reactant changes', 'the total pressure changes', 'a catalyst is added', 'the volume of the vessel changes'], 'Concentration/pressure changes shift the equilibrium but leave $K$ unchanged.'],
  [2, 3, 'According to Brønsted–Lowry, a base is a species that', 'accepts a proton', ['donates a proton', 'donates OH⁻ only in the gas phase', 'releases H⁺ in water', 'is always a hydroxide ion'], 'Conjugate pairs differ by one $\\ce{H+}$.'],
  [2, 2, 'At 25 °C, a neutral aqueous solution has', 'pH = 7', ['pH = 0', 'pH = 14', '$[\\ce{H3O+}]=0$', 'pOH = 0'], '$[\\ce{H3O+}]=[\\ce{OH-}]=10^{-7}$ M.'],
  [2, 4, 'At 25 °C, the ionic product of water is', '$K_w=[\\ce{H3O+}][\\ce{OH-}]=1.0\\times10^{-14}$', ['$K_w=1.0\\times10^{-7}$', '$K_w=14$', '$K_w=1$', '$K_w=[\\ce{H3O+}]+[\\ce{OH-}]=10^{-14}$'], 'Hence pH + pOH = 14.'],
  [2, 4, 'A buffer solution', 'contains a weak acid and its conjugate base and resists pH changes', ['contains a strong acid and a strong base', 'always has pH = 7', 'never changes its pH, whatever is added', 'contains only a weak acid'], 'Henderson–Hasselbalch: $\\mathrm{pH}=\\mathrm{p}K_a+\\log\\frac{[\\ce{A-}]}{[\\ce{HA}]}$.'],
  [2, 3, 'In a galvanic cell, oxidation takes place at', 'the anode', ['the cathode', 'the salt bridge', 'both electrodes', 'the external wire'], 'Anode: oxidation (negative pole); cathode: reduction (positive pole).'],
  [2, 4, 'The salt bridge of a galvanic cell', 'keeps the two solutions electrically neutral by letting ions migrate', ['carries the electrons between the electrodes', 'is where oxidation occurs', 'increases the emf', 'prevents any current from flowing'], 'Electrons flow in the external wire; ions flow in the salt bridge.'],
  [2, 5, 'In electrolysis', 'electrical energy drives a non-spontaneous reaction', ['a spontaneous reaction produces electrical energy', '$\\Delta G<0$ for the cell reaction', 'no electrons are exchanged', 'reduction occurs at the anode'], 'Faraday: $m=\\frac{ItM}{nF}$.'],
  [2, 5, 'A metal with a more negative standard reduction potential', 'is a stronger reducing agent', ['is a stronger oxidizing agent', 'is more easily reduced', 'is a noble metal', 'never reacts with acids'], 'It is more easily oxidized (e.g. Zn reduces $\\ce{Cu^2+}$).'],
  [2, 5, 'The rate law of a reaction', 'must be determined experimentally', ['always follows the stoichiometric coefficients', 'depends on $\\Delta H$', 'coincides with the equilibrium-constant expression', 'depends only on the temperature'], 'Orders coincide with the coefficients only for elementary steps.'],
];
const texifyC = s => s.replace(/\$([^$]+)\$/g, (_, a) => m(a));
function conceptQ(part) {
  return function (L, used) {
    let pool = CONCEPTS.map((c, i) => [c, i]).filter(([c, i]) => c[0] === part && Math.abs(c[1] - L) <= 1 && !(used && used.has('ch' + i)));
    if (!pool.length) pool = CONCEPTS.map((c, i) => [c, i]).filter(([c, i]) => c[0] === part && !(used && used.has('ch' + i)));
    if (!pool.length) pool = CONCEPTS.map((c, i) => [c, i]).filter(([c]) => c[0] === part);
    const [[, , q, a, w, e], i] = rnd.pick(pool);
    const res = mk5('concepts' + part, L, texifyC(q), texifyC(a), w.map(texifyC), texifyC(e)); res.thId = 'ch' + i; return res;
  };
}

/* =====================================================================
   REGISTRY
   ===================================================================== */
const TOPICS = [
  { id: 'atom', name: 'Atomic structure & isotopes', gen: atom }, { id: 'quantum', name: 'Light, photons, hydrogen atom', gen: quantum },
  { id: 'qnumbers', name: 'Quantum numbers & orbitals', gen: qnumbers }, { id: 'config', name: 'Electron configurations', gen: cfgTopic },
  { id: 'periodic', name: 'Periodic trends', gen: periodic }, { id: 'nomenclature', name: 'Nomenclature & oxidation numbers', gen: nomenclature },
  { id: 'balancing', name: 'Balancing reactions', gen: balancing }, { id: 'mole', name: 'Mole & stoichiometry', gen: mole },
  { id: 'bonding', name: 'Chemical bonds', gen: bonding }, { id: 'vsepr', name: 'Lewis, VSEPR & hybridization', gen: vsepr },
  { id: 'mo', name: 'Molecular orbitals', gen: moTopic }, { id: 'imf', name: 'Intermolecular forces & solids', gen: imf },
  { id: 'gases', name: 'Gases', gen: gases }, { id: 'liquids', name: 'Liquids & phase changes', gen: liquids },
  { id: 'solutions', name: 'Solutions & colligative properties', gen: solutions }, { id: 'thermo', name: 'Thermochemistry & ΔG', gen: thermo },
  { id: 'equilibrium', name: 'Chemical equilibrium', gen: equilibrium }, { id: 'acidbase', name: 'Acids, bases & pH', gen: acidbase },
  { id: 'electrochem', name: 'Electrochemistry', gen: electrochem }, { id: 'kinetics', name: 'Kinetics', gen: kinetics },
  { id: 'concepts1', name: 'Theory: atoms to bonds (Midterm 1)', gen: conceptQ(1) }, { id: 'concepts2', name: 'Theory: gases to kinetics (Midterm 2)', gen: conceptQ(2) },
];
const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));
function generate(topicId, level, used) {
  const t = TOPICS.find(x => x.id === topicId); let last;
  for (let i = 0; i < 80; i++) { try { const q = t.gen(level, used); q.topicName = t.name; return q; } catch (e) { last = e; } }
  throw last;
}
// Topics announced by Prof. Kriegel for midterm 1: atom, chemical bond, inorganic nomenclature, stoichiometry, gases.
const MID1 = ['atom', 'quantum', 'qnumbers', 'config', 'periodic', 'nomenclature', 'nomenclature', 'balancing', 'mole', 'mole', 'bonding', 'vsepr', 'gases', 'gases', 'concepts1'];
const MID2 = ['gases', 'gases', 'liquids', 'solutions', 'solutions', 'solutions', 'thermo', 'thermo', 'equilibrium', 'acidbase', 'acidbase', 'electrochem', 'kinetics', 'concepts2', 'concepts2'];
const FULL = () => ['atom', 'qnumbers', 'config', 'periodic', 'nomenclature', 'balancing', 'mole', 'vsepr', 'mo', 'gases', 'solutions', 'thermo', 'acidbase', 'concepts1', 'concepts2'];
const MODES = [
  { id: 'full', name: 'Full exam test', desc: '15 questions on the whole course', get layout() { return FULL(); } },
  { id: 'mid1', name: 'Midterm 1 (27–28 Nov)', desc: 'Announced topics: atom, chemical bond, inorganic nomenclature, stoichiometry, gases', layout: MID1 },
  { id: 'mid2', name: 'Midterm 2 (9 Jan)', desc: 'Gases, liquids, solutions, thermodynamics, equilibrium, acids/bases, electrochemistry, kinetics', layout: MID2 },
];

/* ---------------- tables for the formula sheet ---------------- */
const EO_TABLE = [['Li^+ + e^- -> Li(s)', -3.040], ['K^+ + e^- -> K(s)', -2.931], ['Ba^2+ + 2e^- -> Ba(s)', -2.912], ['Ca^2+ + 2e^- -> Ca(s)', -2.868], ['Na^+ + e^- -> Na(s)', -2.71], ['Mg^2+ + 2e^- -> Mg(s)', -2.372], ['Al^3+ + 3e^- -> Al(s)', -1.662], ['Mn^2+ + 2e^- -> Mn(s)', -1.185], ['Zn^2+ + 2e^- -> Zn(s)', -0.763], ['Cr^3+ + 3e^- -> Cr(s)', -0.74], ['Fe^2+ + 2e^- -> Fe(s)', -0.447], ['Cd^2+ + 2e^- -> Cd(s)', -0.403], ['Co^2+ + 2e^- -> Co(s)', -0.28], ['Ni^2+ + 2e^- -> Ni(s)', -0.257], ['Sn^2+ + 2e^- -> Sn(s)', -0.137], ['Pb^2+ + 2e^- -> Pb(s)', -0.126], ['2H^+ + 2e^- -> H2(g)', 0.000], ['Sn^4+ + 2e^- -> Sn^2+', 0.15], ['Cu^2+ + 2e^- -> Cu(s)', 0.337], ['O2(g) + 2H2O + 4e^- -> 4OH^-', 0.41], ['Fe^3+ + e^- -> Fe^2+', 0.771], ['Ag^+ + e^- -> Ag(s)', 0.800], ['Hg^2+ + 2e^- -> Hg(l)', 0.851], ['NO3^- + 4H^+ + 3e^- -> NO(g) + 2H2O', 0.96], ['Br2(l) + 2e^- -> 2Br^-', 1.09], ['Cr2O7^2- + 14H^+ + 6e^- -> 2Cr^3+ + 7H2O', 1.33], ['Cl2(g) + 2e^- -> 2Cl^-', 1.36], ['Au^3+ + 3e^- -> Au(s)', 1.498], ['MnO4^- + 8H^+ + 5e^- -> Mn^2+ + 4H2O', 1.51], ['H2O2 + 2H^+ + 2e^- -> 2H2O', 1.77], ['F2(g) + 2e^- -> 2F^-', 2.87]];
function tablesHtml() {
  const cells = ELS.filter(e => e.per <= 7).map(e => `<div class="el" style="grid-row:${e.per};grid-column:${e.grp}"><span>${e.Z}</span><b>${e.sym}</b><span>${e.M}</span></div>`).join('');
  return `<h2>Chemistry tables</h2><p class="small muted">The same kind of tables you receive at the exam (periodic table, standard reduction potentials, standard enthalpies of formation). Lanthanides and actinides omitted. Constants and formulas are in the <b>Formulas</b> tab.</p>
  <h3>Periodic table (Z, symbol, atomic mass)</h3><div class="tablewrap"><div class="ptable">${cells}</div></div>
  <h3>Standard reduction potentials \\(E^\\circ\\) (V, 25 °C)</h3><div class="tablewrap"><table><tr><th>Half reaction</th><th>\\(E^\\circ\\)</th></tr>${EO_TABLE.map(([h, e]) => `<tr><td>\\(\\ce{${h}}\\)</td><td>${e.toFixed(3)}</td></tr>`).join('')}</table></div>
  <h3>Standard enthalpies of formation \\(\\Delta H^\\circ_f\\) (kJ/mol)</h3><div class="tablewrap"><table><tr><th>Species</th><th>\\(\\Delta H^\\circ_f\\)</th><th>Species</th><th>\\(\\Delta H^\\circ_f\\)</th></tr>${(() => { const e = Object.entries(HF); const h = Math.ceil(e.length / 2); let s = ''; for (let i = 0; i < h; i++) { const a = e[i], b = e[i + h]; s += `<tr><td>\\(\\ce{${a[0]}}\\)</td><td>${a[1]}</td><td>${b ? `\\(\\ce{${b[0]}}\\)` : ''}</td><td>${b ? b[1] : ''}</td></tr>`; } return s; })()}</table></div>`;

}
G.TABLES = G.TABLES || {}; G.TABLES.chem = tablesHtml;
G.Chem = { TOPICS, TOPIC_NAME, generate, MODES, data: { EL, BYZ, MM, parseFormula, balance, eqTex, config, unpaired, cfgTex, sig, HF, COUPLES, WEAK, SOLUTES, COMPOUNDS, CATIONS, ANIONS, salt, saltName, dHr, RXN_H, T, R_ATM, R_SI, NA, FARADAY, MOLS, moInfo, DIAT, ionTex } };
})(typeof window !== 'undefined' ? window : globalThis);
