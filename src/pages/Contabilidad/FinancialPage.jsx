import { useState } from "react";
import { useUsuarioConRol } from "../../hooks/useUsuarioConRol";
import { useFinanzas } from "../../hooks/useFinanzas";
import ResumenFinanciero from "../../components/ResumenFinanciero";
import FormularioMovimiento from "../../components/FormularioMovimiento";
import TablaMovimientos from "../../components/TablaMovimientos";
import ModalConfirmacion from "../../components/ModalConfirmacion";

export default function FinanzasPage() {
  const { usuario, rol } = useUsuarioConRol();
  const {
    movimientos,
    capitales, // ⬅️ Esta es la lista que necesitamos
    registrarMovimiento,
    eliminarMovimiento,
    guardarCapital,
    getCapital
  } = useFinanzas(usuario, rol);

  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    producto: "detergente",
    tipo: "ingreso",
    monto: "",
    descripcion: ""
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [accion, setAccion] = useState(null);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  const abrirModal = (accion, movimiento = null) => {
    setAccion(accion);
    setMovimientoSeleccionado(movimiento);
    setMostrarModal(true);
  };

  const confirmarAccion = async () => {
    try {
      if (accion === "agregar") {
        await registrarMovimiento(nuevoMovimiento);
        setNuevoMovimiento({ producto: "detergente", tipo: "ingreso", monto: "", descripcion: "" });
      }
      if (accion === "eliminar") {
        await eliminarMovimiento(movimientoSeleccionado);
      }
    } catch (error) {
      alert(error.message);
    }
    setMostrarModal(false);
  };


  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">Finanzas</h1>

      {/* ✅ CORRECCIÓN CLAVE: Pasamos la lista 'capitales' en lugar de 'getCapital' */}
      <ResumenFinanciero capitales={capitales} />

      <FormularioMovimiento
        nuevoMovimiento={nuevoMovimiento}
        setNuevoMovimiento={setNuevoMovimiento}
        abrirModal={abrirModal}
      />

      <TablaMovimientos
        movimientos={movimientos}
        rol={rol}
        abrirModal={abrirModal}
      />

      {mostrarModal && (
        <ModalConfirmacion
          accion={accion}
          usuario={usuario}
          rol={rol}
          confirmarAccion={confirmarAccion}
          cerrar={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}