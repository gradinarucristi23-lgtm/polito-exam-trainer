/* PoliTo Exam Trainer — user interface */
(function () {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LETTERS = 'abcdef';

/* ======================= EXAM RULES (edit here) ======================= */
const SUBJECTS = [];
if (window.Engine) SUBJECTS.push({
  id: 'analisi', name: 'Analisi I', engine: window.Engine,
  mc: { minutes: 45, nOpts: 4, right: 1, wrong: 0, blank: 0, max: 15, pass: 8,
    rules: '15 multiple-choice questions (including theory) · 45 minutes · correct +1, wrong or blank 0 · pass with at least 8/15. A formula sheet is allowed.' },
  modes: [{ id: 'full', name: 'Computer test', desc: '15 questions on the whole syllabus', layout: window.Engine.EXAM_LAYOUT }],
  written: { minutes: 90, max: 15, pass: 8, rules: '2 exercises (function study + theory/exercise) · 90 minutes · max 15 points · pass with at least 8.' },
});
if (window.Chem) SUBJECTS.push({
  id: 'chem', name: 'Chemistry', engine: window.Chem,
  mc: { minutes: 25, nOpts: 5, right: 0.6, wrong: -0.12, blank: 0, max: 9, pass: 6,
    rules: '15 multiple-choice questions, 5 options each · 25 minutes · correct +0.6, wrong −0.12, blank 0 · admitted to the written test with at least 6/9.' },
  modes: window.Chem.MODES,
  written: { minutes: 70, max: 22, pass: 12, rules: 'Exercises + theory questions · 70 minutes · max 22 points · pass with at least 12. Periodic table, E° and ΔH°f tables are provided (see the Tables tab).' },
});
if (window.CS) SUBJECTS.push({
  id: 'cs', name: 'Computer Science', engine: window.CS,
  hasTest: false, writtenTab: 'Exam',   // the real exam has no multiple-choice test; its questions stay in Practice
  mc: window.CS.MC,
  modes: window.CS.MODES,
  written: window.CS.WRITTEN,
});
const TABS = [['test', 'Computer test'], ['written', 'Written exam'], ['practice', 'Practice'], ['history', 'History'], ['materials', 'Materials'], ['formula', 'Formulas'], ['tables', 'Tables'], ['guide', 'Guide']];
const guideOf = id => (window.GUIDES || {})[id];
const FORMULA_TAB = { cs: 'Cheat sheet' };   // tab name per subject (default 'Formulas')
const hasTables = id => !!(window.TABLES && window.TABLES[id]);
const DIFFS = ['random', '1', '2', '3', '4', '5', '6'];
const diffLabel = d => (d === 'random' ? 'Random' : 'Level ' + d);

/* ======================= storage ======================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('Could not save: browser storage is full or blocked.'); return false; } },
};
const HKEY = 'pet_history_v1';
// History lives in browser storage, or in the user's account (Firestore) while signed in.
const history = {
  cloud: null, _timers: {},
  all() { return this.cloud ? this.cloud.slice() : store.get(HKEY, []); },
  _local(list) { return store.set(HKEY, list); },
  _push(e, now) {
    if (!(window.Cloud && Cloud.user)) return;
    clearTimeout(this._timers[e.id]);
    const send = () => Cloud.put(e).catch(err => toast('Not saved to your account: ' + Cloud.errorText(err)));
    if (now) send(); else this._timers[e.id] = setTimeout(send, 1200);
  },
  add(e) { if (this.cloud) { this.cloud.unshift(e); this._push(e, true); } else { const l = store.get(HKEY, []); l.unshift(e); this._local(l); } },
  update(e) {
    if (this.cloud) { const i = this.cloud.findIndex(x => x.id === e.id); if (i >= 0) this.cloud[i] = e; else this.cloud.unshift(e); this._push(e); }
    else { const l = store.get(HKEY, []); const i = l.findIndex(x => x.id === e.id); if (i >= 0) { l[i] = e; this._local(l); } }
  },
  remove(id) {
    if (this.cloud) { this.cloud = this.cloud.filter(x => x.id !== id); clearTimeout(this._timers[id]); Cloud.del(id).catch(err => toast(Cloud.errorText(err))); }
    else this._local(store.get(HKEY, []).filter(x => x.id !== id));
    IDB.del(id).catch(() => {});
  },
  // Adds many entries at once (used by "Import from a file"). Resolves to the number that could not be saved.
  async addMany(list) {
    const byDate = (a, b) => (a.date < b.date ? 1 : -1);
    if (this.cloud) {
      let fail = 0;
      for (let i = 0; i < list.length; i += 20) {
        await Promise.all(list.slice(i, i + 20).map(e => Cloud.put(e).then(() => { this.cloud.push(e); }).catch(() => { fail++; })));
      }
      this.cloud.sort(byDate); return fail;
    }
    return this._local(store.get(HKEY, []).concat(list).sort(byDate)) ? 0 : list.length;
  },
};
const IDB = {
  _db: null,
  open() { if (this._db) return Promise.resolve(this._db); return new Promise((res, rej) => { const rq = indexedDB.open('pet_files', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('files'); rq.onsuccess = () => { this._db = rq.result; res(this._db); }; rq.onerror = () => rej(rq.error); }); },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('files', mode); const st = t.objectStore('files'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); },
  put(k, v) { return this.tx('readwrite', s => s.put(v, k)); },
  get(k) { return this.tx('readonly', s => s.get(k)); },
  del(k) { return this.tx('readwrite', s => s.delete(k)); },
};

/* ======================= helpers ======================= */
function rich(s) {
  return String(s ?? '').replace(/\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g, (m0, a, b) => {
    try { return katex.renderToString(a !== undefined ? a : b, { displayMode: b !== undefined, throwOnError: false, strict: 'ignore' }); } catch (e) { return esc(m0); }
  });
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
const fmtTime = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0'); };
const fmtNum = x => (Math.round(x * 100) / 100).toString();
const fmtDate = iso => { const d = new Date(iso); return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const levelFor = d => (d === 'random' ? 1 + Math.floor(Math.random() * 6) : Number(d));
function seg(name, values, cur, labels) { return `<div class="seg" data-seg="${name}">` + values.map((v, i) => `<button type="button" data-v="${v}" class="${v === cur ? 'on' : ''}">${labels ? labels[i] : v}</button>`).join('') + '</div>'; }
function bindSeg(root, name, fn) { $$(`[data-seg="${name}"] button`, root).forEach(b => b.onclick = () => { $$(`[data-seg="${name}"] button`, root).forEach(x => x.classList.remove('on')); b.classList.add('on'); fn(b.dataset.v); }); }
function htmlToText(html) { const d = document.createElement('div'); d.innerHTML = String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div|h\d|pre|tr)>/gi, '\n'); d.querySelectorAll('svg').forEach(s => s.remove()); return d.textContent.replace(/\n{3,}/g, '\n\n').trim(); }
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok; }
}

/* ======================= app state ======================= */
const ST = {
  subject: store.get('pet_subject', SUBJECTS[0] && SUBJECTS[0].id),
  tab: 'test',
  pref: store.get('pet_pref', {}),
  sess: {},       // active sessions per `${subject}:${tab}`
  results: {},    // results being displayed per key
};
if (!SUBJECTS.find(s => s.id === ST.subject)) ST.subject = SUBJECTS[0].id;
const SUB = () => SUBJECTS.find(s => s.id === ST.subject);
const key = (tab = ST.tab) => ST.subject + ':' + tab;
const pref = (k, d) => (ST.pref[ST.subject + '.' + k] ?? d);
const setPref = (k, v) => { ST.pref[ST.subject + '.' + k] = v; store.set('pet_pref', ST.pref); };
window.addEventListener('beforeunload', e => { if (Object.values(ST.sess).some(s => s && !s.finished)) { e.preventDefault(); e.returnValue = ''; } });

function renderHeader() {
  $('#subjectPills').innerHTML = SUBJECTS.map(s => `<button class="pill ${s.id === ST.subject ? 'on' : ''}" data-s="${s.id}">${esc(s.name)}</button>`).join('');
  $$('#subjectPills .pill').forEach(b => b.onclick = () => { ST.subject = b.dataset.s; ST.review = null; store.set('pet_subject', ST.subject); render(); });
  const hasMat = Object.values(window.MATERIALS || {}).some(l => l && l.length);
  if (!hasMat && ST.tab === 'materials') ST.tab = 'test';
  renderAccount();
  const admin = !!(window.Cloud && Cloud.isAdmin);
  if (!admin && ST.tab === 'admin') ST.tab = 'test';
  if (ST.tab === 'tables' && !hasTables(ST.subject)) ST.tab = 'formula';
  const noTest = SUB().hasTest === false;
  if (ST.tab === 'test' && noTest) ST.tab = 'written';
  if (ST.tab === 'guide' && !guideOf(ST.subject)) ST.tab = 'formula';
  const tabs = TABS.filter(([id]) => (hasMat || id !== 'materials') && (id !== 'tables' || hasTables(ST.subject)) && (id !== 'test' || !noTest) && (id !== 'guide' || !!guideOf(ST.subject))).concat(admin ? [['admin', 'Admin' + (ST.pendingCount ? ` (${ST.pendingCount})` : '')]] : []);
  $('#tabs').innerHTML = tabs.map(([id, nm]) => `<button class="tab ${id === ST.tab ? 'on' : ''}" data-t="${id}">${id === 'formula' ? (FORMULA_TAB[ST.subject] || nm) : id === 'written' ? (SUB().writtenTab || nm) : id === 'guide' ? guideOf(ST.subject).tab : nm}${ST.sess[ST.subject + ':' + id] && !ST.sess[ST.subject + ':' + id].finished ? ' •' : ''}</button>`).join('');
  $$('#tabs .tab').forEach(b => b.onclick = () => { ST.tab = b.dataset.t; ST.review = null; render(); });
  document.title = 'PoliTo Exam Trainer — ' + SUB().name;
}
function render() {
  clearInterval(ST.tick); document.onkeydown = null;
  if (gateView()) return;
  renderHeader();
  const main = $('#main');
  trialNote(main);
  ({ test: viewTest, written: viewWritten, practice: viewPractice, history: viewHistory, materials: viewMaterials, formula: viewFormula, tables: viewTables, guide: viewGuide, admin: viewAdmin })[ST.tab](main);
  window.scrollTo(0, 0);
}

