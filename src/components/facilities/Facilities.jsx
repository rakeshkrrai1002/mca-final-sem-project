import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";

function FacilitiesAmenities() {
  const { user } = useUser();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [facilities, setFacilities] = useState({
    wifi_available: 0,
    parking_available: 0,
    room_service_available: 0,
    ac_available: 0,
    restaurant_available: 0,
    laundry_available: 0,
    additional_information: "",
    is_active: 1,
  });
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all properties based on user permissions
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
            setProperties(data);
          } else if (canAccess(roleData.role, "allPropertyList")) {
            const response = await fetch(
              `http://127.0.0.1:8000/fetchAllProperty`
            );
            const data = await response.json();
            setProperties(data);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchData();
    }
  }, [user]);

  // When a property is selected, fetch its facilities configuration
  useEffect(() => {
    if (selectedProperty) {
      setLoading(true);
      fetch(
        `http://127.0.0.1:8000/get_property_common_settings/${selectedProperty.p_id}`
      )
        .then((res) => res.json())
        .then((data) => {
          // Check if data exists by confirming a key, for example p_id may not be returned,
          // so here we check if any field exists.
          if (data && data.wifi_available !== undefined) {
            setFacilities(data);
            setIsExisting(true);
          } else {
            setFacilities({
              wifi_available: 0,
              parking_available: 0,
              room_service_available: 0,
              ac_available: 0,
              restaurant_available: 0,
              laundry_available: 0,
              additional_information: "",
              is_active: 1,
            });
            setIsExisting(false);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching facility settings:", err);
          setLoading(false);
        });
    }
  }, [selectedProperty]);

  const handlePropertyChange = (e) => {
    const property = properties.find(
      (prop) => prop.p_id === parseInt(e.target.value, 10)
    );
    setSelectedProperty(property);

    // Save to localStorage
    if (property) {
      localStorage.setItem("selectedProperty", JSON.stringify(property));
    } else {
      localStorage.removeItem("selectedProperty");
    }
  };

  // Add this useEffect to load from localStorage when component mounts
  useEffect(() => {
    const storedProperty = localStorage.getItem("selectedProperty");
    if (storedProperty) {
      setSelectedProperty(JSON.parse(storedProperty));
    }
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFacilities((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProperty) {
      alert("Please select a property.");
      return;
    }
    const endpoint = isExisting
      ? `http://127.0.0.1:8000/update_property_common_settings/${selectedProperty.p_id}`
      : `http://127.0.0.1:8000/set_property_common_settings/${selectedProperty.p_id}`;
    // Use POST for new data and PUT for updating existing data
    fetch(endpoint, {
      method: isExisting ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facilities),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Facilities updated successfully!");
      })
      .catch((err) => {
        console.error("Error updating facilities:", err);
        alert("Error updating facilities.");
      });
  };

  return (
    <div className="flex">
      <Side />
      <div className="bg-gradient-to-br w-full from-purple-50 to-gray-100 min-h-screen p-6">
        <div className="container mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-ezzstay-base text-white p-6">
            <h1 className="text-2xl font-bold">Facilities and Amenities</h1>
          </div>

          <div className="p-6">
            {/* Property Dropdown */}
            <div className="mb-6">
              <label
                htmlFor="property-dropdown"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Select Property:
              </label>
              <select
                id="property-dropdown"
                className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                onChange={handlePropertyChange}
                value={selectedProperty?.p_id || ""}
              >
                <option value="">Select Property</option>
                {properties.map((property) => (
                  <option key={property.p_id} value={property.p_id}>
                    {property.p_name}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Free WiFi */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="wifi_available"
                      checked={facilities.wifi_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Free WiFi</span>
                  </div>
                  {/* Free Parking */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="parking_available"
                      checked={facilities.parking_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Free Parking</span>
                  </div>
                  {/* Room Service */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="room_service_available"
                      checked={facilities.room_service_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Room Service</span>
                  </div>
                  {/* AC */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="ac_available"
                      checked={facilities.ac_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>AC</span>
                  </div>
                  {/* Restaurant */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="restaurant_available"
                      checked={facilities.restaurant_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Restaurant</span>
                  </div>
                  {/* Laundry */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="laundry_available"
                      checked={facilities.laundry_available === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Laundry</span>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-4">
                  <label
                    htmlFor="additional_information"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Additional Information
                  </label>
                  <textarea
                    id="additional_information"
                    name="additional_information"
                    value={facilities.additional_information}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                    rows="4"
                  ></textarea>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-ezzstay-base text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilitiesAmenities;
