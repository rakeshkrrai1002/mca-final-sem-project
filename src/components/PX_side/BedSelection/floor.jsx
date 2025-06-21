import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Bed,
  Loader,
  Filter,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Floor = ({
  selectedRooms,
  selectedBeds,
  setSelectedBeds,
  selectedPrivateRooms,
  setSelectedPrivateRooms,
  onRoomToggle,
  currentFloor,
  floorId,
}) => {
  const [bedData, setBedData] = useState([]);
  const [allBedData, setAllBedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("available");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const storedBookingData = sessionStorage.getItem("searchData");
    if (storedBookingData) {
      const parsedData = JSON.parse(storedBookingData);
      setBookingDetails(parsedData);
      if (parsedData.stayType) {
        if (parsedData.stayType.toLowerCase() === "private") {
          setFilterType("private");
        } else if (parsedData.stayType.toLowerCase() === "dormitory") {
          setFilterType("dormitory");
        } else {
          setFilterType("all");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!bookingDetails?.selectedHotel?.id || !floorId) return;

    const fetchBedData = async () => {
      try {
        setLoading(true);

        // Fetch available beds
        const payload = {
          floorId,
          dateOfRegistration: bookingDetails.date,
          timeSlot: bookingDetails.time,
          hours: bookingDetails.hours,
        };
        const queryString = new URLSearchParams(payload).toString();
        const availableResponse = await fetch(
          `http://127.0.0.1:8000/get_bed_details?${queryString}`
        );
        const availableData = await availableResponse.json();
        setBedData(availableData || []);

        // Fetch all beds for the floor
        const allBedsResponse = await fetch(
          `http://127.0.0.1:8000/get_all_beds?floorId=${floorId}`
        );
        const allBedsData = await allBedsResponse.json();
        setAllBedData(allBedsData || []);
      } catch (error) {
        console.error("Error fetching beds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBedData();
  }, [bookingDetails, floorId]);

  // Determine which data to use based on availability filter
  const displayData = availabilityFilter === "available" ? bedData : allBedData;

  const groupedRooms = displayData.reduce((acc, bed) => {
    if (!acc[bed.room_name]) {
      acc[bed.room_name] = {
        roomName: bed.room_name,
        roomType: bed.room_type,
        roomPrice: bed.room_price_per_hour,
        beds: [],
      };
    }
    acc[bed.room_name].beds.push(bed);
    return acc;
  }, {});

  // Function to check if a bed is available
  const isBedAvailable = (bedId) => {
    return bedData.some((bed) => bed.bed_id === bedId);
  };

  // Function to check if a room is available
  const isRoomAvailable = (roomName) => {
    return bedData.some((bed) => bed.room_name === roomName);
  };

  const handleRoomSelect = (roomName, beds) => {
    const newSelectedBeds = { ...selectedBeds };
    const newselectedPrivateRooms = { ...selectedPrivateRooms };

    const isRoomSelected = beds.every((bed) => selectedBeds[bed.bed_id]);
    const roomType = groupedRooms[roomName]?.roomType;

    beds.forEach((bed) => {
      newSelectedBeds[bed.bed_id] = !isRoomSelected;
    });
    setSelectedBeds(newSelectedBeds);

    if (roomType && roomType.toLowerCase() !== "dormitory") {
      beds.forEach((bed) => {
        // Only include in selectedPrivateRooms if the bed is actually available
        if (isBedAvailable(bed.bed_id)) {
          newselectedPrivateRooms[bed.bed_id] = !isRoomSelected;
        }
      });
    }
    setSelectedPrivateRooms(newselectedPrivateRooms);
    const totalSelectedBeds = Object.keys(newselectedPrivateRooms).filter(
      (key) => newselectedPrivateRooms[key]
    ).length;
    if (totalSelectedBeds > bookingDetails.people) {
      setWarningMessage(
        `You've selected ${totalSelectedBeds} beds but only ${bookingDetails.people} guests. Please adjust your selection.`
      );
    } else {
      setWarningMessage("");
    }
    const selectedBedsForRoom = beds
      .filter((bed) => newSelectedBeds[bed.bed_id])
      .map((bed) => bed.bed_id);

    // Retrieve the existing reservation data or initialize an empty object
    let reservationData =
      JSON.parse(sessionStorage.getItem("reservationData")) || {};

    // If there are selected beds, store them under the room name; otherwise, remove that room
    if (selectedBedsForRoom.length > 0) {
      reservationData[roomName] = selectedBedsForRoom;
    } else {
      delete reservationData[roomName];
    }

    // Save the updated reservation data back to sessionStorage
    sessionStorage.setItem("reservationData", JSON.stringify(reservationData));

    // Call the onRoomToggle callback if needed
    onRoomToggle(roomName, !isRoomSelected, beds);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-10 w-10 text-ezzstay-base animate-spin" />
        <span className="ml-3 text-gray-600 font-medium">Loading rooms...</span>
      </div>
    );
  }

  const filteredGroupedRooms = Object.values(groupedRooms).filter((room) => {
    if (filterType === "all") return true;
    if (filterType === "private")
      return room.roomType.toLowerCase() !== "dormitory";
    if (filterType === "dormitory")
      return room.roomType.toLowerCase() === "dormitory";
    return true;
  });

  // Get active filter count for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (filterType !== "all") count++;
    if (availabilityFilter !== "available") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="max-w-auto mx-auto bg-white pb-6">
      {/* Warning message with better styling */}
      {warningMessage && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <svg
              className="h-6 w-6 text-yellow-500 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-yellow-800">{warningMessage}</span>
          </div>
        </div>
      )}

      {/* Filter button and count badge */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg shadow-sm transition-all duration-200 border border-purple-10  0"
        >
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            <span className="font-medium">Filter Options</span>

            {activeFilterCount > 0 && (
              <span className="ml-3 px-2 py-1 text-xs font-bold bg-purple-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>

          {showFilters ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Expandable filter content */}
      {showFilters && (
        <div className="mb-6 p-5 bg-white rounded-lg border border-purple-100 shadow-md transition-all duration-300 ease-in-out">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Availability filter */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-purple-600" />
                Availability
              </p>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    availabilityFilter === "available"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    value="available"
                    checked={availabilityFilter === "available"}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 hidden"
                  />
                  <span className="text-sm font-medium">Available Rooms</span>
                </label>
                <label
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    availabilityFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    value="all"
                    checked={availabilityFilter === "all"}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 hidden"
                  />
                  <span className="text-sm font-medium">All Rooms</span>
                </label>
              </div>
            </div>

            {/* Room type filter */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center">
                <Bed className="h-4 w-4 mr-2 text-purple-600" />
                Room Type
              </p>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    filterType === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    value="all"
                    checked={filterType === "all"}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 hidden"
                  />
                  <span className="text-sm font-medium">All</span>
                </label>
                <label
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    filterType === "private"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    value="private"
                    checked={filterType === "private"}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 hidden"
                  />
                  <span className="text-sm font-medium">Private Rooms</span>
                </label>
                <label
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    filterType === "dormitory"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    value="dormitory"
                    checked={filterType === "dormitory"}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 hidden"
                  />
                  <span className="text-sm font-medium">Dormitory</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rooms grid with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(filteredGroupedRooms).map((room) => {
          const isRoomSelected = room.beds.every(
            (bed) => selectedBeds[bed.bed_id]
          );
          const isDormitory = room.roomType.toLowerCase() === "dormitory";

          // Check if any bed in this room is available (for visual indication)
          const isRoomAvailable = bedData.some(
            (availableBed) => availableBed.room_name === room.roomName
          );

          return (
            <div
              key={room.roomName}
              className={`p-5 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                availabilityFilter === "all" && !isRoomAvailable
                  ? "border-gray-200 bg-gray-50 opacity-70"
                  : isRoomSelected
                  ? "border-ezzstay-base bg-purple-50 cursor-pointer ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-purple-300 cursor-pointer"
              }`}
              onClick={() => handleRoomSelect(room.roomName, room.beds)}
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {room.roomName}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      room.roomType.toLowerCase() === "dormitory"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {room.roomType}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-ezzstay-base">
                    Rs. {room.roomPrice}/hr
                  </span>

                  {availabilityFilter === "all" && !isRoomAvailable && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Not Available
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {isDormitory ? (
                      <div
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                          isRoomSelected
                            ? "bg-ezzstay-base text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Bed className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {room.beds.length} beds available
                        </span>
                      </div>
                    ) : (
                      room.beds.map((bed) => (
                        <div
                          key={bed.bed_id}
                          className={`flex items-center gap-1 p-2 rounded-md transition-colors ${
                            selectedBeds[bed.bed_id]
                              ? "bg-ezzstay-base text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Bed className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {bed.bed_no.split("-").pop()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show this when no rooms match the filters */}
      {filteredGroupedRooms.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No rooms found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your filter options to see more results.
          </p>
        </div>
      )}
    </div>
  );
};

export default Floor;
