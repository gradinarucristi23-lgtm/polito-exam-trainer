/* Written exam generators: Analisi I (function study + theory), Chemistry (exercises + theory), Computer Sciences (theory short answers + programming, exam and midterm). */
(function (G) {
'use strict';
const C = G.Core; const { rnd, F, m, iv, plusConst, sgnTerm, INF, MINF, piTex } = C; const r = String.raw;
const dm = s => '\\[' + s + '\\]';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xm = a => (a === 0 ? 'x' : `x${plusConst(-a)}`);

/* ---------------- SVG plot ---------------- */
function plotSVG(sp) {
  const W = 560, H = 340, pd = 28, { f, x0, x1, y0, y1 } = sp;
  const X = x => pd + (x - x0) / (x1 - x0) * (W - 2 * pd), Y = y => H - pd - (y - y0) / (y1 - y0) * (H - 2 * pd);
  let d = '', pen = false, prev = null; const N = 900, span = y1 - y0;
  for (let i = 0; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N;
    if ((sp.breaks || []).some(b => Math.abs(x - b) < (x1 - x0) / N * 1.5)) { pen = false; continue; }
    const y = f(x); if (!isFinite(y)) { pen = false; continue; }
    const yc = Math.max(y0 - span * 0.1, Math.min(y1 + span * 0.1, y));
    if (pen && prev !== null && Math.abs(yc - prev) > span * 0.6) pen = false;
    d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(yc).toFixed(1) + ' '; pen = true; prev = yc;
  }
  let g = '';
  if (y0 < 0 && y1 > 0) g += `<line x1="${pd - 6}" y1="${Y(0)}" x2="${W - pd + 6}" y2="${Y(0)}" style="stroke:currentColor;opacity:.55"/><text x="${W - pd + 2}" y="${Y(0) - 6}" style="fill:currentColor;font-size:12px">x</text>`;
  if (x0 < 0 && x1 > 0) g += `<line x1="${X(0)}" y1="${H - pd + 6}" x2="${X(0)}" y2="${pd - 8}" style="stroke:currentColor;opacity:.55"/><text x="${X(0) + 6}" y="${pd - 2}" style="fill:currentColor;font-size:12px">y</text>`;
  for (const a of sp.asy || []) {
    if (a.v != null) g += `<line x1="${X(a.v)}" y1="${pd - 4}" x2="${X(a.v)}" y2="${H - pd + 4}" style="stroke:currentColor;stroke-dasharray:5 5;opacity:.6"/>`;
    if (a.h != null) g += `<line x1="${pd}" y1="${Y(a.h)}" x2="${W - pd}" y2="${Y(a.h)}" style="stroke:currentColor;stroke-dasharray:5 5;opacity:.6"/>`;
    if (a.m != null) { const xa = a.from ?? x0, xb = a.to ?? x1; g += `<line x1="${X(xa)}" y1="${Y(a.m * xa + a.q)}" x2="${X(xb)}" y2="${Y(a.m * xb + a.q)}" style="stroke:currentColor;stroke-dasharray:5 5;opacity:.6"/>`; }
  }
  for (const p of sp.pts || []) { if (p.y < y0 || p.y > y1) continue; g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" style="fill:${p.open ? 'var(--card)' : 'var(--bad)'};stroke:var(--bad)"/><text x="${X(p.x) + 5}" y="${Y(p.y) - 7}" style="fill:currentColor;font-size:12px">${esc(p.label || '')}</text>`; }
  return `<svg class="plot" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cp${sp.id}"><rect x="${pd}" y="${pd - 6}" width="${W - 2 * pd}" height="${H - 2 * pd + 12}"/></clipPath></defs>${g}<path d="${d}" clip-path="url(#cp${sp.id})" style="fill:none;stroke:var(--bad);stroke-width:2.4"/></svg>`;
}
let plotId = 0;
const plot = sp => plotSVG({ ...sp, id: ++plotId + '_' + Math.floor(Math.random() * 1e6) });

/* =====================================================================
   ANALISI I
   ===================================================================== */
const PA = 'Find the domain, possible symmetries, the limits at the endpoints of the domain and the asymptotes (if any).';
const PB = 'Study continuity and differentiability, classify the points of non-differentiability (if any) and compute ' + m("f'") + '.';
const PC = 'Find the monotonicity intervals and the extremum points of ' + m('f') + ', specifying whether they are local or global.';
const PD = 'Sketch a qualitative graph of ' + m('f') + '.';
function ex1(L) {
  const fams = L <= 1 ? [f1, f2] : L === 2 ? [f1, f2, f3] : L === 3 ? [f3, f4] : L === 4 ? [f4, f5] : L === 5 ? [f5, f6, f7] : [f6, f7, f8];
  const fm = rnd.pick(fams)();
  return { title: 'Exercise 1', points: 9, intro: 'Consider the function ' + dm('f(x)=' + fm.f) , parts: [
    { q: PA, pts: 2, sol: fm.a }, { q: PB, pts: 2, sol: fm.b }, { q: PC, pts: 2, sol: fm.c },
    { q: PD, pts: 1, sol: plot(fm.plot) + (fm.d || '') }, { q: fm.eq, pts: 2, sol: fm.e }] };
}
function f1() {
  const a = rnd.pick([1, 2]), b = rnd.pick([1, 2, 3]); const A_ = a === 1 ? '' : a; const mx = 4 * a * b;
  return { f: r`\frac{${A_}x^2}{x-${b}}`,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}\setminus\{${b}\}`)}; ${m('f')} is neither even nor odd. ${m(r`\lim_{x\to ${b}^{\pm}}f(x)=\pm\infty`)} (numerator → ${m(a * b * b)} > 0), so ${m('x=' + b)} is a vertical asymptote. ${m(r`\lim_{x\to\pm\infty}f(x)=\pm\infty`)}. Dividing: ${m(r`f(x)=${A_}(x+${b})+\frac{${a * b * b}}{x-${b}}`)}, hence ${m(`y=${A_}x+${a * b}`)} is an oblique asymptote at ${m(r`\pm\infty`)}.`,
    b: `${m('f')} is continuous and differentiable on its domain (quotient of polynomials). ${m(r`f'(x)=\frac{${a === 1 ? '' : a}x(x-${2 * b})}{(x-${b})^2}`)}. No points of non-differentiability.`,
    c: `${m("f'>0")} for ${m('x<0')} and ${m(`x>${2 * b}`)}, ${m("f'<0")} on ${m(`(0,${b})`)} and ${m(`(${b},${2 * b})`)}. Increasing on ${m(iv(MINF, 0, false, true))} and ${m(iv(2 * b, INF, true, false))}, decreasing on ${m(iv(0, b, true, false))} and ${m(iv(b, 2 * b, false, true))}. ${m('x=0')}: local maximum (${m('f(0)=0')}); ${m(`x=${2 * b}`)}: local minimum (${m(`f(${2 * b})=${mx}`)}). Neither is global (${m('f')} is unbounded).`,
    eq: `Determine, as ${m(r`k\in\mathbb{R}`)} varies, the number of solutions of ${m('f(x)=k')}.`,
    e: `From the graph: ${m('k<0')}: 2 solutions; ${m('k=0')}: 1; ${m(`0<k<${mx}`)}: none; ${m(`k=${mx}`)}: 1; ${m(`k>${mx}`)}: 2. (Image of ${m('f')}: ${m(iv(MINF, 0, false, true) + r`\cup` + iv(mx, INF, true, false))}.)`,
    plot: { f: x => a * x * x / (x - b), x0: -4 * b - 2, x1: 5 * b + 3, y0: -2.2 * mx, y1: 2.4 * mx, breaks: [b], asy: [{ v: b }, { m: a, q: a * b }], pts: [{ x: 0, y: 0, label: '0' }, { x: 2 * b, y: mx, label: `(${2 * b}, ${mx})` }] } };
}
function f2() {
  const q = rnd.pick([1, 2, 3]); const ex = q === 1 ? 'e^{-x}' : `e^{-x/${q}}`; const mxv = 4 * q * q * Math.exp(-2);
  return { f: 'x^2' + ex,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}`)}, no symmetry, ${m(r`f\ge 0`)}. ${m(r`\lim_{x\to-\infty}f=+\infty`)}, ${m(r`\lim_{x\to+\infty}f=0`)}: ${m('y=0')} is a horizontal asymptote at ${m(r`+\infty`)}. No oblique asymptote at ${m(r`-\infty`)} since ${m(r`f(x)/x\to-\infty`)}.`,
    b: `Continuous and differentiable on ${m(r`\mathbb{R}`)}: ${m(r`f'(x)=${q === 1 ? '' : r`\frac{1}{${q}}`}x(${2 * q}-x)${ex}`)}.`,
    c: `Decreasing on ${m(iv(MINF, 0, false, true))}, increasing on ${m(iv(0, 2 * q, true, true))}, decreasing on ${m(iv(2 * q, INF, true, false))}. ${m('x=0')} is the global minimum point (${m('f(0)=0')}); ${m(`x=${2 * q}`)} is a local maximum point, ${m(`f(${2 * q})=${4 * q * q}e^{-2}`)}, not global (${m(r`f\to+\infty`)} as ${m(r`x\to-\infty`)}).`,
    eq: `Compute ${m(r`\displaystyle\int_0^{+\infty}f(x)\,dx`)}.`,
    e: `Integrating by parts twice: ${m(r`\int_0^{+\infty}x^2${ex}\,dx=${2 * q}\int_0^{+\infty}x${ex}\,dx=${2 * q * q}\int_0^{+\infty}${ex}\,dx=${2 * q ** 3}`)} (the boundary terms vanish because the exponential dominates the powers).`,
    plot: { f: x => x * x * Math.exp(-x / q), x0: -2.2 * q, x1: 9 * q, y0: -0.25 * mxv, y1: 2.6 * mxv, asy: [{ h: 0 }], pts: [{ x: 0, y: 0, label: 'O' }, { x: 2 * q, y: mxv, label: `${2 * q}` }] } };
}
function f3() {
  const a = rnd.int(-3, 1), b = a + rnd.pick([2, 4]); const mid = (a + b) / 2, d = b - a, low = Math.exp(-d * d / 4);
  return { f: `e^{-|(${xm(a)})(${xm(b)})|}`,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}`)}, ${m('0<f\\le 1')}; the graph is symmetric with respect to ${m('x=' + mid)}. ${m(r`\lim_{x\to\pm\infty}f(x)=0`)}: ${m('y=0')} is a horizontal asymptote.`,
    b: `${m('f')} is continuous. Let ${m(`g(x)=(${xm(a)})(${xm(b)})`)}: outside ${m(`[${a},${b}]`)} ${m(`f=e^{-g}`)}, ${m(`f'=-(2x${plusConst(-(a + b))})e^{-g}`)}; inside ${m(`f=e^{g}`)}, ${m(`f'=(2x${plusConst(-(a + b))})e^{g}`)}. At ${m('x=' + a)} and ${m('x=' + b)} the one-sided derivatives are ${m(r`\pm ${d}`)}: corner points.`,
    c: `Increasing on ${m(iv(MINF, a, false, true))} and ${m(iv(mid, b, true, true))}, decreasing on ${m(iv(a, mid, true, true))} and ${m(iv(b, INF, true, false))}. Global maxima at ${m('x=' + a)}, ${m('x=' + b)} (value 1); local minimum at ${m('x=' + mid)} with value ${m(`e^{-${F(d * d, 4).tex()}}`)}.`,
    eq: `Determine, as ${m(r`k\in\mathbb{R}`)} varies, the number of solutions of ${m('f(x)=k')}.`,
    e: `${m(r`k\le 0`)} or ${m('k>1')}: none; ${m(`0<k<e^{-${F(d * d, 4).tex()}}`)}: 2; ${m(`k=e^{-${F(d * d, 4).tex()}}`)}: 3; ${m(`e^{-${F(d * d, 4).tex()}}<k<1`)}: 4; ${m('k=1')}: 2.`,
    plot: { f: x => Math.exp(-Math.abs((x - a) * (x - b))), x0: a - 2.5, x1: b + 2.5, y0: -0.15, y1: 1.25, asy: [{ h: 0 }], pts: [{ x: a, y: 1, label: String(a) }, { x: b, y: 1, label: String(b) }, { x: mid, y: low, label: String(mid) }] } };
}
function f4() {
  const n = rnd.pick([1, 2, 3]), c = n * n + 1; const vmax = -n + c * Math.atan(n);
  return { f: `x-${c}\\arctan x`,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}`)}, ${m('f')} is odd. ${m(r`\lim_{x\to\pm\infty}f=\pm\infty`)}; since ${m(r`\arctan x\to\pm\frac{\pi}{2}`)}, the lines ${m(r`y=x-\frac{${c}\pi}{2}`)} (at ${m(r`+\infty`)}) and ${m(r`y=x+\frac{${c}\pi}{2}`)} (at ${m(r`-\infty`)}) are oblique asymptotes.`,
    b: `Differentiable on ${m(r`\mathbb{R}`)}: ${m(r`f'(x)=1-\frac{${c}}{1+x^2}=\frac{x^2-${n * n}}{1+x^2}`)}.`,
    c: `Increasing on ${m(iv(MINF, -n, false, true))} and ${m(iv(n, INF, true, false))}, decreasing on ${m(iv(-n, n, true, true))}. Local maximum at ${m('x=' + -n)} (${m(`f(-${n})=-${n}+${c}\\arctan ${n}`)}), local minimum at ${m('x=' + n)} (${m(`f(${n})=${n}-${c}\\arctan ${n}`)}); not global.`,
    eq: `Study the convexity of ${m('f')} and find its inflection points.`,
    e: `${m(r`f''(x)=\frac{${2 * c}x}{(1+x^2)^2}`)}: ${m('f')} is concave on ${m(iv(MINF, 0, false, true))}, convex on ${m(iv(0, INF, true, false))}; ${m('x=0')} is the only inflection point.`,
    plot: { f: x => x - c * Math.atan(x), x0: -4 * n - 4, x1: 4 * n + 4, y0: -2.6 * vmax - 3, y1: 2.6 * vmax + 3, asy: [{ m: 1, q: -c * Math.PI / 2 }, { m: 1, q: c * Math.PI / 2 }], pts: [{ x: -n, y: vmax, label: String(-n) }, { x: n, y: -vmax, label: String(n) }, { x: 0, y: 0, label: 'O' }] } };
}
function f5() {
  const a = rnd.pick([1, 2]); const crit = a === 1 ? 'e^{-2}' : 'e^{-1}'; const vm = 4 / (a * a * Math.E * Math.E);
  const I = a === 1 ? r`\frac{e^2-1}{4}` : r`\frac{5e^3-2}{27}`;
  return { f: a === 1 ? r`x\log^2 x` : r`x^2\log^2 x`,
    a: `${m(r`\mathrm{dom}\,f=(0,+\infty)`)}, ${m(r`f\ge 0`)}. ${m(r`\lim_{x\to 0^+}f(x)=0`)} (so ${m('f')} can be extended by continuity with ${m('f(0)=0')}), ${m(r`\lim_{x\to+\infty}f=+\infty`)}, and ${m(r`f(x)/x\to+\infty`)}: no asymptotes.`,
    b: `${m(a === 1 ? r`f'(x)=\log x\,(\log x+2)` : r`f'(x)=2x\log x\,(\log x+1)`)}. ${a === 1 ? `Since ${m(r`\lim_{x\to 0^+}f'(x)=+\infty`)}, the extension has a vertical tangent at ${m('x=0')} (right derivative ${m(r`+\infty`)}).` : `Since ${m(r`\lim_{x\to 0^+}f'(x)=0`)}, the extension is differentiable from the right at ${m('0')} with ${m("f'_+(0)=0")}.`}`,
    c: `Increasing on ${m(iv(0, crit, false, true))} and ${m(iv(1, INF, true, false))}, decreasing on ${m(iv(crit, 1, true, true))}. ${m('x=1')} is the global minimum point (${m('f(1)=0')}); ${m('x=' + crit)} is a local maximum point with value ${m(a === 1 ? '4e^{-2}' : 'e^{-2}')}, not global.`,
    eq: `Compute ${m(r`\displaystyle\int_1^{e}f(x)\,dx`)}.`,
    e: `By parts twice (${m(r`\int x^{n}\log x\,dx=\frac{x^{n+1}}{n+1}\log x-\frac{x^{n+1}}{(n+1)^2}`)}): ${m(r`\int_1^e ${a === 1 ? 'x' : 'x^2'}\log^2x\,dx=${I}`)}.`,
    plot: { f: x => Math.pow(x, a) * Math.log(x) ** 2, x0: -0.3, x1: 3.2, y0: -0.3, y1: Math.max(2.2, 6 * vm), pts: [{ x: 1, y: 0, label: '1' }, { x: a === 1 ? Math.exp(-2) : Math.exp(-1), y: vm, label: crit.replace(/[{}]/g, '') }, { x: 0, y: 0, open: true, label: '' }] } };
}
function f6() {
  const a = rnd.pick([3, 6]), b = rnd.pick([1, 2, 3]); const x0 = b + a / 3; const k = a / 3;
  const v0 = Math.exp(-x0 / a) * Math.cbrt(k); const fn = x => Math.exp(-x / a) * Math.cbrt(x - b);
  const e0 = `e^{-${F(x0, a).tex()}}${k === 1 ? '' : r`\sqrt[3]{2}`}`, e1 = `e^{-${F(x0 + 1, a).tex()}}\\sqrt[3]{${k + 1}}`;
  return { f: `e^{-x/${a}}\\sqrt[3]{x-${b}}`,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}`)}, no symmetry; ${m('f>0')} for ${m(`x>${b}`)}, ${m('f<0')} for ${m(`x<${b}`)}. ${m(r`\lim_{x\to-\infty}f=-\infty`)}, ${m(r`\lim_{x\to+\infty}f=0`)}: ${m('y=0')} is a horizontal asymptote at ${m(r`+\infty`)}; no oblique asymptote at ${m(r`-\infty`)} because ${m(r`f(x)/x\to+\infty`)}.`,
    b: `Continuous on ${m(r`\mathbb{R}`)}, differentiable for ${m(r`x\neq ${b}`)}: ${m(r`f'(x)=\frac{e^{-x/${a}}(${a + 3 * b}-3x)}{${3 * a}\sqrt[3]{(x-${b})^2}}`)}. Since ${m(r`\lim_{x\to ${b}}f'(x)=+\infty`)}, ${m('x=' + b)} is a point with vertical tangent (inflection).`,
    c: `${m("f'>0")} for ${m(`x<${x0}`)} (${m(r`x\neq ${b}`)}), ${m("f'<0")} for ${m(`x>${x0}`)}: increasing on ${m(iv(MINF, x0, false, true))}, decreasing on ${m(iv(x0, INF, true, false))}. ${m('x=' + x0)} is the global maximum point, ${m(`f(${x0})=${e0}`)}.`,
    eq: `Compute sup and inf of ${m(r`A=\left\{f\left(${x0}+\frac{1}{n}\right): n\in\mathbb{N},\ n\ge 1\right\}`)}, saying whether they are max and min.`,
    e: `${m('f')} is strictly decreasing on ${m(iv(x0, INF, true, false))} and ${m(`${x0}+\\frac1n`)} decreases with ${m('n')}, so the sequence ${m(`f(${x0}+\\frac1n)`)} is strictly increasing: ${m(`\\min A=f(${x0 + 1})=${e1}`)}, ${m(`\\sup A=f(${x0})=${e0}`)}, not attained (no maximum).`,
    plot: { f: fn, x0: b - 6, x1: x0 + 13, y0: -2.2, y1: Math.max(1.6 * v0, 0.9), asy: [{ h: 0 }], pts: [{ x: b, y: 0, label: String(b) }, { x: x0, y: v0, label: String(x0) }] } };
}
function f7() {
  const a = rnd.pick([1, 2, 3]); const ex = a === 1 ? 'e^{1/x}' : `e^{${a}/x}`; const v = a * Math.E;
  return { f: 'x\\,' + ex,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}\setminus\{0\}`)}, no symmetry. ${m(r`\lim_{x\to 0^+}f=+\infty`)} (vertical asymptote ${m('x=0')} from the right), ${m(r`\lim_{x\to 0^-}f=0`)}. ${m(r`\lim_{x\to\pm\infty}f=\pm\infty`)} and ${m(`f(x)=x+${a}+o(1)`)}: ${m(`y=x+${a}`)} is an oblique asymptote at both ${m(r`\pm\infty`)}.`,
    b: `Differentiable on the domain: ${m(`f'(x)=${ex}\\left(1-\\frac{${a}}{x}\\right)=${ex}\\,\\frac{x-${a}}{x}`)}.`,
    c: `Increasing on ${m(iv(MINF, 0, false, false))} and on ${m(iv(a, INF, true, false))}, decreasing on ${m(iv(0, a, false, true))}. ${m('x=' + a)} is a local minimum point with ${m(`f(${a})=${a === 1 ? '' : a}e`)}; it is not global since ${m('f<0')} on ${m(r`(-\infty,0)`)}. No maximum points.`,
    eq: `Find the image of ${m('f')}.`,
    e: `On ${m(r`(-\infty,0)`)} ${m('f')} increases from ${m(r`-\infty`)} to ${m('0')} (not attained); on ${m(r`(0,+\infty)`)} its minimum is ${m(`${a === 1 ? '' : a}e`)}. Image: ${m(r`(-\infty,0)\cup[${a === 1 ? '' : a}e,+\infty)`)}.`,
    plot: { f: x => x * Math.exp(a / x), x0: -5 * a, x1: 5 * a, y0: -5 * a, y1: 5 * a + 3 * a, breaks: [0], asy: [{ v: 0 }, { m: 1, q: a }], pts: [{ x: a, y: v, label: `(${a}, ${a === 1 ? '' : a}e)` }] } };
}
function f8() {
  const a = rnd.pick([1, 2, 3]);
  return { f: `\\sqrt{|x^2-${a * a}|}`,
    a: `${m(r`\mathrm{dom}\,f=\mathbb{R}`)}, ${m('f')} is even and ${m(r`f\ge 0`)}. ${m(r`\lim_{x\to\pm\infty}f=+\infty`)}; since ${m(r`f(x)=|x|\sqrt{1-\frac{${a * a}}{x^2}}=|x|+o(1)`)}, the lines ${m('y=x')} (at ${m(r`+\infty`)}) and ${m('y=-x')} (at ${m(r`-\infty`)}) are oblique asymptotes.`,
    b: `Continuous on ${m(r`\mathbb{R}`)}; ${m(r`f'(x)=\frac{x}{\sqrt{x^2-${a * a}}}`)} for ${m(`|x|>${a}`)}, ${m(r`f'(x)=\frac{-x}{\sqrt{${a * a}-x^2}}`)} for ${m(`|x|<${a}`)}. At ${m(r`x=\pm ${a}`)} the one-sided limits of ${m("f'")} are ${m(r`\pm\infty`)} with opposite signs: cusps.`,
    c: `Decreasing on ${m(iv(MINF, -a, false, true))} and ${m(iv(0, a, true, true))}, increasing on ${m(iv(-a, 0, true, true))} and ${m(iv(a, INF, true, false))}. ${m(r`x=\pm ${a}`)}: global minimum points (value 0); ${m('x=0')}: local, non-global maximum point (${m(`f(0)=${a}`)}).`,
    eq: `Determine, as ${m(r`k\in\mathbb{R}`)} varies, the number of solutions of ${m('f(x)=k')}.`,
    e: `${m('k<0')}: none; ${m('k=0')}: 2; ${m(`0<k<${a}`)}: 4; ${m(`k=${a}`)}: 3; ${m(`k>${a}`)}: 2.`,
    plot: { f: x => Math.sqrt(Math.abs(x * x - a * a)), x0: -3.2 * a, x1: 3.2 * a, y0: -0.4 * a, y1: 3 * a, asy: [{ m: 1, q: 0, from: 0 }, { m: -1, q: 0, to: 0 }], pts: [{ x: -a, y: 0, label: String(-a) }, { x: a, y: 0, label: String(a) }, { x: 0, y: a, label: String(a) }] } };
}
/* ---- exercise 2 (theory + application) ---- */
function ex2(L) {
  const fams = L <= 2 ? [e1, e2, e7, e8] : L <= 4 ? [e1, e2, e3, e4, e6, e7] : [e3, e5, e6, e9, e10];
  const e = rnd.pick(fams)();
  return { title: 'Exercise 2', points: 6, intro: e.intro || '', parts: e.parts.map(([q, sol]) => ({ q, pts: 2, sol })) };
}
function e1() {
  const a = rnd.int(2, 6), b = rnd.int(-3, 3), c = rnd.pick([1, 2, 3, 5, 6]); const top = b + a + rnd.int(2, 6);
  const S = Math.max(top, b + a), I = b - a;
  const cs = F(2 + c, 2), co = F(c - 1); const best = cs.val() >= co.val() ? cs : co;
  return { parts: [[`Give the definition of supremum of a nonempty set ${m(r`A\subseteq\mathbb{R}`)} and state the completeness property of ${m(r`\mathbb{R}`)}.`, `${m(r`S=\sup A`)} if ${m(r`a\le S\ \forall a\in A`)} and ${m(r`\forall\varepsilon>0\ \exists a\in A: a>S-\varepsilon`)} (S is the least upper bound). Completeness: every nonempty subset of ${m(r`\mathbb{R}`)} bounded above has a supremum in ${m(r`\mathbb{R}`)}.`],
    [`Find sup, inf, max, min (if they exist) of ${m(r`A=\left\{\frac{${a}}{n}${plusConst(b)}: n\in\mathbb{Z},\ n\neq 0\right\}\cup\{${top}\}`)}.`, `For ${m(r`n\ge1`)} the elements are in ${m(iv(b, b + a, false, true))}, for ${m(r`n\le -1`)} in ${m(iv(b - a, b, true, false))}. Hence ${m(`\\max A=\\sup A=${S}`)} (the extra element) and ${m(`\\min A=\\inf A=${I}`)} (attained at ${m('n=-1')}).`],
    [`Find sup and inf of ${m(r`B=\left\{(-1)^n+\frac{${c}}{n}: n\in\mathbb{N},\ n\ge 1\right\}`)}.`, `Even ${m('n')}: ${m(`1+\\frac{${c}}{n}`)}, largest ${m(cs.tex())} at ${m('n=2')}; odd ${m('n')}: ${m(`-1+\\frac{${c}}{n}`)}, largest ${m(co.tex())} at ${m('n=1')}, tending to ${m('-1')} from above. So ${m(`\\max B=${best.tex()}`)}, ${m(r`\inf B=-1`)} not attained (no minimum).`]] };
}
function e2() {
  const p = rnd.pick([1, 2, 3]), k = rnd.pick([3, 5]); const ep = p === 1 ? 'e^{x}' : `e^{${p}x}`;
  return { parts: [[`State the theorem of existence of zeros.`, `If ${m('f')} is continuous on ${m('[a,b]')} and ${m('f(a)f(b)<0')}, then there exists ${m(r`c\in(a,b)`)} with ${m('f(c)=0')}.`],
    [`Prove that ${m(`f(x)=${ep}+x^{${k}}`)} has exactly one zero in ${m(r`\mathbb{R}`)}.`, `${m('f')} is continuous and strictly increasing (sum of strictly increasing functions). ${m(r`\lim_{x\to-\infty}f=-\infty`)}, ${m(r`\lim_{x\to+\infty}f=+\infty`)}: by the zeros theorem (on a suitable interval, e.g. ${m('[-2,0]')}: ${m(`f(0)=1>0`)}, ${m(`f(-2)<0`)}) there is a zero, unique by strict monotonicity.`],
    [`${m('f')} is invertible. Find ${m(r`x_0`)} and ${m('m')} such that ${m(r`f^{-1}(x)=m(x-x_0)+o(x-x_0)`)} as ${m(r`x\to x_0`)}.`, `We need ${m('f^{-1}(x_0)=0')}, i.e. ${m('x_0=f(0)=1')}, and ${m(r`m=(f^{-1})'(1)=\frac{1}{f'(0)}=\frac{1}{${p}}`)}.`]] };
}
function e3() {
  const N = G.Engine.randInf(4 + rnd.int(0, 2)); const ct = N.c.tex(), k = N.k;
  return { parts: [[`Let ${m('f, g')} be defined near ${m('x_0')}. Give the definitions of ${m(r`f\sim g`)} and ${m('f=o(g)')} as ${m(r`x\to x_0`)}.`, `${m(r`f\sim g`)} if ${m(r`\lim_{x\to x_0}\frac{f(x)}{g(x)}=1`)}; ${m('f=o(g)')} if ${m(r`\lim_{x\to x_0}\frac{f(x)}{g(x)}=0`)} (with ${m(r`g\neq0`)} near ${m('x_0')}).`],
    [`Compute the principal part of ${m('f(x)=' + N.tex)} with respect to ${m('x')} as ${m(r`x\to 0`)}.`, `Using the fundamental Maclaurin expansions, ${m(`f(x)=${ct}x^{${k}}+o(x^{${k}})`)}: principal part ${m(`${ct}x^{${k}}`)}, order ${m(k)}.`],
    [`Study the convergence of ${m(r`\displaystyle\int_0^1\frac{f(x)}{x^{\alpha}}\,dx`)} as ${m(r`\alpha\in\mathbb{R}`)} varies.`, `Near ${m('0')} the integrand behaves like ${m(`${ct}\\,x^{${k}-\\alpha}`)}, which has constant sign. For ${m(r`\alpha\le ${k}`)} it is a proper (Riemann) integral; for ${m(r`\alpha>${k}`)} it is improper and converges iff ${m(r`\alpha-${k}<1`)}. Hence it converges iff ${m(r`\alpha<${k + 1}`)}.`]] };
}
function e4() {
  const k = rnd.int(1, 3), mm = rnd.int(0, 2); const d = mm + k + 1; const rhs = mm === 0 ? '1' : mm === 1 ? 'x' : 'x^2';
  return { parts: [[`Let ${m('a, b')} be continuous on an open interval ${m('I')}. Define a solution on ${m('I')} of ${m(r`y'+a(x)y=b(x)`)}.`, `A function ${m(r`\varphi:I\to\mathbb{R}`)} of class ${m('C^1')} such that ${m(r`\varphi'(x)+a(x)\varphi(x)=b(x)`)} for every ${m(r`x\in I`)}.`],
    [`Let ${m(r`\varphi`)} solve the Cauchy problem with ${m('y(x_0)=y_0')}. Assuming ${m(r`a(x_0)\neq0`)}, for which ${m('y_0')} is ${m('x_0')} a critical point of ${m(r`\varphi`)}?`, `${m(r`\varphi'(x_0)=b(x_0)-a(x_0)y_0=0`)} iff ${m(r`y_0=\frac{b(x_0)}{a(x_0)}`)}.`],
    [`Find the general integral on ${m(r`(0,+\infty)`)} of ${m(`y'+\\frac{${k === 1 ? '' : k}}{x}y=${rhs}`)}.`, `Multiply by ${m(`x^{${k}}`)}: ${m(`(x^{${k}}y)'=x^{${mm + k}}`)}, so ${m(`x^{${k}}y=\\frac{x^{${d}}}{${d}}+C`)} and ${m(`y(x)=\\frac{x^{${mm + 1}}}{${d}}+\\frac{C}{x^{${k}}}`)}, ${m(r`C\in\mathbb{R}`)}.`]] };
}
function e5() {
  const v = rnd.int(1, 3); const kk = rnd.int(1, 2);
  const V = [{ f: `(e^{x}\\sin x)\\,|x-${kk === 1 ? '' : kk}\\pi|`, x0: (kk === 1 ? '' : kk) + r`\pi`, diff: true, ext: false, why: `${m(r`e^{x}\sin x`)} vanishes at ${m('x_0')} and changes sign there, while ${m('|x-x_0|>0')}: ${m('f')} takes both signs near ${m('x_0')}, so ${m('x_0')} is not an extremum point.` },
    { f: `(1-\\cos x)\\,|x|`, x0: '0', diff: true, ext: true, why: `${m(r`f\ge 0=f(0)`)} everywhere: ${m('x_0=0')} is a (global) minimum point.` },
    { f: `(x-${v})\\,|x-${v}|`, x0: String(v), diff: true, ext: false, why: `${m('f<0')} for ${m(`x<${v}`)} and ${m('f>0')} for ${m(`x>${v}`)}: not an extremum point.` },
    { f: `(x-${v})^2\\,|x-${v}|`, x0: String(v), diff: true, ext: true, why: `${m(r`f\ge0=f(x_0)`)}: minimum point.` }][rnd.int(0, 3)];
  return { parts: [[`Give the definition of a function differentiable at ${m('x_0')}.`, `${m('f')} (defined in a neighbourhood of ${m('x_0')}) is differentiable at ${m('x_0')} if ${m(r`\lim_{x\to x_0}\frac{f(x)-f(x_0)}{x-x_0}`)} exists and is finite; its value is ${m("f'(x_0)")}.`],
    [`Let ${m('f(x)=' + V.f)}. Is ${m('f')} differentiable at ${m('x_0=' + V.x0)}?`, `${m('f(x_0)=0')} and ${m(r`\frac{f(x)-f(x_0)}{x-x_0}=g(x)\frac{|x-x_0|}{x-x_0}`)}, where ${m('g')} is the factor multiplying the absolute value: ${m(r`g(x)\to g(x_0)=0`)} and ${m(r`\left|\frac{|x-x_0|}{x-x_0}\right|=1`)}, so the quotient tends to ${m('0')} (infinitesimal times bounded). ${m('f')} is differentiable with ${m("f'(x_0)=0")}.`],
    [`Is ${m('x_0')} a local extremum point of ${m('f')}? Justify.`, V.ext ? 'Yes. ' + V.why : 'No. ' + V.why]] };
}
function e6() {
  const p = rnd.int(1, 3), q = p + rnd.int(0, 3); const conv = q - p > 1;
  return { parts: [[`Let ${m('f')} be continuous on ${m(r`[a,+\infty)`)}. Define the convergence of ${m(r`\int_a^{+\infty}f(x)\,dx`)}.`, `It converges if ${m(r`\lim_{c\to+\infty}\int_a^c f(x)\,dx`)} exists and is finite.`],
    [`Prove that if ${m(r`f\ge0`)} the integral cannot be undetermined.`, `${m(r`F(c)=\int_a^c f`)} is increasing (for ${m('c_1<c_2')}, ${m(r`F(c_2)=F(c_1)+\int_{c_1}^{c_2}f\ge F(c_1)`)}); a monotone function has a limit as ${m(r`c\to+\infty`)}, finite or ${m(r`+\infty`)}.`],
    [`Study ${m(`\\displaystyle\\int_1^{+\\infty}\\frac{x^{${p}}+\\sin x}{x^{${q}}+1}\\,dx`)}.`, `For ${m(r`x\ge1`)} the integrand is ${m(r`\ge 0`)}, and ${m(`\\frac{x^{${p}}+\\sin x}{x^{${q}}+1}\\sim\\frac{1}{x^{${q - p}}}`)} as ${m(r`x\to+\infty`)}. By asymptotic comparison it ${conv ? 'converges' : 'diverges'}, because ${m(`${q - p}${conv ? '>' : r`\le`}1`)}.`]] };
}
function e7() {
  let a, b; do { a = rnd.nz(-4, 4); b = rnd.nz(-4, 4); } while (Math.abs(a) === Math.abs(b));
  const zt = `${a}${b > 0 ? '+' : '-'}${Math.abs(b) === 1 ? '' : Math.abs(b)}i`;
  return { parts: [[`Given ${m('z=' + zt)}, represent the set of ${m(r`w\in\mathbb{C}`)} such that ${m(r`\operatorname{Im}(z\,\overline{w})=0`)}.`, `With ${m('w=x+iy')}: ${m(`z\\overline{w}=(${zt})(x-iy)`)}, ${m(`\\operatorname{Im}(z\\overline w)=${b}x${a > 0 ? '-' : '+'}${Math.abs(a)}y`)}. The set is the line ${m(`${a}y=${b}x`)} through the origin.`],
    [`Repeat with ${m('z=a+ib\\neq0')} (${m('a,b')} real): what changes when ${m('a=0')}, ${m('b=0')}, or both are nonzero?`, `${m(r`\operatorname{Im}(z\overline w)=bx-ay=0`)}. ${m('a=0')}: the imaginary axis; ${m('b=0')}: the real axis; otherwise the line ${m(r`y=\frac{b}{a}x`)}.`],
    [`For ${m(r`\alpha\neq0`)} real, write ${m(r`z=\alpha+i|\alpha|`)} in exponential form.`, `${m(r`|z|=|\alpha|\sqrt2`)}. If ${m(r`\alpha>0`)}: ${m(r`z=\alpha\sqrt2\,e^{i\pi/4}`)}; if ${m(r`\alpha<0`)}: ${m(r`z=|\alpha|\sqrt2\,e^{i3\pi/4}`)}.`]] };
}
function e8() {
  const mq = rnd.int(2, 6), qq = rnd.int(1, 15);
  return { parts: [[`State Rolle's theorem.`, `If ${m('f')} is continuous on ${m('[a,b]')}, differentiable on ${m('(a,b)')} and ${m('f(a)=f(b)')}, then there exists ${m(r`c\in(a,b)`)} with ${m("f'(c)=0")}.`],
    [`Let ${m(r`f:\mathbb{R}\to\mathbb{R}`)} be of class ${m('C^2')} such that ${m(`f(x)=${mq}x+${qq}`)} has at least three distinct solutions. Prove that ${m("f''(c)=0")} for some ${m('c')}.`, `Let ${m(`h(x)=f(x)-${mq}x-${qq}`)}, with zeros ${m('x_1<x_2<x_3')}. Rolle on ${m('[x_1,x_2]')} and ${m('[x_2,x_3]')} gives ${m(r`h'(a)=h'(b)=0`)}, ${m('a<b')}; Rolle on ${m("h'")} over ${m('[a,b]')} gives ${m(r`h''(c)=0`)}. Since ${m(r`h''=f''`)}, done.`],
    [`Give an example of such a function ${m('f')} and the corresponding point ${m('c')}.`, `${m(`f(x)=${mq}x+${qq}+x^3-x`)}: the equation holds at ${m('x=0,\\pm1')} and ${m("f''(x)=6x")} vanishes at ${m('c=0')}.`]] };
}
function e9() {
  const k = rnd.pick([2, 8, 18]); const rt = F(1, Math.round(Math.sqrt(k / 2))).tex();
  return { parts: [[`Given continuous ${m('a, b')}, define a solution of the Cauchy problem ${m(r`y'=a(t)b(y)`)}, ${m('y(t_0)=y_0')}.`, `A differentiable ${m(r`y:I\to\mathbb{R}`)} (I open interval containing ${m('t_0')}) with ${m(r`y'(t)=a(t)b(y(t))`)} for all ${m(r`t\in I`)} and ${m('y(t_0)=y_0')}.`],
    [`Solve ${m(`y'=${k}\\,\\frac{\\log t}{t}\\,e^{y}`)}, ${m('y(1)=0')}.`, `Separating: ${m(`e^{-y}dy=${k}\\frac{\\log t}{t}dt`)}, so ${m(`-e^{-y}=${k / 2}\\log^2t+C`)}; ${m('y(1)=0')} gives ${m('C=-1')}: ${m(`y(t)=-\\log\\left(1-${k / 2}\\log^2 t\\right)`)}.`],
    [`Find the maximal interval of definition of the solution.`, `We need ${m(`1-${k / 2}\\log^2t>0`)}, i.e. ${m(`|\\log t|<${rt}`)}: ${m(`t\\in\\left(e^{-${rt}},e^{${rt}}\\right)`)}.`]] };
}
function e10() {
  const x0 = rnd.int(-3, 3); const xx = x0 === 0 ? 'x' : `x${plusConst(-x0)}`;
  return { parts: [[`State the comparison (squeeze) theorem for limits.`, `If ${m(r`f\le g\le h`)} in a punctured neighbourhood of ${m('x_0')} and ${m(r`\lim f=\lim h=L`)}, then ${m(r`\lim g=L`)}.`],
    [`Let ${m(r`g:\mathbb{R}\to\mathbb{R}`)} with ${m(`|g(x)|\\le|${xx}|`)} for all ${m('x')}. Show that ${m('g')} is continuous at ${m('x=' + x0)}.`, `${m(`g(${x0})=0`)}; ${m(`-|${xx}|\\le g(x)\\le|${xx}|`)} and both bounds tend to ${m('0')}: ${m(`\\lim_{x\\to ${x0}}g(x)=0=g(${x0})`)}.`],
    [`If instead ${m(`|g(x)|\\le(${xx})^2`)}, show that ${m('g')} is differentiable at ${m(String(x0))}.`, `${m(`g(${x0})=0`)} and ${m(`\\left|\\frac{g(x)-g(${x0})}{${xx}}\\right|\\le|${xx}|\\to0`)}: by the squeeze theorem ${m(`g'(${x0})=0`)}.`]] };
}
function writtenAnalisi(L) { return { title: 'Analisi I — written exam (practice)', max: 15, pass: 8, exercises: [ex1(L), ex2(L)] }; }

/* =====================================================================
   CHEMISTRY
   ===================================================================== */
function writtenChem(L) {
  const D = G.Chem.data; const { MM, balance, eqTex, sig, HF, dHr, RXN_H, R_ATM, NA, WEAK, COUPLES, FARADAY } = D; const T = t => t + 273.15;
  const U = (x, u, s = 3) => m(sig(x, s) + (u ? r`\ \mathrm{` + u + '}' : ''));
  const exs = [];
  // A: stoichiometry + gases
  { const fuel = rnd.pick(['CH4', 'C2H6', 'C3H8', 'C4H10', 'C2H5OH', 'CH3OH']); const mass = rnd.pick([10, 20, 25, 50, 100]); const tc = rnd.pick([25, 100, 150]); const P = rnd.pick([1, 1.5, 2]);
    const co = balance([fuel, 'O2'], ['CO2', 'H2O']); const n = mass / MM(fuel); const nO2 = n * co[1] / co[0], nCO2 = n * co[2] / co[0]; const V = nCO2 * R_ATM * T(tc) / P;
    exs.push({ title: 'Exercise 1 — stoichiometry and gases', points: 4, intro: `${m(mass + r`\ \mathrm{g}`)} of ${m(r`\ce{${fuel}}`)} burn completely in excess oxygen, producing ${m(r`\ce{CO2}`)} and ${m(r`\ce{H2O}`)}.`, parts: [
      { q: 'Write and balance the combustion reaction.', pts: 1, sol: m(r`\ce{` + eqTex([fuel, 'O2'], ['CO2', 'H2O'], co) + '}') },
      { q: `Compute the mass of ${m(r`\ce{O2}`)} consumed.`, pts: 1.5, sol: `${m(r`n(\ce{${fuel}})=\frac{${mass}}{${sig(MM(fuel), 4)}}=${sig(n)}\ \mathrm{mol}`)}; ${m(r`n(\ce{O2})=${sig(n)}\cdot\frac{${co[1]}}{${co[0]}}=${sig(nO2)}\ \mathrm{mol}`)}; ${m(r`m=${sig(nO2)}\cdot 32.00=`)} ${U(nO2 * 32, 'g')}.` },
      { q: `Compute the volume of ${m(r`\ce{CO2}`)} produced, measured at ${m(tc + r`\ ^\circ\mathrm{C}`)} and ${m(P + r`\ \mathrm{atm}`)}.`, pts: 1.5, sol: `${m(r`n(\ce{CO2})=${sig(nCO2)}\ \mathrm{mol}`)}; ${m(r`V=\frac{nRT}{P}=\frac{${sig(nCO2)}\cdot0.0821\cdot${T(tc)}}{${P}}=`)} ${U(V, 'L')}.` }] }); }
  // B: solutions & colligative
  { const [s, i] = rnd.pick([['NaCl', 2], ['CaCl2', 3], ['KNO3', 2], ['C6H12O6', 1], ['MgSO4', 2], ['K2SO4', 3]]); const mass = rnd.pick([5, 10, 15, 20, 30]); const w = rnd.pick([200, 250, 500]); const Vml = rnd.pick([200, 250, 500]);
    const n = mass / MM(s), b = n / (w / 1000), dT = i * 1.86 * b, c = n / (Vml / 1000), pi = i * c * R_ATM * 298.15;
    exs.push({ title: 'Exercise 2 — solutions', points: 4, intro: `${m(mass + r`\ \mathrm{g}`)} of ${m(r`\ce{${s}}`)} are dissolved in ${m(w + r`\ \mathrm{g}`)} of water; the final volume of the solution is ${m(Vml + r`\ \mathrm{mL}`)}. (${m(r`K_f(\ce{H2O})=1.86\ \mathrm{K\,kg\,mol^{-1}}`)}, ${i === 1 ? 'non-electrolyte' : 'strong electrolyte'})`, parts: [
      { q: 'Compute the molality and the molarity of the solution.', pts: 1, sol: `${m(r`n=\frac{${mass}}{${sig(MM(s), 4)}}=${sig(n)}\ \mathrm{mol}`)}; ${m(`b=\\frac{${sig(n)}}{${w / 1000}}=`)} ${U(b, 'mol/kg')}; ${m(`c=\\frac{${sig(n)}}{${Vml / 1000}}=`)} ${U(c, 'mol/L')}.` },
      { q: 'Compute the freezing point of the solution.', pts: 1.5, sol: `${m(`i=${i}`)}; ${m(r`\Delta T_f=iK_fb=${i}\cdot1.86\cdot${sig(b)}=${sig(dT)}\ \mathrm{K}`)}: the solution freezes at ${U(-dT, '^\\circ C')}.` },
      { q: `Compute its osmotic pressure at ${m(r`25\ ^\circ\mathrm{C}`)}.`, pts: 1.5, sol: `${m(r`\pi=icRT=${i}\cdot${sig(c)}\cdot0.0821\cdot298.15=`)} ${U(pi, 'atm')}.` }] }); }
  // C: thermochemistry
  { const [re, pr] = rnd.pick(RXN_H.slice(0, 10)); const co = balance(re, pr); const dH = dHr(re, pr, co); const mass = rnd.pick([10, 50, 100, 250]); const n = mass / MM(re[0]); const q = -dH / co[0] * n; const mw = q * 1000 / (4.184 * 60);
    const fu = re[0].replace(/\(.*\)/, '');
    exs.push({ title: 'Exercise 3 — thermochemistry', points: 4, intro: `Consider the combustion ${m(r`\ce{` + eqTex(re, pr, co) + '}')} (use the table of standard enthalpies of formation).`, parts: [
      { q: `Compute ${m(r`\Delta H^\circ`)} of the reaction as written.`, pts: 2, sol: `${m(r`\Delta H^\circ=\sum\nu\Delta H^\circ_f(\text{prod})-\sum\nu\Delta H^\circ_f(\text{reag})`)} ${m('=')} ${U(dH, 'kJ', 4)} (${pr.map((p, i) => `${co[re.length + i]}·(${HF[p] ?? 0})`).join(' + ')} − [${re.map((x, i) => `${co[i]}·(${HF[x] ?? 0})`).join(' + ')}]).` },
      { q: `Compute the heat released by the combustion of ${m(mass + r`\ \mathrm{g}`)} of ${m(r`\ce{${fu}}`)}.`, pts: 1, sol: `${m(r`n=\frac{${mass}}{${sig(MM(re[0]), 4)}}=${sig(n)}\ \mathrm{mol}`)}; ${m(r`q=n\cdot\frac{|\Delta H^\circ|}{${co[0]}}=`)} ${U(q, 'kJ')}.` },
      { q: `What mass of water could be heated from ${m(r`20`)} to ${m(r`80\ ^\circ\mathrm{C}`)} with this heat? (${m(r`c=4.184\ \mathrm{J\,g^{-1}K^{-1}}`)})`, pts: 1, sol: `${m(r`m=\frac{q}{c\Delta T}=\frac{${sig(q * 1000)}}{4.184\cdot60}=`)} ${U(mw, 'g')}.` }] }); }
  // D: acid-base / electrochemistry / equilibrium
  { const t = rnd.int(1, 3);
    if (t === 1) { const [a, Ka, nm] = rnd.pick(WEAK.slice(0, 5)); const c = rnd.pick([0.05, 0.1, 0.2]); const V = rnd.pick([50, 100]); const h = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2; const pH = -Math.log10(h); const nb = c * V / 2;
      exs.push({ title: 'Exercise 4 — acids and bases', points: 4, intro: `A ${m(c + r`\ \mathrm{M}`)} solution of ${nm} (${m(r`K_a=${sig(Ka, 2)}`)}) is prepared (${m(V + r`\ \mathrm{mL}`)}).`, parts: [
        { q: 'Compute its pH.', pts: 2, sol: `${m(r`K_a=\frac{x^2}{${c}-x}`)}: ${m(r`x=[\ce{H3O+}]=${sig(h)}\ \mathrm{M}`)}, ${m(`\\mathrm{pH}=${pH.toFixed(2)}`)}.` },
        { q: `Compute the pH after adding ${m(sig(nb) + r`\ \mathrm{mmol}`)} of ${m(r`\ce{NaOH}`)} (no volume change).`, pts: 2, sol: `Half of the acid is neutralized: ${m(r`[\ce{HA}]=[\ce{A-}]`)}, buffer with ${m(r`\mathrm{pH}=\mathrm{p}K_a=${(-Math.log10(Ka)).toFixed(2)}`)}.` }] }); }
    else if (t === 2) { let c1, a1; do { [c1, a1] = rnd.shuffle(COUPLES.slice(5)).slice(0, 2); } while (Math.abs(c1[2] - a1[2]) < 0.25 || c1[1] !== a1[1]); const [ca, an] = c1[2] > a1[2] ? [c1, a1] : [a1, c1]; const n = ca[1]; const E0 = ca[2] - an[2]; const G0 = -n * FARADAY * E0 / 1000; const cA = rnd.pick([0.01, 0.1, 1]), cC = rnd.pick([0.001, 0.01, 0.5]); const E = E0 - 0.0592 / n * Math.log10(cA / cC);
      const ion = s => `\\ce{${s[0]}^{${s[1] === 1 ? '' : s[1]}+}}`;
      exs.push({ title: 'Exercise 4 — electrochemistry', points: 4, intro: `A galvanic cell is built with a ${m(r`\ce{${an[0]}}`)} electrode in a ${m(cA + r`\ \mathrm{M}`)} solution of ${m(ion(an))} and a ${m(r`\ce{${ca[0]}}`)} electrode in a ${m(cC + r`\ \mathrm{M}`)} solution of ${m(ion(ca))} (25 °C).`, parts: [
        { q: 'Identify anode and cathode and write the cell reaction.', pts: 1, sol: `Cathode (reduction): ${m(r`\ce{${ca[0]}}`)} (${m(`E^\\circ=${ca[2]}\\ \\mathrm{V}`)}); anode (oxidation): ${m(r`\ce{${an[0]}}`)} (${m(`E^\\circ=${an[2]}\\ \\mathrm{V}`)}). ${m(r`\ce{${an[0]} + ${ca[0]}^{${n === 1 ? '' : n}+} -> ${an[0]}^{${n === 1 ? '' : n}+} + ${ca[0]}}`)}.` },
        { q: `Compute ${m(r`E^\circ`)} and ${m(r`\Delta G^\circ`)}.`, pts: 1.5, sol: `${m(r`E^\circ=${ca[2]}-(${an[2]})=`)} ${U(E0, 'V')}; ${m(r`\Delta G^\circ=-nFE^\circ`)} with ${m('n=' + n)}: ${U(G0, 'kJ')}.` },
        { q: 'Compute the emf of the cell at the given concentrations.', pts: 1.5, sol: `Nernst: ${m(r`E=E^\circ-\frac{0.0592}{${n}}\log\frac{${cA}}{${cC}}=`)} ${U(E, 'V')}.` }] }); }
    else { const a = rnd.pick([0.1, 0.2, 0.5]); const K = rnd.pick([9, 16, 25, 49]); const s = Math.sqrt(K); const x = a * s / (2 + s);
      exs.push({ title: 'Exercise 4 — chemical equilibrium', points: 4, intro: `${m(a + r`\ \mathrm{mol}`)} of ${m(r`\ce{H2}`)} and ${m(a + r`\ \mathrm{mol}`)} of ${m(r`\ce{I2}`)} are placed in a ${m(r`1.00\ \mathrm{L}`)} vessel at 450 °C: ${m(r`\ce{H2(g) + I2(g) <=> 2HI(g)}`)}, ${m(`K_c=${K}`)}.`, parts: [
        { q: 'Compute the equilibrium concentrations.', pts: 2.5, sol: `ICE: ${m(r`\frac{(2x)^2}{(${a}-x)^2}=${K}`)} → ${m(r`x=${sig(x)}`)}: ${m(`[\\ce{H2}]=[\\ce{I2}]=${sig(a - x)}`)}, ${m(`[\\ce{HI}]=${sig(2 * x)}\\ \\mathrm{M}`)}.` },
        { q: `Compute ${m('K_p')} and explain the effect of a pressure increase.`, pts: 1.5, sol: `${m(r`\Delta n=0`)}: ${m(`K_p=K_c=${K}`)}; a pressure change does not shift this equilibrium.` }] }); }
  }
  const THQ = [['Describe the four quantum numbers and the rules for their allowed values; how many orbitals and electrons correspond to n = 3?', 'n ≥ 1 (shell, energy/size); ℓ = 0…n−1 (subshell, shape); m<sub>ℓ</sub> = −ℓ…ℓ (orientation); m<sub>s</sub> = ±½ (spin). For n = 3: 9 orbitals (3s, three 3p, five 3d), 18 electrons. Pauli principle: no two electrons share all four numbers.'],
    ['Explain VSEPR theory and use it to predict the geometry of SF4 and XeF4.', 'Electron domains around the central atom arrange to minimise repulsion (lone pairs repel more than bonding pairs). SF4: 5 domains (4 bonds + 1 lone pair) → trigonal-bipyramidal electron geometry, seesaw shape. XeF4: 6 domains (4 + 2 lone pairs) → octahedral electron geometry, square planar shape.'],
    ['Draw the MO diagram of O2 and explain why it is paramagnetic. What is its bond order?', '12 valence electrons: σ2s² σ*2s² σ2p² π2p⁴ π*2p². The two electrons in the degenerate π* orbitals are unpaired (Hund) → paramagnetic. Bond order = (8 − 4)/2 = 2.'],
    ['Describe the periodic trends of atomic radius and first ionization energy, with their exceptions.', 'Radius decreases along a period (increasing effective nuclear charge) and increases down a group (new shells). IE increases along a period and decreases down a group; exceptions Be > B and Mg > Al (p electron easier to remove), N > O and P > S (electron pairing in p orbitals).'],
    ['Explain the difference between σ and π bonds and the concept of hybridization (sp, sp², sp³).', 'σ: head-on overlap along the bond axis (free rotation); π: side-by-side overlap of p orbitals (no rotation), present in double/triple bonds. Hybridization mixes atomic orbitals: sp (linear, 180°), sp² (trigonal planar, 120°), sp³ (tetrahedral, 109.5°).'],
    ['What are intermolecular forces? Explain how hydrogen bonding affects boiling points (e.g. H2O vs H2S).', 'London dispersion, dipole–dipole, hydrogen bonds (H bonded to N, O, F). H2O forms hydrogen bonds, so it boils at 100 °C while H2S (only dipole/dispersion) boils at −60 °C despite being heavier.'],
    ['Define the colligative properties and explain why a 0.1 m NaCl solution freezes at a lower temperature than a 0.1 m glucose solution.', 'Properties depending only on the number of solute particles: vapour-pressure lowering, boiling-point elevation, freezing-point depression, osmotic pressure. NaCl dissociates into 2 ions (i ≈ 2), so ΔT<sub>f</sub> is about twice that of glucose (i = 1).'],
    ["State Hess's law and explain why ΔH is a state function.", 'The enthalpy change of a reaction is the same whether it occurs in one step or several: ΔH of the overall reaction is the sum of the ΔH of the steps. Enthalpy depends only on the initial and final states, not on the path.'],
    ['Explain the meaning of ΔG and the conditions (signs of ΔH and ΔS) for spontaneity.', 'ΔG = ΔH − TΔS; spontaneous if ΔG < 0. ΔH<0, ΔS>0: always; ΔH>0, ΔS<0: never; ΔH<0, ΔS<0: at low T; ΔH>0, ΔS>0: at high T.'],
    ["State Le Chatelier's principle and apply it to N2 + 3H2 ⇌ 2NH3 (ΔH < 0).", 'A system at equilibrium responds to a perturbation by shifting to counteract it. Increasing P (or decreasing V) shifts towards NH3 (fewer moles of gas); increasing T shifts towards N2/H2 and lowers K (exothermic); removing NH3 shifts to the right.'],
    ['Describe a galvanic cell (anode, cathode, salt bridge) and how E°cell is computed from the table of potentials.', 'Oxidation at the anode (negative pole), reduction at the cathode (positive pole); the salt bridge closes the circuit keeping electroneutrality. E°cell = E°cathode − E°anode > 0 for a spontaneous cell; ΔG° = −nFE°.'],
    ['Define a Brønsted acid and base, conjugate pairs, and explain what a buffer is.', 'Acid: proton donor; base: proton acceptor; HA/A⁻ conjugate pair. A buffer contains a weak acid and its conjugate base in comparable amounts and resists pH changes; pH = pKa + log([A⁻]/[HA]).'],
    ['Describe the electron configuration rules (Aufbau, Pauli, Hund) and explain the configurations of Cr and Cu.', 'Orbitals fill in order of increasing energy (1s, 2s, 2p, 3s, 3p, 4s, 3d…), at most 2 electrons per orbital with opposite spins (Pauli), degenerate orbitals singly occupied first (Hund). Cr: [Ar]3d⁵4s¹ and Cu: [Ar]3d¹⁰4s¹ because half-filled/filled d subshells are extra stable.'],
    ['Explain the ideal gas model and the reasons for deviations of real gases (van der Waals equation).', 'Point-like particles without interactions, elastic collisions, PV = nRT. Real gases deviate at high P and low T: finite molecular volume (b) and intermolecular attractions (a): (P + an²/V²)(V − nb) = nRT.']];
  const th = rnd.shuffle(THQ).slice(0, 2);
  exs.push({ title: 'Theory questions', points: 6, intro: 'Answer in a clear and concise way (about 10 lines each).', parts: th.map(([q, a]) => ({ q, pts: 3, sol: '<b>Key points:</b> ' + a })) });
  return { title: 'Chemistry — written test (practice)', max: 22, pass: 12, exercises: exs };
}

/* =====================================================================
   COMPUTER SCIENCE (programming task)
   ===================================================================== */
const TASKS = [
  { lv: 1, title: 'Vowel and word counter', text: 'Write a program that asks the user for a line of text and prints (1) the number of words, (2) the number of vowels (a, e, i, o, u, upper or lower case) and (3) the longest word. Write and use the functions <code>count_vowels(s)</code> and <code>longest_word(words)</code>.', example: 'Input: <code>Mary had a little lamb</code><br>Output:<br><code>Words: 5</code><br><code>Vowels: 6</code><br><code>Longest word: little</code>',
    code: `def count_vowels(s):\n    n = 0\n    for ch in s:\n        if ch.lower() in "aeiou":\n            n += 1\n    return n\n\ndef longest_word(words):\n    best = ""\n    for w in words:\n        if len(w) > len(best):\n            best = w\n    return best\n\ndef main():\n    line = input("Text: ")\n    words = line.split()\n    print("Words:", len(words))\n    print("Vowels:", count_vowels(line))\n    print("Longest word:", longest_word(words))\n\nmain()` },
  { lv: 1, title: 'Bank balance', text: 'Write a function <code>balance(years, initial, rate)</code> that returns the balance of a bank account after the given number of years, crediting the annual interest (rate in percent) at the end of each year. Then write a program that reads the three values and prints the balance year by year with two decimals.', example: 'Input: <code>3</code>, <code>1000</code>, <code>5</code><br>Output: <code>Year 1: 1050.00</code> … <code>Year 3: 1157.63</code>',
    code: `def balance(years, initial, rate):\n    b = initial\n    for _ in range(years):\n        b = b * (1 + rate / 100)\n    return b\n\ndef main():\n    years = int(input("Years: "))\n    initial = float(input("Initial balance: "))\n    rate = float(input("Rate (%): "))\n    for y in range(1, years + 1):\n        print(f"Year {y}: {balance(y, initial, rate):.2f}")\n\nmain()` },
  { lv: 2, title: 'Prime numbers', text: 'Write a function <code>is_prime(n)</code> and use it to print all prime numbers between 2 and N (read from the user), 10 per line, and finally their count.', example: 'N = 30 → <code>2 3 5 7 11 13 17 19 23 29</code> and <code>Count: 10</code>',
    code: `def is_prime(n):\n    if n < 2:\n        return False\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            return False\n        d += 1\n    return True\n\ndef main():\n    n = int(input("N: "))\n    primes = [k for k in range(2, n + 1) if is_prime(k)]\n    for i in range(0, len(primes), 10):\n        print(" ".join(str(p) for p in primes[i:i + 10]))\n    print("Count:", len(primes))\n\nmain()` },
  { lv: 2, title: 'Palindromes and anagrams', text: 'Write <code>is_palindrome(s)</code> (ignoring spaces and case) and <code>are_anagrams(a, b)</code>. The program reads two strings and prints whether each is a palindrome and whether they are anagrams of each other.', example: '<code>Anna</code>, <code>naan</code> → both palindromes, anagrams',
    code: `def normalize(s):\n    return s.replace(" ", "").lower()\n\ndef is_palindrome(s):\n    t = normalize(s)\n    return t == t[::-1]\n\ndef are_anagrams(a, b):\n    return sorted(normalize(a)) == sorted(normalize(b))\n\ndef main():\n    a = input("First: ")\n    b = input("Second: ")\n    print(a, "palindrome:", is_palindrome(a))\n    print(b, "palindrome:", is_palindrome(b))\n    print("Anagrams:", are_anagrams(a, b))\n\nmain()` },
  { lv: 3, title: 'Roman numerals', text: 'Write a function <code>value(ch)</code> returning the value of a Roman digit and a function <code>roman_to_int(s)</code> converting a Roman numeral (e.g. MCMLXXVIII) to an integer: if a digit is smaller than the next one it is subtracted, otherwise added. Read numerals until the user enters an empty line.', example: '<code>MCMLXXVIII</code> → <code>1978</code>, <code>XIV</code> → <code>14</code>',
    code: `def value(ch):\n    return {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}[ch]\n\ndef roman_to_int(s):\n    total = 0\n    for i in range(len(s)):\n        v = value(s[i])\n        if i + 1 < len(s) and v < value(s[i + 1]):\n            total -= v\n        else:\n            total += v\n    return total\n\ndef main():\n    s = input("Roman numeral: ").strip().upper()\n    while s != "":\n        print(roman_to_int(s))\n        s = input("Roman numeral: ").strip().upper()\n\nmain()` },
  { lv: 3, title: 'Table statistics', text: 'The file <code>table.txt</code> contains a table of integers, one row per line, values separated by spaces. Read it into a list of lists and print the sum of each row, the sum of each column and the position (row, column) of the maximum element.', example: '<code>1 2 3</code> / <code>4 5 6</code> → rows <code>6 15</code>, columns <code>5 7 9</code>, max <code>6 at (1, 2)</code>',
    code: `def read_table(name):\n    table = []\n    with open(name) as f:\n        for line in f:\n            if line.strip():\n                table.append([int(x) for x in line.split()])\n    return table\n\ndef main():\n    t = read_table("table.txt")\n    print("Row sums:", [sum(r) for r in t])\n    cols = [sum(r[j] for r in t) for j in range(len(t[0]))]\n    print("Column sums:", cols)\n    best = (0, 0)\n    for i in range(len(t)):\n        for j in range(len(t[i])):\n            if t[i][j] > t[best[0]][best[1]]:\n                best = (i, j)\n    print("Max", t[best[0]][best[1]], "at", best)\n\nmain()` },
  { lv: 4, title: 'Students and grades', text: 'The file <code>grades.txt</code> contains one student per line: <code>surname;name;grade1;grade2;...</code> (variable number of grades). Print each student with the average (2 decimals), then the student with the highest average and the number of students with average ≥ 18. Handle the case of a missing file with a clear message.', example: '<code>Rossi;Anna;28;30;25</code> → <code>Rossi Anna 27.67</code>',
    code: `def main():\n    try:\n        f = open("grades.txt")\n    except FileNotFoundError:\n        print("File not found")\n        return\n    students = []\n    for line in f:\n        parts = line.strip().split(";")\n        if len(parts) < 3:\n            continue\n        grades = [int(g) for g in parts[2:]]\n        avg = sum(grades) / len(grades)\n        students.append((parts[0], parts[1], avg))\n    f.close()\n    for s in students:\n        print(f"{s[0]} {s[1]} {s[2]:.2f}")\n    best = max(students, key=lambda s: s[2])\n    print("Best:", best[0], best[1])\n    print("Passed:", len([s for s in students if s[2] >= 18]))\n\nmain()` },
  { lv: 4, title: 'Word frequencies', text: 'Read the text file <code>text.txt</code>, split it into words (lower case, removing punctuation <code>.,;:!?</code>), count the occurrences with a dictionary and print the 5 most frequent words with their counts, and the number of distinct words.', example: '<code>the: 12</code>, <code>of: 7</code>, …, <code>Distinct words: 154</code>',
    code: `def clean(word):\n    return word.strip(".,;:!?\\"'()").lower()\n\ndef main():\n    counts = {}\n    with open("text.txt") as f:\n        for line in f:\n            for w in line.split():\n                w = clean(w)\n                if w:\n                    counts[w] = counts.get(w, 0) + 1\n    ordered = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)\n    for w, c in ordered[:5]:\n        print(f"{w}: {c}")\n    print("Distinct words:", len(counts))\n\nmain()` },
  { lv: 5, title: 'Tic-tac-toe referee', text: 'A 3×3 board is stored as a list of 3 strings (e.g. <code>["XO.", ".X.", "O.X"]</code>, "." = empty). Write <code>winner(board)</code> returning "X", "O" or None, checking rows, columns and both diagonals, and <code>is_full(board)</code>. The program reads the 3 rows and prints the result ("X wins", "O wins", "Draw" or "Game in progress").', example: '<code>XXX</code> / <code>OO.</code> / <code>...</code> → <code>X wins</code>',
    code: `def winner(b):\n    lines = [b[i] for i in range(3)]\n    lines += ["".join(b[i][j] for i in range(3)) for j in range(3)]\n    lines.append(b[0][0] + b[1][1] + b[2][2])\n    lines.append(b[0][2] + b[1][1] + b[2][0])\n    for ln in lines:\n        if ln == "XXX":\n            return "X"\n        if ln == "OOO":\n            return "O"\n    return None\n\ndef is_full(b):\n    return all("." not in row for row in b)\n\ndef main():\n    board = [input(f"Row {i + 1}: ").strip().upper() for i in range(3)]\n    w = winner(board)\n    if w:\n        print(w, "wins")\n    elif is_full(board):\n        print("Draw")\n    else:\n        print("Game in progress")\n\nmain()` },
  { lv: 5, title: 'Inventory manager', text: 'Write a menu-driven program managing an inventory stored in a dictionary (product → quantity): <code>a</code> add a quantity, <code>r</code> remove a quantity (refuse if not enough), <code>p</code> print the products in alphabetical order, <code>q</code> quit. At the end save the inventory to <code>inventory.txt</code> as <code>product;quantity</code> lines.', example: '<code>a apple 10</code>, <code>r apple 3</code>, <code>p</code> → <code>apple 7</code>',
    code: `def main():\n    inv = {}\n    cmd = input("Command (a/r/p/q): ").strip()\n    while cmd != "q":\n        if cmd == "a":\n            name = input("Product: ")\n            qty = int(input("Quantity: "))\n            inv[name] = inv.get(name, 0) + qty\n        elif cmd == "r":\n            name = input("Product: ")\n            qty = int(input("Quantity: "))\n            if inv.get(name, 0) >= qty:\n                inv[name] -= qty\n            else:\n                print("Not enough", name)\n        elif cmd == "p":\n            for name in sorted(inv):\n                print(name, inv[name])\n        cmd = input("Command (a/r/p/q): ").strip()\n    with open("inventory.txt", "w") as f:\n        for name, qty in inv.items():\n            f.write(f"{name};{qty}\\n")\n\nmain()` },
  { lv: 6, title: 'Weather records', text: 'The file <code>weather.txt</code> contains lines <code>city,date,min,max</code> (temperatures as floats). Build a dictionary city → list of (date, min, max). For each city (alphabetical order) print the lowest minimum, the highest maximum with its date, and the average daily range (max − min). Finally print the city with the largest average range. Skip malformed lines, counting them.', example: '<code>Torino,2024-01-03,-2.5,6.0</code> …',
    code: `def main():\n    data = {}\n    bad = 0\n    with open("weather.txt") as f:\n        for line in f:\n            parts = line.strip().split(",")\n            try:\n                city, date = parts[0], parts[1]\n                tmin, tmax = float(parts[2]), float(parts[3])\n            except (IndexError, ValueError):\n                bad += 1\n                continue\n            data.setdefault(city, []).append((date, tmin, tmax))\n    best_city, best_range = None, -1\n    for city in sorted(data):\n        recs = data[city]\n        low = min(r[1] for r in recs)\n        hot = max(recs, key=lambda r: r[2])\n        avg = sum(r[2] - r[1] for r in recs) / len(recs)\n        print(f"{city}: min {low}, max {hot[2]} on {hot[0]}, avg range {avg:.1f}")\n        if avg > best_range:\n            best_city, best_range = city, avg\n    print("Largest average range:", best_city)\n    print("Malformed lines:", bad)\n\nmain()` },
  { lv: 6, title: 'Cinema reservations', text: 'A cinema hall has R rows and S seats per row, represented by a table (list of lists) of booleans. Read reservation requests from <code>requests.txt</code> (<code>row seat</code> per line, 1-based). Reject requests outside the hall or for already reserved seats, then print the hall map ("X" reserved, "." free), the occupancy percentage and the row with most free seats.', example: 'R = 5, S = 8 …',
    code: `def main():\n    r, s = 5, 8\n    hall = [[False] * s for _ in range(r)]\n    rejected = 0\n    with open("requests.txt") as f:\n        for line in f:\n            p = line.split()\n            if len(p) != 2:\n                rejected += 1\n                continue\n            i, j = int(p[0]) - 1, int(p[1]) - 1\n            if 0 <= i < r and 0 <= j < s and not hall[i][j]:\n                hall[i][j] = True\n            else:\n                rejected += 1\n    for row in hall:\n        print("".join("X" if x else "." for x in row))\n    taken = sum(row.count(True) for row in hall)\n    print(f"Occupancy: {100 * taken / (r * s):.1f}%")\n    free = [row.count(False) for row in hall]\n    print("Most free seats in row", free.index(max(free)) + 1)\n    print("Rejected:", rejected)\n\nmain()` },
];
/* ---------------- Computer Sciences (07JCJ): theory short answers + programming ---------------- */
const bits = (n, w) => n.toString(2).padStart(w || 0, '0');
const neg = x => String(x).replace('-', '−');
// Information-representation question with fresh numbers: the kinds asked in the past exams
// (github.com/polito-informatica/Esempi-esame, teoria/numeri.md).
const hx = n => (n & 255).toString(16).toUpperCase().padStart(2, '0');
const c2v = (n, w) => (n >= 2 ** (w - 1) ? n - 2 ** w : n);   // an n-bit pattern read in two's complement
function csNumQ(L, pts) {
  const k = rnd.pick(L <= 2 ? ['conv', 'range', 'nbits', 'hexval', 'c2'] : L <= 4 ? ['c2', 'sum', 'hexsum', 'order', 'hexval', 'cmp', 'base', 'conv', 'fp'] : ['fp', 'sum', 'hexsum', 'order', 'cmp', 'base']);
  if (k === 'conv') {
    const n = rnd.int(100, 999), b = bits(n), h = n.toString(16).toUpperCase(), o = n.toString(8);
    const g4 = bits(n, Math.ceil(b.length / 4) * 4).match(/.{4}/g).join(' '), g3 = bits(n, Math.ceil(b.length / 3) * 3).match(/.{3}/g).join(' ');
    const chk = h.split('').map((d, i) => `${parseInt(d, 16)}·16<sup>${h.length - 1 - i}</sup>`).join(' + ');
    return { pts, q: `Convert the decimal number <b>${n}</b> to binary, then convert the result to octal and to hexadecimal. Show the method.`,
      sol: `Divide by 2 repeatedly and read the remainders from the last one: ${n}<sub>10</sub> = <code>${b}</code><sub>2</sub>. Octal: group the bits by 3 from the right, <code>${g3}</code> → <b>${o}</b><sub>8</sub>. Hexadecimal: group them by 4, <code>${g4}</code> → <b>${h}</b><sub>16</sub> (check: ${chk} = ${n}). Full marks need the method, not only the result.` };
  }
  if (k === 'range') {
    const n = rnd.int(5, 10), H = 2 ** (n - 1);
    return { pts, q: `With <b>${n} bits</b>, what are the smallest and the largest value that can be represented in pure binary and in two's complement? Give each value in binary and in decimal.`,
      sol: `Pure binary: smallest <code>${'0'.repeat(n)}</code> = 0, largest <code>${'1'.repeat(n)}</code> = 2<sup>${n}</sup> − 1 = <b>${2 * H - 1}</b>. Two's complement: smallest <code>1${'0'.repeat(n - 1)}</code> = −2<sup>${n - 1}</sup> = <b>−${H}</b>, largest <code>0${'1'.repeat(n - 1)}</code> = 2<sup>${n - 1}</sup> − 1 = <b>${H - 1}</b>. (One more negative value than positive ones, because zero uses a pattern with sign bit 0.)` };
  }
  if (k === 'nbits') {
    const N = rnd.int(40, 5000), b = Math.ceil(Math.log2(N));
    return { pts, q: `How many different values can be represented with n bits? What is the minimum number of bits needed to give a different code to each of ${N} objects? Explain.`,
      sol: `With n bits there are 2<sup>n</sup> different combinations. We need the smallest n with 2<sup>n</sup> ≥ ${N}: 2<sup>${b - 1}</sup> = ${2 ** (b - 1)} is not enough, 2<sup>${b}</sup> = ${2 ** b} is, so <b>${b} bits</b>.` };
  }
  if (k === 'hexval') {
    const v = rnd.int(0x81, 0xFF), m = v & 127;
    return { pts, q: `The hexadecimal value <b>${hx(v)}</b> is one byte (8 bits). What is its decimal value read as (1) pure binary, (2) sign and magnitude, (3) two's complement?`,
      sol: `Each hex digit is 4 bits: ${hx(v)} = <code>${bits(v >> 4, 4)} ${bits(v & 15, 4)}</code>. (1) Pure binary: ${v >> 4}·16 + ${v & 15} = <b>${v}</b>. (2) Sign and magnitude: the first bit 1 means negative, the other 7 bits <code>${bits(m, 7)}</code> = ${m}, so <b>−${m}</b>. (3) Two's complement: first bit 1, so negative; value = ${v} − 256 = <b>−${256 - v}</b> (check: invert the bits and add 1 → <code>${bits(256 - v, 8)}</code> = ${256 - v}).` };
  }
  if (k === 'order') {
    const vals = [];
    while (vals.length < 6) {
      const v = rnd.pick([rnd.int(0, 127), rnd.int(128, 255), rnd.int(128, 255), rnd.pick([0x7F, 0x80, 0xFF, 0x01])]);
      if (!vals.some(x => Math.abs(c2v(x, 8)) === Math.abs(c2v(v, 8)))) vals.push(v);
    }
    const up = vals.slice().sort((a, b) => c2v(a, 8) - c2v(b, 8)), near = vals.reduce((a, b) => (Math.abs(c2v(b, 8)) < Math.abs(c2v(a, 8)) ? b : a));
    return { pts, q: `These hexadecimal values are 8-bit numbers in two's complement: <code>${vals.map(hx).join('&nbsp;&nbsp;')}</code>. (a) Write them in increasing order of value (decimal values are not required). (b) Which one is closest to zero?`,
      sol: `A first hex digit 8–F means sign bit 1 (negative, value = pattern − 256); 0–7 means positive or zero. Values: ${vals.map(v => `${hx(v)} = ${neg(c2v(v, 8))}`).join(', ')}. (a) <b>${up.map(hx).join(' &lt; ')}</b>. (b) <b>${hx(near)}</b> (${neg(c2v(near, 8))}). Tip: among the negatives, the larger the pattern, the closer to zero (FF = −1, 80 = −128).` };
  }
  if (k === 'cmp') {
    const wa = rnd.int(6, 8), wb = rnd.int(4, wa - 1), same = rnd.int(0, 2) === 0;
    const vb = same ? -rnd.int(1, 2 ** (wb - 1)) : rnd.int(-(2 ** (wb - 1)), 2 ** (wb - 1) - 1);
    const va = same ? vb : rnd.int(-(2 ** (wa - 1)), 2 ** (wa - 1) - 1);
    const A = bits(va & (2 ** wa - 1), wa), B = bits(vb & (2 ** wb - 1), wb), rel = va > vb ? 'A &gt; B' : va < vb ? 'A &lt; B' : 'A = B';
    return { pts, q: `A = <code>${A}</code> is in two's complement on ${wa} bits and B = <code>${B}</code> is in two's complement on ${wb} bits. Which relation holds: A &gt; B, A &lt; B or A = B? Explain.`,
      sol: `To compare them, bring B to ${wa} bits by repeating its sign bit (sign extension): B = <code>${bits(vb & (2 ** wa - 1), wa)}</code>. Values (a pattern with sign bit 1 is worth its pure-binary value minus 2<sup>n</sup>): A = ${neg(va)}, B = ${neg(vb)}. So <b>${rel}</b>.${va === vb ? ' The two patterns look different but are the same number.' : ''}` };
  }
  if (k === 'base') {
    if (rnd.int(0, 1)) {   // with a carry in the units: exactly one base works
      const b = rnd.int(5, 9); let a1, a0, c1, c0;
      do { a1 = rnd.int(1, b - 1); c1 = rnd.int(1, b - 1); a0 = rnd.int(1, b - 1); c0 = rnd.int(1, b - 1); } while (a0 + c0 < b || a1 + c1 + 1 >= b);
      const r1 = a1 + c1 + 1, r0 = a0 + c0 - b;
      return { pts, q: `In which base is the operation <b>${a1}${a0} + ${c1}${c0} = ${r1}${r0}</b> correct? Explain.`,
        sol: `In base β the digits are worth: (${a1}β + ${a0}) + (${c1}β + ${c0}) = ${r1}β + ${r0}, so ${a1 + c1}β + ${a0 + c0} = ${r1}β + ${r0} and <b>β = ${b}</b>. Check: in the units ${a0} + ${c0} = ${a0 + c0} = 1·${b} + ${r0}, a carry of 1 goes to the next digit (${a1} + ${c1} + 1 = ${r1}). Every digit is smaller than ${b}, so base ${b} is valid, and it is the only one.` };
    }
    let a1, a0, c1, c0;
    do { a1 = rnd.int(1, 4); c1 = rnd.int(1, 4); a0 = rnd.int(0, 4); c0 = rnd.int(0, 4); } while (a1 + c1 < 3 && a0 + c0 < 3);
    const r1 = a1 + c1, r0 = a0 + c0, m = Math.max(r1, r0);
    return { pts, q: `In which base is the operation <b>${a1}${a0} + ${c1}${c0} = ${r1}${r0}</b> correct? (a) only in base ${m + 1}; (b) in no base; (c) in any base; (d) in any base ≥ ${m + 1}. Explain.`,
      sol: `In base β: (${a1}β + ${a0}) + (${c1}β + ${c0}) = ${r1}β + ${r0} holds for every β, because no digit sum reaches the base (no carry). The only condition is that every digit is smaller than the base; the largest digit is ${m}, so the answer is <b>(d) any base ≥ ${m + 1}</b> (base 10 included).` };
  }
  if (k === 'c2') {
    const a = rnd.int(20, 127);
    return { pts, q: `Represent <b>−${a}</b> in two's complement on 8 bits. Which range of integers can be represented on 8 bits in two's complement?`,
      sol: `${a} = <code>${bits(a, 8)}</code>; invert every bit: <code>${bits(~a & 255, 8)}</code>; add 1: <code>${bits(256 - a, 8)}</code> = −${a}. On n bits the range is −2<sup>n−1</sup> … 2<sup>n−1</sup>−1, so <b>−128 … +127</b> on 8 bits. (About two thirds of the points for the representation, one third for the range.)` };
  }
  if (k === 'hexsum') {
    const a = rnd.int(0, 255), b = rnd.int(0, 255), x = c2v(a, 8), y = c2v(b, 8), s = x + y, r = (a + b) & 255, ov = s > 127 || s < -128;
    return { pts, q: `<b>${hx(a)}</b> and <b>${hx(b)}</b> are two 8-bit numbers in two's complement, written in hexadecimal. Compute their sum on 8 bits (give the result in hexadecimal) and say whether there is overflow. Show the steps.`,
      sol: `${hx(a)} = <code>${bits(a, 8)}</code> (${neg(x)}), ${hx(b)} = <code>${bits(b, 8)}</code> (${neg(y)}). Add in binary and keep 8 bits${a + b > 255 ? ' (the carry out of the 8th bit is discarded)' : ''}: <code>${bits(r, 8)}</code> = <b>${hx(r)}</b>. ` +
        (ov ? `<b>Overflow</b>: both operands are ${x < 0 ? 'negative' : 'positive'} but the result has sign bit ${x < 0 ? 0 : 1}; the true sum ${neg(s)} is outside −128 … 127.`
            : `<b>No overflow</b>: ${(x < 0) !== (y < 0) ? 'operands with different signs can never overflow' : 'the result has the same sign as the operands'}; ${hx(r)} = ${neg(c2v(r, 8))} = ${neg(x)} + (${neg(y)}).`) };
  }
  if (k === 'sum') {
    const c = rnd.int(0, 2); let x, y;
    if (c === 0) { x = rnd.int(50, 120); y = rnd.int(128 - x, 127); }          // positive + positive: overflow
    else if (c === 1) { x = rnd.int(20, 120); y = -rnd.int(10, 128); }       // different signs: never overflows
    else { x = -rnd.int(20, 110); y = -rnd.int(20, 110); }                   // negative + negative: maybe
    const s = x + y, r = s & 255, read = r >= 128 ? r - 256 : r, ov = s > 127 || s < -128;
    return { pts, q: `Compute ${neg(x)} + (${neg(y)}) in two's complement on 8 bits: write both operands in binary, the 8-bit result, and say whether there is overflow.`,
      sol: `${neg(x)} = <code>${bits(x & 255, 8)}</code>, ${neg(y)} = <code>${bits(y & 255, 8)}</code>. Add them and keep 8 bits (a carry out of the 8th bit is discarded): <code>${bits(r, 8)}</code>, which reads as ${neg(read)}. ` +
        (ov ? `<b>Overflow</b>: the true sum ${neg(s)} is outside −128 … 127. Two operands with the same sign gave a result with the opposite sign.`
            : `<b>No overflow</b>: ${neg(s)} is within −128 … 127${(x < 0) !== (y < 0) ? ' (operands with different signs can never overflow)' : ''}.`) };
  }
  // IEEE 754 half precision (as in the course slides): 1 sign bit, 5 exponent bits (bias 15), 10 fraction bits.
  const sg = rnd.int(0, 1), e = rnd.int(-2, 3), E = e + 15, f = rnd.int(1, 63) * 16, fb = bits(f, 10);
  const sig = 1 + f / 1024, val = (sg ? -1 : 1) * sig * 2 ** e;
  const terms = fb.split('').map((d, i) => (d === '1' ? `2<sup>−${i + 1}</sup>` : '')).filter(Boolean).join(' + ');
  return { pts, q: `The 16 bits <code>${sg}${bits(E, 5)}${fb}</code> are a number in IEEE 754 half precision (1 sign bit, 5 exponent bits with bias 15, 10 fraction bits). What is its decimal value?`,
    sol: `Sign <code>${sg}</code> → ${sg ? 'negative' : 'positive'}. Exponent <code>${bits(E, 5)}</code> = ${E}, minus the bias 15 → ${neg(e)}. Fraction <code>${fb}</code>: significand 1.${fb.replace(/0+$/, '')}<sub>2</sub> = 1 + ${terms} = ${sig}. Value = ${sg ? '−' : ''}${sig} × 2<sup>${neg(e)}</sup> = <b>${neg(val)}</b>. (Points split between the three fields, the exponent and the final value.)` };
}
// Computer-architecture calculations asked in the past exams (teoria/architettura.md): bus widths, memory sizes, clock.
const memSize = n => { for (const [u, e] of [['GB', 30], ['MB', 20], ['kB', 10]]) if (n >= 2 ** e && n % 2 ** e === 0) return `${n / 2 ** e} ${u}`; return n + ' bytes'; };
const r3 = x => { const y = +x.toFixed(3); return (Math.abs(x - y) > 1e-9 ? '≈ ' : '') + y; };
function csArchNum(pts) {
  const k = rnd.pick(['maxmem', 'cell', 'abus', 'clock']), note = ' (for memory sizes 1 kB = 2<sup>10</sup> B, 1 MB = 2<sup>20</sup> B, 1 GB = 2<sup>30</sup> B)';
  if (k === 'maxmem') {
    const n = rnd.int(16, 32), p = rnd.pick([1, 2, 4, 8]), lp = Math.log2(p);
    return { pts, q: `A computer has an address bus of <b>${n} bits</b> and each memory cell holds <b>${p} byte${p > 1 ? 's' : ''}</b> (parallelism ${8 * p} bits). What is the largest memory that can be installed? Show the steps.`,
      sol: `${n} address lines give 2<sup>${n}</sup> different addresses, one per cell. Maximum memory = number of cells × cell size = 2<sup>${n}</sup> × ${p} B${lp ? ` = 2<sup>${n + lp}</sup> B` : ''} = <b>${memSize(2 ** n * p)}</b>${note}.` };
  }
  if (k === 'cell') {
    const n = rnd.int(10, 24), d = rnd.int(0, 3), M = 2 ** (n + d);
    return { pts, q: `A RAM of <b>${memSize(M)}</b> has an address bus of <b>${n} bits</b>. What is its parallelism, i.e. the size of each memory cell in bits? Show the steps.`,
      sol: `The address bus selects 2<sup>${n}</sup> cells. Cell size = memory size / number of cells = 2<sup>${n + d}</sup> B / 2<sup>${n}</sup> = ${2 ** d} byte${d ? 's' : ''} = <b>${8 * 2 ** d} bits</b>${note}.` };
  }
  if (k === 'abus') {
    const p = rnd.pick([8, 16, 32, 64]), m = rnd.int(16, 34), n = m - Math.log2(p / 8);
    return { pts, q: `What is the minimum number of address-bus bits needed to address a memory of <b>${memSize(2 ** m)}</b> with a parallelism of <b>${p} bits</b>?`,
      sol: `Each cell holds ${p} bits = ${p / 8} B, so the memory has 2<sup>${m}</sup> B / ${p / 8} B = 2<sup>${n}</sup> cells. Every cell needs its own address and n bits give 2<sup>n</sup> addresses, so <b>${n} bits</b>${note}.` };
  }
  const f = rnd.pick([1, 1.5, 2, 2.5, 3, 4]), N = rnd.pick([1e6, 2e6, 5e6, 1e7, 1e8]), c = rnd.int(2, 8), cyc = N * c;
  return { pts, q: `A CPU has a clock frequency of <b>${f} GHz</b>. (a) What is the clock period? (b) How long does a program take that executes ${N.toLocaleString('en')} instructions, each needing ${c} clock cycles?`,
    sol: `(a) Period = 1 / frequency = 1 / (${f}·10<sup>9</sup> Hz) = <b>${r3(1 / f)} ns</b>. (b) The program needs ${N.toLocaleString('en')} × ${c} = ${cyc.toLocaleString('en')} cycles; time = cycles / frequency = ${cyc.toLocaleString('en')} / (${f}·10<sup>9</sup>) s = <b>${r3(cyc / (f * 1e6))} ms</b>.` };
}
// Concept questions with model answers (what the answer must contain).
const CSTH = [
  ['Describe the von Neumann architecture: name its main components and what each one does.', 'CPU = control unit (fetches and decodes the instructions), ALU (arithmetic and logic operations) and registers (small, very fast memory, e.g. the program counter); main memory (RAM) holding <b>both the program and the data</b> (stored-program idea); input/output devices; a bus (data, address, control) connecting them.'],
  ['Explain the fetch – decode – execute cycle of a CPU.', 'Fetch: the instruction at the address in the program counter (PC) is copied from memory into the instruction register (IR) and the PC moves to the next instruction. Decode: the control unit works out the operation and its operands. Execute: the ALU or another unit performs it and stores the result (register or memory). The cycle repeats for every instruction; jumps change the program counter.'],
  ['What are the differences between main memory (RAM) and secondary storage (hard disk, SSD)? Give at least two for each.', 'RAM: volatile (lost when power is off), fast, smaller and more expensive per byte, directly addressed by the CPU, holds the programs being run and their data. Secondary storage: non-volatile, much slower, much larger and cheaper, holds files permanently; programs must be loaded into RAM to run.'],
  ['What is the difference between a compiler and an interpreter? Which one does Python use?', 'A compiler translates the whole source program into machine code before running it, producing an executable; many errors are found before execution. An interpreter translates and executes the program statement by statement, so errors appear when that line is reached. Python is interpreted (the source is turned into bytecode run by the Python virtual machine).'],
  ['What is an algorithm? Which properties must it have?', 'A finite sequence of precise, unambiguous steps that solves a problem. Properties: finiteness (it ends after a finite number of steps), definiteness (each step is unambiguous), effectiveness (each step can actually be carried out), it has inputs and produces outputs, and ideally it is general (solves every instance of the problem).'],
  ['Which symbols are used in a flowchart and what does each one mean?', 'Oval (terminal): Start / Stop. Parallelogram: input or output. Rectangle: a processing step / assignment. Diamond: a decision with a condition and two exits (True / False). Arrows: the order in which the steps are executed. A good answer can sketch a tiny example (e.g. the lab-team flowchart).'],
  ['Explain the three kinds of errors in a program (syntax, run-time, logic) with a Python example of each.', 'Syntax error: the code breaks the language rules and does not start at all (e.g. a missing colon: <code>if x > 0</code>). Run-time error: the program starts but crashes during execution (e.g. <code>10 / 0</code> → ZeroDivisionError, <code>int("abc")</code> → ValueError). Logic error: the program runs but gives wrong results (e.g. <code>range(1, n)</code> instead of <code>range(1, n + 1)</code>). Only testing finds logic errors.'],
  ['What are ASCII and Unicode? Why was Unicode introduced?', 'ASCII codes 128 characters with 7 bits (English letters, digits, punctuation, control characters). It cannot represent accented letters or other alphabets, so Unicode was introduced: it gives a code point to the characters of all writing systems (over a million possible), stored with encodings such as UTF-8 (1–4 bytes, compatible with ASCII). Python 3 strings are Unicode; <code>ord()</code> and <code>chr()</code> convert between characters and codes.'],
  ['What is the difference between a list and a tuple in Python? When would you use a tuple?', 'A list (<code>[1, 2]</code>) is mutable: elements can be changed, added or removed. A tuple (<code>(1, 2)</code>) is immutable. Tuples are used for fixed groups of values (a record, coordinates, returning several values from a function) and, being immutable, can be dictionary keys or set elements; lists cannot.'],
  ['Explain mutable and immutable types in Python, with examples. What does <code>a</code> contain after <code>a = [1, 2]; b = a; b.append(3)</code>?', 'Immutable objects (int, float, str, tuple) cannot change: operations create new objects. Mutable objects (list, dict, set) can be changed in place. <code>b = a</code> does not copy the list: both names refer to the same object, so <code>a</code> is <code>[1, 2, 3]</code>. A copy needs <code>a[:]</code> or <code>list(a)</code>.'],
  ['Explain the difference between local and global variables in Python.', 'A variable assigned inside a function is local: it exists only during that call and is not visible outside. A global variable is defined at the top level of the program; a function can read it, but assigning to the same name inside the function creates a new local variable (unless declared <code>global</code>). Parameters are local variables. Good practice: pass values as parameters and use <code>return</code>.'],
  ['What is the difference between a <code>while</code> loop and a <code>for</code> loop in Python? Give an example where each is the natural choice.', '<code>for</code> repeats once for each element of a sequence (list, string, <code>range</code>, file lines): natural when the number of iterations is known, e.g. summing a list. <code>while</code> repeats as long as a condition is true and may run zero times: natural when the number of iterations is unknown, e.g. reading input until the user types 0.'],
  ['What is an exception? Explain how <code>try</code> / <code>except</code> works with an example.', 'An exception is an error detected during execution (e.g. ValueError, FileNotFoundError, ZeroDivisionError) that stops the program unless it is handled. The code that may fail goes in <code>try</code>; if an exception of the listed type occurs, execution jumps to the matching <code>except</code> block instead of crashing. Example: <code>try: n = int(input()) except ValueError: print("Not a number")</code>.'],
  ['What is short-circuit evaluation of <code>and</code> / <code>or</code>? Give an example where it avoids an error.', 'Python evaluates the right operand only if needed: in <code>A and B</code>, if A is false the result is false without evaluating B; in <code>A or B</code>, if A is true B is skipped. Example: <code>if x != 0 and 10 / x > 2:</code> never divides by zero; <code>if i < len(v) and v[i] > 0:</code> never goes out of range.'],
  ['What do the modes <code>"r"</code>, <code>"w"</code> and <code>"a"</code> of <code>open()</code> mean? Why should a file be closed, and how does <code>with</code> help?', '<code>"r"</code> reads (the file must exist), <code>"w"</code> writes and erases the previous content (creates the file if missing), <code>"a"</code> appends at the end. Closing frees the resource and makes sure written data is saved to disk. <code>with open(...) as f:</code> closes the file automatically at the end of the block, even if an error occurs.'],
  ['How does a dictionary work in Python? What can be a key, and how do you add, read and check for a key?', 'A dictionary maps unique keys to values. Keys must be immutable (str, int, tuple), values can be anything. Add or update: <code>d[k] = v</code>; read: <code>d[k]</code> (KeyError if missing) or <code>d.get(k, default)</code>; check: <code>k in d</code>; loop: <code>for k, v in d.items()</code>.'],
  ['What is the difference between parameters and arguments? What does <code>return</code> do, and what does a function without <code>return</code> give back?', 'Parameters are the names in the function definition (<code>def f(x, y)</code>); arguments are the values passed in the call (<code>f(3, 4)</code>), which are assigned to the parameters. <code>return</code> ends the function and sends a value back to the caller. A function without <code>return</code> (or with a bare <code>return</code>) returns <code>None</code>.'],
  ['What are the binary, octal and hexadecimal systems, and why is hexadecimal used in computing?', 'Positional systems with base 2 (digits 0–1), 8 (0–7) and 16 (0–9, A–F): each digit is multiplied by a power of the base. Computers work in binary; one hexadecimal digit is exactly 4 bits (one octal digit is 3 bits), so hexadecimal is a compact, easy-to-convert way to write binary values (memory addresses, colours, byte values).'],
  ['What is the difference between a bit, a byte, a kilobyte (kB) and a kibibyte (KiB)?', 'A bit is a single binary digit (0 or 1). A byte is 8 bits (256 values). A kilobyte (kB) is 1000 bytes (SI prefix), a kibibyte (KiB) is 2<sup>10</sup> = 1024 bytes; likewise MB = 10<sup>6</sup> B and MiB = 2<sup>20</sup> B.'],
  ['What is pseudo-code and why is it used before writing a program?', 'An informal, language-independent description of an algorithm with structured steps (read, if/else, repeat, write). It lets you design and check the logic of the solution without worrying about the syntax of a language, and it is then translated into code. Like a flowchart, it is part of the problem-solving phase (analysis and design) before implementation.'],
];
// More concept questions, modelled on the past exams (teoria/architettura.md, teoria/python.md), with model answers.
const CS_NUM = [
  ['Why are real numbers usually stored in floating point (IEEE 754) and not in fixed point? What are the advantages?', 'Floating point stores sign, exponent and significand (±1.f × 2<sup>e</sup>, like scientific notation). With the same number of bits it covers a huge range of magnitudes (about 10<sup>−38</sup> … 10<sup>38</sup> in single precision) with the same <i>relative</i> precision, while fixed point has a fixed number of decimals: a small range, and small numbers lose precision. The standard also gives the same results on every computer and defines special values (±0, ±∞, NaN). Drawback: most decimals are approximated (0.1 is not exact), so results carry rounding errors.'],
  ['Compare sign and magnitude with two\'s complement: how is a negative number represented, and why do computers use two\'s complement?', 'Sign and magnitude: the first bit is the sign (1 = negative), the others the absolute value; −5 on 8 bits = <code>10000101</code>. It has two zeros (<code>00000000</code> and <code>10000000</code>) and needs special rules to add numbers with different signs. Two\'s complement: invert the bits of the absolute value and add 1; −5 = <code>11111011</code>. Only one zero, range −2<sup>n−1</sup> … 2<sup>n−1</sup>−1, and addition and subtraction use the same adder as unsigned numbers (subtracting = adding the opposite), so the hardware is simpler.'],
  ['What is overflow in the sum of two numbers in two\'s complement? How do you recognise it?', 'Overflow happens when the true result is outside the representable range (−2<sup>n−1</sup> … 2<sup>n−1</sup>−1 on n bits), so the n-bit result is wrong. It can only happen when the two operands have the <b>same sign</b>, and you recognise it because the result has the opposite sign (8 bits: 100 + 50 → <code>01100100 + 00110010 = 10010110</code>, which reads −106). The carry out of the last bit is discarded and is <b>not</b> by itself a sign of overflow (−1 + −1 gives a carry and the correct −2).'],
];
const CS_ARCH = [
  ['What is the memory hierarchy of a computer and why is it useful? List the levels from the fastest to the slowest.', 'Fast memories are small and expensive per byte; large memories are slow and cheap. The hierarchy combines them: <b>registers → cache (L1, L2, L3) → main memory (RAM) → secondary storage (SSD, hard disk)</b>. Going down, speed and cost per byte decrease and capacity increases. The data in use are kept in the small fast levels (locality: programs reuse recent and nearby data), so the system works almost at the speed of the fastest level with the capacity of the largest.'],
  ['Describe the RAM and the cache memory: what are they for and how do they differ?', 'RAM (main memory): volatile, holds the programs being executed and their data; the CPU reads and writes any cell by its address in the same time (random access). Cache: a small, very fast memory inside or next to the CPU that keeps copies of the most recently used RAM data, so most accesses avoid the slower RAM. The cache is faster, much smaller (MB instead of GB) and more expensive per byte, and it is managed by the hardware, not by the program.'],
  ['What are the buses of a computer? Which types exist and what does each one carry?', 'A bus is a set of shared lines connecting CPU, memory and I/O devices. <b>Address bus</b>: the address of the memory cell or device to access (from the CPU; its width sets how many cells can be addressed). <b>Data bus</b>: the data read or written (both directions; its width is how many bits move at once). <b>Control bus</b>: control signals (read/write, clock, interrupts, ready). A serial bus sends one bit at a time on one line (USB, SATA, PCIe lanes); a parallel bus sends several bits at once on several lines (memory bus, old PATA).'],
  ['What are the ALU and the FPU? What does each one do, and why are integer operations faster than operations on real numbers?', 'Both belong to the CPU\'s execution unit. The <b>ALU</b> (Arithmetic Logic Unit) does integer arithmetic, comparisons and logic operations (AND, OR, NOT, shifts) and sets the flags. The <b>FPU</b> (Floating Point Unit) does operations on floating-point (IEEE 754) numbers. A floating-point operation needs more steps (align the exponents, operate on the significands, normalise and round), so it takes longer than an integer one.'],
  ['Describe the control unit of a CPU: which blocks does it contain and what does it do?', 'It coordinates the execution of the instructions: it fetches the next instruction from memory, decodes it and generates the control signals that make the ALU, registers, memory and buses do the right operation at the right moment (timed by the clock). Main blocks: the <b>program counter</b> (address of the next instruction), the <b>instruction register</b> (the instruction being executed), the <b>decoder</b> and the control-signal generator (sequencer).'],
  ['What are the registers of a CPU? Explain the role of the program counter, the instruction register and the flag register.', 'Registers are a few very fast memory cells inside the CPU, the top of the memory hierarchy; they hold the operands and results being worked on. <b>Program counter (PC)</b>: address of the next instruction, incremented at each fetch and changed by jumps. <b>Instruction register (IR)</b>: the instruction currently being decoded and executed. <b>Flag (status) register</b>: bits set by the ALU after each operation (zero, sign, carry, overflow), used by conditional jumps.'],
  ['What is the clock of a computer? What are its period and its frequency, and in which units are they measured?', 'The clock is a periodic signal that synchronises the operations of the CPU: each step of the instruction cycle takes one or more clock cycles. The <b>period</b> T is the duration of one cycle (seconds, e.g. ns); the <b>frequency</b> f = 1/T is the number of cycles per second (hertz): 3 GHz = 3·10<sup>9</sup> cycles/s, T ≈ 0.33 ns. A higher frequency gives more operations per second but more power use and heat.'],
  ['Why did CPU clock frequencies grow for decades and then almost stop growing? What did designers do instead?', 'Smaller transistors switch faster, so frequencies rose from MHz to GHz. Around 2005 they stopped at about 3–5 GHz because power consumption and heat grow with the frequency and cannot be removed efficiently (the power wall). Performance then grew in other ways: several cores working in parallel (multi-core CPUs), larger caches and more work done per clock cycle.'],
  ['What does it mean that a computer is "64-bit"? Why are almost all current computers 64-bit?', 'The CPU works on 64-bit words: its registers, ALU and addresses are 64 bits wide. The main reason: 32-bit addresses can reach only 2<sup>32</sup> B = 4 GB of memory, which is too little today, while 64-bit addresses allow far more. It also handles larger integers in a single operation.'],
  ['What is the relationship between the width of the address bus, the width of the data bus and the maximum memory of a system?', 'An address bus of n bits can select 2<sup>n</sup> different cells; the data bus width (parallelism) is the size of each cell, transferred in one access. Maximum memory = 2<sup>n</sup> × cell size. Example: n = 32 with 1-byte cells → 2<sup>32</sup> B = 4 GB; with 8-byte cells → 32 GB. A wider data bus does not add cells but moves more bits per access.'],
  ['List at least four tasks of the operating system.', 'Managing processes (starting programs and sharing the CPU among them: scheduling); managing memory (assigning RAM to programs and protecting them from each other); managing files and the file system; managing input/output devices through drivers; user interface and security (accounts, permissions). It hides the hardware details from the programs.'],
  ['Put these operations in increasing order of time: read a CPU register, read a file from a hard disk, read the RAM, read the cache, download a file from the Internet, read an SSD.', '<b>Register &lt; cache &lt; RAM &lt; SSD &lt; hard disk &lt; Internet.</b> Rough orders of magnitude: register under 1 ns, cache 1–10 ns, RAM about 100 ns, SSD tens to hundreds of µs, hard disk several ms (moving parts), Internet tens of ms or more. It is the memory hierarchy: the faster, the smaller and more expensive.'],
  ['What are the advantages and disadvantages of connecting all the devices of a computer to one shared bus?', 'Advantages: simple and cheap, few wires, easy to add devices that follow the same rules. Disadvantages: only one transfer at a time, so the bus becomes a bottleneck when many devices communicate; the slowest device can slow the others; long, crowded lines limit the speed. That is why real computers have several buses (memory bus, PCIe, USB…).'],
];
const CS_PY = [
  ['What is an <b>alias</b> in Python? Show the possible problem with an example on lists, and how to avoid it.', 'Two names are aliases when they refer to the same object: <code>a = [1, 2, 3]; b = a</code>. With a mutable object a change through one name is seen through the other: after <code>b.append(4)</code>, <code>a</code> is <code>[1, 2, 3, 4]</code>. The same happens when a list is passed to a function: the function can change the caller\'s list. For an independent copy use <code>b = a[:]</code>, <code>list(a)</code> or <code>a.copy()</code>. With immutable objects (int, str, tuple) aliasing causes no problems.'],
  ['Why are Python dictionaries called that? What does it mean that a dictionary is an "associative array"?', 'Like a real dictionary it associates each <b>key</b> (the word) with a <b>value</b> (its definition) and finds the value from the key quickly. "Associative array": instead of positions 0, 1, 2… as in a list, elements are reached through keys of an immutable type: <code>age = {"Anna": 20, "Luca": 22}</code>, <code>age["Luca"]</code> → 22. Keys are unique and the lookup is fast (hashing) whatever the size.'],
  ['What is indentation used for in Python? Give an example where it changes the result.', 'In Python indentation is part of the syntax: it defines the blocks (body of <code>if</code>, loops, functions) instead of braces. Wrong indentation gives an IndentationError or a different program. <pre class="code">total = 0\nfor x in [1, 2, 3]:\n    total += x\n    print(total)</pre>prints 1, 3, 6; with <code>print(total)</code> not indented (after the loop) it prints only 6.'],
  ['Give an example in which the order of the <code>elif</code> branches changes the result.', 'Only the first true branch is executed. <pre class="code">if grade >= 18:\n    print("passed")\nelif grade >= 27:\n    print("excellent")</pre>never prints "excellent": 28 already satisfies the first test. The more specific condition must come first: <code>if grade >= 27</code> … <code>elif grade >= 18</code> ….'],
  ['A programmer wants to store the 2×2 matrix with rows (1, 2) and (3, 4). Discuss these options: <code>[1, 2, 3, 4]</code>, <code>[[1, 2], [3, 4]]</code>, <code>[[1, 3], [2, 4]]</code>.', '<code>[[1, 2], [3, 4]]</code> is the natural one: a list of rows, element (i, j) is <code>m[i][j]</code>. <code>[[1, 3], [2, 4]]</code> is a list of columns: also correct if used consistently (element (i, j) is <code>m[j][i]</code>) but less intuitive. <code>[1, 2, 3, 4]</code> loses the shape: it works only if the number of columns is known and element (i, j) is computed as <code>m[i * ncols + j]</code>; not wrong, but error-prone.'],
  ['What are the differences between a list and a set in Python? Give an example of data better stored in a list and of data better stored in a set.', 'List: ordered, elements reached by position, duplicates allowed, any element type. Set: no order and no indexing, no duplicates, elements must be immutable (hashable), very fast <code>in</code> test and set operations (union, intersection, difference). List: the daily temperatures in order (repeats matter). Set: the distinct words of a text, or the students present at a lab (membership questions). <code>set(lst)</code> removes duplicates and loses the order.'],
  ['Which instruction creates in <code>d2</code> a <b>copy</b> of the dictionary <code>d1</code>? (1) <code>d2 = d1</code> (2) <code>d2 = dict(d1.values())</code> (3) <code>d2 = dict(d1.keys())</code> (4) <code>d2 = dict(d1)</code>', '<b>(4)</b>: <code>dict(d1)</code> builds a new dictionary with the same keys and values (like <code>d1.copy()</code>). (1) only creates an alias: both names refer to the same dictionary. (2) and (3) pass single values or keys instead of key–value pairs, so they do not rebuild <code>d1</code> (normally they raise an error).'],
  ['Which of these structures cannot be built in Python, and why? (1) dictionary of lists (2) set of dictionaries (3) dictionary of sets (4) list of lists', '<b>(2)</b>: the elements of a set must be immutable (hashable) and a dictionary is mutable, so a set of dictionaries raises <code>TypeError: unhashable type: \'dict\'</code>. The others are fine: dictionary values and list elements can be of any type.'],
  ['You read a number with <code>input()</code>. What happens if you use it directly in an arithmetic operation, and what should you do?', '<code>input()</code> always returns a <b>string</b>. <code>input() + 1</code> raises a TypeError, and <code>input() * 2</code> repeats the text ("5" * 2 = "55"). Convert it first with <code>int(...)</code> or <code>float(...)</code>; since the user may type something that is not a number, put the conversion inside <code>try</code> / <code>except ValueError</code>.'],
  ['In a dictionary, can two keys have the same value? Can one key have two values?', 'Two keys with equal values: <b>yes</b> (<code>{"Anna": 30, "Luca": 30}</code>). One key with two values: <b>no</b>, keys are unique and assigning <code>d[k]</code> again replaces the old value. To keep several values for a key, use a list or a set as the value: <code>d.setdefault(k, []).append(v)</code>.'],
  ['Can a list be a key of a dictionary? And a tuple? Can a set contain lists, tuples or other sets?', 'Dictionary keys and set elements must be immutable (hashable). A list: <b>no</b> (TypeError: unhashable type: \'list\'). A tuple: <b>yes</b>, if its elements are immutable too (<code>d[(2, 3)] = "B3"</code>). A set can contain numbers, strings and tuples, but not lists, dictionaries or sets (<code>frozenset</code> exists for that). A tuple, instead, can contain anything, even a set.'],
  ['What is the difference between the formal parameters and the actual parameters (arguments) of a function?', 'Formal parameters are the names in the definition, <code>def area(base, height):</code>; they are local variables of the function. Actual parameters (arguments) are the values in the call, <code>area(3, 4.5)</code>: each formal parameter receives the corresponding argument (by position or by name, <code>area(height=2, base=5)</code>). Assigning a new value to a parameter does not change the caller\'s variable, but changing a mutable argument (e.g. <code>lst.append(x)</code>) does.'],
  ['Why can comparing two floats with <code>==</code> give a wrong answer? Describe two correct ways to compare them.', 'Many decimal numbers have no exact binary representation, so results carry rounding errors: <code>0.1 + 0.2 == 0.3</code> is <code>False</code> (the sum is 0.30000000000000004). Compare with a tolerance: absolute, <code>abs(a - b) &lt; 1e-9</code>; or relative, <code>abs(a - b) &lt;= 1e-9 * max(abs(a), abs(b))</code>, better for very large or very small numbers (<code>math.isclose(a, b)</code> does this).'],
  ['What is the difference between <b>raising</b> and <b>handling</b> an exception? When is an <code>except</code> clause executed?', 'Raising signals an error: Python does it by itself (<code>int("x")</code> raises ValueError) or the programmer does it with <code>raise ValueError("negative")</code>; execution stops and the exception goes back through the calls. Handling means catching it with <code>try</code> / <code>except</code> and reacting. The <code>except</code> block runs only if an exception of a matching type is raised inside the <code>try</code>: the rest of the <code>try</code> is skipped and the program continues after the <code>except</code>. Without errors, <code>except</code> is skipped.'],
  ['How can a program check whether a string can be converted to an <code>int</code>?', 'The safe way is to try the conversion: <pre class="code">try:\n    n = int(s)\nexcept ValueError:\n    print("not an integer")</pre><code>s.isdigit()</code> works only for non-negative numbers without spaces: it is <code>False</code> for "-5" and " 7", which <code>int()</code> accepts.'],
  ['What does <code>enumerate</code> do and what does it return? Give an example.', 'It goes through a sequence giving at each step the pair (index, element), so you do not need <code>range(len(...))</code>. <pre class="code">for i, name in enumerate(["Anna", "Luca"]):\n    print(i, name)</pre>prints <code>0 Anna</code> and <code>1 Luca</code>. It returns an enumerate object (an iterator of tuples); <code>enumerate(seq, 1)</code> starts counting from 1.'],
  ['How does the slice operator <code>[start:stop:step]</code> work, and on which types can it be used?', 'It takes the elements from index <code>start</code> (included) to <code>stop</code> (excluded) with the given step; missing values mean beginning, end and 1; negative indices count from the end. With <code>s = "Politecnico"</code>: <code>s[0:4]</code> → "Poli", <code>s[-3:]</code> → "ico", <code>s[::-1]</code> reverses it. It works on sequences (strings, lists, tuples, ranges) and always creates a new object, so <code>lst[:]</code> is a copy. Not on sets or dictionaries (no positions).'],
  ['What are the similarities and the differences between strings and lists in Python?', 'Both are sequences: indexing <code>x[i]</code>, slicing, <code>len</code>, <code>in</code>, <code>for</code> loops, <code>+</code> and <code>*</code>. A string contains only characters and is <b>immutable</b> (<code>s[0] = "X"</code> is an error; methods like <code>upper()</code> return new strings); a list contains values of any type and is <b>mutable</b> (append, remove, item assignment). <code>list("abc")</code> → <code>["a", "b", "c"]</code>; <code>"".join(lst)</code> goes back.'],
  ['Why is this definition wrong, and how would you correct it? <code>s = {[2, 4], [2, 2], [1, 0]}</code>', 'The elements of a set must be immutable and lists are mutable: Python raises <code>TypeError: unhashable type: \'list\'</code>. Use tuples, <code>s = {(2, 4), (2, 2), (1, 0)}</code>; or, if order and duplicates matter, a list of lists <code>[[2, 4], [2, 2], [1, 0]]</code>.'],
  ['What does <code>a</code> contain at the end, and why? <pre class="code">def f(i, lst):\n    lst[i], lst[i + 1] = lst[i + 1], lst[i]\n\na = [5, 8, 1, 3]\nf(1, a)\nf(0, a)</pre>', 'The parameter <code>lst</code> is an alias of <code>a</code> (the same list), so the swaps change <code>a</code> itself. <code>f(1, a)</code> swaps positions 1 and 2: <code>[5, 1, 8, 3]</code>; <code>f(0, a)</code> swaps positions 0 and 1: <b><code>[1, 5, 8, 3]</code></b>.'],
  ['This code should remove all the zeros from the list, but it crashes. Why? Correct it. <pre class="code">v = [3, 0, 0, 5, 0]\nfor i in range(len(v)):\n    if v[i] == 0:\n        v.pop(i)</pre>', '<code>range(len(v))</code> is computed once (0…4), but each <code>pop</code> shortens the list and shifts the next elements left: a zero right after a removed one is skipped, and soon <code>i</code> is past the end: <code>IndexError: list index out of range</code>. Correct: build a new list, <code>v = [x for x in v if x != 0]</code>, or <code>while 0 in v: v.remove(0)</code>.'],
  ['Describe in words the data structure <code>d = {"A": {2, 3, 5}, "K": {1, 2, 3}, "M": {2, 3, 6}}</code>. How do you get the numbers that appear under every key?', 'A dictionary whose keys are strings and whose values are sets of integers (e.g. for each person, the days they are free). The numbers present under every key are the intersection of the sets: <code>d["A"] &amp; d["K"] &amp; d["M"]</code>, or in general <code>set.intersection(*d.values())</code>; here <b>{2, 3}</b>.'],
  ['Describe the variable <code>x = [(2, 3), (4, -1)]</code>. What is <code>x[1][0]</code>? Can you write <code>x[0][1] = 7</code>?', 'A list of two tuples of two integers each (e.g. points (x, y)). <code>x[1]</code> is the tuple <code>(4, -1)</code>, so <code>x[1][0]</code> is <b>4</b>. <code>x[0][1] = 7</code> raises a TypeError: tuples are immutable. You can replace a whole element instead, <code>x[0] = (2, 7)</code>, because the list is mutable.'],
  ['You want to store students as (student ID, average) and print them by decreasing average. Which data structure would you use? Write the code that sorts and prints them.', 'A list of tuples (or a dictionary ID → average, used through <code>items()</code>): <pre class="code">students = [("s301", 27.5), ("s302", 24.0), ("s303", 29.1)]\nfor sid, avg in sorted(students, key=lambda s: s[1], reverse=True):\n    print(sid, avg)</pre><code>key</code> chooses what to compare (the second field) and <code>reverse=True</code> gives decreasing order; <code>sorted</code> returns a new list, <code>students.sort(...)</code> sorts in place.'],
  ['If <code>numbers</code> is a list of integers, what is the difference between <code>numbers.sort()</code> and <code>sorted(numbers)</code>? What happens with <code>numbers = numbers.sort()</code>?', '<code>numbers.sort()</code> sorts the list in place (it changes it) and returns <code>None</code>. <code>sorted(numbers)</code> leaves the list unchanged and returns a new sorted list (it accepts any iterable: tuples, sets, strings). <code>numbers = numbers.sort()</code> sorts the list and then assigns <code>None</code> to <code>numbers</code>: the list is lost, a classic mistake.'],
  ['A polynomial P(x) is stored in a dictionary (key = degree, value = coefficient), e.g. <code>p = {3: 2, 1: -4, 0: 7}</code> for 2x³ − 4x + 7. Write a function that computes P(x). Why is a dictionary a good choice?', '<pre class="code">def evaluate(p, x):\n    total = 0\n    for degree, coeff in p.items():\n        total += coeff * x ** degree\n    return total</pre><code>evaluate(p, 2)</code> → 16 − 8 + 7 = 15. Only the non-zero coefficients are stored (good for sparse polynomials such as x¹⁰⁰ + 1), and the coefficient of a degree is found directly with <code>p.get(k, 0)</code>.'],
  ['Which relational operators (<code>== != &lt; &lt;= &gt; &gt;=</code>) can be used on strings, lists, sets and dictionaries, and what do they mean?', 'Strings and lists: all six; <code>&lt;</code> compares element by element (lexicographic order: <code>"apple" &lt; "banana"</code>, <code>[1, 5] &lt; [2]</code>; strings by character code, so <code>"Z" &lt; "a"</code>). Sets: all six, but <code>&lt;=</code> / <code>&lt;</code> mean subset / proper subset (<code>{1} &lt; {1, 2}</code>). Dictionaries: only <code>==</code> and <code>!=</code> (same key–value pairs); <code>d1 &lt; d2</code> raises a TypeError.'],
  ['Write the code that creates a set containing two tuples of two numbers, adds a third tuple and prints all of them.', '<pre class="code">points = {(0, 0), (2, 3)}\npoints.add((1, 5))\nfor p in points:\n    print(p)</pre>Tuples can be set elements because they are immutable. The printing order is not guaranteed (sets have no order), and adding a tuple already present changes nothing.'],
];
// Banks by area: n = data representation, a = computer architecture, g = programming basics, p = Python.
const CSB = {
  n: [7, 17, 18].map(i => CSTH[i]).concat(CS_NUM),
  a: [0, 1, 2].map(i => CSTH[i]).concat(CS_ARCH),
  g: [3, 4, 5, 19].map(i => CSTH[i]),
  p: [6, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(i => CSTH[i]).concat(CS_PY),
};
const fromBank = (k, pts) => { const [q, sol] = rnd.pick(CSB[k]); return { q, pts, sol }; };
// As in the past exams and the midterm announcement: one question on data representation, one on computer
// architecture, one on Python.
function csTheory(L, n, pts) {
  const out = [rnd.int(1, 5) === 1 ? fromBank('n', pts) : csNumQ(L, pts),
    rnd.int(1, 3) === 1 ? csArchNum(pts) : fromBank(rnd.int(1, 4) === 1 ? 'g' : 'a', pts),
    fromBank('p', pts)];
  while (out.length < n) out.push(fromBank('p', pts));
  return out.slice(0, n);
}
function csTask(lv, not) {
  let pool = TASKS.filter(t => Math.abs(t.lv - lv) <= 1 && t !== not); if (!pool.length) pool = TASKS.filter(t => t !== not);
  return rnd.pick(pool);
}
function csProg(t, title, points, parts, note) {
  return { title, points, parts, intro: (note ? `<div class="small" style="margin-bottom:8px">${note}</div>` : '') + `<b>${esc(t.title)}.</b> ` + t.text + '<div class="small" style="margin-top:8px"><b>Example.</b> ' + t.example + '</div>',
    extraSol: '<b>Model solution</b> (one of many correct ones):<pre class="code">' + esc(t.code) + '</pre>' };
}
// Programming part in the style of the past exams: data files, numbered requirements, expected output (csexams.js).
function csExamTask(L) {
  const all = G.CS_EXAMS || []; if (!all.length) return null;
  const d = Math.max(1, Math.min(...all.map(t => Math.abs(t.lv - L))));
  return rnd.pick(all.filter(t => Math.abs(t.lv - L) <= d));
}
function csExamProg(t, parts) {
  const pre = c => '<pre class="code">' + esc(c) + '</pre>';
  return { title: 'Programming', points: 26, parts, files: t.files,
    intro: '<div class="small" style="margin-bottom:8px">Write it on the computer and run it: <b>a program that does not run is not reviewed</b> (0 points for this whole part). Download the example files with the buttons below and put them next to your <code>.py</code> file.</div>' +
      `<b>${esc(t.title)}.</b> ${t.text}<ol>${t.reqs.map(r => '<li>' + r + '</li>').join('')}</ol>` +
      t.files.map(f => `<div class="small"><b>Example file <code>${esc(f.name)}</code></b></div>${pre(f.text.replace(/\n$/, ''))}`).join('') +
      `<div class="small"><b>Expected output</b>${t.input ? ` (the user types <code>${esc(t.input)}</code>)` : ''}</div>${pre(t.out)}`,
    extraSol: '<b>Model solution</b> (one of many correct ones; run on the example files it prints exactly the expected output):' + pre(t.code) };
}
// Midterm question 4 (announcement): complete a program with missing parts, correct errors, or write a short snippet.
function csQ4(L) {
  const t = csTask(Math.min(L, 3)), lines = t.code.split('\n'), pre = c => '<pre class="code">' + esc(c) + '</pre>';
  const kind = rnd.pick(['complete', 'fix', 'snippet']);
  const parts = [{ q: 'Correct and complete answer (it would run and give the right output).', pts: 2, sol: 'Compare with the model solution below; other correct versions are fine.' },
    { q: 'Clean Python: right indentation, meaningful names, no useless code.', pts: 1, sol: 'Readable code as in the model solution.' }];
  if (kind === 'complete') {
    const cand = lines.map((l, i) => i).filter(i => /\S/.test(lines[i]) && !/^\s*(def |main\(\)|#)/.test(lines[i]) && lines[i].trim().length > 8);
    const gaps = rnd.shuffle(cand).slice(0, 3).sort((x, y) => x - y);
    const shown = lines.map((l, i) => (gaps.includes(i) ? l.match(/^\s*/)[0] + '# ......... (' + (gaps.indexOf(i) + 1) + ')' : l)).join('\n');
    return { title: 'Question 4 — Python: complete the program (bonus)', points: 3, bonus: true, parts,
      intro: `<b>${esc(t.title)}.</b> ${t.text}<div style="margin-top:8px">The program below solves it, but ${gaps.length} lines are missing. Write the missing lines (1)–(${gaps.length}).</div>${pre(shown)}`,
      extraSol: '<b>Missing lines:</b><pre class="code">' + esc(gaps.map((g, k) => `(${k + 1}) ${lines[g].trim()}`).join('\n')) + '</pre><b>Full program:</b>' + pre(t.code) };
  }
  if (kind === 'fix') {
    const bugs = [], L2 = lines.slice();
    const colon = rnd.shuffle(L2.map((l, i) => i).filter(i => /^\s*(if|for|while|elif)\b.*:\s*$/.test(L2[i])))[0];
    if (colon != null) { L2[colon] = L2[colon].replace(/:\s*$/, ''); bugs.push(`line ${colon + 1}: missing <code>:</code> at the end of the <code>${L2[colon].trim().split(' ')[0]}</code> line`); }
    const eq = L2.findIndex((l, i) => i !== colon && /^\s*(if|elif|while)\b.*[^=!<>]==[^=]/.test(l));
    if (eq >= 0) { L2[eq] = L2[eq].replace(/([^=!<>])==([^=])/, '$1=$2'); bugs.push(`line ${eq + 1}: <code>=</code> (assignment) instead of <code>==</code> (comparison)`); }
    const pr = L2.findIndex((l, i) => i !== colon && i !== eq && /\bprint\(/.test(l));
    if (pr >= 0 && bugs.length < 3) { L2[pr] = L2[pr].replace('print(', 'pritn('); bugs.push(`line ${pr + 1}: <code>pritn</code> should be <code>print</code> (NameError)`); }
    const numbered = L2.map((l, i) => String(i + 1).padStart(2) + '  ' + l).join('\n');
    return { title: 'Question 4 — Python: correct the errors (bonus)', points: 3, bonus: true, parts,
      intro: `<b>${esc(t.title)}.</b> ${t.text}<div style="margin-top:8px">This program should solve it but contains ${bugs.length} errors. Find them (give the line number) and write the corrected lines.</div>${pre(numbered)}`,
      extraSol: '<b>Errors:</b><ul>' + bugs.map(x => '<li>' + x + '</li>').join('') + '</ul><b>Correct program:</b>' + pre(t.code) };
  }
  return { title: 'Question 4 — Python: write a short program (bonus)', points: 3, bonus: true, parts,
    intro: `<b>${esc(t.title)}.</b> ${t.text}<div class="small" style="margin-top:8px"><b>Example.</b> ${t.example}</div>`,
    extraSol: '<b>Model solution</b> (one of many correct ones):' + pre(t.code) };
}
function writtenCS(L, mode) {
  if (mode === 'midterm') {
    return { title: 'Computer Sciences — midterm (practice)', max: 6, pass: 3,
      passText: 'VALID — can replace the theory part', failText: 'BELOW 3/6 — would not replace the theory part',
      exercises: [
        { title: 'Questions 1–3 — theory', points: 6, intro: 'As announced: data representation, computer architecture, Python concepts (one question each, like the past exams). Answer in English, briefly and precisely: words make a difference (“are” is not “may be”).', parts: csTheory(L, 3, 2) },
        csQ4(L),
      ] };
  }
  const t = csTask(L), real = csExamTask(L);
  const progParts = [
    { q: 'Input reading and data structures (files / input, lists, dictionaries).', pts: 7, sol: 'Data read correctly (header skipped, types converted, separators handled), appropriate structures chosen.' },
    { q: 'Main algorithm (correct results in all cases).', pts: 11, sol: 'Correct logic for every requirement, including the edge cases (ties, empty groups, missing keys).' },
    { q: 'Output in the requested format.', pts: 4, sol: 'Same lines, order and numeric formatting as the expected output.' },
    { q: 'Code organisation: functions, meaningful names, no duplicated code.', pts: 4, sol: 'Reading and computing split into functions; the main program is short and readable.' }];
  return { title: 'Computer Sciences — exam (practice)', max: 32, pass: 18,
    gate: { ex: 0, min: 3, why: 'Theory below 3/6: at the real exam the programming part would not be corrected.' },
    exercises: [
      { title: 'Theory — short questions', points: 6, intro: 'One question on data representation, one on computer architecture, one on Python, like the past exams. Answer in English, briefly and precisely: words make a difference (“are” is not “may be”). You need at least 3 of these 6 points, otherwise the programming part is not corrected.', parts: csTheory(L, 3, 2) },
      real ? csExamProg(real, progParts) : csProg(t, 'Programming', 26, [
        { q: 'Input reading and data structures (files / input, lists, dictionaries).', pts: 7, sol: 'Data read correctly (types converted, empty or malformed lines handled), appropriate structures chosen.' },
        { q: 'Main algorithm (correct results in all cases).', pts: 11, sol: 'Correct logic for the core task, including edge cases (empty input, ties, missing keys).' },
        { q: 'Output in the requested format.', pts: 4, sol: 'Messages and numeric formatting exactly as requested.' },
        { q: 'Code organisation: functions, meaningful names, no duplicated code.', pts: 4, sol: 'The required functions are written and reused; the main program is short and readable.' }],
        'Write it on the computer and run it: <b>a program that does not run is not reviewed</b> (0 points for this whole part).'),
    ] };
}

G.Written = { analisi: writtenAnalisi, chem: writtenChem, cs: writtenCS, _tasks: TASKS };
})(typeof window !== 'undefined' ? window : globalThis);
