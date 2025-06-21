import React, { useState, useEffect } from "react";

import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";

function GeneralPricing() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);

  const [minHours, setMinHours] = useState(0);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [floors, setFloors] = useState([]);
  const [types, setTypes] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [tax, setTax] = useState({ gst: 0, service: 0, other: 0 });
  const [gstChecked, setGstChecked] = useState(false);
  const [serviceChecked, setServiceChecked] = useState(false);
  const [otherChecked, setOtherChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchGeneralPricingData = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/get_general_pricing/${selectedProperty.p_id}`
      );
      if (response.ok) {
        const data = await response.json();

        // Find the data from the property_floor and master_type from the respective foreign keys in general pricing
        const enrichedData = data.map((row) => {
          const type = types.find((t) => t.type_id === row.type_id);
          const floor = floors.find((f) => f.floor_id === row.floor_id);
          return {
            ...row,
            type: type || { type_id: row.type_id, type_name: "Unknown" }, // Add fallback if no match
            floor: floor || {
              floor_id: row.floor_id,
              floor_name: "Unknown",
            }, // Add fallback if no match
          };
        });

        setFetchedRows(enrichedData); // Store the enriched data in fetchedRows
      }
    } catch (error) {
      console.error("Error fetching general pricing data:", error);
    }
  };

  // Fetch selected property pricing details (like taxes, etc.)
  const fetchPropertyDetails = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/get_property_pricing_details/${selectedProperty.p_id}`
      );
      if (response.ok) {
        const data = await response.json();

        // Assuming minimum hours and checkbox info are part of this data
        const minHours = data[0]?.min_hours || 0; // Adjust depending on the structure of your response

        // For checkbox booleans, check the fields from the database response
        const gstChecked = data[0]?.apply_gst === 1; // Check if GST is applied
        const serviceChecked = data[0]?.apply_service_tax === 1; // Check if Service Tax is applied
        const otherChecked = data[0]?.apply_other_tax === 1; // Check if Other Tax is applied

        // Update state
        setMinHours(minHours);
        setGstChecked(gstChecked);
        setServiceChecked(serviceChecked);
        setOtherChecked(otherChecked);
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    }
  };

  useEffect(() => {
    if (user) {
      if (!selectedProperty) return;

      fetchGeneralPricingData();
      fetchPropertyDetails();
    }
  }, [selectedProperty, floors, types, user]);

  // to fetch all properties

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

  // delete from db
  const deleteFetchedRow = async (index) => {
    const rowToDelete = fetchedRows[index]; // Get the row to delete

    if (!rowToDelete || !rowToDelete.pricing_id) {
      alert("This row does not exist in the database.");
      return;
    }

    // Confirm the action with the user
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    try {
      // Make an API call to delete the row
      const response = await fetch(
        `http://127.0.0.1:8000/delete_general_pricing/${rowToDelete.pricing_id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove the row locally
        setFetchedRows(fetchedRows.filter((_, i) => i !== index));
        alert("Row deleted successfully.");
      } else {
        alert("Failed to delete the row. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting the row:", error);
      alert("An error occurred while deleting the row. Please try again.");
    }
  };

  // get floor details from db
  useEffect(() => {
    if (selectedProperty?.p_id) {
      const fetchFloorsData = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/get_floor/${selectedProperty.p_id}`
          );
          if (!response.ok) throw new Error("Failed to fetch floors");

          const data = await response.json();
          setFloors(data);
        } catch (error) {
          console.error("Error fetching floors:", error);
        }
      };

      fetchFloorsData();
    }
  }, [selectedProperty?.p_id]);

  // get types from master_type_of_bed table
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/get_types");
        if (!response.ok) throw new Error("Failed to fetch types");

        const data = await response.json();
        setTypes(data); // Set the array of properties
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };

    fetchTypes();
  }, []);

  // update fields based on the property changed
  const handlePropertySelectChange = (e) => {
    const selected = properties.find(
      (property) => property.p_id === parseInt(e.target.value, 10)
    );
    setSelectedProperty(selected); // Store the full property object

    // Save selected property to localStorage
    if (selected) {
      localStorage.setItem("selectedProperty", JSON.stringify(selected));
    }

    // Reset state before fetching new data
    setFetchedRows([]); // Reset fetched rows
    setRows([]); // Reset dynamic rows
    setMinHours(0); // Reset minimum hours
    setGstChecked(false); // Reset GST checkbox
    setServiceChecked(false); // Reset Service Tax checkbox
    setOtherChecked(false); // Reset Other Tax checkbox
    setFloors([]);

    // Destroy the stored selectedFloor
    localStorage.removeItem("selectedFloor");
  };

  // Load selected property from localStorage on component mount
  useEffect(() => {
    const storedProperty = localStorage.getItem("selectedProperty");
    if (storedProperty) {
      const parsedProperty = JSON.parse(storedProperty);
      setSelectedProperty(parsedProperty);
    }
  }, []);

  const handleCheckboxChange = (type) => {
    if (type === "gst") {
      setGstChecked(!gstChecked); // Toggle gstChecked
    } else if (type === "service") {
      setServiceChecked(!serviceChecked); // Toggle serviceChecked
    } else if (type === "other") {
      setOtherChecked(!otherChecked); // Toggle otherChecked
    }
  };

  // get the tax amount
  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/get_tax");
        if (!response.ok) throw new Error("Failed to fetch tax data");

        const data = await response.json();

        // Extract tax information from the response data
        const gst = data.find((tax) => tax.tax_name === "GST");
        const service = data.find((tax) => tax.tax_name === "Service");
        const other = data.find((tax) => tax.tax_name === "Other");

        // Set the tax state based on the fetched data
        setTax({
          gst: gst ? gst.tax_percentage : 0,
          service: service ? service.tax_percentage : 0,
          other: other ? other.tax_percentage : 0,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchTaxData();
  }, []);

  // handle the checkbox changes
  const applyTaxes = (baseRate, taxes, taxCheckboxes) => {
    let totalTaxes = 0;

    for (const [key, total] of Object.entries(taxes)) {
      if (taxCheckboxes[key]) {
        totalTaxes += (baseRate * total) / 100;
      }
    }

    return totalTaxes;
  };

  // add new dynamic rows
  const addRow = () => {
    console.log("adding rows");
    if (rows.length > 0) {
      console.log("there are existing rows");
      const lastRow = rows[rows.length - 1];

      // Validate the last row before adding a new one
      if (!lastRow.floor || !lastRow.type || lastRow.total <= 0) {
        alert(
          "Please fill in the current row's details before adding a new one."
        );
        return;
      }
    }

    // Add a new row if no rows exist or the last row is valid
    setRows([...rows, { floor: null, type: null, rate: 0, total: 0 }]);
  };

  // delete dynamic row
  const deleteRow = (index) => {
    // Remove the row at the specified index
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  useEffect(() => {
    const updatedRows = rows.map((row) => {
      const baseRate = parseFloat(row.rate || 0);
      const totalTaxes = applyTaxes(baseRate, tax, {
        gst: gstChecked,
        service: serviceChecked,
        other: otherChecked,
      });

      return {
        ...row,
        total: (baseRate + totalTaxes).toFixed(2), // Add taxes to the base value
      };
    });

    // Only update rows if they have changed
    if (JSON.stringify(rows) !== JSON.stringify(updatedRows)) {
      setRows(updatedRows);
    }
  }, [gstChecked, serviceChecked, otherChecked, tax, rows]);
  //  update data in the dynamic rows
  const handleRowChange = (index, field, value) => {
    const updatedRows = rows.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        return updatedRow;
      }
      return row;
    });

    // Update rows after value change
    setRows(updatedRows);
  };

  useEffect(() => {
    const updatedFetchedRows = fetchedRows.map((row) => {
      const baseRate = parseFloat(row.rate || 0);
      const totalTaxes = applyTaxes(baseRate, tax, {
        gst: gstChecked,
        service: serviceChecked,
        other: otherChecked,
      });

      return {
        ...row,
        total: (baseRate + totalTaxes).toFixed(2), // Add taxes to the base value
      };
    });

    // Only update fetchedRows if they have changed
    if (JSON.stringify(fetchedRows) !== JSON.stringify(updatedFetchedRows)) {
      setFetchedRows(updatedFetchedRows);
    }
  }, [gstChecked, serviceChecked, otherChecked, tax, fetchedRows]);

  // Handle changes made in the db rows
  const handleFetchedRowChange = (index, field, value) => {
    const updatedFetchedRows = fetchedRows.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        return updatedRow;
      }
      return row;
    });

    // Update fetchedRows after value change
    setFetchedRows(updatedFetchedRows);
  };

  // idk if this needs any explaining
  function handleSave() {
    // Check if already saving or publishing
    if (isSaving || isPublishing) {
      return;
    }

    const isFormValid = () => {
      if (!selectedProperty || minHours <= 0) return false;
      return (
        rows.every((row) => row.floor && row.type && row.rate > 0) &&
        fetchedRows.every((row) => row.floor && row.type && row.rate > 0)
      );
    };

    if (!isFormValid()) {
      alert("Please complete the form before saving!");
      return;
    }

    // Set saving state to true
    setIsSaving(true);

    // Prepare Property Pricing Data
    const propertyPricingData = {
      min_hours: minHours,
      applyGST: gstChecked,
      applyService: serviceChecked,
      applyOthers: otherChecked,
    };

    // Prepare Fetched Rows for Update
    const updatedGeneralPricingData = Object.values(fetchedRows).map((row) => ({
      pricing_id: row.pricing_id,
      floor_id: row.floor?.floor_id,
      type_id: row.type?.type_id,
      rate: parseFloat(row.rate),
    }));

    // Prepare New Rows for Insert
    const newGeneralPricingData = Object.values(rows).map((row) => ({
      mobile_no: user.mobile,
      p_id: selectedProperty.p_id,
      floor_id: row.floor?.floor_id,
      type_id: row.type?.type_id,
      rate: parseFloat(row.rate),
    }));

    // Update Fetched Rows (PUT /update_general_pricing)
    Promise.all(
      updatedGeneralPricingData.map((row) =>
        fetch(
          `http://127.0.0.1:8000/update_general_pricing/${row.pricing_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(row),
          }
        )
          .then((response) => response.json())
          .catch((error) => {
            console.error("Error updating row:", error);
            throw error;
          })
      )
    )
      .then(() => {
        // Insert New Rows (POST /pricing)
        return fetch("http://127.0.0.1:8000/pricing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newGeneralPricingData),
        })
          .then((response) => response.json())
          .catch((error) => {
            console.error("Error inserting new rows:", error);
            throw error;
          });
      })
      .then(() => {
        // Put data to Property Info endpoint (PUT /property_pricing_details)
        return fetch(
          `http://127.0.0.1:8000/property_pricing_details/${selectedProperty.p_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(propertyPricingData),
          }
        )
          .then((response) => response.json())
          .catch((error) => {
            console.error("Error updating property info:", error);
            throw error;
          });
      })
      .then(() => {
        alert("Data saved successfully!");

        // Reset states and re-fetch data
        setRows([]);

        // Re-fetch general pricing data
        fetchGeneralPricingData();

        // Re-fetch property details
        fetchPropertyDetails();
      })
      .catch(() => {
        alert("An error occurred while saving the data. Please try again.");
      })
      .finally(() => {
        // Set saving state back to false when done
        setIsSaving(false);
      });
  }

  function handlePublish() {
    // Check if already saving or publishing
    if (isSaving || isPublishing) {
      return;
    }

    const isFormValid = () => {
      if (!selectedProperty || minHours <= 0) return false;
      return (
        rows.every((row) => row.floor && row.type && row.rate > 0) &&
        fetchedRows.every((row) => row.floor && row.type && row.rate > 0)
      );
    };

    if (!isFormValid()) {
      alert("Please complete the form before publishing!");
      return;
    }
    // Set publishing state to true
    setIsPublishing(true);
    // Make a PUT request to publish the general pricing data
    fetch(
      `http://127.0.0.1:8000/publish_general_pricing/${selectedProperty.p_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to publish general pricing");
        }
        return response.json();
      })
      .then((data) => {
        alert("General pricing published successfully!");

        // Reset states and re-fetch data
        setRows([]);

        // Re-fetch general pricing data
        fetchGeneralPricingData();

        // Re-fetch property details
        fetchPropertyDetails();
      })
      .catch((error) => {
        console.error("Error publishing general pricing:", error);
        alert("An error occurred while publishing the data. Please try again.");
      })
      .finally(() => {
        // Set publishing state back to false when done
        setIsPublishing(false);
      });
  }

  return (
    <div className="flex">
      <Side />
      <div className="bg-gradient-to-br w-full from-purple-50 to-gray-100 min-h-screen p-6">
        <div className="container mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-ezzstay-base text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Pricing Configuration</h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Property Selection and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <label
                  htmlFor="property-dropdown"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  Select Property:
                </label>
                <select
                  id="property-dropdown"
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                  onChange={handlePropertySelectChange}
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

              <div className="flex flex-col">
                <label
                  htmlFor="min-hours"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  Minimum Hours:
                </label>
                <input
                  type="number"
                  id="min-hours"
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                  value={minHours}
                  onChange={(e) => setMinHours(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Tax Settings:
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gstChecked}
                        onChange={() => handleCheckboxChange("gst")}
                        className="rounded text-ezzstay-base focus:ring focus:ring-purple-200"
                      />
                      <span className="text-gray-700">GST ({tax.gst}%)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={serviceChecked}
                        onChange={() => handleCheckboxChange("service")}
                        className="rounded text-ezzstay-base focus:ring focus:ring-purple-200"
                      />
                      <span className="text-gray-700">
                        Service ({tax.service}%)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={otherChecked}
                        onChange={() => handleCheckboxChange("other")}
                        className="rounded text-ezzstay-base focus:ring focus:ring-purple-200"
                      />
                      <span className="text-gray-700">
                        Other ({tax.other}%)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dormitory Pricing Section */}
            <div className="mt-8 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                General Pricing for Dormitory Beds
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Remember to publish the pricing after configuration
              </p>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 text-left">
                    <th className="p-4">Floor</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Rate (₹)</th>
                    <th className="p-4">Total (₹)</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchedRows.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="p-4">
                        <select
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.floor?.floor_id || ""}
                          onChange={(e) => {
                            const selectedFloor = floors.find(
                              (floor) =>
                                floor.floor_id === parseInt(e.target.value, 10)
                            );
                            handleFetchedRowChange(
                              index,
                              "floor",
                              selectedFloor
                            );
                          }}
                        >
                          <option value={row.floor?.floor_id}>
                            {row.floor?.floor_name || "Select Floor"}
                          </option>
                          {floors.map((floor) => (
                            <option key={floor.floor_id} value={floor.floor_id}>
                              {floor.floor_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.type?.type_id || ""}
                          onChange={(e) => {
                            const selectedType = types.find(
                              (type) =>
                                type.type_id === parseInt(e.target.value, 10)
                            );
                            const isTypeAlreadySelected = fetchedRows.some(
                              (fetchedRow, idx) =>
                                idx !== index &&
                                fetchedRow.floor?.floor_id ===
                                  row.floor?.floor_id &&
                                fetchedRow.type?.type_id ===
                                  selectedType?.type_id
                            );
                            if (isTypeAlreadySelected) {
                              alert(
                                `The type "${selectedType?.type_name}" is already selected for the floor "${row.floor?.floor_name}".`
                              );
                              return;
                            }
                            handleFetchedRowChange(index, "type", selectedType);
                          }}
                          disabled={!row.floor?.floor_id}
                        >
                          <option value={row.type?.type_id}>
                            {row.type?.type_name || "Select Type"}
                          </option>
                          {types.map((type) => (
                            <option key={type.type_id} value={type.type_id}>
                              {type.type_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.rate}
                          onChange={(e) =>
                            handleFetchedRowChange(
                              index,
                              "rate",
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="p-4 font-medium">{row.total}</td>
                      <td className="p-4">
                        <button
                          className="inline-flex items-center justify-center p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          onClick={() => deleteFetchedRow(index)}
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
                      </td>
                    </tr>
                  ))}

                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                        (fetchedRows.length + index) % 2 === 0
                          ? "bg-gray-50"
                          : "bg-white"
                      }`}
                    >
                      <td className="p-4">
                        <select
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.floor?.floor_id || ""}
                          onChange={(e) => {
                            const selectedFloor = floors.find(
                              (floor) =>
                                floor.floor_id === parseInt(e.target.value, 10)
                            );
                            handleRowChange(index, "floor", selectedFloor);
                          }}
                        >
                          <option value="">Select Floor</option>
                          {floors.map((floor) => (
                            <option key={floor.floor_id} value={floor.floor_id}>
                              {floor.floor_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.type?.type_id || ""}
                          onChange={(e) => {
                            const selectedType = types.find(
                              (type) =>
                                type.type_id === parseInt(e.target.value, 10)
                            );
                            handleRowChange(index, "type", selectedType);
                          }}
                          disabled={!row.floor?.floor_id}
                        >
                          <option value="">Select Type</option>
                          {types
                            .filter(
                              (type) =>
                                ![
                                  ...fetchedRows.map((fetchedRow) =>
                                    fetchedRow.floor?.floor_id ===
                                    row.floor?.floor_id
                                      ? fetchedRow.type?.type_id
                                      : null
                                  ),
                                ].includes(type.type_id) &&
                                !rows.some(
                                  (r, idx) =>
                                    idx !== index &&
                                    r.floor?.floor_id === row.floor?.floor_id &&
                                    r.type?.type_id === type.type_id
                                )
                            )
                            .map((type) => (
                              <option key={type.type_id} value={type.type_id}>
                                {type.type_name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                          value={row.rate}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "rate",
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="p-4 font-medium">{row.total}</td>
                      <td className="p-4">
                        <button
                          className="inline-flex items-center justify-center p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          onClick={() => deleteRow(index)}
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
                      </td>
                    </tr>
                  ))}

                  {fetchedRows.length === 0 && rows.length === 0 && (
                    <tr>
                      <td className="p-12 text-center" colSpan="5">
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
                          No pricing configurations found
                        </h3>
                        <p className="mt-1 text-gray-500">
                          Add new configurations using the button below
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                className="bg-ezzstay-base text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                onClick={addRow}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Configuration
              </button>
              <button
                className="bg-ezzstay-base text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                onClick={handleSave}
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
              <button
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md flex items-center gap-2"
                onClick={handlePublish}
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralPricing;
