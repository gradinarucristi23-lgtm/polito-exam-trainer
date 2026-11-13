/* Accounts + cloud history (Firebase Auth + Firestore).
   Active only when the page is served over http(s) AND firebase-config.js sets window.FIREBASE_CONFIG.
   Otherwise the program works exactly as before, with history in the browser only.
   window.SITE_OPTIONS (website only):
     requireAccount  the site can only be used after signing in
     approval        new accounts wait until the admin approves them
     adminUid        the account ID of the site's owner (sees the Admin tab) */
(function (G) {
'use strict';
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const cfg = G.FIREBASE_CONFIG;
const opts = G.SITE_OPTIONS || {};
const Cloud = {
  enabled: !!(cfg && cfg.apiKey && /^https?:$/.test(location.protocol)),
  opts,
  state: 'off',            // off | loading | ready
  failed: false,           // the account service could not be loaded
  user: null,
  status: null,            // approved | pending | blocked | error (only while signed in)
  statusError: null,
  profile: null,
  _listeners: [],
  get gate() { return !!(this.opts.requireAccount && cfg && cfg.apiKey && /^https?:$/.test(location.protocol)); },
  get isAdmin() { return !!(this.user && this.opts.adminUid && this.user.uid === this.opts.adminUid); },
  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(this.user); } catch (e) { console.error(e); } }); },
  async signUp(email, password) { return (await this.auth.createUserWithEmailAndPassword(email, password)).user; },
  signIn(email, password) { return this.auth.signInWithEmailAndPassword(email, password); },
  _google() { const p = new G.firebase.auth.GoogleAuthProvider(); p.setCustomParameters && p.setCustomParameters({ prompt: 'select_account' }); return p; },
  // 'password' or 'google.com': how the signed-in person logs in.
  provider() { const u = this.auth && this.auth.currentUser; const ids = u ? u.providerData.map(p => p.providerId) : []; return ids.includes('password') ? 'password' : (ids[0] || ''); },
  async signInGoogle() {
    const provider = this._google();
    try { return await this.auth.signInWithPopup(provider); }
    catch (e) {
      // Some phones and in-app browsers block popups: fall back to a full-page redirect.
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return this.auth.signInWithRedirect(provider);
      throw e;
    }
  },
  signOut() { return this.auth.signOut(); },
  resetPassword(email) { return this.auth.sendPasswordResetEmail(email); },

  /* ---- profile + approval status (users/{uid}) ---- */
  // Writes the person's own profile; the Firestore rules check every field against their sign-in token
  // and only allow 'pending' as the starting status.
  async _profile(u) {
    const ref = this.db.collection('users').doc(u.uid);
    const tok = await u.getIdTokenResult();
    const now = new Date().toISOString();
    const snap = await ref.get(); const old = snap.exists ? snap.data() : {};
    const doc = { email: tok.claims.email || '', verified: !!tok.claims.email_verified, provider: tok.signInProvider || '',
      name: String(u.displayName || '').slice(0, 100), created: old.created || now, lastSeen: now };
    if (!old.status) doc.status = 'pending';
    await ref.set(doc, { merge: true });
    return { ...old, ...doc };
  },
  async _loadStatus(u) {
    this.statusError = null;
    try {
      this.profile = await this._profile(u);
      const s = this.profile.status;
      this.status = this.isAdmin ? 'approved' : s === 'blocked' ? 'blocked' : (!this.opts.approval || s === 'approved') ? 'approved' : 'pending';
    } catch (e) {
      console.error('Profile:', e);
      this.statusError = e;
      this.status = this.opts.approval && !this.isAdmin ? 'error' : 'approved';
    }
  },
  async refreshStatus() {
    const u = this.auth && this.auth.currentUser; if (!u) return;
    await this._loadStatus(u); this._emit();
  },

  /* ---- admin ---- */
  async listUsers() {
    const snap = await this.db.collection('users').get(); const out = [];
    snap.forEach(d => out.push({ uid: d.id, ...d.data() }));
    out.sort((a, b) => ((a.created || '') < (b.created || '') ? 1 : -1));
    return out;
  },
  setStatus(uid, status) { return this.db.collection('users').doc(uid).update({ status, decided: new Date().toISOString() }); },

  /* ---- history ---- */
  _col() { return this.db.collection('users').doc(this.user.uid).collection('history'); },
  async loadHistory() {
    const snap = await this._col().get(); const out = [];
    snap.forEach(d => { try { out.push(JSON.parse(d.data().json)); } catch (e) { /* skip a corrupted entry */ } });
    out.sort((a, b) => (a.date < b.date ? 1 : -1));
    return out;
  },
  put(entry) { return this._col().doc(entry.id).set({ json: JSON.stringify(entry), date: entry.date || '', subject: entry.subject || '', kind: entry.kind || '' }); },
  del(id) { return this._col().doc(id).delete(); },

  /* ---- delete my account: history, profile, login ---- */
  // The person signs in again first (Firebase only removes a login right after a fresh sign-in), so nothing
  // is deleted when the password is wrong. History goes before the profile, because the rules read the
  // profile to check approval. A blocked account cannot delete its profile (rules), so the app never offers it.
  async deleteAccount(password) {
    const u = this.auth.currentUser;
    if (!u) throw new Error('You are not signed in.');
    if (this.isAdmin) throw new Error('The site owner’s account cannot be deleted from the site.');
    if (this.provider() === 'password') await u.reauthenticateWithCredential(G.firebase.auth.EmailAuthProvider.credential(u.email, password));
    else await u.reauthenticateWithPopup(this._google());
    if (this.status === 'approved') {
      const snap = await this.db.collection('users').doc(u.uid).collection('history').get();
      for (let i = 0; i < snap.docs.length; i += 400) {
        const b = this.db.batch(); snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit();
      }
    }
    await this.db.collection('users').doc(u.uid).delete();
    await u.delete();
  },
  errorText(e) {
    const c = (e && e.code) || '';
    const map = {
      'auth/invalid-email': 'That email address is not valid.',
      'auth/missing-email': 'Enter your email.',
      'auth/missing-password': 'Enter your password.',
      'auth/weak-password': 'The password must be at least 6 characters long.',
      'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/invalid-login-credentials': 'Wrong email or password.',
      'auth/wrong-password': 'Wrong email or password.',
      'auth/user-not-found': 'No account with this email. Create one first.',
      'auth/user-disabled': 'This account has been disabled by the site owner.',
      'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
      'auth/network-request-failed': 'No internet connection. Check your network and try again.',
      'auth/unauthorized-domain': 'This website address is not authorized in Firebase (Authentication → Settings → Authorized domains).',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase (Authentication → Sign-in method).',
      'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
      'auth/cancelled-popup-request': 'The Google window was closed before signing in.',
      'auth/account-exists-with-different-credential': 'An account with this email already exists. Sign in with email and password.',
      'auth/user-mismatch': 'That is a different Google account. Choose the account you are signed in with.',
      'auth/requires-recent-login': 'For safety, sign out, sign in again, then retry.',
      'auth/popup-blocked': 'The browser blocked the Google window. Allow pop-ups for this site and try again.',
      'permission-denied': 'The server refused the request (check the Firestore security rules).',
      'unavailable': 'The server cannot be reached right now. Try again in a moment.',
    };
    return map[c] || (e && e.message) || 'Something went wrong. Try again.';
  },
};
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
if (Cloud.enabled) {
  Cloud.state = 'loading';
  (async () => {
    try {
      if (!G.firebase) for (const f of ['app', 'auth', 'firestore']) await loadScript(SDK + 'firebase-' + f + '-compat.js');
      if (!G.firebase.apps.length) G.firebase.initializeApp(cfg);
      Cloud.auth = G.firebase.auth(); Cloud.db = G.firebase.firestore();
      Cloud.auth.onAuthStateChanged(async u => {
        Cloud.user = u ? { uid: u.uid, email: u.email } : null;
        Cloud.status = null; Cloud.profile = null; Cloud.statusError = null;
        if (u) {
          await Cloud._loadStatus(u);
          if (!Cloud.auth.currentUser || Cloud.auth.currentUser.uid !== u.uid) return;   // signed out meanwhile
        }
        Cloud.state = 'ready'; Cloud._emit();
      });
    } catch (e) { console.error('Accounts unavailable:', e); Cloud.enabled = false; Cloud.failed = true; Cloud.state = 'off'; Cloud._emit(); }
  })();
}
G.Cloud = Cloud;
})(window);
