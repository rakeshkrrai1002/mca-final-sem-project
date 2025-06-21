import React, { useEffect, useState } from "react";
import Side from "../sidebar/sidebar";

const MasterTable = () => {
  const [roles, setRoles] = useState([]);
  const [cities, setCities] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [newRole, setNewRole] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchMasterData = async () => {
    try {
      const [rolesResponse, citiesResponse, statusResponse] = await Promise.all(
        [
          fetch("http://127.0.0.1:8000/roles"),
          fetch("http://127.0.0.1:8000/city"),
          fetch("http://127.0.0.1:8000/prop_reg_status"),
        ]
      );

      if (!rolesResponse.ok || !citiesResponse.ok || !statusResponse.ok) {
        throw new Error("One of the requests failed.");
      }

      const rolesData = await rolesResponse.json();
      const citiesData = await citiesResponse.json();
      const statusData = await statusResponse.json();

      setRoles([...new Set(rolesData.flatMap((item) => item.role))]);
      setCities([...new Set(citiesData)]);
      setStatusOptions([...new Set(statusData)]);
    } catch (error) {
      console.error("Failed to fetch master data:", error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleAddData = async (endpoint, value, setValue) => {
    if (value.trim()) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [endpoint]: value.trim() }),
        });
        if (response.ok) {
          setValue("");
          fetchMasterData();
        }
      } catch (error) {
        alert(`Failed to add ${endpoint}`);
      }
    } else {
      alert(`Please enter a valid ${endpoint}.`);
    }
  };

  const renderSection = (label, options, value, setValue, endpoint) => (
    <div className="mb-6">
      <label className="block text-lg font-semibold mb-2">{label}:</label>
      <div className="flex gap-4 items-center">
        <select
          className="w-1/3 p-2 border border-gray-300 rounded-md"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select {label}</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="w-1/3 p-2 border border-gray-300 rounded-md"
          placeholder={`Enter new ${label.toLowerCase()}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => handleAddData(endpoint, value, setValue)}
        >
          Add {label}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Side />
      <div className="flex-grow p-10">
        <h1 className="text-4xl font-bold mb-8 text-center">Master Table</h1>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {renderSection("Role", roles, newRole, setNewRole, "roles")}
          {renderSection("City", cities, newCity, setNewCity, "city")}
          {renderSection(
            " Status",
            statusOptions,
            newStatus,
            setNewStatus,
            "propregstatus"
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterTable;
