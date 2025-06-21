import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../userContext/userContext";
import { canAccess } from "../../permissions/Permissions";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, setUser } = useUser();

  const jwtToken = localStorage.getItem("token");
  const [userRole, setUserRole] = useState([]);

  // Fetch user role when user changes
  useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/getUserRole/${user.mobile}`
          );
          const data = await response.json();
          setUserRole(data.role);
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      };

      fetchUserRole();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedProperty");
    localStorage.removeItem("selectedFloor");

    
    window.location.href = "/loginwithpassword";

    setUser(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-white shadow-md py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-ezzstay-base text-2xl font-extrabold flex items-center hover:text-purple-600 transition-colors"
          >
            EEZSTAY
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {(canAccess(userRole, "partnerRoutes") ||
              canAccess(userRole, "adminRoutes")) && (
              <Link
                to="/maindashboard"
                className="text-gray-800 text-lg font-medium hover:text-purple-600 transition-colors"
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/"
              className="text-gray-800 text-lg font-medium hover:text-purple-600 transition-colors"
            >
              Home
            </Link>

            <Link
              to="/user-booking"
              className="text-gray-800 text-lg font-medium hover:text-purple-600 transition-colors"
            >
             Bookings
            </Link>

            {!jwtToken ? (
              <Link
                to="/loginwithpassword"
                className="bg-ezzstay-base text-white px-6 py-2 rounded-full font-medium hover:bg-purple-700 transition-colors"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="bg-ezzstay-base text-white px-6 py-2 rounded-full font-medium hover:bg-red-500 transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-800 focus:outline-none"
            >
              {!isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2  space-y-1 sm:px-3 bg-white ">
            {(canAccess(userRole, "partnerRoutes") ||
              canAccess(userRole, "adminRoutes")) && (
              <Link
                to="/maindashboard"
                className="text-gray-800 block px-3 py-2 text-base font-medium hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/"
              className="text-gray-800 block px-3 py-2 text-base font-medium hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/user-booking"
              className="text-gray-800 block px-3 py-2 text-base font-medium hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bookings
            </Link>

            {!jwtToken ? (
              <Link
                to="/loginwithpassword"
                className="text-gray-800 block px-3 py-2 text-base font-medium hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="text-gray-800 block w-full text-left px-3 py-2 text-base font-medium hover:bg-red-100 rounded-md"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
