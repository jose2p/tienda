import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  increment
} from "firebase/firestore";
import { db } from "../firebase";

export default function RegistrarVenta({
  producto,
  clienteSeleccionado,
  clientes,
  cantidades,
  setClientes,
  cargarVentas,
  setMensaje // ⬅️ Ahora es la función mostrarToast(tipo, mensaje, [duracion])
}) {
  const ventasRef = collection(db, "ventas");
  const finanzasRef = collection(db, "finanzas");

  // Función auxiliar para formatear la moneda (usada solo en el renderizado, pero útil aquí para mensajes)
  const formatGuarani = (value) => value.toLocaleString("es-PY") + " ₲";


  const registrarVenta = async (formaDePago) => {
    // --- 1. PREPARACIÓN DE DATOS Y VALIDACIÓN ---

    // 1. Encontrar cliente y definir variables
    const cliente = clientes.find(c => c.id === clienteSeleccionado);
    const cantidad = Number(cantidades[producto.id] ?? 1);
    const total = Number(producto.precioVenta) * cantidad;

    // 2. Validación de selección de cliente (Obligatoria para la venta)
    if (!clienteSeleccionado) {
      setMensaje("error", "❌ Seleccione un cliente para registrar la venta.");
      return;
    }

    // 3. Validación de stock
    if (cantidad > producto.stock) {
      // 💡 Llamada directa a setMensaje (mostrarToast)
      setMensaje("error", `❌ Stock insuficiente. Solo quedan ${producto.stock} de ${producto.nombre}.`);
      return;
    }

    // 4. Validación de crédito
    if (formaDePago === "credito") {
      if (!cliente || cliente.credito < total) {
        // 💡 Llamada directa a setMensaje (mostrarToast)
        setMensaje("error", `❌ Crédito insuficiente. El cliente ${cliente?.nombre} solo tiene ${formatGuarani(cliente?.credito || 0)} disponible.`);
        return;
      }
    }

    // Si llegamos aquí, las validaciones son correctas

    try {
      // --- 2. REGISTRO DE VENTA Y ACTUALIZACIÓN DE INVENTARIO ---

      // 🔹 Registrar venta y obtener referencia (VENTAS)
      const ventaRef = await addDoc(ventasRef, {
        clienteId: clienteSeleccionado,
        productoId: producto.id,
        cantidad,
        total,
        fecha: serverTimestamp(),
        formaDePago,
        pagado: formaDePago === "contado"
      });

      // 🔹 Actualizar inventario (PRODUCTOS)
      const productoDoc = doc(db, "productos", producto.id);
      await updateDoc(productoDoc, { stock: producto.stock - cantidad });

      // 🔹 Actualizar crédito si es a crédito (CLIENTES)
      if (formaDePago === "credito") {
        const clienteDoc = doc(db, "clientes", clienteSeleccionado);
        await updateDoc(clienteDoc, { credito: cliente.credito - total });
        setClientes(prev =>
          prev.map(c =>
            c.id === clienteSeleccionado ? { ...c, credito: c.credito - total } : c
          )
        );
      }

      // --- 3. REGISTRO FINANCIERO Y ACTUALIZACIÓN DE CAPITAL (SÓLO CONTADO) ---
      if (formaDePago === "contado") {

        // 3a. Registro Histórico de Ingreso (FINANZAS)
        await addDoc(finanzasRef, {
          fecha: serverTimestamp(),
          producto: producto.nombre,
          tipo: "ingreso",
          monto: total,
          descripcion: `Venta al contado de ${cantidad} x ${producto.nombre} al cliente ${cliente?.nombre} ${cliente?.apellido}`,
          ventaId: ventaRef.id
        });

        // 3b. Actualizar Saldo Acumulado (CAPITALES)
        const capitalId = producto.nombre.toLowerCase().trim();
        const capitalDoc = doc(db, "capitales", capitalId);

        const snap = await getDoc(capitalDoc);
        if (snap.exists()) {
          await updateDoc(capitalDoc, { capital: increment(total) });
        } else {
          await setDoc(capitalDoc, {
            capital: total
          });
        }
      }

      // --- 4. CIERRE Y NOTIFICACIÓN ---
      await cargarVentas();

      // 💡 Llamada final a setMensaje (mostrarToast)
      const mensajeExito = formaDePago === "contado"
        ? `✅ Venta al contado registrada: ${producto.nombre} x ${cantidad} por ${formatGuarani(total)}`
        : `📝 Venta a crédito registrada: ${producto.nombre} x ${cantidad} a ${cliente.nombre} por ${formatGuarani(total)}`;

      setMensaje("success", mensajeExito);

    } catch (error) {
      // 💡 Manejo de errores con setMensaje (mostrarToast)
      setMensaje("error", `Error en la transacción: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-700">
        Total:{" "}
        <span className="font-semibold">
          {((cantidades[producto.id] ?? 1) * producto.precioVenta).toLocaleString("es-PY")} ₲
        </span>
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => registrarVenta("contado")}
          disabled={!clienteSeleccionado}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${clienteSeleccionado ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          {clienteSeleccionado ? "Vender al contado" : "Seleccione un cliente"}
        </button>

        <button
          onClick={() => registrarVenta("credito")}
          disabled={!clienteSeleccionado}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${clienteSeleccionado ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          {clienteSeleccionado ? "Vender a crédito" : "Seleccione un cliente"}
        </button>
      </div>
    </div>
  );
}