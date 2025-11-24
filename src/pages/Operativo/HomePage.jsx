import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getDocs
} from "firebase/firestore";

// 🚀 IMPORTAR TOAST
import toast, { Toaster } from 'react-hot-toast';

import ClientesSection from "../../components/ClientesSection";
import ProductosSection from "../../components/ProductosSection";

export default function HomePage() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [cantidades, setCantidades] = useState({});
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();
  const productosRef = collection(db, "productos");
  const clientesRef = collection(db, "clientes");
  const ventasRef = collection(db, "ventas");

  // ... (Cargar productos, clientes, ventas - sin cambios)
  const cargarProductos = async () => {
    try {
      const snap = await getDocs(productosRef);
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const initCant = {};
      prods.forEach(p => (initCant[p.id] = 1));
      setProductos(prods);
      setCantidades(initCant);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar la lista de productos.");
    }
  };

  const cargarClientes = async () => {
    try {
      const snap = await getDocs(clientesRef);
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(cls);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error("Error al cargar la lista de clientes.");
    }
  };

  const cargarVentas = async () => {
    try {
      const snap = await getDocs(ventasRef);
      const vts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVentas(vts);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      toast.error("Error al cargar el historial de ventas.");
    }
  };

  useEffect(() => {
    const cargarTodo = async () => {
      setCargando(true);
      await Promise.all([cargarProductos(), cargarClientes(), cargarVentas()]);
      setCargando(false);
    };
    cargarTodo();
  }, []);


  // 🔹 FUNCIÓN PARA MOSTRAR TOASTS (reemplaza setMensaje)
  const mostrarToast = (tipo, mensaje, duracion = 5000) => {
    if (tipo === 'success') {
      toast.success(mensaje, { duration: duracion });
    } else if (tipo === 'error') {
      toast.error(mensaje, { duration: duracion });
    } else {
      toast(mensaje, { duration: duracion, style: { background: '#fff', color: '#333' } });
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-indigo-600 text-xl font-medium flex items-center space-x-2">
          {/* Puedes añadir un spinner de carga aquí */}
          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando datos iniciales...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* 🚀 TOASTER para notificaciones */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-indigo-700 mb-2 tracking-tight">
                    🛒 Punto de Venta Rápido
                </h1>
                <p className="text-gray-500 text-lg">
                    Bienvenido. Selecciona un cliente y procede a registrar la venta.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ------------------------------------------- */}
                {/* CLIENTES - COLUMNA 1 */}
                {/* ------------------------------------------- */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-2xl sticky top-8 border-t-4 border-indigo-500 h-full">
                        <ClientesSection
                            clientes={clientes}
                            clienteSeleccionado={clienteSeleccionado}
                            setClienteSeleccionado={setClienteSeleccionado}
                            navigate={navigate}
                        />
                    </div>
                </div>

                {/* ------------------------------------------- */}
                {/* PRODUCTOS & VENTA - COLUMNA 2/3 */}
                {/* ------------------------------------------- */}
                <div className="lg:col-span-2">
                    <ProductosSection
                        productos={productos}
                        cantidades={cantidades}
                        setCantidades={setCantidades}
                        clienteSeleccionado={clienteSeleccionado}
                        clientes={clientes}
                        setClientes={setClientes}
                        cargarVentas={cargarVentas}
                        // 🚀 Se pasa la función de toast
                        setMensaje={mostrarToast}
                        navigate={navigate}
                    />
                </div>
            </div>
      </div>
    </div>
  );
}