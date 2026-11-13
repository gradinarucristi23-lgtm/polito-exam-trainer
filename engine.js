/* Analisi I Test — multiple-choice question engine (PoliTo-style).
   Every answer is computed exactly (rational arithmetic / power series), never typed by hand. */
(function (G) {
'use strict';
const r = String.raw;

/* ---------------- random ---------------- */
const rnd = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  nz(a, b) { let v; do { v = rnd.int(a, b); } while (v === 0); return v; },
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  chance: p => Math.random() < p,
};

/* ---------------- exact fractions (BigInt) ---------------- */
function bgcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; }
class Fr {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d); if (d === 0n) throw new Error('division by zero');
    if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g;
  }
  static of(x) {
    if (x instanceof Fr) return x;
    if (Array.isArray(x)) return new Fr(x[0], x[1]);
    if (typeof x === 'number' && !Number.isInteger(x)) throw new Error('non-integer ' + x);
    return new Fr(x, 1);
  }
  add(o) { o = Fr.of(o); return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Fr.of(o); return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Fr.of(o); return new Fr(this.n * o.n, this.d * o.d); }
  div(o) { o = Fr.of(o); return new Fr(this.n * o.d, this.d * o.n); }
  neg() { return new Fr(-this.n, this.d); }
  inv() { return new Fr(this.d, this.n); }
  abs() { return this.n < 0n ? this.neg() : this; }
  isZero() { return this.n === 0n; }
  isInt() { return this.d === 1n; }
  eq(o) { o = Fr.of(o); return this.n === o.n && this.d === o.d; }
  sgn() { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
  val() { return Number(this.n) / Number(this.d); }
  tex() { if (this.d === 1n) return this.n.toString(); const neg = this.n < 0n; return (neg ? '-' : '') + r`\frac{${neg ? -this.n : this.n}}{${this.d}}`; }
}
const F = (n, d = 1) => new Fr(n, d);

/* ---------------- TeX helpers ---------------- */
const m = s => '\\(' + s + '\\)';
const dm = s => '\\[' + s + '\\]';
function mono(c, k, v = 'x') {
  c = Fr.of(c); if (k === 0) return c.tex();
  const xv = k === 1 ? v : `${v}^{${k}}`;
  if (c.eq(1)) return xv; if (c.eq(-1)) return '-' + xv;
  return c.tex() + xv;
}
function polyTex(coeffs, desc = true, v = 'x') {
  const idx = []; coeffs.forEach((c, k) => { if (!Fr.of(c).isZero()) idx.push(k); });
  if (desc) idx.reverse(); if (!idx.length) return '0';
  let s = '';
  idx.forEach((k, i) => {
    const c = Fr.of(coeffs[k]);
    if (i === 0) s += mono(c, k, v); else s += c.sgn() < 0 ? ' - ' + mono(c.neg(), k, v) : ' + ' + mono(c, k, v);
  });
  return s;
}
// join [[Fr coef, bodyTex]] ; body '' = constant
function joinTerms(items) {
  let s = '';
  items.forEach(([c, body], i) => {
    c = Fr.of(c); if (c.isZero()) return;
    const neg = c.sgn() < 0, ac = neg ? c.neg() : c;
    const t = body === '' ? ac.tex() : (ac.eq(1) ? body : ac.tex() + body);
    if (s === '') s += (neg ? '-' : '') + t; else s += (neg ? ' - ' : ' + ') + t;
  });
  return s || '0';
}
const sgnTerm = (n) => (n < 0 ? ' - ' + (-n) : ' + ' + n);      // " + 3" / " - 3"
const plusConst = (n) => (n === 0 ? '' : sgnTerm(n));
function onePlus(t) { return t.startsWith('-') ? '1' + t : '1+' + t; }
function piTex(p, q) { // p*pi/q
  const f = F(p, q); if (f.isZero()) return '0';
  const neg = f.sgn() < 0, a = f.abs(); const num = a.n === 1n ? r`\pi` : a.n + r`\pi`;
  return (neg ? '-' : '') + (a.d === 1n ? num : r`\frac{${num}}{${a.d}}`);
}
function iv(lo, hi, lc, rc) { return (lc ? '[' : '(') + lo + ',\\,' + hi + (rc ? ']' : ')'); }
const INF = r`+\infty`, MINF = r`-\infty`;

/* ---------------- power series (x^0..x^8) ---------------- */
const SN = 9;
const S0 = () => Array.from({ length: SN }, () => F(0));
const sAdd = (a, b) => a.map((v, i) => v.add(b[i]));
const sScale = (a, k) => a.map(v => v.mul(k));
function sMul(a, b) { const out = S0(); for (let i = 0; i < SN; i++) { if (a[i].isZero()) continue; for (let j = 0; i + j < SN; j++) { if (!b[j].isZero()) out[i + j] = out[i + j].add(a[i].mul(b[j])); } } return out; }
function sComp(fc, g) { let res = S0(), p = S0(); p[0] = F(1); for (let k = 0; k < SN; k++) { if (!fc[k].isZero()) res = sAdd(res, sScale(p, fc[k])); p = sMul(p, g); } return res; }
function sOrder(a) { for (let i = 0; i < SN; i++) if (!a[i].isZero()) return i; return -1; }
function fact(n) { let x = 1n; for (let i = 2n; i <= BigInt(n); i++) x *= i; return x; }
function binom(al, k) { let x = F(1); for (let i = 0; i < k; i++) x = x.mul(al.sub(i)); return x.div(new Fr(fact(k))); }
const FC = {
  exp: k => new Fr(1n, fact(k)),
  sin: k => (k % 2 ? new Fr(((k - 1) / 2) % 2 ? -1n : 1n, fact(k)) : F(0)),
  cos: k => (k % 2 ? F(0) : new Fr((k / 2) % 2 ? -1n : 1n, fact(k))),
  log1p: k => (k === 0 ? F(0) : F(k % 2 ? 1 : -1, k)),
  atan: k => (k % 2 ? F(((k - 1) / 2) % 2 ? -1 : 1, k) : F(0)),
  tan: k => Fr.of([0, 1, 0, [1, 3], 0, [2, 15], 0, [17, 315], 0][k]),
  asin: k => Fr.of([0, 1, 0, [1, 6], 0, [3, 40], 0, [5, 112], 0][k]),
  sqrt1p: k => binom(F(1, 2), k),
  cbrt1p: k => binom(F(1, 3), k),
};
const fcArr = name => Array.from({ length: SN }, (_, k) => Fr.of(FC[name](k)));
const PAR = u => (u.simple ? ' ' + u.tex : '(' + u.tex + ')');
const ATOMS = {
  exp: { v0: 1, tex: u => `e^{${u.tex}}`, f: Math.exp },
  sin: { v0: 0, tex: u => r`\sin` + PAR(u), f: Math.sin },
  cos: { v0: 1, tex: u => r`\cos` + PAR(u), f: Math.cos },
  tan: { v0: 0, tex: u => r`\tan` + PAR(u), f: Math.tan },
  atan: { v0: 0, tex: u => r`\arctan` + PAR(u), f: Math.atan },
  asin: { v0: 0, tex: u => r`\arcsin` + PAR(u), f: Math.asin },
  log1p: { v0: 0, tex: u => r`\log(` + onePlus(u.tex) + ')', f: Math.log1p },
  sqrt1p: { v0: 1, tex: u => r`\sqrt{` + onePlus(u.tex) + '}', f: t => Math.sqrt(1 + t) },
  cbrt1p: { v0: 1, tex: u => r`\sqrt[3]{` + onePlus(u.tex) + '}', f: t => Math.cbrt(1 + t) },
};
function X(a, k = 1) { a = Fr.of(a); const ser = S0(); ser[k] = a; const av = a.val(); return { tex: mono(a, k), ser, f: x => av * Math.pow(x, k), simple: a.eq(1) && k === 1, sum: false }; }
function A(name, u) { const at = ATOMS[name]; return { tex: at.tex(u), ser: sComp(fcArr(name), u.ser), f: x => at.f(u.f(x)), v0: at.v0, sum: false }; }
function logcos(u) { const c = A('cos', u); const g = c.ser.slice(); g[0] = F(0); return { tex: r`\log(\cos` + PAR(u) + ')', ser: sComp(fcArr('log1p'), g), f: x => Math.log(Math.cos(u.f(x))), v0: 0, sum: false }; }
function comb(parts, poly = []) {
  let ser = S0(); const fs = [], items = [];
  for (const p of parts) { const c = Fr.of(p.c); ser = sAdd(ser, sScale(p.e.ser, c)); const cv = c.val(), f = p.e.f; fs.push(x => cv * f(x)); items.push([c, p.e.sum ? '(' + p.e.tex + ')' : p.e.tex]); }
  poly.forEach((c, k) => { c = Fr.of(c); if (c.isZero()) return; ser[k] = ser[k].add(c); const cv = c.val(); fs.push(x => cv * Math.pow(x, k)); items.push([c, k === 0 ? '' : (k === 1 ? 'x' : `x^{${k}}`)]); });
  if (items.length > 1 && Fr.of(items[0][0]).sgn() < 0) { const j = items.findIndex(it => Fr.of(it[0]).sgn() > 0); if (j > 0) items.unshift(items.splice(j, 1)[0]); }
  return { tex: joinTerms(items), ser, f: x => fs.reduce((s, g) => s + g(x), 0), sum: items.filter(i => !Fr.of(i[0]).isZero()).length > 1 };
}
function mul(e1, e2) { const w = e => (e.sum ? '(' + e.tex + ')' : e.tex); return { tex: w(e1) + r`\,` + w(e2), ser: sMul(e1.ser, e2.ser), f: x => e1.f(x) * e2.f(x), sum: false }; }
// atom(ax) - (Taylor head up to degree `upto`)
function minusHead(e, upto) { const poly = []; for (let k = 0; k <= upto; k++) poly[k] = e.ser[k].neg(); return comb([{ c: 1, e }], poly); }
const FIRST = ['exp', 'sin', 'tan', 'atan', 'log1p', 'sqrt1p', 'asin', 'cbrt1p'];
const smallA = () => rnd.pick([1, 2, 3, -1, -2]);

/* ---------------- question assembly ---------------- */
function opt(h, v, key) { return { h, v, key }; }
function same(a, b) {
  if (a.h === b.h) return true;
  if (a.minRel && typeof a.v === 'number' && typeof b.v === 'number' && isFinite(a.v) && isFinite(b.v)) return Math.abs(a.v - b.v) <= a.minRel * Math.max(Math.abs(a.v), Math.abs(b.v));
  if (a.key != null && b.key != null && a.key === b.key) return true;
  if (typeof a.v === 'number' && typeof b.v === 'number') {
    if (!isFinite(a.v) || !isFinite(b.v)) return a.v === b.v;
    return Math.abs(a.v - b.v) <= 1e-7 * Math.max(1, Math.abs(a.v), Math.abs(b.v));
  }
  return false;
}
function mk(topic, level, q, right, wrongs, sol, o = {}) {
  const R = typeof right === 'string' ? opt(right) : right;
  if (o.fixed) { const i = o.fixed.indexOf(R.h); if (i < 0) throw new Error('fixed'); return { topic, level, q, opts: o.fixed.slice(), ans: i, sol, verify: o.verify }; }
  const chosen = [R], W = [], need = (o.n || 4) - 1;
  const pool = o.keepOrder ? wrongs : rnd.shuffle(wrongs);
  for (const w0 of pool) {
    if (w0 == null) continue; const w = typeof w0 === 'string' ? opt(w0) : w0;
    if (!w.h || /\bNaN\b|undefined|Infinity/.test(w.h)) continue;
    if (chosen.some(s => same(s, w))) continue;
    chosen.push(w); W.push(w); if (W.length === need) break;
  }
  if (W.length < need) throw new Error('not enough distinct distractors');
  if (/\bNaN\b|undefined/.test(R.h + q + sol)) { const t = (R.h + ' ' + q + ' ' + sol).match(/.{0,60}(\bNaN\b|undefined).{0,30}/); throw new Error('bad text: ' + (t ? t[0] : '')); }
  const all = rnd.shuffle([R, ...W]);
  return { topic, level, q, opts: all.map(x => x.h), ans: all.indexOf(R), sol, verify: o.verify };
}
function pickByLevel(L, list) {
  let c = list.filter(t => L >= t[0] && L <= t[1]);
  if (!c.length) { let best = 99; for (const t of list) { const d = Math.min(Math.abs(L - t[0]), Math.abs(L - t[1])); if (d < best) { best = d; c = [t]; } else if (d === best) c.push(t); } }
  return rnd.pick(c)[2];
}
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
function simpson(f, a, b, n = 2000) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
const valOpt = c => opt(m(Fr.of(c).tex()), Fr.of(c).val());

/* =====================================================================
   1. SETS, LOGIC, SUP / INF
   ===================================================================== */
function supSt(S, hasMax, I, hasMin) {
  const a = hasMax ? m(r`\sup A=\max A=${S}`) : m(r`\sup A=${S}`) + ' and ' + m(r`\max A`) + ' does not exist';
  const b = hasMin ? m(r`\inf A=\min A=${I}`) : m(r`\inf A=${I}`) + ' and ' + m(r`\min A`) + ' does not exist';
  return a + '; ' + b;
}
function supQ(L, setTex, S, hasMax, I, hasMin, extra, sol) {
  const wr = [supSt(S, !hasMax, I, hasMin), supSt(S, hasMax, I, !hasMin), supSt(S, !hasMax, I, !hasMin), ...extra];
  return mk('sets', L, 'Let ' + m('A=' + setTex) + '. Which statement is correct?', supSt(S, hasMax, I, hasMin), wr, sol);
}
function setSupA(L) {
  const a = rnd.nz(-6, 6), b = rnd.int(-4, 4), aa = Math.abs(a);
  const term = r`\frac{${aa}}{n}`;
  const setTex = r`\left\{` + (b === 0 ? (a < 0 ? '-' : '') + term : b + (a < 0 ? ' - ' : ' + ') + term) + r` : n\in\mathbb{N},\ n\ge 1\right\}`;
  const top = b + a; let S, I, hM, hm, sol;
  if (a > 0) { S = top; hM = true; I = b; hm = false; sol = `Since ${m(r`n\mapsto \frac{${aa}}{n}`)} is strictly decreasing, the elements decrease from ${m(top)} (for ${m('n=1')}) towards ${m(b)}, which is approached but never reached.`; }
  else { S = b; hM = false; I = top; hm = true; sol = `Since ${m(r`n\mapsto -\frac{${aa}}{n}`)} is strictly increasing, the elements increase from ${m(top)} (for ${m('n=1')}) towards ${m(b)}, which is approached but never reached.`; }
  return supQ(L, setTex, S, hM, I, hm, [supSt(I, hM, S, hm), supSt(S, true, I, true)], sol);
}
function setSupZ(L) {
  const a = rnd.int(2, 6), b = rnd.int(-3, 3); const mode = rnd.pick(['none', 'high', 'low', 'in']);
  let c = null; if (mode === 'high') c = b + a + rnd.int(1, 5); if (mode === 'low') c = b - a - rnd.int(1, 5); if (mode === 'in') c = b + rnd.int(-a + 1, a - 1);
  const setTex = r`\left\{\frac{${a}}{n}${plusConst(b)} : n\in\mathbb{Z},\ n\neq 0\right\}` + (c === null ? '' : r`\cup\{${c}\}`);
  let S = b + a, I = b - a; if (c !== null && c > S) S = c; if (c !== null && c < I) I = c;
  const sol = `For ${m(r`n\ge 1`)} the elements lie in ${m(iv(b, b + a, false, true))} (largest at ${m('n=1')}); for ${m(r`n\le -1`)} they lie in ${m(iv(b - a, b, true, false))} (smallest at ${m('n=-1')})` + (c === null ? '.' : `; then compare with the extra element ${m(c)}.`) + ` Both extremes are attained.`;
  return supQ(L, setTex, S, true, I, true, [supSt(S, true, b, false), supSt(b + a, true, I, true), supSt(S, true, b - a, true)], sol);
}
function setSeqRatio(L) {
  let p, q; do { p = rnd.int(0, 5); q = rnd.int(0, 5); } while (p === q);
  const num = p === 0 ? 'n' : `n+${p}`, den = q === 0 ? 'n' : `n+${q}`;
  const setTex = r`\left\{\frac{${num}}{${den}} : n\in\mathbb{N},\ n\ge 1\right\}`;
  const v1 = F(1 + p, 1 + q).tex(); let S, I, hM, hm;
  if (p > q) { S = v1; hM = true; I = '1'; hm = false; } else { S = '1'; hM = false; I = v1; hm = true; }
  const sol = `Write ${m(r`\frac{${num}}{${den}} = 1 ${p > q ? '+' : '-'} \frac{${Math.abs(p - q)}}{${den}}`)}: the sequence is strictly ${p > q ? 'decreasing' : 'increasing'}, its first term is ${m(v1)} and it tends to ${m(1)} without reaching it.`;
  const extra = [supSt(S, hM, I, hm).replace(v1, q ? F(p, q).tex() : '0')];
  return supQ(L, setTex, S, hM, I, hm, [...extra, supSt(I, hM, S, hm)], sol);
}
function setAlt(L) {
  const c = rnd.pick([1, 2, 3, 5, 6, 8, -1, -2, -3, -4]);
  const setTex = r`\left\{(-1)^n ${c < 0 ? '-' : '+'} \frac{${Math.abs(c)}}{n} : n\in\mathbb{N},\ n\ge 1\right\}`;
  let S, I, hM, hm, sol;
  if (c > 0) {
    const e = F(2 + c, 2), o = F(c - 1); const best = e.val() >= o.val() ? e : o;
    S = best.tex(); hM = true; I = '-1'; hm = false;
    sol = `Even ${m('n')}: ${m(r`1+\frac{${c}}{n}`)}, decreasing, largest value ${m(e.tex())} at ${m('n=2')}. Odd ${m('n')}: ${m(r`-1+\frac{${c}}{n}`)}, largest value ${m(o.tex())} at ${m('n=1')}, and these terms tend to ${m(-1)} from above. Hence ${m(r`\max A=${S}`)} and ${m(r`\inf A=-1`)} is not attained.`;
    return supQ(L, setTex, S, hM, I, hm, [supSt(S, true, '-1', true), supSt(e.val() >= o.val() ? o.tex() : e.tex(), true, '-1', false), supSt('1', false, '-1', false)], sol);
  }
  const d = -c; S = '1'; hM = false; I = String(-1 - d); hm = true;
  sol = `Odd ${m('n')}: ${m(r`-1-\frac{${d}}{n}`)} is increasing, so the smallest element is ${m(-1 - d)} (at ${m('n=1')}). Even ${m('n')}: ${m(r`1-\frac{${d}}{n}`)} increases towards ${m(1)} without reaching it.`;
  return supQ(L, setTex, S, hM, I, hm, [supSt('1', true, I, true), supSt('1', false, '-1', false), supSt(F(2 - d, 2).tex(), true, I, true)], sol);
}
function setOps(L) {
  const a = rnd.int(-5, 0), c = a + rnd.int(1, 3), b = c + rnd.int(1, 3), d = b + rnd.int(1, 3);
  const Atx = iv(a, b, true, false), Btx = iv(c, d, false, true);
  const ops = [
    ['A\\cap B', iv(c, b, false, false), [iv(c, b, true, false), iv(c, b, false, true), iv(c, b, true, true), iv(a, d, true, true)], `The common points are those with ${m(`${c}<x<${b}`)}.`],
    ['A\\cup B', iv(a, d, true, true), [iv(a, d, true, false), iv(a, d, false, true), iv(c, b, false, false)], `The union covers everything from ${m(a)} (included) to ${m(d)} (included).`],
    ['A\\setminus B', iv(a, c, true, true), [iv(a, c, true, false), iv(a, c, false, true), iv(b, d, true, true)], `Remove from ${m('A')} the points of ${m('B')}, i.e. those with ${m(`x>${c}`)}; ${m(c)} itself is not in ${m('B')}, so it stays.`],
    ['B\\setminus A', iv(b, d, true, true), [iv(b, d, false, true), iv(b, d, true, false), iv(a, c, true, true)], `Remove from ${m('B')} the points with ${m(`x<${b}`)}; ${m(b)} is not in ${m('A')}, so it stays.`],
  ];
  const [op, right, wr, sol] = rnd.pick(ops);
  return mk('sets', L, `Let ${m('A=' + Atx)} and ${m('B=' + Btx)}. Then ${m(op)} equals`, m(right), wr.map(m), sol);
}
const NEG_BANK = [
  [r`\forall x\in A\ \exists y\in B:\ x<y`, r`\exists x\in A\ \forall y\in B:\ x\ge y`, [r`\exists x\in A\ \forall y\in B:\ x> y`, r`\forall x\in A\ \exists y\in B:\ x\ge y`, r`\exists x\in A\ \exists y\in B:\ x\ge y`, r`\forall x\in A\ \forall y\in B:\ x\ge y`]],
  [r`\exists M\in\mathbb{R}\ \forall x\in A:\ x\le M`, r`\forall M\in\mathbb{R}\ \exists x\in A:\ x> M`, [r`\forall M\in\mathbb{R}\ \exists x\in A:\ x\ge M`, r`\exists M\in\mathbb{R}\ \forall x\in A:\ x> M`, r`\forall M\in\mathbb{R}\ \forall x\in A:\ x> M`]],
  [r`\forall \varepsilon>0\ \exists n_0\in\mathbb{N}\ \forall n\ge n_0:\ |a_n-\ell|<\varepsilon`, r`\exists \varepsilon>0\ \forall n_0\in\mathbb{N}\ \exists n\ge n_0:\ |a_n-\ell|\ge\varepsilon`, [r`\exists \varepsilon>0\ \forall n_0\in\mathbb{N}\ \forall n\ge n_0:\ |a_n-\ell|\ge\varepsilon`, r`\forall \varepsilon>0\ \exists n_0\in\mathbb{N}\ \forall n\ge n_0:\ |a_n-\ell|\ge\varepsilon`, r`\exists \varepsilon\le 0\ \forall n_0\in\mathbb{N}\ \exists n\ge n_0:\ |a_n-\ell|<\varepsilon`]],
  [r`\forall x\in\mathbb{R}:\ f(x)>0`, r`\exists x\in\mathbb{R}:\ f(x)\le 0`, [r`\exists x\in\mathbb{R}:\ f(x)< 0`, r`\forall x\in\mathbb{R}:\ f(x)\le 0`, r`\forall x\in\mathbb{R}:\ f(x)< 0`]],
];
function negation(L) {
  const [p, right, wr] = rnd.pick(NEG_BANK);
  return mk('sets', L, `The negation of the proposition ${m(p)} is`, m(right), wr.map(m), `Swap every ${m(r`\forall`)} with ${m(r`\exists`)} (and vice versa) and negate the final condition.`);
}
function genSets(L) {
  return pickByLevel(L, [[1, 2, setOps], [1, 3, negation], [1, 3, setSupA], [3, 5, setSupZ], [4, 6, setSeqRatio], [5, 6, setAlt]])(L);
}

/* =====================================================================
   2. FUNCTIONS: parity, composition, domain, inverse, injectivity
   ===================================================================== */
