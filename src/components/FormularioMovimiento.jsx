export default function FormularioMovimiento({ nuevoMovimiento, setNuevoMovimiento, abrirModal }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Registrar movimiento</h2>
      <div className="flex space-x-2 flex-wrap">
        <select
          value={nuevoMovimiento.producto}
          onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, producto: e.target.value })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="detergente">Detergente</option>
          <option value="chorizos">Chorizos</option>
          <option value="combustibles">Combustibles</option>
        </select>

        <select
          value={nuevoMovimiento.tipo}
          onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>

        <input
          type="number"
          placeholder="Monto"
          value={nuevoMovimiento.monto}
          onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />

        <input
          type="text"
          placeholder="Descripción"
          value={nuevoMovimiento.descripcion}
          onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, descripcion: e.target.value })}
          className="px-3 py-2 border rounded-md w-64"
        />

        <button
          onClick={() => abrirModal("agregar")}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
