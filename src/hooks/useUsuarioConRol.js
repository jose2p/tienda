// 📂 hooks/useUsuarioConRol.js
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useUsuarioConRol() {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
  }, []);

  useEffect(() => {
    const fetchRol = async () => {
      if (usuario) {
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRol(snap.data().rol);
        }
      }
    };
    fetchRol();
  }, [usuario]);

  return { usuario, rol };
}
