import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bed } from "lucide-react";

const Floor2 = ({
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
  const [allBedData, setAllBedData] = useState([]); // New state for all beds
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("available"); // New state for availability filter

  useEffect(() => {
    const storedBookingData = sessionStorage.getItem("searchData");
    if (storedBookingData) {
      setBookingDetails(JSON.parse(storedBookingData));
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
    const newSelectedPrivateRooms = { ...selectedPrivateRooms };

    const isRoomSelected = beds.every((bed) => selectedBeds[bed.bed_id]);
    const roomType = groupedRooms[roomName]?.roomType;
    const roomIsAvailable = isRoomAvailable(roomName);

    // Toggle beds' selection
    beds.forEach((bed) => {
      // Only allow selection if the current view is "available" or if the bed is actually available
      if (availabilityFilter === "available" || isBedAvailable(bed.bed_id)) {
        newSelectedBeds[bed.bed_id] = !isRoomSelected;
      }
    });
    setSelectedBeds(newSelectedBeds);

    // For private rooms, only count them if they're available
    if (roomType && roomType.toLowerCase() !== "dormitory") {
      beds.forEach((bed) => {
        // Only include in selectedPrivateRooms if the bed is actually available
        if (isBedAvailable(bed.bed_id)) {
          newSelectedPrivateRooms[bed.bed_id] = !isRoomSelected;
        }
      });
    }
    setSelectedPrivateRooms(newSelectedPrivateRooms);

    // Check if the total number of selected beds exceeds the number of people
    const totalSelectedBeds = Object.keys(newSelectedBeds).filter(
      (key) => newSelectedBeds[key]
    ).length;
    if (totalSelectedBeds > bookingDetails.people) {
      setWarningMessage(
        "Warning: You have selected more beds than the number of people."
      );
    } else {
      setWarningMessage("");
    }

    // Get beds that are selected and available
    const selectedBedsForRoom = beds
      .filter(
        (bed) => newSelectedBeds[bed.bed_id] && isBedAvailable(bed.bed_id)
      )
      .map((bed) => bed.bed_id);

    // Store reservation data
    let reservationData =
      JSON.parse(sessionStorage.getItem("reservationData")) || {};

    if (selectedBedsForRoom.length > 0) {
      reservationData[roomName] = selectedBedsForRoom;
    } else {
      delete reservationData[roomName];
    }

    sessionStorage.setItem("reservationData", JSON.stringify(reservationData));

    // Call the onRoomToggle callback
    // Only consider the room toggled if it's available
    if (roomIsAvailable) {
      onRoomToggle(
        roomName,
        !isRoomSelected,
        beds.filter((bed) => isBedAvailable(bed.bed_id))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ezzstay-base"></div>
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

  return (
    <div className="max-w-auto mx-auto bg-white p-4 shadow-lg">
      {warningMessage && (
        <div className="text-yellow-500 mb-2">{warningMessage}</div>
      )}

      {/* Availability filter radio buttons */}
      <div className="mb-4 flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="available"
            checked={availabilityFilter === "available"}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="mr-1"
          />
          Available Rooms
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="all"
            checked={availabilityFilter === "all"}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="mr-1"
          />
          All Rooms
        </label>
      </div>

      {/* Room type filter radio buttons */}
      <div className="mb-4 flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="all"
            checked={filterType === "all"}
            onChange={(e) => setFilterType(e.target.value)}
            className="mr-1"
          />
          All
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="private"
            checked={filterType === "private"}
            onChange={(e) => setFilterType(e.target.value)}
            className="mr-1"
          />
          Private Rooms
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="dormitory"
            checked={filterType === "dormitory"}
            onChange={(e) => setFilterType(e.target.value)}
            className="mr-1"
          />
          Dormitory
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className={`p-4 rounded-lg border-2 transition-colors ${
                availabilityFilter === "all" && !isRoomAvailable
                  ? "border-gray-200 bg-gray-50 opacity-70"
                  : isRoomSelected
                  ? "border-ezzstay-base bg-blue-50 cursor-pointer"
                  : "border-gray-200 hover:border-blue-300 cursor-pointer"
              }`}
              onClick={() => handleRoomSelect(room.roomName, room.beds)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{room.roomName}</h3>
                <span className="text-sm text-gray-800">
                  Rs. {room.roomPrice}/hr
                </span>
                <span className="text-sm text-gray-500">{room.roomType}</span>
              </div>

              {availabilityFilter === "all" && !isRoomAvailable && (
                <div className="text-red-500 text-sm mb-2">Not Available</div>
              )}

              <div className="flex flex-wrap gap-2">
                {isDormitory ? (
                  <div
                    className={`flex items-center gap-1 p-2 rounded ${
                      isRoomSelected
                        ? "bg-ezzstay-base text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Bed className="w-4 h-4" />
                    <span className="text-sm">
                      {room.beds.length} beds available
                    </span>
                  </div>
                ) : (
                  room.beds.map((bed) => {
                    const isBedAvail = isBedAvailable(bed.bed_id);
                    return (
                      <div
                        key={bed.bed_id}
                        className={`flex items-center gap-1 p-2 rounded ${
                          selectedBeds[bed.bed_id]
                            ? "bg-ezzstay-base text-white"
                            : isBedAvail
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Bed className="w-4 h-4" />
                        <span className="text-sm">
                          {bed.bed_no.split("-").pop()}
                          {!isBedAvail &&
                            availabilityFilter === "all" &&
                            " (N/A)"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Floor;

<div className="flex items-center gap-2">
  {bookingDetails ? (
    <div className="text-right">
      {(currentStep === "floor" || currentStep === "bed") && (
        <div className="flex items-center justify-end">
          <BedIcon className="text-ezzstay-base mr-2" size={24} />
          <div className="text-2xl font-bold text-ezzstay-base">
            {/* {bookingDetails.selectedHotel.roomsAvailable} */}
            {/* {Object.keys(selectedBeds).filter(key => selectedBeds[key]).length} */}
            {
              Object.keys(selectedPrivateRooms).filter(
                (key) => selectedPrivateRooms[key]
              ).length
            }
          </div>
        </div>
      )}

      {currentStep === "floor" && (
        <div className="text-2xl font-bold text-ezzstay-base">
          {Object.values(selectedRooms).some(
            (room) => room.roomType.toLowerCase() === "dormitory"
          )
            ? " + Dormitory"
            : ""}
        </div>
      )}
    </div>
  ) : (
    <p>Loading beds...</p>
  )}
</div>;
