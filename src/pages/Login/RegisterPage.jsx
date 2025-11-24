import { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Navigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // ✅ Si ya hay sesión, redirigir al home
  if (user) {
    return <Navigate to="/login" replace />;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (codigo !== "admin123") {
      setError("❌ Código de registro inválido");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const email = `${username}@miempresa.com`;
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        username,
        rol: "usuario"
      });

      setSuccess("✅ Cuenta creada con éxito, ya puedes iniciar sesión");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("❌ Error al crear la cuenta: " + err.message);
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4">Registro</h1>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-4"
          placeholder="Código de registro"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
        />

        {error && <div className="text-red-600 font-bold mb-4">{error}</div>}
        {success && <div className="text-green-600 font-bold mb-4">{success}</div>}

        <button className="bg-indigo-600 text-white w-full py-2 rounded">
          Crear cuenta
        </button>
        {/* Link hacia registro */}
        <p className="text-sm text-center mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-indigo-600 font-bold">
            Iniciar Sesion
          </Link>
        </p>
      </form>
    </div>
  );
}
