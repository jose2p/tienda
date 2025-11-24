import { useState, useMemo } from 'react';
import { formatGuarani } from "../utils/format";

export default function TablaMovimientos({ movimientos, rol, abrirModal }) {
    // 🔍 Estados para los filtros
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState(""); // 'ingreso', 'egreso', o ''

    // Función para convertir la fecha del movimiento a Date
    const parseFecha = (mov) => {
        if (mov.fecha?.toDate) return mov.fecha.toDate();
        if (mov.fecha) return new Date(mov.fecha);
        return null;
    };

    // 🚀 Lógica de filtrado usando useMemo para optimizar
    const movimientosFiltrados = useMemo(() => {
        return movimientos.filter(m => {
            const fechaMovimiento = parseFecha(m);

            // Filtro por Tipo
            const coincideTipo = tipoFiltro ? m.tipo === tipoFiltro : true;

            // Filtro por Rango de Fechas
            const coincideFechaInicio = fechaInicio 
                ? fechaMovimiento && fechaMovimiento >= new Date(fechaInicio + "T00:00:00") 
                : true;

            const coincideFechaFin = fechaFin 
                ? fechaMovimiento && fechaMovimiento <= new Date(fechaFin + "T23:59:59") 
                : true;

            return coincideTipo && coincideFechaInicio && coincideFechaFin;
        });
    }, [movimientos, fechaInicio, fechaFin, tipoFiltro]);

    // 💰 Cálculo de Totales Filtrados
    const totalIngresos = movimientosFiltrados
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + (m.monto || 0), 0);

    const totalEgresos = movimientosFiltrados
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + (m.monto || 0), 0);
        
    const balance = totalIngresos - totalEgresos;


    return (
        <div className="space-y-6">
            
            {/* -------------------------------------------------- */}
            {/* ## 🔍 Controles de Filtrado */}
            {/* -------------------------------------------------- */}
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner flex flex-wrap gap-4 items-end">
                <div className="flex flex-col grow min-w-[150px]">
                    <label className="text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm bg-white"
                    >
                        <option value="">Todos</option>
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                    </select>
                </div>
                
                <div className="flex flex-col grow min-w-[150px]">
                    <label className="text-xs font-medium text-gray-600 mb-1">Fecha Desde</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm bg-white"
                    />
                </div>

                <div className="flex flex-col grow min-w-[150px]">
                    <label className="text-xs font-medium text-gray-600 mb-1">Fecha Hasta</label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm bg-white"
                    />
                </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* ## 💸 Resumen de Totales Filtrados */}
            {/* -------------------------------------------------- */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg border border-green-300">
                    <p className="text-sm text-green-700 font-medium">Total Ingresos</p>
                    <p className="text-xl font-bold text-green-900">{formatGuarani(totalIngresos)}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-300">
                    <p className="text-sm text-red-700 font-medium">Total Egresos</p>
                    <p className="text-xl font-bold text-red-900">{formatGuarani(totalEgresos)}</p>
                </div>
                <div className={`p-3 rounded-lg border ${balance >= 0 ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-200 border-gray-400'}`}>
                    <p className="text-sm text-gray-700 font-medium">Balance Filtrado</p>
                    <p className={`text-xl font-bold ${balance >= 0 ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {formatGuarani(balance)}
                    </p>
                </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* ## 📋 Tabla de Movimientos */}
            {/* -------------------------------------------------- */}
            {movimientosFiltrados.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-200">
                    <p className="text-gray-500 font-medium">
                        No se encontraron movimientos que coincidan con los filtros aplicados.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-200">
                    <table className="min-w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold">
                                <th className="px-4 py-3 rounded-tl-xl">Fecha</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 rounded-tr-xl">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movimientosFiltrados.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    {/* Fecha */}
                                    <td className="px-4 py-3 text-gray-700">
                                        {parseFecha(m)?.toLocaleDateString() ?? "Sin fecha"}
                                    </td>

                                    {/* Producto */}
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {m.producto ?? "Sin producto"}
                                    </td>

                                    {/* Tipo */}
                                    <td className="px-4 py-3">
                                        <span 
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                m.tipo === "ingreso" 
                                                    ? "bg-green-100 text-green-700" 
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {m.tipo === "ingreso" ? "INGRESO" : "EGRESO"}
                                        </span>
                                    </td>

                                    {/* Monto */}
                                    <td className={`px-4 py-3 font-bold text-right ${m.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                                        {m.monto !== undefined ? formatGuarani(m.monto) : "0 ₲"}
                                    </td>

                                    {/* Descripción */}
                                    <td className="px-4 py-3 text-gray-600 max-w-xs overflow-hidden truncate">
                                        {m.descripcion ?? "—"}
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-4 py-3">
                                        {rol === "admin" && (
                                            <button
                                                onClick={() => abrirModal("eliminar", m)}
                                                className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full hover:bg-red-600 transition"
                                                title="Eliminar Movimiento"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}