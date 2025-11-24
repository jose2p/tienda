// For Firebase JS SDK v7.20.0 and later, measurementId is optional

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCITbPuICNMAPR1AUeQuZEpxCmzbqtm5x4",
  authDomain: "miventa-c6cde.firebaseapp.com",
  projectId: "miventa-c6cde",
  storageBucket: "miventa-c6cde.firebasestorage.app",
  messagingSenderId: "981052848552",
  appId: "1:981052848552:web:0899f29a9ae737cba6c59d",
  measurementId: "G-4B1LT1GNNQ"
};

// Inicializa Firebase **y lo exportas**
export const app = initializeApp(firebaseConfig);

// Exporta Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);
