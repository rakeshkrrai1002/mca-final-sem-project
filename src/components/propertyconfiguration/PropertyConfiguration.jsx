import React, { useState, useEffect, useRef } from "react";
import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";

const PropertyConfiguration = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    p_id: "",
    p_name: "",
    p_lay_display_name: "",
    dateOfRegistration: "",
    floor_count: "",
    floor_desc: "",
    floor_name: "",
    capacity_private_1_seater: "0",
    capacity_private_2_seater: "0",
    capacity_private_3_seater: "0",
    capacity_private_4_seater: "0",
    capacity_suite_room: "0",
    capacity_dormitory: "0",
  });

  const [propertyOptions, setPropertyOptions] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [floorTabs, setFloorTabs] = useState([]);
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch properties and user role
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch user role
          const roleResponse = await fetch(
            `http://127.0.0.1:8000/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          setUserRole(roleData.role);

          let properties = [];
          
          if (canAccess(roleData.role, "partnerPropertyList")) {
            const response = await fetch(
              `http://127.0.0.1:8000/fetchProperty/${user.mobile}`
            );
            properties = await response.json();
          } else if (canAccess(roleData.role, "allPropertyList")) {
            const response = await fetch(
              `http://127.0.0.1:8000/fetchAllProperty`
            );
            properties = await response.json();
          }

          // Sort properties alphabetically by p_name
          const sortedProperties = [...properties].sort((a, b) => 
            a.p_name.localeCompare(b.p_name)
          );
          
          setPropertyOptions(sortedProperties);
          setFilteredProperties(sortedProperties);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  // Filter properties based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = propertyOptions.filter(property =>
        property.p_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(propertyOptions);
    }
  }, [searchTerm, propertyOptions]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const selectProperty = (property) => {
    setFormData(prev => ({
      ...prev,
      p_name: property.p_name,
      p_id: property.p_id,
      dateOfRegistration: property.date_registration || ""
    }));
    setSearchTerm(property.p_name);
    setShowDropdown(false);
    
    // Load property details
    loadPropertyDetails(property.p_id);
  };

  const loadPropertyDetails = async (propertyId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/property-layout/${propertyId}`
      );
      const data = await response.json();

      if (data && data.floors && data.floors.length > 0) {
        const floorCount = data.floors.length;

        setFormData(prev => ({
          ...prev,
          p_lay_display_name: data.p_lay_display_name,
          floor_count: floorCount,
          p_lay_id: data.p_lay_id
        }));

        setFloorTabs(
          data.floors.map((floor) => ({
            floor_id: floor.floor_id || null,
            floor_name: floor.floor_name || "",
            floor_desc: floor.floor_desc || "",
            capacity_private_1_seater: floor.capacity_private_1_seater || "0",
            capacity_private_2_seater: floor.capacity_private_2_seater || "0",
            capacity_private_3_seater: floor.capacity_private_3_seater || "0",
            capacity_private_4_seater: floor.capacity_private_4_seater || "0",
            capacity_suite_room: floor.capacity_suite_room || "0",
            capacity_dormitory: floor.capacity_dormitory || "0",
            floorCapacity: floor.floorCapacity || "0",
            is_active: floor.is_active !== undefined ? floor.is_active : true // Default to true if not specified
          }))
        );

        setHasExistingConfig(true);
      } else {
        alert("No configuration found for this property. Please configure it.");
        setFormData(prev => ({
          ...prev,
          p_lay_display_name: "",
          floor_count: "",
        }));
        setFloorTabs([]);
        setHasExistingConfig(false);
      }
    } catch (error) {
      console.error("Error loading property details:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "floor_count") {
      const count = Math.max(0, parseInt(value, 10));

      setFloorTabs((prevTabs) => {
        const updatedTabs = [...prevTabs];

        if (count > prevTabs.length) {
          const floorsToAdd = count - prevTabs.length;
          const newFloors = Array.from({ length: floorsToAdd }, (_, i) => {
            const floorIndex = prevTabs.length + i;
            return {
              floor_id: null,
              floor_name: `Floor ${floorIndex}`,
              floor_desc: "",
              capacity_private_1_seater: "0",
              capacity_private_2_seater: "0",
              capacity_private_3_seater: "0",
              capacity_private_4_seater: "0",
              capacity_suite_room: "0",
              capacity_dormitory: "0",
              floorCapacity: "0",
              is_active: true // Default to active when adding new floors
            };
          });
          return [...updatedTabs, ...newFloors];
        } else if (count < prevTabs.length) {
          return updatedTabs.slice(0, count);
        }
        return updatedTabs;
      });
    }
  };

  const fetchTotalBeds = async (floorId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/totalBeds/${floorId}`
      );
      const data = await response.json();
      return data.total_beds || 0;
    } catch (error) {
      console.error("Error fetching total beds:", error);
      return 0;
    }
  };

  const handleTabInputChange = async (e, tabIndex) => {
    const { name, value, files } = e.target;
    const updatedTabs = [...floorTabs];

    if (name.startsWith("capacity_")) {
      const sanitizedValue =
        value === "" ? "" : String(Math.max(0, parseInt(value, 10)));

      updatedTabs[tabIndex][name] = sanitizedValue;

      const floorId = updatedTabs[tabIndex].floor_id;
      if (floorId) {
        const totalBeds = await fetchTotalBeds(floorId);
        updatedTabs[tabIndex].floorCapacity = totalBeds;
      }
    } else {
      updatedTabs[tabIndex][name] = files ? files[0] : value;
    }

    setFloorTabs(updatedTabs);
  };

  const toggleFloorActiveStatus = (tabIndex) => {
    const updatedTabs = [...floorTabs];
    updatedTabs[tabIndex].is_active = !updatedTabs[tabIndex].is_active;
    setFloorTabs(updatedTabs);
  };

  const validateForm = () => {
    let formErrors = {};

    if (!formData.p_name) {
      formErrors.p_name = "Property Name is required";
    }
    if (!formData.p_lay_display_name) {
      formErrors.p_lay_display_name = "Property Display Name is required";
    }
    if (!formData.floor_count || parseInt(formData.floor_count, 10) < 1) {
      formErrors.floor_count = "Floor Count must be a positive number";
    }

    floorTabs.forEach((tab, index) => {
      if (!tab.floor_name) {
        formErrors[`floor_name_${index}`] = `Floor ${
          index + 1
        } Name is required`;
      }
      // if (!tab.floor_desc) {
      //   formErrors[`floor_desc_${index}`] = `Floor ${
      //     index + 1
      //   } Description is required.`;
      // }
    });

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const floorsData = floorTabs.map((tab, index) => ({
        floor_id: tab.floor_id || index + 1,
        floor_name: tab.floor_name,
        floor_desc: tab.floor_desc,
        capacity_private_1_seater: tab.capacity_private_1_seater,
        capacity_private_2_seater: tab.capacity_private_2_seater,
        capacity_private_3_seater: tab.capacity_private_3_seater,
        capacity_private_4_seater: tab.capacity_private_4_seater,
        capacity_suite_room: tab.capacity_suite_room,
        capacity_dormitory: tab.capacity_dormitory,
        floorCapacity: tab.floorCapacity,
        is_active: tab.is_active
      }));

      const formDataToSubmit = {
        p_id: formData.p_id,
        p_name: formData.p_name,
        p_lay_display_name: formData.p_lay_display_name,
        floor_count: formData.floor_count,
        floors: floorsData,
      };

      const isUpdate = !!formData.p_lay_id;
      const url = isUpdate
        ? `http://127.0.0.1:8000/property-layout/${formData.p_lay_id}`
        : "http://127.0.0.1:8000/property-layout";
      const method = isUpdate ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataToSubmit),
        });
        const data = await response.json();

        if (response.ok) {
          alert(
            isUpdate
              ? "Property configuration updated successfully."
              : "Property configuration created successfully."
          );
          handleClear();
          navigate("/bed-configuration");
        } else {
          throw new Error(data.message || "Failed to save configuration");
        }
      } catch (error) {
        console.error("Error submitting form data:", error);
        alert(error.message || "Error submitting form. Please try again.");
      }
    }
  };

  const handleClear = () => {
    setFormData({
      p_id: "",
      p_name: "",
      p_lay_display_name: "",
      dateOfRegistration: "",
      floor_count: "",
      floor_desc: "",
      floor_name: "",
      capacity_private_1_seater: "0",
      capacity_private_2_seater: "0",
      capacity_private_3_seater: "0",
      capacity_private_4_seater: "0",
      capacity_suite_room: "0",
      capacity_dormitory: "0",
    });
    setFloorTabs([]);
    setErrors({});
    setHasExistingConfig(false);
    setSearchTerm("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Side />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Property Configuration{" "}
              {!hasExistingConfig && (
                <span className="text-lg font-normal text-red-600">
                  (Complete the configuration)
                </span>
              )}
            </h1>
            {user && (
              <span className="text-sm font-medium text-gray-600">
                User: <span className="font-bold">{user.mobile}</span>
              </span>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700">
                  Property Name
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                      placeholder="Search property..."
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  {errors.p_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.p_name}</p>
                  )}
                </label>
                
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {isLoading ? (
                      <div className="py-2 px-3 text-gray-500">Loading properties...</div>
                    ) : filteredProperties.length > 0 ? (
                      filteredProperties.map((property, index) => (
                        <div
                          key={index}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                          onClick={() => selectProperty(property)}
                        >
                          <div className="flex items-center">
                            <span className="ml-3 block font-normal truncate">
                              {property.p_name}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 px-3 text-gray-500">No properties found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date of Registration
                  <input
                    type="text"
                    name="dateOfRegistration"
                    value={formData.dateOfRegistration}
                    readOnly
                    className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Property Display Name
                  <input
                    type="text"
                    name="p_lay_display_name"
                    value={formData.p_lay_display_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                    required
                  />
                  {errors.p_lay_display_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.p_lay_display_name}
                    </p>
                  )}
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Floors Count (Including ground floor)
                  <input
                    type="number"
                    name="floor_count"
                    value={formData.floor_count}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                    required
                  />
                  {errors.floor_count && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.floor_count}
                    </p>
                  )}
                </label>
              </div>
            </div>
          </div>

          {floorTabs.length > 0 && (
            <div className="space-y-8 p-4 bg-gray-100 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 text-center">
                Floor Configuration
              </h2>

              {floorTabs.map((tab, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {index === 0 ? "Ground Floor" : `Floor ${index}`}
                    </h3>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium text-gray-700">
                        {tab.is_active ? "Active" : "Not Active"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFloorActiveStatus(index)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          tab.is_active ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tab.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Floor Name
                        <input
                          type="text"
                          name="floor_name"
                          value={tab.floor_name}
                          onChange={(e) => handleTabInputChange(e, index)}
                          className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                          required
                        />
                        {errors[`floor_name_${index}`] && (
                          <p className="mt-1 p-2 text-sm text-red-600">
                            {errors[`floor_name_${index}`]}
                          </p>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Floor Capacity (Number of beds)
                        <input
                          type="number"
                          name="floorCapacity"
                          value={tab.floorCapacity}
                          readOnly
                          className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm"
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Floor Layout
                        <input
                          type="file"
                          name="floorLayout"
                          onChange={(e) => handleTabInputChange(e, index)}
                          className="mt-1 p-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Floor Description
                        <textarea 
                          name="floor_desc"
                          value={tab.floor_desc}
                          onChange={(e) => handleTabInputChange(e, index)}
                          className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                          rows={3}
                          
                        />
                        {errors[`floor_desc_${index}`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`floor_desc_${index}`]}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Room Capacities
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        {
                          label: "Private 1-Seater",
                          name: "capacity_private_1_seater",
                        },
                        {
                          label: "Private 2-Seater",
                          name: "capacity_private_2_seater",
                        },
                        {
                          label: "Private 3-Seater",
                          name: "capacity_private_3_seater",
                        },
                        {
                          label: "Private 4-Seater",
                          name: "capacity_private_4_seater",
                        },
                        { label: "Suite Room", name: "capacity_suite_room" },
                        { label: "Dormitory", name: "capacity_dormitory" },
                      ].map((capacity) => (
                        <div key={capacity.name} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {capacity.label}
                            <input
                              type="number"
                              name={capacity.name}
                              value={tab[capacity.name]}
                              onChange={(e) => handleTabInputChange(e, index)}
                              min="0"
                              className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-ezzstay-secondary focus:ring-ezzstay-secondary"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2 bg-red-100 text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-ezzstay-base text-white font-medium rounded-lg hover:bg-ezzstay-base-light focus:outline-none focus:ring-2 focus:ring-ezzstay-secondary focus:ring-offset-2 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyConfiguration;