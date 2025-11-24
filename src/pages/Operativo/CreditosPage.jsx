import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  query,
  where,
  onSnapshot,
  increment
} from "firebase/firestore";
import { formatGuarani } from "../../utils/format";
import toast, { Toaster } from 'react-hot-toast'; // ⬅️ AGREGAMOS TOASTER

export default function DeudasPage() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventasCredito, setVentasCredito] = useState([]);
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [montoPago, setMontoPago] = useState({});
  const [pagos, setPagos] = useState([]);

  // 🔹 Cargar clientes y productos (sin cambios funcionales)
  useEffect(() => {
    const cargarClientes = async () => {
      const snap = await getDocs(collection(db, "clientes"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(data);
    };
    cargarClientes();
    const cargarProductos = async () => {
      const snap = await getDocs(collection(db, "productos"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), nombre: d.data().nombre || d.id }));
      setProductos(data);
    };
    cargarProductos();
  }, []);


  // 🔹 Escuchar ventas a crédito y historial de pagos (sin cambios funcionales)
  useEffect(() => {
    const q = query(
      collection(db, "ventas"),
      where("formaDePago", "==", "credito"),
      where("pagado", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVentasCredito(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pagos"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPagos(data.sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0))); // Ordenar por fecha descendente
    });
    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------
  // ✅ FUNCIÓN AUXILIAR: REGISTRA INGRESO Y AUMENTA CAPITAL
  // -------------------------------------------------------------
  const actualizarCapitalPorProducto = async (productoNombre, monto) => {
    // 1. Registro de Ingreso en el historial de finanzas
    await addDoc(collection(db, "finanzas"), {
      producto: productoNombre.toLowerCase(), // Se asegura de que el nombre sea minúscula
      tipo: "ingreso",
      monto: monto,
      descripcion: `Pago de deuda cliente - ${productoNombre}`,
      fecha: new Date(),
    });

    // 2. Incremento del capital por producto
    const refCapital = doc(db, "capitales", productoNombre.toLowerCase()); // Se asegura de que el nombre sea minúscula
    await updateDoc(refCapital, { capital: increment(monto) });
  };
  // -------------------------------------------------------------


  // 🔹 Registrar en historial (sin cambios funcionales)
  const registrarHistorialPago = async ({ clienteId, ventaId = null, monto, tipo }) => {
    await addDoc(collection(db, "pagos"), {
      clienteId,
      ventaId,
      monto,
      tipo,
      fecha: new Date()
    });
  };

  // 🔹 Registrar pago parcial
  const registrarPagoParcial = async (venta, monto) => {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error("Ingrese un monto válido para el pago.");
      return;
    }

    const ventaRef = doc(db, "ventas", venta.id);
    const pagadoMontoActual = venta.pagadoMonto ?? 0;
    const pendiente = venta.total - pagadoMontoActual;

    if (montoNum > pendiente) {
      toast.error(`El monto excede el saldo pendiente de ${formatGuarani(pendiente)} Gs.`);
      return;
    }

    try {
      const nuevoPagadoMonto = pagadoMontoActual + montoNum;
      const pagado = nuevoPagadoMonto >= venta.total;

      // 1. Actualizar venta
      await updateDoc(ventaRef, {
        pagadoMonto: nuevoPagadoMonto,
        pagado
      });

      // 2. ✅ AUMENTAR CAPITAL
      const producto = productos.find(p => p.id === venta.productoId);
      const productoNombre = producto ? producto.nombre : 'General';
      await actualizarCapitalPorProducto(productoNombre, montoNum);


      // 3. Actualizar crédito de cliente
      const clienteRef = doc(db, "clientes", venta.clienteId);
      const cliente = clientes.find(c => c.id === venta.clienteId);
      const nuevoCredito = (cliente.credito ?? 0) + montoNum;
      await updateDoc(clienteRef, { credito: nuevoCredito });

      // 4. Registrar historial
      await registrarHistorialPago({
        clienteId: venta.clienteId,
        ventaId: venta.id,
        monto: montoNum,
        tipo: "parcial"
      });

      toast.success(`Pago parcial de ${formatGuarani(montoNum)} Gs. registrado para ${cliente.nombre}.`);
      setMontoPago(prev => ({ ...prev, [venta.id]: "" }));

    } catch (error) {
      toast.error(`Error al registrar pago parcial: ${error.message}`);
    }
  };

  // 🔹 Marcar una sola venta como pagada (pago completo)
  const marcarComoPagado = async (venta) => {
    const ventaRef = doc(db, "ventas", venta.id);
    const montoPendiente = venta.total - (venta.pagadoMonto ?? 0);
    const cliente = clientes.find(c => c.id === venta.clienteId);


    if (montoPendiente <= 0) {
      toast.warn("Esta venta ya está completamente pagada.");
      return;
    }

    try {
      // 1. Actualizar venta
      await updateDoc(ventaRef, { pagado: true, pagadoMonto: venta.total });

      // 2. ✅ AUMENTAR CAPITAL
      const producto = productos.find(p => p.id === venta.productoId);
      const productoNombre = producto ? producto.nombre : 'General';
      await actualizarCapitalPorProducto(productoNombre, montoPendiente);

      // 3. Actualizar crédito de cliente
      const clienteRef = doc(db, "clientes", venta.clienteId);
      const nuevoCredito = (cliente.credito ?? 0) + montoPendiente;
      await updateDoc(clienteRef, { credito: nuevoCredito });

      // 4. Registrar historial (usando el monto pendiente como monto pagado)
      await registrarHistorialPago({
        clienteId: venta.clienteId,
        ventaId: venta.id,
        monto: montoPendiente,
        tipo: "total"
      });

      toast.success(`Venta de ${cliente.nombre} marcada como pagada. Se recuperó ${formatGuarani(montoPendiente)} Gs.`);
    } catch (error) {
      toast.error(`Error al marcar como pagado: ${error.message}`);
    }
  };

  // 🔹 Pagar toda la deuda de un cliente
  const pagarTodaDeudaCliente = async (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    const ventasCliente = ventasCredito.filter(v => v.clienteId === clienteId);

    if (ventasCliente.length === 0) {
      toast.warn(`El cliente ${cliente.nombre} no tiene deuda pendiente.`);
      return;
    }

    try {
      let totalDeuda = 0;
      const pagosPorProducto = {}; // Para distribuir el ingreso al capital correcto

      for (const venta of ventasCliente) {
        const ventaRef = doc(db, "ventas", venta.id);
        const montoPagadoEnEstaVenta = venta.total - (venta.pagadoMonto ?? 0);

        if (montoPagadoEnEstaVenta > 0) {
          await updateDoc(ventaRef, { pagado: true, pagadoMonto: venta.total });
          totalDeuda += montoPagadoEnEstaVenta;

          // Acumular pago por producto
          const producto = productos.find(p => p.id === venta.productoId);
          const productoNombre = producto ? producto.nombre : 'General';
          pagosPorProducto[productoNombre] = (pagosPorProducto[productoNombre] || 0) + montoPagadoEnEstaVenta;
        }
      }

      if (totalDeuda === 0) {
        toast.warn(`El cliente ${cliente.nombre} no tiene deuda pendiente.`);
        return;
      }

      // 1. ✅ AUMENTAR CAPITAL (aplicar el ingreso acumulado por producto)
      for (const [productoNombre, monto] of Object.entries(pagosPorProducto)) {
        await actualizarCapitalPorProducto(productoNombre, monto);
      }

      // 2. Actualizar crédito de cliente
      const clienteRef = doc(db, "clientes", clienteId);
      const nuevoCredito = (cliente.credito ?? 0) + totalDeuda;
      await updateDoc(clienteRef, { credito: nuevoCredito });

      // 3. Registrar historial
      await registrarHistorialPago({
        clienteId,
        monto: totalDeuda,
        tipo: "total-cliente"
      });

      toast.success(`Toda la deuda de ${cliente.nombre} fue pagada por un total de ${formatGuarani(totalDeuda)} Gs.`);
    } catch (error) {
      toast.error(`Error al pagar toda la deuda: ${error.message}`);
    }
  };

  // 🔹 Pago global distribuido automáticamente
  const pagarMontoCliente = async (clienteId, monto) => {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error("Ingrese un monto válido para el pago global.");
      return;
    }

    try {
      const cliente = clientes.find(c => c.id === clienteId);
      const ventasCliente = ventasCredito
        .filter(v => v.clienteId === clienteId)
        .sort((a, b) => a.fecha.seconds - b.fecha.seconds);

      if (ventasCliente.length === 0) {
        toast.warn(`El cliente ${cliente.nombre} no tiene ventas pendientes.`);
        return;
      }

      let restante = montoNum;
      const pagosPorProducto = {}; // Para distribuir el ingreso al capital correcto
      let totalAplicado = 0;

      for (const venta of ventasCliente) {
        if (restante <= 0) break;

        const pagadoMonto = venta.pagadoMonto ?? 0;
        const pendiente = venta.total - pagadoMonto;

        const pago = Math.min(restante, pendiente);
        const nuevoPagadoMonto = pagadoMonto + pago;
        const pagado = nuevoPagadoMonto >= venta.total;

        const ventaRef = doc(db, "ventas", venta.id);
        await updateDoc(ventaRef, {
          pagadoMonto: nuevoPagadoMonto,
          pagado
        });

        // Acumular pago por producto
        const producto = productos.find(p => p.id === venta.productoId);
        const productoNombre = producto ? producto.nombre : 'General';
        pagosPorProducto[productoNombre] = (pagosPorProducto[productoNombre] || 0) + pago;

        restante -= pago;
        totalAplicado += pago;
      }

      if (totalAplicado === 0) {
        toast.warn(`El cliente ${cliente.nombre} ya pagó todas sus ventas pendientes.`);
        return;
      }

      // 1. ✅ AUMENTAR CAPITAL (aplicar el ingreso acumulado por producto)
      for (const [productoNombre, montoPagado] of Object.entries(pagosPorProducto)) {
        await actualizarCapitalPorProducto(productoNombre, montoPagado);
      }

      // 2. Actualizar crédito de cliente
      const clienteRef = doc(db, "clientes", clienteId);
      const nuevoCredito = (cliente.credito ?? 0) + totalAplicado;
      await updateDoc(clienteRef, { credito: nuevoCredito });

      // 3. Registrar historial
      await registrarHistorialPago({
        clienteId,
        monto: totalAplicado,
        tipo: "global"
      });

      toast.success(`Se registró un pago global de ${formatGuarani(totalAplicado)} Gs. para ${cliente.nombre}.`);
      setMontoPago(prev => ({ ...prev, [clienteId]: "" }));
    } catch (error) {
      toast.error(`Error al registrar pago global: ${error.message}`);
    }
  };

  // 🔹 Filtrar ventas por cliente
  const ventasFiltradas = clienteFiltro
    ? ventasCredito.filter(v => v.clienteId === clienteFiltro)
    : ventasCredito;

  // 🔹 Resumen por cliente
  const resumenPorCliente = clientes.map(c => {
    const deuda = ventasCredito
      .filter(v => v.clienteId === c.id)
      .reduce((acc, v) => acc + (v.total - (v.pagadoMonto ?? 0)), 0);

    return {
      ...c,
      deuda,
      disponible: (c.credito ?? 0),
      total: (c.credito ?? 0) + deuda // Crédito total (deuda + disponible)
    };
  }).filter(c => c.deuda > 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">💳 Gestión de Deudas y Créditos</h1>

      <div className="max-w-6xl mx-auto">

        {/* ----------------------------------------------------------------- */}
        {/* ## 📊 Resumen de Crédito por Cliente */}
        {/* ----------------------------------------------------------------- */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
          Estado de Crédito
        </h2>
        {resumenPorCliente.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <p className="text-gray-500 py-4 text-center">🎉 No hay clientes con deuda pendiente. ¡Todo pagado!</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-10 overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold">
                  <th className="px-4 py-3 rounded-tl-lg">Cliente</th>
                  <th className="px-4 py-3 text-right">Crédito Disponible</th>
                  <th className="px-4 py-3 text-right">Deuda Pendiente</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Crédito Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumenPorCliente.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.nombre} {c.apellido}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold text-right">{formatGuarani(c.disponible)}</td>
                    <td className="px-4 py-3 text-red-600 font-bold text-right">{formatGuarani(c.deuda)}</td>
                    <td className="px-4 py-3 text-indigo-700 font-semibold text-right">{formatGuarani(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* ## ⚙️ Acciones y Filtro */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">

          <div className="w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700 block mb-1">Filtrar por Cliente:</label>
            <select
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
            >
              <option value="">— Ver todas las ventas pendientes —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>

          {clienteFiltro && (
            <div className="grow flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className="w-full sm:w-auto">
                <label className="text-xs font-medium text-gray-700 block mb-1">Pago Global:</label>
                <input
                  type="number"
                  placeholder="Monto Gs."
                  value={montoPago[clienteFiltro] || ""}
                  onChange={(e) =>
                    setMontoPago({ ...montoPago, [clienteFiltro]: Number(e.target.value) })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-32 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                />
              </div>
              <button
                onClick={() => pagarMontoCliente(clienteFiltro, montoPago[clienteFiltro])}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition shadow-md w-full sm:w-auto"
              >
                Pagar Parcial/Global
              </button>

              {ventasFiltradas.length > 0 && (
                <button
                  onClick={() => pagarTodaDeudaCliente(clienteFiltro)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition shadow-md w-full sm:w-auto"
                >
                  Pagar Toda la Deuda
                </button>
              )}
            </div>
          )}

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ## 🛒 Compras a Crédito Pendientes (Detalle) */}
        {/* ----------------------------------------------------------------- */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
          Detalle de Ventas a Crédito
        </h2>
        {ventasFiltradas.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-gray-500 py-4 text-center">No hay compras a crédito pendientes de pago.</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto mb-10">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3">Fecha Venta</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventasFiltradas.map(v => {
                  const cliente = clientes.find(c => c.id === v.clienteId);
                  const producto = productos.find(p => p.id === v.productoId);
                  const pagadoMonto = v.pagadoMonto ?? 0;
                  const pendiente = v.total - pagadoMonto;
                  const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente Desconocido";

                  return (
                    <tr key={v.id} className="hover:bg-indigo-50/20">
                      <td className="px-4 py-3 font-medium text-gray-900">{clienteNombre}</td>
                      <td className="px-4 py-3 text-gray-700">{producto ? producto.nombre : "Producto Desconocido"}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{v.cantidad}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium text-right">{formatGuarani(v.total)}</td>
                      <td className="px-4 py-3 text-green-600 text-right">{formatGuarani(pagadoMonto)}</td>
                      <td className="px-4 py-3 text-red-600 font-bold text-right">{formatGuarani(pendiente)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {v.fecha?.toDate ? v.fecha.toDate().toLocaleDateString("es-PY") : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {/* Pago parcial */}
                          <div className="flex space-x-1">
                            <input
                              type="number"
                              placeholder="Monto"
                              value={montoPago[v.id] || ""}
                              onChange={(e) =>
                                setMontoPago({ ...montoPago, [v.id]: Number(e.target.value) })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md w-24 text-sm"
                            />
                            <button
                              onClick={() => registrarPagoParcial(v, montoPago[v.id])}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition"
                            >
                              Pago Parcial
                            </button>
                          </div>

                          {/* Pago completo */}
                          <button
                            onClick={() => marcarComoPagado(v)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                          >
                            Pagar Completo
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* ## 📜 Historial de Pagos */}
        {/* ----------------------------------------------------------------- */}
        <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4 flex items-center">
          Historial de Pagos Recibidos
        </h2>
        {pagos.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-gray-500 py-4 text-center">No hay registros de pagos recibidos.</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                  <th className="px-4 py-3 rounded-tl-lg">Cliente</th>
                  <th className="px-4 py-3 text-right">Monto Pagado</th>
                  <th className="px-4 py-3">Tipo de Pago</th>
                  <th className="px-4 py-3 rounded-tr-lg">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagos.map(p => {
                  const cliente = clientes.find(c => c.id === p.clienteId);
                  const tipoClase = p.tipo === 'total-cliente' || p.tipo === 'total' ? 'text-green-700 font-bold' : 'text-yellow-600';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{cliente ? `${cliente.nombre} ${cliente.apellido}` : "—"}</td>
                      <td className={`px-4 py-3 text-right font-bold ${tipoClase}`}>{formatGuarani(p.monto)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'total-cliente' ? 'bg-green-100 text-green-800' : p.tipo === 'global' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {p.tipo === 'total-cliente' ? 'DEUDA COMPLETA' : p.tipo === 'global' ? 'PAGO GLOBAL' : p.tipo === 'total' ? 'PAGO COMPLETO' : 'PAGO PARCIAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.fecha?.toDate ? p.fecha.toDate().toLocaleString("es-PY") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
};