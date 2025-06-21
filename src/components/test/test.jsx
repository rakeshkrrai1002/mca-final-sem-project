import React, { useEffect, useState } from "react";
import axios from "axios";
import Side from "../Sidebar/Sidebar";

const PartnerRegistration = () => {
  const [registrationDate, setRegistrationDate] = useState("");
  const [formData, setFormData] = useState({
    p_name: "",
    p_address1: "",
    p_address2: "",
    city: "",
    pincode: "",
    state: "",
    approvalstatus: "Open", // Default value is "Open"
    manager_name: "",
    manager_mobile_no: "",
    owner_name: "",
    owner_mobile: "",
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

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      if (!formData[field]) {
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
    if (!/^[a-zAAT\s]+$/.test(formData.city)) {
      newErrors.city = "City name should only contain letters and spaces.";
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.manager_name)) {
      newErrors.manager_name =
        "Manager name should only contain letters and spaces.";
    }
    if (!/^[0-9]{10}$/.test(formData.manager_mobile_no)) {
      newErrors.manager_mobile_no =
        "Manager mobile number must be a 10-digit number.";
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.owner_name)) {
      newErrors.owner_name =
        "Owner name should only contain letters and spaces.";
    }
    if (!/^[0-9]{10}$/.test(formData.owner_mobile)) {
      newErrors.owner_mobile = "Owner mobile number must be a 10-digit number.";
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
      });
      setEdit(true);
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
      approvalstatus: "Open", // Reset to "Open"
      manager_name: "",
      manager_mobile_no: "",
      owner_name: "",
      owner_mobile: "",
    });
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div style={styles.container}>
      <Side />
      <div style={styles.formContainer}>
        <h2 style={styles.header}>Partner Registration</h2>
        {isEdit && (
          <div style={{ position: "relative", width: "300px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Select a property"
              style={styles.searchInput}
            />
            {searchTerm && (
              <ul style={styles.searchList}>
                {filteredProperties.length > 0 ? (
                  filteredProperties.map((property, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelect(property)}
                      style={styles.searchItem}
                    >
                      {property}
                    </li>
                  ))
                ) : (
                  <li style={styles.searchItem}>No properties found</li>
                )}
              </ul>
            )}
          </div>
        )}
        {successMessage && (
          <div style={styles.successMessage}>{successMessage}</div>
        )}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Property Name</label>
            <input
              type="text"
              name="p_name"
              value={formData.p_name}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.p_name && (
              <span style={styles.errorText}>{errors.p_name}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Registration</label>
            <input
              type="text"
              value={registrationDate}
              readOnly
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Property Address Line 1</label>
            <input
              type="text"
              name="p_address1"
              value={formData.p_address1}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.p_address1 && (
              <span style={styles.errorText}>{errors.p_address1}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Property Address Line 2</label>
            <input
              type="text"
              name="p_address2"
              value={formData.p_address2}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <select
              name="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              style={styles.input}
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
            {errors.city && <span style={styles.errorText}>{errors.city}</span>}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.pincode && (
              <span style={styles.errorText}>{errors.pincode}</span>
            )}
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.state && (
              <span style={styles.errorText}>{errors.state}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Approval Status</label>
            <input
              type="text"
              value={formData.approvalstatus}
              readOnly
              style={styles.input}
            />
            {/* Display "Open" */}
                      
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Manager Name</label>
            <input
              type="text"
              name="manager_name"
              value={formData.manager_name}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.manager_name && (
              <span style={styles.errorText}>{errors.manager_name}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Manager Mobile</label>
            <input
              type="text"
              name="manager_mobile_no"
              value={formData.manager_mobile_no}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.manager_mobile_no && (
              <span style={styles.errorText}>{errors.manager_mobile_no}</span>
            )}
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Owner Name</label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.owner_name && (
              <span style={styles.errorText}>{errors.owner_name}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Owner Mobile</label>
            <input
              type="text"
              name="owner_mobile"
              value={formData.owner_mobile}
              onChange={handleInputChange}
              style={styles.input}
            />
            {errors.owner_mobile && (
              <span style={styles.errorText}>{errors.owner_mobile}</span>
            )}
          </div>
        </div>
        <div style={styles.buttonContainer}>
          <button onClick={handleClear} style={styles.clearButton}>
            Clear
          </button>
          <button onClick={handleSubmit} style={styles.submitButton}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
  },
  formContainer: {
    maxWidth: "700px",
    margin: "1px ",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  formGroup: {
    width: "48%",
    marginBottom: "15px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  errorText: {
    color: "red",
    fontSize: "12px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  clearButton: {
    padding: "10px 20px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  searchInput: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "100%",
    fontSize: "14px",
    marginBottom: "5px",
  },
  searchList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    maxHeight: "150px",
    overflowY: "auto",
    border: "1px solid #ccc",
    position: "absolute",
    backgroundColor: "white",
    width: "100%",
    zIndex: 999,
  },
  searchItem: {
    padding: "8px",
    cursor: "pointer",
  },
  successMessage: {
    padding: "10px",
    marginBottom: "15px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "5px",
  },
};

export default PartnerRegistration;