function trialNote(main) {
  const C = window.Cloud;
  if (!C || C.status !== 'trial') return;
  const left = Math.max(1, Math.ceil((C.trialEnds - Date.now()) / 864e5));
  setTimeout(() => { if (!$('#trialNote')) main.insertAdjacentHTML('afterbegin', `<div class="rules small" id="trialNote">Trial account: ${left} day${left === 1 ? '' : 's'} left. After that the site’s owner has to approve your account to keep using the site. Your history stays saved.</div>`); }, 0);
}
/* ======================= SIGN-IN GATE (website with requireAccount) ======================= */
// Shows the welcome / waiting / blocked screen instead of the app. Returns true when it did.
function gateView() {
  const C = window.Cloud;
  if (!C || !C.gate) return false;
  if (C.state === 'ready' && C.user && C.canUse) return false;
  $('#subjectPills').innerHTML = ''; $('#tabs').innerHTML = ''; renderAccount();
  document.title = 'PoliTo Exam Trainer – practice tests for Analisi I, Chimica and Informatica';
  const main = $('#main'); const box = inner => `<div class="card gate">${inner}</div>`;
  if (C.failed) {
    main.innerHTML = box(`<h2>Can't connect right now</h2><p>The sign-in service could not be reached. Check your internet connection and reload the page.</p><button class="btn primary" id="gReload">Reload</button>`);
    $('#gReload').onclick = () => location.reload();
  } else if (C.state !== 'ready') {
    main.innerHTML = box('<p class="muted" style="margin:0">Loading…</p>');
  } else if (!C.user) {
    const appr = C.opts.approval;
    main.innerHTML = `<section class="card hero"><h1>Practice for your first-year exams at PoliTo</h1>
        <p>Timed computer tests that follow the real exam rules, written exams you can photograph and grade, practice by topic with full solutions, and your whole history with accuracy per topic. New questions every time.</p>
        <div class="row" style="margin-top:16px"><button class="btn primary big" id="gUp">Create an account</button><button class="btn big" id="gIn">Sign in</button></div>
        <p class="small muted" style="margin:12px 0 0">${appr ? (C.opts.trialDays ? `Free. You can use it right away for ${C.opts.trialDays} days; after that the site’s owner has to approve your account (the owner sees the email address you sign up with).` : 'Free. New accounts are approved by the site’s owner before first use; to do that, the owner sees the email address you sign up with.') : 'Free. Sign in with Google or with your email.'}</p></section>
      <div class="grid3">
        <div class="card"><h3>Analisi Matematica I</h3><p class="small muted">15-question computer tests (sets, limits, asymptotics, derivatives, function study, integrals, ODEs, complex numbers, theory) and written exams with function studies.</p></div>
        <div class="card"><h3>Chimica</h3><p class="small muted">Full test and both midterm formats: atoms and bonds, stoichiometry, gases, solutions, thermochemistry, equilibrium, acids and bases, electrochemistry, with the exam tables.</p></div>
        <div class="card"><h3>Computer Sciences (07JCJ, Python)</h3><p class="small muted">The real exam format: short theory questions plus a 26-point programming task, and the midterm with its bonus exercise. Plus “what does this code print?” practice on strings, lists, dictionaries, loops, functions and files.</p></div>
      </div>
      <div class="card"><h3 style="margin-top:0">Privacy</h3><p class="small muted" style="margin:0" id="gPrivacy">${PRIVACY}</p></div>
      <p class="small muted" style="text-align:center">Unofficial project, not affiliated with Politecnico di Torino.</p>`;
    $('#gUp').onclick = () => openAuth('signup'); $('#gIn').onclick = () => openAuth('signin');
  } else if (C.status === 'pending') {
    main.innerHTML = box(`<h2>Your account is waiting for approval</h2>
      <p>You signed up as <b>${esc(C.user.email)}</b>. ${C.trialEnds ? `Your ${esc(C.opts.trialDays)}-day trial ended on ${fmtDate(new Date(C.trialEnds).toISOString())}. ` : ''}The site’s owner approves accounts by hand. You don’t need to do anything else.</p>
      <p><b>Already approved but still seeing this page?</b> Press <b>Check again</b>, or reload the page (F5 on a computer, pull down or ↻ on a phone).</p>
      <div class="row"><button class="btn primary" id="gCheck">Check again</button><button class="btn" id="gOut">Sign out</button></div>
      <p class="small muted" style="margin:14px 0 0">Account ID: <code id="gUid">${esc(C.user.uid)}</code> <button class="linkbtn small" id="gCopy">Copy</button></p>
      <p class="small muted" style="margin:8px 0 0">Changed your mind? <button class="linkbtn small" id="gDel">Delete my account</button></p>`);
    $('#gDel').onclick = openDelete;
    $('#gCheck').onclick = async () => { const b = $('#gCheck'); b.disabled = true; b.textContent = 'Checking…'; await C.refreshStatus(); if (C.status === 'pending') { toast('Not approved yet.'); render(); } };
    $('#gCopy').onclick = async () => toast((await copyText(C.user.uid)) ? 'Account ID copied.' : 'Could not copy. Select it and copy by hand.');
    $('#gOut').onclick = () => C.signOut();
  } else if (C.status === 'blocked') {
    main.innerHTML = box(`<h2>This account can’t use the site</h2><p>The site’s owner has blocked <b>${esc(C.user.email)}</b>. If you think this is a mistake, contact the owner.</p><button class="btn" id="gOut">Sign out</button>`);
    $('#gOut').onclick = () => C.signOut();
  } else {
    main.innerHTML = box(`<h2>Your account could not be loaded</h2><p>${esc(C.errorText(C.statusError))}</p><div class="row"><button class="btn primary" id="gCheck">Try again</button><button class="btn" id="gOut">Sign out</button></div>`);
    $('#gCheck').onclick = () => C.refreshStatus();
    $('#gOut').onclick = () => C.signOut();
  }
  window.scrollTo(0, 0);
  return true;
}
document.addEventListener('visibilitychange', () => {
  const C = window.Cloud;
  if (!document.hidden && C && C.user && (C.status === 'pending' || C.status === 'trial')) C.refreshStatus();
});

/* ======================= ADMIN (site owner only) ======================= */
function viewAdmin(main) {
  main.innerHTML = '<div class="card"><h2>Accounts</h2><p class="muted">Loading…</p></div>';
  Cloud.listUsers().then(list => {
    if (ST.tab !== 'admin') return;
    const groups = [['pending', 'Waiting for approval'], ['approved', Cloud.opts.approval ? 'Approved' : 'Active'], ['blocked', 'Blocked']];
    const st = u => (u.uid === Cloud.user.uid ? 'approved' : u.status === 'blocked' ? 'blocked' : (!Cloud.opts.approval || u.status === 'approved') ? 'approved' : 'pending');
    ST.pendingCount = list.filter(u => st(u) === 'pending').length;
    const how = u => (u.provider === 'google.com' ? 'Google' : u.provider === 'password' ? 'Email' : esc(u.provider || '?'));
    const row = u => {
      const s = st(u), me = u.uid === Cloud.user.uid;
      const acts = me ? '<span class="badge">you · admin</span>'
        : s === 'pending' ? `<button class="btn primary" data-set="approved" data-u="${esc(u.uid)}">Approve</button><button class="btn danger" data-set="blocked" data-u="${esc(u.uid)}">Block</button>`
        : s === 'approved' ? `<button class="btn danger" data-set="blocked" data-u="${esc(u.uid)}">Block</button>`
        : `<button class="btn" data-set="approved" data-u="${esc(u.uid)}">Unblock</button>`;
      return `<div class="urow"><div class="uinfo"><b>${esc(u.email || '(no email)')}</b>${u.name ? ` <span class="muted">· ${esc(u.name)}</span>` : ''}
          <div class="small muted">${how(u)}${u.provider === 'password' && !u.verified ? ' · <span style="color:var(--warn)">email not verified</span>' : ''} · signed up ${u.created ? fmtDate(u.created) : '?'}${u.lastSeen ? ' · last visit ' + fmtDate(u.lastSeen) : ''}${st(u) === 'pending' && u.createdAt && u.createdAt.toMillis && Cloud.opts.trialDays ? ((t => t > Date.now() ? ` · <b>trial until ${fmtDate(new Date(t).toISOString())}</b>` : ' · trial ended')(u.createdAt.toMillis() + Cloud.opts.trialDays * 864e5)) : ''}</div></div>
        <div class="row uacts">${acts}</div></div>`;
    };
    main.innerHTML = `<div class="card"><h2>Accounts</h2>
        <p class="small muted">New accounts wait here until you approve them. Blocked people can’t use the site until you unblock them. To delete an account completely, use the Firebase console (Authentication → Users).</p></div>
      ${groups.map(([g, title]) => { const us = list.filter(u => st(u) === g); return `<div class="card"><h3>${title} <span class="muted">(${us.length})</span>${g === 'pending' && us.length > 1 ? ' <button class="btn small" id="approveAll">Approve all waiting</button>' : ''}</h3>${us.length ? us.map(row).join('') : '<p class="muted small" style="margin:0">Nobody.</p>'}</div>`; }).join('')}`;
    renderHeader();
    const aa = $('#approveAll', main);
    if (aa) aa.onclick = async () => {
      const us = list.filter(u => st(u) === 'pending');
      if (!confirm(`Approve all ${us.length} waiting accounts?`)) return;
      aa.disabled = true; let fail = 0;
      for (const u of us) { try { await Cloud.setStatus(u.uid, 'approved'); } catch (e) { fail++; } }
      toast(fail ? `${us.length - fail} approved, ${fail} failed.` : `${us.length} accounts approved.`); viewAdmin(main);
    };
    $$('[data-set]', main).forEach(b => b.onclick = async () => {
      const u = list.find(x => x.uid === b.dataset.u), to = b.dataset.set;
      if (to === 'blocked' && !confirm(`Block ${u.email}? They will not be able to use the site until you unblock them.`)) return;
      $$('[data-set]', main).forEach(x => { x.disabled = true; });
      try { await Cloud.setStatus(u.uid, to); toast(`${u.email}: ${to === 'approved' ? 'approved' : 'blocked'}.`); }
      catch (e) { toast('Not changed: ' + Cloud.errorText(e)); }
      viewAdmin(main);
    });
  }).catch(e => { if (ST.tab === 'admin') main.innerHTML = `<div class="card"><h2>Accounts</h2><p>Could not load the accounts: ${esc(Cloud.errorText(e))}</p></div>`; });
}

