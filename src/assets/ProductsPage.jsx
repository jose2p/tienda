import { useState, useEffect } from "react";
import { db } from "../firebase";
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

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", precio: "", password: "" });

  const navigate = useNavigate();

  const productosRef = collection(db, "productos");
  const PASSWORD = "admin123"; // 🔑 Contraseña fija

  const cargarProductos = async () => {
    const snap = await getDocs(productosRef);
    const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setProductos(prods);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const manejarCambio = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validarPassword = () => {
    if (formData.password !== PASSWORD) {
      alert("Contraseña incorrecta ❌");
      return false;
    }
    return true;
  };

  const guardarProducto = async () => {
    if (!validarPassword()) return;

    if (!formData.nombre || !formData.precio || isNaN(formData.precio) || Number(formData.precio) <= 0) {
      alert("Todos los campos son obligatorios y el precio debe ser válido.");
      return;
    }

    if (modoEdicion) {
      const productoDoc = doc(db, "productos", modoEdicion);
      await updateDoc(productoDoc, {
        nombre: formData.nombre,
        precio: Number(formData.precio)
      });
      alert("Producto actualizado ✅");
    } else {
      await addDoc(productosRef, {
        nombre: formData.nombre,
        precio: Number(formData.precio),
        creado: serverTimestamp()
      });
      alert("Producto creado 🎉");
    }

    setFormData({ nombre: "", precio: "", password: "" });
    setModoEdicion(null);
    cargarProductos();
  };

  const editarProducto = (producto) => {
    setModoEdicion(producto.id);
    setFormData({
      nombre: producto.nombre,
      precio: producto.precio,
      password: ""
    });
  };

  const eliminarProducto = async (id) => {
    const pass = prompt("Ingrese la contraseña para eliminar:");
    if (pass !== PASSWORD) {
      alert("Contraseña incorrecta ❌");
      return;
    }
    if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
      await deleteDoc(doc(db, "productos", id));
      alert("Producto eliminado 🗑️");
      cargarProductos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">Gestión de Productos</h1>
      <button
          onClick={() => navigate("/")}
          className="mt-6 w-full py-2 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Volver a la tienda
        </button>

      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          {modoEdicion ? "Editar Producto" : "Crear Producto"}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del producto"
            value={formData.nombre}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={formData.precio}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={manejarCambio}
            className="w-full px-4 py-2 border rounded-md"
          />
          <button
            onClick={guardarProducto}
            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            {modoEdicion ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>

      {/* LISTADO */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Lista de Productos</h2>
        {productos.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3">Nombre</th>
                <th className="py-2 px-3">Precio</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{p.nombre}</td>
                  <td className="py-2 px-3">${p.precio}</td>
                  <td className="py-2 px-3 space-x-2">
                    <button
                      onClick={() => editarProducto(p)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
