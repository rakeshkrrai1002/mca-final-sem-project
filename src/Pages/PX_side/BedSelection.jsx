import React, { useState, useEffect } from "react";
import { MapPin, Bed as BedIcon, ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Floor from "../../components/PX_side/BedSelection/floor";
import Bed from "../../components/PX_side/BedSelection/Bed";
import TotalPay from "../../components/PX_side/BedSelection/TotalPay";
import axios from "axios";

const BedSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hotel = location.state?.hotel;
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [selectedBeds, setSelectedBeds] = useState({});
  const [selectedPrivateRooms, setSelectedPrivateRooms] = useState({});

  const [selectedTimes, setSelectedTimes] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [currentStep, setCurrentStep] = useState("floor");
  const [stepHistory, setStepHistory] = useState(["floor"]);

  const [floorData, setFloorData] = useState({ floors: [] });
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const storedBookingData = sessionStorage.getItem("searchData");
    if (storedBookingData) {
      setBookingDetails(JSON.parse(storedBookingData));
    }
  }, []);

  useEffect(() => {
    if (!bookingDetails?.selectedHotel?.id) return;

    const fetchFloor = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/get_available_floor/${bookingDetails.selectedHotel.id}`
        );
        setFloorData(response.data);
      } catch (error) {
        console.error("Error fetching floors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFloor();
  }, [bookingDetails]);

  // Handle browser back button
  useEffect(() => {
    // Save the current step to sessionStorage to persist across page refreshes
    if (currentStep) {
      sessionStorage.setItem("bedSelectionStep", currentStep);
    }
  
    // Add a listener for the popstate event (browser back/forward buttons)
    const handlePopState = (event) => {
      // If we have a step history, go back to the previous step
      if (stepHistory.length > 1) {
        // Remove the current step from history
        const newHistory = [...stepHistory];
        newHistory.pop();
  
        // Set the current step to the previous step
        const previousStep = newHistory[newHistory.length - 1];
        setCurrentStep(previousStep);
        setStepHistory(newHistory);
  
        // Reset dorm bed selections when navigating back from the Bed component
        if (currentStep === "bed") {
          setSelectedBeds({});
          setSelectedPrivateRooms({});
        }
  
        // Prevent the default navigation
        event.preventDefault();
      }
    };
  
    window.addEventListener("popstate", handlePopState);
  
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [stepHistory, currentStep, setSelectedBeds, setSelectedPrivateRooms]);
  

  // Update step history when current step changes
  useEffect(() => {
    // Only add to history if it's a new step
    if (currentStep !== stepHistory[stepHistory.length - 1]) {
      setStepHistory((prev) => [...prev, currentStep]);

      // Add a new history entry
      window.history.pushState({ step: currentStep }, `Step: ${currentStep}`);
    }
  }, [currentStep]);

  const handleTimeSelect = (times) => {
    setSelectedTimes(times);
  };

  const toggleRoom = (roomId, isSelected, beds) => {
    setSelectedRooms((prev) => {
      const newSelectedRooms = { ...prev };
      const roomType = beds[0].room_type;
      if (roomType.toLowerCase() === "dormitory") {
        if (isSelected) {
          // For dormitory, add each bed individually using a key like "R-2-<bed_id>"
          beds.forEach((bed) => {
            const key = `${roomId}-${bed.bed_id}`;
            newSelectedRooms[key] = {
              bed_id: bed.bed_id,
              roomName: bed.room_name,
              bedNo: bed.bed_no,
              floorId: bed.floor_id,
              roomPrice: bed.room_price_per_hour,
              roomType: bed.room_type,
              berth: bed.upper_or_lower,
            };
          });
        } else {
          // Remove all entries for this dormitory room (keys starting with "roomId-")
          Object.keys(newSelectedRooms).forEach((key) => {
            if (key.startsWith(`${roomId}-`)) {
              delete newSelectedRooms[key];
            }
          });
        }
      } else {
        if (isSelected) {
          // For non-dormitory, group all beds together under roomId.
          const bed_ids = beds.map((bed) => bed.bed_id);
          newSelectedRooms[roomId] = {
            bed_id: bed_ids,
            floorId: beds[0].floor_id,
            roomPrice: beds[0].room_price_per_hour,
            roomType: beds[0].room_type,
          };
        } else {
          delete newSelectedRooms[roomId];
        }
      }
      return newSelectedRooms;
    });
  };

  // if auto select
  useEffect(() => {
    if (location.state?.autoSelectedRoom && bookingDetails) {
      const autoRoomsArray = location.state.autoSelectedRoom; // API returns an array

      // Transform the array into an object with keys as desired
      const autoRooms = {};
      autoRoomsArray.forEach((room) => {
        if (room.room_type.toLowerCase().includes("dormitory")) {
          // For dormitory, add each bed as an individual room
          room.bed_ids.forEach((bed) => {
            autoRooms[`${room.room_name}-${bed}`] = {
              bed_id: bed,
              floorId: room.floor_id,
              roomPrice: 20,
              roomType: "Dormitory",
            };
          });
        } else {
          // For private rooms, group all beds together under room_name
          autoRooms[room.room_name] = {
            bed_id: room.bed_ids, // note: using the key "bed_id" to match your desired format
            floorId: room.floor_id,
            roomPrice: 20,
            roomType: room.room_type,
          };
        }
      });
      setSelectedRooms(autoRooms);

      // Build selectedBeds mapping (each bed id set to true)
      const bedsMap = {};
      autoRoomsArray.forEach((room) => {
        room.bed_ids.forEach((bed) => {
          bedsMap[bed] = true;
        });
      });
      setSelectedBeds(bedsMap);

      // Build selectedTimes for each room based on bookingDetails
      let times = [];
      const hours = parseInt(bookingDetails.hours, 10) || 1;
      autoRoomsArray.forEach((room) => {
        if (room.room_type.toLowerCase().includes("dormitory")) {
          // For dormitory, create times for each bed individually
          room.bed_ids.forEach((bed) => {
            const roomKey = `${room.room_name}-${bed}`;
            const startDateTime = new Date(
              `${bookingDetails.date}T${bookingDetails.time}`
            );
            for (let i = 0; i < hours; i++) {
              const slotDate = new Date(startDateTime);
              slotDate.setHours(slotDate.getHours() + i);
              const options = {
                weekday: "short",
                month: "short",
                day: "numeric",
              };
              const datePart = slotDate.toLocaleDateString("en-US", options);
              const hour = slotDate.getHours().toString().padStart(2, "0");
              const minute = slotDate.getMinutes().toString().padStart(2, "0");
              times.push(`${roomKey}-${datePart}-${hour}:${minute}`);
            }
          });
        } else {
          // For private rooms
          const roomName = room.room_name;
          const startDateTime = new Date(
            `${bookingDetails.date}T${bookingDetails.time}`
          );
          for (let i = 0; i < hours; i++) {
            const slotDate = new Date(startDateTime);
            slotDate.setHours(slotDate.getHours() + i);
            const options = {
              weekday: "short",
              month: "short",
              day: "numeric",
            };
            const datePart = slotDate.toLocaleDateString("en-US", options);
            const hour = slotDate.getHours().toString().padStart(2, "0");
            const minute = slotDate.getMinutes().toString().padStart(2, "0");
            times.push(`${roomName}-${datePart}-${hour}:${minute}`);
          }
        }
      });
      setSelectedTimes(times);

      // Set floorId from the first room in the array
      if (autoRoomsArray[0].floor_id) {
        setfloorId(autoRoomsArray[0].floor_id);
      }
      setCurrentStep("payment");
    }
  }, [location.state, bookingDetails]);

  const [selectedFloor, setSelectedFloor] = useState("");
  const [floorId, setfloorId] = useState("");

  // Set default value when floorData.floors is available
  useEffect(() => {
    if (floorData && floorData.length > 0) {
      setSelectedFloor(floorData[0].floor_name);
      setfloorId(floorData[0].floor_id);
    }
  }, [floorData]);

  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 2));
  };

  // Steps configuration
  const steps = [
    { id: "floor", label: "Select Room" },
    { id: "bed", label: "Select Time" },
    { id: "payment", label: "Review & Pay" },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      setSelectedBeds({});
      setSelectedPrivateRooms({});
    } else {
      navigate(-1);
    }
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case "floor":
        return Object.keys(selectedRooms).length === 0;
      case "bed":
        return selectedTimes.length === 0;
      default:
        return false;
    }
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case "floor":
        return "Continue to Time Selection";
      case "bed":
        return "Review and Pay";
      case "payment":
        return "Proceed to Payment";
      default:
        return "Continue";
    }
  };

  const handleContinue = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    } else {
      // Handle payment submission
      console.log("Proceed to payment processing");
      // navigate("/checkout", { state: { paymentDetails: ... } });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "floor":
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Select Your Room
              </h3>
              {Array.isArray(floorData) && floorData.length > 0 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">
                    Floor:
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onChange={(e) => {
                      const selectedIndex = e.target.selectedIndex;
                      if (selectedIndex >= 0) {
                        const selectedOption = floorData[selectedIndex];
                        setSelectedFloor(selectedOption.floor_name);
                        setfloorId(selectedOption.floor_id);
                      }
                    }}
                    value={selectedFloor}
                  >
                    {floorData.map((floor, index) => (
                      <option key={index} value={floor.floor_name}>
                        {floor.floor_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <Floor
              selectedRooms={selectedRooms}
              selectedBeds={selectedBeds}
              selectedPrivateRooms={selectedPrivateRooms}
              setSelectedBeds={setSelectedBeds}
              setSelectedPrivateRooms={setSelectedPrivateRooms}
              onRoomToggle={toggleRoom}
              currentFloor={selectedFloor}
              floorId={floorId}
            />
          </>
        );
      case "bed":
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Select Available Time Slots
            </h3>
            <Bed
              selectedRooms={selectedRooms}
              selectedBeds={selectedBeds}
              selectedPrivateRooms={selectedPrivateRooms}
              floorId={floorId}
              bookingDetails={bookingDetails}
              onTimeSelect={handleTimeSelect}
            />
          </>
        );
      case "payment":
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Review Your Selection
            </h3>
            <TotalPay
              selectedRooms={selectedRooms}
              selectedBeds={selectedBeds}
              selectedTimes={selectedTimes}
              bookingDetails={bookingDetails}
              floorId={floorId}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Determines whether to show the sticky footer
  const shouldShowFooter = currentStep !== "payment";

  return (
    <div className="min-h-screen  bg-ezzstay-base">
      {/* Header with background */}
      <div className="bg-ezzstay-base">
        <div className="container mx-auto pl-6 max-w-7xl px-4 py-6">
          <div className="text-white ">
          {bookingDetails ? (
            <p className="text-base">
              Staying for {bookingDetails.hours} hrs, on {bookingDetails.date} :
              time: {bookingDetails.time}
              <button
                onClick={() => navigate(-1)}
                className="ml-4 text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
            </p>
          ) : (
            <p className="text-base text-gray-500">Loading booking details...</p>
          )}
            {/* Progress steps */}
            <div className="flex justify-between items-center mt-8 px-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-1 items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm 
                    ${
                      idx <= currentStepIndex
                        ? "bg-white text-purple-700"
                        : "bg-purple-purple/30 border border-white/20 text-white"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      idx < steps.length - 1
                        ? idx < currentStepIndex
                          ? "bg-white"
                          : "bg-purple-300/30"
                        : "hidden"
                    }`}
                  ></div>
                  <span
                    className={`absolute mt-14 text-xs font-medium ${
                      idx <= currentStepIndex ? "text-white" : "text-purple-100"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto max-w-7xl px-4 py-6 pb-32">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MapPin size={24} className="text-purple-700" />
              </div>
              <div>
                {bookingDetails ? (
                  <h2 className="text-xl font-bold text-gray-800">
                    {bookingDetails.selectedHotel.name}
                  </h2>
                ) : (
                  <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {bookingDetails &&
                (currentStep === "floor" || currentStep === "bed") && (
                  <div className="flex items-center px-3 py-1 bg-purple-50 rounded-lg border border-purple-100">
                    <BedIcon className="text-purple-600 mr-2" size={18} />
                    <div className="text-lg font-semibold text-purple-800">
                      {
                        Object.keys(selectedPrivateRooms).filter(
                          (key) => selectedPrivateRooms[key]
                        ).length
                      }

                      {Object.values(selectedRooms).some(
                        (room) =>
                          room.roomType &&
                          room.roomType.toLowerCase() === "dormitory"
                      )
                        ? " + Dorm"
                        : ""}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">{renderStep()}</div>
        </div>
      </div>

      {/* Sticky footer for navigation - only show if not on payment page */}
      {shouldShowFooter && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-10">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={goBack}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                className={`px-8 py-3 rounded-lg text-white font-medium transition-colors ${
                  isButtonDisabled()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                onClick={handleContinue}
                disabled={isButtonDisabled()}
              >
                {getButtonLabel()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedSelection;
