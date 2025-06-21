import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";
import axios from "axios";
import { Link } from "react-router-dom";

const AdminMainDashboard = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  const api = "127.0.0.1:8000";
  const [propertyList, setPropertyList] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState({});

  const [filters, setFilters] = useState({
    city: "",
    dateRange: "",
    manager: "",
    status: "",
    current_status: "",
    startDate: "",
    endDate: "",
  });

  const [cities, setCities] = useState([]);
  const [current_status, setCurrentStatus] = useState([]);
  const [approvalstatus, setApprovalStatus] = useState([]);

  useEffect(() => {
    if (user) {
      console.log(user);
      const fetchData = async () => {
        try {
          const roleResponse = await fetch(
            `http://127.0.0.1:8000/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          console.log("Role Data:", roleData);
          setUserRole(roleData.role);

          console.log("Role Data before access check:", roleData.role);
          const response = await fetch(`http://${api}/fetchAllProperty`);
          const data = await response.json();
          setPropertyList(data);
        } catch (error) {
          console.error("Error fetching user role or properties:", error);
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
          // console.log(approvalstatus)
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

  const handleApprovalStatusChange = (propertyId, newStatus) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        approvalstatus_value: newStatus,
      },
    }));
  };

  const handleCurrentStatusChange = (propertyId, newStatus) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        current_status_value: newStatus,
      },
    }));
  };
  const handleSaveChanges = () => {
    // Build an array of update promises for each modified property
    const updatePromises = Object.keys(pendingUpdates).map((propertyId) => {
      const updates = pendingUpdates[propertyId];
      const promises = [];
      if (updates.approvalstatus_value !== undefined) {
        promises.push(
          axios.put(`http://${api}/updateApprovalStatus/${propertyId}`, {
            approvalstatus_value: updates.approvalstatus_value,
          })
        );
      }
      if (updates.current_status_value !== undefined) {
        promises.push(
          axios.put(`http://${api}/updateCurrentStatus/${propertyId}`, {
            current_status_value: updates.current_status_value,
          })
        );
      }
      return Promise.all(promises);
    });

    Promise.all(updatePromises)
      .then(() => {
        // Update propertyList state with pendingUpdates
        setPropertyList((prevList) =>
          prevList.map((property) => {
            const updates = pendingUpdates[property.p_id];
            return updates ? { ...property, ...updates } : property;
          })
        );
        setPendingUpdates({});
        alert("All changes saved successfully!");
        console.log("All changes saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving changes", error);
        alert("Error saving changes");
      });
  };

  return (
    <div className="flex">
      <Side />
      <div className="bg-gradient-to-br w-full from-purple-50  to-gray-100 min-h-screen p-6">
        <div className="container mx-auto  bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-ezzstay-base  text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Main Dashboard</h1>
              {user && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <span className="text-white">
                    User: <strong>{user.mobile}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Filters</h2>
              <button
                onClick={handleClearFilters}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 text-sm md:grid-cols-2 lg:grid-cols-8 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                >
                  <option value="">All Cities</option>
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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Property Status
                </label>
                <select
                  name="current_status"
                  value={filters.current_status}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                >
                  <option value="">All Status</option>
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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Registration Status
                </label>
                <select
                  name="approvalstatus"
                  value={filters.approvalstatus}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                >
                  <option value="">All Status</option>
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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Owner
                </label>
                <select
                  name="owner_name"
                  value={filters.owner_name}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                >
                  <option value="">All Owners</option>
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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Manager
                </label>
                <select
                  name="manager_name"
                  value={filters.manager_name}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                >
                  <option value="">All Managers</option>
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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSaveChanges}
                  className="w-full bg-ezzstay-base  text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {filteredUsers.length > 0 ? (
            <div className="p-6">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700 text-left">
                      <th className="p-4">Property ID</th>
                      <th className="p-4">Property Name</th>
                      <th className="p-4">City</th>
                      <th className="p-4">Owner Name</th>
                      <th className="p-4">Owner Contact</th>
                      <th className="p-4">Manager Name</th>
                      <th className="p-4">Manager Contact</th>
                      <th className="p-4">Approval Status</th>
                      <th className="p-4">Current Status</th>
                      {(canAccess(userRole, "editProperty") ||
                        canAccess(userRole, "deleteProperty")) && (
                        <th className="p-4">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((property, index) => (
                      <tr
                        key={property.p_id}
                        className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="p-4 font-medium">{property.p_id}</td>
                        <td className="p-4">{property.p_name}</td>
                        <td className="p-4">{property.city}</td>
                        <td className="p-4">{property.owner_name}</td>
                        <td className="p-4">{property.owner_mobile}</td>
                        <td className="p-4">{property.manager_name}</td>
                        <td className="p-4">{property.manager_mobile_no}</td>
                        <td className="p-4">
                          <select
                            value={
                              pendingUpdates[property.p_id]
                                ?.approvalstatus_value ??
                              property.approvalstatus_value
                            }
                            onChange={(e) =>
                              handleApprovalStatusChange(
                                property.p_id,
                                e.target.value
                              )
                            }
                            className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          >
                            {approvalstatus.map((status, index) => (
                              <option key={index} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={
                              pendingUpdates[property.p_id]
                                ?.current_status_value ??
                              property.current_status_value
                            }
                            onChange={(e) =>
                              handleCurrentStatusChange(
                                property.p_id,
                                e.target.value
                              )
                            }
                            className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          >
                            {current_status.map((status, index) => (
                              <option key={index} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        {(canAccess(userRole, "editProperty") ||
                          canAccess(userRole, "deleteProperty")) && (
                          <td className="p-4">
                            <div className="flex gap-2">
                              {canAccess(userRole, "editProperty") && (
                                <Link
                                  to={`/propertyConfiguration`}
                                  className="inline-flex items-center justify-center p-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </Link>
                              )}
                              {canAccess(userRole, "deleteProperty") && (
                                <button
                                  onClick={() => handleDelete(property.p_id)}
                                  className="inline-flex items-center justify-center p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No properties found
              </h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMainDashboard;
