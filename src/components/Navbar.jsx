import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <nav className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div className="text-2xl font-extrabold text-white tracking-wide">
                        MiVenta
                    </div>

                    {/* Botón hamburguesa (solo móvil) */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setOpen(!open)}
                            className="text-white focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {open ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Links desktop */}
                    <div className="hidden md:flex space-x-6">
                        <NavLink to="/" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Inicio</NavLink>

                        <NavLink to="/historial" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Historial de Ventas</NavLink>

                        <NavLink to="/deudas" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Deudas</NavLink>

                        <NavLink to="/inventario" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Inventario</NavLink>

                        <NavLink to="/clientes" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Clientes</NavLink>

                        <NavLink to="/financial" className={({ isActive }) =>
                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? "bg-white text-indigo-700 shadow-md" : "text-white hover:bg-indigo-500 hover:text-yellow-200"
                            }`
                        }>Finanzas</NavLink>

                        {/* Botón Logout */}
                        {user && (
                            <>
                                <span className="text-white font-medium mr-4">
                                    Hola, {user.username}
                                </span>
                                <button
                                    onClick={logout}
                                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Links móvil */}
            {open && (
                <div className="md:hidden px-4 pb-4 space-y-2">
                    <NavLink to="/" className="block text-white hover:text-yellow-200">Inicio</NavLink>
                    <NavLink to="/historial" className="block text-white hover:text-yellow-200">Historial</NavLink>
                    <NavLink to="/deudas" className="block text-white hover:text-yellow-200">Deudas</NavLink>
                    <NavLink to="/inventario" className="block text-white hover:text-yellow-200">Inventario</NavLink>
                    <NavLink to="/clientes" className="block text-white hover:text-yellow-200">Clientes</NavLink>
                    <NavLink to="/financial" className="block text-white hover:text-yellow-200">Finanzas</NavLink>

                    {/* Botón Logout móvil */}
                    {user && (
                        <>
                            <span className="block text-white font-medium">
                                Hola, {user.username}
                            </span>
                            <button
                                onClick={logout}
                                className="block w-full text-left text-white bg-red-600 px-3 py-2 rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </>
                    )}

                </div>
            )}
        </nav>
    );
}
