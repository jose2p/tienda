import { formatGuarani } from "../utils/format";

export default function ClientesSection({ clientes, clienteSeleccionado, setClienteSeleccionado, navigate }) {
  const hayClientes = clientes.length > 0;

  return (
    <section className="mb-12 bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Clientes</h2>

      {hayClientes ? (
        <div className="space-y-4 max-w-md">
          <label className="block text-sm font-medium text-gray-700">
            Seleccione un cliente
          </label>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido} — Crédito: {formatGuarani(c.credito.toFixed(2))}
              </option>
            ))}
          </select>

          {clienteSeleccionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Cliente seleccionado:{" "}
                <strong>
                  {clientes.find(c => c.id === clienteSeleccionado)?.nombre}{" "}
                  {clientes.find(c => c.id === clienteSeleccionado)?.apellido}
                </strong>
              </p>
              <p className="text-sm mt-1">
                Crédito disponible:{" "}
                <span className={`font-semibold ${
                  clientes.find(c => c.id === clienteSeleccionado)?.credito < 10000
                    ? "text-red-600"
                    : clientes.find(c => c.id === clienteSeleccionado)?.credito < 50000
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}>
                  {formatGuarani(
                    clientes.find(c => c.id === clienteSeleccionado)?.credito.toFixed(2)
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-500">No hay clientes registrados.</p>
      )}

      <button
        onClick={() => navigate("/clientes")}
        className="mt-6 w-full py-2 rounded-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
      >
        Gestionar Cliente
      </button>
    </section>
  );
}
