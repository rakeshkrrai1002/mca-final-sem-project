import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";
import axios from "axios";
import { Link } from "react-router-dom";

const PartnerApproval = () => {
  const { user } = useUser();
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
          const response = await fetch(`http://${api}/fetchAllProperty`);
          const data = await response.json();
          setPropertyList(data);
        } catch (error) {
          console.error("Error fetching properties:", error);
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
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg w-full">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              User Role Approval
            </h2>
            {user && (
              <span className="text-gray-600">
                User: <strong>{user.mobile}</strong>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="bg-white text-red-500 border-none cursor-pointer px-3 py-2 hover:opacity-80"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 mt-4">
            <div className="flex flex-col gap-4">
              <select
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
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

            <div className="flex flex-col gap-4">
              <select
                name="current_status"
                value={filters.current_status}
                onChange={handleFilterChange}
                className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
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

            <div className="flex flex-col gap-4">
              <select
                name="approvalstatus"
                value={filters.approvalstatus}
                onChange={handleFilterChange}
                className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
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

            <div className="flex flex-col gap-4">
              <select
                name="owner_name"
                value={filters.owner_name}
                onChange={handleFilterChange}
                className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
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

            <div className="flex flex-col gap-4">
              <select
                name="manager_name"
                value={filters.manager_name}
                onChange={handleFilterChange}
                className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
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

            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                placeholder="Start Date"
                className="w-full p-2.5 rounded border border-gray-300 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                placeholder="End Date"
                className="w-full p-2.5 rounded border border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSaveChanges}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>

        {filteredUsers.length > 0 &&
          (() => {
            // Group the filteredUsers by approval status
            const groupedProperties = filteredUsers.reduce((acc, property) => {
              const key = property.approvalstatus_value;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(property);
              return acc;
            }, {});
            // Sort the approval statuses (alphabetically)
            const sortedApprovalStatuses =
              Object.keys(groupedProperties).sort();

            return sortedApprovalStatuses.map((status) => (
              <div key={status}>
                <h3 className="text-xl font-bold text-gray-800">{status}</h3>
                <div className="mt-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 font-semibold">
                        <th className="p-3">Property ID</th>
                        <th className="p-3">Property Name</th>
                        <th className="p-3">City</th>
                        <th className="p-3">Owner Name</th>
                        <th className="p-3">Owner Contact</th>
                        <th className="p-3">Manager Name</th>
                        <th className="p-3">Manager Contact</th>
                        <th className="p-3">Approval Status</th>
                        <th className="p-3">Current Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedProperties[status].map((property) => (
                        <tr
                          key={property.p_id}
                          className="h-11 border-b border-gray-200 hover:bg-gray-50 text-center"
                        >
                          <td className="p-3">{property.p_id}</td>
                          <td className="p-3">{property.p_name}</td>
                          <td className="p-3">{property.city}</td>
                          <td className="p-3">{property.owner_name}</td>
                          <td className="p-3">{property.owner_mobile}</td>
                          <td className="p-3">{property.manager_name}</td>
                          <td className="p-3">{property.manager_mobile_no}</td>
                          <td className="p-3">
                            <select
                              value={
                                pendingUpdates[property.p_id] &&
                                pendingUpdates[property.p_id]
                                  .approvalstatus_value !== undefined
                                  ? pendingUpdates[property.p_id]
                                      .approvalstatus_value
                                  : property.approvalstatus_value
                              }
                              onChange={(e) =>
                                handleApprovalStatusChange(
                                  property.p_id,
                                  e.target.value
                                )
                              }
                              className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
                            >
                              {approvalstatus.map((status, index) => (
                                <option key={index} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={
                                pendingUpdates[property.p_id] &&
                                pendingUpdates[property.p_id]
                                  .current_status_value !== undefined
                                  ? pendingUpdates[property.p_id]
                                      .current_status_value
                                  : property.current_status_value
                              }
                              onChange={(e) =>
                                handleCurrentStatusChange(
                                  property.p_id,
                                  e.target.value
                                )
                              }
                              className="w-full p-2.5 rounded border border-gray-300 text-sm text-gray-600"
                            >
                              {current_status.map((status, index) => (
                                <option key={index} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => handleDelete(property.p_id)}
                              className="text-red-500 border-none bg-transparent cursor-pointer hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
      </div>
    </div>
  );
};

export default PartnerApproval;
