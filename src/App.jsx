import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas existentes
import HomePage from "./pages/Operativo/HomePage";
import ClientsPage from "./pages/Operativo/ClientsPage";
import HistorialPage from "./pages/Contabilidad/HistorialPage";
import FinancialPage from "./pages/Contabilidad/FinancialPage";
import CreditosPage from "./pages/Operativo/CreditosPage";
import InventarioPage from "./pages/Operativo/InventarioPage";

// Navbar
import Navbar from "./components/Navbar";

// Auth y protección
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Nueva página de administración para creación de usuarios
import RegisterPage from "./pages/Login/RegisterPage";
import LoginPage from "./pages/Login/LoginPage";
import SessionWatcher from "./components/SessionWatcher";
 

function App() {
  // 👉 Estados globales compartidos entre páginas
  const [ventas, setVentas] = useState([]);       // Lista de ventas
  const [clientes, setClientes] = useState([]);   // Lista de clientes
  const [productos, setProductos] = useState([]); // Lista de productos
  const [deudas, setDeudas] = useState([]);       // Lista de deudas/pagos de crédito

  // 👉 Funciones de edición/eliminación de ventas (ejemplo)
  const editarVenta = (venta) => { /* lógica */ };
  const eliminarVenta = (id) => { /* lógica */ };
  const guardarVentaEditada = () => { /* lógica */ };

  // 👉 Función para registrar pago de deuda
  const registrarPagoDeuda = (clienteId, monto) => {
    setDeudas(prev => [
      ...prev,
      { clienteId, monto, fecha: new Date() }
    ]);

    // Actualizar deuda en clientes
    setClientes(prev =>
      prev.map(c =>
        c.id === clienteId
          ? { ...c, deudaActual: (c.deudaActual || 0) - monto }
          : c
      )
    );
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <SessionWatcher /> 
        <Routes>
          {/* Página principal de ventas (requiere login) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage
                  ventas={ventas}
                  setVentas={setVentas}
                  clientes={clientes}
                  setClientes={setClientes}
                  productos={productos}
                  setProductos={setProductos}
                />
              </ProtectedRoute>
            }
          />

          {/* Gestión de clientes (requiere login) */}
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />

          {/* Historial de ventas (requiere login) */}
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <HistorialPage
                  ventas={ventas}
                  clientes={clientes}
                  productos={productos}
                  editarVenta={editarVenta}
                  eliminarVenta={eliminarVenta}
                  guardarVentaEditada={guardarVentaEditada}
                />
              </ProtectedRoute>
            }
          />

          {/* Gestión de inventario (requiere login) */}
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <InventarioPage />
              </ProtectedRoute>
            }
          />

          {/* Finanzas (requiere login; si quieres, podemos exigir admin en esta página) */}
          <Route
            path="/financial"
            element={
              <ProtectedRoute>
                <FinancialPage />
              </ProtectedRoute>
            }
          />

          {/* Gestión de créditos y pagos (requiere login) */}
          <Route
            path="/deudas"
            element={
              <ProtectedRoute>
                <CreditosPage
                  clientes={clientes}
                  setClientes={setClientes}
                  deudas={deudas}
                  registrarPagoDeuda={registrarPagoDeuda}
                />
              </ProtectedRoute>
            }
          />

          {/* Administración: crear usuarios */}
          <Route
            path="/register"
            element={
                <RegisterPage />
            }
          />

          {/* Login público */}
          <Route path="/login" element={<LoginPage/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
