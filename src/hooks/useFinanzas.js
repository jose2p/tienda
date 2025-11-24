import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { db } from "../firebase";
import { formatGuarani } from "../utils/format";

export function useFinanzas(usuario, rol) {
  const [movimientos, setMovimientos] = useState([]);
  const [capitales, setCapitales] = useState([]);

  // 🔹 Escuchar movimientos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "finanzas"), (snap) => {
      // Aseguramos que 'monto' se trate como número al recuperarlo
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        monto: Number(d.data().monto) // ⬅️ Leemos el monto como número
      }));
      setMovimientos(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Escuchar capitales
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "capitales"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCapitales(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Actualizar capital (Auxiliar)
  const actualizarCapital = async (producto, tipo, monto) => {
    const ref = doc(db, "capitales", producto);
    const delta = tipo === "ingreso" ? monto : -monto;

    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { capital: increment(delta) });
    } else {
      await setDoc(ref, { capital: tipo === "ingreso" ? monto : 0 });
    }
  };

  // 🔹 Registrar movimiento
  const registrarMovimiento = async (movimiento) => {
    const { producto, tipo, monto, descripcion } = movimiento;
    const montoNum = Number(monto);

    if (tipo === "egreso" && rol !== "admin") throw new Error("Sin permisos para egresos");

    if (tipo === "egreso") {
      const ref = doc(db, "capitales", producto);
      const snap = await getDoc(ref);
      const capitalActual = snap.exists() ? snap.data().capital : 0;
      if (montoNum > capitalActual) {
        throw new Error(`Fondos insuficientes en ${producto}. Capital actual: ${formatGuarani(capitalActual)}`);
      }
    }

    await addDoc(collection(db, "finanzas"), {
      producto,
      tipo,
      monto: montoNum,
      descripcion,
      fecha: new Date(),
      usuarioId: usuario?.uid || "desconocido"
    });

    await actualizarCapital(producto, tipo, montoNum);
  };

  // -------------------------------------------------------------
  // 🔹 Eliminar movimiento con ajuste de capital y Validación de Sobregiro (CORREGIDO) 🛑
  // -------------------------------------------------------------
  const eliminarMovimiento = async (movimiento) => {
    if (rol !== "admin") throw new Error("Sin permisos para eliminar");

    // Aseguramos el tipo de dato para el cálculo (aunque ya se hizo en el useEffect, es buena práctica)
    const montoNumerico = Number(movimiento.monto);

    const refCapital = doc(db, "capitales", movimiento.producto);
    const refFinanzas = doc(db, "finanzas", movimiento.id);

    // 1. Determinar la compensación (reversión del efecto)
    // Si fue Ingreso (+M), delta = -M. Si fue Egreso (-M), delta = +M.
    const delta = movimiento.tipo === "ingreso" ? -montoNumerico : montoNumerico;

    // 2. Obtener el capital actual para la validación
    const snap = await getDoc(refCapital);
    const capitalActual = snap.exists() ? snap.data().capital : 0;

    // 🛑 3. VALIDACIÓN DE SOBREGIRO (solo si eliminamos un INGRESO, cuando delta es negativo)
    if (delta < 0) {
      const nuevoSaldo = capitalActual + delta; // capitalActual - montoIngreso
      if (nuevoSaldo < 0) {
        // No se puede eliminar porque el saldo ya se usó.
        const montoRequerido = -delta; // El monto original del ingreso
        throw new Error(`❌ Error de Caja: No se puede eliminar el ingreso de ${formatGuarani(montoRequerido)} Gs. El capital disponible (${formatGuarani(capitalActual)}) ya fue utilizado en compras. La eliminación causaría un sobregiro.`);
      }
    }

    // 4. Si la validación pasa o si fue un Egreso, aplicamos la compensación
    await updateDoc(refCapital, { capital: increment(delta) });

    // 5. Eliminar el registro histórico
    await deleteDoc(refFinanzas);
  };
  // -------------------------------------------------------------

  // 🔹 Guardar capital manualmente
  const guardarCapital = async (producto, capital) => {
    if (rol !== "admin") throw new Error("Sin permisos");
    if (!producto || !capital) throw new Error("Campos incompletos");

    const ref = doc(db, "capitales", producto);
    await setDoc(ref, { capital: Number(capital) }, { merge: true });
  };

  const getCapital = (producto) => {
    return capitales.find(c => c.id === producto)?.capital || 0;
  };

  return {
    movimientos,
    capitales,
    registrarMovimiento,
    eliminarMovimiento,
    guardarCapital,
    getCapital
  };
}