/* ======================= COMPUTER TEST ======================= */
function generateFromLayout(sub, layout, diff) {
  const used = new Set();
  return layout.map(id => { const q = sub.engine.generate(id, levelFor(diff), used); if (q.thId != null) used.add(q.thId); return q; });
}
function viewTest(main) {
  const sub = SUB(), k = key();
  if (ST.sess[k] && !ST.sess[k].finished) return examView(main, ST.sess[k]);
  if (ST.results[k]) return resultsView(main, ST.results[k], () => { delete ST.results[k]; render(); });
  const modeId = pref('mode', sub.modes[0].id), diff = pref('diff', 'random'), timer = pref('timer', true);
  const mode = sub.modes.find(x => x.id === modeId) || sub.modes[0];
  main.innerHTML = `<div class="card"><h2>${esc(sub.name)} — computer test</h2>
    <div class="rules small">${esc(sub.mc.rules)}</div>
    ${sub.modes.length > 1 ? `<div class="field"><label>Test type</label><div class="modes">${sub.modes.map(md => `<button class="mode ${md.id === mode.id ? 'on' : ''}" data-m="${md.id}"><b>${esc(md.name)}</b><span class="small muted">${esc(md.desc)}</span></button>`).join('')}</div></div>` : ''}
    <div class="field"><label>Difficulty</label>${seg('diff', DIFFS, diff, DIFFS.map(d => d === 'random' ? 'Random' : d))}
      <div class="small muted" style="margin-top:6px">Random mixes levels like a real exam. 1 = basic, 6 = hardest.</div></div>
    <div class="field"><label><input type="checkbox" id="timerOn" ${timer ? 'checked' : ''}> Countdown timer (${sub.mc.minutes} min, auto-submit at 0)</label></div>
    <div class="row" style="margin-top:14px"><button class="btn primary big" id="go">Generate test</button></div></div>`;
  $$('.mode', main).forEach(b => b.onclick = () => { setPref('mode', b.dataset.m); render(); });
  bindSeg(main, 'diff', v => setPref('diff', v));
  $('#timerOn').onchange = e => setPref('timer', e.target.checked);
  $('#go').onclick = () => {
    const btn = $('#go'); btn.disabled = true; btn.textContent = 'Generating…';
    setTimeout(() => {
      let qs; try { qs = generateFromLayout(sub, mode.layout, pref('diff', 'random')); } catch (e) { btn.disabled = false; btn.textContent = 'Generate test'; toast('Generation error: ' + e.message); return; }
      ST.sess[k] = { id: uid(), kind: 'test', subject: sub.id, mode: mode.name, diff: pref('diff', 'random'), questions: qs, answers: qs.map(() => null), flags: qs.map(() => false), cur: 0, start: Date.now(), limit: pref('timer', true) ? sub.mc.minutes * 60 : null, scoring: sub.mc };
      render();
    }, 20);
  };
}

