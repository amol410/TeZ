import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvOL3unNQ9faJpCVofLGiS8Cgvax2hV9A",
  authDomain: "tezsend-86aa1.firebaseapp.com",
  projectId: "tezsend-86aa1",
  storageBucket: "tezsend-86aa1.firebasestorage.app",
  messagingSenderId: "294998189349",
  appId: "1:294998189349:web:c86f1dfbe8c940913f66cc",
  measurementId: "G-9KP6L5G5D7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Development toggle: disable app verification (reCAPTCHA) when testing locally.
// Set VITE_DISABLE_RECAPTCHA=true in your web/.env for local testing only.
try {
  const DISABLE = import.meta.env.VITE_DISABLE_RECAPTCHA === 'true';
  if (DISABLE) {
    // This flag allows Firebase phone auth to bypass reCAPTCHA checks in dev.
    // WARNING: Do NOT enable in production.
    auth.settings = auth.settings || {};
    auth.settings.appVerificationDisabledForTesting = true;
    console.warn('[TezSend] Firebase appVerificationDisabledForTesting = true (DEV)');
  }
} catch (e) {
  // import.meta may not be available in some test environments — ignore.
}
