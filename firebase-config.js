/* Firebase web config for the public website build (tools/build_web.py copies it as firebase-config.js).
   This is public project identification, not a secret: access is controlled by the Firestore rules
   and the authorized domains in the Firebase console. */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBlHcFrh-QE_GdmNOcvTVaLEBNLiJp4Jp4",
  authDomain: "polito-exam-trainer.firebaseapp.com",
  projectId: "polito-exam-trainer",
  storageBucket: "polito-exam-trainer.firebasestorage.app",
  messagingSenderId: "25753234128",
  appId: "1:25753234128:web:d3fa65b54350138ea68cd5"
};
/* Website behaviour (see cloud.js). adminUid = the site owner's account ID (not secret; also in firestore.rules). */
window.SITE_OPTIONS = {
  requireAccount: true,   // nothing can be used without signing in
  approval: false,        // false: new accounts can use the site at once, the admin can still Block anyone.
                          // true: new accounts wait for approval (then restore the 'approved' check in firestore.rules)
  adminUid: "w7PUmVfpeIYyvmxMYDRekHa3wpq1"
};
