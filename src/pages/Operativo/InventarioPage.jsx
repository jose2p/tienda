import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
        collection,
        getDocs,
        addDoc,
        updateDoc,
        deleteDoc,
        doc,
        getDoc,
        setDoc,
        query, // ⬅️ Nuevo para consultas
        where // ⬅️ Nuevo para consultas
} from "firebase/firestore";
import toast, { Toaster } from 'react-hot-toast';

// Componentes Requeridos
import FormularioProducto from "../../components/FormularioProducto";
import { formatGuarani } from "../../utils/format";

export default function InventarioPage() {
        const [productos, setProductos] = useState([]);
        const [cargando, setCargando] = useState(true);
        const [productoAEditar, setProductoAEditar] = useState(null);
        const [mostrarFormulario, setMostrarFormulario] = useState(false);

        // Referencias a colecciones
        const productosRef = collection(db, "productos");
        const finanzasRef = collection(db, "finanzas");

        // 🔹 Cargar Productos
        const cargarProductos = async () => {
                try {
                        const snap = await getDocs(productosRef);
                        const prods = snap.docs.map(d => ({
                                id: d.id,
                                ...d.data(),
                                stockMinimo: d.data().stockMinimo ?? 5
                        }));
                        setProductos(prods);
                } catch (error) {
                        toast.error("Error al cargar productos: " + error.message);
                } finally {
                        setCargando(false);
                }
        };


        // 🚀 🔹 2. Crear/Editar Producto (Lógica de Compra y Capital por Producto)
        const guardarProducto = async (datos) => {
                const { id, stock: nuevoStock, precioCosto, nombre, ...rest } = datos;
                setMostrarFormulario(false);
                setProductoAEditar(null);

                // 1. Obtener la clave del capital en MINÚSCULAS
                const nombreCapital = nombre.toLowerCase();

                try {
                        let stockAnterior = 0;

                        // 🚨 Importante: Necesitamos obtener el stock anterior
                        // si no hay ID, pero el producto YA existe por nombre.

                        if (id) {
                                const productoAnterior = productos.find(p => p.id === id);
                                stockAnterior = productoAnterior?.stock || 0;
                        } else {
                                // Si no hay ID, chequeamos si existe por nombre para obtener el stock anterior
                                const qExistente = query(productosRef, where("nombre", "==", nombre));
                                const snapExistente = await getDocs(qExistente);
                                if (!snapExistente.empty) {
                                        stockAnterior = snapExistente.docs[0].data().stock || 0;
                                }
                        }


                        const stockComprado = nuevoStock - stockAnterior;
                        let costoCompra = 0;

                        // ⚠️ Lógica de Compra y Capital por Producto ⚠️
                        if (stockComprado > 0) {
                                costoCompra = stockComprado * precioCosto;

                                // 2. Obtener la referencia al documento de capital
                                const productoCapitalDocRef = doc(db, "capitales", nombreCapital);
                                const capitalSnap = await getDoc(productoCapitalDocRef);

                                let capitalDisponibleProducto = 0;
                                if (capitalSnap.exists()) {
                                        capitalDisponibleProducto = capitalSnap.data().capital || 0;
                                } else {
                                        await setDoc(productoCapitalDocRef, { capital: 0 });
                                        capitalDisponibleProducto = 0;
                                }

                                // 3. Verificar el Capital
                                if (costoCompra > capitalDisponibleProducto) {
                                        toast.error(`🚨 Capital Insuficiente para "${nombre}": Necesitas ${formatGuarani(costoCompra)}, solo tienes ${formatGuarani(capitalDisponibleProducto)} asignado.`);
                                        return;
                                }

                                // 4. Actualizar el Capital del Producto (Egreso)
                                const nuevoCapitalProducto = capitalDisponibleProducto - costoCompra;
                                await setDoc(productoCapitalDocRef, { capital: nuevoCapitalProducto });

                                // 5. Registrar la Transacción (Egreso)
                                await addDoc(finanzasRef, {
                                        descripcion: `Compra de ${stockComprado} unidades de ${nombre} (Inventario)`,
                                        fecha: new Date(),
                                        monto: -costoCompra,
                                        tipo: "Egreso",
                                        producto: nombre
                                });
                                toast.success(`💸 Egreso de ${formatGuarani(costoCompra)} registrado de capital para "${nombre}". Capital restante: ${formatGuarani(nuevoCapitalProducto)}`);

                        } else if (stockComprado < 0) {
                                toast.warn(`⚠️ Stock de ${nombre} ajustado a la baja. No hay movimiento de capital.`);
                        }

                        // 6. Guardar/Actualizar los datos del Producto (Inventario)
                        const productoData = { nombre, precioCosto, stock: nuevoStock, ...rest };

                        if (id) {
                                // Caso 1: Actualizar un producto EXISTENTE (desde la tabla)
                                const productoDoc = doc(db, "productos", id);
                                await updateDoc(productoDoc, productoData);
                                toast.success(`✅ Producto "${nombre}" actualizado en inventario.`);
                        } else {
                                // Caso 2: Intento de CREACIÓN, verificar si ya existe por nombre.

                                const q = query(productosRef, where("nombre", "==", nombre));
                                const snapshot = await getDocs(q);

                                if (!snapshot.empty) {
                                        // ⚠️ Actualización: Si existe, actualizamos usando el ID encontrado.
                                        const productoExistente = snapshot.docs[0];
                                        const productoId = productoExistente.id;

                                        const productoDoc = doc(db, "productos", productoId);
                                        await updateDoc(productoDoc, productoData);

                                        toast.success(`✅ Stock de "${nombre}" actualizado. Se encontró el producto existente y se ajustó el stock.`);

                                } else {
                                        // Creación: Si NO existe, se crea.
                                        await addDoc(productosRef, productoData);
                                        toast.success(`✅ Nuevo producto "${nombre}" agregado al inventario!`);
                                }
                        }

                        await cargarProductos(); // Recargar la lista
                } catch (error) {
                        toast.error("Error al guardar el producto: " + error.message);
                }
        };

        // 🔹 3. Eliminar Producto (Usa el Toast de confirmación)
        const eliminarProducto = async (id, nombre) => {
                const procederEliminar = async () => {
                        try {
                                const productoDoc = doc(db, "productos", id);
                                await deleteDoc(productoDoc);
                                toast.success(`🗑️ Producto "${nombre}" eliminado con éxito.`);
                                await cargarProductos();
                        } catch (error) {
                                toast.error("Error al eliminar el producto: " + error.message);
                        }
                };

                toast((t) => (
                        <div className="flex flex-col space-y-2">
                                <p className="font-semibold text-gray-800">
                                        ¿Estás seguro de eliminar <span className="text-red-600 font-bold">"{nombre}"</span>?
                                </p>
                                <div className="flex justify-end space-x-2">
                                        <button
                                                onClick={() => {
                                                        toast.dismiss(t.id);
                                                        procederEliminar();
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition"
                                        >
                                                Sí, Eliminar
                                        </button>
                                        <button
                                                onClick={() => toast.dismiss(t.id)}
                                                className="bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded hover:bg-gray-300 transition"
                                        >
                                                Cancelar
                                        </button>
                                </div>
                        </div>
                ), { duration: Infinity, style: { maxWidth: '400px', padding: '12px' } });
        };


        useEffect(() => {
                cargarProductos();
        }, []);


        if (cargando) {
                return (
                        <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
                                Cargando inventario...
                        </div>
                );
        }

        return (
                <div className="min-h-screen bg-gray-100 p-8">
                        <Toaster position="top-right" reverseOrder={false} />

                        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                                <div>📦 Gestión de Inventario</div>
                        </h1>

                        <button
                                onClick={() => { setProductoAEditar(null); setMostrarFormulario(true); }}
                                className="mb-6 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition shadow"
                        >
                                + Agregar Nuevo Producto
                        </button>

                        {mostrarFormulario && (
                                <FormularioProducto
                                        productoInicial={productoAEditar}
                                        onGuardar={guardarProducto}
                                        onCerrar={() => { setMostrarFormulario(false); setProductoAEditar(null); }}
                                />
                        )}

                        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                                <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Compra</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ganancia (Und)</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                                {productos.map((p) => {
                                                        const stockBajo = p.stock <= p.stockMinimo;

                                                        // Cálculo simple de la Ganancia Bruta
                                                        const gananciaBruta = p.precioVenta - p.precioCosto;

                                                        // Definimos una clase para el color (verde si gana, rojo si pierde o es cero)
                                                        const gananciaClase = gananciaBruta > 0 ? 'text-green-600 font-bold' : 'text-red-500';

                                                        return (
                                                                <tr key={p.id} className={stockBajo ? 'bg-yellow-50 hover:bg-yellow-100 transition' : 'hover:bg-gray-50'}>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatGuarani(p.precioCosto)}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{formatGuarani(p.precioVenta)}</td>
                                                                        {/* Celda de la Ganancia Bruta (Monto) */}
                                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${gananciaClase}`}>
                                                                                {formatGuarani(gananciaBruta)}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                {p.stock} {stockBajo ? ' 🚨' : ''}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.stockMinimo}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                                <button
                                                                                        onClick={() => { setProductoAEditar(p); setMostrarFormulario(true); }}
                                                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                                                >
                                                                                        Editar
                                                                                </button>
                                                                                <button
                                                                                        onClick={() => eliminarProducto(p.id, p.nombre)}
                                                                                        className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                        Eliminar
                                                                                </button>
                                                                        </td>
                                                                </tr>
                                                        )
                                                })}
                                        </tbody>
                                </table>
                        </div>
                </div>
        );
}