const PARITY = [
  [r`x^3\sin x`, 'even'], [r`x^2\sin x`, 'odd'], [r`e^{x}+e^{-x}`, 'even'], [r`\log\frac{1-x}{1+x}`, 'odd'], [r`x+\cos x`, 'neither'],
  [r`\arctan(x^3)`, 'odd'], [r`|x|\,e^{x^2}`, 'even'], [r`e^{x}\sin x`, 'neither'], [r`\frac{x}{1+x^2}`, 'odd'], [r`\sin(x^2)`, 'even'],
  [r`x\,|x|`, 'odd'], [r`\log(1+x^2)`, 'even'], [r`x^3+1`, 'neither'], [r`\frac{e^{x}-e^{-x}}{2}`, 'odd'], [r`\cos(x^3)`, 'even'], [r`x^2+x`, 'neither'],
];
function parity(L) {
  const [f, p] = rnd.pick(PARITY);
  const lab = { even: 'even', odd: 'odd', neither: 'neither even nor odd', both: 'both even and odd' };
  return mk('functions', L, `The function ${m('f(x)=' + f)}, defined on its natural domain, is`, lab[p], [], `Compute ${m('f(-x)')}: it equals ${p === 'even' ? m('f(x)') : p === 'odd' ? m('-f(x)') : 'neither ' + m('f(x)') + ' nor ' + m('-f(x)') + ' for all ' + m('x')}.`, { fixed: [lab.even, lab.odd, lab.neither, lab.both] });
}
function composition(L) {
  const a = rnd.nz(-3, 3), b = rnd.pick([1, 2, 3, -1]);
  const kind = rnd.pick(['exp', 'log', 'sqrt']);
  const f = `x^2${plusConst(a)}`; let g, fg, gf, w1, w2, Fv, Gv;
  const x0 = 0.37; Fv = x => x * x + a;
  if (kind === 'exp') { g = `e^{${mono(b, 1)}}`; Gv = x => Math.exp(b * x); fg = `e^{${mono(2 * b, 1)}}${plusConst(a)}`; gf = `e^{${mono(b, 1).replace(/x$/, '')}(x^2${plusConst(a)})}`.replace('e^{(', 'e^{('); if (b === 1) gf = `e^{x^2${plusConst(a)}}`; w1 = `e^{${mono(b, 2)}}${plusConst(a)}`; w2 = `(x^2${plusConst(a)})\\,e^{${mono(b, 1)}}`; }
  else if (kind === 'log') { g = r`\log x`; Gv = Math.log; fg = r`\log^2 x` + plusConst(a); gf = r`\log(x^2` + plusConst(a) + ')'; w1 = r`\log(x^2)` + plusConst(a); w2 = r`(x^2` + plusConst(a) + r`)\log x`; }
  else { g = r`\sqrt{x}`; Gv = Math.sqrt; fg = 'x' + plusConst(a); gf = r`\sqrt{x^2` + plusConst(a) + '}'; w1 = '|x|' + plusConst(a); w2 = r`(x^2` + plusConst(a) + r`)\sqrt{x}`; }
  const askFG = rnd.chance(0.5);
  const right = askFG ? fg : gf, other = askFG ? gf : fg;
  const q = `Let ${m('f(x)=' + f)} and ${m('g(x)=' + g)}. Then ${m(askFG ? r`(f\circ g)(x)` : r`(g\circ f)(x)`)} equals (where defined)`;
  const sol = askFG ? `${m(r`(f\circ g)(x)=f(g(x))=(${g})^2${plusConst(a)}`)}.` : `${m(r`(g\circ f)(x)=g(f(x))`)}: substitute ${m('f(x)')} into ${m('g')}.`;
  void x0; void Fv; void Gv;
  return mk('functions', L, q, m(right), [m(other), m(w1), m(w2)], sol);
}
function domainQ(L) {
  const t = rnd.int(1, 6); const a = rnd.int(1, 4), s = rnd.int(-3, 3);
  let f, right, wr, sol;
  if (t === 1) { f = r`\log(x^2-${a * a})`; right = iv(MINF, -a, false, false) + r`\cup` + iv(a, INF, false, false); wr = [iv(-a, a, false, false), iv(MINF, -a, false, true) + r`\cup` + iv(a, INF, true, false), iv(a, INF, false, false)]; sol = `We need ${m(`x^2>${a * a}`)}, i.e. ${m(`|x|>${a}`)}.`; }
  else if (t === 2) { const b = s + rnd.int(1, 4); f = r`\sqrt{\frac{x${plusConst(-s)}}{x${plusConst(-b)}}}`; right = iv(MINF, s, false, true) + r`\cup` + iv(b, INF, false, false); wr = [iv(MINF, s, false, false) + r`\cup` + iv(b, INF, false, false), iv(MINF, s, false, true) + r`\cup` + iv(b, INF, true, false), iv(s, b, true, false)]; sol = `The fraction must be ${m(r`\ge 0`)} and the denominator nonzero: numerator and denominator have the same sign, or the numerator vanishes (${m('x=' + s)}).`; }
  else if (t === 3) { f = r`\arcsin\frac{x${plusConst(-s)}}{${a}}`; right = iv(s - a, s + a, true, true); wr = [iv(s - a, s + a, false, false), iv(-1, 1, true, true), iv(s - 1, s + 1, true, true)]; sol = `We need ${m(r`-1\le \frac{x${plusConst(-s)}}{${a}}\le 1`)}, i.e. ${m(`${s - a}\\le x\\le ${s + a}`)}.`; }
  else if (t === 4) { f = r`\log(\log(x${plusConst(-s)}))`; right = iv(s + 1, INF, false, false); wr = [iv(s, INF, false, false), iv(s + 1, INF, true, false), iv(s, s + 1, false, false)]; sol = `We need ${m(`x${plusConst(-s)}>0`)} and ${m(`\\log(x${plusConst(-s)})>0`)}, i.e. ${m(`x${plusConst(-s)}>1`)}.`; }
  else if (t === 5) { f = r`\sqrt{\log(x${plusConst(-s)})}`; right = iv(s + 1, INF, true, false); wr = [iv(s + 1, INF, false, false), iv(s, INF, false, false), iv(s, s + 1, false, true)]; sol = `We need ${m(`\\log(x${plusConst(-s)})\\ge 0`)}, i.e. ${m(`x${plusConst(-s)}\\ge 1`)}.`; }
  else { f = r`\frac{1}{\sqrt{${a * a}-(x${plusConst(-s)})^2}}`; right = iv(s - a, s + a, false, false); wr = [iv(s - a, s + a, true, true), iv(MINF, s - a, false, false) + r`\cup` + iv(s + a, INF, false, false), iv(-a, a, false, false)]; if (s === 0) wr[2] = iv(0, a, false, false); sol = `We need ${m(`(x${plusConst(-s)})^2<${a * a}`)}, i.e. ${m(`|x${plusConst(-s)}|<${a}`)}.`; }
  return mk('functions', L, `The (natural) domain of ${m('f(x)=' + f)} is`, m(right), wr.map(m), sol);
}
function inverseQ(L) {
  const t = rnd.int(1, 4); let f, right, wr, sol;
  if (t === 1) { const a = rnd.pick([2, 3, -2, 1]), b = rnd.nz(-3, 3); f = `e^{${mono(a, 1)}${plusConst(b)}}`; right = r`\frac{\log x${plusConst(-b)}}{${a}}`; if (a === 1) right = r`\log x` + plusConst(-b); wr = [r`\frac{\log x${plusConst(b)}}{${a}}`, r`\frac{\log(x${plusConst(-b)})}{${a}}`, r`${a}\log x${plusConst(-b)}`]; sol = `Solve ${m('y=' + f)}: ${m(`\\log y=${mono(a, 1)}${plusConst(b)}`)}, so ${m(`x=\\frac{\\log y${plusConst(-b)}}{${a}}`)}.`; }
  else if (t === 2) { const a = rnd.nz(-3, 3), b = rnd.nz(-3, 3); f = r`\log(x${plusConst(-a)})${plusConst(b)}`; right = `e^{x${plusConst(-b)}}${plusConst(a)}`; wr = [`e^{x${plusConst(b)}}${plusConst(a)}`, `e^{x${plusConst(-b)}}${plusConst(-a)}`, `e^{x${plusConst(-a)}}${plusConst(b)}`]; sol = `From ${m('y=' + f)}: ${m(`x${plusConst(-a)}=e^{y${plusConst(-b)}}`)}.`; }
  else if (t === 3) { const a = rnd.nz(-3, 3); const k = rnd.pick([3, 5]); f = `x^{${k}}${plusConst(a)}`; right = r`\sqrt[${k}]{x${plusConst(-a)}}`; wr = [r`\sqrt[${k}]{x}${plusConst(-a)}`, r`\sqrt[${k}]{x${plusConst(a)}}`, r`\frac{1}{x^{${k}}${plusConst(a)}}`]; sol = `${m(`y=x^{${k}}${plusConst(a)}`)} gives ${m(`x^{${k}}=y${plusConst(-a)}`)}; the odd root is defined on all of ${m(r`\mathbb{R}`)}.`; }
  else { let a, b, d; do { a = rnd.nz(-3, 3); b = rnd.nz(-4, 4); d = rnd.nz(-3, 3); } while (a * d === b); f = r`\frac{${mono(a, 1)}${plusConst(b)}}{x${plusConst(d)}}`; right = r`\frac{${mono(-d, 1)}${plusConst(b)}}{x${plusConst(-a)}}`; wr = [r`\frac{x${plusConst(d)}}{${mono(a, 1)}${plusConst(b)}}`, r`\frac{${mono(d, 1)}${plusConst(-b)}}{x${plusConst(-a)}}`, r`\frac{${mono(-d, 1)}${plusConst(b)}}{x${plusConst(a)}}`]; sol = `Solve ${m('y=' + f)} for ${m('x')}: ${m(`y(x${plusConst(d)})=${mono(a, 1)}${plusConst(b)}`)} gives ${m(`x(y${plusConst(-a)})=${mono(-d, 1).replace('x', 'y')}${plusConst(b)}`)}.`; }
  return mk('functions', L, `The function ${m('f(x)=' + f)} is invertible on its domain. Its inverse is ${m(r`f^{-1}(x)=`)}`, m(right), wr.map(m), sol);
}
const INJ_YES = [r`x^3+x`, r`e^{x}-e^{-x}`, r`x+\arctan x`, r`x\,|x|`, r`e^{x}+x`, r`x+\sin x`, r`x^5+2x^3`, r`\arctan(x^3)`];
const INJ_NO = [r`x^2+x`, r`x^3-3x`, r`x+2\sin x`, r`e^{x^2}`, r`|x-1|`, r`x^4-x`, r`\cos x`, r`x\,e^{-x}`, r`\frac{x}{1+x^2}`, r`\log(1+x^2)`];
function injective(L) {
  const not = rnd.chance(0.35);
  const right = not ? rnd.pick(INJ_NO) : rnd.pick(INJ_YES);
  const wr = rnd.shuffle(not ? INJ_YES : INJ_NO).slice(0, 4);
  const sol = not ? 'Exactly one of these functions has a derivative that changes sign (or is even / periodic), so it takes some value twice; the other three are strictly increasing.' : 'A strictly monotone function is injective. Check the sign of the derivative: only the correct option has ' + m(r`f'\ge 0`) + ' with zeros only at isolated points; the others take some value twice.';
  return mk('functions', L, `Which of the following functions ${m(r`f:\mathbb{R}\to\mathbb{R}`)} is ${not ? '<b>not</b> ' : ''}injective?`, m('f(x)=' + right), wr.map(w => m('f(x)=' + w)), sol);
}
function genFunctions(L) { return pickByLevel(L, [[1, 2, parity], [1, 3, composition], [2, 4, domainQ], [3, 5, inverseQ], [4, 6, injective]])(L); }

/* =====================================================================
   3. LIMITS (functions and sequences)
   ===================================================================== */
