import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    increment,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const CAPITALES_COLLECTION = "capitales";
const FINANZAS_COLLECTION = "finanzas";

// 🔹 Función principal: Registra Egreso y Valida contra el CAPITAL DEL PRODUCTO
export const registrarEgresoYValidarCapital = async (productoNombre, cantidad, precioCompra) => {
    const total = cantidad * precioCompra;

    // Usamos el nombre del producto como ID (key)
    const capitalProductoId = productoNombre.toLowerCase().trim();
    const capitalProductoDoc = doc(db, CAPITALES_COLLECTION, capitalProductoId);

    // 1. OBTENER Y VALIDAR CAPITAL DEL PRODUCTO
    const snap = await getDoc(capitalProductoDoc);
    const capitalActual = snap.exists() ? snap.data().capital : 0; // Si no existe, el capital es 0

    if (capitalActual < total) {
        // 🛑 Devolvemos un objeto con error si el capital es insuficiente
        return { error: true, mensaje: total, capitalActual: capitalActual };
    }

    // --- 2. Si hay capital, procedemos con las escrituras ---

    // 2a. Registro Histórico (FINANZAS)
    await addDoc(collection(db, FINANZAS_COLLECTION), {
        producto: productoNombre,
        tipo: "egreso",
        monto: -total,
        // ✅ CADENA DE TEXTO CORREGIDA
        descripcion: `Compra de ${cantidad} unidades de ${productoNombre}`,
        fecha: serverTimestamp()
    });

    // 2b. Deducción del Saldo (CAPITALES/detergente)
    await updateDoc(capitalProductoDoc, { capital: increment(-total) });

    return { error: false };
};