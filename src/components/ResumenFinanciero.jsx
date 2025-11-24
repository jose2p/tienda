import { formatGuarani } from "../utils/format";

export default function ResumenFinanciero({ capitales = [] }) { 
  
  // Calcular el Capital General (sumando los saldos de todos los productos)
  const capitalGeneral = capitales.reduce(
    // Aseguramos que item.capital sea un número, usando 0 como fallback
    (acc, item) => acc + (Number(item.capital) || 0), 
    0
  );

  return (
    <div className="mb-10">
      
      {/* 🔹 SECCIÓN 1: CAPITALES INDIVIDUALES (SEPARADOS) */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">💰 Capital por Producto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Solo mostramos los items que tienen un saldo válido */}
          {capitales.filter(c => c.capital !== undefined).length > 0 ? (
            capitales.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-md">
                <h4 className="text-lg font-bold text-gray-700 uppercase mb-1">{item.id}</h4> 
                <p className="text-3xl font-extrabold text-blue-600">
                  {formatGuarani(Number(item.capital) || 0)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 p-4">No hay saldos de capital registrados.</p>
          )}
        </div>
      </div>
      
      {/* --- Separador visual --- */}
      <hr className="my-8" />
      
      {/* 🔸 SECCIÓN 2: CAPITAL GENERAL (TOTAL) */}
      <div className="w-full">
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-1">🏦 Capital General Total</h3>
          <p className="text-4xl font-extrabold">
            {formatGuarani(capitalGeneral)}
          </p>
        </div>
      </div>
    </div>
  );
}