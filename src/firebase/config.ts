import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6dvkIZjMxfwVKvASpByaCPez1s7rQUeM",
  authDomain: "agrogest-34373.firebaseapp.com",
  projectId: "agrogest-34373",
  storageBucket: "agrogest-34373.firebasestorage.app",
  messagingSenderId: "440424133593",
  appId: "1:440424133593:web:2fa7951c857cb02a719fc8",
  measurementId: "G-81LR4WYVS1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
