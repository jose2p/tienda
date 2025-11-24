import { formatGuarani } from "../utils/format";
import RegistrarVenta from "./RegistrarVenta";

export default function ProductosSection({
  productos,
  cantidades,
  setCantidades,
  clienteSeleccionado,
  clientes,
  setClientes,
  cargarVentas,
  setMensaje, // ⬅️ Esta prop ahora es la función 'mostrarToast'
  navigate
}) {
  const hayProductos = productos.length > 0;

  return (
    <section className="mb-12 bg-white rounded-xl shadow-md p-6 w-full">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Productos disponibles</h2>

      <button
        onClick={() => navigate("/inventario")}
        className="mb-6 w-full py-2 rounded-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
      >
        Gestionar Productos
      </button>

      {!hayProductos ? (
        <p className="text-red-500">No hay productos registrados.</p>
      ) : (
        <div className="w-full">
          {productos.map((p) => (
            <div
              key={p.id}
              className="group bg-gray-50 p-6 rounded-xl shadow hover:shadow-lg transition mb-4"
            >
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">
                {p.nombre}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Precio: {formatGuarani(p.precioVenta)}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={cantidades[p.id] ?? 0.5}
                  onChange={(e) =>
                    setCantidades((prev) => ({
                      ...prev,
                      [p.id]: Math.max(0.5, Number(e.target.value) || 0.5),
                    }))
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />

                {/* Componente donde ocurre el registro y el llamado a setMensaje/mostrarToast */}
                <RegistrarVenta
                  producto={p}
                  clienteSeleccionado={clienteSeleccionado}
                  clientes={clientes}
                  cantidades={cantidades}
                  setClientes={setClientes}
                  cargarVentas={cargarVentas}
                  setMensaje={setMensaje} // Pasa la función 'mostrarToast'
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}