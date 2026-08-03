const {
  initializeApp,
  getApps,
  getApp,
  cert,
} = require('firebase-admin/app');
const path = require('path');
const fs = require('fs');

// __dirname = /...backend/src, so go one level up to /backend
const serviceAccountPath = path.resolve(__dirname, '..', 'tezsend-firebase-adminsdk.json');

let firebaseApp = null;

function initFirebaseAdmin() {
  const existingApps = getApps();

  // Guard against double-initialization
  if (existingApps.length > 0) {
    console.log('Firebase Admin: reusing already-initialized app.');
    return getApp();
  }

  let serviceAccount;

  // 1) Prefer env var (production / CI / hosting without file access)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('Firebase Admin: loading credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var.');
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error(
        'Firebase Admin: FIREBASE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON.\n' +
        'Make sure the value is the raw minified contents of the service account JSON file.\n' +
        'Tip: minify at https://jsonformatter.org/json-minifier then paste as the env var value.'
      );
      return null;
    }
  }
  // 2) Fall back to local file (local development / file uploaded to server)
  else if (fs.existsSync(serviceAccountPath)) {
    console.log(`Firebase Admin: loading credentials from file: ${serviceAccountPath}`);
    const raw = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(raw);
  }
  // 3) Neither source found — warn but don't crash
  else {
    console.warn(
      'Firebase Admin: no credentials found. Firebase auth routes will not work.\n' +
      '  • Set FIREBASE_SERVICE_ACCOUNT_JSON env var to the minified JSON contents, OR\n' +
      `  • Upload tezsend-firebase-adminsdk.json to the /backend directory on the server.`
    );
    return null;
  }

  try {
    const app = initializeApp({ credential: cert(serviceAccount) });
    const projectId = serviceAccount.project_id ?? 'unknown';
    console.log(`Firebase Admin: initialized (project: ${projectId})`);
    return app;
  } catch (e) {
    console.error('Firebase Admin: initialization failed:', e.message);
    return null;
  }
}

firebaseApp = initFirebaseAdmin();

module.exports = { firebaseApp };
