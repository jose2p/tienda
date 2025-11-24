import { useState, useEffect } from "react";
import toast from 'react-hot-toast'; 

// Opciones de productos solicitadas
const PRODUCT_NAMES = ['Detergente', 'Chorizos', 'Combustibles', 'Otros'];

export default function FormularioProducto({ productoInicial, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState({
    nombre: PRODUCT_NAMES[0], // Valor por defecto
    precioCosto: 0, // ⬅️ Representa el Precio de Compra
    precioVenta: 0,
    stock: 0,
    stockMinimo: 5, // ⬅️ Nuevo campo
  });

  useEffect(() => {
    if (productoInicial) {
      setDatos({
        id: productoInicial.id,
        nombre: productoInicial.nombre,
        precioCosto: productoInicial.precioCosto,
        precioVenta: productoInicial.precioVenta,
        stock: productoInicial.stock,
        stockMinimo: productoInicial.stockMinimo ?? 5,
      });
    }
  }, [productoInicial]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) : value; 
    setDatos(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!datos.nombre || datos.precioVenta <= 0 || datos.stock < 0 || datos.precioCosto < 0 || datos.stockMinimo < 0) {
      toast.error("Por favor, complete todos los campos requeridos correctamente.");
      return;
    }
    onGuardar(datos);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {productoInicial ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <select
              name="nombre"
              value={datos.nombre}
              onChange={handleChange}
              required
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {PRODUCT_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Precio de Compra (₲):</label>
            <input
              type="number"
              name="precioCosto" 
              value={datos.precioCosto}
              onChange={handleChange}
              min="0"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Precio de Venta (₲):</label>
            <input
              type="number"
              name="precioVenta"
              value={datos.precioVenta}
              onChange={handleChange}
              min="0"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>

          <div className="flex justify-between space-x-4">
            <div className="mb-6 w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Stock Actual:</label>
              <input
                type="number"
                name="stock"
                value={datos.stock}
                onChange={handleChange}
                min="0"
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>
            <div className="mb-6 w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Stock Mínimo (Alerta):</label>
              <input
                type="number"
                name="stockMinimo"
                value={datos.stockMinimo}
                onChange={handleChange}
                min="0"
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {productoInicial ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}