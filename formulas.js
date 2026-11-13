/* Formula sheet for Analisi I (chemistry and CS sheets are defined in chem.js / cs.js) */
(function (G) {
G.FORMULAS = G.FORMULAS || {};
G.FORMULAS.analisi = String.raw`<h2>Analisi I — formula sheet</h2>
<h3>Fundamental limits</h3>
<p>\(\displaystyle\lim_{x\to0}\frac{\sin x}{x}=1,\quad \lim_{x\to0}\frac{1-\cos x}{x^2}=\frac12,\quad \lim_{x\to0}\frac{e^x-1}{x}=1,\quad \lim_{x\to0}\frac{\log(1+x)}{x}=1,\quad \lim_{x\to0}\frac{(1+x)^\alpha-1}{x}=\alpha,\quad \lim_{x\to\pm\infty}\left(1+\frac{a}{x}\right)^x=e^a\)</p>
<h3>Maclaurin expansions (as \(x\to0\))</h3>
<div class="tablewrap"><table>
<tr><td>\(e^x=1+x+\frac{x^2}{2}+\frac{x^3}{6}+\dots+\frac{x^n}{n!}+o(x^n)\)</td><td>\(\log(1+x)=x-\frac{x^2}{2}+\frac{x^3}{3}-\dots+(-1)^{n+1}\frac{x^n}{n}+o(x^n)\)</td></tr>
<tr><td>\(\sin x=x-\frac{x^3}{6}+\frac{x^5}{120}+o(x^6)\)</td><td>\(\cos x=1-\frac{x^2}{2}+\frac{x^4}{24}+o(x^5)\)</td></tr>
<tr><td>\(\tan x=x+\frac{x^3}{3}+\frac{2x^5}{15}+o(x^6)\)</td><td>\(\arctan x=x-\frac{x^3}{3}+\frac{x^5}{5}+o(x^6)\)</td></tr>
<tr><td>\(\arcsin x=x+\frac{x^3}{6}+\frac{3x^5}{40}+o(x^6)\)</td><td>\((1+x)^\alpha=1+\alpha x+\binom{\alpha}{2}x^2+\binom{\alpha}{3}x^3+o(x^3)\)</td></tr>
<tr><td>\(\sqrt{1+x}=1+\frac{x}{2}-\frac{x^2}{8}+\frac{x^3}{16}+o(x^3)\)</td><td>\(\frac{1}{1-x}=1+x+x^2+\dots+x^n+o(x^n)\)</td></tr>
<tr><td>\(\sinh x=x+\frac{x^3}{6}+o(x^4)\)</td><td>\(\cosh x=1+\frac{x^2}{2}+\frac{x^4}{24}+o(x^5)\)</td></tr></table></div>
<h3>Derivatives</h3>
<div class="tablewrap"><table>
<tr><td>\((x^\alpha)'=\alpha x^{\alpha-1}\)</td><td>\((e^x)'=e^x\)</td><td>\((a^x)'=a^x\log a\)</td><td>\((\log|x|)'=\frac1x\)</td></tr>
<tr><td>\((\sin x)'=\cos x\)</td><td>\((\cos x)'=-\sin x\)</td><td>\((\tan x)'=1+\tan^2x=\frac{1}{\cos^2x}\)</td><td>\((\arctan x)'=\frac{1}{1+x^2}\)</td></tr>
<tr><td>\((\arcsin x)'=\frac{1}{\sqrt{1-x^2}}\)</td><td>\((\arccos x)'=-\frac{1}{\sqrt{1-x^2}}\)</td><td>\((f\circ g)'=f'(g)\,g'\)</td><td>\((f^{-1})'(y_0)=\frac{1}{f'(x_0)}\)</td></tr></table></div>
<h3>Primitives</h3>
<div class="tablewrap"><table>
<tr><td>\(\int x^\alpha dx=\frac{x^{\alpha+1}}{\alpha+1}\ (\alpha\neq-1)\)</td><td>\(\int\frac{dx}{x}=\log|x|\)</td><td>\(\int e^{ax}dx=\frac{e^{ax}}{a}\)</td></tr>
<tr><td>\(\int\frac{dx}{x^2+a^2}=\frac1a\arctan\frac xa\)</td><td>\(\int\frac{dx}{\sqrt{a^2-x^2}}=\arcsin\frac xa\)</td><td>\(\int\frac{f'(x)}{f(x)}dx=\log|f(x)|\)</td></tr>
<tr><td>By parts: \(\int f g'=fg-\int f'g\)</td><td>\(\int\log x\,dx=x\log x-x\)</td><td>\(\int\frac{dx}{(x-a)(x-b)}=\frac{1}{a-b}\log\left|\frac{x-a}{x-b}\right|\)</td></tr></table></div>
<h3>Improper integrals (comparison)</h3>
<p>\(\int_1^{+\infty}\frac{dx}{x^\alpha}\) converges iff \(\alpha>1\); \(\int_0^1\frac{dx}{x^\alpha}\) converges iff \(\alpha<1\). Asymptotic comparison: if \(f\sim g\) with constant sign, the integrals have the same behaviour.</p>
<h3>Complex numbers</h3>
<p>\(z=a+ib=\rho(\cos\theta+i\sin\theta)=\rho e^{i\theta}\), \(\rho=\sqrt{a^2+b^2}\); \(z^n=\rho^ne^{in\theta}\); \(\sqrt[n]{w}=\sqrt[n]{|w|}\,e^{i(\varphi+2k\pi)/n},\ k=0,\dots,n-1\).</p>
<h3>Differential equations</h3>
<p>\(y'+a(x)y=b(x)\): \(y=e^{-A(x)}\left(\int b(x)e^{A(x)}dx+C\right)\) with \(A'=a\). Separable \(y'=a(x)b(y)\): \(\int\frac{dy}{b(y)}=\int a(x)dx\) (plus constant solutions \(b(y)=0\)).</p>
<p>\(y''+py'+qy=0\): roots \(\lambda_{1,2}\) of \(\lambda^2+p\lambda+q=0\). Real distinct: \(c_1e^{\lambda_1x}+c_2e^{\lambda_2x}\); double: \((c_1+c_2x)e^{\lambda x}\); complex \(\alpha\pm i\beta\): \(e^{\alpha x}(c_1\cos\beta x+c_2\sin\beta x)\). Particular solution for \(ce^{kx}\): \(Ae^{kx}\), or \(Axe^{kx}\) if \(k\) is a simple root.</p>`;
})(typeof window !== 'undefined' ? window : globalThis);
