/* Accounts + cloud history (Firebase Auth + Firestore).
   Active only when the page is served over http(s) AND firebase-config.js sets window.FIREBASE_CONFIG.
   Otherwise the program works exactly as before, with history in the browser only. */
(function (G) {
'use strict';
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const cfg = G.FIREBASE_CONFIG;
const Cloud = {
  enabled: !!(cfg && cfg.apiKey && /^https?:$/.test(location.protocol)),
  state: 'off',            // off | loading | ready
  user: null,
  _listeners: [],
  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(this.user); } catch (e) { console.error(e); } }); },
  async signUp(email, password) {
    const cred = await this.auth.createUserWithEmailAndPassword(email, password);
    try { await this.db.collection('users').doc(cred.user.uid).set({ email, created: new Date().toISOString() }, { merge: true }); } catch (e) { /* profile doc is optional */ }
    return cred.user;
  },
  signIn(email, password) { return this.auth.signInWithEmailAndPassword(email, password); },
  signOut() { return this.auth.signOut(); },
  resetPassword(email) { return this.auth.sendPasswordResetEmail(email); },
  _col() { return this.db.collection('users').doc(this.user.uid).collection('history'); },
  async loadHistory() {
    const snap = await this._col().get(); const out = [];
    snap.forEach(d => { try { out.push(JSON.parse(d.data().json)); } catch (e) { /* skip a corrupted entry */ } });
    out.sort((a, b) => (a.date < b.date ? 1 : -1));
    return out;
  },
  put(entry) { return this._col().doc(entry.id).set({ json: JSON.stringify(entry), date: entry.date || '', subject: entry.subject || '', kind: entry.kind || '' }); },
  del(id) { return this._col().doc(id).delete(); },
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
      'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
      'auth/network-request-failed': 'No internet connection. Check your network and try again.',
      'auth/unauthorized-domain': 'This website address is not authorized in Firebase (Authentication → Settings → Authorized domains).',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase (Authentication → Sign-in method).',
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
      Cloud.auth.onAuthStateChanged(u => { Cloud.user = u ? { uid: u.uid, email: u.email } : null; Cloud.state = 'ready'; Cloud._emit(); });
    } catch (e) { console.error('Accounts unavailable:', e); Cloud.enabled = false; Cloud.state = 'off'; Cloud._emit(); }
  })();
}
G.Cloud = Cloud;
})(window);
