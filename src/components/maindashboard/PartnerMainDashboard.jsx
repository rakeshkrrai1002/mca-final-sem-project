import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import axios from "axios";
import { canAccess } from "../permissions/Permissions";
import { Link } from "react-router-dom";

export const PartnerMainDashboard = () => {
  const [filters, setFilters] = useState({
    city: "",
    dateRange: "",
    manager: "",
    status: "",
    current_status: "",
    startDate: "",
    endDate: "",
  });

  const [propertyList, setPropertyList] = useState([]);
  const [cities, setCities] = useState([]);
  const [current_status, setCurrentStatus] = useState([]);
  const [approvalstatus, setApprovalStatus] = useState([]);

  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);

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
          console.log(
            "Can access adminDetails?",
            canAccess(roleData.role, "adminDetails")
          );

          // Ensure we use the updated roleData instead of userRole (since state updates are async)
          if (canAccess(roleData.role, "partnerPropertyList")) {
            const response = await fetch(
              `http://127.0.0.1:8000/fetchProperty/${user.mobile}`
            );
            const data = await response.json();
            console.log("property Data:", data);
            setPropertyList(data);
          } else if (canAccess(roleData.role, "allPropertyList")) {
            const response = await fetch(
              `http://127.0.0.1:8000/fetchAllProperty`
            );
            const data = await response.json();
            setPropertyList(data);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchData();
    }
  }, [user]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/propstatus")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCurrentStatus(response.data);
        } else {
          console.error("current status data is empty or invalid", response);
        }
      })
      .catch((error) => {
        console.error("There was an error fetching the current status!", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/prop_reg_status")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setApprovalStatus(response.data);
        } else {
          console.error("current status data is empty or invalid", response);
        }
      })
      .catch((error) => {
        console.error("There was an error fetching the current status!", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/city")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCities(response.data);
        } else {
          console.error("Cities data is empty or invalid", response);
        }
      })
      .catch((error) => {
        console.error("There was an error fetching the cities!", error);
      });
  }, []);

  const handleDelete = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/partners/${propertyId}`);
        alert("Property deleted successfully!");
        window.location.reload(); // Refresh the page or update state
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("Failed to delete property.");
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      city: "",
      approvalstatus: "",
      current_status: "",
      manager_name: "",
      startDate: "",
      endDate: "",
      owner_name: "",
      manager_name: "",
    });
  };

  const filteredUsers = propertyList.filter((property) => {
    const matchesCity =
      !filters.city ||
      property.city?.toLowerCase() === filters.city.toLowerCase();

    const matchesmanagerName =
      !filters.manager_name ||
      property.manager_name?.toLowerCase() ===
        filters.manager_name.toLowerCase();
    const matchesOwnerName =
      !filters.owner_name ||
      property.owner_name?.toLowerCase() === filters.owner_name.toLowerCase();
    const matchesApprovalStatus =
      !filters.approvalstatus ||
      property.approvalstatus_value?.toLowerCase() ===
        filters.approvalstatus.toLowerCase();
    const matchescurrentstatus =
      !filters.current_status ||
      property.current_status_value?.toLowerCase() ===
        filters.current_status.toLowerCase();

    const propertyDate = property.date_registration
      ? new Date(property.date_registration)
      : null;

    // Filter by start and end dates
    const matchesStartDate =
      !filters.startDate ||
      (propertyDate && propertyDate >= new Date(filters.startDate));
    const matchesEndDate =
      !filters.endDate ||
      (propertyDate && propertyDate <= new Date(filters.endDate));
    return (
      matchesCity &&
      matchesmanagerName &&
      matchesOwnerName &&
      matchesApprovalStatus &&
      matchescurrentstatus &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  return (
    <div className="bg-gray-100">
      <div className="flex">
        <Side />

        <div className="flex-1 ml-px p-5 bg-white rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold text-gray-700">
              Main Dashboard
            </h2>
            <div className="text-right">
              <h3 className="text-lg font-medium">user: {user?.mobile}</h3>
              <span className="text-sm text-gray-600">role: {userRole}</span>
            </div>
          </div>

          <div className="sticky top-0 bg-white z-10 pt-4">
            <div className="text-right mt-2.5">
              <button
                onClick={handleClearFilters}
                className="bg-white text-red-500 border-none cursor-pointer px-3 py-2 hover:opacity-80"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-6 gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <select
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full p-2 rounded border border-gray-300 text-sm text-gray-600"
                >
                  <option value="">Select a City</option>
                  {cities.length > 0 ? (
                    cities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cities available</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  name="current_status"
                  value={filters.current_status}
                  onChange={handleFilterChange}
                  className="w-full p-2 rounded border border-gray-300 text-sm text-gray-600"
                >
                  <option value="">Select Property Status</option>
                  {current_status.length > 0 ? (
                    current_status.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))
                  ) : (
                    <option disabled>No status available</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  name="approvalstatus"
                  value={filters.approvalstatus}
                  onChange={handleFilterChange}
                  className="w-full p-2 rounded border border-gray-300 text-sm text-gray-600"
                >
                  <option value="">Select Registration Status</option>
                  {approvalstatus.length > 0 ? (
                    approvalstatus.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))
                  ) : (
                    <option disabled>No approval status available</option>
                  )}
                </select>
              </div>

              {canAccess(userRole, "allPropertyList") && (
                <div className="flex flex-col gap-2">
                  <select
                    name="owner_name"
                    value={filters.owner_name}
                    onChange={handleFilterChange}
                    className="w-full p-2 rounded border border-gray-300 text-sm text-gray-600"
                  >
                    <option value="">Select Owner</option>
                    {propertyList.length > 0 ? (
                      [
                        ...new Set(
                          propertyList.map((property) => property.owner_name)
                        ),
                      ].map((ownerName, index) => (
                        <option key={index} value={ownerName}>
                          {ownerName}
                        </option>
                      ))
                    ) : (
                      <option hidden>No owners available</option>
                    )}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <select
                  name="manager_name"
                  value={filters.manager_name}
                  onChange={handleFilterChange}
                  className="w-full p-2 rounded border border-gray-300 text-sm text-gray-600"
                >
                  <option value="">Select Manager</option>
                  {propertyList.length > 0 ? (
                    [
                      ...new Set(
                        propertyList.map((property) => property.manager_name)
                      ),
                    ].map((managerName, index) => (
                      <option key={index} value={managerName}>
                        {managerName}
                      </option>
                    ))
                  ) : (
                    <option disabled>No managers available</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.type = "text")}
                  placeholder="Start Date"
                  className="w-full p-2 rounded border border-gray-300 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.type = "text")}
                  placeholder="End Date"
                  className="w-full p-2 rounded border border-gray-300 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="row g-4">
            {filteredUsers.length > 0 ? (
              <table className="w-full border-collapse mt-2.5">
                <thead>
                  <tr className="bg-gray-100 font-semibold">
                    <th className="p-3">Property ID</th>
                    <th className="p-3">Property Name</th>
                    <th className="p-3">City</th>
                    {canAccess(userRole, "allPropertyList") && (
                      <>
                        <th className="p-3">Owner Name</th>
                        <th className="p-3">Owner Contact</th>
                      </>
                    )}
                    <th className="p-3">Manager Name</th>
                    <th className="p-3">Manager Contact</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3">Current Status</th>
                    {(canAccess(userRole, "editProperty") ||
                      canAccess(userRole, "deleteProperty")) && (
                      <th className="p-3">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((property) => (
                    <tr
                      key={property.p_id}
                      className="h-11 border-b border-gray-200 hover:bg-gray-50 text-center"
                    >
                      <td className="p-3">{property.p_id}</td>
                      <td className="p-3">{property.p_name}</td>
                      <td className="p-3">{property.city}</td>
                      {canAccess(userRole, "allPropertyList") && (
                        <>
                          <td className="p-3">{property.owner_name}</td>
                          <td className="p-3">{property.owner_mobile}</td>
                        </>
                      )}
                      <td className="p-3">{property.manager_name}</td>
                      <td className="p-3">{property.manager_mobile_no}</td>
                      <td className="p-3">{property.approvalstatus_value}</td>
                      <td className="p-3">{property.current_status_value}</td>
                      <td className="p-3">
                        {canAccess(userRole, "editProperty") && (
                          <Link
                            to={`/propertyConfiguration`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            edit
                          </Link>
                        )}

                        {canAccess(userRole, "deleteProperty") && (
                          <button
                            onClick={() => handleDelete(property.p_id)}
                            className="text-red-500 border-none bg-transparent cursor-pointer hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center mt-4">No property found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerMainDashboard;