function limOpts(c, L) {
  c = Fr.of(c); const w = [valOpt(c.mul(2)), valOpt(c.div(2)), valOpt(c.neg())];
  if (L >= 3) { w.push(opt(m('0'), 0)); w.push(opt(m(INF), Infinity)); } else { w.push(valOpt(c.add(1))); w.push(opt(m('0'), 0)); }
  if (!c.isZero()) w.push(valOpt(c.inv()));
  return w;
}
function limitQ(L, N, D, extraSol) {
  const kN = sOrder(N.ser), kD = sOrder(D.ser);
  if (kN < 1 || kN !== kD || kN > 6) throw new Error('order');
  const c = N.ser[kN].div(D.ser[kD]);
  const sol = `As ${m(r`x\to 0`)}: ${m(r`${N.tex}\sim ${mono(N.ser[kN], kN)}`)} and ${m(r`${D.tex}\sim ${mono(D.ser[kD], kD)}`)}` + (extraSol ? ' ' + extraSol : '') + `. Hence the limit is ${m(c.tex())}.`;
  return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{x\to 0}\frac{${N.tex}}{${D.tex}}`), valOpt(c), limOpts(c, L), sol, {
    verify: () => { const v = N.f(1e-3) / D.f(1e-3); return near(v, c.val(), 2e-2); } });
}
function block1(nm, a) { const e = A(nm, X(a)); return e.v0 ? comb([{ c: 1, e }], [-1]) : e; }
function limL1() {
  const nm = rnd.pick(['exp', 'sin', 'tan', 'atan', 'log1p', 'sqrt1p', 'cos']); const a = smallA();
  let N = nm === 'cos' ? comb([{ c: -1, e: A('cos', X(a)) }], [1]) : block1(nm, a);
  const k = sOrder(N.ser); const D = X(rnd.pick([1, 2, 3]), k); return [N, D];
}
function limL2() {
  const two = rnd.chance(0.3);
  if (two) { const a = smallA(), b = rnd.pick([1, 2, 3]); const N = comb([{ c: -1, e: A('cos', X(a)) }], [1]); const D = mul(block1(rnd.pick(['sin', 'exp', 'log1p', 'tan']), b), X(1)); return [N, D]; }
  const n1 = rnd.pick(FIRST), n2 = rnd.pick(FIRST); return [block1(n1, smallA()), block1(n2, rnd.pick([1, 2, 3, -1]))];
}
function limL3() {
  const N = mul(block1(rnd.pick(FIRST), smallA()), block1(rnd.pick(['sin', 'exp', 'log1p', 'atan']), smallA()));
  const D = rnd.chance(0.5) ? comb([{ c: -1, e: A('cos', X(rnd.pick([1, 2]))) }], [1]) : mul(X(1), block1(rnd.pick(['tan', 'sin', 'log1p']), rnd.pick([1, 2, 3])));
  return [N, D];
}
function limL4() {
  const nm = rnd.pick(['exp', 'sin', 'tan', 'atan', 'log1p', 'sqrt1p', 'cos', 'asin']); const a = rnd.pick([1, 2, -1, 3]);
  const e = A(nm, X(a)); const k1 = sOrder(minusHead(e, 0).ser);
  const N = minusHead(e, k1); const k = sOrder(N.ser);
  const D = rnd.chance(0.6) ? X(1, k) : mul(X(1, k - 1), block1(rnd.pick(['sin', 'tan', 'log1p']), rnd.pick([1, 2])));
  return [N, D];
}
function cancelPair(level6) {
  for (let tries = 0; tries < 60; tries++) {
    let e1, e2;
    const a = rnd.pick([1, 2, -1]), b = rnd.pick([1, 2, -1, 3]);
    if (level6 && rnd.chance(0.6)) {
      const cmp = rnd.int(1, 4);
      if (cmp === 1) e1 = A('exp', A('sin', X(a))); else if (cmp === 2) e1 = A('log1p', A('sin', X(a))); else if (cmp === 3) e1 = logcos(X(a)); else e1 = A('exp', X(a, 2));
    } else e1 = A(rnd.pick(FIRST), X(a));
    e2 = level6 && rnd.chance(0.3) ? A('cos', X(b)) : A(rnd.pick(FIRST), X(b));
    const h1 = minusHead(e1, 0), h2 = minusHead(e2, 0);
    const k1 = sOrder(h1.ser), k2 = sOrder(h2.ser); if (k1 !== k2) continue;
    const lam = h1.ser[k1].div(h2.ser[k2]);
    if (!(lam.isInt() || lam.d === 2n) || lam.abs().val() > 4) continue;
    const N = comb([{ c: 1, e: e1 }, { c: lam.neg(), e: e2 }], [e1.ser[0].neg().add(lam.mul(e2.ser[0]))]);
    const k = sOrder(N.ser); if (k < 2 || k > 5) continue;
    return N;
  }
  throw new Error('pair');
}
function limL5(L) { const N = cancelPair(L >= 6); const k = sOrder(N.ser); const D = rnd.chance(0.7) ? X(1, k) : mul(X(1, k - 1), block1(rnd.pick(['sin', 'tan', 'log1p', 'atan']), 1)); return [N, D]; }
function limParam(L) {
  for (let t = 0; t < 60; t++) {
    const n1 = rnd.pick(FIRST), n2 = rnd.pick(FIRST); if (n1 === n2) continue;
    const a = rnd.pick([1, 2]), b = rnd.pick([1, 2]);
    const e1 = minusHead(A(n1, X(a)), 0), e2 = minusHead(A(n2, X(b)), 0);
    const lam = e1.ser[1].div(e2.ser[1]); if (!(lam.isInt() || lam.d === 2n)) continue;
    const N = comb([{ c: 1, e: e1 }, { c: lam.neg(), e: e2 }]); const k = sOrder(N.ser); if (k < 2 || k > 4) continue;
    const Lv = N.ser[k];
    const e2t = e2.sum ? '(' + e2.tex + ')' : e2.tex;
    const q = `Let ${m(r`a\in\mathbb{R}`)}. The limit ${m(r`\displaystyle\lim_{x\to 0}\frac{${e1.tex} - a\,${e2t}}{x^{${k}}}`)} is finite if and only if`;
    const st = (av, lv) => m(`a=${av.tex()}`) + ', and in that case it equals ' + m(lv.tex());
    const right = opt(st(lam, Lv), null, lam.tex() + '|' + Lv.tex());
    const wr = [opt(st(lam, Lv.neg()), null, lam.tex() + '|' + Lv.neg().tex()), opt(st(lam.neg(), Lv), null, lam.neg().tex() + '|' + Lv.tex()), opt(st(lam, Lv.mul(2)), null, 'x' + Lv.mul(2).tex()), opt(st(lam.add(1), Lv), null, 'y' + lam.add(1).tex()), opt(st(lam, F(0)), null, 'z')];
    const sol = `The first-order term of the numerator is ${m(`(${e1.ser[1].tex()} - ${b === 1 && e2.ser[1].eq(1) ? '' : e2.ser[1].tex()}a)x`.replace('- a', '- a'))}: it must vanish, so ${m('a=' + lam.tex())}. Then the numerator is ${m(r`${mono(Lv, k)}+o(x^{${k}})`)}.`;
    return mk('limits', L, q, right, wr, sol, { verify: () => near(N.f(1e-3) / Math.pow(1e-3, k), Lv.val(), 2e-2) });
  }
  throw new Error('param');
}
function limInf(L) {
  const t = rnd.int(1, 5);
  if (t === 1) { // rational sequence
    const a = rnd.nz(-5, 5), d = rnd.nz(1, 6), b = rnd.int(-5, 5), c = rnd.int(-5, 5), e = rnd.nz(-5, 5); const k = rnd.pick([2, 3]);
    const num = polyTex([c, b].concat(k === 3 ? [0, a] : [a]), true, 'n'), den = polyTex([e].concat(k === 3 ? [0, 0, d] : [0, d]), true, 'n');
    const v = F(a, d);
    return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{n\to\infty}\frac{${num}}{${den}}`), valOpt(v), [valOpt(F(c, e)), opt(m('0'), 0), opt(m(INF), Infinity), valOpt(F(b, d)), valOpt(v.neg())], `Divide numerator and denominator by ${m(`n^{${k}}`)}: only the leading coefficients matter, giving ${m(v.tex())}.`);
  }
  if (t === 2) { const a = rnd.nz(-6, 6); const v = F(a, 2);
    return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{x\to+\infty}\left(\sqrt{x^2${a > 0 ? '+' : '-'}${Math.abs(a)}x}-x\right)`), valOpt(v), [valOpt(F(a)), opt(m('0'), 0), opt(m(INF), Infinity), valOpt(F(a, 4))], `Multiply and divide by the conjugate: ${m(r`\frac{${a}x}{\sqrt{x^2${a > 0 ? '+' : '-'}${Math.abs(a)}x}+x}\to\frac{${a}}{2}`)}.`,
      { verify: () => near(Math.sqrt(1e6 * 1e6 + a * 1e6) - 1e6, v.val(), 1e-3) }); }
  if (t === 3) { const a = rnd.nz(-3, 3), b = rnd.pick([1, 2, 3, -1, -2]); const ab = a * b;
    const right = opt(m(ab === 0 ? '1' : ab === 1 ? 'e' : `e^{${ab}}`), Math.exp(ab));
    const wr = [opt(m(`e^{${F(a, b).tex()}}`), Math.exp(a / b)), opt(m('1'), 1), opt(m(`e^{${a + b}}`), Math.exp(a + b)), opt(m(INF), Infinity), opt(m(`e^{${a}}`), Math.exp(a))];
    return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{n\to\infty}\left(1${a > 0 ? '+' : '-'}\frac{${Math.abs(a)}}{n}\right)^{${mono(b, 1, 'n')}}`), right, wr, `Write it as ${m(r`\exp\left(${mono(b, 1, 'n')}\log\left(1${a > 0 ? '+' : '-'}\frac{${Math.abs(a)}}{n}\right)\right)`)} and use ${m(r`\log(1+t)\sim t`)}: the exponent tends to ${m(ab)}.`,
      { verify: () => near(Math.pow(1 + a / 1e7, b * 1e7), Math.exp(ab), 1e-3) }); }
  if (t === 4) { const a = rnd.nz(-4, 4);
    return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{x\to+\infty}x\left(e^{${F(a).tex()}/x}-1\right)`), valOpt(F(a)), [opt(m('0'), 0), opt(m('1'), 1), opt(m(INF), Infinity), valOpt(F(a * a))], `With ${m('t=1/x\\to 0^+')}: ${m(r`\frac{e^{${a}t}-1}{t}\to ${a}`)}.`); }
  const a = rnd.int(1, 4); const v = F(a * a, 2);
  return mk('limits', L, 'Compute ' + m(r`\displaystyle\lim_{n\to\infty}n^2\left(1-\cos\frac{${a}}{n}\right)`), valOpt(v), [valOpt(F(a * a)), valOpt(F(a, 2)), opt(m('0'), 0), opt(m(INF), Infinity)], `${m(r`1-\cos t\sim \frac{t^2}{2}`)} with ${m(r`t=\frac{${a}}{n}`)}.`);
}
function genLimits(L) {
  const kind = pickByLevel(L, [[1, 1, 'l1'], [1, 3, 'inf'], [2, 2, 'l2'], [3, 3, 'l3'], [4, 4, 'l4'], [5, 6, 'l5'], [6, 6, 'par']]);
  if (kind === 'inf') return limInf(L);
  if (kind === 'par') return limParam(L);
  const [N, D] = kind === 'l1' ? limL1() : kind === 'l2' ? limL2() : kind === 'l3' ? limL3() : kind === 'l4' ? limL4() : limL5(L);
  return limitQ(L, N, D);
}

/* =====================================================================
   4. ASYMPTOTICS: Landau symbols, principal part, order, Maclaurin polynomials
   ===================================================================== */
const LANDAU_T = [r`x^3=o(x^2)\ \text{as } x\to 0`, r`x^2=o(x^3)\ \text{as } x\to+\infty`, r`1-\cos x=o(x)\ \text{as } x\to 0`, r`\sin x\sim x\ \text{as } x\to 0`, r`\log x=o(x)\ \text{as } x\to+\infty`, r`x^2\log x=o(x)\ \text{as } x\to 0^+`, r`e^{x}-1\sim x\ \text{as } x\to 0`, r`x^{10}=o(e^{x})\ \text{as } x\to+\infty`, r`\sin(x^2)=o(x)\ \text{as } x\to 0`];
const LANDAU_F = [r`x^2=o(x^3)\ \text{as } x\to 0`, r`x^3=o(x^2)\ \text{as } x\to+\infty`, r`1-\cos x\sim x\ \text{as } x\to 0`, r`\sin x=o(x)\ \text{as } x\to 0`, r`x=o(\log x)\ \text{as } x\to+\infty`, r`e^{x}=o(x^{10})\ \text{as } x\to+\infty`, r`\log(1+x)\sim x^2\ \text{as } x\to 0`, r`x+x^2\sim x^2\ \text{as } x\to 0`, r`\sqrt{x}=o(x)\ \text{as } x\to 0^+`];
function landau(L) {
  const neg = rnd.chance(0.3);
  const right = neg ? rnd.pick(LANDAU_F) : rnd.pick(LANDAU_T);
  const wr = rnd.shuffle(neg ? LANDAU_T : LANDAU_F).slice(0, 5);
  return mk('asymptotics', L, `Which of the following statements is <b>${neg ? 'false' : 'true'}</b>?`, m(right), wr.map(m), `Recall: ${m(r`f=o(g)`)} means ${m(r`f/g\to 0`)}; ${m(r`f\sim g`)} means ${m(r`f/g\to 1`)}. Near ${m('0')} higher powers are smaller; at ${m(r`+\infty`)} exponentials beat powers, which beat logarithms.`);
}
function maclaurin(L) {
  let e; const t = rnd.int(1, 3);
  if (t === 1) e = mul(A(rnd.pick(['exp', 'cos']), X(rnd.pick([1, 2, -1]))), A(rnd.pick(['sin', 'log1p', 'atan']), X(1)));
  else if (t === 2) e = mul(A('exp', X(rnd.pick([1, 2, -1]))), A('cos', X(1)));
  else e = A('exp', A('sin', X(1)));
  const n = 3; const co = e.ser.slice(0, n + 1);
  const P = c => polyTex(c, false);
  const right = m(P(co));
  const w1 = co.slice(); w1[3] = w1[3].neg(); const w2 = co.slice(); w2[2] = w2[2].mul(2); const w3 = co.slice(); w3[3] = w3[3].mul(6); const w4 = co.slice(); w4[2] = w4[2].neg(); const w5 = co.slice(); w5[1] = w5[1].add(1);
  const wr = [w1, w2, w3, w4, w5].map(w => opt(m(P(w)), null, w.map(c => c.tex()).join('|')));
  return mk('asymptotics', L, `The Maclaurin polynomial of order ${m(3)} of ${m('f(x)=' + e.tex)} is`, opt(right, null, co.map(c => c.tex()).join('|')), wr, `Multiply (or compose) the fundamental expansions and keep the terms up to ${m('x^3')}: ${m(`f(x)=${P(co)}+o(x^3)`)}.`);
}
function principal(L) {
  const N = L >= 5 ? cancelPair(L >= 6) : (L >= 4 ? minusHead(A(rnd.pick(['exp', 'sin', 'tan', 'atan', 'log1p', 'sqrt1p', 'cos', 'asin']), X(rnd.pick([1, 2, -1]))), 1) : mul(block1(rnd.pick(FIRST), smallA()), block1(rnd.pick(['sin', 'exp', 'log1p']), smallA())));
  let k = sOrder(N.ser); if (k < 1 || k > 6) throw new Error('k');
  if (L >= 4 && k === 1) throw new Error('trivial');
  const c = N.ser[k];
  const askOrder = rnd.chance(0.3);
  if (askOrder) {
    const right = opt(m(k), k); const wr = [k - 1, k + 1, k + 2, k - 2].filter(x => x >= 1).map(x => opt(m(x), x));
    return mk('asymptotics', L, `As ${m(r`x\to 0`)}, the function ${m('f(x)=' + N.tex)} is an infinitesimal of order (with respect to ${m('x')})`, right, wr, `Expanding, ${m(r`f(x)=${mono(c, k)}+o(x^{${k}})`)}, so the order is ${m(k)}.`, { verify: () => near(N.f(1e-3) / Math.pow(1e-3, k), c.val(), 2e-2) });
  }
  const P = (cc, kk) => opt(m(mono(cc, kk)), null, cc.tex() + '|' + kk);
  const wr = [P(c, k + 1), P(c.neg(), k), P(c.mul(2), k), P(c.div(2), k)]; if (k > 1) wr.push(P(c, k - 1));
  return mk('asymptotics', L, `As ${m(r`x\to 0`)}, the principal part of ${m('f(x)=' + N.tex)} with respect to the infinitesimal ${m('x')} is`, P(c, k), wr, `Using the Maclaurin expansions, ${m(r`f(x)=${mono(c, k)}+o(x^{${k}})`)}.`, { verify: () => near(N.f(1e-3) / Math.pow(1e-3, k), c.val(), 2e-2) });
}
function principalInf(L) {
  const a = rnd.pick([1, 2, 3, -1, -2]); const t = rnd.int(1, 5); let f, c, k, fn;
  if (t === 1) { f = r`\sqrt{x^2${a > 0 ? '+' : '-'}${Math.abs(a) === 1 ? '' : Math.abs(a)}x}-x` +(a % 2 === 0 ? sgnTerm(-a / 2) : (a > 0 ? r` - \frac{${a}}{2}` : r` + \frac{${-a}}{2}`)); c = F(-a * a, 8); k = 1; fn = x => Math.sqrt(x * x + a * x) - x - a / 2; }
  else if (t === 2) { f = r`x\log\left(1${a > 0 ? '+' : '-'}\frac{${Math.abs(a)}}{x}\right)${sgnTerm(-a)}`; c = F(-a * a, 2); k = 1; fn = x => x * Math.log1p(a / x) - a; }
  else if (t === 3) { f = r`x^2\left(1-\cos\frac{${Math.abs(a)}}{x}\right)-${F(a * a, 2).tex()}`; c = F(-(a ** 4), 24); k = 2; fn = x => x * x * (1 - Math.cos(a / x)) - a * a / 2; }
  else if (t === 4) { f = r`x\sin\frac{${Math.abs(a)}}{x}-${Math.abs(a)}`; c = F(-(Math.abs(a) ** 3), 6); k = 2; fn = x => x * Math.sin(Math.abs(a) / x) - Math.abs(a); }
  else { f = r`x\left(e^{${F(a).tex()}/x}-1\right)${sgnTerm(-a)}`; c = F(a * a, 2); k = 1; fn = x => x * Math.expm1(a / x) - a; }
  const P = (cc, kk) => opt(m(kk === 1 ? r`${cc.tex()}\cdot\frac{1}{x}` : r`${cc.tex()}\cdot\frac{1}{x^{${kk}}}`), null, cc.tex() + '|' + kk);
  return mk('asymptotics', L, `As ${m(r`x\to+\infty`)}, the principal part of ${m('f(x)=' + f)} with respect to the infinitesimal ${m(r`\frac{1}{x}`)} is`, P(c, k), [P(c.neg(), k), P(c, k + 1), P(c.mul(2), k), P(c.div(2), k)], `Put ${m(r`t=\frac{1}{x}\to 0^+`)} and expand to second order; the first surviving term is ${m(r`${c.tex()}\,t^{${k}}`)}.`, { verify: () => near(fn(1e3) * Math.pow(1e3, k), c.val(), 2e-2) });
}
function genAsym(L) { return pickByLevel(L, [[1, 2, landau], [2, 3, maclaurin], [3, 5, principal], [5, 6, principalInf], [6, 6, principal]])(L); }

/* =====================================================================
   5. DERIVATIVES
   ===================================================================== */
function deriv(L) {
  const kind = pickByLevel(L, [[1, 1, 1], [1, 2, 2], [3, 3, 3], [3, 4, 4], [5, 5, 5], [5, 6, 6]]);
  if (kind === 1) {
    const p = rnd.int(-3, 4), a = rnd.nz(-3, 3); const v = 2 + a * (1 + p);
    const ea = `e^{${a === 1 ? '' : a === -1 ? '-' : a}(x-1)}`; const f = `(x^2${plusConst(p)})\\,${ea}`;
    const sa = a > 0 ? '+' : '-', aa = Math.abs(a) === 1 ? '' : Math.abs(a);
    return mk('derivatives', L, `Let ${m('f(x)=' + f)}. Then ${m("f'(1)")} equals`, opt(m(v), v), [opt(m(2 + a * p), 2 + a * p), opt(m(a * (1 + p)), a * (1 + p)), opt(m(2), 2), opt(m(2 * a * (1 + p)), 2 * a * (1 + p)), opt(m(v + 1), v + 1), opt(m(v - 1), v - 1)], `${m(`f'(x)=\\left(2x${sa}${aa}(x^2${plusConst(p)})\\right)${ea}`)}, so ${m(`f'(1)=2${sa}${Math.abs(a)}\\cdot(${1 + p})=${v}`)}.`,
      { verify: () => near((Math.pow(1.000001, 2) + p) * Math.exp(a * 1e-6) - (Math.pow(0.999999, 2) + p) * Math.exp(-a * 1e-6), 2e-6 * v, 1e-4) });
  }
  if (kind === 2) {
    let a, b, c; do { a = rnd.nz(-3, 3); b = rnd.nz(-4, 4); c = rnd.nz(-3, 3); } while (a * c - b === 0);
    const q = F(b, c), s = F(a * c - b, c * c);
    const line = (qq, ss) => opt(m('y=' + polyTex([qq, ss])), null, qq.tex() + '|' + ss.tex());
    return mk('derivatives', L, `The tangent line to the graph of ${m(r`f(x)=\frac{${mono(a, 1)}${plusConst(b)}}{x${plusConst(c)}}`)} at ${m('x_0=0')} is`, line(q, s), [line(q, s.neg()), line(q, F(a, c)), line(F(c, b), s), line(q.neg(), s)], `${m(`f(0)=${q.tex()}`)} and ${m(r`f'(x)=\frac{${a * c - b}}{(x${plusConst(c)})^2}`)}, so ${m(`f'(0)=${s.tex()}`)}; the tangent is ${m(r`y=f(0)+f'(0)x`)}.`,
      { verify: () => { const f = x => (a * x + b) / (x + c); return near((f(1e-6) - f(-1e-6)) / 2e-6, s.val(), 1e-5); } });
  }
  if (kind === 3) {
    const t = rnd.int(1, 3);
    if (t === 1) { let a, b, x0; do { a = rnd.int(-4, 4); b = rnd.int(1, 9); x0 = rnd.int(-2, 2); } while (b * 4 <= a * a || x0 * x0 + a * x0 + b === 0 || 2 * x0 + a === 0);
      const den = x0 * x0 + a * x0 + b, v = F(2 * x0 + a, den);
      return mk('derivatives', L, `Let ${m(`f(x)=\\log(x^2${a === 0 ? '' : sgnTerm(a) + 'x'}${plusConst(b)})`)}. Then ${m(`f'(${x0})`)} equals`, valOpt(v), [valOpt(F(1, den)), valOpt(F(2 * x0, den)), valOpt(v.neg()), valOpt(F(2 * x0 + a))], `${m(r`f'(x)=\frac{2x${plusConst(a)}}{x^2${a === 0 ? '' : sgnTerm(a) + 'x'}${plusConst(b)}}`)}.`); }
    if (t === 2) { const a = rnd.pick([1, 2, 3]); const v = F(a);
      return mk('derivatives', L, `Let ${m(`f(x)=x^{${mono(a, 1)}}`)} for ${m('x>0')}. Then ${m("f'(1)")} equals`, valOpt(v), [valOpt(F(a * a)), valOpt(F(0)), valOpt(F(a + 1)), valOpt(F(a - 1))], `${m(`f(x)=e^{${mono(a, 1)}\\log x}`)}, so ${m(`f'(x)=x^{${mono(a, 1)}}(${a}\\log x+${a})`)} and ${m(`f'(1)=${a}`)}.`); }
    const a = rnd.pick([1, 2, 3]);
    return mk('derivatives', L, `Let ${m(`f(x)=x\\arctan(${mono(a, 1)})`)}. Then ${m(`f'\\left(${F(1, a).tex()}\\right)`)} equals`, opt(m(r`\frac{\pi}{4}+\frac{1}{2}`), Math.PI / 4 + 0.5), [opt(m(r`\frac{\pi}{4}`), Math.PI / 4), opt(m(r`\frac{\pi}{4}+${F(a, 2).tex()}`), Math.PI / 4 + a / 2), opt(m(r`\frac{1}{2}`), 0.5), opt(m(r`\frac{\pi}{2}+\frac{1}{2}`), Math.PI / 2 + 0.5)], `${m(`f'(x)=\\arctan(${mono(a, 1)})+\\frac{${mono(a, 1)}}{1+${a * a === 1 ? '' : a * a}x^2}`)}; at ${m(`x=${F(1, a).tex()}`)} this is ${m(r`\frac{\pi}{4}+\frac{1}{2}`)}.`);
  }
  if (kind === 4) {
    if (rnd.chance(0.6)) {
      const a = rnd.int(1, 4), b = rnd.int(-3, 3), x0 = rnd.pick([-1, 1, 2]); const y0 = x0 ** 3 + a * x0 + b; const d = 3 * x0 * x0 + a;
      const wrongD = 3 * y0 * y0 + a;
      return mk('derivatives', L, `The function ${m(`f(x)=x^3${a === 1 ? '+x' : '+' + a + 'x'}${plusConst(b)}`)} is invertible on ${m(r`\mathbb{R}`)}. Then ${m(`(f^{-1})'(${y0})`)} equals`, valOpt(F(1, d)), [valOpt(F(d)), valOpt(F(1, wrongD)), valOpt(F(-1, d)), valOpt(F(1, a))], `${m(`f(${x0})=${y0}`)}, so ${m(`(f^{-1})'(${y0})=\\frac{1}{f'(${x0})}=\\frac{1}{${d}}`)}.`);
    }
    const p = rnd.pick([2, 3, 4]), k = rnd.pick([3, 5]);
    return mk('derivatives', L, `The function ${m(`f(x)=e^{${p}x}+x^{${k}}`)} is invertible on ${m(r`\mathbb{R}`)}. Then ${m(`(f^{-1})'(1)`)} equals`, valOpt(F(1, p)), [valOpt(F(p)), valOpt(F(1, p + k)), valOpt(F(0)), valOpt(F(1, p * Math.E | 0 || 1))], `${m('f(0)=1')}, hence ${m(`(f^{-1})'(1)=\\frac{1}{f'(0)}=\\frac{1}{${p}}`)}.`);
  }
  if (kind === 5) {
    for (let t = 0; t < 40; t++) {
      const mm = rnd.int(1, 3); const e = mul(X(1, mm), A(rnd.pick(['exp', 'sin', 'cos', 'log1p', 'atan']), X(rnd.pick([1, 2, -1]))));
      const n = rnd.int(mm + 1, Math.min(7, mm + 4)); const c = e.ser[n]; if (c.isZero()) continue;
      const v = c.mul(new Fr(fact(n)));
      return mk('derivatives', L, `Let ${m('f(x)=' + e.tex)}. Then ${m(`f^{(${n})}(0)`)} equals`, valOpt(v), [valOpt(c), valOpt(v.neg()), valOpt(c.mul(new Fr(fact(n - 1)))), valOpt(v.mul(2))], `From the Maclaurin expansion, the coefficient of ${m(`x^{${n}}`)} is ${m(c.tex())} ${m(`=\\frac{f^{(${n})}(0)}{${n}!}`)}, so ${m(`f^{(${n})}(0)=${n}!\\cdot ${c.sgn() < 0 ? '\\left(' + c.tex() + '\\right)' : c.tex()}=${v.tex()}`)}.`);
    }
    throw new Error('nth');
  }
  const x0 = rnd.pick([2, 3, -2, -3]); const v = F(1, 1 + x0 * x0);
  const wrong = F((1 - x0) * (1 - x0), (1 - x0) * (1 - x0) + (1 + x0) * (1 + x0));
  return mk('derivatives', L, `Let ${m(r`f(x)=\arctan\frac{1+x}{1-x}`)}, ${m(r`x\neq 1`)}. Then ${m(`f'(${x0})`)} equals`, valOpt(v), [valOpt(wrong), valOpt(v.neg()), valOpt(F(2, (1 - x0) * (1 - x0))), valOpt(F(1, 2))], `By the chain rule ${m(r`f'(x)=\frac{1}{1+\left(\frac{1+x}{1-x}\right)^2}\cdot\frac{2}{(1-x)^2}=\frac{1}{1+x^2}`)}.`,
    { verify: () => { const f = x => Math.atan((1 + x) / (1 - x)); return near((f(x0 + 1e-6) - f(x0 - 1e-6)) / 2e-6, v.val(), 1e-5); } });
}

/* =====================================================================
   6. NON-DIFFERENTIABILITY POINTS
   ===================================================================== */
const ND = { corner: 'a corner (angular) point', cusp: 'a cusp', vert: 'a point with vertical tangent (inflection)', diff: 'a point where f is differentiable' };
function nondiff(L) {
  if (L >= 5 && rnd.chance(0.35)) return pieceParam(L);
  const a = rnd.int(-3, 3), b = a + rnd.nz(-3, 3), A2 = Math.abs(a) || 1;
  const xa = a === 0 ? 'x' : `x${plusConst(-a)}`;
  const T = [
    [1, 2, `|${xa}|`, a, 'corner', t => Math.abs(t - a)],
    [1, 2, r`\sqrt[3]{${xa}}`, a, 'vert', t => Math.cbrt(t - a)],
    [2, 3, r`\sqrt[3]{(${xa})^2}`, a, 'cusp', t => Math.cbrt((t - a) ** 2)],
    [3, 4, `e^{-|${xa}|}`, a, 'corner', t => Math.exp(-Math.abs(t - a))],
    [3, 4, r`\sqrt{|${xa}|}`, a, 'cusp', t => Math.sqrt(Math.abs(t - a))],
    [3, 4, `|x^2-${A2 * A2}|`, A2, 'corner', t => Math.abs(t * t - A2 * A2)],
    [3, 4, r`\log(1+|${xa}|)`, a, 'corner', t => Math.log1p(Math.abs(t - a))],
    [4, 5, `(${xa})\\,|${xa}|`, a, 'diff', t => (t - a) * Math.abs(t - a)],
    [4, 5, `|${xa}|^{3/2}`, a, 'diff', t => Math.abs(t - a) ** 1.5],
    [4, 5, r`\sqrt[3]{x^2-${A2 * A2}}`, A2, 'vert', t => Math.cbrt(t * t - A2 * A2)],
    [4, 5, r`(x${plusConst(-b)})\sqrt[3]{${xa}}`, a, 'vert', t => (t - b) * Math.cbrt(t - a)],
    [5, 6, r`\sqrt{|x^2-${A2 * A2}|}`, A2, 'cusp', t => Math.sqrt(Math.abs(t * t - A2 * A2))],
    [5, 6, r`(x${plusConst(-b)})\sqrt[3]{(${xa})^2}`, a, 'cusp', t => (t - b) * Math.cbrt((t - a) ** 2)],
    [5, 6, `|${xa}|\\sin(${xa})`, a, 'diff', t => Math.abs(t - a) * Math.sin(t - a)],
    [5, 6, `|${xa}|\\,(x${plusConst(-b)})`, a, 'corner', t => Math.abs(t - a) * (t - b)],
    [6, 6, `|${xa}|\\,(${xa})^2`, a, 'diff', t => Math.abs(t - a) * (t - a) ** 2],
    [6, 6, r`e^{\sqrt[3]{x}}`, 0, 'vert', t => Math.exp(Math.cbrt(t))],
    [6, 6, r`\sqrt{1-\cos x}`, 0, 'corner', t => Math.sqrt(1 - Math.cos(t))],
    [6, 6, `|x^3-${A2 ** 3}|`, A2, 'corner', t => Math.abs(t ** 3 - A2 ** 3)],
  ];
  let cands = T.filter(t => L >= t[0] && L <= t[1]); if (!cands.length) cands = T;
  const [, , f, x0, type, fn] = rnd.pick(cands);
  const SOL = {
    corner: 'The one-sided derivatives at ' + m('x_0') + ' exist, are finite and different: corner point.',
    cusp: 'The one-sided limits of ' + m("f'") + ' are infinite with opposite signs (' + m(r`\pm\infty`) + '): cusp.',
    vert: 'Both one-sided limits of ' + m("f'") + ' are infinite with the same sign: vertical tangent (inflection).',
    diff: 'The difference quotient has a finite limit at ' + m('x_0') + ' (the absolute value is multiplied by an infinitesimal factor), so ' + m('f') + ' is differentiable there.',
  };
  return mk('nondiff', L, `For ${m('f(x)=' + f)}, the point ${m('x_0=' + x0)} is`, ND[type], [], SOL[type], { fixed: [ND.corner, ND.cusp, ND.vert, ND.diff], verify: () => classify(fn, x0) === type });
}
function classify(fn, x0) {
  const q = h => (fn(x0 + h) - fn(x0)) / h;
  const r1 = q(1e-7), l1 = q(-1e-7), r2 = q(1e-9), l2 = q(-1e-9);
  const big = (u, v) => Math.abs(v) > 3 * Math.abs(u) && Math.abs(v) > 50;
  if (big(r1, r2) && big(l1, l2)) return Math.sign(r2) === Math.sign(l2) ? 'vert' : 'cusp';
  if (Math.abs(r1 - l1) < 1e-3 * Math.max(1, Math.abs(r1))) return 'diff';
  return 'corner';
}
function pieceParam(L) {
  const k = rnd.pick([1, 2, 3, -1, -2]); const kind = rnd.pick(['log', 'exp']);
  const b = 1 - 2 * k, c = 1 - k; const rhs = kind === 'log' ? r`\log x + c` : r`e^{x-1}+c`;
  const c2 = kind === 'log' ? c : c - 1; // e^{x-1}+c at 1 = 1 + c  => c = k + b - 1
  const f = r`f(x)=\begin{cases} ${mono(k, 2)}+bx & x\le 1\\ ${rhs} & x>1\end{cases}`;
  const st = (bb, cc) => opt(m(`b=${bb},\\ c=${cc}`), null, bb + '|' + cc);
  return mk('nondiff', L, `For which real values of ${m('b, c')} is the function ${m(f)} differentiable at ${m('x=1')}?`, st(b, c2), [st(c2, b), st(-b, c2), st(b, -c2), st(1 - k, c2), st(b, c2 + 1)], `Continuity at ${m(1)}: ${m(`${k}+b=${kind === 'log' ? 'c' : '1+c'}`)}. Equal one-sided derivatives: ${m(`${2 * k}+b=1`)}. Hence ${m(`b=${b}`)}, ${m(`c=${c2}`)}.`);
}

/* =====================================================================
   7. STUDY OF A FUNCTION: extrema, monotonicity, convexity, solutions, image
   ===================================================================== */
const ex = (x, kind) => `${m('x=' + x)} is a ${kind}`;
function studyQ(L, f, right, wrongs, sol, verify) { return mk('study', L, `Let ${m('f(x)=' + f)} (on its natural domain). Which statement is correct?`, right, wrongs, sol, { verify }); }
function study(L) {
  const kind = pickByLevel(L, [[1, 1, 'cubic'], [1, 2, 'cubicSol'], [2, 2, 'quartic'], [2, 3, 'xexp'], [3, 3, 'x2exp'], [3, 4, 'conv'], [4, 4, 'rat'], [4, 5, 'image'], [5, 5, 'xlog'], [5, 6, 'gauss'], [6, 6, 'abs'], [6, 6, 'xe1x']]);
  if (kind === 'cubic') {
    const p = rnd.int(1, 3), c = rnd.int(-4, 4); const f = `x^3-${3 * p * p}x${plusConst(c)}`;
    return studyQ(L, f, `${m(`f`)} is increasing on ${m(iv(MINF, -p, false, true))} and on ${m(iv(p, INF, true, false))}, decreasing on ${m(iv(-p, p, true, true))}`,
      [`${m('f')} is decreasing on ${m(iv(MINF, -p, false, true))} and on ${m(iv(p, INF, true, false))}, increasing on ${m(iv(-p, p, true, true))}`, `${m('f')} is increasing on ${m(r`\mathbb{R}`)}`, `${ex(-p, 'global maximum point')}`, `${ex(p, 'local maximum point')}`],
      `${m(`f'(x)=3x^2-${3 * p * p}=3(x-${p})(x+${p})`)} is positive for ${m(`|x|>${p}`)} and negative for ${m(`|x|<${p}`)}.`);
  }
  if (kind === 'cubicSol') {
    const p = rnd.int(1, 3); const M = 2 * p * p * p;
    const st = s => `the equation ${m('f(x)=k')} has three distinct real solutions if and only if ${m(s)}`;
    return studyQ(L, `x^3-${3 * p * p}x`, st(`|k|<${M}`), [st(`|k|\\le ${M}`), st(`|k|>${M}`), st(`|k|<${p * p * p}`), st(`0<k<${M}`)], `Local max ${m(`f(-${p})=${M}`)}, local min ${m(`f(${p})=-${M}`)}, and ${m(r`f\to\pm\infty`)} at ${m(r`\pm\infty`)}: a horizontal line meets the graph three times exactly when it lies strictly between the two extreme values.`);
  }
  if (kind === 'quartic') {
    const p = rnd.int(1, 3), c = rnd.int(-3, 3); const f = `x^4-${2 * p * p}x^2${plusConst(c)}`;
    return studyQ(L, f, `${m(`x=\\pm ${p}`)} are global minimum points and ${m('x=0')} is a local, non-global maximum point`,
      [`${m('x=0')} is a global maximum point`, `${m(`x=\\pm ${p}`)} are local maximum points`, `${m('x=0')} is a global minimum point`, `${m('f')} has no global minimum`],
      `${m(`f'(x)=4x(x^2-${p * p})`)}: ${m('f')} decreases on ${m(iv(MINF, -p, false, true))}, increases on ${m(iv(-p, 0, true, true))}, decreases on ${m(iv(0, p, true, true))}, increases on ${m(iv(p, INF, true, false))}. Since ${m(r`f\to+\infty`)}, the maximum at ${m(0)} is not global.`);
  }
  if (kind === 'xexp') {
    const q = rnd.int(1, 4); const f = q === 1 ? 'x\\,e^{-x}' : `x\\,e^{-x/${q}}`;
    const im = x => `the image of ${m('f')} is ${m(x)}`;
    const top = q === 1 ? r`\frac{1}{e}` : r`\frac{${q}}{e}`;
    return studyQ(L, f, im(iv(MINF, top, false, true)), [im(iv(MINF, top, false, false)), im(iv(0, top, true, true)), im(r`\mathbb{R}`), im(iv(MINF, String(q), false, true))],
      `${m(`f'(x)=e^{-x/${q}}\\left(1-\\frac{x}{${q}}\\right)`)}: global maximum at ${m('x=' + q)} with value ${m(top)}; ${m(r`f\to-\infty`)} as ${m(r`x\to-\infty`)} and ${m(r`f\to 0`)} as ${m(r`x\to+\infty`)}.`);
  }
  if (kind === 'x2exp') {
    const q = rnd.int(1, 3), cube = rnd.chance(0.4); const pw = cube ? 3 : 2;
    const f = q === 1 ? `x^{${pw}}e^{-x}` : `x^{${pw}}e^{-x/${q}}`; const c = pw * q;
    if (!cube) return studyQ(L, f, `${ex(0, 'global minimum point')} and ${ex(c, 'local, non-global maximum point')}`,
      [`${ex(c, 'global maximum point')}`, `${ex(q, 'local maximum point')}`, `${ex(0, 'local maximum point')}`, `${m('f')} has no extremum points`],
      `${m(`f'(x)=x\\,e^{-x/${q}}\\left(2-\\frac{x}{${q}}\\right)`)}. ${m('f\\ge 0=f(0)')}; the maximum at ${m(c)} is not global because ${m(r`f\to+\infty`)} as ${m(r`x\to-\infty`)}.`);
    return studyQ(L, f, `${ex(c, 'global maximum point')} and ${m('x=0')} is not an extremum point`,
      [`${ex(0, 'local minimum point')}`, `${ex(c, 'local, non-global maximum point')}`, `${m('f')} has no global maximum`, `${ex(q, 'global maximum point')}`],
      `${m(`f'(x)=x^2e^{-x/${q}}\\left(3-\\frac{x}{${q}}\\right)`)} does not change sign at ${m(0)}; ${m(r`f\to-\infty`)} as ${m(r`x\to-\infty`)} and ${m(r`f\to 0`)} as ${m(r`x\to+\infty`)}, so the maximum at ${m(c)} is global.`);
  }
  if (kind === 'conv') {
    const t = rnd.int(1, 3);
    if (t === 1) { const a = rnd.int(1, 3); const f = a === 1 ? r`\log(1+x^2)` : `\\log(${a * a}+x^2)`;
      const cv = s => `${m('f')} is convex exactly on ${m(s)}`;
      return studyQ(L, f, cv(iv(-a, a, true, true)), [cv(iv(MINF, -a, false, true) + r`\cup` + iv(a, INF, true, false)), cv(r`\mathbb{R}`), cv(iv(0, INF, true, false)), cv(iv(-a * a, a * a, true, true))], `${m(`f''(x)=\\frac{2(${a * a}-x^2)}{(${a * a}+x^2)^2}`)}, which is ${m(r`\ge 0`)} iff ${m(`|x|\\le ${a}`)}.`); }
    if (t === 2) { const q = rnd.int(1, 3); const f = q === 1 ? 'x\\,e^{-x}' : `x\\,e^{-x/${q}}`;
      const fl = s => `${m('f')} has a unique inflection point, at ${m('x=' + s)}`;
      return studyQ(L, f, fl(2 * q), [fl(q), fl(0), fl(3 * q), `${m('f')} is convex on ${m(r`\mathbb{R}`)}`], `${m(`f''(x)=\\frac{1}{${q * q}}e^{-x/${q}}(x-${2 * q})`)} changes sign only at ${m(2 * q)}.`); }
    const p = rnd.int(1, 3); const f = `x^4-${6 * p * p}x^2`;
    const fl = s => `the inflection points of ${m('f')} are ${m(s)}`;
    return studyQ(L, f, fl(`x=\\pm ${p}`), [fl(`x=\\pm ${p}\\sqrt{3}`), fl('x=0'), fl(`x=\\pm ${p * p}`), `${m('f')} is convex on ${m(r`\mathbb{R}`)}`], `${m(`f''(x)=12x^2-${12 * p * p}`)} vanishes and changes sign at ${m(`\\pm ${p}`)}.`);
  }
  if (kind === 'rat') {
    let b, s; do { b = rnd.pick([1, 2, 3, -1, -2]); s = rnd.int(1, 3); } while (s === Math.abs(b) && false);
    const a = s * s - b * b; const f = r`\frac{x^2${plusConst(a)}}{x${plusConst(-b)}}`;
    const lo = b - s, hi = b + s;
    const st = (mx, mn, g) => `${m('f')} has a local maximum at ${m('x=' + mx)} and a local minimum at ${m('x=' + mn)}${g ? ', both global' : ', neither of them global'}`;
    return studyQ(L, f, st(lo, hi, false), [st(hi, lo, false), st(lo, hi, true), st(-hi, -lo, false), `${m('f')} is increasing on its whole domain`],
      `${m(r`f'(x)=\frac{x^2${b === 0 ? '' : sgnTerm(-2 * b) + 'x'}${plusConst(-a)}}{(x${plusConst(-b)})^2}`)} vanishes at ${m(`x=${b}\\pm ${s}`)}; it is positive outside and negative between them (vertical asymptote ${m('x=' + b)}). Since ${m(r`f\to\pm\infty`)}, no extremum is global.`,
      () => { const fx = x => (x * x + a) / (x - b); const d = x => (fx(x + 1e-6) - fx(x - 1e-6)) / 2e-6; return Math.abs(d(lo)) < 1e-4 && Math.abs(d(hi)) < 1e-4 && fx(lo - 0.1) < fx(lo) && fx(hi + 0.1) > fx(hi); });
  }
  if (kind === 'image') {
    const t = rnd.int(1, 3); const a = rnd.int(1, 4);
    const im = x => `the image of ${m('f')} is ${m(x)}`;
    if (t === 1) { const f = `\\frac{x}{x^2+${a * a}}`; const v = F(1, 2 * a).tex();
      return studyQ(L, f, im(iv('-' + v, v, true, true)), [im(iv('-' + v, v, false, false)), im(iv(F(-1, a).tex(), F(1, a).tex(), true, true)), im(iv(0, v, true, true)), im(r`\mathbb{R}`)], `${m('f')} is odd, ${m(r`f\to 0`)} at ${m(r`\pm\infty`)} and has global max/min at ${m(`x=\\pm ${a}`)} with values ${m(r`\pm` + v)}.`); }
    if (t === 2) { const f = `\\frac{x^2-${a * a}}{x^2+${a * a}}`;
      return studyQ(L, f, im(iv(-1, 1, true, false)), [im(iv(-1, 1, true, true)), im(iv(-1, 1, false, false)), im(iv(0, 1, true, false)), im(iv(-a * a, 1, true, false))], `${m(`f(x)=1-\\frac{${2 * a * a}}{x^2+${a * a}}`)}: minimum ${m(-1)} at ${m(0)}, and ${m(r`f\to 1`)} without reaching it.`); }
    const f = a === 1 ? r`\frac{\log x}{x}` : `\\frac{\\log x}{x^{${a}}}`; const top = a === 1 ? r`\frac{1}{e}` : r`\frac{1}{${a}e}`;
    return studyQ(L, f, im(iv(MINF, top, false, true)), [im(iv(MINF, top, false, false)), im(iv(0, top, true, true)), im(iv(MINF, '1', false, true)), im(r`\mathbb{R}`)], `${m(`f'(x)=\\frac{1-${a === 1 ? '' : a}\\log x}{x^{${a + 1}}}`)}: global max at ${m(a === 1 ? 'x=e' : `x=e^{1/${a}}`)} with value ${m(top)}; ${m(r`f\to-\infty`)} as ${m(r`x\to 0^+`)}.`);
  }
  if (kind === 'xlog') {
    const a = rnd.pick([1, 2]); const f = a === 1 ? r`x\log^2 x` : r`x^2\log^2 x`; const crit = a === 1 ? 'e^{-2}' : 'e^{-1}';
    return studyQ(L, f, `${ex(1, 'global minimum point')} and ${ex(crit, 'local, non-global maximum point')}`,
      [`${ex(crit, 'global maximum point')}`, `${ex(1, 'local maximum point')}`, `${ex(a === 1 ? 'e^{-1}' : 'e^{-2}', 'local maximum point')}`, `${m('f')} has no minimum`],
      `${m(`f'(x)=${a === 1 ? '' : 'x\\,'}\\log x\\,(${a === 1 ? '' : a}\\log x+2)`)}: increasing on ${m(iv(0, crit, false, true))}, decreasing on ${m(iv(crit, 1, true, true))}, increasing on ${m(iv(1, INF, true, false))}; ${m('f\\ge 0=f(1)')} and ${m(r`f\to+\infty`)}.`);
  }
  if (kind === 'gauss') {
    let a = rnd.int(-3, 1), b = a + rnd.int(2, 4); const d = b - a; const mid = F(a + b, 2).tex(); const low = `e^{-${F(d * d, 4).tex()}}`;
    const f = `e^{-|(${a === 0 ? 'x' : 'x' + plusConst(-a)})(x${plusConst(-b)})|}`;
    const st = s => `the equation ${m('f(x)=k')} has exactly four solutions if and only if ${m(s)}`;
    return studyQ(L, f, st(`${low}<k<1`), [st(`0<k<${low}`), st(`${low}\\le k<1`), st(`0<k<1`), st(`${low}<k\\le 1`)], `${m('f')} has global maxima ${m(1)} at ${m(`x=${a}`)} and ${m(`x=${b}`)} (corner points), a local minimum ${m(low)} at ${m('x=' + mid)}, and tends to ${m(0)} at ${m(r`\pm\infty`)}.`);
  }
  if (kind === 'abs') {
    const p = rnd.int(1, 2); const f = `|x^3-${3 * p * p}x|`;
    return studyQ(L, f, `${m(`x=0,\\ \\pm ${p}\\sqrt{3}`)} are global minimum points and ${m(`x=\\pm ${p}`)} are local, non-global maximum points`,
      [`${m(`x=\\pm ${p}`)} are global maximum points`, `${m('x=0')} is a local maximum point`, `${m('f')} has exactly two global minimum points`, `${m(`x=\\pm ${p}\\sqrt{3}`)} are local maximum points`],
      `${m('f\\ge 0')} vanishes where ${m(`x^3-${3 * p * p}x=0`)}; ${m(`|g|`)} with ${m(`g=x^3-${3 * p * p}x`)} has local maxima where ${m("g'=0")}, i.e. ${m(`x=\\pm ${p}`)}, with value ${m(2 * p ** 3)}; ${m(r`f\to+\infty`)}.`);
  }
  const a = rnd.int(1, 3); const f = a === 1 ? 'x\\,e^{1/x}' : `x\\,e^{${a}/x}`;
  return studyQ(L, f, `${ex(a, 'local, non-global minimum point')} and ${m(`y=x+${a}`)} is an oblique asymptote`,
    [`${ex(a, 'global minimum point')} and ${m(`y=x+${a}`)} is an oblique asymptote`, `${ex(a, 'local minimum point')} and ${m('y=x')} is an oblique asymptote`, `${ex(-a, 'local maximum point')}`, `${m('f')} has no extremum points`],
    `${m(`f'(x)=e^{${a}/x}\\left(1-\\frac{${a}}{x}\\right)`)}; ${m(`f(x)=x+${a}+o(1)`)} at ${m(r`\pm\infty`)}; on ${m(iv(MINF, 0, false, false))} the function is negative, so the minimum ${m(`f(${a})=${a === 1 ? '' : a}e`)} is not global.`);
}

/* =====================================================================
   8. PRIMITIVES, DEFINITE INTEGRALS, INTEGRAL MEAN
   ===================================================================== */
const E = Math.E, PI = Math.PI, LN = Math.log;
function intQ(L, tex, a, b, ans, wr, sol, fn, aTex, bTex, tol = 1e-6) {
  return mk('integrals', L, 'Compute ' + m(r`\displaystyle\int_{${aTex ?? a}}^{${bTex ?? b}} ${tex}\,dx`), ans, wr, sol, { verify: () => near(simpson(fn, a, b, 20000), ans.v, tol) });
}
function integral(L) {
  const kind = pickByLevel(L, [[1, 1, 'poly'], [1, 2, 'logn'], [1, 3, 'prim'], [2, 2, 'xexp2'], [2, 3, 'mean'], [2, 2, 'sincos'], [3, 3, 'xeax'], [3, 4, 'xnlog'], [4, 4, 'partial'], [4, 4, 'atan'], [4, 5, 'xc'], [5, 5, 'absq'], [5, 6, 'sqrt'], [6, 6, 'expsin'], [6, 6, 'odd']]);
  if (kind === 'poly') {
    const p = rnd.nz(-3, 3) * 3, q = rnd.int(-4, 4) * 2, c = rnd.int(-3, 3), M = rnd.int(1, 3);
    const v = F(p * M ** 3, 3).add(F(q * M * M, 2)).add(c * M); const fn = x => p * x * x + q * x + c;
    return intQ(L, '(' + polyTex([c, q, p]) + ')', 0, M, valOpt(v), [valOpt(F(p * M ** 3).add(q * M * M).add(c * M)), valOpt(F(2 * p * M + q)), valOpt(v.neg()), valOpt(v.add(c))], `A primitive is ${m(polyTex([0, c, F(q, 2), F(p, 3)]))}; evaluate it at ${m(M)} and ${m(0)}.`, fn);
  }
  if (kind === 'logn') {
    const n = rnd.int(1, 4);
    return intQ(L, r`\frac{\log^{${n}} x}{x}`, 1, E, valOpt(F(1, n + 1)), [valOpt(F(1, n)), valOpt(F(n + 1)), valOpt(F(n, n + 1)), valOpt(F(1))], `${m(`t=\\log x`)}: ${m(`\\int_0^1 t^{${n}}dt=\\frac{1}{${n + 1}}`)}.`, x => Math.log(x) ** n / x, 1, 'e');
  }
  if (kind === 'prim') {
    const t = rnd.int(1, 4); const a = rnd.int(1, 3);
    let f, right, wr, sol;
    if (t === 1) { f = `x\\,e^{${a === 1 ? '' : a}x^2}`; right = `\\frac{e^{${a === 1 ? '' : a}x^2}}{${2 * a}}`; wr = [`e^{${a === 1 ? '' : a}x^2}`, `\\frac{x^2}{2}e^{${a === 1 ? '' : a}x^2}`, `${2 * a}x\\,e^{${a === 1 ? '' : a}x^2}`]; sol = `Derive ${m(right)}: you get back ${m(f)}.`; }
    else if (t === 2) { f = r`\log x`; right = r`x\log x - x`; wr = [r`\frac{1}{x}`, r`x\log x`, r`\frac{\log^2 x}{2}`]; sol = `By parts: ${m(r`\int \log x\,dx = x\log x-\int 1\,dx`)}.`; }
    else if (t === 3) { f = `\\frac{1}{x^2+${a * a}}`; right = a === 1 ? r`\arctan x` : `\\frac{1}{${a}}\\arctan\\frac{x}{${a}}`; wr = a === 1 ? [r`\arctan(x^2)`, r`\frac{1}{2x}\log(x^2+1)`, r`\log(x^2+1)`, r`\frac{x}{x^2+1}`] : [`\\arctan\\frac{x}{${a}}`, `\\frac{1}{2x}\\log(x^2+${a * a})`, `${a}\\arctan(${a}x)`, `\\frac{1}{${a * a}}\\arctan x`]; sol = `${m(r`\frac{d}{dx}\arctan\frac{x}{a}=\frac{a}{x^2+a^2}`)}.`; }
    else { f = r`x\cos x`; right = r`x\sin x+\cos x`; wr = [r`x\sin x-\cos x`, r`\frac{x^2}{2}\sin x`, r`-x\sin x+\cos x`]; sol = `By parts: ${m(r`\int x\cos x\,dx=x\sin x-\int\sin x\,dx`)}.`; }
    return mk('integrals', L, `A primitive of ${m('f(x)=' + f)} is`, m(right), wr.map(m), sol);
  }
  if (kind === 'xexp2') {
    const a = rnd.pick([1, 2, 3, -1]); const ea = a === 1 ? 'e' : `e^{${a}}`; const v = (Math.exp(a) - 1) / (2 * a);
    const d = a < 0 ? `-${2 * -a}` : 2 * a;
    return intQ(L, `x\\,e^{${a === 1 ? '' : a === -1 ? '-' : a}x^2}`, 0, 1, opt(m(`\\frac{${ea}-1}{${d}}`), v), [opt(m(`\\frac{${ea}-1}{${a}}`), (Math.exp(a) - 1) / a), opt(m(`\\frac{${ea}-1}{2}`), (Math.exp(a) - 1) / 2), opt(m(`\\frac{${ea}}{${d}}`), Math.exp(a) / (2 * a)), opt(m(`${ea}-1`), Math.exp(a) - 1)], `${m(`\\frac{d}{dx}e^{${a}x^2}=${2 * a}x\\,e^{${a}x^2}`)}.`, x => x * Math.exp(a * x * x));
  }
  if (kind === 'sincos') {
    const n = rnd.int(1, 5);
    return intQ(L, `\\sin x\\cos^{${n}}x`, 0, PI / 2, valOpt(F(1, n + 1)), [valOpt(F(1, n)), valOpt(F(-1, n + 1)), valOpt(F(1, n + 2)), valOpt(F(n, n + 1))], `${m(r`-\frac{\cos^{${n + 1}}x}{${n + 1}}`)} is a primitive.`, x => Math.sin(x) * Math.cos(x) ** n, 0, r`\frac{\pi}{2}`);
  }
  if (kind === 'mean') {
    const t = rnd.int(1, 3);
    if (t === 1) { const M = rnd.int(1, 4); const v = F(M * M, 3);
      return mk('integrals', L, `The integral mean of ${m('f(x)=x^2')} on ${m(iv(0, M, true, true))} is`, valOpt(v), [valOpt(F(M ** 3, 3)), valOpt(F(M * M, 2)), valOpt(F(M, 3)), valOpt(F(M * M))], `${m(r`\frac{1}{${M}}\int_0^{${M}}x^2dx=\frac{1}{${M}}\cdot\frac{${M ** 3}}{3}`)}.`); }
    if (t === 2) return mk('integrals', L, `The integral mean of ${m(r`f(x)=\sin x`)} on ${m(iv(0, r`\pi`, true, true))} is`, opt(m(r`\frac{2}{\pi}`), 2 / PI), [opt(m('2'), 2), opt(m('0'), 0), opt(m(r`\frac{1}{\pi}`), 1 / PI), opt(m(r`\frac{\pi}{2}`), PI / 2)], `${m(r`\frac{1}{\pi}\int_0^\pi \sin x\,dx=\frac{2}{\pi}`)}.`);
    const k = rnd.int(2, 5);
    return mk('integrals', L, `The integral mean of ${m('f(x)=e^x')} on ${m(iv(0, r`\log ${k}`, true, true))} is`, opt(m(r`\frac{${k - 1}}{\log ${k}}`), (k - 1) / LN(k)), [opt(m(`${k - 1}`), k - 1), opt(m(r`\frac{${k}}{\log ${k}}`), k / LN(k)), opt(m(r`\frac{\log ${k}}{${k - 1}}`), LN(k) / (k - 1)), opt(m(r`\frac{${k + 1}}{2}`), (k + 1) / 2)], `${m(r`\frac{1}{\log ${k}}\int_0^{\log ${k}}e^x dx=\frac{${k}-1}{\log ${k}}`)}.`);
  }
  if (kind === 'xeax') {
    const a = rnd.int(1, 3); const v = ((a - 1) * Math.exp(a) + 1) / (a * a); const ea = a === 1 ? 'e' : `e^{${a}}`;
    const T = (s, val) => opt(m(s), val);
    const fr = (num, den) => (den === 1 ? num : `\\frac{${num}}{${den}}`); const co = k => (k === 1 ? '' : k); const ax = `e^{${co(a)}x}`;
    const right = a === 1 ? T('1', 1) : T(fr(`${co(a - 1)}${ea}+1`, a * a), v);
    return intQ(L, `x\\,${ax}`, 0, 1, right, [T(fr(`${co(a)}${ea}-1`, a * a), (a * Math.exp(a) - 1) / (a * a)), T(fr(`${a + 1}${ea}-1`, a * a), ((a + 1) * Math.exp(a) - 1) / (a * a)), T(fr(ea, a), Math.exp(a) / a), T(fr(`${ea}-1`, a * a), (Math.exp(a) - 1) / (a * a)), T(fr(`${ea}+1`, a * a), (Math.exp(a) + 1) / (a * a))], `By parts: ${m(`\\int x\\,${ax}\\,dx=${fr('x\\,' + ax, a)}-${fr(ax, a * a)}`)}, evaluated between ${m(0)} and ${m(1)}.`, x => x * Math.exp(a * x));
  }
  if (kind === 'xnlog') {
    const n = rnd.int(1, 3); const e1 = `e^{${n + 1}}`; const v = (n * Math.exp(n + 1) + 1) / (n + 1) ** 2;
    const T = (s, val) => opt(m(s), val);
    return intQ(L, `x^{${n}}\\log x`, 1, E, T(`\\frac{${n === 1 ? '' : n}${e1}+1}{${(n + 1) ** 2}}`, v), [T(`\\frac{${n === 1 ? '' : n}${e1}-1}{${(n + 1) ** 2}}`, (n * Math.exp(n + 1) - 1) / (n + 1) ** 2), T(`\\frac{${e1}}{${n + 1}}`, Math.exp(n + 1) / (n + 1)), T(`\\frac{${n + 1}${e1}+1}{${(n + 1) ** 2}}`, ((n + 1) * Math.exp(n + 1) + 1) / (n + 1) ** 2), T(`\\frac{${e1}+1}{${n + 1}}`, (Math.exp(n + 1) + 1) / (n + 1))], `By parts: ${m(`\\int x^{${n}}\\log x\\,dx=\\frac{x^{${n + 1}}}{${n + 1}}\\log x-\\frac{x^{${n + 1}}}{${(n + 1) ** 2}}`)}.`, x => x ** n * Math.log(x), 1, 'e');
  }
  if (kind === 'partial') {
    const p = rnd.int(1, 3), q = p + rnd.int(1, 3); const arg = F(q * (1 + p), p * (1 + q)); const c = F(1, q - p);
    const v = c.val() * LN(arg.val()); const ct = c.eq(1) ? '' : c.tex();
    const T = (cc, aa) => opt(m(`${cc}\\log ${aa.tex()}`), null, cc + '|' + aa.tex());
    const right = opt(m(`${ct}\\log ${arg.tex()}`), v);
    return intQ(L, r`\frac{1}{(x+${p})(x+${q})}`, 0, 1, right, [opt(m(`${ct}\\log ${arg.inv().tex()}`), -v), opt(m(`\\log ${arg.tex()}`), LN(arg.val())), opt(m(`${ct}\\log ${F(1 + q, 1 + p).tex()}`), c.val() * LN((1 + q) / (1 + p))), opt(m(`${F(1, q + p).tex()}\\log ${arg.tex()}`), LN(arg.val()) / (q + p))], `${m(r`\frac{1}{(x+${p})(x+${q})}=${c.tex()}\left(\frac{1}{x+${p}}-\frac{1}{x+${q}}\right)`)}, so the integral is ${m(r`${ct}\left[\log\frac{x+${p}}{x+${q}}\right]_0^1`)}.`, x => 1 / ((x + p) * (x + q)));
  }
  if (kind === 'atan') {
    const a = rnd.int(1, 4);
    const T = (s, val) => opt(m(s), val);
    return intQ(L, `\\frac{1}{x^2+${a * a}}`, 0, a, T(a === 1 ? r`\frac{\pi}{4}` : `\\frac{\\pi}{${4 * a}}`, PI / (4 * a)), [T(r`\frac{\pi}{4}`, PI / 4), T(`\\frac{\\pi}{${2 * a}}`, PI / (2 * a)), T(`\\frac{\\pi}{${4 * a * a}}`, PI / (4 * a * a)), T(r`\frac{\pi}{2}`, PI / 2)], `${m(`\\frac{1}{${a}}\\arctan\\frac{x}{${a}}`)} is a primitive and ${m(r`\arctan 1=\frac{\pi}{4}`)}.`, x => 1 / (x * x + a * a));
  }
  if (kind === 'xc') {
    const c = rnd.nz(-3, 3); const v = 0.5 * LN(2) + c * PI / 4; const T = (s, val) => opt(m(s), val);
    const J = (A, p) => A + (p.startsWith('-') ? '' : '+') + p;
    return intQ(L, `\\frac{x${plusConst(c)}}{x^2+1}`, 0, 1, T(J(r`\frac{1}{2}\log 2`, piTex(c, 4)), v), [T(J(r`\log 2`, piTex(c, 4)), LN(2) + c * PI / 4), T(J(r`\frac{1}{2}\log 2`, piTex(c, 2)), 0.5 * LN(2) + c * PI / 2), T(piTex(c, 4), c * PI / 4), T(r`\frac{1}{2}\log 2`, 0.5 * LN(2)), T(J(r`\frac{1}{2}\log 2`, piTex(-c, 4)), 0.5 * LN(2) - c * PI / 4)], `Split: ${m(r`\frac{x}{x^2+1}`)} has primitive ${m(r`\frac{1}{2}\log(x^2+1)`)}, and ${m(r`\frac{1}{x^2+1}`)} has primitive ${m(r`\arctan x`)}.`, x => (x + c) / (x * x + 1));
  }
  if (kind === 'absq') {
    const p = rnd.int(1, 2), q = p + rnd.int(1, 2); const v = F(q ** 3, 3).sub(p * p * q).add(F(4 * p ** 3, 3));
    return intQ(L, `|x^2-${p * p}|`, 0, q, valOpt(v), [valOpt(F(q ** 3, 3).sub(p * p * q)), valOpt(F(q ** 3, 3).sub(p * p * q).add(F(2 * p ** 3, 3))), valOpt(v.add(F(2 * p ** 3, 3))), valOpt(F(q ** 3, 3))], `Split at ${m('x=' + p)}: ${m(`\\int_0^{${p}}(${p * p}-x^2)dx+\\int_{${p}}^{${q}}(x^2-${p * p})dx`)}.`, x => Math.abs(x * x - p * p));
  }
  if (kind === 'sqrt') {
    const p = rnd.int(1, 4); const v = 2 * p - 2 * LN(1 + p); const T = (s, val) => opt(m(s), val);
    return intQ(L, r`\frac{1}{1+\sqrt{x}}`, 0, p * p, T(`${2 * p}-2\\log ${1 + p}`, v), [T(`${2 * p}+2\\log ${1 + p}`, 2 * p + 2 * LN(1 + p)), T(`${p}-\\log ${1 + p}`, p - LN(1 + p)), T(`2\\log ${1 + p}`, 2 * LN(1 + p)), T(`${2 * p}-\\log ${1 + p}`, 2 * p - LN(1 + p))], `Substitute ${m(r`x=t^2`)}, ${m('dx=2t\\,dt')}: ${m(r`\int_0^{${p}}\frac{2t}{1+t}dt=\left[2t-2\log(1+t)\right]_0^{${p}}`)}.`, x => 1 / (1 + Math.sqrt(x)), undefined, undefined, 1e-3);
  }
  if (kind === 'expsin') {
    const a = rnd.int(1, 3); const ea = `e^{${a === 1 ? '' : a}\\pi}`; const T = (s, val) => opt(m(s), val);
    return intQ(L, `e^{${a === 1 ? '' : a}x}\\sin x`, 0, PI, T(`\\frac{${ea}+1}{${a * a + 1}}`, (Math.exp(a * PI) + 1) / (a * a + 1)), [T(`\\frac{${ea}-1}{${a * a + 1}}`, (Math.exp(a * PI) - 1) / (a * a + 1)), T(`\\frac{${ea}+1}{${a}}`, (Math.exp(a * PI) + 1) / a), T(`\\frac{${a === 1 ? '' : a}${ea}+1}{${a * a + 1}}`, (a * Math.exp(a * PI) + 1) / (a * a + 1)), T(`${ea}+1`, Math.exp(a * PI) + 1)], `Integrating by parts twice: ${m(`\\int e^{${a}x}\\sin x\\,dx=\\frac{e^{${a}x}(${a}\\sin x-\\cos x)}{${a * a + 1}}`)}.`, x => Math.exp(a * x) * Math.sin(x), 0, r`\pi`);
  }
  const a = rnd.int(1, 3), b = rnd.nz(-4, 4); const fn = x => x ** 3 * Math.exp(x * x) + b;
  return intQ(L, `\\left(x^3e^{x^2}${plusConst(b)}\\right)`, -a, a, valOpt(F(2 * a * b)), [valOpt(F(0)), valOpt(F(a * b)), valOpt(F(4 * a * b)), valOpt(F(-2 * a * b))], `${m('x^3e^{x^2}')} is odd, so its integral over the symmetric interval vanishes; ${m(`\\int_{-${a}}^{${a}}${b}\\,dx=${2 * a * b}`)}.`, fn);
}

/* =====================================================================
   9. IMPROPER INTEGRALS
   ===================================================================== */
function improper(L) {
  const kind = pickByLevel(L, [[1, 2, 'pow'], [2, 4, 'zero'], [3, 4, 'inf'], [3, 4, 'val'], [5, 6, 'both'], [6, 6, 'zero']]);
  const al = s => opt(m(s), null, s);
  if (kind === 'pow') {
    if (rnd.chance(0.5)) { const p = rnd.int(2, 5);
      return mk('improper', L, 'Compute ' + m(r`\displaystyle\int_1^{+\infty}\frac{dx}{x^{${p}}}`), valOpt(F(1, p - 1)), [valOpt(F(1, p)), opt(m(INF), Infinity), valOpt(F(1, p + 1)), valOpt(F(p - 1))], `${m(r`\int_1^{c}x^{-${p}}dx=\frac{1-c^{-${p - 1}}}{${p - 1}}\to\frac{1}{${p - 1}}`)}.`); }
    const zero = rnd.chance(0.5);
    return mk('improper', L, `The integral ${m(zero ? r`\displaystyle\int_0^1\frac{dx}{x^{\alpha}}` : r`\displaystyle\int_1^{+\infty}\frac{dx}{x^{\alpha}}`)} converges if and only if`, al(zero ? r`\alpha<1` : r`\alpha>1`), [al(zero ? r`\alpha\le 1` : r`\alpha\ge 1`), al(zero ? r`\alpha>1` : r`\alpha<1`), al(r`\alpha>0`), al(zero ? r`\alpha<2` : r`\alpha>2`)], `Standard comparison integrals: near ${m(0)} you need ${m(r`\alpha<1`)}, near ${m(r`+\infty`)} you need ${m(r`\alpha>1`)}.`);
  }
  if (kind === 'zero') {
    let N;
    for (let t = 0; t < 30; t++) { N = L >= 5 ? cancelPair(L >= 6) : (rnd.chance(0.5) ? block1(rnd.pick(FIRST), rnd.pick([1, 2, 3])) : minusHead(A(rnd.pick(['exp', 'cos', 'sin', 'log1p']), X(1)), 1)); const k = sOrder(N.ser); if (k >= 1 && k <= 4) break; }
    const k = sOrder(N.ser); const th = k + 1;
    const nt = N.sum ? '(' + N.tex + ')' : N.tex;
    return mk('improper', L, `The integral ${m(r`\displaystyle\int_0^1\frac{${N.tex}}{x^{\alpha}}\,dx`)} converges if and only if`, al(r`\alpha<${th}`), [al(r`\alpha\le ${th}`), al(r`\alpha<${k}`), al(r`\alpha>${th}`), al(r`\alpha<${th + 1}`), al(r`\alpha>${k}`)], `As ${m(r`x\to 0^+`)}, ${m(r`${nt}\sim ${mono(N.ser[k], k)}`)}, so the integrand behaves like ${m(r`\frac{1}{x^{\alpha-${k}}}`)}: it converges iff ${m(r`\alpha-${k}<1`)}.`);
  }
  if (kind === 'inf') {
    const T = [[r`\arctan x`, 0], [r`\sqrt{x^2+1}-x`, -1], [r`\frac{x^2+1}{x+3}`, 1], [r`\log\left(1+\frac{1}{x^2}\right)`, -2], [r`e^{1/x}-1`, -1], [r`x\sin\frac{1}{x}`, 0], [r`\frac{x^3+x}{x+1}`, 2]];
    const [g, mm] = rnd.pick(T); const th = mm + 1;
    return mk('improper', L, `The integral ${m(r`\displaystyle\int_1^{+\infty}\frac{${g}}{x^{\alpha}}\,dx`)} converges if and only if`, al(r`\alpha>${th}`), [al(r`\alpha\ge ${th}`), al(r`\alpha<${th}`), al(r`\alpha>${th + 1}`), al(r`\alpha>${th - 1}`)], `As ${m(r`x\to+\infty`)} the numerator behaves like ${m(mm === 0 ? 'c' : mm === 1 ? 'x' : mm === -1 ? r`\frac{c}{x}` : `x^{${mm}}`)} (with ${m(r`c\neq 0`)} constant), so the integrand is comparable to ${m(r`\frac{1}{x^{\alpha${mm === 0 ? '' : sgnTerm(-mm)}}}`)}.`);
  }
  if (kind === 'val') {
    const a = rnd.int(1, 4); const t = rnd.int(1, 3); const T = (s, val) => opt(m(s), val);
    if (t === 1) return mk('improper', L, 'Compute ' + m(r`\displaystyle\int_0^{+\infty}x\,e^{-${a === 1 ? '' : a}x}\,dx`), valOpt(F(1, a * a)), [valOpt(F(1, a)), opt(m(INF), Infinity), valOpt(F(-1, a * a)), valOpt(F(2, a * a))], `By parts: ${m(r`\left[-\frac{x}{${a}}e^{-${a}x}\right]_0^{+\infty}+\frac{1}{${a}}\int_0^{+\infty}e^{-${a}x}dx=\frac{1}{${a * a}}`)}.`);
    if (t === 2) return mk('improper', L, 'Compute ' + m(r`\displaystyle\int_0^{+\infty}\frac{dx}{x^2+${a * a}}`), T(a === 1 ? r`\frac{\pi}{2}` : `\\frac{\\pi}{${2 * a}}`, PI / (2 * a)), [T(r`\frac{\pi}{2}`, PI / 2), T(`\\frac{\\pi}{${4 * a}}`, PI / (4 * a)), T(INF, Infinity), T(`\\frac{\\pi}{${2 * a * a}}`, PI / (2 * a * a))], `${m(r`\frac{1}{${a}}\arctan\frac{x}{${a}}\to\frac{\pi}{${2 * a}}`)}.`);
    return mk('improper', L, 'Compute ' + m(r`\displaystyle\int_1^{+\infty}\frac{dx}{x(x+${a})}`), T(a === 1 ? r`\log 2` : `\\frac{1}{${a}}\\log ${a + 1}`, LN(a + 1) / a), [T(`\\log ${a + 1}`, LN(a + 1)), T(INF, Infinity), T(`\\frac{1}{${a}}\\log ${F(a + 1, a).tex()}`, LN((a + 1) / a) / a), T(`${a}\\log ${a + 1}`, a * LN(a + 1))], `${m(r`\frac{1}{x(x+${a})}=\frac{1}{${a}}\left(\frac{1}{x}-\frac{1}{x+${a}}\right)`)}, so the integral is ${m(r`\frac{1}{${a}}\left[\log\frac{x}{x+${a}}\right]_1^{+\infty}=\frac{1}{${a}}\log ${a + 1}`)}.`);
  }
  const p = rnd.int(1, 3);
  const T = [[r`\frac{1}{x^{\alpha}(1+x)}`, 0, 1, `near 0 it behaves like ${m(r`x^{-\alpha}`)}, at ${m(r`+\infty`)} like ${m(r`x^{-\alpha-1}`)}`], [r`\frac{1}{x^{\alpha}(1+x^2)}`, -1, 1, `near 0 like ${m(r`x^{-\alpha}`)}, at ${m(r`+\infty`)} like ${m(r`x^{-\alpha-2}`)}`], [r`\frac{\arctan x}{x^{\alpha}}`, 1, 2, `near 0 like ${m(r`x^{1-\alpha}`)}, at ${m(r`+\infty`)} like ${m(r`\frac{\pi}{2}x^{-\alpha}`)}`], [r`\frac{1-e^{-x}}{x^{\alpha}}`, 1, 2, `near 0 like ${m(r`x^{1-\alpha}`)}, at ${m(r`+\infty`)} like ${m(r`x^{-\alpha}`)}`], [`\\frac{\\log(1+x^{${p}})}{x^{\\alpha}}`, 1, p + 1, `near 0 like ${m(`x^{${p}-\\alpha}`)}, at ${m(r`+\infty`)} like ${m(`${p}\\,x^{-\\alpha}\\log x`)}`]];
  const [g, lo, hi, why] = rnd.pick(T); const s = (a, b) => al(`${a}<\\alpha<${b}`);
  return mk('improper', L, `The integral ${m(r`\displaystyle\int_0^{+\infty}` + g + r`\,dx`)} converges if and only if`, s(lo, hi), [s(lo - 1, hi), s(lo, hi + 1), al(`\\alpha<${hi}`), al(`\\alpha>${lo}`), al(`${lo}\\le\\alpha\\le ${hi}`)], `Split at ${m(1)}: ${why}. Convergence needs ${m(`\\alpha<${hi}`)} near ${m(0)} and ${m(`\\alpha>${lo}`)} at ${m(r`+\infty`)}.`);
}

/* =====================================================================
   10. INTEGRAL FUNCTIONS & FTC
   ===================================================================== */
function intfunc(L) {
  const kind = pickByLevel(L, [[1, 2, 'ftc'], [2, 4, 'chain'], [4, 5, 'extr'], [5, 6, 'lim']]);
  if (kind === 'ftc') {
    const [t0, c, rr] = rnd.pick([[4, 3, 5], [3, 4, 5], [12, 5, 13], [8, 6, 10], [6, 8, 10]]);
    return mk('intfunc', L, `Let ${m(`F(x)=\\displaystyle\\int_0^x\\sqrt{t^2+${c * c}}\\,dt`)}. Then ${m(`F'(${t0})`)} equals`, valOpt(F(rr)), [valOpt(F(t0, rr)), valOpt(F(rr - c)), valOpt(F(rr * rr)), valOpt(F(0))], `By the Fundamental Theorem of Calculus ${m(`F'(x)=\\sqrt{x^2+${c * c}}`)}, so ${m(`F'(${t0})=\\sqrt{${t0 * t0 + c * c}}=${rr}`)}.`);
  }
  if (kind === 'chain') {
    const hs = [[r`\frac{t}{1+t^2}`, t => F(t, 1 + t * t)], [r`\frac{1}{1+t^2}`, t => F(1, 1 + t * t)], [r`\frac{t^2}{1+t}`, t => F(t * t, 1 + t)]];
    const gs = [['x^2', x => x * x, x => 2 * x], ['x^3', x => x ** 3, x => 3 * x * x], ['2x', x => 2 * x, () => 2]];
    const [ht, h] = rnd.pick(hs), [gt, g, dg] = rnd.pick(gs); const x0 = rnd.pick([1, 2]); const lo = rnd.int(0, 1);
    const v = h(g(x0)).mul(dg(x0));
    return mk('intfunc', L, `Let ${m(`F(x)=\\displaystyle\\int_{${lo}}^{${gt}}${ht}\\,dt`)}. Then ${m(`F'(${x0})`)} equals`, valOpt(v), [valOpt(h(g(x0))), valOpt(h(x0).mul(dg(x0))), valOpt(v.neg()), valOpt(h(x0)), valOpt(v.mul(2)), valOpt(v.add(1))], `${m(`F'(x)=h(${gt})\\cdot (${gt})'`)} where ${m(`h(t)=${ht}`)}: ${m(`F'(${x0})=h(${g(x0)})\\cdot ${dg(x0)}=${v.tex()}`)}.`);
  }
  if (kind === 'extr') {
    let a = rnd.int(-3, 2), b = a + rnd.int(1, 3);
    const f = `(t${plusConst(-a)})(t${plusConst(-b)})e^{-t^2}`.replace('(t+0)', 't').replace('(t-0)', 't');
    const st = (mx, mn) => `${m('x=' + mx)} is a local maximum point and ${m('x=' + mn)} is a local minimum point of ${m('F')}`;
    return mk('intfunc', L, `Let ${m(`F(x)=\\displaystyle\\int_0^x ${f}\\,dt`)}. Which statement is correct?`, st(a, b), [st(b, a), `${m('F')} has no local extremum points`, st(-a, -b), `${m('x=' + a)} and ${m('x=' + b)} are both local minimum points of ${m('F')}`], `${m(`F'(x)=(x${plusConst(-a)})(x${plusConst(-b)})e^{-x^2}`)}: positive, then negative between ${m(a)} and ${m(b)}, then positive again.`);
  }
  const fx = rnd.chance(0.5) ? block1(rnd.pick(['sin', 'atan', 'log1p', 'exp']), rnd.pick([1, 2])) : comb([{ c: -1, e: A('cos', X(rnd.pick([1, 2]))) }], [1]);
  const sq = rnd.chance(0.5), inner = sq ? 'x^2' : 'x';
  const k = sOrder(fx.ser), c = fx.ser[k];
  const big = sq ? 2 * (k + 1) : k + 1, v = c.div(k + 1);
  const ft = fx.tex.replace(/x/g, 't');
  return mk('intfunc', L, 'Compute ' + m(`\\displaystyle\\lim_{x\\to 0}\\frac{1}{x^{${big}}}\\int_0^{${inner}}\\left(${ft}\\right)dt`), valOpt(v), [valOpt(c), valOpt(v.mul(2)), valOpt(F(0)), opt(m(INF), Infinity), valOpt(c.div(k)), valOpt(v.neg())], `As ${m(r`t\to 0`)} the integrand is ${m(`\\sim ${mono(c, k, 't')}`)}, so ${m(`\\int_0^{${inner}}(\\dots)\\,dt\\sim ${mono(v, 1, sq ? `x^{${big}}` : `x^{${big}}`).replace(/\^\{1\}$/, '')}`)} (or use de l'Hôpital's rule).`);
}

/* =====================================================================
   11. COMPLEX NUMBERS
   ===================================================================== */
function cTex(a, b) { // a + b i  (integers)
  if (b === 0) return String(a);
  const bi = b === 1 ? 'i' : b === -1 ? '-i' : b + 'i';
  if (a === 0) return bi;
  return a + (b > 0 ? '+' : '-') + (Math.abs(b) === 1 ? 'i' : Math.abs(b) + 'i');
}
const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const cOpt = (a, b) => opt(m(cTex(a, b)), null, a + ',' + b);
function complexQ(L) {
  const kind = pickByLevel(L, [[1, 2, 'div'], [1, 3, 'expform'], [3, 4, 'pow'], [3, 4, 'sqrt'], [4, 5, 'roots'], [4, 6, 'line'], [5, 6, 'quad'], [6, 6, 'count']]);
  if (kind === 'div') {
    let w, q; do { w = [rnd.nz(-3, 3), rnd.nz(-3, 3)]; q = [rnd.int(-4, 4), rnd.nz(-4, 4)]; } while (q[0] === 0 && q[1] === 0);
    const z = cmul(q, w);
    return mk('complex', L, `The complex number ${m(r`\dfrac{${cTex(z[0], z[1])}}{${cTex(w[0], w[1])}}`)} equals`, cOpt(q[0], q[1]), [cOpt(q[0], -q[1]), cOpt(-q[0], -q[1]), cOpt(q[1], q[0]), cOpt(-q[0], q[1])], `Multiply numerator and denominator by ${m(r`\overline{${cTex(w[0], w[1])}}=${cTex(w[0], -w[1])}`)}: the denominator becomes ${m(w[0] ** 2 + w[1] ** 2)}.`);
  }
  if (kind === 'expform') {
    const base = [[1, 1, 's2', 1, 4], [-1, 1, 's2', 3, 4], [-1, -1, 's2', -3, 4], [1, -1, 's2', -1, 4], ['r3', 1, '2', 1, 6], ['-r3', 1, '2', 5, 6], ['-r3', -1, '2', -5, 6], ['r3', -1, '2', -1, 6], [1, 'r3', '2', 1, 3], [-1, 'r3', '2', 2, 3], [-1, '-r3', '2', -2, 3], [1, '-r3', '2', -1, 3], [0, 1, '1', 1, 2], [-1, 0, '1', 1, 1], [0, -1, '1', -1, 2]];
    const [x, y, md, p, q] = rnd.pick(base); const k = rnd.int(1, 3);
    const part = v => { if (typeof v === 'number') return v * k; const neg = v.startsWith('-'); return (neg ? '-' : '') + (k === 1 ? '' : k) + r`\sqrt{3}`; };
    const re = part(x), im = part(y);
    let zt; if (re === 0) zt = (im === k ? '' : im === -k ? '-' : '') + (typeof im === 'number' ? (Math.abs(im) === 1 ? (im < 0 ? '-i' : 'i') : im + 'i') : im + 'i');
    else { const imS = String(im); zt = re + (imS.startsWith('-') ? '' : '+') + (imS === '1' ? '' : imS === '-1' ? '-' : imS) + 'i'; }
    if (im === 0) zt = String(re);
    const rho = md === 's2' ? (k === 1 ? r`\sqrt{2}` : k + r`\sqrt{2}`) : md === '2' ? String(2 * k) : String(k);
    const rhoW = md === 's2' ? String(2 * k * k) : md === '2' ? String(4 * k * k) : (k === 1 ? '2' : String(k * k));
    const ef = (rh, pp, qq) => { const th = piTex(pp, qq); return opt(m(`${rh === '1' ? '' : rh}e^{${th.startsWith('-') ? '-i' + th.slice(1) : 'i' + th}}`), null, rh + '|' + F(pp, qq).tex()); };
    const norm = (pp, qq) => { let f = F(pp, qq); while (f.val() > 1) f = f.sub(2); while (f.val() <= -1) f = f.add(2); return [Number(f.n), Number(f.d)]; };
    const w1 = norm(-p, q), w2 = norm(q - p, q), w3 = norm(p + q, q);
    return mk('complex', L, `The exponential form of ${m('z=' + zt)} is`, ef(rho, p, q), [ef(rho, ...w1), ef(rho, ...w2), ef(rho, ...w3), ef(rhoW, p, q)], `${m(`|z|=${rho}`)} and the principal argument is ${m(piTex(p, q))} (check the quadrant from the signs of real and imaginary part).`);
  }
  if (kind === 'pow') {
    const b = rnd.pick([[1, 1], [1, -1], [-1, 1]]); const n = rnd.int(3, 8); let z = [1, 0]; for (let i = 0; i < n; i++) z = cmul(z, b);
    const rot = cmul(z, [0, 1]);
    return mk('complex', L, `${m(`(${cTex(b[0], b[1])})^{${n}}`)} equals`, cOpt(z[0], z[1]), [cOpt(z[0], -z[1]), cOpt(-z[0], -z[1]), cOpt(rot[0], rot[1]), cOpt(-rot[0], -rot[1]), cOpt(z[0] * 2, z[1] * 2)], `${m(`${cTex(b[0], b[1])}=\\sqrt{2}\\,e^{i(${piTex(b[0] > 0 ? (b[1] > 0 ? 1 : -1) : 3, 4)})}`)}, so the power has modulus ${m(`2^{${n}/2}`)} and argument multiplied by ${m(n)} (De Moivre).`);
  }
  if (kind === 'sqrt') {
    let p, q; do { p = rnd.nz(-3, 3); q = rnd.nz(-3, 3); } while (Math.abs(p) === Math.abs(q));
    const w = cmul([p, q], [p, q]); const pm = (a, b) => opt(m(r`z=\pm(` + cTex(a, b) + ')'), null, [Math.abs(a), a * b].join(','));
    return mk('complex', L, `The solutions of ${m(`z^2=${cTex(w[0], w[1])}`)} are`, pm(p, q), [pm(p, -q), pm(q, p), pm(q, -p)], `Write ${m('z=x+iy')}: ${m(`x^2-y^2=${w[0]}`)} and ${m(`2xy=${w[1]}`)}; one solution is ${m(cTex(p, q))}, the other is its opposite.`);
  }
  if (kind === 'roots') {
    const n = rnd.pick([3, 3, 4, 6]); const R = rnd.pick([1, 2]); const phiK = n === 3 ? rnd.int(0, 3) : n === 4 ? 0 : rnd.pick([0, 2]); // w = R^n e^{i phi}, phi = phiK*pi/2
    const wv = [[1, 0], [0, 1], [-1, 0], [0, -1]][phiK].map(v => v * R ** n);
    const nice = []; for (let k = 0; k < 12; k++) nice.push(k); // angles k*pi/6
    const isRoot = k => { const ang = k * PI / 6 * n; const want = phiK * PI / 2; let d = (ang - want) / (2 * PI); return Math.abs(d - Math.round(d)) < 1e-9; };
    const label = k => { // R e^{i k pi/6} in algebraic form when nice
      const c = [1, 'r3/2', '1/2', 0, '-1/2', '-r3/2', -1, '-r3/2', '-1/2', 0, '1/2', 'r3/2'][k], s = [0, '1/2', 'r3/2', 1, 'r3/2', '1/2', 0, '-1/2', '-r3/2', -1, '-r3/2', '-1/2'][k];
      const T = v => { if (typeof v === 'number') return { t: v * R === 0 ? '' : String(v * R), z: v === 0 }; const neg = v.startsWith('-'); const body = v.replace('-', ''); let t;
        if (body === '1/2') t = R === 2 ? '1' : r`\frac{1}{2}`; else t = R === 2 ? r`\sqrt{3}` : r`\frac{\sqrt{3}}{2}`; return { t: (neg ? '-' : '') + t, z: false }; };
      const a = T(c), b = T(s); let out = a.z ? '' : a.t;
      if (!b.z) { let bt = b.t; if (bt === '1') bt = ''; if (bt === '-1') bt = '-'; out += (out && !bt.startsWith('-') ? '+' : '') + bt + 'i'; }
      return out || '0';
    };
    const roots = nice.filter(isRoot), non = nice.filter(k => !isRoot(k));
    const rk = rnd.pick(roots);
    return mk('complex', L, `Which of the following is a solution of ${m(`z^{${n}}=${cTex(wv[0], wv[1])}`)}?`, opt(m('z=' + label(rk)), null, 'k' + rk), rnd.shuffle(non).slice(0, 5).map(k => opt(m('z=' + label(k)), null, 'k' + k)), `The ${m(n)} solutions have modulus ${m(R)} and arguments ${m(r`\frac{\varphi+2k\pi}{${n}}`)}, ${m(r`k=0,\dots,${n - 1}`)}, where ${m(r`\varphi`)} is an argument of the right-hand side.`);
  }
  if (kind === 'line') {
    let a, b; do { a = rnd.nz(-4, 4); b = rnd.nz(-4, 4); } while (Math.abs(a) === Math.abs(b));
    const forms = [[r`\operatorname{Im}(z\,\overline{w})=0`, F(b, a)], [r`\operatorname{Re}(z\,\overline{w})=0`, F(-a, b)], [r`\operatorname{Im}(z\,w)=0`, F(-b, a)], [r`\operatorname{Re}(z\,w)=0`, F(a, b)]];
    const [cond, slope] = rnd.pick(forms); const ln = s => opt(m('y=' + (s.eq(1) ? '' : s.eq(-1) ? '-' : s.tex()) + 'x'), null, s.tex());
    return mk('complex', L, `Let ${m('z=' + cTex(a, b))}. The set of ${m(r`w=x+iy\in\mathbb{C}`)} such that ${m(cond)} is the line`, ln(slope), forms.map(f => ln(f[1])).concat([ln(slope.neg().inv())]), `Expand: ${m(`z\\,\\overline{w}=(${cTex(a, b)})(x-iy)`)} and ${m(`z\\,w=(${cTex(a, b)})(x+iy)`)}; set the required part equal to ${m(0)} and solve for ${m('y')}.`);
  }
  if (kind === 'quad') {
    const r1 = [rnd.int(-3, 3), rnd.nz(-3, 3)], r2 = [rnd.int(-3, 3), rnd.int(-3, 3)];
    if (r1[0] === r2[0] && r1[1] === r2[1]) throw new Error('same');
    const S = [r1[0] + r2[0], r1[1] + r2[1]], P = cmul(r1, r2);
    const cterm = (re, im, suf) => {
      if (re === 0 && im === 0) return '';
      if (im === 0) return (re > 0 ? '+' : '-') + (Math.abs(re) === 1 && suf ? '' : Math.abs(re)) + suf;
      if (re === 0) return (im > 0 ? '+' : '-') + (Math.abs(im) === 1 ? '' : Math.abs(im)) + 'i' + suf;
      return '+(' + cTex(re, im) + ')' + suf;
    };
    const sTx = cterm(-S[0], -S[1], 'z'), pTx = cterm(P[0], P[1], '');
    const pr = (p1, p2) => { const ks = [p1.join(','), p2.join(',')].sort().join('/'); return opt(m(`z_1=${cTex(...p1)},\\ z_2=${cTex(...p2)}`), null, ks); };
    return mk('complex', L, `The solutions of ${m(`z^2${sTx}${pTx}=0`)} are`, pr(r1, r2), [pr([r1[0], -r1[1]], [r2[0], -r2[1]]), pr([-r1[0], -r1[1]], [-r2[0], -r2[1]]), pr([r1[1], r1[0]], [r2[1], r2[0]]), pr(r1, [r2[0], -r2[1]])], `Sum of the roots ${m('=' + cTex(S[0], S[1]))}, product ${m('=' + cTex(P[0], P[1]))}; check by Viète or the quadratic formula.`);
  }
  const n = rnd.int(3, 6); const t = rnd.int(1, 2);
  const eq = t === 1 ? r`z^{${n}}=\overline{z}` : r`z^{${n}}=|z|^2`; const v = t === 1 ? n + 2 : n + 1;
  return mk('complex', L, `How many complex solutions does ${m(eq)} have?`, opt(m(v), v), [n, n + 1, n + 2, 2 * n, n - 1].map(x => opt(m(x), x)), t === 1 ? `${m('z=0')} is a solution; otherwise taking moduli ${m(`|z|^{${n}}=|z|`)} gives ${m('|z|=1')}, and then ${m(`z^{${n + 1}}=z\\overline{z}=1`)}: ${m(n + 1)} more solutions.` : `${m('z=0')} is a solution; otherwise ${m(`|z|^{${n}}=|z|^2`)} gives ${m('|z|=1')} and then ${m(`z^{${n}}=1`)}: ${m(n)} more solutions.`);
}

/* =====================================================================
   12. FIRST ORDER ODEs
   ===================================================================== */
function odeCheck(y, dy, rhs, xs) { return xs.every(x => { const d = (y(x + 1e-5) - y(x - 1e-5)) / 2e-5; return near(d, rhs(x, y(x)), 1e-4); }); }
function ode1(L) {
  const kind = pickByLevel(L, [[1, 1, 'const'], [2, 2, 'axy'], [3, 3, 'kx'], [4, 4, 'sep'], [5, 5, 'crit'], [5, 6, 'gauss'], [6, 6, 'interval']]);
  const so = (s, k) => opt(m('y(x)=' + s), null, k ?? s);
  if (kind === 'const') {
    const a = rnd.nz(-3, 3), b = rnd.nz(-4, 4), y0 = rnd.int(-3, 3); const eq = F(b, a); const C = F(y0).sub(eq);
    const ex = s => `e^{${mono(s, 1)}}`;
    const sol = (cc, s, q) => joinTerms([[q, ''], [cc, ex(s)]]);
    return mk('ode1', L, `The solution of the Cauchy problem ${m(r`\begin{cases} y'${a > 0 ? '+' : '-'}${Math.abs(a) === 1 ? '' : Math.abs(a)}y=${b}\\ y(0)=${y0}\end{cases}`)} is`, so(sol(C, -a, eq)), [so(sol(C, a, eq)), so(sol(F(y0), -a, eq)), so(sol(F(y0).add(eq), -a, eq)), so(sol(C, -a, eq.neg()))], `Constant solution ${m('y=' + eq.tex())}; general solution ${m(`y=${eq.tex()}+Ce^{${mono(-a, 1)}}`)}; ${m('y(0)=' + y0)} gives ${m('C=' + C.tex())}.`,
      { verify: () => { const y = x => eq.val() + C.val() * Math.exp(-a * x); return odeCheck(y, null, (x, yy) => b - a * yy, [0.1, 0.5]) && near(y(0), y0); } });
  }
  if (kind === 'axy') {
    const a = rnd.pick([1, 2, 3, 4, -2, -1]), y0 = rnd.nz(-3, 3); const half = F(a, 2);
    const s = (co, ex) => `${co === 1 ? '' : co === -1 ? '-' : co}e^{${mono(ex, 2)}}`;
    return mk('ode1', L, `The solution of ${m(r`\begin{cases} y'=${a === 1 ? '' : a === -1 ? '-' : a}xy\\ y(0)=${y0}\end{cases}`)} is`, so(s(y0, half)), [so(s(y0, F(a))), so(`${y0 === 1 ? '' : y0 === -1 ? '-' : y0}e^{${mono(a, 1)}}`), so(s(y0, half.neg())), so(`${y0}+e^{${mono(half, 2)}}`)], `Separating variables (or as a linear equation): ${m(`y=Ce^{${mono(half, 2)}}`)}, and ${m('C=y(0)=' + y0)}.`,
      { verify: () => odeCheck(x => y0 * Math.exp(half.val() * x * x), null, (x, y) => a * x * y, [0.3, 0.7]) });
  }
  if (kind === 'kx') {
    const k = rnd.int(1, 3), mm = rnd.int(0, 2), y1 = rnd.int(-2, 3); const d = mm + k + 1; const C = F(y1).sub(F(1, d));
    const s = (dd, cc, kk) => joinTerms([[F(1, dd), mm + 1 === 1 ? 'x' : `x^{${mm + 1}}`], [cc, kk === 1 ? r`\frac{1}{x}` : `\\frac{1}{x^{${kk}}}`]]);
    return mk('ode1', L, `On ${m(r`(0,+\infty)`)}, the solution of ${m(r`\begin{cases} y'+\frac{${k === 1 ? '' : k}}{x}\,y=${mm === 0 ? '1' : mm === 1 ? 'x' : 'x^2'}\\ y(1)=${y1}\end{cases}`)} is`, so(s(d, C, k)), [so(s(mm + 1, F(y1).sub(F(1, mm + 1)), k)), so(s(d, C.neg(), k)), so(s(d, C, -k).replace(`\\frac{1}{x^{-${k}}}`, `x^{${k}}`).replace(`\\frac{1}{x^{-1}}`, 'x')), so(s(d, F(y1), k))], `Multiply by ${m(`x^{${k}}`)}: ${m(`(x^{${k}}y)'=x^{${mm + k}}`)}, so ${m(`x^{${k}}y=\\frac{x^{${d}}}{${d}}+C`)}; then ${m(`y(1)=${y1}`)} gives ${m('C=' + C.tex())}.`,
      { verify: () => { const y = x => Math.pow(x, mm + 1) / d + C.val() * Math.pow(x, -k); return odeCheck(y, null, (x, yy) => Math.pow(x, mm) - k / x * yy, [0.8, 1.5]) && near(y(1), y1); } });
  }
  if (kind === 'sep') {
    const t = rnd.int(1, 3);
    if (t === 1) { const k = rnd.int(1, 3); return mk('ode1', L, `The solution of ${m(r`\begin{cases} y'=${2 * k}x\,e^{-y}\\ y(0)=0\end{cases}`)} is`, so(`\\log(1+${k === 1 ? '' : k}x^2)`), [so(`\\log(1+${2 * k}x^2)`), so(`${k === 1 ? '' : k}x^2`), so(`-\\log(1+${k === 1 ? '' : k}x^2)`), so(`e^{${k === 1 ? '' : k}x^2}-1`)], `${m(`e^{y}y'=${2 * k}x`)} gives ${m(`e^{y}=${k === 1 ? '' : k}x^2+C`)}, and ${m('y(0)=0')} gives ${m('C=1')}.`, { verify: () => odeCheck(x => Math.log(1 + k * x * x), null, (x, y) => 2 * k * x * Math.exp(-y), [0.4, 1.1]) }); }
    if (t === 2) { const a = rnd.int(1, 4); return mk('ode1', L, `The solution of ${m(r`\begin{cases} y'=\frac{x}{y}\\ y(0)=${a}\end{cases}`)} is`, so(`\\sqrt{x^2+${a * a}}`), [so(`x+${a}`), so(`\\sqrt{x^2}+${a}`), so(`\\sqrt{x^2+${a}}`), so(`-\\sqrt{x^2+${a * a}}`)], `${m("yy'=x")} gives ${m(`y^2=x^2+C`)}; ${m(`y(0)=${a}>0`)} gives ${m(`C=${a * a}`)} and the positive root.`, { verify: () => odeCheck(x => Math.sqrt(x * x + a * a), null, (x, y) => x / y, [0.5, 1.2]) }); }
    const a = rnd.int(1, 3); return mk('ode1', L, `The solution of ${m(r`\begin{cases} y'=y^2\\ y(0)=${a}\end{cases}`)} is`, so(`\\frac{${a}}{1-${a === 1 ? '' : a}x}`), [so(`\\frac{${a}}{1+${a === 1 ? '' : a}x}`), so(`${a}e^{x^2}`), so(`\\frac{1}{${a}-x}`), so(`${a}+x^2`)], `${m(r`\frac{y'}{y^2}=1`)} gives ${m(r`-\frac{1}{y}=x+C`)}, with ${m(`C=-\\frac{1}{${a}}`)}.`, { verify: () => odeCheck(x => a / (1 - a * x), null, (x, y) => y * y, [0.05, 0.1]) });
  }
  if (kind === 'crit') {
    const p = rnd.int(1, 3), x0 = rnd.int(1, 2), q = rnd.int(1, 5); const ax = x0 + p, bx = x0 * x0 + q; const v = F(bx, ax);
    return mk('ode1', L, `Let ${m(r`\varphi`)} be the solution of ${m(r`\begin{cases} y'+(x+${p})y=x^2+${q}\\ y(${x0})=y_0\end{cases}`)}. The point ${m('x_0=' + x0)} is a critical point of ${m(r`\varphi`)} if and only if`, valOpt(v).h === m(v.tex()) ? opt(m('y_0=' + v.tex()), v.val()) : null, [opt(m('y_0=' + v.inv().tex()), v.inv().val()), opt(m('y_0=0'), 0), opt(m('y_0=' + v.neg().tex()), -v.val()), opt(m('y_0=' + F(bx).tex()), bx)], `${m(r`\varphi'(${x0})=-(${x0}+${p})y_0+${bx}`)} must vanish, so ${m('y_0=' + v.tex())}.`);
  }
  if (kind === 'gauss') {
    const a = rnd.int(1, 3), c = rnd.nz(-3, 3), y0 = rnd.int(-3, 3); const C = y0 - c; if (C === 0) throw new Error('trivial');
    const s = (cc, co, ex) => `${cc}${co > 0 ? '+' : '-'}${Math.abs(co) === 1 ? '' : Math.abs(co)}e^{${mono(ex, 2)}}`;
    return mk('ode1', L, `The solution of ${m(r`\begin{cases} y'+${2 * a}xy=${2 * a * c}x\\ y(0)=${y0}\end{cases}`)} is`, so(s(c, C, -a)), [so(s(c, C, a)), so(s(c, y0, -a)), so(s(-c, C, -a)), so(s(c, C, -2 * a))], `Constant solution ${m('y=' + c)}; the homogeneous equation gives ${m(`Ce^{${mono(-a, 2)}}`)}; ${m(`y(0)=${y0}`)} gives ${m('C=' + C)}.`, { verify: () => odeCheck(x => c + C * Math.exp(-a * x * x), null, (x, y) => 2 * a * c * x - 2 * a * x * y, [0.3, 0.8]) });
  }
  const k = rnd.pick([2, 8, 18]); const r0 = Math.sqrt(2 / k); const rt = F(1, Math.round(1 / r0)).tex();
  const I = (lo, hi) => opt(m(iv(lo, hi, false, false)), null, lo + hi);
  return mk('ode1', L, `The maximal interval of definition of the solution of ${m(r`\begin{cases} y'=${k}\,\frac{\log t}{t}\,e^{y}\\ y(1)=0\end{cases}`)} is`, I(`e^{-${rt}}`, `e^{${rt}}`), [I('0', `e^{${rt}}`), I(`e^{-${F(1, k).tex()}}`, `e^{${F(1, k).tex()}}`), I('0', INF), I(`e^{-${F(2, k).tex()}}`, `e^{${F(2, k).tex()}}`)], `Separating: ${m(`e^{-y}=1-${k / 2}\\log^2 t`)}, which must stay positive: ${m(`|\\log t|<${rt}`)}.`);
}

/* =====================================================================
   13. SECOND ORDER LINEAR ODEs WITH CONSTANT COEFFICIENTS
   ===================================================================== */
function eqTex(p, q, rhs) { return `y''${p === 0 ? '' : (p > 0 ? '+' : '-') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + "y'"}${q === 0 ? '' : (q > 0 ? '+' : '-') + (Math.abs(q) === 1 ? '' : Math.abs(q)) + 'y'}=${rhs}`; }
const ex2 = k => (k === 0 ? '' : `e^{${mono(k, 1)}}`);
function ode2(L) {
  const kind = pickByLevel(L, [[1, 1, 'real'], [2, 2, 'double'], [3, 3, 'complex'], [4, 4, 'poly'], [5, 5, 'exp'], [6, 6, 'cauchy']]);
  const so = (s, k) => opt(m('y(x)=' + s), null, k ?? s);
  if (kind === 'real') {
    let r1, r2; do { r1 = rnd.int(-4, 4); r2 = rnd.int(-4, 4); } while (r1 >= r2 || r1 === 0 && r2 === 0 || r1 === -r2);
    const p = -(r1 + r2), q = r1 * r2; const g = (a, b) => (a === 0 ? 'c_1' : `c_1${ex2(a)}`) + '+' + (b === 0 ? 'c_2' : `c_2${ex2(b)}`);
    return mk('ode2', L, `The general solution of ${m(eqTex(p, q, '0'))} is (${m(r`c_1,c_2\in\mathbb{R}`)})`, so(g(r1, r2), [r1, r2].sort().join()), [so(g(-r1, -r2), [-r1, -r2].sort().join()), so(`c_1${ex2(r1) || ''}+c_2x${ex2(r2)}`, 'x'), so(g(r1, -r2), [r1, -r2].sort().join()), so(`e^{${mono(r1, 1)}}(c_1\\cos ${Math.abs(r2) || 1}x+c_2\\sin ${Math.abs(r2) || 1}x)`.replace(' 1x', ' x'), 't')], `Characteristic equation ${m(`\\lambda^2${p === 0 ? '' : (p > 0 ? '+' : '-') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + '\\lambda'}${q === 0 ? '' : sgnTerm(q)}=0`)} with roots ${m(r1)} and ${m(r2)}.`);
  }
  if (kind === 'double') {
    const r0 = rnd.nz(-3, 3); const p = -2 * r0, q = r0 * r0;
    return mk('ode2', L, `The general solution of ${m(eqTex(p, q, '0'))} is (${m(r`c_1,c_2\in\mathbb{R}`)})`, so(`(c_1+c_2x)${ex2(r0)}`), [so(`c_1${ex2(r0)}+c_2${ex2(-r0)}`), so(`(c_1+c_2x)${ex2(-r0)}`), so(`c_1${ex2(r0)}`), so(`(c_1+c_2x^2)${ex2(r0)}`)], `The characteristic equation ${m(`(\\lambda${plusConst(-r0)})^2=0`)} has the double root ${m(r0)}: the solutions are ${m(`e^{${mono(r0, 1)}}`)} and ${m(`x\\,e^{${mono(r0, 1)}}`)}.`);
  }
  if (kind === 'complex') {
    const al = rnd.int(-2, 2), be = rnd.int(1, 3); const p = -2 * al, q = al * al + be * be;
    const bx = be === 1 ? 'x' : be + 'x';
    const g = (a, b) => `${a === 0 ? '' : `e^{${mono(a, 1)}}`}(c_1\\cos ${b === 1 ? 'x' : b + 'x'}+c_2\\sin ${b === 1 ? 'x' : b + 'x'})`;
    const wr = [so(g(-al, be), 'n' + (-al)), so(`c_1${ex2(al + be)}+c_2${ex2(al - be)}`, 'r'), so(g(al, be * be), 'b2'), so(g(be, Math.abs(al) || 2), 'sw'), so(g(al, be + 1), 'b1')];
    return mk('ode2', L, `The general solution of ${m(eqTex(p, q, '0'))} is (${m(r`c_1,c_2\in\mathbb{R}`)})`, so(g(al, be), 'ok'), wr, `The characteristic roots are ${m(`${al === 0 ? '' : al}\\pm ${be === 1 ? '' : be}i`)}, so ${m(`y=e^{${al}x}(c_1\\cos ${bx}+c_2\\sin ${bx})`)}.`,
      { verify: () => { const c1 = 0.7, c2 = -1.3; const y = x => Math.exp(al * x) * (c1 * Math.cos(be * x) + c2 * Math.sin(be * x)); const h = 1e-4, x = 0.4; const d2 = (y(x + h) - 2 * y(x) + y(x - h)) / (h * h), d1 = (y(x + h) - y(x - h)) / (2 * h); return Math.abs(d2 + p * d1 + q * y(x)) < 1e-4; } });
  }
  if (kind === 'poly') {
    let p, q; do { p = rnd.int(-4, 4); q = rnd.nz(-4, 4); } while (false);
    const a = rnd.nz(-4, 4) * q, b = rnd.int(-6, 6); const Acoef = F(a, q), B = F(b, 1).sub(Acoef.mul(p)).div(q);
    const lin = (A1, B1) => polyTex([B1, A1]);
    return mk('ode2', L, `A particular solution of ${m(eqTex(p, q, polyTex([b, a])))} is`, so(lin(Acoef, B)), [so(lin(Acoef, F(b, q))), so(lin(F(a), F(b))), so(lin(Acoef.neg(), B)), so(lin(Acoef, B.add(1)))], `Try ${m('y=Ax+B')}: ${m(joinTerms([[F(p), 'A'], [F(q), '(Ax+B)']]) + '=' + polyTex([b, a]))} gives ${m('A=' + Acoef.tex())} and ${m('B=' + B.tex())}.`,
      { verify: () => { const y = x => Acoef.val() * x + B.val(); return Math.abs(p * Acoef.val() + q * y(0.7) - (a * 0.7 + b)) < 1e-9; } });
  }
  if (kind === 'exp') {
    const r1 = rnd.int(-3, 3); let r2; do { r2 = rnd.int(-3, 3); } while (r2 === r1);
    const p = -(r1 + r2), q = r1 * r2; const res = rnd.chance(0.4); const c = rnd.nz(-6, 6);
    let k; if (res) k = r1; else do { k = rnd.nz(-3, 3); } while (k === r1 || k === r2);
    const rhs = `${c === 1 ? '' : c === -1 ? '-' : c}e^{${mono(k, 1)}}`;
    if (!res) { const A0 = F(c, k * k + p * k + q); const s = (aa, xx) => `${aa.eq(1) ? '' : aa.eq(-1) ? '-' : aa.tex()}${xx ? 'x' : ''}e^{${mono(k, 1)}}`;
      return mk('ode2', L, `A particular solution of ${m(eqTex(p, q, rhs))} is`, so(s(A0)), [so(s(A0, true)), so(s(A0.neg())), so(s(F(c))), so(s(F(c, k * k + q)))], `${m(k)} is not a characteristic root, so try ${m(`Ae^{${mono(k, 1)}}`)}: ${m(`A(${k * k}${sgnTerm(p * k)}${sgnTerm(q)})=${c}`)}.`, { verify: () => { const A0v = A0.val(); return near(A0v * (k * k + p * k + q), c); } }); }
    const A0 = F(c, 2 * k + p); const s = (aa, xx) => `${aa.eq(1) ? '' : aa.eq(-1) ? '-' : aa.tex()}${xx ? 'x' : ''}e^{${mono(k, 1)}}`;
    return mk('ode2', L, `A particular solution of ${m(eqTex(p, q, rhs))} is`, so(s(A0, true)), [so(s(A0)), so(s(A0.neg(), true)), so(s(F(c), true)), so(s(A0.mul(2), true))], `${m(k)} is a simple root of the characteristic polynomial (resonance), so try ${m(`Axe^{${mono(k, 1)}}`)}: substituting gives ${m(`A(2\\cdot ${k}${sgnTerm(p)})=${c}`)}.`,
      { verify: () => { const A0v = A0.val(); const y = x => A0v * x * Math.exp(k * x); const h = 1e-4, x = 0.3; const d2 = (y(x + h) - 2 * y(x) + y(x - h)) / (h * h), d1 = (y(x + h) - y(x - h)) / (2 * h); return Math.abs(d2 + p * d1 + q * y(x) - c * Math.exp(k * x)) < 1e-3; } });
  }
  const w = rnd.int(1, 3), a = rnd.int(-3, 3), b = rnd.nz(-4, 4) * w; const v = F(b, w);
  return mk('ode2', L, `Let ${m('y')} solve ${m(r`\begin{cases} y''+${w * w}y=0\\ y(0)=${a},\ y'(0)=${b}\end{cases}`)}. Then ${m(`y\\left(${piTex(1, 2 * w)}\\right)`)} equals`, valOpt(v), [valOpt(F(a)), valOpt(F(b)), valOpt(v.neg()), valOpt(F(b * w)), valOpt(F(-a)), valOpt(v.add(a))], `${m('y=' + joinTerms([[F(a), r`\cos ` + (w === 1 ? '' : w) + 'x'], [v, r`\sin ` + (w === 1 ? '' : w) + 'x']]))}; at ${m(`x=${piTex(1, 2 * w)}`)} the cosine vanishes and the sine equals ${m(1)}.`);
}

/* =====================================================================
   14. THEORY
   ===================================================================== */
const TH = [
  [1, r`Let $f$ be continuous on a closed bounded interval $[a,b]$. Weierstrass' theorem guarantees that`, r`$f$ has a maximum and a minimum on $[a,b]$`, [r`$f$ is differentiable on $(a,b)$`, r`$f$ has a zero in $(a,b)$`, r`$f$ is monotone on $[a,b]$`, r`$f$ is bounded but may have no maximum`], r`Weierstrass: a continuous function on a closed and bounded interval attains its maximum and its minimum value.`],
  [1, r`Let $f$ be continuous on $[a,b]$, differentiable on $(a,b)$, with $f(a)=f(b)$. Rolle's theorem states that`, r`there exists $c\in(a,b)$ with $f'(c)=0$`, [r`$f$ is constant on $[a,b]$`, r`$f'(x)=0$ for every $x\in(a,b)$`, r`there exists $c\in(a,b)$ with $f(c)=0$`, r`there exists $c\in(a,b)$ with $f''(c)=0$`], r`Rolle: under these hypotheses the derivative vanishes at (at least) one interior point; nothing more is guaranteed.`],
  [2, r`Let $f$ be continuous on $[a,b]$ and differentiable on $(a,b)$. Lagrange's (mean value) theorem states that there exists $c\in(a,b)$ such that`, r`$f'(c)=\frac{f(b)-f(a)}{b-a}$`, [r`$f(c)=\frac{f(b)-f(a)}{b-a}$`, r`$f'(c)=f(b)-f(a)$`, r`$f'(c)=\frac{f(a)+f(b)}{2}$`, r`$f'(c)=0$`], r`Lagrange: some tangent line is parallel to the secant through $(a,f(a))$ and $(b,f(b))$.`],
  [1, r`Which statement is the theorem of existence of zeros?`, r`If $f$ is continuous on $[a,b]$ and $f(a)f(b)<0$, then $f(c)=0$ for some $c\in(a,b)$`, [r`If $f$ is continuous on $[a,b]$ and $f(a)f(b)>0$, then $f$ has no zeros in $(a,b)$`, r`If $f$ is continuous on $(a,b)$ and $f(a)f(b)<0$, then $f$ has exactly one zero`, r`If $f(a)f(b)<0$, then $f(c)=0$ for some $c\in(a,b)$, even if $f$ is not continuous`, r`If $f$ is differentiable and $f(a)f(b)<0$, then $f$ has exactly one zero in $(a,b)$`], r`Continuity on the closed interval and a change of sign at the endpoints give at least one zero; uniqueness needs monotonicity.`],
  [2, r`If $f$ is differentiable at $x_0$, then`, r`$f$ is continuous at $x_0$`, [r`$f'$ is continuous at $x_0$`, r`$f$ is twice differentiable at $x_0$`, r`$x_0$ is an extremum point whenever $f'(x_0)=0$`, r`$f$ is differentiable in a whole neighbourhood of $x_0$`], r`Differentiability implies continuity: $f(x)-f(x_0)=\frac{f(x)-f(x_0)}{x-x_0}(x-x_0)\to f'(x_0)\cdot 0=0$.`],
  [2, r`Which statement is TRUE?`, r`A function continuous at $x_0$ may fail to be differentiable at $x_0$`, [r`Every function continuous at $x_0$ is differentiable at $x_0$`, r`A function differentiable at $x_0$ may be discontinuous at $x_0$`, r`If $f$ is not differentiable at $x_0$, then $f$ is discontinuous at $x_0$`], r`Example: $f(x)=|x|$ is continuous but not differentiable at $0$. The converse implication (differentiable $\Rightarrow$ continuous) is true.`],
  [3, r`Let $f$ be differentiable at an interior point $x_0$ of its domain, and let $x_0$ be a local maximum point. Then (Fermat)`, r`$f'(x_0)=0$`, [r`$f''(x_0)<0$`, r`$f'(x_0)>0$`, r`$f'$ changes sign at $x_0$`, r`$f(x_0)=0$`], r`Fermat: at an interior extremum point where $f$ is differentiable, the derivative vanishes.`],
  [3, r`Which statement is TRUE?`, r`If $f''(x_0)=0$, then $x_0$ may not be an inflection point (e.g. $f(x)=x^4$, $x_0=0$)`, [r`If $f''(x_0)=0$ then $x_0$ is an inflection point`, r`If $f'(x_0)=0$ then $x_0$ is an extremum point`, r`If $f'(x_0)=f''(x_0)=0$ then $x_0$ is not an extremum point`], r`For $f(x)=x^4$: $f'(0)=f''(0)=0$ but $0$ is a minimum point, not an inflection point.`],
  [4, r`De l'Hôpital's rule: let $f(x),g(x)\to 0$ as $x\to x_0$, with $f,g$ differentiable near $x_0$ and $g'\neq 0$. Then`, r`if $\frac{f'}{g'}\to L$, also $\frac{f}{g}\to L$`, [r`if $\frac{f}{g}\to L$, also $\frac{f'}{g'}\to L$`, r`if $\frac{f'}{g'}$ has no limit, then $\frac{f}{g}$ has no limit`, r`$\frac{f}{g}\to\frac{f(x_0)}{g(x_0)}$`], r`The rule only goes in one direction: a limit of $f'/g'$ gives the same limit of $f/g$, not conversely.`],
  [2, r`Let $f$ be differentiable on an interval $I$ with $f'(x)>0$ for all $x\in I$. Then`, r`$f$ is strictly increasing on $I$`, [r`$f$ is convex on $I$`, r`$f(x)>0$ for all $x\in I$`, r`$f$ is bounded on $I$`, r`$f$ has a minimum on $I$`], r`Monotonicity test (consequence of Lagrange's theorem) on an interval.`],
  [4, r`Let $f$ be differentiable on $(-\infty,0)\cup(0,+\infty)$ with $f'(x)>0$ there. Which statement is TRUE?`, r`$f$ need not be increasing on its domain (e.g. $f(x)=-1/x$)`, [r`$f$ is strictly increasing on $(-\infty,0)\cup(0,+\infty)$`, r`$f$ is injective on its domain`, r`$f$ has a minimum point`], r`The monotonicity test works on intervals only: $-1/x$ is increasing on each half-line but $f(-1)=1>f(1)=-1$.`],
  [3, r`Let $f$ be continuous on $[a,b]$ and $F(x)=\int_a^x f(t)\,dt$. Then`, r`$F$ is differentiable and $F'(x)=f(x)$ for all $x\in[a,b]$`, [r`$F'(x)=f(x)-f(a)$`, r`$F$ is differentiable only if $f$ is differentiable`, r`$F(x)=f(x)-f(a)$`, r`$F'(x)=f'(x)$`], r`Fundamental Theorem of Calculus: the integral function of a continuous function is a primitive of it.`],
  [3, r`If $f$ is continuous on $[a,b]$, the integral mean value theorem states that there is $c\in[a,b]$ with`, r`$f(c)=\frac{1}{b-a}\int_a^b f(x)\,dx$`, [r`$f'(c)=\frac{1}{b-a}\int_a^b f(x)\,dx$`, r`$f(c)=\int_a^b f(x)\,dx$`, r`$f(c)=\frac{f(a)+f(b)}{2}$`], r`A continuous function attains its integral mean (by Weierstrass and the intermediate value theorem).`],
  [4, r`Let $f\ge 0$ be continuous on $[a,+\infty)$. Then $\int_a^{+\infty}f(x)\,dx$`, r`either converges or diverges to $+\infty$`, [r`always converges if $f(x)\to 0$ as $x\to+\infty$`, r`may be undetermined (oscillating)`, r`converges if and only if $f$ is bounded`], r`$c\mapsto\int_a^c f$ is increasing, so it has a limit (finite or $+\infty$). Note $\int_1^{+\infty}\frac{dx}{x}$ diverges although $\frac1x\to 0$.`],
  [3, r`Let $w\in\mathbb{C}$, $w\neq 0$, and $n\ge 2$. The equation $z^n=w$ has`, r`exactly $n$ distinct complex solutions`, [r`at most two complex solutions`, r`exactly $n$ solutions, all real if $w$ is real`, r`$n$ solutions with the same argument`, r`exactly one solution with positive real part`], r`The solutions are $\sqrt[n]{|w|}\,e^{i(\varphi+2k\pi)/n}$, $k=0,\dots,n-1$: the vertices of a regular $n$-gon.`],
  [2, r`Euler's formula states that, for $\theta\in\mathbb{R}$,`, r`$e^{i\theta}=\cos\theta+i\sin\theta$`, [r`$e^{i\theta}=\cos\theta-i\sin\theta$`, r`$e^{i\theta}=\sin\theta+i\cos\theta$`, r`$|e^{i\theta}|=e^{\theta}$`], r`Euler's formula; in particular $|e^{i\theta}|=1$.`],
  [4, r`A polynomial of degree $n\ge 1$ with complex coefficients`, r`has exactly $n$ complex roots, counted with multiplicity`, [r`has at least one real root`, r`has $n$ distinct complex roots`, r`has at most $n-1$ complex roots`], r`Fundamental Theorem of Algebra. Roots may coincide (e.g. $(z-1)^2$) and need not be real (e.g. $z^2+1$).`],
  [4, r`Let $P$ be a polynomial with real coefficients and $P(z_0)=0$ with $z_0\in\mathbb{C}$. Then`, r`$P(\overline{z_0})=0$`, [r`$P(-z_0)=0$`, r`$P(1/z_0)=0$`, r`$P(|z_0|)=0$`], r`Conjugating $P(z_0)=0$ and using real coefficients gives $P(\overline{z_0})=0$: complex roots come in conjugate pairs.`],
  [3, r`A monotone sequence of real numbers`, r`has a limit, finite or infinite`, [r`always converges`, r`is bounded`, r`is eventually constant`], r`Monotone sequences are regular: the limit is the sup (or inf) of the values, possibly infinite.`],
  [2, r`If $\lim_{x\to x_0}f(x)=L>0$, then`, r`$f(x)>0$ in a punctured neighbourhood of $x_0$`, [r`$f(x_0)>0$`, r`$f(x)>L$ near $x_0$`, r`$f$ is positive on its whole domain`], r`Sign-preserving property (permanence of sign) of limits. Nothing is said about $f(x_0)$ itself.`],
  [5, r`Let $f$ be continuous at $x_0$ and $g$ discontinuous at $x_0$. Then`, r`$f+g$ is discontinuous at $x_0$`, [r`$f\cdot g$ is discontinuous at $x_0$`, r`$f+g$ may be continuous at $x_0$`, r`$g\circ f$ is continuous at $x_0$`], r`If $f+g$ were continuous, $g=(f+g)-f$ would be too. A product may become continuous: take $f\equiv 0$.`],
  [5, r`Let $f$ be continuous and strictly monotone on an interval $I$. Then`, r`$f$ is invertible and $f^{-1}$ is continuous on $f(I)$`, [r`$f^{-1}$ is differentiable on $f(I)$`, r`$f(I)$ is a bounded interval`, r`$f$ is differentiable on $I$`], r`Continuity of the inverse function. Differentiability of $f^{-1}$ needs $f'\neq 0$ (e.g. $x^3$ at $0$).`],
  [4, r`Let $a,b$ be continuous on an open interval $I\ni x_0$. The Cauchy problem $y'+a(x)y=b(x)$, $y(x_0)=y_0$`, r`has a unique solution, defined on the whole $I$`, [r`may have infinitely many solutions`, r`has a solution only in a small neighbourhood of $x_0$`, r`has a unique solution only if $b\equiv 0$`], r`Linear first-order equations: global existence and uniqueness, given by the solving formula.`],
  [5, r`The general solution of $y''+py'+qy=f(x)$ is`, r`$y_h+y_p$, with $y_h$ the general solution of the homogeneous equation and $y_p$ a particular solution`, [r`$y_h\cdot y_p$`, r`$c\,y_p$ with $c\in\mathbb{R}$`, r`a family depending on one arbitrary constant`], r`Structure theorem for linear equations: general = homogeneous general solution (two constants) + one particular solution.`],
  [5, r`A twice differentiable function $f$ is convex on an interval $I$ if and only if`, r`$f''(x)\ge 0$ for all $x\in I$`, [r`$f''(x)>0$ for all $x\in I$`, r`$f'(x)\ge 0$ for all $x\in I$`, r`$f(x)\ge 0$ for all $x\in I$`], r`Convexity test. $f''>0$ is sufficient but not necessary ($x^4$ is convex with $f''(0)=0$).`],
  [6, r`If $f$ is bounded in a neighbourhood of $x_0$ and $g(x)\to 0$ as $x\to x_0$, then`, r`$f(x)g(x)\to 0$`, [r`$f(x)/g(x)\to\infty$`, r`$f(x)+g(x)\to 0$`, r`$f(x)g(x)$ need not have a limit`], r`$|f g|\le M|g|\to 0$: bounded times infinitesimal is infinitesimal (squeeze theorem).`],
  [6, r`Which statement is TRUE?`, r`Every nonempty subset of $\mathbb{R}$ bounded above has a supremum in $\mathbb{R}$`, [r`Every nonempty subset of $\mathbb{Q}$ bounded above has a supremum in $\mathbb{Q}$`, r`Every bounded subset of $\mathbb{R}$ has a maximum`, r`Every nonempty subset of $\mathbb{R}$ has a supremum in $\mathbb{R}$`], r`Completeness of $\mathbb{R}$. It fails in $\mathbb{Q}$: $\{q\in\mathbb{Q}: q^2<2\}$ has no rational supremum.`],
  [5, r`Let $A\subseteq\mathbb{R}$ be nonempty. Then $S=\sup A\in\mathbb{R}$ if and only if`, r`$a\le S$ for all $a\in A$, and for every $\varepsilon>0$ there is $a\in A$ with $a>S-\varepsilon$`, [r`$S\in A$ and $a\le S$ for all $a\in A$`, r`$a\le S$ for all $a\in A$`, r`for every $\varepsilon>0$ there is $a\in A$ with $a>S+\varepsilon$`], r`$S$ is an upper bound, and no smaller number is an upper bound. $S$ need not belong to $A$.`],
  [6, r`Let $f$ be continuous at $x_0$, differentiable in a punctured neighbourhood of $x_0$, with $\lim_{x\to x_0}f'(x)=\ell\in\mathbb{R}$. Then`, r`$f$ is differentiable at $x_0$ and $f'(x_0)=\ell$`, [r`$f$ may not be differentiable at $x_0$`, r`$f$ is differentiable at $x_0$ but $f'(x_0)$ may differ from $\ell$`, r`$x_0$ is a corner point`], r`Consequence of de l'Hôpital's rule (or Lagrange's theorem) applied to the difference quotient.`],
  [2, r`If $f:\mathbb{R}\to\mathbb{R}$ is even and differentiable, then $f'$ is`, r`odd`, [r`even`, r`neither even nor odd in general`, r`identically zero`], r`Differentiate $f(-x)=f(x)$: $-f'(-x)=f'(x)$.`],
  [3, r`If $f$ is odd and continuous on $[-a,a]$, then $\int_{-a}^{a}f(x)\,dx$`, r`equals $0$`, [r`equals $2\int_0^a f(x)\,dx$`, r`equals $\int_0^a f(x)\,dx$`, r`cannot be determined without knowing $f$`], r`Substituting $x=-t$, the integrals over $[-a,0]$ and $[0,a]$ cancel.`],
  [4, r`Which of the following conditions guarantees that a function $f:\mathbb{R}\to\mathbb{R}$ is injective?`, r`$f$ is strictly monotone`, [r`$f$ is continuous`, r`$f$ is bounded`, r`$f$ is differentiable`], r`Strictly monotone functions never take the same value twice.`],
  [1, r`The function $f(x)=e^x$, as a map $f:\mathbb{R}\to\mathbb{R}$, is`, r`injective but not surjective`, [r`surjective but not injective`, r`bijective`, r`neither injective nor surjective`], r`$e^x$ is strictly increasing (injective) but its image is $(0,+\infty)\neq\mathbb{R}$.`],
  [3, r`Let $f(x)\sim g(x)$ as $x\to x_0$. Which statement is TRUE?`, r`$f(x)=g(x)+o(g(x))$ as $x\to x_0$`, [r`$f(x)-g(x)\to 0$ always implies $f\sim g$`, r`$f(x)+h(x)\sim g(x)+h(x)$ for every $h$`, r`$f(x)-g(x)=o(1)$ is equivalent to $f\sim g$`], r`$f\sim g$ means $f/g\to 1$, i.e. $f-g=o(g)$. Equivalences cannot be added in general.`],
  [1, r`The function $f:\mathbb{R}\to\mathbb{R}$, $f(x)=x^2$, is`, r`neither injective nor surjective`, [r`injective but not surjective`, r`surjective but not injective`, r`bijective`], r`$f(-1)=f(1)$, so it is not injective; negative values are never attained, so it is not surjective onto $\mathbb{R}$.`],
  [2, r`The function $f:\mathbb{R}\to[0,+\infty)$, $f(x)=x^2$, is`, r`surjective but not injective`, [r`injective but not surjective`, r`bijective`, r`neither injective nor surjective`], r`Every $y\ge0$ equals $(\sqrt y)^2$, so it is surjective onto $[0,+\infty)$; but $f(-1)=f(1)$.`],
  [2, r`If $f$ and $g$ are both strictly increasing, then $g\circ f$ is`, r`strictly increasing`, [r`strictly decreasing`, r`not necessarily monotone`, r`constant`], r`$x_1<x_2\Rightarrow f(x_1)<f(x_2)\Rightarrow g(f(x_1))<g(f(x_2))$.`],
  [3, r`If $f$ is strictly increasing and $g$ is strictly decreasing, then $g\circ f$ is`, r`strictly decreasing`, [r`strictly increasing`, r`not necessarily monotone`, r`constant`], r`$x_1<x_2\Rightarrow f(x_1)<f(x_2)\Rightarrow g(f(x_1))>g(f(x_2))$.`],
  [2, r`The graph of $f^{-1}$ is obtained from the graph of $f$ by`, r`a reflection across the line $y=x$`, [r`a reflection across the $x$-axis`, r`a reflection across the $y$-axis`, r`a rotation by $90^\circ$`], r`$(a,b)$ is on the graph of $f$ iff $(b,a)$ is on the graph of $f^{-1}$.`],
  [1, r`The negation of "every student passed the exam" is`, r`at least one student did not pass the exam`, [r`no student passed the exam`, r`every student failed the exam`, r`at least one student passed the exam`], r`$\neg(\forall x\ P(x))\equiv\exists x\ \neg P(x)$.`],
  [2, r`Let $A=\{1/n: n\in\mathbb{N},\ n\ge1\}$. Which statement is TRUE?`, r`$\inf A=0$, but $A$ has no minimum`, [r`$\min A=0$`, r`$\sup A=1$, but $A$ has no maximum`, r`$A$ is not bounded below`], r`$1/n>0$ for every $n$ and $1/n\to0$, so $\inf A=0\notin A$; $\max A=1$.`],
  [3, r`If $\lim_{x\to x_0}f(x)$ exists, then`, r`it is unique`, [r`$f$ is continuous at $x_0$`, r`$f$ is bounded on its whole domain`, r`it is equal to $f(x_0)$`], r`Uniqueness of the limit. Continuity also requires $f(x_0)$ to equal the limit.`],
  [3, r`If $\lim_{x\to x_0}f(x)=L\in\mathbb{R}$, then`, r`$f$ is bounded in a punctured neighbourhood of $x_0$`, [r`$f$ is bounded on its whole domain`, r`$f$ is monotone near $x_0$`, r`$f(x)=L$ near $x_0$`], r`Local boundedness: for $\varepsilon=1$, $L-1<f(x)<L+1$ near $x_0$.`],
  [3, r`If $f$ is increasing on $(a,b)$, then $\lim_{x\to b^-}f(x)$`, r`always exists and equals $\sup_{(a,b)}f$ (possibly $+\infty$)`, [r`always exists and is finite`, r`may not exist`, r`is always equal to $f(b)$`], r`Theorem on limits of monotone functions.`],
  [2, r`Which of the following is an indeterminate form?`, r`$0\cdot\infty$`, [r`$\frac{0}{\infty}$`, r`$+\infty+\infty$`, r`$\frac{1}{0^+}$`], r`$\frac{0}{\infty}\to0$, $+\infty+\infty=+\infty$, $\frac{1}{0^+}=+\infty$: only $0\cdot\infty$ is indeterminate.`],
  [3, r`Which of the following is <b>not</b> an indeterminate form?`, r`$0^{+\infty}$`, [r`$1^{\infty}$`, r`$0^0$`, r`$\infty^0$`], r`$0^{+\infty}=e^{+\infty\cdot\log 0^+}=e^{-\infty}=0$.`],
  [2, r`As $x\to0$, the function $\sin(x^2)$ is an infinitesimal of order`, r`$2$`, [r`$1$`, r`$3$`, r`$4$`], r`$\sin(x^2)\sim x^2$.`],
  [4, r`The line $y=mx+q$ is an oblique asymptote of $f$ at $+\infty$ if and only if`, r`$\lim_{x\to+\infty}\big(f(x)-mx-q\big)=0$`, [r`$\lim_{x\to+\infty}\frac{f(x)}{x}=m$`, r`$\lim_{x\to+\infty}f'(x)=m$`, r`$\lim_{x\to+\infty}\big(f(x)-mx\big)=0$`], r`$f(x)/x\to m$ is necessary but not sufficient: $q=\lim(f(x)-mx)$ must also exist finite.`],
  [4, r`If $\lim_{x\to+\infty}\frac{f(x)}{x}=2$, then`, r`$f$ may have no oblique asymptote`, [r`$y=2x$ is an asymptote of $f$`, r`$f$ has an oblique asymptote with slope $2$`, r`$\lim_{x\to+\infty}f(x)=2$`], r`Example: $f(x)=2x+\log x$ has $f(x)/x\to2$ but $f(x)-2x\to+\infty$.`],
  [2, r`The function $f(x)=\frac{\sin x}{x}$ ($x\neq0$) has at $x=0$`, r`a removable discontinuity`, [r`a jump discontinuity`, r`a discontinuity of the second kind`, r`a vertical asymptote`], r`$\lim_{x\to0}\frac{\sin x}{x}=1$ exists finite: define $f(0)=1$.`],
  [3, r`The function $f(x)=\arctan\frac1x$ has at $x=0$`, r`a jump discontinuity`, [r`a removable discontinuity`, r`a discontinuity of the second kind`, r`a vertical asymptote`], r`$\lim_{x\to0^\pm}f(x)=\pm\frac{\pi}{2}$: finite but different one-sided limits.`],
  [4, r`The function $f(x)=\sin\frac1x$ has at $x=0$`, r`a discontinuity of the second kind (the limit does not exist)`, [r`a removable discontinuity`, r`a jump discontinuity`, r`a vertical asymptote`], r`$\sin\frac1x$ oscillates between $-1$ and $1$ as $x\to0$.`],
  [3, r`If $f$ is continuous on an interval $I$, then $f(I)$ is`, r`an interval`, [r`a closed and bounded interval`, r`an open interval`, r`a finite set`], r`Intermediate value theorem. It is closed and bounded when $I=[a,b]$ (Weierstrass).`],
  [4, r`If $f$ is continuous on an open interval $(a,b)$, then`, r`$f$ may have neither a maximum nor a minimum`, [r`$f$ has a maximum and a minimum`, r`$f$ is bounded`, r`$f$ takes all values between $\lim_{a^+}f$ and $\lim_{b^-}f$, endpoints included`], r`Example: $f(x)=x$ on $(0,1)$, or $f(x)=1/x$ on $(0,1)$ (unbounded).`],
  [3, r`The derivative $f'(x_0)$ is`, r`the slope of the tangent line to the graph at $(x_0,f(x_0))$`, [r`the $y$-intercept of the tangent line`, r`the angle of the tangent line, in degrees`, r`the value of $f$ at $x_0$`], r`Geometric meaning of the derivative.`],
  [2, r`The tangent line to the graph of $f$ at $x_0$ has equation`, r`$y=f(x_0)+f'(x_0)(x-x_0)$`, [r`$y=f'(x_0)+f(x_0)(x-x_0)$`, r`$y=f(x_0)(x-x_0)$`, r`$y=f'(x_0)\,x+f(x_0)$`], r`Line through $(x_0,f(x_0))$ with slope $f'(x_0)$.`],
  [3, r`A stationary (critical) point of a differentiable function $f$ is a point where`, r`$f'(x_0)=0$`, [r`$f(x_0)=0$`, r`$f''(x_0)=0$`, r`$f$ is not differentiable`], r`Definition of stationary point.`],
  [4, r`If $f'(x)=0$ for every $x$ in an interval $I$, then`, r`$f$ is constant on $I$`, [r`$f=0$ on $I$`, r`$f$ is linear but not constant`, r`$f$ has a maximum but is not necessarily constant`], r`Consequence of Lagrange's theorem: $f(x)-f(y)=f'(c)(x-y)=0$.`],
  [4, r`If $f'(x)=0$ for every $x\in(-1,0)\cup(0,1)$, then`, r`$f$ is constant on each of the two intervals, possibly with different constants`, [r`$f$ is constant on $(-1,0)\cup(0,1)$`, r`$f=0$`, r`$f$ is not continuous`], r`Example: $f=\operatorname{sign}(x)$. The theorem holds on intervals only.`],
  [5, r`If $x_0$ is an interior local maximum point of $f$ and $f''(x_0)$ exists, then`, r`$f'(x_0)=0$ and $f''(x_0)\le0$`, [r`$f''(x_0)<0$`, r`$f'(x_0)<0$`, r`$f''(x_0)=0$`], r`Necessary conditions. $f''(x_0)<0$ is not necessary: $f(x)=-x^4$ has $f''(0)=0$.`],
  [5, r`If $f'(x_0)=0$ and $f''(x_0)>0$, then $x_0$ is`, r`a strict local minimum point`, [r`a local maximum point`, r`an inflection point`, r`a global minimum point`], r`Second-derivative test (Taylor: $f(x)-f(x_0)\sim\frac{f''(x_0)}{2}(x-x_0)^2>0$).`],
  [5, r`If $f$ is $n$ times differentiable at $x_0$ and $T_n$ is its Taylor polynomial, then $f(x)=T_n(x)+R_n(x)$ with`, r`$R_n(x)=o((x-x_0)^n)$ as $x\to x_0$`, [r`$R_n(x)=o((x-x_0)^{n+1})$`, r`$R_n(x)=0$`, r`$R_n(x)\to1$`], r`Taylor's formula with Peano remainder.`],
  [4, r`At an inflection point $x_0$ where $f$ is twice differentiable,`, r`$f''(x_0)=0$`, [r`$f'(x_0)=0$`, r`$f''(x_0)>0$`, r`$f$ is not differentiable`], r`$f''$ changes sign at $x_0$, hence it vanishes there (if it exists).`],
  [3, r`Which functions are certainly Riemann integrable on $[a,b]$?`, r`continuous functions and monotone functions`, [r`only continuous functions`, r`all bounded functions`, r`only differentiable functions`], r`The Dirichlet function is bounded but not integrable; monotone functions are integrable even if discontinuous.`],
  [3, r`Two primitives of the same function on an interval`, r`differ by a constant`, [r`are equal`, r`differ by a linear function`, r`have the same value at every point`], r`$(F-G)'=0$ on an interval implies $F-G$ constant.`],
  [4, r`For an integrable $f$ on $[a,b]$, $\left|\int_a^b f(x)\,dx\right|$ is`, r`$\le\int_a^b|f(x)|\,dx$`, [r`$=\int_a^b|f(x)|\,dx$`, r`$\ge\int_a^b|f(x)|\,dx$`, r`always $\le b-a$`], r`Triangle inequality for integrals; equality holds only if $f$ does not change sign.`],
  [4, r`If $F$ is a primitive of the continuous function $f$ on $[a,b]$, then $\int_a^b f(x)\,dx=$`, r`$F(b)-F(a)$`, [r`$F(a)-F(b)$`, r`$f(b)-f(a)$`, r`$F'(b)-F'(a)$`], r`Second fundamental theorem of calculus.`],
  [5, r`Let $f$ be continuous and $G(x)=\int_0^{x^2}f(t)\,dt$. Then $G'(x)=$`, r`$2x\,f(x^2)$`, [r`$f(x^2)$`, r`$f(2x)$`, r`$2x\,f(x)$`], r`Chain rule with the fundamental theorem: $G(x)=F(x^2)$, $F'=f$.`],
  [5, r`If $\int_1^{+\infty}|f(x)|\,dx$ converges, then $\int_1^{+\infty}f(x)\,dx$`, r`converges`, [r`diverges`, r`may be undetermined`, r`has the same value`], r`Absolute convergence implies convergence (the converse is false).`],
  [5, r`If $0\le f\le g$ on $[a,+\infty)$ and $\int_a^{+\infty}f$ diverges, then $\int_a^{+\infty}g$`, r`diverges`, [r`converges`, r`may converge`, r`equals $0$`], r`Comparison test.`],
  [2, r`For $z\in\mathbb{C}$, the product $z\,\overline z$ equals`, r`$|z|^2$`, [r`$|z|$`, r`$z^2$`, r`$2\operatorname{Re}z$`], r`$(a+ib)(a-ib)=a^2+b^2$.`],
  [3, r`For $z\in\mathbb{C}$, $\overline z=z$ if and only if`, r`$z$ is real`, [r`$z$ is purely imaginary`, r`$|z|=1$`, r`$z=0$`], r`$a-ib=a+ib\iff b=0$.`],
  [4, r`For $z_1,z_2\in\mathbb{C}$, $|z_1z_2|$ equals`, r`$|z_1|\,|z_2|$`, [r`$|z_1|+|z_2|$`, r`$|z_1+z_2|$`, r`$|z_1|^2|z_2|$`], r`Moduli multiply and arguments add.`],
  [5, r`The sum of the $n$ complex $n$-th roots of unity ($n\ge2$) is`, r`$0$`, [r`$1$`, r`$n$`, r`$-1$`], r`They are the roots of $z^n-1$, whose coefficient of $z^{n-1}$ is $0$ (or: they form a regular polygon centred at the origin).`],
  [3, r`$e^{i\pi}$ equals`, r`$-1$`, [r`$1$`, r`$i$`, r`$0$`], r`$\cos\pi+i\sin\pi=-1$.`],
  [4, r`The general solution of $y'=ky$ ($k$ constant) is`, r`$y=Ce^{kx}$, $C\in\mathbb{R}$`, [r`$y=e^{kx}+C$`, r`$y=kx+C$`, r`$y=Ce^{x/k}$`], r`Linear equation with constant coefficient.`],
  [5, r`The constant solutions of $y'=y(1-y)$ are`, r`$y=0$ and $y=1$`, [r`only $y=0$`, r`only $y=1$`, r`there are none`], r`Constant solutions of a separable equation are the zeros of $b(y)=y(1-y)$.`],
  [5, r`The set of solutions of $y''+py'+qy=0$ is`, r`a vector space of dimension $2$`, [r`a single function`, r`a vector space of dimension $1$`, r`an infinite-dimensional space`], r`Linear homogeneous second-order equation: two linearly independent solutions generate all.`],
  [6, r`For $y''+y=\sin x$, a particular solution must be sought in the form`, r`$x(A\cos x+B\sin x)$`, [r`$A\sin x$`, r`$A\cos x+B\sin x$`, r`$Ae^{x}$`], r`$\pm i$ are roots of $\lambda^2+1$: resonance, multiply by $x$.`],
  [6, r`Which sequence is <b>not</b> convergent?`, r`$a_n=(-1)^n$`, [r`$a_n=\frac{(-1)^n}{n}$`, r`$a_n=\left(1+\frac1n\right)^n$`, r`$a_n=\frac{n}{n+1}$`], r`$(-1)^n$ oscillates between $-1$ and $1$; the others tend to $0$, $e$ and $1$.`],
  [4, r`$\lim_{n\to\infty}\left(1+\frac1n\right)^n$ equals`, r`$e$`, [r`$1$`, r`$+\infty$`, r`$0$`], r`Definition of the number $e$ (indeterminate form $1^\infty$).`],
  [6, r`If $f$ is continuous on $[a,b]$ ($a<b$) and $f(x)>0$ for all $x$, then $\int_a^b f(x)\,dx$`, r`is strictly positive`, [r`may be zero`, r`may be negative`, r`equals $f(b)-f(a)$`], r`By Weierstrass $f\ge m>0$, so the integral is $\ge m(b-a)>0$.`],
];
function texify(s) { return s.replace(/\$([^$]+)\$/g, (_, a) => m(a)); }
const THX = TH.map(([lv, q, a, w, e]) => [lv, texify(q), texify(a), w.map(texify), texify(e)]);
function taylorCoef(L) {
  const a = rnd.int(-3, 3), b = rnd.nz(-4, 4), c = rnd.nz(-4, 4);
  const st = (f0, f1, f2) => opt(m(`f(0)=${f0},\\ f'(0)=${f1},\\ f''(0)=${f2}`), null, [f0, f1, f2].join());
  return mk('theory', L, `Let ${m(`f(x)=${polyTex([a, b, c], false)}+o(x^2)`)} as ${m(r`x\to 0`)}, with ${m('f')} of class ${m('C^2')}. Then`, st(a, b, 2 * c), [st(a, b, c), st(a, -b, 2 * c), st(a, b, F(c, 2).tex()), st(a, 2 * b, 2 * c)], `By uniqueness of the Taylor expansion, ${m(r`f(0)=${a}`)}, ${m(`f'(0)=${b}`)} and ${m(r`\frac{f''(0)}{2}=${c}`)}.`);
}
function theory(L, exclude) {
  if (L >= 5 && rnd.chance(0.2)) return taylorCoef(L);
  let pool = THX.map((t, i) => [t, i]).filter(([t, i]) => Math.abs(t[0] - L) <= 1 && !(exclude && exclude.has(i)));
  if (!pool.length) pool = THX.map((t, i) => [t, i]).filter(([, i]) => !(exclude && exclude.has(i)));
  const [[lv, q, a, w, e], idx] = rnd.pick(pool); void lv;
  const qq = mk('theory', L, q, a, w, e);
  qq.thId = idx; return qq;
}

/* =====================================================================
   TOPICS & EXAMS
   ===================================================================== */
const TOPICS = [
  { id: 'sets', name: 'Sets, logic, sup / inf', gen: genSets },
  { id: 'functions', name: 'Functions: domain, parity, inverse', gen: genFunctions },
  { id: 'limits', name: 'Limits of functions and sequences', gen: genLimits },
  { id: 'asymptotics', name: 'Landau symbols, Taylor, principal part', gen: genAsym },
  { id: 'derivatives', name: 'Derivatives', gen: deriv },
  { id: 'nondiff', name: 'Non-differentiability points', gen: nondiff },
  { id: 'study', name: 'Study of a function', gen: study },
  { id: 'integrals', name: 'Primitives and definite integrals', gen: integral },
  { id: 'improper', name: 'Improper integrals', gen: improper },
  { id: 'intfunc', name: 'Integral functions (FTC)', gen: intfunc },
  { id: 'complex', name: 'Complex numbers', gen: complexQ },
  { id: 'ode1', name: 'First-order ODEs', gen: ode1 },
  { id: 'ode2', name: 'Second-order linear ODEs', gen: ode2 },
  { id: 'theory', name: 'Theory (definitions & theorems)', gen: theory },
];
const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));
function generate(topicId, level, extra) {
  const t = TOPICS.find(x => x.id === topicId); let lastErr;
  for (let i = 0; i < 80; i++) { try { const q = t.gen(level, extra); q.topicName = t.name; return q; } catch (e) { lastErr = e; } }
  throw lastErr;
}
const EXAM_LAYOUT = ['sets', 'functions', 'limits', 'asymptotics', 'derivatives', 'nondiff', 'study', 'integrals', 'improper', 'intfunc', 'complex', 'ode1', 'ode2', 'theory', 'theory'];
function levelFor(diff) { return diff === 'random' ? rnd.int(1, 6) : Number(diff); }
function generateExam(diff) {
  const used = new Set();
  return EXAM_LAYOUT.map(id => { const q = generate(id, levelFor(diff), used); if (q.thId != null) used.add(q.thId); return q; });
}
function generatePractice(topicId, n, diff) {
  const used = new Set(); const out = [];
  for (let i = 0; i < n; i++) { const id = topicId === 'mixed' ? rnd.pick(EXAM_LAYOUT) : topicId; const q = generate(id, levelFor(diff), used); if (q.thId != null) used.add(q.thId); out.push(q); }
  return out;
}

function randInf(L) {
  for (let t = 0; t < 60; t++) {
    let N;
    try { N = L >= 5 ? cancelPair(L >= 6) : minusHead(A(rnd.pick(['exp', 'sin', 'cos', 'log1p', 'atan', 'sqrt1p']), X(rnd.pick([1, 2]))), 1); } catch (e) { continue; }
    const k = sOrder(N.ser); if (k >= 2 && k <= 4) return { tex: N.tex, c: N.ser[k], k };
  }
  throw new Error('randInf');
}
G.Core = { rnd, Fr, F, m, dm, mk, opt, same, pickByLevel, near, simpson, iv, joinTerms, polyTex, mono, piTex, plusConst, sgnTerm, INF, MINF, fact };
G.Engine = { TOPICS, TOPIC_NAME, generate, randInf, generateExam, generatePractice, Fr, F, rnd, m, dm, mono, polyTex, piTex, iv, simpson, near, joinTerms, plusConst, sgnTerm, EXAM_LAYOUT };
})(typeof window !== 'undefined' ? window : globalThis);
