import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
const EditableBookingDetails = () => {
  const location = useLocation();
  const hotel = location.state?.hotel;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem("searchData");
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    setIsLocked(false);
    setIsEditing(!isEditing);
  };
  console.log("hotel", hotel);
  console.log("formData", formData);
  const handleSkipToBooking = async (e) => {
    // Prevent default button submission behavior
    e.preventDefault();

    // Validation checks
    const errors = {};

    // Validate Date
    if (!formData.date) {
      errors.date = "Date is required";
    }

    // Validate Time
    if (!formData.time) {
      errors.time = "Time is required";
    }

    // Validate Hours
    const hours = parseInt(formData.hours, 10);
    if (!formData.hours || isNaN(hours) || hours < (hotel?.min_hours || 1)) {
      errors.hours = `Hours must be at least ${hotel?.min_hours || 1}`;
    } else if (hours > 24) {
      errors.hours = "Maximum booking hours is 24";
    }

    // Validate People
    const people = parseInt(formData.people, 10);
    if (!formData.people || isNaN(people) || people < 1) {
      errors.people = "Number of people must be at least 1";
    }

    // If there are any errors, set them and prevent submission
    if (Object.keys(errors).length > 0) {
      // Assuming you have a state to manage form errors
      // setFormErrors(errors);

      // Optional: Scroll to the first error or show a general error message
      alert("Please correct the errors in the form before continuing.");
      return;
    }

    try {
      // Clear any previous errors
      // setFormErrors({});

      // Proceed with booking
      sessionStorage.setItem("searchData", JSON.stringify(formData));
      const payload = {
        selectedHotelID: hotel.p_id,
        date: formData.date,
        time: formData.time,
        hours: formData.hours,
        people: formData.people,
      };

      const res =
        formData.stayType === "dormitory"
          ? await axios.post("http://127.0.0.1:8000/auto_select_dorm", payload)
          : await axios.post("http://127.0.0.1:8000/auto_select_room", payload);

      const autoSelectedRoom = res.data;
      // Navigate to "/floor-selection" with hotel and autoSelectedRoom in state
      navigate("/floor-selection", { state: { hotel, autoSelectedRoom } });
    } catch (error) {
      console.error("Auto-selection failed:", error);
      alert("No available room meets your criteria. Please select manually.");
    }
  };

  const handleFloorSelection = () => {
    sessionStorage.setItem("searchData", JSON.stringify(formData)); // Store all data under "searchData"
    navigate("/floor-selection", { state: { hotel } }); // Adjust the route as needed
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Final Booking Data:", formData);
    setIsLocked(true);
    sessionStorage.setItem("searchData", JSON.stringify(formData)); // Save to "searchData"

    fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Booking Successful:", data);
      })
      .catch((error) => {
        console.error("Error booking:", error);
      });
  };

  return (
    <div className="text-black  mt-4 flex justify-center items-center">
      <div className="max-w-md w-full bg-gray-200 rounded-lg p-3 shadow-md">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold">Details</h3>
          {/* <button
            onClick={handleEditToggle}
            className="text-blue-500 font-medium"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button> */}
        </div>
        <form onSubmit={handleSubmit}>
          {/* Form Fields */}
          <div className="grid grid-cols-8 gap-2">
            <div className="col-span-5">
              <div className="flex items-center bg-white rounded-lg p-2 border border-gray-300">
                <span className="mr-2 text-ezzstay-base">
                  <i className="fas fa-calendar-alt"></i>
                </span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full focus:outline-none"
                  required
                  disabled={isLocked}
                  min={
                    new Date(new Date().setDate(new Date().getDate() + 1))
                      .toISOString()
                      .split("T")[0]
                  }
                />
              </div>
            </div>
            <div className="col-span-3">
              <div className="flex items-center bg-white rounded-lg p-3 border border-gray-300">
                <span className="mr-2 text-ezzstay-base">
                  <i className="fas fa-clock"></i>
                </span>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full focus:outline-none"
                  required
                  //disabled={isLocked}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, "0");
                    // const ampm = i < 12 ? `${hour}:00 am` : `${(i === 12 ? 12 : i - 12).toString().padStart(2, "0")}:00 pm`;
                    return (
                      <option key={hour} value={`${hour}:00:00`}>
                        {/* {ampm} */}
                        {hour}:00
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 py-2 gap-2">
            <div className="flex items-center bg-white rounded-lg p-3 border border-gray-300">
              <span className="mr-2 text-ezzstay-base">
                <i className="fas fa-hourglass-half"></i>
              </span>
              <input
                type="number"
                name="hours"
                value={formData.hours}
                onChange={(e) => {
                  // Remove any decimal points or non-integer inputs
                  const value = e.target.value.replace(/[^\d]/g, "");

                  // Update formData with only integer values
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: "hours",
                      value: value,
                    },
                  });
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;

                  if (isNaN(value)) {
                    // Reset to minimum hours if input is invalid
                    handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: "hours",
                        value: hotel?.min_hours || 1,
                      },
                    });
                    alert("Please enter a valid number of hours.");
                    return;
                  }

                  if (value > 24) {
                    handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: "hours",
                        value: 24,
                      },
                    });
                    alert(
                      "Maximum booking hours is 24. Please contact the hotel owner for multiple day booking."
                    );
                  } else if (value < (hotel?.min_hours || 1)) {
                    handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: "hours",
                        value: hotel?.min_hours || 1,
                      },
                    });
                    alert(`Minimum booking hours is ${hotel?.min_hours || 1}`);
                  }
                }}
                placeholder="Hours"
                className="w-full focus:outline-none"
                required
                disabled={isLocked}
                max="24"
                min={hotel?.min_hours || 1}
                step="1" // Ensures only whole numbers can be input
              />
            </div>

            <div className="flex items-center bg-white rounded-lg p-3 border border-gray-300">
              <span className="mr-2 text-ezzstay-base">
                <i className="fas fa-users"></i>
              </span>
              <input
                type="number"
                name="people"
                value={formData.people}
                onChange={(e) => {
                  // Remove any decimal points or non-integer inputs
                  const value = e.target.value.replace(/[^\d]/g, "");

                  // Update formData with only integer values
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: "people",
                      value: value,
                    },
                  });
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;

                  if (isNaN(value) || value < 1) {
                    // Reset to 1 if input is invalid
                    handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: "people",
                        value: 1,
                      },
                    });
                    alert("Minimum number of people is 1.");
                  }
                }}
                placeholder="People"
                className="w-full focus:outline-none"
                required
                disabled={isLocked}
                min="1"
                step="1" // Ensures only whole numbers can be input
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleFloorSelection}
            className="w-full bg-ezzstay-base text-white py-3 rounded-md font-bold mb-2 mt-2"
          >
            Select Room
          </button>
          <button
            type="submit"
            className="w-full border-2 border-ezzstay-base text-ezzstay-base py-3 rounded-md font-bold"
            onClick={handleSkipToBooking}
          >
            Skip and Continue Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditableBookingDetails;
