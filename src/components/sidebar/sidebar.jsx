import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  UserPlus,
  CheckCircle,
  Settings,
  Building2,
  BarChart3,
  FileText,
  History,
  Layout,
  DollarSign,
  Briefcase,
  Database,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

const Side = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPartnerManagementOpen, setPartnerManagementOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Check if there's a saved preference for sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save preference when state changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (user) {
      console.log(user);
      const fetchData = async () => {
        try {
          // Fetch user role
          const roleResponse = await fetch(
            `http://127.0.0.1:8000/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          console.log("Role Data:", roleData);
          setUserRole(roleData.role);

          console.log("Role Data before access check:", roleData.role);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchData();
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const MenuItem = ({
    icon: Icon,
    text,
    path = "#",
    onClick = null,
    hasDropdown = false,
    isOpen = false,
  }) => (
    <li className="mb-2">
      <div
        className={`flex items-center ${
          isCollapsed ? "justify-center px-2" : "px-4"
        } py-3 text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-all duration-200`}
        onClick={onClick}
      >
        <Icon className="w-5 h-5 mr-3" />
        {!isCollapsed && (
          <>
            <Link to={path} className="flex-1">
              {text}
            </Link>
            {hasDropdown && (
              <span className="ml-auto">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            )}
          </>
        )}
      </div>
      {isCollapsed && (
        <div className="absolute left-16 hidden group-hover:block bg-white shadow-lg rounded-md py-2 z-50">
          <Link to={path} className="block px-4 py-2 text-sm">
            {text}
          </Link>
        </div>
      )}
    </li>
  );

  const SubMenuItem = ({ text, path }) => {
    if (isCollapsed) return null;

    return (
      <li>
        <Link
          to={path}
          className="block px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors duration-200"
        >
          {text}
        </Link>
      </li>
    );
  };
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`h-screen sticky pt-2 top-0 left-0 z-30 ${
        isScrolled ? "pt-16" : ""
      }`}
    >
      <aside
        className={`${
          isCollapsed ? "w-16" : "w-72"
        } bg-white text-gray-800 flex flex-col shadow-lg border-r border-purple-100 h-full transition-all duration-300`}
      >
        <div className="p-4 relative">
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-4 bg-purple-600 text-white p-1 rounded-full shadow-md hover:bg-purple-700 transition-colors z-50"
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>

          {!isCollapsed ? (
            canAccess(userRole, "adminRoutes") ? (
              <h1 className="text-xl font-bold text-purple-600 mb-6">
                Admin Dashboard
              </h1>
            ) : (
              <h1 className="text-xl font-bold text-purple-600 mb-6">
                Partner Dashboard
              </h1>
            )
          ) : (
            <div className="flex justify-center mb-6">
              <Menu className="w-8 h-8 text-purple-600" />
            </div>
          )}

          <nav>
            <ul className="space-y-1">
              <MenuItem
                icon={LayoutDashboard}
                text="Main Page Dashboard"
                path="/maindashboard"
              />
              <MenuItem
                icon={UserPlus}
                text="Property Registration"
                path="/partnerregister"
              />
              {canAccess(userRole, "adminRoutes") && (
                <>
                  <MenuItem
                    icon={CheckCircle}
                    text="User Role Approval"
                    path="/user-approval"
                  />
                </>
              )}

              {/* Partner Management Dropdown */}
              <li className="mb-2">
                {!isCollapsed ? (
                  <>
                    <MenuItem
                      icon={Building2}
                      text="Partner Management"
                      hasDropdown={true}
                      isOpen={isPartnerManagementOpen}
                      onClick={() =>
                        setPartnerManagementOpen(!isPartnerManagementOpen)
                      }
                    />
                    {isPartnerManagementOpen && (
                      <ul className="mt-2 ml-6 space-y-1 border-l-2 border-purple-100 pl-2">
                        <SubMenuItem
                          text="Property Configuration"
                          path="/propertyconfiguration"
                        />
                        <SubMenuItem
                          text="Facilities and Amenities"
                          path="/facilities-amenities"
                        />
                        <SubMenuItem
                          text="Bed and Room Configuration"
                          path="/bed-configuration"
                        />
                        <SubMenuItem
                          text="General Pricing"
                          path="/general-pricing"
                        />
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="group relative">
                    <MenuItem icon={Building2} text="Partner Management" />
                  </div>
                )}
              </li>

              {/* Settings Dropdown */}
              <li className="mb-2">
                {!isCollapsed ? (
                  <>
                    <MenuItem
                      icon={Settings}
                      text="Settings"
                      hasDropdown={true}
                      isOpen={isSettingsOpen}
                      onClick={() => setSettingsOpen(!isSettingsOpen)}
                    />
                    {isSettingsOpen && (
                      <ul className="mt-2 ml-6 space-y-1 border-l-2 border-purple-100 pl-2">
                        <SubMenuItem text="Master Table" path="/mastertable" />
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="group relative">
                    <MenuItem icon={Settings} text="Settings" />
                  </div>
                )}
              </li>

              <MenuItem
                icon={Briefcase}
                text="Booking Details"
                path="/booking-details"
              />
              <MenuItem
                icon={DollarSign}
                text="Book Now"
                path="/booking-times"
              />
              <MenuItem
                icon={BarChart3}
                text="Partner Statistic"
                path="/partner-statistics"
              />
              <MenuItem
                icon={FileText}
                text="DOM Statistic"
                path="/dom-statistics"
              />
              <MenuItem
                icon={History}
                text="Partnership Agreement"
                path="/partnership-agreement"
              />
              <MenuItem
                icon={Database}
                text="DOM Logs/Correction"
                path="/dom-logs-correction"
              />
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
};

export default Side;
