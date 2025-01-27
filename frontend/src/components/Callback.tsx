import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Callback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { accessToken, setAccessToken } = useAuth(); // Hook-Aufruf innerhalb der Komponente

    useEffect(() => {
        const sendCodeToBackend = async () => {
            const code = searchParams.get("code");

            if (!code) {
                console.error("No code provided in the query params.");
                alert("Authorization code missing. Please try logging in again.");
                return;
            }

            try {
                // Use Fetch API to send the code to the backend
                const response = await fetch("http://localhost:5000/api/auth/callback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }), // Send code in JSON format
                    credentials: "include", // Ensure cookies are sent
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Server error:", errorData);
                    alert(`Login failed: ${errorData.message || "An error occurred."}`);
                    return;
                }

                const data = await response.json();
                const { access_token } = data;


                if (access_token) {
                    // Store access token in memory only (closure or variable scope)
                    setAccessToken(access_token);
                    console.log("Access token stored in memory:", accessToken);

                    // Redirect the user or perform other actions
                    alert("Login successful! Redirecting...");
                    window.location.href = "/dashboard"; // Replace with your app's dashboard URL
                } else {
                    console.error("Access token not provided in response.");
                    alert("Login failed. No access token received.");
                }
             
            } catch (error) {
                console.error("Error during request:", error);
                alert("An unexpected error occurred. Please try again.");
            }
        };

        sendCodeToBackend();
    }, [searchParams, accessToken]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-lg text-gray-700">Processing login...</p>
        </div>
    );
};

export default Callback;
