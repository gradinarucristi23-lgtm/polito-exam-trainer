/* Formula sheets: Analisi I and Chemistry (the chemistry Tables are in chem.js, the CS cheat sheet in cs.js).
   Sheets are written in a small line format turned into HTML by sheet():
     # Title            -> page title (followed by a row of buttons jumping to each section)
     ## Section {id}    -> section heading
     a :: b :: c        -> table row (consecutive rows form one table; a blank line starts a new table)
     h| a :: b          -> table header row
     > text             -> note paragraph
   Math goes in \( ... \) and chemical formulas in \ce{...}, rendered by KaTeX. Constants match chem.js. */
(function (G) {
'use strict';
G.FORMULAS = G.FORMULAS || {};

function sheet(src, withNav = true) {
  const out = [], nav = []; let rows = null;
  const flush = () => { if (rows) { out.push('<div class="tablewrap"><table class="ftab">' + rows.join('') + '</table></div>'); rows = null; } };
  for (const raw of src.split('\n')) {
    const line = raw.trim(); let m;
    if (!line) { flush(); continue; }
    if ((m = line.match(/^# (.+)$/))) { flush(); out.push('<h2>' + m[1] + '</h2><!--nav-->'); }
    else if ((m = line.match(/^## (.+?)\s*\{(\w+)\}$/))) { flush(); nav.push([m[2], m[1]]); out.push(`<h3 id="f-${m[2]}">${m[1]}</h3>`); }
    else if ((m = line.match(/^> (.+)$/))) { flush(); out.push('<p class="small">' + m[1] + '</p>'); }
    else {
      const head = line.startsWith('h| '); const cells = (head ? line.slice(3) : line).split(' :: ');
      (rows = rows || []).push('<tr>' + cells.map(c => (head ? `<th>${c}</th>` : `<td>${c}</td>`)).join('') + '</tr>');
    }
  }
  flush();
  const navHtml = withNav && nav.length ? '<div class="fnav">' + nav.map(([id, t]) => `<button type="button" class="pill" data-jump="f-${id}">${t}</button>`).join('') + '</div>' : '';
  return out.join('').replace('<!--nav-->', navHtml);
}

/* ============================ CHEMISTRY ============================ */
const CHEM_CONSTANTS = String.raw`
## Constants {constants}
h| Quantity :: Symbol :: Value
Avogadro's number :: \(N_A\) :: \(6.022\times10^{23}\ \mathrm{mol^{-1}}\)
Gas constant :: \(R\) :: \(0.0821\ \mathrm{L\,atm\,mol^{-1}\,K^{-1}} = 8.314\ \mathrm{J\,mol^{-1}\,K^{-1}}\)
Faraday constant :: \(F\) :: \(96485\ \mathrm{C\,mol^{-1}}\) (charge of 1 mol of electrons)
Planck constant :: \(h\) :: \(6.626\times10^{-34}\ \mathrm{J\,s}\)
Speed of light :: \(c\) :: \(2.998\times10^{8}\ \mathrm{m/s}\ \ (\approx3.00\times10^{8})\)
Elementary charge :: \(e\) :: \(1.602\times10^{-19}\ \mathrm{C}\)
Electron mass :: \(m_e\) :: \(9.109\times10^{-31}\ \mathrm{kg}\)
Atomic mass unit :: \(u\) :: \(1.661\times10^{-27}\ \mathrm{kg}\) (\(=1\ \mathrm{g}/N_A\))
Rydberg constant (H atom) :: \(R_H\) :: \(2.18\times10^{-18}\ \mathrm{J}\) (13.6 eV); in \(1/\lambda\): \(1.097\times10^{7}\ \mathrm{m^{-1}}\)
Ionic product of water (25 °C) :: \(K_w\) :: \(1.0\times10^{-14}\)
Molar volume of an ideal gas :: \(V_m\) :: \(22.414\ \mathrm{L/mol}\) at STP (0 °C, 1 atm); \(24.47\ \mathrm{L/mol}\) at 25 °C, 1 atm
Cryoscopic constant of water :: \(K_{cr}\) :: \(1.86\ \mathrm{K\,kg\,mol^{-1}}\)
Ebullioscopic constant of water :: \(K_{eb}\) :: \(0.512\ \mathrm{K\,kg\,mol^{-1}}\)
Specific heat of water :: \(c\) :: \(4.184\ \mathrm{J\,g^{-1}\,K^{-1}}\)
Nernst factor at 25 °C :: \(\frac{2.303\,RT}{F}\) :: \(0.0592\ \mathrm{V}\)

h| Unit conversions :: ::
Pressure :: :: \(1\ \mathrm{atm} = 760\ \mathrm{mmHg\ (torr)} = 101325\ \mathrm{Pa} = 1.01325\ \mathrm{bar}\)
Temperature :: :: \(T(\mathrm{K}) = t(^\circ\mathrm{C}) + 273.15\)
Volume :: :: \(1\ \mathrm{L} = 1\ \mathrm{dm^3} = 10^{-3}\ \mathrm{m^3}\), \(1\ \mathrm{mL} = 1\ \mathrm{cm^3}\)
Energy :: :: \(1\ \mathrm{cal} = 4.184\ \mathrm{J}\), \(1\ \mathrm{L\,atm} = 101.3\ \mathrm{J}\), \(1\ \mathrm{eV} = 1.602\times10^{-19}\ \mathrm{J}\)
Length :: :: \(1\ \mathrm{nm} = 10^{-9}\ \mathrm{m}\), \(1\ \text{Å} = 10^{-10}\ \mathrm{m}\), \(1\ \mathrm{pm} = 10^{-12}\ \mathrm{m}\)
`;

const CHEM = String.raw`
# Chemistry — constants and formulas
` + CHEM_CONSTANTS + String.raw`
## Atoms and isotopes {atoms}
\(A = Z + N\) :: mass number = protons \(Z\) + neutrons \(N\)
ion charge \(= Z -\) electrons :: cations have lost electrons, anions have gained them
\(\bar M = \sum_i x_i M_i\) :: average atomic mass from the isotope abundances \(x_i\) (fractions, \(\sum x_i = 1\))

## Light and the quantum atom {quantum}
\(c = \lambda\nu\) :: wavelength × frequency = speed of light
\(E = h\nu = \dfrac{hc}{\lambda}\) :: energy of one photon (one mole of photons: × \(N_A\))
\(E_n = -\dfrac{R_H}{n^2} = -\dfrac{2.18\times10^{-18}\ \mathrm{J}}{n^2}\) :: energy levels of the H atom (one-electron ions: \(-Z^2R_H/n^2\))
\(E_{photon} = R_H\left(\dfrac{1}{n_1^2} - \dfrac{1}{n_2^2}\right)\) :: photon emitted (\(n_2\to n_1\)) or absorbed (\(n_1\to n_2\)), with \(n_1 < n_2\)
\(\dfrac{1}{\lambda} = 1.097\times10^{7}\ \mathrm{m^{-1}}\left(\dfrac{1}{n_1^2} - \dfrac{1}{n_2^2}\right)\) :: the same, as a wavelength (Rydberg formula)
\(E_{ion} = R_H = 2.18\times10^{-18}\ \mathrm{J}\) :: ionization energy of H from \(n = 1\)
\(\lambda = \dfrac{h}{mv}\) :: de Broglie wavelength of a particle
\(\Delta x\,\Delta p \ge \dfrac{h}{4\pi}\) :: Heisenberg uncertainty principle
\(E_k = h\nu - \Phi\) :: photoelectric effect (\(\Phi\) = work function)

## Quantum numbers and configurations {qnumbers}
\(n = 1, 2, 3, \dots\) :: shell (size and energy)
\(l = 0, 1, \dots, n-1\) :: subshell: 0 = s, 1 = p, 2 = d, 3 = f
\(m_l = -l, \dots, 0, \dots, +l\) :: orientation: \(2l+1\) orbitals per subshell
\(m_s = \pm\tfrac12\) :: spin; at most 2 electrons per orbital (Pauli)
\(n^2\) orbitals, \(2n^2\) electrons :: capacity of shell \(n\)
\(n-1\) nodes: \(l\) angular, \(n-l-1\) radial :: nodes of an orbital
1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s :: filling order (increasing \(n+l\), then \(n\)); Hund: parallel spins first
Cr \([\mathrm{Ar}]\,3d^5 4s^1\), Cu \([\mathrm{Ar}]\,3d^{10} 4s^1\) :: common exceptions (half-filled / filled d subshell)

## Moles and stoichiometry {mole}
\(n = \dfrac{m}{M}\) :: moles from mass (\(M\) in g/mol)
\(N = n\,N_A\) :: number of particles
\(\%\,\text{element} = \dfrac{k\,M_{el}}{M_{compound}}\times100\) :: mass percentage (\(k\) atoms of the element per formula unit)
Empirical formula :: grams (or %) → moles of each element → divide by the smallest → multiply to whole numbers
Molecular formula :: \((\text{empirical})_k\) with \(k = M / M_{empirical}\)
Limiting reagent :: the reactant with the smallest \(n_i/\nu_i\) (moles ÷ coefficient)
\(\text{yield}\ \% = \dfrac{\text{actual}}{\text{theoretical}}\times100\) :: percent yield
Oxidation numbers :: sum = charge of the species; F −1; O −2 (peroxides −1); H +1 (metal hydrides −1); group 1 +1; group 2 +2

## Bonds, shapes and molecular orbitals {bonding}
\(FC = V - L - \tfrac{B}{2}\) :: formal charge: valence e⁻ − lone-pair e⁻ − ½ bonding e⁻
\(\text{bond order} = \dfrac{N_b - N_a}{2}\) :: MO theory (\(N_b\) bonding, \(N_a\) antibonding electrons): higher order → shorter, stronger bond; 0 → no stable molecule
\(\Delta\chi\) (electronegativity difference) :: roughly: &lt; 0.4 nonpolar, 0.4–1.7 polar covalent, &gt; 1.7 ionic
\(\mu = q\,d\) :: dipole moment (vector sum of the bond dipoles)
Paramagnetic / diamagnetic :: unpaired electrons present / all electrons paired (\(\ce{O2}\) is paramagnetic)

h| Steric number :: Electron geometry (hybrid) :: Molecular shapes
2 :: linear, 180° (sp) :: \(AX_2\) linear
3 :: trigonal planar, 120° (sp²) :: \(AX_3\) trigonal planar; \(AX_2E\) bent
4 :: tetrahedral, 109.5° (sp³) :: \(AX_4\) tetrahedral; \(AX_3E\) trigonal pyramidal; \(AX_2E_2\) bent
5 :: trigonal bipyramidal, 90°/120° (sp³d) :: \(AX_5\); \(AX_4E\) seesaw; \(AX_3E_2\) T-shaped; \(AX_2E_3\) linear
6 :: octahedral, 90° (sp³d²) :: \(AX_6\); \(AX_5E\) square pyramidal; \(AX_4E_2\) square planar
> Steric number = atoms bonded to the central atom + lone pairs on it (\(X\) = bonded atom, \(E\) = lone pair).

## Gases {gases}
\(PV = nRT\) :: ideal gas law (\(R = 0.0821\) with atm and L; \(8.314\) with Pa, m³ and J)
\(\dfrac{P_1V_1}{T_1} = \dfrac{P_2V_2}{T_2}\) :: same amount of gas (Boyle: \(PV\) constant; Charles: \(V/T\) constant; Gay-Lussac: \(P/T\) constant)
\(d = \dfrac{PM}{RT}\), \(M = \dfrac{dRT}{P}\) :: density and molar mass of a gas
\(P_{tot} = \sum_i P_i\), \(P_i = x_iP_{tot}\), \(x_i = \dfrac{n_i}{n_{tot}}\) :: Dalton's law of partial pressures
\(u_{rms} = \sqrt{\dfrac{3RT}{M}}\) :: root-mean-square speed (\(R = 8.314\), \(M\) in kg/mol)
\(\bar E_k = \tfrac32RT\) per mole :: the average kinetic energy depends only on \(T\)
\(\dfrac{v_1}{v_2} = \sqrt{\dfrac{M_2}{M_1}}\) :: Graham's law (effusion and diffusion rates)
\(\left(P + \dfrac{an^2}{V^2}\right)(V - nb) = nRT\) :: van der Waals equation (real gases)

## Liquids and phase changes {liquids}
\(\ln\dfrac{P_2}{P_1} = -\dfrac{\Delta H_{vap}}{R}\left(\dfrac{1}{T_2} - \dfrac{1}{T_1}\right)\) :: Clausius–Clapeyron (vapour pressure vs temperature)
Normal boiling point :: temperature at which the vapour pressure equals 1 atm
\(q = n\,\Delta H_{fus}\), \(q = n\,\Delta H_{vap}\) :: heat to melt / vaporize at constant \(T\)
\(\Delta S = \dfrac{\Delta H}{T}\) :: entropy of a phase change at the transition temperature

## Solutions {solutions}
\(M = \dfrac{n_{solute}}{V_{solution}\,(\mathrm{L})}\) :: molarity (mol/L)
\(b = \dfrac{n_{solute}}{m_{solvent}\,(\mathrm{kg})}\) :: molality (mol/kg)
\(x_i = \dfrac{n_i}{n_{tot}}\), \(\%\,(m/m) = \dfrac{m_{solute}}{m_{solution}}\times100\), ppm = mg/kg :: mole fraction, mass percent, parts per million
\(M_1V_1 = M_2V_2\) :: dilution
\(P_A = x_AP_A^\circ\) :: Raoult's law; ideal mixture: \(P_{tot} = x_AP_A^\circ + x_BP_B^\circ\)
\(\Delta P = x_{solute}\,P^\circ_{solvent}\) :: vapour pressure lowering (non-volatile solute)
\(\Delta T_{cr} = i\,K_{cr}\,b\) :: freezing point depression (water: \(K_{cr} = 1.86\))
\(\Delta T_{eb} = i\,K_{eb}\,b\) :: boiling point elevation (water: \(K_{eb} = 0.512\))
\(\pi = i\,M\,R\,T\) :: osmotic pressure (\(M\) in mol/L, \(R = 0.0821\) → atm)
\(i = 1 + \alpha(\nu - 1)\) :: van 't Hoff factor: \(\nu\) ions per formula unit, \(\alpha\) degree of dissociation (strong electrolytes: \(i = \nu\), e.g. NaCl 2, \(\ce{CaCl2}\) 3)
\(c = k_H\,P\) :: Henry's law (solubility of a gas)

## Thermochemistry and thermodynamics {thermo}
\(q = m\,c\,\Delta T\), \(q = C\,\Delta T\) :: heat (specific heat \(c\), heat capacity \(C\)); calorimeter: \(q_{reaction} = -q_{solution}\)
\(\Delta U = q + w\), \(w = -P_{ext}\Delta V\) :: first law (work done on the system is positive)
\(\Delta H = \Delta U + \Delta n_{gas}RT\) :: enthalpy vs internal energy
\(\Delta H^\circ_r = \sum\nu\,\Delta H^\circ_f(\text{prod}) - \sum\nu\,\Delta H^\circ_f(\text{reag})\) :: Hess's law; \(\Delta H^\circ_f = 0\) for elements in their standard state
\(\Delta H_r \approx \sum D(\text{broken}) - \sum D(\text{formed})\) :: estimate from bond enthalpies
\(\Delta S^\circ_r = \sum\nu\,S^\circ(\text{prod}) - \sum\nu\,S^\circ(\text{reag})\) :: standard entropy of reaction
\(\Delta G = \Delta H - T\Delta S\) :: spontaneous if \(\Delta G < 0\)
\(\Delta G^\circ = -RT\ln K\), \(\Delta G = \Delta G^\circ + RT\ln Q\) :: link with the equilibrium constant (\(R = 8.314\), J)

h| \(\Delta H\) :: \(\Delta S\) :: Spontaneous?
&lt; 0 :: &gt; 0 :: always
&gt; 0 :: &lt; 0 :: never
&lt; 0 :: &lt; 0 :: at low \(T\) (\(T < \Delta H/\Delta S\))
&gt; 0 :: &gt; 0 :: at high \(T\) (\(T > \Delta H/\Delta S\))

## Chemical equilibrium {equilibrium}
\(K_c = \dfrac{[C]^c[D]^d}{[A]^a[B]^b}\) :: for \(a\,A + b\,B \rightleftharpoons c\,C + d\,D\); pure solids and liquids are left out
\(K_p = K_c\,(RT)^{\Delta n}\) :: \(\Delta n\) = moles of gaseous products − moles of gaseous reactants (\(R = 0.0821\))
\(Q\) vs \(K\) :: \(Q < K\) → goes forward; \(Q > K\) → goes backward; \(Q = K\) → at equilibrium
\(K' = 1/K\); \(K' = K^m\); \(K = K_1K_2\) :: reversed reaction; coefficients multiplied by \(m\); two reactions added
Le Chatelier :: add reactant / remove product → right; higher \(P\) (smaller \(V\)) → side with fewer moles of gas; higher \(T\) → endothermic direction (only \(T\) changes \(K\))
\(\ln\dfrac{K_2}{K_1} = -\dfrac{\Delta H^\circ}{R}\left(\dfrac{1}{T_2} - \dfrac{1}{T_1}\right)\) :: van 't Hoff equation
\(K_{ps} = [M^{n+}]^a[X^{m-}]^b\) :: solubility product (\(K_{sp}\)) of \(M_aX_b\); a precipitate forms if \(Q > K_{ps}\)
\(K_{ps} = s^2,\ 4s^3,\ 27s^4,\ 108s^5\) :: molar solubility \(s\) for \(MX\), \(MX_2\) (or \(M_2X\)), \(MX_3\), \(M_2X_3\); a common ion lowers \(s\)

## Acids and bases {acidbase}
\(\mathrm{pH} = -\log[\ce{H3O+}]\), \(\mathrm{pOH} = -\log[\ce{OH-}]\) :: \([\ce{H3O+}] = 10^{-\mathrm{pH}}\)
\(K_w = [\ce{H3O+}][\ce{OH-}] = 1.0\times10^{-14}\), \(\mathrm{pH} + \mathrm{pOH} = 14\) :: at 25 °C
Strong acid / strong base :: \([\ce{H3O+}] = C_a\); \([\ce{OH-}] = C_b\) × number of \(\ce{OH-}\) (e.g. \(\ce{Ba(OH)2}\): \(2C_b\))
\(K_a = \dfrac{[\ce{H3O+}][\ce{A-}]}{[\ce{HA}]}\), \([\ce{H3O+}] \approx \sqrt{K_aC_a}\) :: weak acid (valid when \(x \ll C_a\), roughly \(C_a/K_a > 100\); otherwise solve \(\frac{x^2}{C_a - x} = K_a\))
\([\ce{OH-}] \approx \sqrt{K_bC_b}\) :: weak base
\(K_aK_b = K_w\), \(\mathrm{p}K_a + \mathrm{p}K_b = 14\) :: conjugate acid–base pair
\(\alpha = \dfrac{x}{C} \approx \sqrt{\dfrac{K_a}{C}}\) :: degree of ionization (increases on dilution)
\(\mathrm{pH} = \mathrm{p}K_a + \log\dfrac{[\ce{A-}]}{[\ce{HA}]}\) :: buffer (Henderson–Hasselbalch); basic buffer: \(\mathrm{pOH} = \mathrm{p}K_b + \log\frac{[\ce{BH+}]}{[\ce{B}]}\)
Salt hydrolysis :: anion of a weak acid (\(\ce{CH3COO-}\)) → basic, \([\ce{OH-}] \approx \sqrt{\tfrac{K_w}{K_a}C_s}\); cation of a weak base (\(\ce{NH4+}\)) → acidic, \([\ce{H3O+}] \approx \sqrt{\tfrac{K_w}{K_b}C_s}\)
Titration :: equivalence point: \(n_{acid} = n_{base}\) (monoprotic: \(C_aV_a = C_bV_b\)); halfway to the equivalence point of a weak acid: \(\mathrm{pH} = \mathrm{p}K_a\)

## Electrochemistry {electrochem}
\(E^\circ_{cell} = E^\circ_{cathode} - E^\circ_{anode}\) :: reduction potentials from the table; cathode = reduction, anode = oxidation
\(\Delta G^\circ = -nFE^\circ_{cell}\), \(\Delta G = -nFE\) :: spontaneous if \(E > 0\)
\(E = E^\circ - \dfrac{0.0592}{n}\log Q\) :: Nernst equation at 25 °C (in general \(E = E^\circ - \frac{RT}{nF}\ln Q\))
\(E = E^\circ + \dfrac{0.0592}{n}\log\dfrac{[\text{Ox}]}{[\text{Red}]}\) :: one half-cell; for \(\ce{M^{n+}/M}\): \(E = E^\circ + \frac{0.0592}{n}\log[\ce{M^{n+}}]\)
\(\log K = \dfrac{nE^\circ}{0.0592}\) :: equilibrium constant from \(E^\circ\) at 25 °C (\(\ln K = \frac{nFE^\circ}{RT}\))
\(E = \dfrac{0.0592}{n}\log\dfrac{C_{conc}}{C_{dil}}\) :: concentration cell
\(Q = I\,t\), \(n_{e^-} = \dfrac{Q}{F}\), \(m = \dfrac{I\,t\,M}{n\,F}\) :: electrolysis (Faraday's laws)

## Chemical kinetics {kinetics}
\(v = -\dfrac{1}{a}\dfrac{\Delta[A]}{\Delta t} = \dfrac{1}{c}\dfrac{\Delta[C]}{\Delta t}\) :: rate of \(a\,A \to c\,C\)
\(v = k[A]^x[B]^y\) :: rate law: the orders \(x, y\) come from experiments (equal to the coefficients only for elementary steps); overall order \(x + y\)

h| Order :: Integrated law :: Half-life :: Units of \(k\)
0 :: \([A] = [A]_0 - kt\) :: \(t_{1/2} = \dfrac{[A]_0}{2k}\) :: \(\mathrm{M\,s^{-1}}\)
1 :: \(\ln[A] = \ln[A]_0 - kt\) :: \(t_{1/2} = \dfrac{\ln2}{k} = \dfrac{0.693}{k}\) :: \(\mathrm{s^{-1}}\)
2 :: \(\dfrac{1}{[A]} = \dfrac{1}{[A]_0} + kt\) :: \(t_{1/2} = \dfrac{1}{k[A]_0}\) :: \(\mathrm{M^{-1}\,s^{-1}}\)

\(k = A\,e^{-E_a/RT}\) :: Arrhenius equation
\(\ln\dfrac{k_2}{k_1} = -\dfrac{E_a}{R}\left(\dfrac{1}{T_2} - \dfrac{1}{T_1}\right)\) :: rate constants at two temperatures (\(R = 8.314\))
After \(m\) half-lives :: first order: \(\left(\tfrac12\right)^m\) of the reactant is left
`;

/* ============================ ANALISI I ============================ */
const ANALISI = String.raw`
# Analisi I — formulas

## Algebra and trigonometry {algebra}
\(a^xa^y = a^{x+y}\), \((a^x)^y = a^{xy}\), \(a^x = e^{x\log a}\) :: powers (\(a > 0\))
\(\log(xy) = \log x + \log y\), \(\log x^\alpha = \alpha\log x\), \(\log_a x = \dfrac{\log x}{\log a}\) :: logarithms (\(\log = \ln\), base \(e\))
\(\sin^2x + \cos^2x = 1\), \(\tan x = \dfrac{\sin x}{\cos x}\), \(1 + \tan^2x = \dfrac{1}{\cos^2x}\) :: basic identities
\(\sin(\alpha\pm\beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta\) :: addition formula (sine)
\(\cos(\alpha\pm\beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta\) :: addition formula (cosine)
\(\sin2x = 2\sin x\cos x\), \(\cos2x = \cos^2x - \sin^2x = 1 - 2\sin^2x = 2\cos^2x - 1\) :: double angle
\(\sin^2x = \dfrac{1 - \cos2x}{2}\), \(\cos^2x = \dfrac{1 + \cos2x}{2}\) :: lowering the power (useful in integrals)
\(\sinh x = \dfrac{e^x - e^{-x}}{2}\), \(\cosh x = \dfrac{e^x + e^{-x}}{2}\), \(\cosh^2x - \sinh^2x = 1\) :: hyperbolic functions
\(|a + b| \le |a| + |b|\), \(|x| < r \iff -r < x < r\) :: absolute value

h| \(x\) :: \(0\) :: \(\frac{\pi}{6}\) :: \(\frac{\pi}{4}\) :: \(\frac{\pi}{3}\) :: \(\frac{\pi}{2}\) :: \(\pi\)
\(\sin x\) :: \(0\) :: \(\frac12\) :: \(\frac{\sqrt2}{2}\) :: \(\frac{\sqrt3}{2}\) :: \(1\) :: \(0\)
\(\cos x\) :: \(1\) :: \(\frac{\sqrt3}{2}\) :: \(\frac{\sqrt2}{2}\) :: \(\frac12\) :: \(0\) :: \(-1\)
\(\tan x\) :: \(0\) :: \(\frac{\sqrt3}{3}\) :: \(1\) :: \(\sqrt3\) :: — :: \(0\)

## Sets, logic, sup and inf {sets}
\(\overline{A\cup B} = \bar A\cap\bar B\), \(\overline{A\cap B} = \bar A\cup\bar B\) :: De Morgan (sets)
\(\neg(P\wedge Q) \iff \neg P\vee\neg Q\), \(\neg(P\vee Q) \iff \neg P\wedge\neg Q\) :: De Morgan (logic)
\(\neg(\forall x\ P(x)) \iff \exists x\ \neg P(x)\), \(\neg(\exists x\ P(x)) \iff \forall x\ \neg P(x)\) :: negating quantifiers
\((P \Rightarrow Q) \iff (\neg Q \Rightarrow \neg P)\) :: contrapositive; \(\neg(P\Rightarrow Q) \iff P\wedge\neg Q\)
\(M = \sup A\) :: \(a \le M\) for all \(a\in A\), and for every \(\varepsilon > 0\) some \(a\in A\) has \(a > M - \varepsilon\) (maximum if \(M\in A\))
\(m = \inf A\) :: \(a \ge m\) for all \(a\in A\), and for every \(\varepsilon > 0\) some \(a\in A\) has \(a < m + \varepsilon\) (minimum if \(m\in A\))

## Functions and domains {functions}
Domain conditions :: denominators \(\ne 0\); even roots: argument \(\ge 0\); \(\log g(x)\): \(g(x) > 0\); \(\arcsin g\), \(\arccos g\): \(-1 \le g \le 1\); \(f(x)^{g(x)} = e^{g(x)\log f(x)}\): \(f(x) > 0\)
Even / odd :: \(f(-x) = f(x)\) (symmetric about the \(y\)-axis) / \(f(-x) = -f(x)\) (symmetric about the origin)
Inverse function :: exists if \(f\) is injective (e.g. strictly monotone); its graph is the reflection of the graph of \(f\) in \(y = x\)
\(\arcsin: [-1,1]\to[-\tfrac\pi2,\tfrac\pi2]\), \(\arccos: [-1,1]\to[0,\pi]\), \(\arctan: \mathbb R\to(-\tfrac\pi2,\tfrac\pi2)\) :: inverse trigonometric functions

## Limits {limits}
\(\displaystyle\lim_{x\to0}\frac{\sin x}{x} = 1\), \(\displaystyle\lim_{x\to0}\frac{1 - \cos x}{x^2} = \frac12\), \(\displaystyle\lim_{x\to0}\frac{\tan x}{x} = 1\) :: trigonometric
\(\displaystyle\lim_{x\to0}\frac{e^x - 1}{x} = 1\), \(\displaystyle\lim_{x\to0}\frac{a^x - 1}{x} = \log a\), \(\displaystyle\lim_{x\to0}\frac{\log(1 + x)}{x} = 1\) :: exponential and logarithm
\(\displaystyle\lim_{x\to0}\frac{(1 + x)^\alpha - 1}{x} = \alpha\), \(\displaystyle\lim_{x\to\pm\infty}\left(1 + \frac ax\right)^x = e^a\), \(\displaystyle\lim_{x\to0}(1 + x)^{1/x} = e\) :: powers and \(e\)
\(\displaystyle\lim_{x\to0^+}x^\alpha\log x = 0\), \(\displaystyle\lim_{x\to+\infty}\frac{\log^\beta x}{x^\alpha} = 0\), \(\displaystyle\lim_{x\to+\infty}\frac{x^\alpha}{a^x} = 0\) :: hierarchy (\(\alpha, \beta > 0\), \(a > 1\)): \(\log^\beta x \ll x^\alpha \ll a^x\); for sequences also \(a^n \ll n! \ll n^n\)
Indeterminate forms :: \(\frac00\), \(\frac\infty\infty\), \(0\cdot\infty\), \(+\infty - \infty\), \(1^\infty\), \(0^0\), \(\infty^0\) (for the last three write \(f^g = e^{g\log f}\))
De l'Hôpital :: for \(\frac00\) or \(\frac\infty\infty\): if \(\lim\frac{f'}{g'}\) exists, then \(\lim\frac fg = \lim\frac{f'}{g'}\)

## Asymptotics and o-small {asymptotics}
\(f \sim g \iff \dfrac fg \to 1\) :: asymptotic equivalence: in products and quotients \(f\) can be replaced by \(g\) (not in sums)
\(f = o(g) \iff \dfrac fg \to 0\) :: \(f\) is negligible with respect to \(g\)
\(o(x^n) \pm o(x^n) = o(x^n)\), \(c\cdot o(x^n) = o(x^n)\) :: o-small algebra (as \(x\to0\))
\(x^m\,o(x^n) = o(x^{n+m})\), \(o(x^m)\,o(x^n) = o(x^{n+m})\), \(o(x^n) = o(x^m)\) if \(m \le n\) :: o-small algebra (as \(x\to0\))
Order of an infinitesimal :: \(f\) has order \(\alpha\) if \(f \sim c\,x^\alpha\) (\(c \ne 0\)); \(c\,x^\alpha\) is its principal part

## Asymptotes {asymptotes}
Vertical \(x = x_0\) :: \(\lim_{x\to x_0^\pm}f(x) = \pm\infty\)
Horizontal \(y = \ell\) :: \(\lim_{x\to\pm\infty}f(x) = \ell\)
Oblique \(y = mx + q\) :: \(m = \lim_{x\to\pm\infty}\dfrac{f(x)}{x}\) (finite, \(\ne 0\)) and \(q = \lim_{x\to\pm\infty}\big(f(x) - mx\big)\) (finite)

## Taylor and Maclaurin {taylor}
\(f(x) = \displaystyle\sum_{k=0}^n\frac{f^{(k)}(x_0)}{k!}(x - x_0)^k + o\big((x - x_0)^n\big)\) :: Taylor formula, Peano remainder (Lagrange remainder: \(\frac{f^{(n+1)}(\xi)}{(n+1)!}(x - x_0)^{n+1}\))

h| Maclaurin expansions (\(x\to0\)) ::
\(e^x = 1 + x + \frac{x^2}{2} + \frac{x^3}{6} + \dots + \frac{x^n}{n!} + o(x^n)\) :: \(\log(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \dots + (-1)^{n+1}\frac{x^n}{n} + o(x^n)\)
\(\sin x = x - \frac{x^3}{6} + \frac{x^5}{120} + o(x^6)\) :: \(\cos x = 1 - \frac{x^2}{2} + \frac{x^4}{24} + o(x^5)\)
\(\tan x = x + \frac{x^3}{3} + \frac{2x^5}{15} + o(x^6)\) :: \(\arctan x = x - \frac{x^3}{3} + \frac{x^5}{5} + o(x^6)\)
\(\arcsin x = x + \frac{x^3}{6} + \frac{3x^5}{40} + o(x^6)\) :: \(\log(1 - x) = -x - \frac{x^2}{2} - \frac{x^3}{3} - \dots - \frac{x^n}{n} + o(x^n)\)
\((1 + x)^\alpha = 1 + \alpha x + \binom{\alpha}{2}x^2 + \binom{\alpha}{3}x^3 + o(x^3)\) :: \(\binom{\alpha}{k} = \frac{\alpha(\alpha - 1)\cdots(\alpha - k + 1)}{k!}\)
\(\sqrt{1 + x} = 1 + \frac{x}{2} - \frac{x^2}{8} + \frac{x^3}{16} + o(x^3)\) :: \(\frac{1}{\sqrt{1 + x}} = 1 - \frac{x}{2} + \frac{3x^2}{8} + o(x^2)\)
\(\frac{1}{1 - x} = 1 + x + x^2 + \dots + x^n + o(x^n)\) :: \(\frac{1}{1 + x} = 1 - x + x^2 - \dots + (-1)^nx^n + o(x^n)\)
\(\sinh x = x + \frac{x^3}{6} + o(x^4)\) :: \(\cosh x = 1 + \frac{x^2}{2} + \frac{x^4}{24} + o(x^5)\)

## Derivatives {derivatives}
\((f\pm g)' = f'\pm g'\), \((fg)' = f'g + fg'\), \(\left(\dfrac fg\right)' = \dfrac{f'g - fg'}{g^2}\) :: sum, product, quotient
\((f\circ g)'(x) = f'(g(x))\,g'(x)\), \((f^{-1})'(y_0) = \dfrac{1}{f'(x_0)}\), \(y_0 = f(x_0)\) :: chain rule, inverse function
\((f^g)' = f^g\left(g'\log f + g\,\dfrac{f'}{f}\right)\) :: variable base and exponent
\(y = f(x_0) + f'(x_0)(x - x_0)\) :: tangent line at \(x_0\)
Lagrange (mean value) :: \(f\) continuous on \([a,b]\), differentiable on \((a,b)\): \(f(b) - f(a) = f'(c)(b - a)\) for some \(c\in(a,b)\); Rolle: \(f(a) = f(b) \Rightarrow f'(c) = 0\)

\((x^\alpha)' = \alpha x^{\alpha-1}\) :: \((e^x)' = e^x\) :: \((a^x)' = a^x\log a\) :: \((\log|x|)' = \frac1x\)
\((\sin x)' = \cos x\) :: \((\cos x)' = -\sin x\) :: \((\tan x)' = 1 + \tan^2x = \frac{1}{\cos^2x}\) :: \((\arctan x)' = \frac{1}{1 + x^2}\)
\((\arcsin x)' = \frac{1}{\sqrt{1 - x^2}}\) :: \((\arccos x)' = -\frac{1}{\sqrt{1 - x^2}}\) :: \((\sinh x)' = \cosh x\) :: \((\cosh x)' = \sinh x\)
\((\log_a x)' = \frac{1}{x\log a}\) :: \((\sqrt x)' = \frac{1}{2\sqrt x}\) :: \(\left(\frac1x\right)' = -\frac{1}{x^2}\) :: \((|x|)' = \frac{|x|}{x}\ (x \ne 0)\)

## Non-differentiable points {nondiff}
Corner point :: \(f'_-(x_0) \ne f'_+(x_0)\), at least one of them finite
Cusp :: \(f'_-(x_0)\) and \(f'_+(x_0)\) infinite with opposite signs
Vertical tangent (inflection) :: \(f'_-(x_0) = f'_+(x_0) = +\infty\) (or both \(-\infty\))
How to check :: if \(f\) is continuous at \(x_0\) and \(\lim_{x\to x_0^\pm}f'(x)\) exist, they are \(f'_\pm(x_0)\)

## Function study {study}
Steps :: domain → symmetries → sign and zeros → limits at the endpoints, asymptotes → \(f'\): monotonicity, max and min → \(f''\): convexity, inflection points → graph
\(f' > 0\) on an interval :: \(f\) increasing there (\(f' < 0\): decreasing)
\(f'(x_0) = 0\), \(f''(x_0) > 0\) :: local minimum (\(f''(x_0) < 0\): local maximum)
\(f'' > 0\) :: convex (\(f'' < 0\): concave); inflection point where \(f''\) changes sign

## Integrals {integrals}
h| Primitives (\(+\,c\)) :: ::
\(\int x^\alpha dx = \frac{x^{\alpha+1}}{\alpha+1}\ (\alpha \ne -1)\) :: \(\int\frac{dx}{x} = \log|x|\) :: \(\int e^{ax}dx = \frac{e^{ax}}{a}\)
\(\int\sin x\,dx = -\cos x\) :: \(\int\cos x\,dx = \sin x\) :: \(\int\frac{dx}{\cos^2x} = \tan x\)
\(\int a^x dx = \frac{a^x}{\log a}\) :: \(\int\sinh x\,dx = \cosh x\) :: \(\int\cosh x\,dx = \sinh x\)
\(\int\frac{dx}{x^2 + a^2} = \frac1a\arctan\frac xa\) :: \(\int\frac{dx}{\sqrt{a^2 - x^2}} = \arcsin\frac xa\) :: \(\int\frac{dx}{\sqrt{x^2 + k}} = \log\left|x + \sqrt{x^2 + k}\right|\)
\(\int\frac{f'(x)}{f(x)}dx = \log|f(x)|\) :: \(\int f'f^\alpha dx = \frac{f^{\alpha+1}}{\alpha+1}\) :: \(\int f'e^f dx = e^f\)
\(\int\frac{f'}{1 + f^2}dx = \arctan f\) :: \(\int\log x\,dx = x\log x - x\) :: \(\int\frac{dx}{(x - a)^2} = -\frac{1}{x - a}\)
\(\int\frac{dx}{(x - a)(x - b)} = \frac{1}{a - b}\log\left|\frac{x - a}{x - b}\right|\) :: \(\int\sin^2x\,dx = \frac{x - \sin x\cos x}{2}\) :: \(\int\cos^2x\,dx = \frac{x + \sin x\cos x}{2}\)

\(\displaystyle\int f(g(x))\,g'(x)\,dx = \int f(t)\,dt\), \(t = g(x)\) :: substitution (in a definite integral change the limits too)
\(\displaystyle\int f\,g' = fg - \int f'g\) :: by parts (e.g. \(x^ne^x\), \(x\sin x\), \(\log x\), \(\arctan x\))
\(\displaystyle\frac{A}{x - a} + \frac{B}{x - b}\), \(\displaystyle\frac{A}{x - a} + \frac{B}{(x - a)^2}\) :: partial fractions (distinct / double root); divide first if \(\deg N \ge \deg D\)
\(\displaystyle\int\frac{dx}{(x + p)^2 + q^2} = \frac1q\arctan\frac{x + p}{q}\) :: denominator with \(\Delta < 0\): complete the square
\(t = \tan\frac x2\): \(\sin x = \dfrac{2t}{1 + t^2}\), \(\cos x = \dfrac{1 - t^2}{1 + t^2}\), \(dx = \dfrac{2\,dt}{1 + t^2}\) :: rational functions of \(\sin x\) and \(\cos x\)
\(\displaystyle\int_a^bf(x)\,dx = F(b) - F(a)\) :: fundamental theorem of calculus (\(F' = f\))
\(\dfrac{d}{dx}\displaystyle\int_a^{g(x)}f(t)\,dt = f(g(x))\,g'(x)\) :: integral functions: \(F(x) = \int_a^xf\) is continuous and \(F' = f\) where \(f\) is continuous
\(\dfrac{1}{b - a}\displaystyle\int_a^bf = f(c)\) :: integral mean value theorem (\(f\) continuous)
\(\displaystyle\int_{-a}^af = 0\) (\(f\) odd), \(\displaystyle\int_{-a}^af = 2\int_0^af\) (\(f\) even) :: symmetric intervals

## Improper integrals {improper}
\(\displaystyle\int_1^{+\infty}\frac{dx}{x^\alpha}\) converges \(\iff \alpha > 1\); \(\displaystyle\int_0^1\frac{dx}{x^\alpha}\) converges \(\iff \alpha < 1\) :: reference integrals
\(\displaystyle\int_2^{+\infty}\frac{dx}{x^\alpha\log^\beta x}\) converges \(\iff \alpha > 1\), or \(\alpha = 1\) and \(\beta > 1\) :: with logarithms
\(\displaystyle\int_0^{+\infty}e^{-ax}\,dx = \frac1a\) :: \(a > 0\)
Comparison :: \(0 \le f \le g\): \(\int g\) converges ⇒ \(\int f\) converges; \(\int f\) diverges ⇒ \(\int g\) diverges
Asymptotic comparison :: \(f \sim g\) (constant sign) near the critical point ⇒ same behaviour
Absolute convergence :: \(\int|f|\) converges ⇒ \(\int f\) converges

## Complex numbers {complex}
\(z = a + ib\), \(\bar z = a - ib\), \(|z| = \sqrt{a^2 + b^2}\), \(z\bar z = |z|^2\) :: algebraic form, conjugate, modulus
\(\dfrac1z = \dfrac{\bar z}{|z|^2}\), \(\mathrm{Re}\,z = \dfrac{z + \bar z}{2}\), \(\mathrm{Im}\,z = \dfrac{z - \bar z}{2i}\) :: inverse, real and imaginary part
\(z = \rho(\cos\theta + i\sin\theta) = \rho e^{i\theta}\) :: trigonometric / exponential form, \(\rho = |z|\), \(\theta = \arg z\)
\(e^{i\theta} = \cos\theta + i\sin\theta\), \(e^{a+ib} = e^a(\cos b + i\sin b)\) :: Euler's formula
\(z_1z_2 = \rho_1\rho_2e^{i(\theta_1 + \theta_2)}\), \(\dfrac{z_1}{z_2} = \dfrac{\rho_1}{\rho_2}e^{i(\theta_1 - \theta_2)}\) :: product and quotient
\(z^n = \rho^ne^{in\theta}\) :: de Moivre
\(\sqrt[n]{w} = \sqrt[n]{|w|}\,e^{i\frac{\varphi + 2k\pi}{n}}\), \(k = 0, \dots, n-1\) :: the \(n\) roots: vertices of a regular polygon (\(\varphi = \arg w\))
\(az^2 + bz + c = 0\): \(z = \dfrac{-b \pm \sqrt{\Delta}}{2a}\) :: real coefficients with \(\Delta < 0\): \(\sqrt\Delta = \pm i\sqrt{|\Delta|}\)

## Differential equations {odes}
\(y' + a(x)y = b(x)\): \(y = e^{-A(x)}\left(\displaystyle\int b(x)e^{A(x)}dx + C\right)\), \(A' = a\) :: first-order linear
\(y' = a(x)\,b(y)\): \(\displaystyle\int\frac{dy}{b(y)} = \int a(x)\,dx\) :: separable (plus the constant solutions \(b(y) = 0\))
\(y'' + py' + qy = 0\), \(\lambda^2 + p\lambda + q = 0\) :: homogeneous second order and its characteristic equation
\(\Delta > 0\): \(c_1e^{\lambda_1x} + c_2e^{\lambda_2x}\); \(\Delta = 0\): \((c_1 + c_2x)e^{\lambda x}\); \(\Delta < 0\), \(\lambda = \alpha\pm i\beta\): \(e^{\alpha x}(c_1\cos\beta x + c_2\sin\beta x)\) :: general solution of the homogeneous equation
\(y = y_{hom} + y_p\) :: complete equation; the constants come from the initial conditions (Cauchy problem)

h| Right-hand side :: Try \(y_p\) :: Multiply by \(x^m\), where \(m\) is
\(P_n(x)\) (polynomial of degree \(n\)) :: \(Q_n(x)\) :: the multiplicity of \(0\) as a root
\(P_n(x)\,e^{kx}\) :: \(Q_n(x)\,e^{kx}\) :: the multiplicity of \(k\) as a root
\(A\cos\omega x + B\sin\omega x\) :: \(C\cos\omega x + D\sin\omega x\) :: 1 if \(i\omega\) is a root (resonance), else 0
> \(Q_n\) is a generic polynomial of degree \(n\). Superposition: for a sum of right-hand sides, add the particular solutions.
`;

G.FORMULAS.analisi = sheet(ANALISI);
G.FORMULAS.chem = sheet(CHEM);
// What the chemistry exam provides: the tables (chem.js) plus the constants.
G.EXAM_SHEETS = G.EXAM_SHEETS || {};
G.EXAM_SHEETS.chem = () => (G.TABLES && G.TABLES.chem ? G.TABLES.chem() : '') + sheet(CHEM_CONSTANTS, false);
G.FORMULA_SHEET = sheet;
})(typeof window !== 'undefined' ? window : globalThis);
