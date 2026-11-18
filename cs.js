/* Computer Sciences (07JCJ, Python) — multiple-choice generator.
   Code questions carry {code, out} so the expected output can be checked against real Python. */
(function (G) {
'use strict';
const { rnd, mk, opt, pickByLevel } = G.Core;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const codeBlock = c => `<pre class="code">${esc(c)}</pre>`;
const outHtml = o => `<code>${esc(o).replace(/\n/g, '<br>') || '<i>(nothing)</i>'}</code>`;
const oOut = o => opt(outHtml(o), null, 'o:' + o);
const mk4 = (topic, L, q, right, wrongs, sol, o = {}) => mk(topic, L, q, right, wrongs, sol, { ...o, n: 4 });

/* ---------------- Python semantics helpers ---------------- */
const fdiv = (a, b) => Math.floor(a / b);
const pmod = (a, b) => a - b * Math.floor(a / b);
const pyFloat = x => (Number.isInteger(x) && Math.abs(x) < 1e16 ? x.toFixed(1) : String(x));
function repr(v) {
  if (v === null) return 'None'; if (v === true) return 'True'; if (v === false) return 'False';
  if (typeof v === 'number') return v.__f ? pyFloat(v) : String(v);
  if (typeof v === 'string') return "'" + v + "'";
  if (v instanceof Fl) return pyFloat(v.x);
  if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']';
  if (v instanceof Tup) return '(' + v.a.map(repr).join(', ') + (v.a.length === 1 ? ',' : '') + ')';
  if (v instanceof Map) return '{' + [...v.entries()].map(([k, x]) => repr(k) + ': ' + repr(x)).join(', ') + '}';
  return String(v);
}
class Fl { constructor(x) { this.x = x; } }
class Tup { constructor(a) { this.a = a; } }
const pstr = v => (typeof v === 'string' ? v : repr(v)); // what print() shows
const pr = (...vals) => vals.map(pstr).join(' ');
function pySlice(seq, start, stop, step = 1) {
  const n = seq.length, isStr = typeof seq === 'string'; const out = [];
  const norm = (i, def, lo, hi) => { if (i == null) return def; if (i < 0) i += n; return Math.max(lo, Math.min(hi, i)); };
  if (step > 0) { const s = norm(start, 0, 0, n), e = norm(stop, n, 0, n); for (let i = s; i < e; i += step) out.push(seq[i]); }
  else { const s = norm(start, n - 1, -1, n - 1), e = stop == null ? -1 : norm(stop, -1, -1, n - 1); for (let i = s; i > e; i += step) out.push(seq[i]); }
  return isStr ? out.join('') : out;
}
const sliceTxt = (a, b, c) => `${a ?? ''}:${b ?? ''}${c != null ? ':' + c : ''}`;
const WORDS = ['python', 'torino', 'computer', 'algorithm', 'politecnico', 'variable', 'function', 'keyboard', 'program', 'string', 'element', 'network'];
const NAMES = ['anna', 'luca', 'marco', 'sara', 'paolo', 'giulia', 'elena', 'matteo'];

function codeQ(topic, L, code, out, wrongs, sol, extra = {}) {
  const q = (extra.pre || 'What does the following program print?') + codeBlock(code);
  const res = mk4(topic, L, q, oOut(out), wrongs.filter(w => w != null).map(String).map(oOut), sol, extra.o);
  res.py = { code, out, exc: extra.exc || null };
  return res;
}

/* =====================================================================
   1. NUMBER SYSTEMS
   ===================================================================== */
const bin = (n, w) => n.toString(2).padStart(w || 0, '0');
const hex = n => n.toString(16).toUpperCase();
function numbers(L) {
  const kind = pickByLevel(L, [[1, 2, 'd2b'], [1, 2, 'b2d'], [2, 3, 'hex'], [3, 4, 'b2h'], [2, 3, 'oct'], [3, 5, 'c2'], [4, 5, 'c2v'], [5, 6, 'range'], [5, 6, 'ovf'], [4, 6, 'bits']]);
  const m_ = s => `<code>${s}</code>`;
  const O = s => opt(m_(s), null, s);
  if (kind === 'd2b') { const n = rnd.int(5, 255); const r = bin(n); return mk4('numbers', L, `The decimal number <b>${n}</b> in binary is`, O(r), [bin(n + 1), bin(n - 1), r.split('').reverse().join(''), bin(n ^ 2), bin(n ^ 8)].map(O), `Repeated division by 2 (remainders read bottom-up): ${n} = ${r}<sub>2</sub>.`); }
  if (kind === 'b2d') { const n = rnd.int(9, 255); const b = bin(n, 8); return mk4('numbers', L, `The 8-bit unsigned binary number <code>${b}</code> in decimal is`, O(String(n)), [n + 1, n - 1, parseInt(b.split('').reverse().join(''), 2), n ^ 1, n + 16, n - 32].filter(x => x >= 0).map(String).map(O), `Sum of the powers of 2 corresponding to the 1 bits: ${b.split('').map((c, i) => c === '1' ? 2 ** (7 - i) : null).filter(x => x != null).join(' + ')} = ${n}.`); }
  if (kind === 'hex') { const n = rnd.int(30, 4095); if (rnd.chance(0.5)) return mk4('numbers', L, `The decimal number <b>${n}</b> in hexadecimal is`, O(hex(n)), [hex(n + 1), hex(n - 1), hex(n).split('').reverse().join(''), String(n.toString(8)), hex(n + 16)].map(O), `Divide by 16 repeatedly: ${n} = ${hex(n)}<sub>16</sub>.`);
    return mk4('numbers', L, `The hexadecimal number <code>${hex(n)}</code> in decimal is`, O(String(n)), [n + 1, n - 16, parseInt(hex(n).split('').reverse().join(''), 16), parseInt(hex(n), 10) || n + 10, n + 256].map(String).map(O), `Each hex digit is worth a power of 16: ${hex(n).split('').map((c, i, a) => `${c}·16<sup>${a.length - 1 - i}</sup>`).join(' + ')} = ${n}.`); }
  if (kind === 'b2h') { const n = rnd.int(256, 65535); const b = bin(n, 16); const groups = b.match(/.{4}/g).join(' ');
    return mk4('numbers', L, `The binary number <code>${groups}</code> in hexadecimal is`, O(hex(n)), [hex(n ^ 1), hex(n ^ 256), hex(n).split('').reverse().join(''), hex(n ^ 16), hex(n >> 1)].map(O), `Convert each group of 4 bits into one hex digit: ${groups} → ${hex(n)}.`); }
  if (kind === 'oct') { const n = rnd.int(8, 511); if (rnd.chance(0.5)) return mk4('numbers', L, `The decimal number <b>${n}</b> in octal (base 8) is`, O(n.toString(8)), [(n + 1).toString(8), (n - 1).toString(8), hex(n), n.toString(8).split('').reverse().join(''), (n + 8).toString(8)].map(O), `Repeated division by 8: ${n} = ${n.toString(8)}<sub>8</sub>.`);
    const b = bin(n, 9); return mk4('numbers', L, `The binary number <code>${b}</code> in octal is`, O(n.toString(8)), [(n ^ 1).toString(8), (n ^ 64).toString(8), hex(n), n.toString(8).split('').reverse().join(''), (n >> 1).toString(8)].map(O), `Group the bits in threes from the right: ${b.match(/.{3}/g).join(' ')} → ${n.toString(8)}.`); }
  if (kind === 'c2') { const v = -rnd.int(1, 128); const two = bin(256 + v, 8); const sm = '1' + bin(-v, 7); const one = bin(255 + v + 1 - 1, 8); const ones = bin((~(-v)) & 255, 8);
    return mk4('numbers', L, `The number <b>${v}</b> represented in 8-bit two's complement is`, O(two), [-v <= 127 ? sm : null, ones !== two ? ones : null, bin(-v, 8), bin((256 + v + 1) & 255, 8), bin((256 + v - 1) & 255, 8)].filter(Boolean).filter(x => x !== one || true).map(O), `Write ${-v} in binary (${bin(-v, 8)}), invert all bits (${ones}) and add 1: ${two}.`); }
  if (kind === 'c2v') { const n = rnd.int(129, 255); const b = bin(n, 8); const v = n - 256;
    return mk4('numbers', L, `The 8-bit pattern <code>${b}</code> interpreted as a two's complement integer is`, O(String(v)), [String(n), String(-(n - 128)), String(v + 1), String(-((~n) & 255)), String(v - 1)].map(O), `The leading 1 means negative: value = ${n} − 256 = ${v}.`); }
  if (kind === 'range') { const w = rnd.pick([4, 6, 8, 10, 12, 16]); const signed = rnd.chance(0.6); const lo = signed ? -(2 ** (w - 1)) : 0, hi = signed ? 2 ** (w - 1) - 1 : 2 ** w - 1;
    const R = (a, b) => O(`[${a}, ${b}]`);
    return mk4('numbers', L, `The range of integers representable with <b>${w} bits</b> in ${signed ? "two's complement" : 'unsigned binary'} is`, R(lo, hi), [R(-(2 ** (w - 1)) + 1, 2 ** (w - 1) - 1), R(0, 2 ** w), R(-(2 ** w), 2 ** w - 1), R(-(2 ** (w - 1)), 2 ** (w - 1)), R(0, 2 ** w - 1), R(-(2 ** (w - 1)), 2 ** (w - 1) - 1)], signed ? `Two's complement on ${w} bits: from −2<sup>${w - 1}</sup> to 2<sup>${w - 1}</sup>−1.` : `Unsigned on ${w} bits: from 0 to 2<sup>${w}</sup>−1.`); }
  if (kind === 'ovf') { const a = rnd.int(-128, 127), b = rnd.int(-128, 127); const s = a + b; const ov = s > 127 || s < -128; const bits = bin((s + 256) & 255, 8);
    const st = (bb, o) => O(`${bb}, ${o ? 'overflow' : 'no overflow'}`);
    return mk4('numbers', L, `Using 8-bit two's complement, compute <code>${bin((a + 256) & 255, 8)}</code> + <code>${bin((b + 256) & 255, 8)}</code> (i.e. ${a} + ${b}).`, st(bits, ov), [st(bits, !ov), st(bin((s + 257) & 255, 8), ov), st(bin(Math.abs(s) & 255, 8), ov), st(bin((s + 255) & 255, 8), !ov)], `The true sum is ${s}, which ${ov ? 'is outside' : 'fits in'} the range [−128, 127]${ov ? ': overflow (both operands have the same sign and the result has the opposite sign)' : ''}. Bits of the result: ${bits}.`); }
  const n = rnd.int(3, 5000); const b = Math.ceil(Math.log2(n));
  return mk4('numbers', L, `What is the minimum number of bits needed to represent <b>${n}</b> different values?`, O(String(b)), [b + 1, b - 1, Math.ceil(n / 8), n.toString(2).length + 1, Math.floor(Math.log2(n))].filter(x => x > 0).map(String).map(O), `With k bits we get 2<sup>k</sup> values: the smallest k with 2<sup>k</sup> ≥ ${n} is ${b}.`);
}

/* =====================================================================
   2. BOOLEAN LOGIC
   ===================================================================== */
const PB = v => (v ? 'True' : 'False');
function logic(L) {
  const kind = pickByLevel(L, [[1, 2, 'eval'], [2, 3, 'cmp'], [3, 4, 'demorgan'], [4, 6, 'shortc'], [5, 6, 'count']]);
  if (kind === 'eval') { const a = rnd.chance(0.5), b = rnd.chance(0.5), c = rnd.chance(0.5);
    const forms = [['a and not b or c', (a && !b) || c], ['not a or b and c', !a || (b && c)], ['not (a or b) and c', !(a || b) && c], ['a or b and not c', a || (b && !c)], ['not a and not b or c', (!a && !b) || c]];
    const [e, v] = rnd.pick(forms); const code = `a = ${PB(a)}\nb = ${PB(b)}\nc = ${PB(c)}\nprint(${e})`;
    return codeQ('logic', L, code, PB(v), [PB(!v), 'None', 'Error'], 'Precedence: <code>not</code> > <code>and</code> > <code>or</code>. Evaluate step by step.'); }
  if (kind === 'cmp') { const x = rnd.int(-5, 10), y = rnd.int(-5, 10); const forms = [[`x > 3 and y < 5 or x == y`, (x > 3 && y < 5) || x === y], [`not x < y or y % 2 == 0`, !(x < y) || pmod(y, 2) === 0], [`0 < x < 8 and y != x`, 0 < x && x < 8 && y !== x], [`x % 3 == 0 or y > x and y > 0`, pmod(x, 3) === 0 || (y > x && y > 0)]];
    const [e, v] = rnd.pick(forms); return codeQ('logic', L, `x = ${x}\ny = ${y}\nprint(${e})`, PB(v), [PB(!v), 'None', String(x)], 'Comparisons are evaluated before <code>not</code>/<code>and</code>/<code>or</code>; Python allows chained comparisons such as <code>0 &lt; x &lt; 8</code>.'); }
  if (kind === 'demorgan') { const B = [['not (a and b)', 'not a or not b', ['not a and not b', 'a or b', 'not a or b']], ['not (a or b)', 'not a and not b', ['not a or not b', 'a and b', 'not a and b']], ['not (x > 0 and y > 0)', 'x <= 0 or y <= 0', ['x <= 0 and y <= 0', 'x < 0 or y < 0', 'x > 0 or y > 0']], ['not (x == 1 or y != 2)', 'x != 1 and y == 2', ['x != 1 or y == 2', 'x == 1 and y != 2', 'x != 1 and y != 2']]];
    const [e, r, w] = rnd.pick(B); const C = s => opt(`<code>${esc(s)}</code>`, null, s);
    return mk4('logic', L, `Which expression is <b>equivalent</b> to <code>${esc(e)}</code>?`, C(r), w.map(C), "De Morgan's laws: not (A and B) = not A or not B; not (A or B) = not A and not B."); }
  if (kind === 'shortc') { const B = [["print(0 or 'x')", 'x'], ["print(3 and 0)", '0'], ["print('' or [] or 5)", '5'], ["print(2 and 'ok')", 'ok'], ["print(None or 0)", '0'], ["print([] and 1/0)", '[]'], ["print(not '')", 'True'], ["print(7 or 1/0)", '7']];
    const [code, out] = rnd.pick(B); return codeQ('logic', L, code, out, ['True', 'False', '0', 'x', '5', 'None', 'ok', '[]', '7'].filter(x => x !== out), '<code>or</code> returns the first truthy operand (or the last one); <code>and</code> returns the first falsy operand (or the last one); evaluation stops as soon as the result is known.'); }
  const forms = [['(a or b) and not c', (a, b, c) => (a || b) && !c], ['a != b or c', (a, b, c) => a !== b || c], ['not a and (b or c)', (a, b, c) => !a && (b || c)], ['(a and b) or (not a and c)', (a, b, c) => (a && b) || (!a && c)]];
  const [e, f] = rnd.pick(forms); let n = 0; for (let i = 0; i < 8; i++) if (f(!!(i & 4), !!(i & 2), !!(i & 1))) n++;
  return mk4('logic', L, `For how many of the 8 combinations of the boolean values <code>a, b, c</code> is <code>${e}</code> True?`, opt(`<b>${n}</b>`, n), [n + 1, n - 1, 8 - n, n + 2, 4].filter(x => x >= 0 && x <= 8).map(x => opt(`<b>${x}</b>`, x)), 'Build the truth table (8 rows) and count the rows where the expression is True.');
}

/* =====================================================================
   3. EXPRESSIONS & TYPES
   ===================================================================== */
function expr(L) {
  const kind = pickByLevel(L, [[1, 2, 'divmod'], [1, 2, 'prec'], [2, 3, 'float'], [2, 4, 'type'], [3, 4, 'pow'], [3, 5, 'conv'], [4, 6, 'aug'], [5, 6, 'round']]);
  if (kind === 'divmod') { let a = rnd.int(-30, 40), b = rnd.nz(-7, 7); if (b === 0) b = 3; const code = `a = ${a}\nb = ${b}\nprint(a // b, a % b)`;
    const out = `${fdiv(a, b)} ${pmod(a, b)}`; return codeQ('expr', L, code, out, [`${Math.trunc(a / b)} ${a % b}`, `${fdiv(a, b)} ${a % b}`, `${a / b} ${pmod(a, b)}`, `${Math.trunc(a / b)} ${pmod(a, b)}`, `${fdiv(a, b) + 1} ${pmod(a, b)}`], 'In Python <code>//</code> rounds <b>down</b> (towards −∞) and the result of <code>%</code> has the sign of the divisor, so that <code>a == (a // b) * b + a % b</code>.'); }
  if (kind === 'prec') { const a = rnd.int(2, 9), b = rnd.int(2, 6), c = rnd.int(2, 5), d = rnd.int(10, 30), e = rnd.int(2, 5);
    const forms = [[`${a} + ${b} * ${c} - ${d} // ${e}`, a + b * c - fdiv(d, e), [(a + b) * c - fdiv(d, e), a + b * c - d / e, a + b * (c - fdiv(d, e))]], [`${d} - ${a} * ${b} % ${c}`, d - pmod(a * b, c), [pmod(d - a * b, c), d - a * pmod(b, c), (d - a) * b % c]], [`${a} * ${b} ** 2 - ${c}`, a * b * b - c, [(a * b) ** 2 - c, a * b * 2 - c, a * b ** (2 - c)]]];
    const [e2, v, w] = rnd.pick(forms); return codeQ('expr', L, `print(${e2})`, String(v), w.map(x => (Number.isInteger(x) ? String(x) : pyFloat(x))), 'Precedence: <code>**</code> first, then <code>* / // %</code> (left to right), then <code>+ -</code>.'); }
  if (kind === 'float') { const b = rnd.pick([2, 4, 5, 8]); const a = rnd.int(3, 40); const code = `x = ${a} / ${b}\ny = ${a} // ${b}\nprint(x, y)`;
    return codeQ('expr', L, code, `${pyFloat(a / b)} ${fdiv(a, b)}`, [`${fdiv(a, b)} ${fdiv(a, b)}`, `${pyFloat(a / b)} ${pyFloat(fdiv(a, b))}`, `${pyFloat(a / b)} ${pyFloat(a / b)}`, `${fdiv(a, b)} ${pyFloat(a / b)}`], '<code>/</code> always produces a <code>float</code>; <code>//</code> between integers produces an <code>int</code>.'); }
  if (kind === 'type') { const B = [['7 / 7', 'float'], ['7 // 2', 'int'], ["'3' * 2", 'str'], ['3 > 2', 'bool'], ['2 ** 0.5', 'float'], ['len("abc")', 'int'], ['[1, 2][0]', 'int'], ["'12' + '3'", 'str'], ['int(3.9)', 'int'], ['3 + 2.0', 'float'], ['(1, 2)', 'tuple'], ["{'a': 1}", 'dict']];
    const [e, t] = rnd.pick(B); const out = `<class '${t}'>`; return codeQ('expr', L, `print(type(${e}))`, out, ['int', 'float', 'str', 'bool', 'tuple', 'list', 'dict'].filter(x => x !== t).map(x => `<class '${x}'>`), `The expression <code>${esc(e)}</code> has type <code>${t}</code>.`); }
  if (kind === 'pow') { const B = [['2 ** 3 ** 2', '512', ['64', '36', '256']], ['-2 ** 2', '-4', ['4', '-2', '2']], ['(-2) ** 3', '-8', ['8', '-6', '6']], ['2 ** -1', '0.5', ['-2', '0', '2']], ['10 ** 2 // 3 ** 2', '11', ['11.1', '1', '33']], ['9 ** 0.5', '3.0', ['3', '4.5', '81']]];
    const [e, o, w] = rnd.pick(B); return codeQ('expr', L, `print(${e})`, o, w, '<code>**</code> is right-associative and binds more tightly than the unary minus; a negative or fractional exponent gives a float.'); }
  if (kind === 'conv') { const a = rnd.int(10, 99), f = rnd.int(2, 9) + rnd.pick([0.5, 0.25, 0.75, 0.9]); const B = [[`print(int('${a}') + int(${f}))`, String(a + Math.trunc(f)), [String(a) + String(Math.trunc(f)), pyFloat(a + f), String(a + Math.round(f))]], [`print(str(${a}) + '${a % 10}')`, `${a}${a % 10}`, [String(a + (a % 10)), `${a} ${a % 10}`, 'Error']], [`print(float(${a}) / 2)`, pyFloat(a / 2), [String(fdiv(a, 2)), pyFloat(fdiv(a, 2)), String(a / 2).replace('.5', '')]], [`print('${a}' * 2)`, `${a}${a}`, [String(2 * a), `${a} ${a}`, 'Error']]];
    const [code, o, w] = rnd.pick(B); return codeQ('expr', L, code, o, w, 'Conversions: <code>int()</code> truncates a float towards zero; <code>+</code> between strings concatenates; <code>*</code> with a string repeats it.'); }
  if (kind === 'aug') { let x = rnd.int(3, 12); const ops = rnd.shuffle([['+=', rnd.int(1, 9)], ['*=', rnd.int(2, 4)], ['//=', rnd.int(2, 4)], ['-=', rnd.int(1, 9)], ['%=', rnd.int(3, 7)]]).slice(0, 3); const lines = [`x = ${x}`]; const steps = [x];
    for (const [op, v] of ops) { lines.push(`x ${op} ${v}`); x = op === '+=' ? x + v : op === '*=' ? x * v : op === '//=' ? fdiv(x, v) : op === '-=' ? x - v : pmod(x, v); steps.push(x); }
    lines.push('print(x)'); return codeQ('expr', L, lines.join('\n'), String(x), [steps[steps.length - 2], steps[1], x + 1, x * 2, steps[0]].map(String), `Values of x after each line: ${steps.join(' → ')}.`); }
  const B = [['print(round(2.5), round(3.5))', '2 4', ['3 4', '2 3', '3 3']], ['print(round(7.456, 1))', '7.5', ['7.4', '7.46', '7']], ['print(abs(-3) + round(-1.5))', '1', ['2', '5', '4']], ['print(round(0.5) + round(1.5))', '2', ['3', '1', '2.0']]];
  const [code, o, w] = rnd.pick(B); return codeQ('expr', L, code, o, w, 'Python 3 uses "round half to even" (banker\'s rounding): <code>round(2.5)</code> is 2 and <code>round(3.5)</code> is 4.');
}

/* =====================================================================
   4. STRINGS
   ===================================================================== */
function strings(L) {
  const kind = pickByLevel(L, [[1, 2, 'index'], [1, 3, 'slice'], [2, 4, 'method'], [3, 4, 'split'], [3, 5, 'loop'], [4, 6, 'fmt'], [5, 6, 'cmp'], [4, 6, 'immut']]);
  const w = rnd.pick(WORDS);
  if (kind === 'index') { const i = rnd.int(0, w.length - 1), j = -rnd.int(1, w.length); const code = `s = "${w}"\nprint(s[${i}], s[${j}], len(s))`;
    return codeQ('strings', L, code, `${w[i]} ${w[w.length + j]} ${w.length}`, [`${w[i + 1] || w[0]} ${w[w.length + j]} ${w.length}`, `${w[i]} ${w[w.length + j - 1] || w[0]} ${w.length}`, `${w[i]} ${w[w.length + j]} ${w.length - 1}`, `${w[Math.max(0, i - 1)]} ${w[(w.length + j + 1) % w.length]} ${w.length}`], 'Indices start from 0; negative indices count from the end (<code>s[-1]</code> is the last character).'); }
  if (kind === 'slice') { const forms = [[rnd.int(0, 3), rnd.int(4, w.length), null], [null, rnd.int(2, 5), null], [rnd.int(1, 4), null, null], [null, null, -1], [null, null, 2], [rnd.int(0, 2), null, 2], [-rnd.int(2, 4), null, null], [null, -rnd.int(1, 3), null], [w.length - 1, 0, -1]];
    const [a, b, c] = rnd.pick(forms); const out = pySlice(w, a, b, c ?? 1); const code = `s = "${w}"\nprint(s[${sliceTxt(a, b, c)}])`;
    const w1 = pySlice(w, a, b == null ? b : b + 1, c ?? 1), w2 = pySlice(w, a == null ? a : a + 1, b, c ?? 1), w3 = pySlice(w, a == null ? 1 : a - 1 < 0 && a >= 0 ? a : a - 1, b, c ?? 1), w4 = out.split('').reverse().join('');
    return codeQ('strings', L, code, out, [w1, w2, w3, w4, out.slice(1), out + w[0]], '<code>s[a:b:c]</code> takes the characters from index a (included) to b (excluded) with step c; omitted values default to the start/end, negative ones count from the end.'); }
  if (kind === 'method') { const ch = rnd.pick(w.split('')); const B = [[`s.find("${ch}")`, String(w.indexOf(ch)), [w.lastIndexOf(ch), w.indexOf(ch) + 1, -1]], [`s.count("${ch}")`, String(w.split(ch).length - 1), [w.split(ch).length, 1, w.indexOf(ch)]], [`s.upper()`, w.toUpperCase(), [w[0].toUpperCase() + w.slice(1), w, 'None']], [`s.replace("${ch}", "*")`, w.split(ch).join('*'), [w.replace(ch, '*'), w, '*']], [`s.capitalize()`, w[0].toUpperCase() + w.slice(1), [w.toUpperCase(), w, 'None']], [`s.find("z")`, '-1', ['0', 'None', 'Error']], [`s.startswith("${w.slice(0, 2)}")`, 'True', ['False', w.slice(0, 2), '0']]];
    const [e, o, ws] = rnd.pick(B); return codeQ('strings', L, `s = "${w}"\nprint(${e})`, o, ws.map(String), 'String methods return a <b>new</b> value (strings are immutable); <code>find</code> returns the first index or −1, <code>replace</code> replaces all occurrences.'); }
  if (kind === 'split') { const ws = rnd.shuffle(NAMES).slice(0, rnd.int(3, 5)); const sep = rnd.pick([',', ';', '-']); const line = ws.join(sep);
    const B = [[`parts = "${line}".split("${sep}")\nprint(len(parts), parts[1])`, `${ws.length} ${ws[1]}`, [`${ws.length - 1} ${ws[1]}`, `${ws.length} ${ws[0]}`, `${line.length} ${ws[1]}`]], [`parts = "${line}".split("${sep}")\nprint("+".join(parts))`, ws.join('+'), [line, ws.join(' + '), repr(ws)]], [`parts = "${line}".split("${sep}")\nprint(parts)`, repr(ws), [ws.join(' '), repr([line]), repr(ws.map(x => x + sep))]]];
    const [code, o, w2] = rnd.pick(B); return codeQ('strings', L, code, o, w2, '<code>split(sep)</code> returns a list of the pieces; <code>sep.join(list)</code> glues them back together.'); }
  if (kind === 'loop') { const s = rnd.pick(['Politecnico di Torino', 'Hello World 2024', 'Computer Science A', 'Python Is Fun', 'Mamma Mia 3']);
    const B = [['vowels', `n = 0\nfor ch in s:\n    if ch in "aeiouAEIOU":\n        n += 1\nprint(n)`, s.split('').filter(c => 'aeiouAEIOU'.includes(c)).length], ['upper', `n = 0\nfor ch in s:\n    if ch.isupper():\n        n += 1\nprint(n)`, s.split('').filter(c => c >= 'A' && c <= 'Z').length], ['digits', `n = 0\nfor ch in s:\n    if ch.isdigit():\n        n += 1\nprint(n)`, s.split('').filter(c => c >= '0' && c <= '9').length], ['spaces', `n = 0\nfor ch in s:\n    if ch == " ":\n        n += 1\nprint(n + 1)`, s.split(' ').length]];
    const [, body, v] = rnd.pick(B); return codeQ('strings', L, `s = "${s}"\n` + body, String(v), [v + 1, v - 1, v + 2, s.length].map(String), 'Trace the loop: it examines one character at a time and increments the counter when the condition holds.'); }
  if (kind === 'fmt') { const x = Number((rnd.int(1, 99) + rnd.pick([0.3, 0.7, 0.15, 0.85, 0.5, 0.123, 0.987, 0.456])).toFixed(3)); const n = rnd.int(1, 999);
    const B = [[`x = ${x}\nprint(f"{x:.2f}")`, x.toFixed(2), [x.toFixed(3), String(x), x.toFixed(1)]], [`n = ${n}\nprint(f"[{n:5d}]")`, `[${String(n).padStart(5)}]`, [`[${n}]`, `[${String(n).padEnd(5)}]`, `[${String(n).padStart(5, '0')}]`]], [`n = ${n}\nprint(f"{n:05d}")`, String(n).padStart(5, '0'), [String(n).padStart(5), String(n), String(n) + '00000'.slice(String(n).length)]], [`x = ${x}\nprint(f"{x:8.1f}|")`, x.toFixed(1).padStart(8) + '|', [x.toFixed(1) + '|', x.toFixed(1).padEnd(8) + '|', x.toFixed(2).padStart(8) + '|']]];
    const [code, o, w2] = rnd.pick(B); for (const d of [1, 2, 3]) if (Math.abs((x * 10 ** d) % 1 - 0.5) < 1e-9) throw new Error('rounding tie'); return codeQ('strings', L, code, o, w2, 'Format specifiers: <code>.2f</code> = 2 decimals, <code>5d</code> = integer in a field of width 5 (right aligned), <code>05d</code> = padded with zeros.'); }
  if (kind === 'cmp') { const B = [["print('10' < '9')", 'True', ['False', 'Error', 'None']], ["print('Zebra' < 'apple')", 'True', ['False', 'Error', 'None']], ["print('abc' < 'abd', 'b' > 'abc')", 'True True', ['True False', 'False True', 'False False']], ["print(ord('A'), chr(98))", '65 b', ['97 b', '65 B', '66 b']], ["print('py' * 2 == 'pypy', 'a' in 'banana')", 'True True', ['True False', 'False True', 'Error']]];
    const [code, o, w2] = rnd.pick(B); return codeQ('strings', L, code, o, w2, 'Strings are compared character by character using the character codes (<code>ord</code>): all uppercase letters come before the lowercase ones, digits before letters.'); }
  const code = `s = "${w}"\ns[0] = "X"\nprint(s)`;
  return codeQ('strings', L, code, 'TypeError', ['X' + w.slice(1), w, 'X'], 'Strings are <b>immutable</b>: assigning to <code>s[0]</code> raises <code>TypeError</code>. Build a new string instead, e.g. <code>"X" + s[1:]</code>.', { pre: 'What happens when the following program is executed? (If an error occurs, choose its type.)', exc: 'TypeError' });
}

/* =====================================================================
   5. CONDITIONALS
   ===================================================================== */
function cond(L) {
  const x = rnd.int(-10, 25);
  const forms = [
    [`if x > 10:\n    print("big")\nelif x > 0:\n    print("small")\nelse:\n    print("negative")`, x > 10 ? 'big' : x > 0 ? 'small' : 'negative', ['big', 'small', 'negative', 'big\nsmall']],
    [`if x % 2 == 0:\n    print("even")\nif x % 3 == 0:\n    print("three")\nelse:\n    print("other")`, (pmod(x, 2) === 0 ? 'even\n' : '') + (pmod(x, 3) === 0 ? 'three' : 'other'), ['even', 'three', 'other', 'even\nthree', 'even\nother']],
    [`if x > 5 and x < 15:\n    y = x * 2\nelif x >= 15:\n    y = x - 15\nelse:\n    y = -x\nprint(y)`, String(x > 5 && x < 15 ? x * 2 : x >= 15 ? x - 15 : -x), [String(x * 2), String(x - 15), String(-x), String(x)]],
    [`if not x < 0:\n    if x > 12:\n        print("A")\n    else:\n        print("B")\nelse:\n    print("C")`, !(x < 0) ? (x > 12 ? 'A' : 'B') : 'C', ['A', 'B', 'C', 'A\nB']],
    [`if 0 <= x <= 9:\n    print(x)\nelif x > 9:\n    print(x // 10, x % 10)\nelse:\n    print(abs(x))`, (0 <= x && x <= 9) ? String(x) : x > 9 ? `${fdiv(x, 10)} ${pmod(x, 10)}` : String(Math.abs(x)), [String(x), `${fdiv(x, 10)} ${pmod(x, 10)}`, String(Math.abs(x)), `${Math.trunc(x / 10)} ${x % 10}`, String(-x)]],
  ];
  const lv = L <= 2 ? forms.slice(0, 2) : forms;
  const [body, out, w] = rnd.pick(lv);
  return codeQ('cond', L, `x = ${x}\n` + body, out, w.filter(v => v !== out), 'Only the first true branch of an <code>if/elif/else</code> chain is executed; separate <code>if</code> statements are each evaluated.');
}

/* =====================================================================
   6. LOOPS
   ===================================================================== */
const rng = (a, b, c = 1) => { const o = []; if (c > 0) for (let i = a; i < b; i += c) o.push(i); else for (let i = a; i > b; i += c) o.push(i); return o; };
function loops(L) {
  const kind = pickByLevel(L, [[1, 2, 'sum'], [1, 3, 'len'], [2, 3, 'while'], [3, 4, 'nested'], [4, 5, 'brk'], [4, 6, 'digits'], [5, 6, 'print']]);
  if (kind === 'sum') { const a = rnd.int(0, 5), b = a + rnd.int(4, 12), c = rnd.pick([1, 2, 3]); const xs = rng(a, b, c); const s = xs.reduce((p, q) => p + q, 0);
    return codeQ('loops', L, `total = 0\nfor i in range(${a}, ${b}${c === 1 ? '' : ', ' + c}):\n    total += i\nprint(total)`, String(s), [s + b, s - a, rng(a, b + 1, c).reduce((p, q) => p + q, 0), rng(a + 1, b, c).reduce((p, q) => p + q, 0), s + c].map(String), `<code>range(${a}, ${b}${c === 1 ? '' : ', ' + c})</code> produces ${xs.join(', ')} (the end ${b} is excluded); their sum is ${s}.`); }
  if (kind === 'len') { let a = rnd.int(-5, 10), b = rnd.int(-5, 20), c = rnd.nz(-4, 4); const n = rng(a, b, c).length;
    return codeQ('loops', L, `count = 0\nfor k in range(${a}, ${b}, ${c}):\n    count += 1\nprint(count)`, String(n), [n + 1, n - 1, Math.abs(b - a), Math.max(0, Math.floor(Math.abs(b - a) / Math.abs(c)) + 1)].map(String), `The values are ${rng(a, b, c).join(', ') || '(none)'}: ${n} iteration(s). With a ${c > 0 ? 'positive' : 'negative'} step the loop stops before reaching ${b}.`); }
  if (kind === 'while') { const N = rnd.int(10, 200), d = rnd.pick([2, 3]); let n = N, k = 0; while (n > 1) { n = fdiv(n, d); k++; }
    return codeQ('loops', L, `n = ${N}\ncount = 0\nwhile n > 1:\n    n = n // ${d}\n    count += 1\nprint(count, n)`, `${k} ${n}`, [`${k + 1} ${n}`, `${k - 1} ${n}`, `${k} 1`, `${k} 0`, `${k + 1} 0`], `Trace n: ${(() => { let x = N; const t = [x]; while (x > 1) { x = fdiv(x, d); t.push(x); } return t.join(' → '); })()}.`); }
  if (kind === 'nested') { const a = rnd.int(2, 5), b = rnd.int(3, 6); const forms = [[`for i in range(${a}):\n    for j in range(${b}):\n        c += 1`, a * b], [`for i in range(${a}):\n    for j in range(i, ${b}):\n        c += 1`, rng(0, a).reduce((s, i) => s + Math.max(0, b - i), 0)], [`for i in range(${a}):\n    for j in range(i):\n        c += 1`, a * (a - 1) / 2], [`for i in range(1, ${b}):\n    for j in range(${a}):\n        if (i + j) % 2 == 0:\n            c += 1`, rng(1, b).reduce((s, i) => s + rng(0, a).filter(j => (i + j) % 2 === 0).length, 0)]];
    const [body, v] = rnd.pick(forms); return codeQ('loops', L, `c = 0\n${body}\nprint(c)`, String(v), [v + 1, v - 1, a * b, a + b, (a + 1) * (b + 1)].map(String), 'Count the iterations of the inner loop for each value of the outer variable and add them up.'); }
  if (kind === 'brk') { const lim = rnd.int(15, 60), k = rnd.int(2, 5); let s = 0, last = 0; for (let i = 1; i < 100; i++) { if (i % k === 0) continue; if (s + i > lim) break; s += i; last = i; }
    return codeQ('loops', L, `s = 0\nfor i in range(1, 100):\n    if i % ${k} == 0:\n        continue\n    if s + i > ${lim}:\n        break\n    s += i\nprint(s, i)`, `${s} ${(() => { let t = 0; for (let i = 1; i < 100; i++) { if (i % k === 0) continue; if (t + i > lim) return i; t += i; } return 99; })()}`, [`${s} ${last}`, `${s + last + 1} ${last + 1}`, `${s} 99`, `${s - last} ${last}`], '<code>continue</code> skips the rest of the current iteration; <code>break</code> leaves the loop immediately (the loop variable keeps its last value).'); }
  if (kind === 'digits') { const N = rnd.int(100, 99999); const ds = String(N).split('').map(Number); const forms = [[`s = 0\nwhile n > 0:\n    s += n % 10\n    n //= 10\nprint(s)`, ds.reduce((a, b) => a + b, 0)], [`r = 0\nwhile n > 0:\n    r = r * 10 + n % 10\n    n //= 10\nprint(r)`, Number(ds.slice().reverse().join(''))], [`c = 0\nwhile n > 0:\n    if n % 10 % 2 == 0:\n        c += 1\n    n //= 10\nprint(c)`, ds.filter(d => d % 2 === 0).length]];
    const [body, v] = rnd.pick(forms); return codeQ('loops', L, `n = ${N}\n${body}`, String(v), [v + 1, v - 1, ds.length, N % 10, ds[0]].map(String), '<code>n % 10</code> is the last digit and <code>n //= 10</code> removes it; trace the loop digit by digit.'); }
  const n = rnd.int(3, 6), c = rnd.pick([',', '-', '']); const J = arr => arr.map(v => v + c).join(''); const out = J(rng(0, n).map(i => i * i));
  return codeQ('loops', L, `for i in range(${n}):\n    print(i * i, end="${c}")`, out, [J(rng(1, n + 1).map(i => i * i)), rng(0, n).map(i => i * i).join('\n'), J(rng(0, n).map(i => 2 * i)), J(rng(0, n - 1).map(i => i * i)), c ? rng(0, n).map(i => i * i).join(c) : null].filter(Boolean), '<code>end</code> replaces the newline normally printed at the end of each <code>print</code> (so it also appears after the last value).');
}

/* =====================================================================
   7. FUNCTIONS
   ===================================================================== */
function functions(L) {
  const kind = pickByLevel(L, [[1, 2, 'basic'], [2, 3, 'default'], [2, 4, 'scope'], [3, 4, 'none'], [4, 5, 'mutable'], [5, 6, 'rec'], [5, 6, 'global']]);
  if (kind === 'basic') { const a = rnd.int(2, 9), b = rnd.int(1, 5), x = rnd.int(1, 6), y = rnd.int(1, 6); const f = v => a * v - b;
    return codeQ('functions', L, `def f(v):\n    return ${a} * v - ${b}\n\nprint(f(${x}) + f(${y}))`, String(f(x) + f(y)), [f(x + y), f(x) * f(y), f(x), a * (x + y) - b].map(String), `f(${x}) = ${f(x)}, f(${y}) = ${f(y)}.`); }
  if (kind === 'default') { const a = rnd.int(2, 5), b = rnd.int(1, 4), x = rnd.int(1, 6), y = rnd.int(1, 6); const f = (p, q = a) => p * q + b;
    return codeQ('functions', L, `def g(p, q=${a}):\n    return p * q + ${b}\n\nprint(g(${x}), g(${x}, ${y}), g(q=${y}, p=1))`, `${f(x)} ${f(x, y)} ${f(1, y)}`, [`${f(x)} ${f(y, x)} ${f(y, 1)}`, `${f(x, 0)} ${f(x, y)} ${f(1, y)}`, `${f(x)} ${f(x, y)} ${f(y, 1)}`, `${x * a} ${x * y} ${y}`], 'A parameter with a default value is used when the argument is omitted; keyword arguments are matched by name, not by position.'); }
  if (kind === 'scope') { const x = rnd.int(1, 9), y = rnd.int(10, 30);
    return codeQ('functions', L, `x = ${x}\n\ndef change():\n    x = ${y}\n    return x\n\nr = change()\nprint(x, r)`, `${x} ${y}`, [`${y} ${y}`, `${x} ${x}`, `${y} ${x}`], 'The assignment inside the function creates a <b>local</b> variable <code>x</code>; the global <code>x</code> is not modified.'); }
  if (kind === 'none') { const n = rnd.int(2, 9);
    return codeQ('functions', L, `def double(n):\n    print(n * 2)\n\nr = double(${n})\nprint(r)`, `${2 * n}\nNone`, [`${2 * n}\n${2 * n}`, `${2 * n}`, `None`, `${2 * n}\n0`], 'The function <b>prints</b> but does not <b>return</b> anything: its return value is <code>None</code>.'); }
  if (kind === 'mutable') { const xs = [rnd.int(1, 5), rnd.int(1, 5)]; const v = rnd.int(6, 9);
    const forms = [[`def add(lst):\n    lst.append(${v})\n\na = ${repr(xs)}\nadd(a)\nprint(a)`, repr([...xs, v]), [repr(xs), repr([v]), 'None']], [`def reset(lst):\n    lst = [${v}]\n\na = ${repr(xs)}\nreset(a)\nprint(a)`, repr(xs), [repr([v]), repr([...xs, v]), '[]']], [`def inc(n):\n    n += 1\n\nk = ${xs[0]}\ninc(k)\nprint(k)`, String(xs[0]), [String(xs[0] + 1), 'None', '0']]];
    const [code, o, w] = rnd.pick(forms); return codeQ('functions', L, code, o, w, 'Arguments are passed by object reference: a method like <code>append</code> modifies the caller\'s list, but re-assigning the parameter (or modifying an immutable int) only changes the local name.'); }
  if (kind === 'rec') { const n = rnd.int(3, 7); const forms = [[`def f(n):\n    if n <= 1:\n        return 1\n    return n * f(n - 1)\n\nprint(f(${n}))`, [1, 1, 2, 6, 24, 120, 720, 5040][n]], [`def f(n):\n    if n < 2:\n        return n\n    return f(n - 1) + f(n - 2)\n\nprint(f(${n}))`, [0, 1, 1, 2, 3, 5, 8, 13][n]], [`def f(n):\n    if n == 0:\n        return 0\n    return n % 10 + f(n // 10)\n\nprint(f(${n * 137}))`, String(n * 137).split('').reduce((a, b) => a + +b, 0)], [`def f(s):\n    if len(s) <= 1:\n        return s\n    return f(s[1:]) + s[0]\n\nprint(f("${WORDS[n].slice(0, 5)}"))`, WORDS[n].slice(0, 5).split('').reverse().join('')]];
    const [code, v] = rnd.pick(forms); const w = typeof v === 'number' ? [v + 1, v - 1, v * 2, n].map(String) : [v.slice(1) + v[0], WORDS[n].slice(0, 5), v.slice(0, -1)]; return codeQ('functions', L, code, String(v), w, 'Unfold the recursion down to the base case, then combine the results on the way back.'); }
  const x = rnd.int(1, 5), k = rnd.int(2, 4);
  return codeQ('functions', L, `count = ${x}\n\ndef bump():\n    global count\n    count += ${k}\n\nbump()\nbump()\nprint(count)`, String(x + 2 * k), [String(x), String(x + k), 'UnboundLocalError'], 'With <code>global count</code> the function modifies the global variable; each call adds ' + k + '.');
}

/* =====================================================================
   8. LISTS & TABLES
   ===================================================================== */
function lists(L) {
  const kind = pickByLevel(L, [[1, 2, 'ops'], [1, 3, 'slice'], [2, 4, 'alias'], [3, 4, 'comp'], [3, 5, 'table'], [4, 6, 'sortnone'], [4, 6, 'remove'], [5, 6, 'agg']]);
  const xs = Array.from({ length: rnd.int(4, 6) }, () => rnd.int(1, 20));
  if (kind === 'ops') { const a = xs.slice(); const v = rnd.int(21, 30), i = rnd.int(0, a.length - 1); const code = `a = ${repr(a)}\na.append(${v})\na.insert(${i}, 0)\nx = a.pop()\nprint(a, x)`;
    const b = a.slice(); b.push(v); b.splice(i, 0, 0); const x = b.pop(); return codeQ('lists', L, code, `${repr(b)} ${x}`, [`${repr([...b, x])} ${x}`, `${repr(b.slice(1))} ${b[0]}`, (() => { const c = a.slice(); c.push(v); c.splice(i + 1, 0, 0); c.pop(); return `${repr(c)} ${v}`; })(), `${repr(b)} None`], '<code>append</code> adds at the end, <code>insert(i, x)</code> inserts before index i, <code>pop()</code> removes and returns the last element.'); }
  if (kind === 'slice') { const forms = [[1, 4, null], [null, 3, null], [-2, null, null], [null, null, -1], [null, null, 2], [1, null, 2], [-3, -1, null]]; const [a, b, c] = rnd.pick(forms); const out = pySlice(xs, a, b, c ?? 1);
    return codeQ('lists', L, `a = ${repr(xs)}\nprint(a[${sliceTxt(a, b, c)}])`, repr(out), [repr(pySlice(xs, a, b == null ? b : b + 1, c ?? 1)), repr(pySlice(xs, a == null ? 1 : a + 1, b, c ?? 1)), repr(out.slice().reverse()), repr(out.slice(1)), repr([...out, xs[0]])], 'List slicing works like string slicing and returns a new list.'); }
  if (kind === 'alias') { const v = rnd.int(90, 99); const copy = rnd.chance(0.5);
    const code = `a = ${repr(xs)}\nb = a${copy ? '[:]' : ''}\nb[0] = ${v}\nprint(a[0], b[0])`; return codeQ('lists', L, code, copy ? `${xs[0]} ${v}` : `${v} ${v}`, [copy ? `${v} ${v}` : `${xs[0]} ${v}`, `${xs[0]} ${xs[0]}`, `${v} ${xs[0]}`], copy ? '<code>a[:]</code> creates a <b>copy</b>: modifying b does not affect a.' : '<code>b = a</code> does not copy the list: both names refer to the <b>same</b> list object (aliasing).'); }
  if (kind === 'comp') { const n = rnd.int(5, 9), d = rnd.pick([2, 3]); const forms = [[`[x * x for x in range(${n}) if x % ${d} == 0]`, rng(0, n).filter(x => x % d === 0).map(x => x * x)], [`[x for x in range(1, ${n}) if x % ${d} != 0]`, rng(1, n).filter(x => x % d !== 0)], [`[c.upper() for c in "${WORDS[n].slice(0, 4)}"]`, WORDS[n].slice(0, 4).toUpperCase().split('')], [`[i + j for i in range(2) for j in range(${d})]`, rng(0, 2).flatMap(i => rng(0, d).map(j => i + j))]];
    const [e, v] = rnd.pick(forms); return codeQ('lists', L, `print(${e})`, repr(v), [repr(v.slice(1)), repr([...v, typeof v[0] === 'number' ? v[v.length - 1] + 1 : 'X']), repr(v.slice().reverse()), repr(v.map(x => (typeof x === 'number' ? x + 1 : x.toLowerCase())))], 'A list comprehension builds a new list: for each value of the loop (and only if the condition is true) it evaluates the expression.'); }
  if (kind === 'table') { const R = rnd.int(2, 3), C = rnd.int(3, 4); const t = Array.from({ length: R }, () => Array.from({ length: C }, () => rnd.int(1, 9))); const i = rnd.int(0, R - 1), j = rnd.int(0, C - 1);
    const forms = [[`print(t[${i}][${j}], len(t), len(t[0]))`, `${t[i][j]} ${R} ${C}`, [`${t[j] ? t[j][i] ?? t[0][0] : t[0][0]} ${R} ${C}`, `${t[i][j]} ${C} ${R}`, `${t[i][j]} ${R * C} ${C}`]], [`s = 0\nfor row in t:\n    s += row[${j}]\nprint(s)`, String(t.reduce((s, r) => s + r[j], 0)), [String(t[i].reduce((a, b) => a + b, 0)), String(t.reduce((s, r) => s + r[j], 0) + 1), String(t.flat().reduce((a, b) => a + b, 0))]], [`print([row[${j}] for row in t])`, repr(t.map(r => r[j])), [repr(t[Math.min(j, R - 1)]), repr(t.map(r => r[(j + 1) % C])), repr(t.map(r => r[j]).reverse())]], [`print(sum(t[${i}]), max(t[${i}]))`, `${t[i].reduce((a, b) => a + b, 0)} ${Math.max(...t[i])}`, [`${t[i].reduce((a, b) => a + b, 0)} ${Math.min(...t[i])}`, `${t.map(r => r[i % C]).reduce((a, b) => a + b, 0)} ${Math.max(...t[i])}`, `${t[i].length} ${Math.max(...t[i])}`]]];
    const [body, o, w] = rnd.pick(forms); return codeQ('lists', L, `t = ${repr(t)}\n${body}`, o, w, 'A table is a list of rows: <code>t[i][j]</code> is row i, column j; <code>len(t)</code> is the number of rows.'); }
  if (kind === 'sortnone') { const forms = [[`a = ${repr(xs)}\nb = a.sort()\nprint(b)`, 'None', [repr(xs.slice().sort((p, q) => p - q)), repr(xs), '[]']], [`a = ${repr(xs)}\nb = sorted(a)\nprint(a[0], b[0])`, `${xs[0]} ${Math.min(...xs)}`, [`${Math.min(...xs)} ${Math.min(...xs)}`, `${xs[0]} ${xs[0]}`, `${Math.min(...xs)} ${xs[0]}`]], [`a = ${repr(xs)}\na.sort(reverse=True)\nprint(a[:2])`, repr(xs.slice().sort((p, q) => q - p).slice(0, 2)), [repr(xs.slice().sort((p, q) => p - q).slice(0, 2)), repr(xs.slice(0, 2)), 'None']]];
    const [code, o, w] = rnd.pick(forms); return codeQ('lists', L, code, o, w, '<code>list.sort()</code> sorts in place and returns <code>None</code>; <code>sorted(list)</code> returns a new sorted list and leaves the original unchanged.'); }
  if (kind === 'remove') { const a = [3, 7, 3, 9, 7, 3].slice(0, rnd.int(5, 6)); const v = rnd.pick([3, 7]); const b = a.slice(); b.splice(b.indexOf(v), 1);
    return codeQ('lists', L, `a = ${repr(a)}\na.remove(${v})\nprint(a, a.count(${v}), a.index(${v}))`, `${repr(b)} ${b.filter(x => x === v).length} ${b.indexOf(v)}`, [`${repr(a.filter(x => x !== v))} 0 -1`, `${repr(b)} ${a.filter(x => x === v).length} ${b.indexOf(v)}`, `${repr(a.slice(0, a.lastIndexOf(v)).concat(a.slice(a.lastIndexOf(v) + 1)))} ${b.filter(x => x === v).length} ${a.indexOf(v)}`, `${repr(b)} ${b.filter(x => x === v).length} ${b.lastIndexOf(v)}`], '<code>remove(x)</code> deletes only the <b>first</b> occurrence; <code>index(x)</code> returns the first position.'); }
  const forms = [[`a = ${repr(xs)}\nprint(sum(a) // len(a), max(a) - min(a))`, `${fdiv(xs.reduce((p, q) => p + q, 0), xs.length)} ${Math.max(...xs) - Math.min(...xs)}`], [`a = ${repr(xs)}\nb = a * 2\nprint(len(b), b[${xs.length}])`, `${2 * xs.length} ${xs[0]}`], [`a = ${repr(xs)}\nc = 0\nfor v in a:\n    if v > a[0]:\n        c += 1\nprint(c)`, String(xs.filter(v => v > xs[0]).length)]];
  const [code, o] = rnd.pick(forms); const parts = o.split(' ').map(Number);
  return codeQ('lists', L, code, o, [parts.map(x => x + 1).join(' '), parts.map((x, i) => (i === 0 ? x + 1 : x)).join(' '), parts.map((x, i) => (i === parts.length - 1 ? x - 1 : x)).join(' '), parts.map(x => x * 2).join(' ')], 'Trace the code with the given values.');
}

/* =====================================================================
   9. DICTIONARIES, SETS, TUPLES
   ===================================================================== */
function dicts(L) {
  const kind = pickByLevel(L, [[1, 3, 'count'], [2, 3, 'get'], [3, 4, 'sets'], [3, 5, 'iter'], [4, 6, 'tuple'], [5, 6, 'keyerr']]);
  if (kind === 'count') { const ws = Array.from({ length: rnd.int(6, 9) }, () => rnd.pick(NAMES.slice(0, 4))); const w = rnd.pick(ws); const d = new Map(); ws.forEach(x => d.set(x, (d.get(x) || 0) + 1));
    return codeQ('dicts', L, `words = ${repr(ws)}\nd = {}\nfor w in words:\n    d[w] = d.get(w, 0) + 1\nprint(len(d), d["${w}"])`, `${d.size} ${d.get(w)}`, [`${ws.length} ${d.get(w)}`, `${d.size} ${d.get(w) + 1}`, `${d.size} ${d.get(w) - 1}`, `${d.size + 1} ${d.get(w)}`], `The dictionary counts the occurrences: ${repr(d)}.`); }
  if (kind === 'get') { const d = new Map([[rnd.pick(['a', 'x']), rnd.int(1, 9)], ['b', rnd.int(1, 9)], ['c', rnd.int(1, 9)]]); const k0 = [...d.keys()][0];
    return codeQ('dicts', L, `d = ${repr(d)}\nprint(d.get("z", 0), d.get("${k0}"), len(d))`, `0 ${d.get(k0)} ${d.size}`, [`None ${d.get(k0)} ${d.size}`, `0 ${k0} ${d.size}`, `KeyError`, `0 ${d.get(k0)} ${d.size * 2}`], '<code>get(key, default)</code> returns the default instead of raising <code>KeyError</code> when the key is missing.'); }
  if (kind === 'sets') { const A = [...new Set(Array.from({ length: 5 }, () => rnd.int(1, 9)))], B = [...new Set(Array.from({ length: 5 }, () => rnd.int(1, 9)))];
    const u = [...new Set([...A, ...B])], i = A.filter(x => B.includes(x)), d = A.filter(x => !B.includes(x));
    const forms = [[`print(len(a | b), len(a & b))`, `${u.length} ${i.length}`, [`${A.length + B.length} ${i.length}`, `${u.length} ${d.length}`, `${i.length} ${u.length}`]], [`print(sorted(a - b))`, repr(d.slice().sort((p, q) => p - q)), [repr(B.filter(x => !A.includes(x)).sort((p, q) => p - q)), repr(i.slice().sort((p, q) => p - q)), repr(A.slice().sort((p, q) => p - q))]], [`print(sorted(a & b), len(a ^ b))`, `${repr(i.slice().sort((p, q) => p - q))} ${u.length - i.length}`, [`${repr(i.slice().sort((p, q) => p - q))} ${u.length}`, `${repr(u.slice().sort((p, q) => p - q))} ${i.length}`, `${repr(d.slice().sort((p, q) => p - q))} ${u.length - i.length}`]]];
    const [body, o, w] = rnd.pick(forms); return codeQ('dicts', L, `a = set(${repr(A)})\nb = set(${repr(B)})\n${body}`, o, w, '<code>|</code> union, <code>&amp;</code> intersection, <code>-</code> difference, <code>^</code> symmetric difference. Sets contain no duplicates.'); }
  if (kind === 'iter') { const d = new Map(rnd.shuffle(NAMES).slice(0, 4).map(n => [n, rnd.int(10, 30)])); const ks = [...d.keys()]; const thr = rnd.int(15, 25); const sel = ks.filter(k => d.get(k) > thr);
    const forms = [[`total = 0\nfor k in d:\n    total += d[k]\nprint(total)`, String([...d.values()].reduce((a, b) => a + b, 0))], [`res = []\nfor k, v in d.items():\n    if v > ${thr}:\n        res.append(k)\nprint(res)`, repr(sel)], [`print(sorted(d.values())[0], max(d))`, `${Math.min(...d.values())} ${ks.slice().sort().pop()}`]];
    const [body, o] = rnd.pick(forms); const w = body.includes('append') ? [repr(ks.filter(k => d.get(k) <= thr)), repr(sel.map(k => d.get(k))), repr(ks)] : body.includes('max') ? [`${Math.min(...d.values())} ${ks[ks.map(k => d.get(k)).indexOf(Math.max(...d.values()))]}`, `${Math.max(...d.values())} ${ks.slice().sort().pop()}`, `${Math.min(...d.values())} ${Math.max(...d.values())}`] : [String(ks.length), String([...d.values()].reduce((a, b) => a + b, 0) + 1), String(Math.max(...d.values()))];
    return codeQ('dicts', L, `d = ${repr(d)}\n${body}`, o, w, 'Iterating over a dictionary gives its <b>keys</b>; <code>items()</code> gives (key, value) pairs; <code>max(d)</code> compares the keys.'); }
  if (kind === 'tuple') { const a = rnd.int(1, 9), b = rnd.int(10, 20), c = rnd.int(21, 30);
    const forms = [[`a, b = ${a}, ${b}\na, b = b, a + b\nprint(a, b)`, `${b} ${a + b}`, [`${b} ${2 * b}`, `${a} ${b}`, `${b} ${a}`]], [`t = (${a}, ${b}, ${c})\nx, *rest = t\nprint(x, rest)`, `${a} ${repr([b, c])}`, [`${a} ${repr(new Tup([b, c]))}`, `${a} ${b}`, `${repr(new Tup([a]))} ${repr([b, c])}`]], [`t = (${a}, ${b})\nt[0] = ${c}\nprint(t)`, 'TypeError', [repr(new Tup([c, b])), repr(new Tup([a, b])), 'IndexError']]];
    const [code, o, w] = rnd.pick(forms); return codeQ('dicts', L, code, o, w, 'Tuples are immutable sequences; the right-hand side of a multiple assignment is evaluated completely before assigning.', o === 'TypeError' ? { pre: 'What happens when the following program is executed? (If an error occurs, choose its type.)', exc: 'TypeError' } : {}); }
  const d = new Map([['x', 1], ['y', 2]]);
  return codeQ('dicts', L, `d = ${repr(d)}\nprint(d["z"])`, 'KeyError', ['None', '0', 'IndexError'], 'Accessing a missing key with <code>d[key]</code> raises <code>KeyError</code>; use <code>d.get(key)</code> to obtain None instead.', { pre: 'What happens when the following program is executed? (If an error occurs, choose its type.)', exc: 'KeyError' });
}

/* =====================================================================
   10. FILES & EXCEPTIONS
   ===================================================================== */
const EXC = [["int('abc')", 'ValueError'], ['10 / 0', 'ZeroDivisionError'], ['[1, 2, 3][5]', 'IndexError'], ["{'a': 1}['b']", 'KeyError'], ["'abc' + 3", 'TypeError'], ["open('surely_missing_file_123.txt')", 'FileNotFoundError'], ['undefined_name + 1', 'NameError'], ["float('3,5')", 'ValueError'], ["[1, 2].index(7)", 'ValueError'], ['len(5)', 'TypeError']];
function files(L) {
  const kind = pickByLevel(L, [[1, 3, 'which'], [2, 4, 'try'], [3, 6, 'flow'], [1, 4, 'theory']]);
  if (kind === 'which') { const [e, x] = rnd.pick(EXC); const all = ['ValueError', 'TypeError', 'IndexError', 'KeyError', 'ZeroDivisionError', 'NameError', 'FileNotFoundError'];
    const q = mk4('files', L, `Which exception is raised by <code>${esc(e)}</code>?`, opt(`<code>${x}</code>`, null, x), all.filter(a => a !== x).map(a => opt(`<code>${a}</code>`, null, a)), `<code>${esc(e)}</code> raises <code>${x}</code>.`);
    q.py = { code: e, out: x, exc: x }; return q; }
  if (kind === 'try') { const s = rnd.pick(['12', 'x7', '0', '3.5', '-4']); const v = /^-?\d+$/.test(s) ? Number(s) : null;
    const out = v === null ? 'invalid' : v === 0 ? 'zero' : String(fdiv(100, v));
    return codeQ('files', L, `s = "${s}"\ntry:\n    n = int(s)\n    print(100 // n)\nexcept ValueError:\n    print("invalid")\nexcept ZeroDivisionError:\n    print("zero")`, out, ['invalid', 'zero', String(v === null ? 0 : v), '100', 'ValueError'].filter(x => x !== out), '<code>int()</code> raises <code>ValueError</code> on strings that are not integers; dividing by zero raises <code>ZeroDivisionError</code>. The matching <code>except</code> branch runs.'); }
  if (kind === 'flow') { const bad = rnd.chance(0.5);
    const code = `try:\n    x = ${bad ? '1 / 0' : '10 / 2'}\n    print("A")\nexcept ZeroDivisionError:\n    print("B")\nelse:\n    print("C")\nfinally:\n    print("D")`;
    const out = bad ? 'B\nD' : 'A\nC\nD'; return codeQ('files', L, code, out, ['A\nB\nD', 'A\nD', 'B\nC\nD', 'A\nC', 'B', 'A\nB\nC\nD'].filter(x => x !== out), '<code>else</code> runs only if no exception occurred; <code>finally</code> always runs.'); }
  const B = [['Opening an existing file with <code>open("data.txt", "w")</code>', 'erases its previous content', ['appends to its content', 'raises an error', 'opens it for reading only']], ['Which mode opens a file to add text at the end without deleting it?', '<code>"a"</code>', ['<code>"w"</code>', '<code>"r"</code>', '<code>"x"</code>']], ['Reading a file with <code>for line in f:</code>, each <code>line</code>', 'includes the final newline character <code>\\n</code> (except possibly the last line)', ['never contains the newline character', 'is a list of words', 'is a single character']], ['<code>f.readlines()</code> returns', 'a list of strings, one per line', ['a single string with the whole file', 'the next line only', 'the number of lines']], ['Opening a file that does not exist with <code>open("missing.txt", "r")</code>', 'raises <code>FileNotFoundError</code>', ['creates an empty file', 'returns None', 'raises <code>ValueError</code>']], ['The statement <code>with open("f.txt") as f:</code>', 'closes the file automatically at the end of the block', ['opens the file in write mode', 'reads the whole file into f', 'must be followed by f.close()']]];
  const [q, a, w] = rnd.pick(B); return mk4('files', L, q, a, w, 'File modes: "r" read, "w" write (truncates), "a" append, "x" exclusive create.');
}

/* =====================================================================
   11. THEORY: computer architecture & Python concepts
   ===================================================================== */
const TH = [
  [1, 'Which component of the CPU performs arithmetic and logic operations?', 'the ALU', ['the control unit', 'the RAM', 'the hard disk', 'the bus']],
  [1, 'RAM memory is', 'volatile: its content is lost when power is switched off', ['permanent storage like an SSD', 'read-only memory', 'part of the ALU']],
  [2, 'Python is', 'an interpreted, dynamically typed language', ['a compiled language with static types', 'a machine language', 'an assembly language']],
  [1, 'One byte is made of', '8 bits', ['4 bits', '16 bits', '1024 bits']],
  [2, 'The ASCII code of the character <code>"A"</code> is', '65', ['97', '1', '48']],
  [2, 'A compiler', 'translates the whole source program into machine code before execution', ['executes the source code line by line', 'is part of the CPU', 'is the same as an operating system']],
  [3, 'Which of the following Python types is <b>mutable</b>?', '<code>list</code>', ['<code>str</code>', '<code>tuple</code>', '<code>int</code>']],
  [3, 'Which of the following can be used as a dictionary <b>key</b>?', '<code>(1, 2)</code> (a tuple)', ['<code>[1, 2]</code> (a list)', '<code>{1, 2}</code> (a set)', '<code>{"a": 1}</code> (a dict)']],
  [3, 'What is the difference between <code>return</code> and <code>print</code> inside a function?', '<code>return</code> gives a value back to the caller, <code>print</code> only shows it on the screen', ['there is no difference', '<code>print</code> gives a value back to the caller', '<code>return</code> shows the value on the screen']],
  [2, 'Which is a valid Python variable name?', '<code>total_2</code>', ['<code>2total</code>', '<code>total-2</code>', '<code>class</code>']],
  [4, 'The scope of a variable assigned inside a function (without <code>global</code>) is', 'local to that function', ['the whole program', 'the module that imports it', 'only the following line']],
  [3, 'An algorithm is', 'a finite sequence of unambiguous steps that solves a problem', ['a programming language', 'a hardware component', 'a type of variable']],
  [4, 'In Python, the expression <code>a == b</code> for two lists is True when', 'the lists have the same elements in the same order', ['they are the same object', 'they have the same length', 'they contain the same elements in any order']],
  [4, 'In Python, <code>a is b</code> is True when', 'a and b refer to the same object', ['a and b have equal values', 'a and b have the same type', 'a and b are both lists']],
  [2, 'The operating system', 'manages hardware resources and provides services to programs', ['is a programming language', 'is the same as the BIOS only', 'is a type of CPU']],
  [3, 'Which statement about tuples is TRUE?', 'tuples are immutable sequences', ['tuples can be modified with append', 'tuples cannot contain strings', 'tuples have no index']],
  [5, 'Which data structure gives the fastest membership test (<code>x in c</code>) for a large collection?', 'a set', ['a list', 'a tuple', 'a string']],
  [5, 'With 1 KiB we mean', '1024 bytes', ['1000 bytes', '1024 bits', '8 bytes']],
  [4, 'A function that does not execute a <code>return</code> statement returns', '<code>None</code>', ['<code>0</code>', 'an empty string', 'it raises an error']],
  [6, 'Hexadecimal is convenient for representing binary data because', 'each hex digit corresponds exactly to 4 bits', ['it uses fewer bits than binary', 'computers compute in base 16', 'it can represent negative numbers without a sign']],
  [6, 'In two\'s complement, the number of representable negative values on n bits is', 'one more than the number of positive values', ['equal to the number of positive values', 'one less than the number of positive values', 'twice the number of positive values']],
  [5, 'In Python, <code>x = [0] * 3</code> creates', 'the list <code>[0, 0, 0]</code>', ['the number 0', 'the list <code>[0, 3]</code>', 'an error']],
  [1, 'Which component executes the instructions of a program?', 'the CPU', ['the RAM', 'the hard disk', 'the monitor'], 'The CPU fetches, decodes and executes instructions.'],
  [1, 'Which memory is the fastest?', 'the CPU registers', ['the RAM', 'the SSD', 'the hard disk'], 'Memory hierarchy: registers → cache → RAM → disk (faster but smaller at the top).'],
  [2, 'Cache memory is', 'a small, fast memory between the CPU and the RAM', ['permanent storage for files', 'a part of the hard disk', 'the memory of the graphics card only'], 'It keeps recently used data close to the CPU.'],
  [2, 'The program counter (PC) register contains', 'the address of the next instruction to execute', ['the number of instructions already executed', 'the result of the last operation', 'the size of the program'], 'After each fetch the PC is updated (or changed by a jump).'],
  [1, 'Which are input devices?', 'keyboard and mouse', ['monitor and printer', 'CPU and RAM', 'speakers and headphones'], 'Input devices send data to the computer; output devices present results.'],
  [2, 'Compared with RAM, secondary memory (hard disk, SSD) is', 'non-volatile and slower', ['volatile and faster', 'located inside the CPU', 'used only as cache'], 'It keeps data without power but is much slower than RAM.'],
  [3, 'The 8-bit unsigned binary number <code>11111111</code> is equal to', '255', ['256', '128', '127'], '2<sup>8</sup> − 1 = 255.'],
  [3, 'How many different values can be represented with 8 bits?', '256', ['255', '128', '8'], '2<sup>8</sup> = 256 (from 0 to 255 unsigned).'],
  [3, 'In floating-point (IEEE 754) representation, a number is stored as', 'sign, exponent and mantissa', ['integer part and fractional part in two\'s complement', 'a two\'s complement integer only', 'a sequence of ASCII digits'], 'Value = (−1)<sup>sign</sup> · mantissa · 2<sup>exponent</sup>.'],
  [4, 'In Python, <code>0.1 + 0.2 == 0.3</code> evaluates to', '<code>False</code>, because of floating-point rounding', ['<code>True</code>', 'an error', '<code>None</code>'], '0.1 and 0.2 have no exact binary representation: 0.1 + 0.2 = 0.30000000000000004.'],
  [3, 'Standard ASCII encodes characters using', '7 bits (128 characters)', ['16 bits', '32 bits', '1 bit'], 'Extended ASCII uses 8 bits; Unicode covers all scripts.'],
  [4, 'Unicode (e.g. UTF-8)', 'can represent the characters of almost all writing systems', ['can represent only English letters', 'always uses exactly one byte per character', 'can represent only numbers'], 'UTF-8 uses 1 to 4 bytes per character and is compatible with ASCII.'],
  [2, 'A syntax error in a Python program is detected', 'before the program starts running, when the code is parsed', ['only when that line is executed', 'never', 'by the operating system'], 'The interpreter refuses to run code that is not syntactically valid.'],
  [3, 'A logic (semantic) error', 'makes the program produce wrong results without any error message', ['stops the program immediately', 'is detected by the parser', 'raises <code>SyntaxError</code>'], 'The program runs but does not do what was intended: testing is needed.'],
  [3, 'A runtime error (exception) occurs', 'during the execution, e.g. a division by zero', ['while the code is parsed', 'only in compiled languages', 'before the program starts'], 'It can be handled with <code>try/except</code>.'],
  [2, 'Pseudocode is', 'an informal description of an algorithm, independent of the programming language', ['machine code', 'a Python module', 'a compiled file'], 'Used to design algorithms before coding them.'],
  [3, 'In a flowchart, a decision (condition) is represented by', 'a diamond (rhombus)', ['a rectangle', 'an oval', 'a parallelogram'], 'Rectangles: operations; ovals: start/end; parallelograms: input/output.'],
  [2, 'A Python variable can refer to values of different types during execution because Python is', 'dynamically typed', ['statically typed', 'a compiled language', 'typed only for numbers'], 'Types belong to values, not to variable names.'],
  [2, 'Which line is a comment in Python?', '<code># this is a comment</code>', ['<code>// this is a comment</code>', '<code>/* this is a comment */</code>', '<code>-- this is a comment</code>'], 'Everything after <code>#</code> on the line is ignored.'],
  [2, 'The built-in function <code>input()</code> returns', 'a string', ['an integer', 'a float', 'a number or a string, depending on what the user types'], 'Convert with <code>int()</code> or <code>float()</code> when needed.'],
  [3, '<code>int("3.5")</code>', 'raises <code>ValueError</code>', ['returns 3', 'returns 4', 'returns 3.5'], '<code>int()</code> accepts only strings representing integers; use <code>int(float("3.5"))</code>.'],
  [3, 'The expression <code>7 // 2 * 2 + 7 % 2</code> evaluates to', '7', ['6', '8', '7.0'], '<code>7 // 2 = 3</code>, <code>3 * 2 = 6</code>, <code>7 % 2 = 1</code>, total 7.'],
  [3, '<code>range(5)</code> produces the values', '0, 1, 2, 3, 4', ['1, 2, 3, 4, 5', '0, 1, 2, 3, 4, 5', '1, 2, 3, 4'], 'The end value is excluded.'],
  [3, 'A <code>while</code> loop', 'repeats as long as its condition is true, and may execute zero times', ['always executes at least once', 'always executes a fixed number of times', 'can be used only with lists'], 'The condition is checked before each iteration.'],
  [4, '<code>break</code> inside two nested loops', 'exits only the innermost loop', ['exits both loops', 'terminates the program', 'skips to the next iteration'], 'To exit both, use a flag or put the loops in a function and <code>return</code>.'],
  [3, 'The statement <code>continue</code>', 'skips the rest of the current iteration and goes to the next one', ['exits the loop', 'terminates the program', 'restarts the loop from the first iteration'], 'Used to ignore some values in a loop.'],
  [3, 'In a function, parameters and arguments are', 'the variables in the definition, and the values passed in the call', ['exactly the same thing', 'the values passed in the call, and the variables in the definition', 'arguments exist only for built-in functions'], '<code>def f(x)</code>: x is a parameter; in <code>f(3)</code>, 3 is an argument.'],
  [4, 'A default parameter value (e.g. <code>def f(x, y=2)</code>)', 'is used when the corresponding argument is omitted in the call', ['always overrides the argument passed', 'must be the first parameter', 'must be <code>None</code>'], 'Parameters with defaults must come after those without.'],
  [4, '<code>len([[1, 2], [3]])</code> is', '2', ['3', '1', '4'], 'The outer list has two elements, which are lists.'],
  [4, '<code>[1, 2] + [3]</code> gives', '<code>[1, 2, 3]</code>', ['<code>[[1, 2], 3]</code>', '<code>[1, 2, [3]]</code>', 'a <code>TypeError</code>'], '<code>+</code> concatenates two lists.'],
  [4, 'After <code>s = "abc"</code> and <code>s.upper()</code> (result not assigned), <code>s</code> is', '<code>"abc"</code>, because strings are immutable', ['<code>"ABC"</code>', '<code>None</code>', 'an error'], 'String methods return a new string; write <code>s = s.upper()</code>.'],
  [3, 'Which expression creates an empty dictionary?', '<code>{}</code>', ['<code>[]</code>', '<code>set()</code>', '<code>()</code>'], '<code>{}</code> is a dict; an empty set is <code>set()</code>.'],
  [4, 'Which expression creates an empty set?', '<code>set()</code>', ['<code>{}</code>', '<code>[]</code>', '<code>()</code>'], '<code>{}</code> creates an empty dictionary, not a set.'],
  [4, 'Dictionary keys', 'must be unique and immutable (hashable)', ['can be lists', 'can be repeated', 'must be strings'], 'Numbers, strings and tuples (of immutables) can be keys.'],
  [4, 'For a dictionary <code>d</code>, the loop <code>for k in d:</code> iterates over', 'the keys', ['the values', 'the (key, value) pairs', 'the positions 0, 1, 2, …'], 'Use <code>d.values()</code> or <code>d.items()</code> for values or pairs.'],
  [5, '<code>t = (5,)</code> creates', 'a tuple with one element', ['the integer 5', 'a list', 'a syntax error'], 'The comma makes the tuple; <code>(5)</code> is just the integer 5.'],
  [5, 'After <code>a = [1, 2, 3]</code>, <code>b = a</code>, <code>b.append(4)</code>, the list <code>a</code> is', '<code>[1, 2, 3, 4]</code>', ['<code>[1, 2, 3]</code>', 'an error', '<code>[4]</code>'], 'a and b refer to the same list object (aliasing).'],
  [5, '<code>f.read()</code> on a text file returns', 'the whole content of the file as a single string', ['a list of lines', 'only the first line', 'the number of characters'], '<code>readline()</code> reads one line, <code>readlines()</code> returns a list.'],
  [5, '<code>line.strip()</code>', 'removes the whitespace (including <code>\\n</code>) at the beginning and at the end', ['removes all the spaces in the string', 'splits the string into words', 'removes only the last character'], 'Use <code>rstrip("\\n")</code> to remove only the newline.'],
  [5, '<code>"a,b,,c".split(",")</code> gives', '<code>[\'a\', \'b\', \'\', \'c\']</code>', ['<code>[\'a\', \'b\', \'c\']</code>', '<code>[\'a,b,,c\']</code>', '<code>[\'a\', \'b\', \',\', \'c\']</code>'], 'Two consecutive separators produce an empty string.'],
  [6, 'In a <code>try/except/finally</code> statement, the <code>finally</code> block', 'is always executed', ['is executed only if no exception occurs', 'is executed only if an exception occurs', 'is skipped if the <code>try</code> block contains <code>return</code>'], 'Typically used to release resources (e.g. close files).'],
  [6, 'A recursive function must have', 'a base case that stops the recursion', ['a loop', 'a global variable', 'at least two parameters'], 'Otherwise it recurses until a <code>RecursionError</code>.'],
  [5, 'Searching a value with <code>x in lst</code> in an unsorted list of n elements takes time that grows', 'linearly with n', ['constant, independent of n', 'logarithmically with n', 'quadratically with n'], 'In the worst case every element is compared.'],
  [6, 'Binary search on a sorted list of n elements needs about', '<i>log</i><sub>2</sub>(n) comparisons', ['n comparisons', 'n/2 comparisons', 'n² comparisons'], 'Each comparison halves the remaining interval.'],
  [4, '<code>print(1, 2, sep="-")</code> prints', '<code>1-2</code>', ['<code>1 2</code>', '<code>1-2-</code>', '<code>12</code>'], '<code>sep</code> is placed between the values; <code>end</code> after the last one.'],
  [1, 'Python source files have the extension', '<code>.py</code>', ['<code>.pt</code>', '<code>.exe</code>', '<code>.pyt</code>'], 'Run them with <code>python file.py</code>.'],
  [5, 'The local variables of a function', 'are created at each call and disappear when the function returns', ['keep their values between calls', 'are global variables', 'are shared by all functions'], 'Each call has its own local scope.'],
  [6, 'Given <code>x = 5</code> and <code>def f(): print(x); x = 3</code>, calling <code>f()</code>', 'raises <code>UnboundLocalError</code>', ['prints 5', 'prints 3', 'prints <code>None</code>'], 'Since x is assigned inside f, it is local in the whole function and is read before assignment.'],
];
function theory(L, exclude) {
  let pool = TH.map((t, i) => [t, i]).filter(([t, i]) => Math.abs(t[0] - L) <= 1 && !(exclude && exclude.has('cs' + i)));
  if (!pool.length) pool = TH.map((t, i) => [t, i]);
  const [[, q, a, w, e], i] = rnd.pick(pool);
  const res = mk4('theory', L, q, a, w, e || 'Basic concept from the course (computer architecture / Python language).'); res.thId = 'cs' + i; return res;
}

/* =====================================================================
   REGISTRY
   ===================================================================== */
const TOPICS = [
  { id: 'numbers', name: 'Number systems & two\'s complement', gen: numbers }, { id: 'logic', name: 'Boolean logic', gen: logic },
  { id: 'expr', name: 'Expressions, operators, types', gen: expr }, { id: 'strings', name: 'Strings', gen: strings },
  { id: 'cond', name: 'Conditionals (if/elif/else)', gen: cond }, { id: 'loops', name: 'Loops (for/while)', gen: loops },
  { id: 'functions', name: 'Functions & scope', gen: functions }, { id: 'lists', name: 'Lists & tables', gen: lists },
  { id: 'dicts', name: 'Dictionaries, sets, tuples', gen: dicts }, { id: 'files', name: 'Files & exceptions', gen: files },
  { id: 'theory', name: 'Theory (computer & Python concepts)', gen: theory },
];
function generate(topicId, level, used) {
  const t = TOPICS.find(x => x.id === topicId); let last;
  for (let i = 0; i < 80; i++) { try { const q = t.gen(level, used); q.topicName = t.name; return q; } catch (e) { last = e; } }
  throw last;
}
const QUIZ = ['numbers', 'numbers', 'logic', 'expr', 'expr', 'strings', 'strings', 'cond', 'loops', 'loops', 'functions', 'lists', 'lists', 'dicts', 'files'];
const MODES = [{ id: 'quizT', name: 'Quiz with theory', desc: '12 code/number questions + 3 theory questions', layout: ['numbers', 'numbers', 'logic', 'expr', 'strings', 'strings', 'cond', 'loops', 'loops', 'functions', 'lists', 'dicts', 'theory', 'theory', 'theory'] }, { id: 'quiz', name: 'Code & numbers only', desc: '15 questions: number systems, logic, Python code reading', layout: QUIZ }];
// The real exam has no multiple-choice test: these settings only score the Practice tab.
const MC = { minutes: 30, nOpts: 4, right: 1, wrong: 0, blank: 0, max: 15, pass: 8, rules: 'Practice questions only: the real exam has no multiple-choice test.' };
const FINAL_RULES = 'Official format (course slides and midterm announcement): theory questions, 6 points (3 questions of 2 points; you need at least 3/6, otherwise the programming part is not corrected), and a programming task, 26 points, written and run on the lab computer (a program that does not run is not reviewed). Pass with 18 out of 32. Not in the slides, my assumption: 120 minutes.';
const MIDTERM_RULES = 'Official format (announcement): 30 minutes on the lab computer, 4 questions. Questions 1-3 (2 points each) are like the theory questions of the final exam (data representation, computer architecture, Python concepts): with at least 3/6 you can skip the theory part at every exam of 2026/2027 and use these points instead. Question 4 (3 points) is about Python (complete a program, correct errors, or write a short snippet): its points are added as a bonus to your final score. Only for students attending the course for the first time.';
const WRITTEN = { minutes: 120, max: 32, pass: 18, rules: FINAL_RULES, modes: [
  { id: 'final', name: 'Exam', desc: '3 theory questions (6 pts, at least 3 needed) + programming (26 pts)', minutes: 120, rules: FINAL_RULES },
  { id: 'midterm', name: 'Midterm', desc: '30 min: 3 theory questions (2 pts each) + 1 Python question (3 bonus pts)', minutes: 30, rules: MIDTERM_RULES }] };
G.CS = { TOPICS, generate, MODES, MC, WRITTEN, helpers: { repr, pySlice, fdiv, pmod, pyFloat, esc } };
G.FORMULAS = G.FORMULAS || {};
G.FORMULAS.cs = () => `<h2>Python & computer basics — cheat sheet</h2>
<h3>Number systems</h3><ul><li>Binary → decimal: sum of powers of 2. Decimal → binary: divide by 2, read remainders bottom-up.</li><li>1 hex digit = 4 bits, 1 octal digit = 3 bits. <code>0x1F</code> = 31, <code>0o17</code> = 15, <code>0b101</code> = 5.</li><li>Two's complement on n bits: range [−2<sup>n−1</sup>, 2<sup>n−1</sup>−1]; −x = invert all bits of x and add 1.</li><li>Overflow: adding two numbers with the same sign gives a result with the opposite sign.</li></ul>
<h3>Operators</h3><ul><li><code>/</code> float division, <code>//</code> floor division (towards −∞), <code>%</code> remainder (sign of the divisor), <code>**</code> power (right-associative).</li><li>Precedence: <code>**</code> &gt; unary <code>-</code> &gt; <code>* / // %</code> &gt; <code>+ -</code> &gt; comparisons &gt; <code>not</code> &gt; <code>and</code> &gt; <code>or</code>.</li><li><code>round()</code> rounds half to even: <code>round(2.5) == 2</code>.</li></ul>
<h3>Strings</h3><ul><li><code>s[i]</code>, <code>s[-1]</code>, <code>s[a:b:c]</code> (b excluded), <code>len(s)</code>, <code>s.upper()</code>, <code>s.lower()</code>, <code>s.find(x)</code> (−1 if absent), <code>s.count(x)</code>, <code>s.replace(a, b)</code>, <code>s.split(sep)</code>, <code>sep.join(list)</code>, <code>s.strip()</code>, <code>s.isdigit()</code>.</li><li>Strings are immutable. f-strings: <code>f"{x:.2f}"</code>, <code>f"{n:5d}"</code>, <code>f"{n:05d}"</code>.</li></ul>
<h3>Lists</h3><ul><li><code>append(x)</code>, <code>insert(i, x)</code>, <code>pop()</code>, <code>pop(i)</code>, <code>remove(x)</code> (first occurrence), <code>index(x)</code>, <code>count(x)</code>, <code>sort()</code> (returns None), <code>sorted(l)</code>, <code>sum</code>, <code>min</code>, <code>max</code>.</li><li><code>b = a</code> → same list (alias); <code>b = a[:]</code> or <code>list(a)</code> → copy. Table: <code>t[row][col]</code>.</li><li>Comprehension: <code>[expr for x in seq if cond]</code>.</li></ul>
<h3>Dictionaries & sets</h3><ul><li><code>d[k]</code> (KeyError if missing), <code>d.get(k, default)</code>, <code>d.keys()</code>, <code>d.values()</code>, <code>d.items()</code>, <code>k in d</code>, <code>del d[k]</code>.</li><li>Sets: <code>|</code> union, <code>&amp;</code> intersection, <code>-</code> difference, <code>^</code> symmetric difference, <code>add</code>, <code>discard</code>.</li></ul>
<h3>Files & exceptions</h3><ul><li><code>with open("f.txt", "r") as f:</code> · modes <code>"r"</code>, <code>"w"</code> (truncate), <code>"a"</code> (append).</li><li><code>for line in f:</code> (line ends with <code>\\n</code>), <code>line.strip()</code>, <code>f.readline()</code>, <code>f.readlines()</code>, <code>f.write(s)</code>.</li><li><code>try / except E / else / finally</code>. Common errors: ValueError, TypeError, IndexError, KeyError, ZeroDivisionError, FileNotFoundError, NameError.</li></ul>`;
})(typeof window !== 'undefined' ? window : globalThis);
