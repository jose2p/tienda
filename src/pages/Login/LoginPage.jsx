import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Si ya hay sesión, redirigir al home
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); // limpiar error previo
    try {
      // Convertir username a email ficticio
      const email = `${username}@miempresa.com`;
      await login(email, password);

      // Redirigir al home
      navigate("/");
    } catch (e) {
      setError("❌ Contraseña incorrecta");
      // borrar el mensaje automáticamente después de 3 segundos
      setTimeout(() => setError(""), 4000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4">Iniciar sesión</h1>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-4"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* Mensaje de error */}
        {error && (
          <div className="text-red-600 font-bold text-center mb-4 text-lg">
            {error}
          </div>
        )}

        <button className="bg-indigo-600 text-white w-full py-2 rounded">
          Entrar
        </button>

        {/* Link hacia registro */}
        <p className="text-sm text-center mt-4">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-indigo-600 font-bold">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
}
