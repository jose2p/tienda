import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where 
} from "firebase/firestore";
import { formatGuarani } from "../../utils/format";

export default function HistorialPage() {
    // ... (Estados y lógica de carga) ...
    // ... (Tu código de useState y useEffect se mantiene igual) ...

    const [ventas, setVentas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [clienteFiltro, setClienteFiltro] = useState("");
    const [productoFiltro, setProductoFiltro] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [cargando, setCargando] = useState(true);

    const getInicioMesActual = () => {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
    };

    // 🚀 NUEVA FUNCIÓN: Obtener el nombre del mes actual
    const getNombreMesActual = () => {
        const hoy = new Date();
        return hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };


    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                const inicioMes = getInicioMesActual();
                
                const qVentas = query(
                    collection(db, "ventas"), 
                    where("fecha", ">=", inicioMes), 
                    orderBy("fecha", "desc")
                );

                const [snapVentas, snapClientes, snapProductos] = await Promise.all([
                    getDocs(qVentas),
                    getDocs(collection(db, "clientes")),
                    getDocs(collection(db, "productos")),
                ]);

                setVentas(snapVentas.docs.map(d => ({ id: d.id, ...d.data() })));
                setClientes(snapClientes.docs.map(d => ({ id: d.id, ...d.data() })));
                setProductos(snapProductos.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    // ... (Lógica de filtrado y cálculos de totales) ...
    // ... (Tu código de ventasFiltradas, totalAcumulado, etc. se mantiene igual) ...

    const ventasFiltradas = ventas.filter(v => {
        const fechaVenta = v.fecha?.toDate ? v.fecha.toDate() : null;
        const coincideCliente = clienteFiltro ? v.clienteId === clienteFiltro : true;
        const coincideProducto = productoFiltro ? v.productoId === productoFiltro : true;
        const coincideFechaInicio = fechaInicio ? fechaVenta >= new Date(fechaInicio + "T00:00:00") : true;
        const coincideFechaFin = fechaFin ? fechaVenta <= new Date(fechaFin + "T23:59:59") : true;
        return coincideCliente && coincideProducto && coincideFechaInicio && coincideFechaFin;
    });

    const totalAcumulado = ventasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const ventasHoy = ventas.filter(v => {
        const fecha = v.fecha?.toDate ? v.fecha.toDate() : null;
        return fecha && fecha >= inicioHoy && fecha <= finHoy;
    });
    const totalHoy = ventasHoy.reduce((acc, v) => acc + (v.total || 0), 0);

    const ventasMes = ventas.filter(v => {
        const fecha = v.fecha?.toDate ? v.fecha.toDate() : null;
        return fecha &&
            fecha.getMonth() === hoy.getMonth() &&
            fecha.getFullYear() === hoy.getFullYear();
    });
    const totalMes = ventasMes.reduce((acc, v) => acc + (v.total || 0), 0);

    const totalesPorProducto = productos.map(p => {
        const ventasProducto = ventasFiltradas.filter(v => v.productoId === p.id);
        const totalProducto = ventasProducto.reduce((acc, v) => acc + (v.total || 0), 0);
        return { nombre: p.nombre, total: totalProducto };
    }).filter(tp => tp.total > 0);


    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-indigo-600 text-xl font-medium flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cargando historial (último mes)...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">📊 Historial de Ventas</h1>

                {/* 🚀 MENSAJE INFORMATIVO DEL ALCANCE */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-4 py-2 rounded-full border border-yellow-400 shadow-sm">
                        ⚠️ Mostrando datos solo desde **el inicio de {getNombreMesActual()}**.
                        Usa los filtros de fecha para consultar rangos anteriores.
                    </div>
                </div>
                {/* ------------------------------------------------------------- */}
                {/* ## ⚡ Indicadores Rápidos */}
                {/* ------------------------------------------------------------- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Venta Hoy */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                        <p className="text-sm font-medium text-gray-500 uppercase">Ventas de Hoy</p>
                        <p className="text-3xl font-extrabold text-indigo-700 mt-1">{formatGuarani(totalHoy)}</p>
                    </div>
                    {/* Venta Mes */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                        <p className="text-sm font-medium text-gray-500 uppercase">Ventas del Mes</p>
                        <p className="text-3xl font-extrabold text-purple-700 mt-1">{formatGuarani(totalMes)}</p>
                    </div>
                    {/* Total Filtrado */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                        <p className="text-sm font-medium text-gray-500 uppercase">Total en vista (Filtrado)</p>
                        <p className="text-3xl font-extrabold text-green-700 mt-1">{formatGuarani(totalAcumulado)}</p>
                    </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* ## 🔍 Filtros de Búsqueda */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-wrap gap-4 items-end border border-gray-200">
                    {/* Filtro Cliente */}
                    <div className="flex flex-col flex-grow min-w-[200px]">
                        <label className="text-xs font-medium text-gray-500 mb-1">Cliente</label>
                        <select
                            value={clienteFiltro}
                            onChange={(e) => setClienteFiltro(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                        >
                            <option value="">Todos los clientes</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre} {c.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Producto */}
                    <div className="flex flex-col flex-grow min-w-[200px]">
                        <label className="text-xs font-medium text-gray-500 mb-1">Producto</label>
                        <select
                            value={productoFiltro}
                            onChange={(e) => setProductoFiltro(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                        >
                            <option value="">Todos los productos</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Filtro Fecha Inicio */}
                    <div className="flex flex-col flex-grow min-w-[150px]">
                        <label className="text-xs font-medium text-gray-500 mb-1">Fecha Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                        />
                    </div>

                    {/* Filtro Fecha Fin */}
                    <div className="flex flex-col flex-grow min-w-[150px]">
                        <label className="text-xs font-medium text-gray-500 mb-1">Fecha Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                        />
                    </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* ## 📜 Tabla de Ventas Filtradas */}
                {/* ------------------------------------------------------------- */}
                {ventasFiltradas.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <p className="text-gray-500 py-4 text-center">No hay ventas registradas que coincidan con los filtros aplicados en el conjunto del último mes.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-200">
                        <table className="min-w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold">
                                    <th className="px-4 py-3 rounded-tl-xl">Cliente</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-center">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3">Forma de Pago</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 rounded-tr-xl">Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ventasFiltradas.map((v) => {
                                    const cliente = clientes.find(c => c.id === v.clienteId);
                                    const producto = productos.find(p => p.id === v.productoId);

                                    const pagoBadgeClase = v.pagado
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800";
                                    
                                    const formaPagoClase = v.formaDePago === "contado"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800";

                                    return (
                                        <tr key={v.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{cliente ? `${cliente.nombre} ${cliente.apellido}` : "—"}</td>
                                            <td className="px-4 py-3 text-gray-700">{producto ? producto.nombre : "—"}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{v.cantidad}</td>
                                            <td className="px-4 py-3 font-bold text-gray-900 text-right">{formatGuarani(v.total)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${formaPagoClase}`}>
                                                    {v.formaDePago === "contado" ? "Contado" : "Crédito"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pagoBadgeClase}`}>
                                                    {v.pagado ? "Pagado" : "Pendiente"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {v.fecha?.toDate ? v.fecha.toDate().toLocaleString("es-PY") : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* ------------------------------------------------------------- */}
                {/* ## 📈 Resumen por Producto (si hay resultados) */}
                {/* ------------------------------------------------------------- */}
                {totalesPorProducto.length > 0 && (
                    <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Resumen de Ventas por Producto (Filtrado)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {totalesPorProducto.map((tp, index) => (
                                <div key={index} className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-600 font-medium">{tp.nombre}</p>
                                    <p className="text-lg font-bold text-indigo-600">{formatGuarani(tp.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}