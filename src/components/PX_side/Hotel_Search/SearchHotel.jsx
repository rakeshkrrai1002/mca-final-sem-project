import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Autosuggest from "react-autosuggest";
import axios from "axios";

const SearchHotel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: "",
    date: "",
    time: "",
    hours: "",
    people: "",
    stayType: "",
    dayType: "single",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedData = sessionStorage.getItem("searchData");
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }

    // Fetch cities from FastAPI endpoint
    axios
      .get("http://127.0.0.1:8000/city")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCities(response.data);
        } else {
          console.error(
            "Expected an array of cities, but received:",
            response.data
          );
        }
      })
      .catch((error) => console.error("Failed to fetch cities:", error));
  }, []);

  // Function to get pre-signed URL
  const getPresignedUrl = async (objectKey) => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/presigned_url", {
        params: {
          object_key: objectKey,
        },
      });
      return response.data.presigned_url;
    } catch (error) {
      console.error("Failed to fetch pre-signed URL:", error);
      return null;
    }
  };

  // Get suggestions based on input value
  const getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    return inputValue === ""
      ? []
      : cities.filter((city) => city.toLowerCase().startsWith(inputValue));
  };

  // Update input value when suggestion is selected
  const getSuggestionValue = (suggestion) => suggestion;

  // Render each suggestion
  const renderSuggestion = (suggestion) => (
    <div className="p-2 hover:bg-gray-100 cursor-pointer">{suggestion}</div>
  );

  // Handle input changes for both Autosuggest and regular inputs
  const handleChange = (e, { newValue, method }) => {
    if (method === "type") {
      setFormData((prev) => ({
        ...prev,
        location: newValue,
      }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle suggestion selection
  const onSuggestionSelected = (event, { suggestion }) => {
    setFormData((prev) => ({
      ...prev,
      location: suggestion,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem("searchData", JSON.stringify(formData));
    navigate("/showhotels");
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    return (
      formData.location.trim().length >= 3 &&
      formData.date &&
      formData.time &&
      formData.hours > 0 &&
      formData.people > 0 
      // &&
      // formData.stayType
    );
  };

  useEffect(() => {
    if (formData.location.trim().length < 3) {
      setError("");
      return;
    }

    // Clear error when location changes
    setError("");

    const delayDebounceFn = setTimeout(async () => {
      try {
        await axios.get(
          `http://127.0.0.1:8000/search_property/${formData.location}`
        );
        // Success - no error to set
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("No properties available for this location");
        } else {
          console.error("Error checking hotels:", err);
          // setError("Error checking availability");
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.location]);

  // Second useEffect: Complete form validation
// Update in SearchHotel.jsx - Replace the second useEffect with this one:

useEffect(() => {
  // Skip validation if core fields are empty
  if (
    !formData.location ||
    !formData.date ||
    !formData.time ||
    !formData.hours ||
    !formData.people
  ) {
    return;
  }

  const delayDebounceFn = setTimeout(async () => {
    try {
      // Make an API call to validate the search criteria
      const response = await axios.post(
        "http://127.0.0.1:8000/check_search_criteria", 
        formData
      );
      
      if (response.data.status === "success") {
        setError(""); // Clear any existing error
      } else {
        setError(response.data.message);
        
        // Highlight the problematic field
        if (response.data.field) {
          const fieldElement = document.getElementById(response.data.field);
          if (fieldElement) {
            fieldElement.classList.add("border-red-500");
            setTimeout(() => {
              fieldElement.classList.remove("border-red-500");
            }, 3000);
          }
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error checking availability");
      }
    }
  }, 800);

  return () => clearTimeout(delayDebounceFn);
}, [
  formData.date,
  formData.time,
  formData.hours,
  formData.people,
  formData.stayType,
  formData.location,
]);

  // Theme for Autosuggest
  const theme = {
    container: "relative",
    input: "w-full focus:outline-none",
    suggestionsContainer: "absolute bg-white rounded-lg mt-1 z-10 w-full",
    suggestionHighlighted: "bg-gray-100",
  };

  return (
    <div className="text-black p-3 mt-4  flex justify-center items-center">
      <div>
{error && (
  <div className="text-red-500 text-sm mt-1 mb-3 p-2 bg-red-50 rounded-md border border-red-200 flex items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1.5 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <span className="font-medium">{error}</span>
  </div>
)}
        <form onSubmit={handleSubmit}>
          <div className="md:flex bg-gray bg-ezzstay-base p-4 rounded-lg md:gap-2 md:items-start">
            {/* Location with Auto-Suggestion and smaller label */}
            <div className="md:w-1/4 mb-3 md:mb-0">
              <label
                htmlFor="location"
                className="block text-xs font-medium text-white mb-0.5"
              >
                Location
              </label>
              <div className="flex items-center text-sm bg-white rounded-lg p-3 border border-gray-300 relative">
                <span className="mr-2 text-ezzstay-base">
                  <i className="fas fa-map-marker-alt"></i>
                </span>
                <Autosuggest
                  suggestions={suggestions}
                  onSuggestionsFetchRequested={({ value }) =>
                    setSuggestions(getSuggestions(value))
                  }
                  onSuggestionsClearRequested={() => setSuggestions([])}
                  getSuggestionValue={getSuggestionValue}
                  renderSuggestion={renderSuggestion}
                  onSuggestionSelected={onSuggestionSelected}
                  inputProps={{
                    id: "location",
                    placeholder: "Enter destination",
                    value: formData.location,
                    onChange: handleChange,
                    className: theme.input,
                    required: true,
                  }}
                  theme={theme}
                />
              </div>
            </div>

            {/* Other Form Fields */}
            <div className="grid grid-cols-8 gap-2  mb-3 md:mb-0 md:flex-1">
              {/* Date with smaller label - takes 5/8 of width */}
              <div className="col-span-5">
                <label
                  htmlFor="date"
                  className="block text-xs font-medium text-white mb-0.5"
                >
                  Check-in Date
                </label>
                <div className="flex items-center bg-white text-sm rounded-lg p-3 border border-gray-300">
                  <span className="mr-2 text-ezzstay-base">
                    <i className="fas fa-calendar-alt"></i>
                  </span>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full focus:outline-none"
                    required
                    min={
                      new Date(new Date().setDate(new Date().getDate() + 1))
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                </div>
              </div>

              {/* Time with smaller label - takes 3/8 of width */}
              <div className="col-span-3">
                <label
                  htmlFor="time"
                  className="block text-xs font-medium text-white mb-0.5"
                >
                  Check-in Time
                </label>
                <div className="flex items-center bg-white text-sm rounded-lg p-3 border border-gray-300">
                  <span className="mr-2 text-ezzstay-base">
                    <i className="fas fa-clock"></i>
                  </span>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full focus:outline-none"
                    required
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return (
                        <option key={hour} value={`${hour}:00:00`}>
                          {hour}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 mb-3 md:mb-0 md:flex-1">
              {/* First div containing Hours and Guests - takes 3/5 of width */}
              <div className="col-span-5">
                <div className="grid grid-cols-2 gap-2">
                  {/* Hours with smaller label */}
                  <div>
                    <label
                      htmlFor="hours"
                      className="block text-xs font-medium text-white mb-0.5"
                    >
                      Duration
                    </label>
                    <div className="flex items-center bg-white text-sm rounded-lg p-3 border border-gray-300">
                      <span className="mr-2 text-ezzstay-base">
                        <i className="fas fa-hourglass-half"></i>
                      </span>
                      <input
                        type="number"
                        id="hours"
                        name="hours"
                        value={formData.hours}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(
                            /[^\d]/g,
                            ""
                          );
                          const value = Number(inputValue);

                          if (!Number.isInteger(value)) {
                            alert("Please enter a whole number (no decimals).");
                            return;
                          }

                          setFormData({ ...formData, hours: inputValue });
                          if (error) setError(null);
                        }}
                        onBlur={(e) => {
                          const value = Number(formData.hours);

                          if (isNaN(value) || value < 1) {
                            setFormData({ ...formData, hours: "1" });
                            alert("Minimum booking hours is 1");
                          } else if (value > 24) {
                            setFormData({ ...formData, hours: "24" });
                            alert(
                              "Maximum booking hours is 24. Please contact hotel owner for multiple-day booking."
                            );
                          }
                        }}
                        placeholder="1-24"
                        className="w-full focus:outline-none"
                        required
                        max="24"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* People with smaller label */}
                  <div>
                    <label
                      htmlFor="people"
                      className="block text-xs font-medium text-white mb-0.5"
                    >
                      Guests
                    </label>
                    <div className="flex items-center bg-white text-sm rounded-lg p-3 border border-gray-300">
                      <span className="mr-2 text-ezzstay-base">
                        <i className="fas fa-users"></i>
                      </span>
                      <input
                        type="number"
                        id="people"
                        name="people"
                        value={formData.people}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(
                            /[^\d]/g,
                            ""
                          );
                          const value = Number(inputValue);

                          if (!Number.isInteger(value)) {
                            alert("Please enter a whole number (no decimals).");
                            return;
                          }

                          setFormData({ ...formData, people: inputValue });
                          if (error) setError(null);
                        }}
                        onBlur={(e) => {
                          const value = Number(formData.people);

                          if (isNaN(value) || value < 1) {
                            setFormData({ ...formData, people: "1" });
                            alert("Minimum 1 person is required");
                          }
                        }}
                        placeholder="Number of guests"
                        className="w-full focus:outline-none"
                        required
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Type with smaller label - takes 2/5 of width */}
              <div className="col-span-3">
                <label
                  htmlFor="stayType"
                  className="block text-xs font-medium text-white mb-0.5"
                >
                  Room Type
                </label>
                <div className="flex items-center text-sm bg-white rounded-lg p-3 border border-gray-300">
                  <span className="mr-2 text-ezzstay-base">
                    <i className="fas fa-bed"></i>
                  </span>
                  <select
                    id="stayType"
                    name="stayType"
                    value={formData.stayType}
                    onChange={(e) =>
                      setFormData({ ...formData, stayType: e.target.value })
                    }
                    className="w-full focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="private">Private</option>
                    <option value="dormitory">Dorm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search button */}
            <div className="mt-3 md:mt-0 md:self-end">
              <button
                type="submit"
                className="w-full p-3.5 px-10 bg-ezzstay-base-light text-white rounded-lg font-bold hover:bg-white hover:text-ezzstay-base-light transition duration-200"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchHotel;
