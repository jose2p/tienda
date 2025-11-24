export default function ModalConfirmacion({ accion, usuario, rol, confirmarAccion, cerrar }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">
          {accion === "agregar" ? "Confirmar registro" : "Confirmar eliminación"}
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Usuario: {usuario?.email || "desconocido"} | Rol: {rol || "sin rol"}
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={cerrar}
            className="px-4 py-2 bg-gray-400 text-white rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarAccion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
