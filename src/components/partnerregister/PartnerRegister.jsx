import React, { useEffect, useState } from "react";
import axios from "axios";
import Side from "../sidebar/sidebar";
import { Search } from "lucide-react";
import { useUser } from "../userContext/userContext";

const PartnerRegistration = () => {
  const [registrationDate, setRegistrationDate] = useState("");
  const [formData, setFormData] = useState({
    p_name: "",
    p_address1: "",
    p_address2: "",
    city: "",
    pincode: "",
    state: "",
    approvalstatus: "Open",
    manager_name: "",
    manager_mobile_no: "",
    owner_name: "",
    owner_mobile: "",
    property_images: null,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isEdit, setEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [cities, setCities] = useState([]);
  const { user } = useUser();
  const [previewImages, setPreviewImages] = useState([]);

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      if (
        !formData[field] &&
        field !== "p_address2" &&
        field !== "property_images"
      ) {
        newErrors[field] = "This field is mandatory, please fill it.";
      }
    });
    if (!/^[a-zA-Z\s]+$/.test(formData.p_name)) {
      newErrors.p_name =
        "Property name should only contain letters and spaces.";
    }
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be a 6-digit number.";
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.state)) {
      newErrors.state = "State name should only contain letters and spaces.";
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.city)) {
      newErrors.city = "City name should only contain letters and spaces.";
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.manager_name)) {
      newErrors.manager_name =
        "Manager name should only contain letters and spaces.";
    }
    if (!/^[6-9]\d{9}$/.test(formData.manager_mobile_no)) {
      newErrors.manager_mobile_no = "invalid manager mobile number.";
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.owner_name)) {
      newErrors.owner_name =
        "Owner name should only contain letters and spaces.";
    }
    if (!/^[6-9]\d{9}$/.test(formData.owner_mobile)) {
      newErrors.owner_mobile = "invalid Owner mobile number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelect = (p_name) => {
    setSelectedProperty(p_name);
    setSearchTerm("");
    const selectedPartner = partners.find(
      (partner) => partner.property_name === p_name
    );
    if (selectedPartner) {
      setFormData({
        p_name: selectedPartner.property_name,
        p_address1: selectedPartner.address_line1,
        p_address2: selectedPartner.address_line2,
        city: selectedPartner.city,
        pincode: selectedPartner.pincode,
        state: selectedPartner.state,
        approvalstatus: selectedPartner.approvalstatus,
        manager_name: selectedPartner.manager_name,
        manager_mobile_no: selectedPartner.manager_mobile_no,
        owner_name: selectedPartner.owner_name,
        owner_mobile: selectedPartner.owner_mobile,
        property_images: selectedPartner.property_images || null,
      });
      setEdit(true);
      if (selectedPartner.property_images) {
        setPreviewImages([selectedPartner.property_images]);
      } else {
        setPreviewImages([]);
      }
    }
  };

  const filteredProperties = partners
    .filter(
      (partner) =>
        partner.property_name &&
        partner.property_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((partner) => partner.property_name);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/register-partners",
        {
          ...formData,
          date_registration: registrationDate,
          userMobile: user.mobile,
        }
      );
      if (response.status !== 200) throw new Error("Failed to save data");
      alert("Registration done successfully!");
      handleClear();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save. Please try again.");
    }
  };
  

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setRegistrationDate(formattedDate);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

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

  const handleClear = () => {
    setFormData({
      p_name: "",
      p_address1: "",
      p_address2: "",
      city: "",
      pincode: "",
      state: "",
      approvalstatus: "Open",
      manager_name: "",
      manager_mobile_no: "",
      owner_name: "",
      owner_mobile: "",
    });
    setErrors({});
    setSuccessMessage("");
    setPreviewImages([]);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Side />
      <div className="flex-1 p-4 md:p-8">
        <div className="bg-gradient-to-br w-full from-purple-50  to-gray-100 min-h-screen ">
          {/* Header Section */}
          <div className="bg-ezzstay-base rounded-t-xl shadow-md p-6 border-b-4 relative">
            <div className="absolute top-4 right-4">
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
                <span className="mr-2">Open</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <h2 className="text-3xl font-bold text-white">
              Partner Registration
            </h2>
            <p className="text-gray-50 mt-1">
              Manage property partner information
            </p>
          </div>

          {/* Main Form Section */}
          <div className="bg-white rounded-b-xl shadow-md p-6 mb-8">
            {/* Search Bar for Edit Mode */}
            {isEdit && (
              <div className="relative mb-8 border-2 border-purple-100 rounded-lg p-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search for a property..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  />
                  <Search className="absolute left-4 top-3.5 h-6 w-6 text-purple-500" />
                </div>
                {searchTerm && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border-2 border-purple-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredProperties.length > 0 ? (
                      filteredProperties.map((property, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelect(property)}
                          className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                        >
                          {property}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-gray-500">
                        No properties found
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center">
                <div className="mr-3 flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>{successMessage}</div>
              </div>
            )}

            {/* Form Sections */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                Property Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Property Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="p_name"
                    value={formData.p_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.p_name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.p_name && (
                    <p className="text-sm text-red-600">{errors.p_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Registration
                  </label>
                  <input
                    type="text"
                    value={registrationDate}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Property Address Line 1{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="p_address1"
                    value={formData.p_address1}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.p_address1
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.p_address1 && (
                    <p className="text-sm text-red-600">{errors.p_address1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Property Address Line 2
                  </label>
                  <input
                    type="text"
                    name="p_address2"
                    value={formData.p_address2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.city
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a city</option>
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
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.pincode
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-600">{errors.pincode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.state
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Manager Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.manager_name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.manager_name && (
                    <p className="text-sm text-red-600">
                      {errors.manager_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Manager Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="manager_mobile_no"
                    value={formData.manager_mobile_no}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.manager_mobile_no
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.manager_mobile_no && (
                    <p className="text-sm text-red-600">
                      {errors.manager_mobile_no}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.owner_name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.owner_name && (
                    <p className="text-sm text-red-600">{errors.owner_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_mobile"
                    value={formData.owner_mobile}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.owner_mobile
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.owner_mobile && (
                    <p className="text-sm text-red-600">
                      {errors.owner_mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Clear Form
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-ezzstay-base text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                Submit Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistration;