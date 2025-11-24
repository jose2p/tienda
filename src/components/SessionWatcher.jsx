import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SessionWatcher() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!user) return; // ✅ no iniciar timers si no hay sesión

    let logoutTimer;
    let warningTimer;

    const resetTimers = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);

      // ⏰ Aviso a los 5h55m (21.300.000 ms)
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, 1500000);

      // ⏰ Logout a las 6h (21.600.000 ms)
      logoutTimer = setTimeout(() => {
        logout();
        navigate("/login");
      }, 1800000);
    };

    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    events.forEach(ev => window.addEventListener(ev, resetTimers));

    resetTimers(); // iniciar al montar

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
      events.forEach(ev => window.removeEventListener(ev, resetTimers));
    };
  }, [user, logout, navigate]);

  const continuarSesion = () => {
    setShowWarning(false);
    // Reinicia los timers manualmente
    const event = new Event("mousemove");
    window.dispatchEvent(event);
  };

  if (!user) return null; // ✅ no renderizar nada si no hay sesión

  return (
    <>
      {showWarning && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-lg">
          <p className="font-bold mb-2">⚠️ Tu sesión está por expirar</p>
          <p className="text-sm mb-3">Se cerrará en 5 minutos por inactividad.</p>
          <button
            onClick={continuarSesion}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Continuar sesión
          </button>
        </div>
      )}
    </>
  );
}
