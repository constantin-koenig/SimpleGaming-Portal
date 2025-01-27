import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Importiere den AuthProvider
import Login from "./components/Login";
import Callback from "./components/Callback";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        {/* Login Page */}
                        <Route path="/" element={<Login />} />

                        {/* Callback Page */}
                        <Route path="/callback" element={<Callback />} />

                        {/* Protected Route */}
                        <Route path="/dashboard" element={<ProtectedRoute />} />

                        {/* Optional: Fallback for undefined routes */}
                        <Route
                            path="*"
                            element={
                                <div className="flex items-center justify-center min-h-screen">
                                    <h1 className="text-2xl text-red-600">404 - Page Not Found</h1>
                                </div>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
