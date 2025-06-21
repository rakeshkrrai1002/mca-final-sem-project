import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";
import { jwtDecode } from "jwt-decode";
import { validateMobile } from "../../utils/validation";

export const LoginWithPassword = ({ setFormType }) => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // For error handling
  const [successMessage, setSuccessMessage] = useState(""); // For success message
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const handleChange = (e) => {
    setMobile(e.target.value);
    if (validateMobile(e.target.value)) {
      setError("");
    } else {
      setError("Please enter a valid 10-digit mobile number");
    }
  };

  // Handle login with password
  const handleLogin = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        { mobile, password },
        {
          headers: {
            "Content-Type": "application/json", // Explicitly set Content-Type header
          },
        }
      );

      setSuccessMessage("Login successful!");
      localStorage.setItem("token", response.data.token);

      const decoded = jwtDecode(response.data.token);
      console.log("decoded is ", response.data.token);
      // Update the user context with mobile and token
      setUser({ mobile, token: response.data.token });
      setLoading(false);

      console.log("decoded is after setting ", decoded);

      if (
        canAccess(decoded.role, "adminRoutes") ||
        canAccess(decoded.role, "partnerRoutes")
      ) {
        navigate("/maindashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(
        error.response ? error.response.data.detail : "An error occurred"
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ezzstay-base mb-2 font-roboto">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm">
            Please login to access your account
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Mobile Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-ezzstay-base"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                maxLength="10"
                value={mobile}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${
                  error.includes("mobile")
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-ezzstay-base focus:border-transparent transition-colors`}
                placeholder="Enter your mobile number"
                required
              />
            </div>
            {error.includes("mobile") && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-ezzstay-base"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ezzstay-base focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 mt-2 bg-ezzstay-base hover:bg-purple-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Register Button */}
          <button
            onClick={() => navigate("/register")}
            className="w-full py-3 px-4 border border-ezzstay-base text-ezzstay-base font-medium rounded-xl transition-all duration-300 hover:bg-purple-50 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
          >
            Create New Account
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};
