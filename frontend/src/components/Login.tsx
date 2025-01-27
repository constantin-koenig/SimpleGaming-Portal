import React from "react";

// Login Component
const Login: React.FC = () => {
    const handleLogin = () => {
        // Weiterleitung zur Backendroute
        window.location.href = "http://localhost:5000/api/auth/discord";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <button
                onClick={handleLogin}
                className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Login with Discord
            </button>
        </div>
    );
};

export default Login;