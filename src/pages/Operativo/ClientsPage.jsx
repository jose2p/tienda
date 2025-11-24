import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { formatGuarani } from "../../utils/format";

import toast, { Toaster } from 'react-hot-toast'; 
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", apellido: "", credito: "" });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [accion, setAccion] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const navigate = useNavigate();
  const clientesRef = collection(db, "clientes");

  // Contraseña configurable (se mantiene aunque no se use en esta versión)
  const [PASSWORD, setPASSWORD] = useState("admin123");

  const cargarClientes = async () => {
    try {
        const snap = await getDocs(clientesRef);
        const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClientes(cls);
    } catch (error) {
        toast.error("Error al cargar clientes.");
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const manejarCambio = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Abrir modal
  const abrirModal = (accion, cliente = null) => {
    setAccion(accion);
    setClienteSeleccionado(cliente);
    setMostrarModal(true);
  };

  // 🔹 Confirmar acción (con notificaciones toast)
  const confirmarAccion = async () => {
    // Cierre del modal anticipado para evitar clics dobles
    setMostrarModal(false); 
    
    if (accion === "guardar") {
      if (!formData.nombre || !formData.apellido || isNaN(formData.credito) || formData.credito === "") {
        toast.error("Error: Todos los campos son obligatorios y el crédito debe ser un número válido.");
        return;
      }

      try {
        const creditoNumerico = Number(formData.credito);
        
        if (modoEdicion) {
          const clienteDoc = doc(db, "clientes", modoEdicion);
          await updateDoc(clienteDoc, {
            nombre: formData.nombre,
            apellido: formData.apellido,
            credito: creditoNumerico
          });
          toast.success(`Cliente ${formData.nombre} actualizado correctamente. ✅`);
        } else {
          await addDoc(clientesRef, {
            nombre: formData.nombre,
            apellido: formData.apellido,
            credito: creditoNumerico,
            creado: serverTimestamp()
          });
          toast.success(`Cliente ${formData.nombre} creado con éxito. 🎉`);
        }
      } catch (error) {
        toast.error("Ocurrió un error al guardar los datos: " + error.message);
      }


      setFormData({ nombre: "", apellido: "", credito: "" });
      setModoEdicion(null);
      cargarClientes();
    }

    if (accion === "eliminar") {
      try {
        await deleteDoc(doc(db, "clientes", clienteSeleccionado.id));
        toast.success(`Cliente ${clienteSeleccionado.nombre} eliminado permanentemente. 🗑️`);
        cargarClientes();
      } catch (error) {
        toast.error("Ocurrió un error al eliminar el cliente: " + error.message);
      }
    }

    // if (accion === "cambiarPassword") { ... }
  };

  const editarCliente = (cliente) => {
    setModoEdicion(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      credito: cliente.credito.toString() // Aseguramos que sea string para el input
    });
  };
    
  const cancelarEdicion = () => {
    setModoEdicion(null);
    setFormData({ nombre: "", apellido: "", credito: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
        <Toaster position="top-right" reverseOrder={false} /> 
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">👥 Gestión de Clientes</h1>

      
        {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-10 max-w-lg mx-auto border-t-4 border-indigo-500">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {modoEdicion ? "✏️ Editar Cliente" : "➕ Crear Nuevo Cliente"}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del Cliente"
            value={formData.nombre}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellido del Cliente"
            value={formData.apellido}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <input
            type="number"
            name="credito"
            placeholder="Monto Máximo de Crédito"
            value={formData.credito}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <div className="flex space-x-2">
                <button
                    onClick={() => abrirModal("guardar")}
                    className="grow py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition shadow-md"
                >
                    {modoEdicion ? "Actualizar Cliente" : "Guardar Cliente"}
                </button>
                {modoEdicion && (
                    <button
                        onClick={cancelarEdicion}
                        className="py-2 px-4 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition shadow-md"
                    >
                        Cancelar Edición
                    </button>
                )}
            </div>
        </div>
      </div>
        
        <hr className="mb-8" />

      {/* LISTADO DE CLIENTES */}
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 Lista de Clientes ({clientes.length})</h2>

        {clientes.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">No hay clientes registrados en la base de datos.</p>
        ) : (
          <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                      <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Crédito Máximo</th>
                      <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientes.map((c) => (
                      <tr key={c.id} className="hover:bg-indigo-50/20 transition">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{c.nombre}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{c.apellido}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-indigo-700 text-right">{formatGuarani(c.credito)}</td>
                        <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => editarCliente(c)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition shadow-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => abrirModal("eliminar", c)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition shadow-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                    </tr>
                  ))}
                  </tbody>
              </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm transform transition-all">
            <h2 className={`text-xl font-bold mb-3 ${accion === 'eliminar' ? 'text-red-700' : 'text-indigo-700'}`}>
              {accion === "guardar"
                ? (modoEdicion ? "📝 Confirmar Actualización" : "✅ Confirmar Creación")
                : accion === "eliminar"
                ? "⚠️ Confirmar Eliminación"
                : "❓ Confirmar Acción"}
            </h2>
            <p className="mb-6 text-gray-700">
                {accion === "guardar"
                    ? "Revisa bien los datos del cliente antes de guardarlos."
                    : accion === "eliminar"
                    ? `Estás a punto de eliminar a ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}. Esta acción es **irreversible**.`
                    : "Confirma esta acción."}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                className={`px-4 py-2 text-white font-medium rounded-md transition ${accion === 'eliminar' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}