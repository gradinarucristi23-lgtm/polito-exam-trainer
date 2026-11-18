/* Study guides (own notes, no course files): shown in the "Midterm guide" tab, printable as PDF. */
(function (G) {
'use strict';
const chem1 = String.raw`
<h2>Chemistry — Midterm 1 study guide</h2>
<p class="small muted">Covers exactly the topics announced by Prof. Kriegel for the first midterm: the atom, the chemical bond, inorganic nomenclature, stoichiometry and gases. Own summary for revision: check details against the lecture slides. Practice with <b>Computer test → Midterm 1</b> and the <b>Practice</b> tab.</p>
<div class="row noprint" style="gap:6px;flex-wrap:wrap;margin:8px 0">
  <button class="btn" data-jump="g-atom">1 Atom</button><button class="btn" data-jump="g-config">2 Configurations</button><button class="btn" data-jump="g-periodic">3 Periodic table</button>
  <button class="btn" data-jump="g-bond">4 Bonds</button><button class="btn" data-jump="g-geom">5 Geometry</button><button class="btn" data-jump="g-nom">6 Nomenclature</button>
  <button class="btn" data-jump="g-stoich">7 Stoichiometry</button><button class="btn" data-jump="g-gas">8 Gases</button><button class="btn" data-jump="g-traps">Traps</button></div>

<h3 id="g-atom">1. The atom — atomic theory and mass problems</h3>
<ul>
<li><b>Models:</b> Dalton (indivisible atoms, fixed mass ratios) → Thomson (electrons, "plum pudding") → Rutherford (gold foil: small, dense, positive nucleus) → Bohr (quantized orbits, \(E_n=-2.18\times10^{-18}\,\text{J}/n^2\) for H) → quantum-mechanical model (orbitals = probability regions, Schrödinger, Heisenberg).</li>
<li><b>Particles:</b> proton \(+1\), 1.0073 u; neutron 0, 1.0087 u; electron \(-1\), \(5.49\times10^{-4}\) u. \(1\,\text{u}=1.6605\times10^{-24}\,\text{g}\).</li>
<li>\(Z\) = atomic number = protons; \(A\) = mass number = protons + neutrons; neutrons \(=A-Z\); ion: electrons \(=Z-\text{charge}\). Notation \(\ce{^{A}_{Z}X^{q}}\).</li>
<li><b>Isotopes</b> = same \(Z\), different \(A\). Average atomic mass \(\bar M=\sum_i x_i M_i\) (\(x_i\) = abundance as a fraction).
  <br><i>Example:</i> Cl = 75.78 % \(^{35}\)Cl (34.969 u) + 24.22 % \(^{37}\)Cl (36.966 u) → \(0.7578\cdot34.969+0.2422\cdot36.966=35.45\) u. With two isotopes and one unknown abundance: \(x\,M_1+(1-x)M_2=\bar M\).</li>
<li>Mass of one atom \(=M/N_A\) (g); number of atoms in \(m\) grams \(=\dfrac{m}{M}N_A\), \(N_A=6.022\times10^{23}\,\text{mol}^{-1}\).</li>
<li><b>Light:</b> \(c=\lambda\nu\), \(E=h\nu=hc/\lambda\), \(h=6.626\times10^{-34}\) J·s. Energy per mole of photons \(=N_A h\nu\).</li>
</ul>

<h3 id="g-config">2. Quantum numbers and electron configuration</h3>
<table><tr><th>Number</th><th>Values</th><th>Meaning</th></tr>
<tr><td>\(n\)</td><td>1, 2, 3, …</td><td>shell, size and energy</td></tr>
<tr><td>\(l\)</td><td>0 … \(n-1\) (s, p, d, f)</td><td>subshell, orbital shape</td></tr>
<tr><td>\(m_l\)</td><td>\(-l\) … \(+l\)</td><td>orientation; \(2l+1\) orbitals per subshell</td></tr>
<tr><td>\(m_s\)</td><td>\(+\tfrac12,-\tfrac12\)</td><td>spin</td></tr></table>
<ul>
<li>Shell \(n\): \(n^2\) orbitals, \(2n^2\) electrons. Subshell capacity: s 2, p 6, d 10, f 14. Nodes: total \(n-1\), angular \(l\), radial \(n-l-1\).</li>
<li><b>Pauli:</b> no two electrons with the same 4 quantum numbers (max 2 per orbital, opposite spins). <b>Hund:</b> fill degenerate orbitals singly first, parallel spins. <b>Aufbau</b> (Madelung \(n+l\) rule): 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p.</li>
<li><b>Exceptions:</b> Cr [Ar] 3d<sup>5</sup>4s<sup>1</sup>, Cu [Ar] 3d<sup>10</sup>4s<sup>1</sup> (also Mo, Ag, Au): half-filled/filled d is more stable.</li>
<li><b>Ions:</b> cations lose electrons from the highest \(n\) first: Fe [Ar]3d<sup>6</sup>4s<sup>2</sup> → Fe<sup>2+</sup> [Ar]3d<sup>6</sup>, Fe<sup>3+</sup> [Ar]3d<sup>5</sup>. Isoelectronic species: same electron count (e.g. O<sup>2−</sup>, F<sup>−</sup>, Ne, Na<sup>+</sup>, Mg<sup>2+</sup>; radius decreases as \(Z\) grows).</li>
<li>Unpaired electrons → paramagnetic; all paired → diamagnetic. Valence electrons of main-group elements = group number (last digit).</li>
</ul>

<h3 id="g-periodic">3. Periodic table, families and periodic properties</h3>
<ul>
<li>Blocks: s (groups 1–2), p (13–18), d (3–12, transition metals), f (lanthanides/actinides). Period = highest \(n\).</li>
<li>Families: 1 alkali metals (ns<sup>1</sup>, +1), 2 alkaline-earth (ns<sup>2</sup>, +2), 15 pnictogens, 16 chalcogens, 17 halogens (ns<sup>2</sup>np<sup>5</sup>, −1), 18 noble gases (full shell). Metals left, non-metals right (upper), metalloids on the staircase (B, Si, Ge, As, Sb, Te).</li>
<li><b>Effective nuclear charge</b> \(Z_\text{eff}=Z-S\) grows along a period → explains the trends.</li>
</ul>
<table><tr><th>Property</th><th>Along a period →</th><th>Down a group ↓</th></tr>
<tr><td>Atomic radius</td><td>decreases</td><td>increases</td></tr>
<tr><td>Ionization energy</td><td>increases (dips: B &lt; Be, O &lt; N)</td><td>decreases</td></tr>
<tr><td>Electron affinity (energy released)</td><td>generally more negative</td><td>generally less negative</td></tr>
<tr><td>Electronegativity (Pauling)</td><td>increases (F = 4.0 highest)</td><td>decreases</td></tr>
<tr><td>Metallic character</td><td>decreases</td><td>increases</td></tr></table>
<p class="small">Cation smaller than its atom, anion larger. Successive ionization energies jump when a noble-gas core is broken (Mg: IE<sub>3</sub> ≫ IE<sub>2</sub>).</p>

<h3 id="g-bond">4. The chemical bond</h3>
<ul>
<li><b>Type from electronegativity difference</b> \(\Delta\chi\) (typical thresholds): &lt; 0.4 non-polar covalent; 0.4 – 1.7/1.9 polar covalent; larger → ionic. Ionic: metal + non-metal, electron transfer, lattice, high melting point, conducts when molten/dissolved. Covalent: shared pairs between non-metals.</li>
<li><b>Lewis structures:</b> count valence electrons (add for anions, subtract for cations) → skeleton (least electronegative atom in the centre, H never central) → complete octets → use multiple bonds if needed. Formal charge \(=V-N_\text{nonbonding}-\tfrac12 N_\text{bonding}\); best structure has formal charges closest to 0. Resonance (O<sub>3</sub>, NO<sub>3</sub><sup>−</sup>, CO<sub>3</sub><sup>2−</sup>). Exceptions: incomplete octet (B, Be), expanded octet (period ≥ 3: PCl<sub>5</sub>, SF<sub>6</sub>), odd electrons (NO).</li>
<li><b>Number of bonds / bond order:</b> single (1 σ), double (1 σ + 1 π), triple (1 σ + 2 π). Higher order → shorter and stronger bond (C–C 348, C=C 614, C≡C 839 kJ/mol). In MO terms, bond order \(=(\text{bonding}-\text{antibonding})/2\).</li>
<li><b>Bond energies:</b> \(\Delta H_r\approx\sum BE(\text{bonds broken})-\sum BE(\text{bonds formed})\). Breaking costs energy (+), forming releases it (−).</li>
<li><b>Polarization (Fajans):</b> an ionic bond gets covalent character when the cation is small and highly charged and the anion is large (e.g. AlCl<sub>3</sub> more covalent than NaCl; LiI more covalent than LiF).</li>
<li><b>Polar molecule</b> = polar bonds AND a geometry where the dipoles do not cancel (H<sub>2</sub>O, NH<sub>3</sub> polar; CO<sub>2</sub>, BF<sub>3</sub>, CH<sub>4</sub> non-polar).</li>
</ul>

<h3 id="g-geom">5. VSEPR geometry and hybridization</h3>
<p class="small">Steric number = atoms bonded to the central atom + lone pairs (a double/triple bond counts once).</p>
<table><tr><th>Steric no.</th><th>Hybrid.</th><th>Electron geometry</th><th>Molecular shape (lone pairs)</th><th>Examples</th></tr>
<tr><td>2</td><td>sp</td><td>linear 180°</td><td>linear (0)</td><td>CO<sub>2</sub>, BeCl<sub>2</sub>, HCN</td></tr>
<tr><td>3</td><td>sp<sup>2</sup></td><td>trigonal planar 120°</td><td>trigonal planar (0), bent (1)</td><td>BF<sub>3</sub>, SO<sub>2</sub>, NO<sub>3</sub><sup>−</sup></td></tr>
<tr><td>4</td><td>sp<sup>3</sup></td><td>tetrahedral 109.5°</td><td>tetrahedral (0), trigonal pyramidal (1, ~107°), bent (2, ~104.5°)</td><td>CH<sub>4</sub>, NH<sub>3</sub>, H<sub>2</sub>O</td></tr>
<tr><td>5</td><td>sp<sup>3</sup>d</td><td>trigonal bipyramidal</td><td>seesaw (1), T-shaped (2), linear (3)</td><td>PCl<sub>5</sub>, SF<sub>4</sub>, ClF<sub>3</sub>, I<sub>3</sub><sup>−</sup></td></tr>
<tr><td>6</td><td>sp<sup>3</sup>d<sup>2</sup></td><td>octahedral 90°</td><td>square pyramidal (1), square planar (2)</td><td>SF<sub>6</sub>, BrF<sub>5</sub>, XeF<sub>4</sub></td></tr></table>
<p class="small">Lone pairs repel more than bonding pairs → angles shrink. In C<sub>2</sub>H<sub>4</sub> each C is sp<sup>2</sup> (1 π bond); in C<sub>2</sub>H<sub>2</sub> each C is sp (2 π bonds).</p>

<h3 id="g-nom">6. Inorganic nomenclature</h3>
<p><b>Oxidation numbers:</b> element 0; monatomic ion = its charge; F −1; O −2 (peroxides −1, OF<sub>2</sub> +2); H +1 (metal hydrides −1); alkali +1, alkaline-earth +2, Al +3; sum = 0 (neutral) or the ion charge. <i>Example:</i> S in H<sub>2</sub>SO<sub>4</sub>: \(2(+1)+x+4(-2)=0\Rightarrow x=+6\).</p>
<table><tr><th>Class</th><th>Formed by</th><th>Examples (traditional / IUPAC)</th></tr>
<tr><td>Basic oxide</td><td>metal + O<sub>2</sub></td><td>Na<sub>2</sub>O sodium oxide; FeO iron(II) oxide / ferrous oxide; Fe<sub>2</sub>O<sub>3</sub> iron(III) oxide / ferric oxide</td></tr>
<tr><td>Acidic oxide (anhydride)</td><td>non-metal + O<sub>2</sub></td><td>CO<sub>2</sub> carbon dioxide; SO<sub>3</sub> sulfur trioxide; N<sub>2</sub>O<sub>5</sub> dinitrogen pentoxide</td></tr>
<tr><td>Hydroxide</td><td>basic oxide + H<sub>2</sub>O</td><td>NaOH sodium hydroxide; Ca(OH)<sub>2</sub>; Fe(OH)<sub>3</sub> iron(III) hydroxide</td></tr>
<tr><td>Oxoacid</td><td>acidic oxide + H<sub>2</sub>O</td><td>H<sub>2</sub>SO<sub>4</sub> sulfuric, H<sub>2</sub>SO<sub>3</sub> sulfurous, HNO<sub>3</sub> nitric, HNO<sub>2</sub> nitrous, H<sub>3</sub>PO<sub>4</sub> phosphoric, H<sub>2</sub>CO<sub>3</sub> carbonic</td></tr>
<tr><td>Hydracid / hydride</td><td>H + non-metal (group 16–17) / H + metal</td><td>HCl hydrochloric acid, H<sub>2</sub>S hydrosulfuric acid; NaH sodium hydride</td></tr>
<tr><td>Salt</td><td>acid + base → salt + water</td><td>NaCl sodium chloride; Na<sub>2</sub>SO<sub>4</sub> sulfate; KNO<sub>2</sub> nitrite; NaHCO<sub>3</sub> hydrogen carbonate</td></tr></table>
<ul>
<li>Two oxidation states: lower <b>-ous</b>, higher <b>-ic</b>. Halogen oxoacids: HClO hypo<b>chlor</b>ous (+1), HClO<sub>2</sub> chlorous (+3), HClO<sub>3</sub> chloric (+5), HClO<sub>4</sub> perchloric (+7).</li>
<li>Acid → anion: <b>-ic → -ate</b>, <b>-ous → -ite</b>, <b>hydro-…-ic → -ide</b> (HClO<sub>4</sub> → perchlorate, HNO<sub>2</sub> → nitrite, HCl → chloride). Each acidic H removed lowers the charge by 1: H<sub>2</sub>PO<sub>4</sub><sup>−</sup> dihydrogen phosphate, HPO<sub>4</sub><sup>2−</sup> hydrogen phosphate, PO<sub>4</sub><sup>3−</sup> phosphate.</li>
<li>Common ions: NH<sub>4</sub><sup>+</sup>, OH<sup>−</sup>, CN<sup>−</sup>, MnO<sub>4</sub><sup>−</sup> permanganate, Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup> dichromate, CrO<sub>4</sub><sup>2−</sup> chromate, CH<sub>3</sub>COO<sup>−</sup> acetate.</li>
<li><b>Reaction products:</b> basic oxide + water → hydroxide; acidic oxide + water → oxoacid; basic oxide + acidic oxide → salt; acid + hydroxide → salt + H<sub>2</sub>O; active metal + acid → salt + H<sub>2</sub>; carbonate + acid → salt + H<sub>2</sub>O + CO<sub>2</sub>.</li>
</ul>

<h3 id="g-stoich">7. Stoichiometry</h3>
<ul>
<li>\(n=\dfrac{m}{M}\); particles \(=nN_A\); atoms of an element in 1 mol of compound = its subscript × \(N_A\) (1 mol H<sub>2</sub>SO<sub>4</sub> contains 2 mol H, 1 mol S, 4 mol O).</li>
<li>Mass percent of X \(=\dfrac{(\text{atoms of X})\cdot M_X}{M_\text{compound}}\cdot100\). <b>Empirical formula:</b> % → grams (take 100 g) → moles → divide by the smallest → whole numbers. Molecular formula = empirical × \(M/M_\text{emp}\).</li>
<li><b>Balancing (no redox):</b> atoms that appear once first, then O and H; check the charge.</li>
<li><b>Redox (oxidation-number method):</b> find the atoms that change oxidation number; electrons lost = electrons gained (cross-multiply); then balance the rest. <b>Half-reactions in acid:</b> balance atoms ≠ O,H → O with H<sub>2</sub>O → H with H<sup>+</sup> → charge with e<sup>−</sup> → multiply and add. In base: add OH<sup>−</sup> to both sides to cancel H<sup>+</sup>. Oxidation = loss of e<sup>−</sup> (ox. no. increases), reducing agent is oxidized.
  <br><i>Example:</i> \(\ce{MnO4^- + 5Fe^2+ + 8H+ -> Mn^2+ + 5Fe^3+ + 4H2O}\).</li>
<li><b>Quantity needed to obtain something:</b> grams → moles → ratio of coefficients → moles → grams. <b>Limiting reagent:</b> compare \(n_i/\nu_i\); the smallest runs out. Yield \(=\dfrac{\text{actual}}{\text{theoretical}}\cdot100\).
  <br><i>Example:</i> mass of H<sub>2</sub>O from 4.0 g H<sub>2</sub> and 16 g O<sub>2</sub> in \(\ce{2H2 + O2 -> 2H2O}\): \(n_{H_2}=1.98\), \(n_{O_2}=0.500\); \(1.98/2=0.99 \gt 0.500/1\) → O<sub>2</sub> limiting → 1.00 mol H<sub>2</sub>O = 18.0 g.</li>
</ul>

<h3 id="g-gas">8. Gases</h3>
<ul>
<li><b>Ideal gas:</b> point particles, no interactions, elastic collisions. \(PV=nRT\), \(R=0.08206\) L·atm/(mol·K) \(=8.314\) J/(mol·K). Always \(T\) in kelvin (\(T=t+273.15\)); 1 atm = 101 325 Pa = 760 mmHg = 1.01325 bar.</li>
<li>Boyle (isothermal, \(n,T\) const): \(P_1V_1=P_2V_2\). Charles (constant \(P\)): \(V_1/T_1=V_2/T_2\). Gay-Lussac (constant \(V\)): \(P_1/T_1=P_2/T_2\). Combined: \(\dfrac{P_1V_1}{T_1}=\dfrac{P_2V_2}{T_2}\).</li>
<li><b>Avogadro:</b> equal volumes of gases at the same \(T,P\) contain the same number of moles: \(V\propto n\). Molar volume at STP (0 °C, 1 atm) = 22.414 L/mol; at 25 °C, 1 atm = 24.47 L/mol. Gas volumes react in the ratio of the coefficients.</li>
<li><b>Density:</b> \(d=\dfrac{PM}{RT}\) → \(M=\dfrac{dRT}{P}\).</li>
<li><b>Dalton (partial pressures):</b> \(P_\text{tot}=\sum P_i\), \(P_i=x_iP_\text{tot}\), \(x_i=n_i/n_\text{tot}\).</li>
<li><b>Air:</b> about 78 % N<sub>2</sub>, 21 % O<sub>2</sub>, 1 % Ar (by moles/volume). Average molar mass \(\bar M=\sum x_iM_i\approx0.78\cdot28.0+0.21\cdot32.0+0.01\cdot39.9\approx28.96\) g/mol (≈ 29). A gas is lighter than air if \(M \lt 29\).
  <br><i>Example:</i> 2.00 g of a gas fill 1.00 L at 27 °C and 1.00 atm: \(n=\dfrac{PV}{RT}=0.0406\) mol → \(M=49.3\) g/mol.</li>
</ul>

<h3 id="g-traps">Common traps</h3>
<ul>
<li>Temperature in °C instead of K in gas laws; mixing L with m³ (1 m³ = 1000 L) when using \(R=8.314\).</li>
<li>Steric number counts lone pairs; the <i>shape</i> name ignores them (NH<sub>3</sub> is tetrahedral electron geometry but trigonal pyramidal).</li>
<li>4s fills before 3d but is emptied first in transition-metal cations.</li>
<li>-ite/-ate belong to oxoanions (with O); -ide to simple anions (Cl<sup>−</sup>, S<sup>2−</sup>, O<sup>2−</sup>) and to OH<sup>−</sup>, CN<sup>−</sup>.</li>
<li>Percent abundances must be used as fractions; the mass of an isotope is not exactly \(A\).</li>
<li>In limiting-reagent problems divide moles by the coefficients before comparing.</li>
</ul>
`;
G.GUIDES = { chem: { tab: 'Midterm 1 guide', html: chem1, pdf: 'Chemistry - Midterm 1 study guide.pdf' } };
})(window);
