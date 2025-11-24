export default function MessageBanner({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div
      className={`mb-6 text-center font-bold py-3 rounded-lg ${
        mensaje.tipo === "success"
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-red-100 text-red-700 border border-red-300"
      }`}
    >
      {mensaje.texto}
    </div>
  );
}