function examView(main, S) {
  const n = S.questions.length;
  const q = S.questions[S.cur], a = S.answers[S.cur];
  const revealed = S.instant && a != null;
  main.innerHTML = `<div class="exam">
    <div class="card">
      <div class="qhead"><div><b>Question ${S.cur + 1}</b> <span class="muted">of ${n}</span>${S.kind === 'practice' ? ` <span class="badge">${esc(q.topicName || '')}</span> <span class="badge bl">L${q.level}</span>` : ''}</div>
        <button class="linkbtn small" id="flag">${S.flags[S.cur] ? '⚑ Flagged' : '⚐ Flag question'}</button></div>
      <div class="qtext">${rich(q.q)}</div>
      <div class="opts">${q.opts.map((o, i) => `<button class="opt ${a === i ? 'sel' : ''} ${revealed ? (i === q.ans ? 'right' : (a === i ? 'wrong' : '')) : ''}" data-i="${i}"><span class="lt">${LETTERS[i]}.</span><span class="body">${rich(o)}</span></button>`).join('')}</div>
      ${!revealed && a != null ? '<div style="margin-top:8px"><button class="linkbtn small" id="clear">Clear my choice</button></div>' : ''}
      ${revealed ? `<div class="sol"><b>${a === q.ans ? '✓ Correct.' : '✗ Not correct.'}</b> ${rich(q.sol)}</div>` : ''}
      <div class="row" style="justify-content:space-between;margin-top:16px">
        <button class="btn" id="prev" ${S.cur === 0 ? 'disabled' : ''}>← Previous</button>
        ${S.cur < n - 1 ? '<button class="btn primary" id="next">Next →</button>' : '<button class="btn primary" id="fin2">Finish attempt</button>'}
      </div>
    </div>
    <aside class="side card">
      ${S.limit ? `<div class="timer" id="timer">${fmtTime(S.limit - (Date.now() - S.start) / 1000)}</div>` : `<div class="timer calm" id="timer">${fmtTime((Date.now() - S.start) / 1000)}</div>`}
      <div class="small muted" style="margin-top:4px;text-align:center">${S.limit ? 'time left' : 'time elapsed'}</div>
      <div class="navgrid">${S.questions.map((qq, i) => `<button class="navb ${S.answers[i] != null ? 'done' : ''} ${i === S.cur ? 'cur' : ''} ${S.flags[i] ? 'flag' : ''} ${S.instant && S.answers[i] != null ? (S.answers[i] === qq.ans ? 'ok' : 'ko') : ''}" data-n="${i}">${i + 1}</button>`).join('')}</div>
      <div class="small muted">${S.answers.filter(x => x != null).length} of ${n} answered</div>
      <button class="btn" style="width:100%;margin-top:10px" id="sheet">${SUB().id === 'chem' ? 'Tables and constants' : (FORMULA_TAB[SUB().id] || 'Formulas')}</button>
      <button class="btn primary" style="width:100%;margin-top:10px" id="fin">Finish attempt…</button>
      <button class="btn danger" style="width:100%;margin-top:8px" id="abandon">Abandon</button>
    </aside></div>`;
  const go = i => { S.cur = i; render(); };
  $$('.opt', main).forEach(b => b.onclick = () => { if (revealed) return; const i = Number(b.dataset.i); S.answers[S.cur] = S.answers[S.cur] === i && !S.instant ? null : i; render(); });
  $$('.navb', main).forEach(b => b.onclick = () => go(Number(b.dataset.n)));
  const cl = $('#clear'); if (cl) cl.onclick = () => { S.answers[S.cur] = null; render(); };
  $('#flag').onclick = () => { S.flags[S.cur] = !S.flags[S.cur]; render(); };
  const pv = $('#prev'); if (pv) pv.onclick = () => go(S.cur - 1);
  const nx = $('#next'); if (nx) nx.onclick = () => go(S.cur + 1);
  const finish = () => { const blank = S.answers.filter(x => x == null).length; if (blank && !confirm(`${blank} question(s) not answered. Finish anyway?`)) return; finishMC(S); };
  $('#fin').onclick = finish; const f2 = $('#fin2'); if (f2) f2.onclick = finish;
  // During a test: what the exam provides (chemistry: tables + constants), otherwise the formula sheet.
  $('#sheet').onclick = () => { const h = sheetHtml((window.EXAM_SHEETS || {})[S.subject] || (window.FORMULAS || {})[S.subject]); const m = openModal('<div class="formula">' + (h || 'No formula sheet.') + '</div><div style="text-align:right;margin-top:10px"><button class="btn" onclick="this.closest(\'.modal\').remove()">Close</button></div>'); bindJumps(m); };
  $('#abandon').onclick = () => { if (confirm('Abandon this attempt? It will not be saved.')) { delete ST.sess[key()]; render(); } };
  ST.tick = setInterval(() => {
    const el = $('#timer'); if (!el) return clearInterval(ST.tick);
    const el2 = (Date.now() - S.start) / 1000;
    if (S.limit) { const left = S.limit - el2; el.textContent = fmtTime(left); if (left <= 0) { clearInterval(ST.tick); toast('Time is up — test submitted.'); finishMC(S); } }
    else el.textContent = fmtTime(el2);
  }, 1000);
  document.onkeydown = e => {
    if (ST.tab !== 'test' && ST.tab !== 'practice') return; if (!$('.opts')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' && S.cur < n - 1) go(S.cur + 1); else if (e.key === 'ArrowLeft' && S.cur > 0) go(S.cur - 1);
    else { const i = '12345'.indexOf(e.key); if (i >= 0 && i < q.opts.length && !revealed) { S.answers[S.cur] = i; render(); } }
  };
}
function scoreMC(S) {
  const sc = S.scoring; let right = 0, wrong = 0, blank = 0;
  S.questions.forEach((q, i) => { const a = S.answers[i]; if (a == null) blank++; else if (a === q.ans) right++; else wrong++; });
  if (S.kind === 'practice') return { right, wrong, blank, score: right, max: S.questions.length, passed: null };
  const score = Math.round((right * sc.right + wrong * sc.wrong + blank * sc.blank) * 100) / 100;
  return { right, wrong, blank, score, max: sc.max, passed: score >= sc.pass };
}
function finishMC(S) {
  clearInterval(ST.tick); S.finished = true;
  const r = scoreMC(S);
  const entry = { id: S.id, subject: S.subject, kind: S.kind, mode: S.mode, diff: S.diff, date: new Date().toISOString(), dur: Math.round((Date.now() - S.start) / 1000), ...r,
    items: S.questions.map((q, i) => ({ q: q.q, opts: q.opts, ans: q.ans, sol: q.sol, topic: q.topic, topicName: q.topicName, level: q.level, chosen: S.answers[i] })) };
  history.add(entry);
  const k = S.subject + ':' + (S.kind === 'practice' ? 'practice' : 'test');
  delete ST.sess[k]; ST.results[k] = entry;
  if (ST.subject === S.subject) render();
}
function resultsView(main, e, onNew, fromHistory) {
  const sub = SUBJECTS.find(s => s.id === e.subject) || SUB();
  const isPractice = e.kind === 'practice';
  const verdict = isPractice ? '' : `<div class="verdict ${e.passed ? 'ok' : 'ko'}">${e.passed ? (sub.id === 'chem' ? 'PASSED — admitted to the written test' : 'PASSED') : 'NOT PASSED'}</div>`;
  const pct = Math.round(100 * e.right / e.items.length);
  main.innerHTML = `<div class="card">
    <div class="row" style="justify-content:space-between"><h2>${esc(sub.name)} — ${esc(isPractice ? 'practice: ' + e.mode : e.mode)}</h2><span class="muted small">${fmtDate(e.date)} · ${diffLabel(e.diff)} · ${fmtTime(e.dur)}</span></div>
    <div class="score" style="margin-top:10px"><div class="big">${isPractice ? `${e.right} / ${e.items.length}` : `${fmtNum(e.score)} / ${fmtNum(e.max)}`}</div>${verdict}
      <div class="small"><span class="badge ok">${e.right} correct</span> <span class="badge ko">${e.wrong} wrong</span> <span class="badge bl">${e.blank} blank</span> <span class="muted">(${pct}%)</span>${!isPractice ? `<div class="muted" style="margin-top:4px">Pass mark: ${fmtNum(sub.mc.pass)} / ${fmtNum(sub.mc.max)}</div>` : ''}</div></div>
    <div class="row" style="margin-top:14px"><button class="btn primary" id="again">${fromHistory ? '← Back to history' : 'New ' + (isPractice ? 'practice' : 'test')}</button>
      <button class="btn" id="onlyWrong">Show only mistakes</button><button class="btn" id="showAll">Show all</button></div></div>
  <div id="items"></div>`;
  const draw = onlyWrong => {
    $('#items').innerHTML = e.items.map((q, i) => {
      const st = q.chosen == null ? 'bl' : q.chosen === q.ans ? 'ok' : 'ko';
      if (onlyWrong && st === 'ok') return '';
      return `<div class="card"><div class="qhead"><div><b>Question ${i + 1}</b> <span class="badge ${st}">${st === 'ok' ? 'correct' : st === 'ko' ? 'wrong' : 'not answered'}</span></div><span class="small muted">${esc(q.topicName || '')} · L${q.level}</span></div>
        <div class="qtext">${rich(q.q)}</div>
        <div class="opts">${q.opts.map((o, j) => `<div class="opt ${j === q.ans ? 'right' : (j === q.chosen ? 'wrong' : '')}"><span class="lt">${LETTERS[j]}.</span><span class="body">${rich(o)}</span>${j === q.ans ? '<span class="small" style="color:var(--ok)">✓ correct</span>' : j === q.chosen ? '<span class="small" style="color:var(--bad)">your answer</span>' : ''}</div>`).join('')}</div>
        <div class="sol"><b>Solution.</b> ${rich(q.sol)}</div></div>`;
    }).join('') || '<div class="card">No mistakes — well done!</div>';
  };
  draw(false);
  $('#again').onclick = onNew; $('#onlyWrong').onclick = () => draw(true); $('#showAll').onclick = () => draw(false);
}

/* ======================= PRACTICE ======================= */
function viewPractice(main) {
  const sub = SUB(), k = key();
  if (ST.sess[k] && !ST.sess[k].finished) return examView(main, ST.sess[k]);
  if (ST.results[k]) return resultsView(main, ST.results[k], () => { delete ST.results[k]; render(); });
  const topic = pref('ptopic', 'mixed'), n = pref('pn', '10'), diff = pref('pdiff', 'random'), instant = pref('instant', true);
  main.innerHTML = drillCard(sub) + `<div class="card"><h2>${esc(sub.name)} — practice by topic</h2>
    <p class="muted small" style="margin-top:0">No timer pressure. Pick a topic to drill, and see the solution right after each answer.</p>
    <div class="field"><label>Topic</label><select id="ptopic"><option value="mixed">All topics (mixed)</option>${sub.engine.TOPICS.map(t => `<option value="${t.id}" ${t.id === topic ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Number of questions</label>${seg('pn', ['5', '10', '15', '20'], n)}</div>
    <div class="field"><label>Difficulty</label>${seg('pdiff', DIFFS, diff, DIFFS.map(d => d === 'random' ? 'Random' : d))}</div>
    <div class="field"><label><input type="checkbox" id="instant" ${instant ? 'checked' : ''}> Show the answer and solution right after each question</label></div>
    <div class="row" style="margin-top:14px"><button class="btn primary big" id="go">Start practice</button></div></div>`;
  $('#ptopic').onchange = e => setPref('ptopic', e.target.value);
  bindSeg(main, 'pn', v => setPref('pn', v)); bindSeg(main, 'pdiff', v => setPref('pdiff', v));
  $('#instant').onchange = e => setPref('instant', e.target.checked);
  $('#go').onclick = () => {
    const t = pref('ptopic', 'mixed'), cnt = Number(pref('pn', '10')), d = pref('pdiff', 'random');
    const ids = t === 'mixed' ? sub.engine.TOPICS.map(x => x.id) : [t];
    const used = new Set(); const qs = [];
    try { for (let i = 0; i < cnt; i++) { const id = ids[Math.floor(Math.random() * ids.length)]; const q = sub.engine.generate(id, levelFor(d), used); if (q.thId != null) used.add(q.thId); qs.push(q); } } catch (e) { toast('Generation error: ' + e.message); return; }
    const tn = t === 'mixed' ? 'all topics' : (sub.engine.TOPICS.find(x => x.id === t) || {}).name;
    ST.sess[k] = { id: uid(), kind: 'practice', subject: sub.id, mode: tn, diff: d, questions: qs, answers: qs.map(() => null), flags: qs.map(() => false), cur: 0, start: Date.now(), limit: null, instant: pref('instant', true), scoring: sub.mc };
    render();
  };
  bindDrills(main, sub);
}

/* ======================= DRILLS FROM HISTORY ======================= */
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Questions answered wrong or left blank in tests and practice, newest first. Answering the same question
// right later (for example in "Redo my mistakes") takes it off the list.
function mistakesFor(subId) {
  const miss = new Map();
  history.all().filter(x => x.subject === subId && Array.isArray(x.items)).sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach(x => x.items.forEach(it => {
      if (!it || typeof it.q !== 'string' || !Array.isArray(it.opts) || it.ans == null) return;
      const k = it.q + '\u0001' + it.opts.join('\u0001');
      miss.delete(k); if (it.chosen !== it.ans) miss.set(k, it);
    }));
  return Array.from(miss.values()).reverse();
}
// Up to 3 topics with the lowest accuracy over their last 20 answers (smoothed, so 0/1 does not outweigh 3/10).
function weakTopicsFor(sub) {
  const byName = new Map(sub.engine.TOPICS.map(t => [t.name, t])), acc = {};
  history.all().filter(x => x.subject === sub.id && Array.isArray(x.items)).sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach(x => x.items.forEach(it => {
      const t = it && byName.get(it.topicName); if (!t) return;
      const a = acc[t.id] = acc[t.id] || { t, c: 0, n: 0 }; if (a.n >= 20) return;
      a.n++; if (it.chosen === it.ans) a.c++;
    }));
  const ranked = Object.values(acc).map(a => ({ ...a, p: a.c / a.n, s: (a.c + 1) / (a.n + 2) })).sort((a, b) => a.s - b.s || b.n - a.n);
  const weak = ranked.filter(a => a.p < 0.8);
  return (weak.length ? weak : ranked).slice(0, 3);
}
function drillCard(sub, where = 'below') {
  const miss = mistakesFor(sub.id), weak = weakTopicsFor(sub);
  return `<div class="card"><h3 style="margin-top:0">From your history</h3><div class="modes">
    <button class="mode" data-drill="miss" ${miss.length ? '' : 'disabled'}><b>Redo my mistakes${miss.length ? ` (${miss.length})` : ''}</b><span class="small muted">${miss.length ? 'Questions you got wrong or left blank, newest first. Answer one right and it leaves the list.' : 'No mistakes saved for this subject yet.'}</span></button>
    <button class="mode" data-drill="weak" ${weak.length ? '' : 'disabled'}><b>Practice my weakest topics</b><span class="small muted">${weak.length ? 'New questions on: ' + weak.map(a => `${esc(a.t.name)} (${Math.round(100 * a.p)}%)`).join(', ') : 'Take a test or a practice first.'}</span></button>
  </div><div class="small muted" style="margin-top:8px">Uses the number of questions, difficulty and “show the answer” settings ${where}.</div></div>`;
}
function bindDrills(main, sub) { $$('[data-drill]', main).forEach(b => b.onclick = () => startDrill(sub, b.dataset.drill)); }
function startDrill(sub, what) {
  const k = sub.id + ':practice', cnt = Number(pref('pn', '10')), d = pref('pdiff', 'random');
  if (ST.sess[k] && !ST.sess[k].finished && !confirm('A practice is in progress. Replace it?')) return;
  let qs = [], name;
  if (what === 'miss') {
    qs = shuffle(mistakesFor(sub.id).slice(0, cnt).map(it => ({ q: it.q, opts: it.opts.slice(), ans: it.ans, sol: it.sol, topic: it.topic, topicName: it.topicName, level: it.level })));
    name = 'my mistakes';
  } else {
    const weak = weakTopicsFor(sub), used = new Set();
    try { for (let i = 0; i < cnt; i++) { const q = sub.engine.generate(weak[i % weak.length].t.id, levelFor(d), used); if (q.thId != null) used.add(q.thId); qs.push(q); } } catch (e) { toast('Generation error: ' + e.message); return; }
    shuffle(qs); name = 'weakest topics (' + weak.map(a => a.t.name).join(', ') + ')';
  }
  if (!qs.length) { toast('Nothing to practice yet.'); return; }
  delete ST.results[k];
  ST.sess[k] = { id: uid(), kind: 'practice', subject: sub.id, mode: name, diff: what === 'miss' ? 'random' : d, questions: qs, answers: qs.map(() => null), flags: qs.map(() => false), cur: 0, start: Date.now(), limit: null, instant: pref('instant', true), scoring: sub.mc };
  ST.tab = 'practice'; ST.review = null; render();
}

/* ======================= WRITTEN EXAM ======================= */
function viewWritten(main) {
  const sub = SUB(), k = key();
  const W = ST.sess[k];
  if (W) return writtenView(main, W);
  const diff = pref('wdiff', 'random'), timer = pref('wtimer', true);
  const modes = sub.written.modes || [], wm = modes.find(m => m.id === pref('wmode')) || modes[0] || {};
  const mins = wm.minutes || sub.written.minutes;
  main.innerHTML = `<div class="card"><h2>${esc(sub.name)} — ${esc((sub.writtenTab || 'written exam').toLowerCase())}</h2>
    ${modes.length > 1 ? `<div class="field"><label>Type</label><div class="modes">${modes.map(md => `<button class="mode ${md.id === wm.id ? 'on' : ''}" data-wm="${md.id}"><b>${esc(md.name)}</b><span class="small muted">${esc(md.desc)}</span></button>`).join('')}</div></div>` : ''}
    <div class="rules small">${esc(wm.rules || sub.written.rules)}</div>
    <p class="small muted">Solve it on paper, then upload photos (or a PDF${sub.id === 'cs' ? ' / your .py file' : ''}) of your work. When you finish, the program shows the full solution next to your pages and you give yourself points part by part. Use <b>Copy for Claude</b> to get your photos graded in a Claude chat.</p>
    <div class="field"><label>Difficulty</label>${seg('wdiff', DIFFS, diff, DIFFS.map(d => d === 'random' ? 'Random' : d))}</div>
    <div class="field"><label><input type="checkbox" id="wtimer" ${timer ? 'checked' : ''}> Countdown timer (${mins} min)</label></div>
    <div class="row" style="margin-top:14px"><button class="btn primary big" id="go">Generate ${esc(wm.name ? wm.name.toLowerCase() : 'written exam')}</button></div></div>`;
  $$('[data-wm]', main).forEach(b => b.onclick = () => { setPref('wmode', b.dataset.wm); render(); });
  bindSeg(main, 'wdiff', v => setPref('wdiff', v));
  $('#wtimer').onchange = e => setPref('wtimer', e.target.checked);
  $('#go').onclick = () => {
    let exam; try { exam = window.Written[sub.id](levelFor(pref('wdiff', 'random')), wm.id); } catch (e) { toast('Generation error: ' + e.message); console.error(e); return; }
    if (wm.rules) exam.rules = wm.rules;
    ST.sess[k] = { id: uid(), kind: 'written', subject: sub.id, mode: wm.name, diff: pref('wdiff', 'random'), exam, files: [], grades: {}, start: Date.now(), limit: pref('wtimer', true) ? mins * 60 : null, finished: false };
    render();
  };
}
function partKey(ei, pi) { return ei + '.' + pi; }
// Sum of the self-assigned points; exercises marked bonus are counted apart, `only` limits it to one exercise.
function writtenTotals(W, bonus = false, only = null) {
  let s = 0;
  for (const [k, v] of Object.entries(W.grades)) {
    const ei = Number(k.split('.')[0]), e = W.exam.exercises[ei] || {};
    if (!!e.bonus === bonus && (only == null || only === ei)) s += Number(v) || 0;
  }
  return Math.round(s * 100) / 100;
}
// Score and verdict. exam.gate = { ex, min, why }: below `min` points in exercise `ex` the exam is not passed.
function writtenResult(W) {
  const ex = W.exam, total = writtenTotals(W), bonus = writtenTotals(W, true);
  const gated = ex.gate && writtenTotals(W, false, ex.gate.ex) < ex.gate.min;
  const passed = !gated && total >= ex.pass;
  const bmax = ex.exercises.filter(e => e.bonus).reduce((a, e) => a + e.points, 0);
  return { total, bonus, passed, label: passed ? (ex.passText || 'PASSED') : (ex.failText || 'NOT PASSED'),
    note: [gated ? ex.gate.why : '', bmax ? `Bonus: ${fmtNum(bonus)} / ${bmax}` : ''].filter(Boolean).join(' · ') };
}
function writtenView(main, W, fromHistory) {
  const sub = SUBJECTS.find(s => s.id === W.subject) || SUB(); const ex = W.exam;
  const done = W.finished;
  const res = writtenResult(W), total = res.total;
  main.innerHTML = `<div class="card">
      <div class="row" style="justify-content:space-between"><h2>${esc(ex.title)}</h2>
        ${!done ? (W.limit ? `<div class="timer" id="wt">${fmtTime(W.limit - (Date.now() - W.start) / 1000)}</div>` : `<div class="timer calm" id="wt">${fmtTime((Date.now() - W.start) / 1000)}</div>`) : `<span class="muted small">${fmtDate(W.date || new Date().toISOString())} · ${diffLabel(W.diff)}</span>`}</div>
      <div class="small muted">${esc(ex.rules || sub.written.rules)}</div>
      ${done ? `<div class="score" style="margin-top:12px"><div class="big" id="wtotal">${fmtNum(total)} / ${ex.max}</div><div class="verdict ${res.passed ? 'ok' : 'ko'}" id="wverdict">${res.label}</div><div class="small" id="wnote" style="color:var(--warn)">${esc(res.note)}</div><div class="small muted">Self-assessed: enter your points for each part below. Pass mark ${ex.pass}/${ex.max}.</div></div>` : ''}
    </div>
    <div class="card">${ex.exercises.map((e, ei) => `<div class="ex"><h3>${esc(e.title)} <span class="badge">${e.points} pts</span></h3>
      ${e.intro ? `<div class="pq">${rich(e.intro)}</div>` : ''}
      ${Array.isArray(e.files) ? `<div class="row noprint" style="gap:6px;margin:0 0 10px">${e.files.map((f, fi) => `<button class="btn small" data-dlf="${ei}.${fi}">Download ${esc(f.name)}</button>`).join('')}</div>` : ''}
      ${e.parts.map((p, pi) => `<div class="part"><div class="pq"><b>(${LETTERS[pi]})</b> ${rich(p.q)} <span class="small muted">[${p.pts} pt${p.pts === 1 ? '' : 's'}]</span></div>
        ${done ? `<div class="sol">${rich(p.sol)}</div><div class="grade"><label>Your points:</label><input type="number" min="0" max="${p.pts}" step="0.5" data-g="${partKey(ei, pi)}" value="${W.grades[partKey(ei, pi)] ?? ''}"> <span class="muted">/ ${p.pts}</span>
          <button class="linkbtn small" data-full="${partKey(ei, pi)}" data-max="${p.pts}">full</button> <button class="linkbtn small" data-zero="${partKey(ei, pi)}">zero</button></div>` : ''}
      </div>`).join('')}
      ${done && e.extraSol ? `<div class="sol">${rich(e.extraSol)}</div>` : ''}</div>`).join('')}</div>
    <div class="card"><h3>Your answers</h3>
      <div class="drop" id="drop">Click or drop photos / PDF${sub.id === 'cs' ? ' / .py files' : ''} of your solution here</div>
      <input type="file" id="file" multiple accept="image/*,application/pdf,.py,.txt" class="hidden">
      <div class="thumbs" id="thumbs"></div></div>
    <div class="card row">
      ${!done ? `<button class="btn primary big" id="finish">Finish &amp; show solutions</button><button class="btn danger" id="discard">Discard</button>` :
        `<button class="btn primary" id="claude">Copy for Claude (grading prompt)</button><button class="btn" id="back">${fromHistory ? '← Back to history' : 'New written exam'}</button>`}
    </div>`;
  drawThumbs(W);
  $$('[data-dlf]', main).forEach(b => b.onclick = () => {
    const [a, c] = b.dataset.dlf.split('.').map(Number), f = ex.exercises[a].files[c];
    const url = URL.createObjectURL(new Blob([String(f.text)], { type: 'text/plain' })), l = document.createElement('a');
    l.href = url; l.download = String(f.name); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
  const drop = $('#drop'), fi = $('#file');
  drop.onclick = () => fi.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); addFiles(W, e.dataTransfer.files); };
  fi.onchange = () => { addFiles(W, fi.files); fi.value = ''; };
  if (!done) {
    $('#finish').onclick = () => { if (!confirm('Finish the exam and show the solutions?')) return; W.finished = true; W.date = new Date().toISOString(); W.dur = Math.round((Date.now() - W.start) / 1000); saveWritten(W, true); render(); };
    $('#discard').onclick = () => { if (confirm('Discard this written exam? Nothing will be saved.')) { delete ST.sess[key()]; render(); } };
    ST.tick = setInterval(() => { const el = $('#wt'); if (!el) return clearInterval(ST.tick); const t = (Date.now() - W.start) / 1000; if (W.limit) { el.textContent = fmtTime(W.limit - t); if (W.limit - t <= 0) { el.textContent = 'Time is up'; clearInterval(ST.tick); } } else el.textContent = fmtTime(t); }, 1000);
  } else {
    const upd = () => { const r = writtenResult(W); $('#wtotal').textContent = `${fmtNum(r.total)} / ${ex.max}`; const v = $('#wverdict'); v.className = 'verdict ' + (r.passed ? 'ok' : 'ko'); v.textContent = r.label; $('#wnote').textContent = r.note; saveWritten(W, false); };
    $$('[data-g]', main).forEach(inp => inp.oninput = () => { let v = inp.value === '' ? null : Math.max(0, Math.min(Number(inp.max), Number(inp.value))); if (v == null) delete W.grades[inp.dataset.g]; else W.grades[inp.dataset.g] = v; upd(); });
    $$('[data-full]', main).forEach(b => b.onclick = () => { const inp = $(`[data-g="${b.dataset.full}"]`); inp.value = b.dataset.max; inp.oninput(); });
    $$('[data-zero]', main).forEach(b => b.onclick = () => { const inp = $(`[data-g="${b.dataset.zero}"]`); inp.value = 0; inp.oninput(); });
    $('#claude').onclick = async () => { const ok = await copyText(claudePrompt(W, sub)); toast(ok ? 'Copied! Paste it in a Claude chat and attach your photos.' : 'Copy failed — your browser blocked the clipboard.'); };
    $('#back').onclick = () => { if (fromHistory) { ST.review = null; render(); } else { delete ST.sess[key()]; render(); } };
  }
}
function claudePrompt(W, sub) {
  const ex = W.exam; const lines = [];
  lines.push(`I am a first-year student at Politecnico di Torino preparing the ${sub.name} written exam. Below is a practice exam (max ${ex.max} points, pass ${ex.pass}) with the official-style solution and the points for each part. I attached photos of my handwritten solution${sub.id === 'cs' ? ' / my code' : ''}.`);
  if (ex.rules) lines.push('Exam rules: ' + ex.rules);
  lines.push('Please grade my work part by part as a strict PoliTo examiner: for each part give the points out of the maximum, point out every mistake, and explain what I should have written. Finish with my total score.');
  lines.push('');
  ex.exercises.forEach((e, ei) => {
    lines.push(`=== ${e.title} (${e.points} points) ===`); if (e.intro) lines.push(htmlToText(e.intro));
    e.parts.forEach((p, pi) => { lines.push(`(${LETTERS[pi]}) [${p.pts} pts] ${htmlToText(p.q)}`); lines.push(`   Official solution: ${htmlToText(p.sol)}`); });
    lines.push('');
  });
  return lines.join('\n');
}
async function addFiles(W, list) {
  for (const f of Array.from(list)) {
    let blob = f, type = f.type || (f.name.endsWith('.py') ? 'text/x-python' : 'application/octet-stream');
    if (f.type.startsWith('image/')) { try { blob = await compressImage(f); type = blob.type || f.type; } catch (e) { blob = f; } }
    W.files.push({ name: f.name, type, blob });
  }
  drawThumbs(W); if (W.finished) saveWritten(W, false);
}
async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const maxD = 1800, s = Math.min(1, maxD / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const b = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85)); return b || file;
  } finally { URL.revokeObjectURL(url); }
}
function drawThumbs(W) {
  const box = $('#thumbs'); if (!box) return;
  (W._urls || []).forEach(u => URL.revokeObjectURL(u)); W._urls = [];
  box.innerHTML = W.files.map((f, i) => { const u = URL.createObjectURL(f.blob); W._urls.push(u);
    const isImg = (f.type || '').startsWith('image/');
    return `<div class="thumb">${isImg ? `<img src="${u}" data-i="${i}" alt="">` : `<a href="${u}" target="_blank" download="${esc(f.name)}"><div class="filechip">${esc((f.name.split('.').pop() || 'file').toUpperCase())}</div></a>`}<div class="nm" title="${esc(f.name)}">${esc(f.name)}</div><button class="x" data-del="${i}" title="Remove">×</button></div>`; }).join('') || '<span class="small muted">No files yet.</span>';
  $$('img[data-i]', box).forEach(im => im.onclick = () => openModal(`<img src="${im.src}" alt="">`));
  $$('[data-del]', box).forEach(b => b.onclick = () => { W.files.splice(Number(b.dataset.del), 1); drawThumbs(W); if (W.finished) saveWritten(W, false); });
}
function openModal(html) { const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="box">${html}</div>`; m.onclick = e => { if (e.target === m) m.remove(); }; document.body.appendChild(m); return m; }
function saveWritten(W, first) {
  const r = writtenResult(W);
  const entry = { id: W.id, subject: W.subject, kind: 'written', mode: W.mode || 'Written exam', diff: W.diff, date: W.date || new Date().toISOString(), dur: W.dur || 0, score: r.total, max: W.exam.max, passed: r.passed, bonus: r.bonus || undefined, graded: Object.keys(W.grades).length, exam: W.exam, grades: W.grades, nfiles: W.files.length };
  if (first) history.add(entry); else history.update(entry);
  IDB.put(W.id, W.files.map(f => ({ name: f.name, type: f.type, blob: f.blob }))).catch(() => toast('Could not store the files in this browser.'));
}

/* ======================= HISTORY ======================= */
function viewHistory(main) {
  if (ST.review) {
    const e = ST.review;
    if (e.kind === 'written') { const W = { id: e.id, subject: e.subject, mode: e.mode, diff: e.diff, exam: e.exam, grades: { ...(e.grades || {}) }, files: [], finished: true, date: e.date, dur: e.dur }; writtenView(main, W, true); IDB.get(e.id).then(fs => { if (fs && fs.length) { W.files = fs; drawThumbs(W); } }).catch(() => {}); return; }
    return resultsView(main, e, () => { ST.review = null; render(); }, true);
  }
  const sub = SUB(); const filt = pref('hfilt', 'all');
  const all = history.all().filter(x => x.subject === sub.id);
  const list = all.filter(x => filt === 'all' || x.kind === filt);
  const tests = all.filter(x => x.kind === 'test');
  const avg = tests.length ? Math.round(100 * tests.reduce((s, x) => s + Math.max(0, x.score) / x.max, 0) / tests.length) : null;
  const best = tests.length ? Math.max(...tests.map(x => x.score)) : null;
  const passRate = tests.length ? Math.round(100 * tests.filter(x => x.passed).length / tests.length) : null;
  const writtens = all.filter(x => x.kind === 'written' && x.graded);
  const topic = {};
  all.filter(x => x.items).forEach(x => x.items.forEach(it => { const t = it.topicName || it.topic; topic[t] = topic[t] || [0, 0]; topic[t][1]++; if (it.chosen === it.ans) topic[t][0]++; }));
  const trows = Object.entries(topic).map(([t, [c, n]]) => [t, c, n, c / n]).sort((a, b) => a[3] - b[3]);
  const cloudHint = window.Cloud && Cloud.enabled && !Cloud.user ? `<div class="rules small">You are not signed in: this history is saved only in this browser. <button class="linkbtn" id="hintSignIn">Sign in or create an account</button> to keep it in your account and see it on any device.</div>` : (window.Cloud && Cloud.user ? `<div class="small muted" style="margin-bottom:8px">Saved in your account (${esc(Cloud.user.email)}). Uploaded photos stay on the device where you added them.</div>` : '');
  const wPass = writtens.length ? Math.round(100 * writtens.filter(x => x.passed).length / writtens.length) : null;
  const statsHtml = sub.hasTest === false
    ? `<div class="stats"><div class="stat"><span class="small muted">${esc(sub.writtenTab || 'Written')}s graded</span><b>${writtens.length}</b></div>
        <div class="stat"><span class="small muted">Passed</span><b>${wPass == null ? '–' : wPass + '%'}</b></div>
        <div class="stat"><span class="small muted">Practice sessions</span><b>${all.filter(x => x.kind === 'practice').length}</b></div></div>` : '';
  main.innerHTML = `<div class="card"><h2>${esc(sub.name)} — history</h2>${cloudHint}
      ${statsHtml || `<div class="stats"><div class="stat"><span class="small muted">Computer tests</span><b>${tests.length}</b></div>
        <div class="stat"><span class="small muted">Average score</span><b>${avg == null ? '–' : avg + '%'}</b></div>
        <div class="stat"><span class="small muted">Best score</span><b>${best == null ? '–' : fmtNum(best) + ' / ' + sub.mc.max}</b></div>
        <div class="stat"><span class="small muted">Tests passed</span><b>${passRate == null ? '–' : passRate + '%'}</b></div>
        <div class="stat"><span class="small muted">Written exams graded</span><b>${writtens.length}</b></div></div>`}
      ${trows.length ? `<h3>Accuracy by topic <span class="small muted">(weakest first, from tests and practice)</span></h3><div class="bars">${trows.map(([t, c, n, p]) => `<div class="barrow"><span>${esc(t)}</span><div class="track"><div class="fill" style="width:${Math.round(p * 100)}%;background:${p < .5 ? 'var(--bad)' : p < .75 ? 'var(--warn)' : 'var(--ok)'}"></div></div><span class="small">${c}/${n}</span></div>`).join('')}</div>` : ''}
    </div>
    ${trows.length ? drillCard(sub, 'from the Practice tab') : ''}
    <div class="card"><div class="row" style="justify-content:space-between"><div>${sub.hasTest === false ? seg('hfilt', ['all', 'practice', 'written'], filt, ['All', 'Practice', sub.writtenTab || 'Written']) : seg('hfilt', ['all', 'test', 'practice', 'written'], filt, ['All', 'Computer tests', 'Practice', 'Written'])}</div>
      ${all.length ? '<button class="btn danger" id="clearAll">Delete all for this subject</button>' : ''}</div>
      <div class="tablewrap" style="margin-top:12px">${list.length ? `<table><thead><tr><th>Date</th><th>Type</th><th>Difficulty</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>
      ${list.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.kind === 'written' ? (x.mode || 'Written exam') + (x.bonus ? ` (+${fmtNum(x.bonus)} bonus)` : '') : x.kind === 'practice' ? 'Practice · ' + x.mode : x.mode)}</td><td>${diffLabel(x.diff)}</td>
        <td>${x.kind === 'practice' ? `${x.right}/${x.items.length}` : x.kind === 'written' && !x.graded ? '<span class="muted">not graded</span>' : `${fmtNum(x.score)} / ${fmtNum(x.max)}`}</td>
        <td>${x.passed == null ? '' : x.kind === 'written' && !x.graded ? '' : `<span class="badge ${x.passed ? 'ok' : 'ko'}">${x.passed ? 'passed' : 'not passed'}</span>`}</td>
        <td style="white-space:nowrap"><button class="btn" data-open="${x.id}">Review</button> <button class="btn danger" data-del="${x.id}" title="Delete">×</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nothing here yet. Take a test and it will appear here automatically.</p>'}</div></div>
    <div class="card"><h3 style="margin-top:0">Move or back up your history</h3>
      <p class="small muted">${!(window.Cloud && Cloud.enabled)
        ? 'Export saves your history for <b>all subjects</b> to a file. To move it to the website, sign in there, open History and use <b>Import from a file</b>. Photos of written answers stay on this computer.'
        : (Cloud.user ? 'Import adds a file exported from the Desktop app (or from another browser) to your account. Export saves your history for all subjects to a file. Photos of written answers are not included.'
          : 'Import adds a file exported from the Desktop app to this browser. Sign in first if you want it saved in your account. Photos of written answers are not included.')}</p>
      <div class="row"><button class="btn" id="hExport">Export history to a file</button><button class="btn" id="hImport">Import from a file</button></div></div>`;
  $('#hExport').onclick = exportHistory; $('#hImport').onclick = importHistory; bindDrills(main, sub);
  bindSeg(main, 'hfilt', v => { setPref('hfilt', v); render(); });
  const hs = $('#hintSignIn'); if (hs) hs.onclick = () => openAuth('signin');
  $$('[data-open]', main).forEach(b => b.onclick = () => { ST.review = history.all().find(x => x.id === b.dataset.open); render(); });
  $$('[data-del]', main).forEach(b => b.onclick = () => { if (confirm('Delete this entry?')) { history.remove(b.dataset.del); render(); } });
  const ca = $('#clearAll'); if (ca) ca.onclick = () => { if (confirm(`Delete ALL ${sub.name} history? This cannot be undone.`)) { all.forEach(x => history.remove(x.id)); render(); } };
}

/* ======================= MATERIALS & FORMULA SHEETS ======================= */
function viewMaterials(main) {
  const sub = SUB(); const M = (window.MATERIALS || {})[sub.id] || [];
  const groups = {}; M.forEach(x => { (groups[x.group] = groups[x.group] || []).push(x); });
  main.innerHTML = `<div class="card"><h2>${esc(sub.name)} — materials</h2><p class="small muted">Files stored in the program folder. They open in a new browser tab.</p>
    ${Object.keys(groups).length ? Object.entries(groups).map(([g, xs]) => `<h3 style="margin-top:14px">${esc(g)}</h3><ul>${xs.map(x => `<li><a href="${encodeURI(x.file)}" target="_blank">${esc(x.title)}</a></li>`).join('')}</ul>`).join('') : '<p class="muted">No materials for this subject yet.</p>'}</div>`;
}
const sheetHtml = h => (h ? rich(typeof h === 'function' ? h() : h) : '');
// The buttons at the top of a formula sheet scroll to its sections.
function bindJumps(root) { $$('[data-jump]', root).forEach(b => b.onclick = () => { const t = root.querySelector('#' + b.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
function viewFormula(main) {
  const h = sheetHtml((window.FORMULAS || {})[SUB().id]);
  main.innerHTML = `<div class="card formula">${h || '<p class="muted">No formula sheet for this subject.</p>'}</div>`;
  bindJumps(main);
}
function viewGuide(main) {
  const g = guideOf(SUB().id), parts = g.parts, cur = parts.find(x => x.id === pref('gpart')) || parts[0];
  main.innerHTML = `<div class="card formula guide"><div class="row noprint" style="justify-content:space-between;gap:8px;flex-wrap:wrap">${parts.length > 1 ? seg('gpart', parts.map(x => x.id), cur.id, parts.map(x => esc(x.name))) : '<span></span>'}
      <div class="row" style="gap:8px">${/<details/.test(cur.html) ? '<button class="btn" id="gOpen">Show all solutions</button>' : ''}<button class="btn primary" id="gPrint">Print / save as PDF</button></div></div>${rich(cur.html)}</div>`;
  bindJumps(main);
  bindSeg(main, 'gpart', v => { setPref('gpart', v); render(); });
  const all = () => $$('details', main), op = $('#gOpen', main);
  if (op) op.onclick = () => { const open = all().some(d => !d.open); all().forEach(d => { d.open = open; }); op.textContent = open ? 'Hide all solutions' : 'Show all solutions'; };
  $('#gPrint').onclick = () => { all().forEach(d => { d.open = true; }); window.print(); };
}
function viewTables(main) {
  main.innerHTML = `<div class="card formula">${sheetHtml((window.TABLES || {})[SUB().id]) || '<p class="muted">No tables for this subject.</p>'}</div>`;
}

/* ======================= EXPORT / IMPORT HISTORY ======================= */
// Moves history between the Desktop copy, other browsers and the online account through a .json file.
const EXPORT_APP = 'polito-exam-trainer';
function exportHistory() {
  const entries = history.all();
  if (!entries.length) { toast('There is no history to export yet.'); return; }
  const data = JSON.stringify({ app: EXPORT_APP, version: 1, exported: new Date().toISOString(), entries });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = 'polito-exam-history-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(`Exported ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} (all subjects).`);
}
// Imported files are untrusted: history entries are rendered as HTML, so anything that could run code is rejected.
const BAD_TAGS = /^(script|iframe|frame|frameset|object|embed|applet|link|meta|base|form|style|template|noscript|noembed|noframes|xmp|plaintext|textarea|title|portal)$/i;
function unsafeString(s) {
  if (s.indexOf('<') < 0) return false;
  const doc = new DOMParser().parseFromString(s, 'text/html');   // inert: nothing runs or loads
  for (const el of doc.querySelectorAll('*')) {
    if (BAD_TAGS.test(el.localName)) return true;
    for (const at of el.attributes) {
      const n = at.name.toLowerCase(), v = at.value.replace(/[\u0000- ]+/g, '').toLowerCase();
      if (n.startsWith('on') || n === 'srcdoc' || n === 'formaction' || v.includes('javascript:') || v.includes('vbscript:')) return true;
    }
  }
  return false;
}
function unsafeValue(x, depth = 0) {
  if (depth > 12) return true;
  if (typeof x === 'string') return unsafeString(x);
  if (x && typeof x === 'object') return Object.entries(x).some(([k, v]) => unsafeString(k) || unsafeValue(v, depth + 1));
  return false;
}
function cleanEntry(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  if (typeof e.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(e.id)) return null;
  if (!['test', 'practice', 'written'].includes(e.kind) || !SUBJECTS.some(s => s.id === e.subject)) return null;
  if (typeof e.date !== 'string' || isNaN(Date.parse(e.date))) return null;
  if (e.kind === 'written' ? !(e.exam && typeof e.exam === 'object') : !Array.isArray(e.items)) return null;
  if (unsafeValue(e)) return null;
  const c = { ...e, diff: DIFFS.includes(String(e.diff)) ? String(e.diff) : 'random' };
  if (JSON.stringify(c).length > 850000) return null;
  return c;
}
function importHistory() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (f.size > 60e6) { toast('That file is too large to be a history file.'); return; }
    let data; try { data = JSON.parse(await f.text()); } catch (err) { toast('This is not a history file (it could not be read).'); return; }
    const raw = Array.isArray(data) ? data : (data && data.app === EXPORT_APP && Array.isArray(data.entries) ? data.entries : null);
    if (!raw) { toast('This is not a PoliTo Exam Trainer history file.'); return; }
    const have = new Set(history.all().map(x => x.id)); const todo = []; let dup = 0, bad = 0;
    raw.forEach(e => { const c = cleanEntry(e); if (!c) bad++; else if (have.has(c.id)) dup++; else { have.add(c.id); todo.push(c); } });
    const notes = [dup ? `${dup} already here` : '', bad ? `${bad} skipped because they are damaged or not valid` : ''].filter(Boolean).join(', ');
    if (!todo.length) { openModal(`<h2>Nothing new to import</h2><p>The file has ${raw.length} ${raw.length === 1 ? 'entry' : 'entries'}${notes ? ': ' + esc(notes) : ''}.</p><div class="row" style="margin-top:14px"><button class="btn primary" onclick="this.closest('.modal').remove()">OK</button></div>`); return; }
    const per = {}; todo.forEach(e => { const n = (SUBJECTS.find(s => s.id === e.subject) || {}).name || e.subject; per[n] = (per[n] || 0) + 1; });
    const where = history.cloud ? `your account (${esc(Cloud.user.email)})` : (window.Cloud && Cloud.enabled ? 'this browser only (you are not signed in)' : 'this computer');
    const m = openModal(`<h2>Import ${todo.length} ${todo.length === 1 ? 'entry' : 'entries'}?</h2>
      <p>${Object.entries(per).map(([n, c]) => `${esc(n)}: <b>${c}</b>`).join(' · ')}</p>
      <p>They will be saved in <b>${where}</b>.${notes ? `<br><span class="small muted">Also in the file: ${esc(notes)}.</span>` : ''}</p>
      ${window.Cloud && Cloud.enabled && !history.cloud ? '<p class="small muted">To keep them in your account, close this, sign in first, then import again.</p>' : ''}
      <div class="row" style="margin-top:14px"><button class="btn primary" id="impGo">Import</button><button class="btn" id="impCancel">Cancel</button></div>`);
    $('#impCancel', m).onclick = () => m.remove();
    $('#impGo', m).onclick = async () => {
      const go = $('#impGo', m); go.disabled = true; go.textContent = 'Importing…';
      const fail = await history.addMany(todo); m.remove();
      toast(fail ? `${todo.length - fail} imported, ${fail} could not be saved. Try importing the same file again.` : `${todo.length} ${todo.length === 1 ? 'entry' : 'entries'} imported.`);
      ST.review = null; render();
    };
  };
  inp.click();
}

/* ======================= ACCOUNTS ======================= */
function renderAccount() {
  const box = $('#account'); if (!box) return;
  const C = window.Cloud;
  if (!C || !C.enabled) { box.innerHTML = ''; return; }
  if (C.state !== 'ready') { box.innerHTML = '<span class="small muted">Connecting…</span>'; return; }
  if (!C.user) { box.innerHTML = '<button class="btn primary" id="btnSignIn">Sign in</button>'; $('#btnSignIn').onclick = () => openAuth('signin'); return; }
  box.innerHTML = `<button class="linkbtn small acct-mail" id="btnAcct" title="Your account: ${esc(C.user.email)}">${esc(C.user.email)}</button><button class="btn" id="btnSignOut">Sign out</button>`;
  $('#btnAcct').onclick = openAccount;
  $('#btnSignOut').onclick = () => { if (Object.values(ST.sess).some(s => s && !s.finished) && !confirm('A test is in progress. Sign out anyway?')) return; C.signOut(); };
}
function openAuth(mode) {
  const m = openModal(''); const box = $('.box', m); box.style.maxWidth = '420px';
  const draw = () => {
    const up = mode === 'signup', reset = mode === 'reset';
    box.innerHTML = `<h2>${up ? 'Create an account' : reset ? 'Reset your password' : 'Sign in'}</h2>
      <p class="small muted" style="margin-top:0">${up ? 'Your tests and scores will be saved in your account, on any device.' : reset ? 'We will email you a link to choose a new password.' : 'Welcome back.'}</p>
      ${reset ? '' : `<button class="btn big gbtn" id="authGoogle" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span></button>
      <div class="orline"><span>or with email</span></div>`}
      <form id="authForm" novalidate>
        <div class="field"><label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="email" required class="inp"></div>
        ${reset ? '' : `<div class="field"><label for="authPass">Password${up ? ' (at least 6 characters)' : ''}</label><input id="authPass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" required class="inp"></div>`}
        ${up ? '<div class="field"><label for="authPass2">Repeat password</label><input id="authPass2" type="password" autocomplete="new-password" required class="inp"></div>' : ''}
        <div id="authErr" class="small" style="color:var(--bad);min-height:20px"></div>
        <button class="btn primary big" style="width:100%" id="authGo" type="submit">${up ? 'Create account' : reset ? 'Send reset link' : 'Sign in'}</button>
      </form>
      <div class="small" style="margin-top:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        ${up ? '<button class="linkbtn" data-m="signin">I already have an account</button>' : '<button class="linkbtn" data-m="signup">Create a new account</button>'}
        ${mode === 'signin' ? '<button class="linkbtn" data-m="reset">Forgot password?</button>' : (reset ? '<button class="linkbtn" data-m="signin">Back to sign in</button>' : '')}
      </div>`;
    $$('[data-m]', box).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    const gb = $('#authGoogle', box);
    if (gb) gb.onclick = async () => {
      const err = $('#authErr', box); gb.disabled = true; err.textContent = '';
      try { await Cloud.signInGoogle(); if (Cloud.auth.currentUser) { m.remove(); toast('Signed in with Google.'); } }
      catch (e) { err.style.color = 'var(--bad)'; err.textContent = Cloud.errorText(e); }
      gb.disabled = false;
    };
    const em = $('#authEmail', box); em.focus();
    $('#authForm', box).onsubmit = async ev => {
      ev.preventDefault(); const err = $('#authErr', box), go = $('#authGo', box);
      const email = em.value.trim(), pass = reset ? '' : $('#authPass', box).value;
      if (!email) { err.textContent = 'Enter your email.'; return; }
      if (up && pass !== $('#authPass2', box).value) { err.textContent = 'The two passwords are different.'; return; }
      go.disabled = true; err.textContent = '';
      try {
        if (up) { await Cloud.signUp(email, pass); m.remove(); toast(Cloud.opts.approval ? 'Account created.' : 'Account created. You are signed in.'); }
        else if (reset) { await Cloud.resetPassword(email); err.style.color = 'var(--ok)'; err.textContent = 'Email sent. Check your inbox (and spam folder).'; }
        else { await Cloud.signIn(email, pass); m.remove(); toast('Signed in.'); }
      } catch (e) { err.style.color = 'var(--bad)'; err.textContent = Cloud.errorText(e); }
      go.disabled = false;
    };
  };
  draw();
}
const PRIVACY = `<b>What is stored:</b> your email address (and your name, if you use Google), how you sign in, when you signed up and last visited, whether your account is active or blocked, and your test history (questions, your answers, scores). It is kept in Google Firebase. The site’s owner sees your email, name and those dates, to manage accounts, but not your tests. Photos of written work never leave your device. No ads, no analytics. You can delete your account and everything in it at any time: click your email at the top, then <b>Delete my account</b>.`;
function openAccount() {
  const C = Cloud; if (!C.user) return;
  const m = openModal(`<h2>Your account</h2>
    <p><b>${esc(C.user.email)}</b><br><span class="small muted">Signs in with ${C.provider() === 'google.com' ? 'Google' : 'email and password'}</span></p>
    <p class="small">${PRIVACY}</p>
    <div class="row">${history.cloud && history.cloud.length ? '<button class="btn" id="acExport">Export my history</button>' : ''}${C.isAdmin || C.status === 'blocked' ? '' : '<button class="btn danger" id="acDel">Delete my account…</button>'}<button class="btn" id="acClose">Close</button></div>
    ${C.isAdmin ? '<p class="small muted" style="margin:12px 0 0">The site owner’s account can’t be deleted from the site.</p>' : ''}`);
  m.querySelector('.box').style.maxWidth = '560px';
  const ex = $('#acExport', m); if (ex) ex.onclick = exportHistory;
  const dl = $('#acDel', m); if (dl) dl.onclick = () => { m.remove(); openDelete(); };
  $('#acClose', m).onclick = () => m.remove();
}
function openDelete() {
  const C = Cloud; if (!C.user || C.isAdmin || C.status === 'blocked') return;
  const pw = C.provider() === 'password', n = (history.cloud || []).length, email = C.user.email, id = C.user.uid;
  const m = openModal(`<h2>Delete your account?</h2>
    <p>This permanently deletes:</p>
    <ul><li>your saved history for all subjects${n ? ` (<b>${n}</b> ${n === 1 ? 'entry' : 'entries'})` : ''}</li><li>your profile (email, name, sign-up dates, approval status)</li><li>your login: <b>${esc(email)}</b> will no longer work on this site</li></ul>
    <p class="small muted">Photos of written work saved on this device are removed too. It cannot be undone.${n ? ' Want a copy first? Use <b>Export my history</b> before deleting.' : ''}</p>
    <form id="delForm" novalidate>
      ${pw ? '<div class="field"><label for="delPass">Enter your password to confirm</label><input id="delPass" type="password" autocomplete="current-password" class="inp"></div>' : '<p class="small">To confirm, choose your Google account in the window that opens.</p>'}
      <div id="delErr" class="small" style="color:var(--bad);min-height:20px"></div>
      <div class="row"><button class="btn danger big" id="delGo" type="submit">${pw ? 'Delete my account' : 'Confirm with Google and delete'}</button><button class="btn big" id="delCancel" type="button">Cancel</button></div>
    </form>`);
  m.querySelector('.box').style.maxWidth = '520px';
  const p = $('#delPass', m); if (p) p.focus();
  $('#delCancel', m).onclick = () => m.remove();
  $('#delForm', m).onsubmit = async ev => {
    ev.preventDefault(); const err = $('#delErr', m), go = $('#delGo', m);
    if (pw && !p.value) { err.textContent = 'Enter your password.'; return; }
    go.disabled = true; err.textContent = ''; go.textContent = 'Deleting…';
    const ids = (history.cloud || []).map(x => x.id);
    Object.values(history._timers).forEach(clearTimeout); history._timers = {};
    try { await C.deleteAccount(pw ? p.value : ''); }
    catch (e) { err.textContent = 'Not deleted: ' + C.errorText(e); go.disabled = false; go.textContent = pw ? 'Delete my account' : 'Confirm with Google and delete'; return; }
    ids.forEach(x => IDB.del(x).catch(() => {}));
    try { localStorage.removeItem('pet_imported_' + id); } catch (e) { /* storage blocked */ }
    m.remove();
    openModal(`<h2>Account deleted</h2><p>Your history, your profile and your login (${esc(email)}) have been deleted.</p><div class="row" style="margin-top:14px"><button class="btn primary" onclick="this.closest('.modal').remove()">OK</button></div>`);
  };
}
function offerImport(u) {
  const local = store.get(HKEY, []); const flag = 'pet_imported_' + u.uid;
  if (!local.length || store.get(flag, false)) return;
  const have = new Set((history.cloud || []).map(x => x.id)); const todo = local.filter(x => !have.has(x.id));
  if (!todo.length) { store.set(flag, true); return; }
  const m = openModal(`<h2>Add your saved tests to the account?</h2><p>This browser has <b>${todo.length}</b> test(s) saved from before you signed in. Add them to your account so you can see them everywhere?</p>
    <div class="row" style="margin-top:14px"><button class="btn primary" id="impYes">Add them</button><button class="btn" id="impNo">Not now</button></div>`);
  $('#impYes', m).onclick = () => { todo.forEach(e => { history.cloud.push(e); history._push(e, true); }); history.cloud.sort((a, b) => (a.date < b.date ? 1 : -1)); store.set(flag, true); m.remove(); toast(`${todo.length} test(s) added to your account.`); render(); };
  $('#impNo', m).onclick = () => { store.set(flag, true); m.remove(); };
}
if (window.Cloud) Cloud.onChange(async u => {
  if (u && Cloud.canUse) {
    try { history.cloud = await Cloud.loadHistory(); } catch (e) { history.cloud = []; toast('Could not load your history: ' + Cloud.errorText(e)); }
    offerImport(u);
    if (Cloud.isAdmin && Cloud.opts.approval) Cloud.listUsers().then(l => { ST.pendingCount = l.filter(x => x.uid !== u.uid && x.status !== 'approved' && x.status !== 'blocked').length; if (!gateView()) renderHeader(); }).catch(() => {});
  } else history.cloud = null;
  ST.review = null; render();
});

window.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal').forEach(m => m.remove()); });
ST.review = null;
render();
// self-test hook used only for automated screenshots: #demo=<view>,<subject>
const demo = (location.hash.match(/^#demo=(\w+)(?:,(\w+))?(?:,(\d+))?/) || []);
if (demo[1]) {
  if (demo[2]) ST.subject = demo[2];
  const sub = SUB(); const k = (t) => ST.subject + ':' + t;
  if (demo[1] === 'test' || demo[1] === 'results') {
    ST.tab = 'test'; const mode = sub.modes[Number(demo[3] || 0)] || sub.modes[0];
    const qs = generateFromLayout(sub, mode.layout, 'random');
    const S = ST.sess[k('test')] = { id: uid(), kind: 'test', subject: sub.id, mode: mode.name, diff: 'random', questions: qs, answers: qs.map(() => null), flags: qs.map(() => false), cur: 3, start: Date.now() - 400000, limit: sub.mc.minutes * 60, scoring: sub.mc };
    if (demo[1] === 'results') { S.answers = qs.map(q => (Math.random() < 0.6 ? q.ans : Math.floor(Math.random() * q.opts.length))); S.answers[2] = null; finishMC(S); } else { S.answers[0] = 1; S.answers[1] = 0; S.flags[2] = true; }
  } else if (demo[1] === 'written') {
    ST.tab = 'written'; const ex = window.Written[sub.id](Number(demo[3] || 3));
    ST.sess[k('written')] = { id: uid(), kind: 'written', subject: sub.id, diff: '3', exam: ex, files: [], grades: { '0.0': 2, '0.1': 1.5 }, start: Date.now(), limit: null, finished: true, date: new Date().toISOString() };
  } else if (demo[1] === 'writtenq') {
    ST.tab = 'written'; const ex = window.Written[sub.id](Number(demo[3] || 3));
    ST.sess[k('written')] = { id: uid(), kind: 'written', subject: sub.id, diff: '3', exam: ex, files: [], grades: {}, start: Date.now(), limit: sub.written.minutes * 60, finished: false };
  } else ST.tab = demo[1];
  render();
}
})();
