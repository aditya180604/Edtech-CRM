import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

let firebaseAdminApp = null;
let firebaseAuthInstance = null;

export function getFirebaseAdmin() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'edtechcrm-dacdf';

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      console.log('[Firebase Admin] Initialized with Service Account credentials.');
    } else {
      firebaseAdminApp = admin.initializeApp({
        projectId,
      });
      console.log(`[Firebase Admin] Initialized for project [${projectId}]`);
    }

    firebaseAuthInstance = getAuth(firebaseAdminApp);
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error.message);
  }

  return firebaseAdminApp;
}

// Pre-initialize on load
getFirebaseAdmin();

export const getFirebaseAuth = () => {
  if (!firebaseAuthInstance) {
    getFirebaseAdmin();
  }
  return firebaseAuthInstance;
};

export default admin;
