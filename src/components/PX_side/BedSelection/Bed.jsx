import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from "lucide-react";
// import { Bed } from "lucide-react";

const Bed = ({
  bookingDetails,
  selectedRooms = {},
  floorId,
  selectedBeds = { selectedBeds },
  selectedPrivateRooms = { selectedPrivateRooms },
  onTimeSelect = () => { },
}) => {
  const [selectedTimes, setSelectedTimes] = useState(new Map());
  const [currentDate, setCurrentDate] = useState(
    bookingDetails.date ? new Date(bookingDetails.date) : new Date()
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const [bookedSlots, setbookedSlots] = useState();
  const [warningMessage, setWarningMessage] = useState("");
  const [reservationData, setReservationData] = useState({});
  const [loading, setLoading] = useState(true);

  const [bedData, setBedData] = useState([]);
  const [allBedData, setAllBedData] = useState([]);
  // New state for selecting which bed view to display
  const [bedDisplayOption, setBedDisplayOption] = useState("selected");

  // Helper function to group bed objects into room objects (mimicking selectedRooms)
  const groupBeds = (beds) => {
    const grouped = {};
    beds.forEach((bed) => {
      if (bed.room_type === "Dormitory") {
        // For dormitory, treat each bed as an individual room. 
        // The key is a combination of room_name and bed_id.
        grouped[`${bed.room_name}-${bed.bed_id}`] = {
          bed_id: bed.bed_id,
          floorId: bed.floor_id,
          roomPrice: bed.room_price_per_hour,
          roomType: bed.room_type,
          berth: bed.upper_or_lower,
        };
      } else {
        // For non-dormitory, group by room_name
        if (grouped[bed.room_name]) {
          grouped[bed.room_name].bed_id.push(bed.bed_id);
        } else {
          grouped[bed.room_name] = {
            bed_id: [bed.bed_id],
            floorId: bed.floor_id,
            roomPrice: bed.room_price_per_hour,
            roomType: bed.room_type,
          };
        }
      }
    });
    return grouped;
  };

  // Compute the current rooms object based on the view option.
  // For "selected" use selectedRooms; for "available" and "all" group the respective API data.
  const displayRooms =
    bedDisplayOption === "selected"
      ? selectedRooms
      : bedDisplayOption === "available"
        ? groupBeds(bedData)
        : groupBeds(allBedData);
  const roomsArray = Object.keys(displayRooms);
  console.log("displayRooms", displayRooms);
  // Load reservationData from sessionStorage when the component mounts
  useEffect(() => {
    const storedReservation = sessionStorage.getItem("reservationData");
    if (storedReservation) {
      setReservationData(JSON.parse(storedReservation));
    }
  }, []);

  // Moved fetchBedData inside useEffect to avoid an infinite loop
  useEffect(() => {
    const fetchBedData = async () => {
      try {
        setLoading(true);

        // Fetch available beds
        const payload = {
          floorId,
          dateOfRegistration: currentDate.toISOString().split("T")[0],
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
  }, [floorId, bookingDetails.date, bookingDetails.time, bookingDetails.hours, currentDate]);

  // Generate time slots from 00:00 to 23:00
  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, "0")}:00`
  );

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  useEffect(() => {
    if (!bookedSlots) return; // Wait until bookedSlots is loaded

    if (bookingDetails && bookingDetails.time && bookingDetails.hours) {
      const defaultTimes = new Map();
      // Extract HH:MM from bookingDetails.time (assumes format "HH:MM:SS")
      const startTime = bookingDetails.time.substring(0, 5);
      const requiredHours = parseInt(bookingDetails.hours, 10);
      const startIndex = timeSlots.indexOf(startTime);
      // Use bookingDetails.date if available; this was the older logic
      const dateObj = bookingDetails.date ? new Date(bookingDetails.date) : currentDate;

      if (startIndex !== -1) {
        let defaultBlock = [];
        if (startIndex + requiredHours <= timeSlots.length) {
          defaultBlock = timeSlots
            .slice(startIndex, startIndex + requiredHours)
            .map((time) => ({ time, date: dateObj }));
        } else {
          const todayBlock = timeSlots
            .slice(startIndex)
            .map((time) => ({ time, date: dateObj }));
          const remaining = requiredHours - todayBlock.length;
          const nextDay = new Date(dateObj);
          nextDay.setDate(dateObj.getDate() + 1);
          const nextDayBlock = timeSlots
            .slice(0, remaining)
            .map((time) => ({ time, date: nextDay }));
          defaultBlock = todayBlock.concat(nextDayBlock);
        }

        // For each non-dormitory room, only select if all time slots are available
        Object.keys(selectedRooms).forEach((room) => {
          if (selectedRooms[room]?.roomType === "Dormitory") {
            return;
          }
          const allAvailable = defaultBlock.every(
            ({ time, date }) => getAvailability(room, time, date) === "available"
          );
          if (allAvailable) {
            defaultBlock.forEach(({ time, date }) => {
              const key = `${room}-${formatDate(date)}-${time}`;
              defaultTimes.set(key, true);
            });
          }
        });
        setSelectedTimes(defaultTimes);
        onTimeSelect(Array.from(defaultTimes.keys()));
      }
    }
  }, [bookingDetails, selectedRooms, bookedSlots]);


  useEffect(() => {
    const getbookedSlots = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/get_reservation_info/${floorId}`);
        const bookedSlots = await response.json();
        setbookedSlots(bookedSlots);
        console.log("reservation data is", bookedSlots);
      } catch (error) {
        console.error("Error fetching reservation data:", error);
      }
    };

    getbookedSlots();
  }, [floorId]);

  // Modified getAvailability: now uses the current room data from displayRooms
  const getAvailability = (room, time, date) => {
    const roomData = displayRooms[room];
    if (!roomData) {
      console.warn("Room data not found for", room);
      return "available";
    }

    if (!bookedSlots || !Array.isArray(bookedSlots)) {
      console.warn("bookedSlots is undefined or not an array");
      return "available";
    }

    const formattedDate = date.toISOString().split("T")[0];
    const [hours, minutes] = time.split(":").map(Number);
    const timeslotDate = new Date(date);
    timeslotDate.setHours(hours, minutes, 0, 0);

    if (roomData.roomType === "Dormitory") {
      const bedId = roomData.bed_id;
      for (const group of bookedSlots) {
        for (const bed of group.beds) {
          if (bed.bed_id === bedId) {
            for (const reservation of bed.reservations) {
              if (!reservation.checkin_time || !reservation.checkout_time) continue;
              const checkin = new Date(reservation.checkin_time);
              const checkout = new Date(reservation.checkout_time);
              if (timeslotDate >= checkin && timeslotDate < checkout) {
                return "booked";
              }
            }
          }
        }
      }
    } else {
      // For private rooms, the group key is assumed to be the room name
      const group = bookedSlots.find((group) => group.group_key === room);
      if (!group) {
        return "available";
      }
      for (const bed of group.beds) {
        for (const reservation of bed.reservations) {
          if (!reservation.checkin_time || !reservation.checkout_time) continue;
          const checkin = new Date(reservation.checkin_time);
          const checkout = new Date(reservation.checkout_time);
          if (timeslotDate >= checkin && timeslotDate < checkout) {
            return "booked";
          }
        }
      }
    }
    return "available";
  };

  // Modified handleTimeSelect to use current room data from displayRooms
  const handleTimeSelect = (room, time, date) => {
    const status = getAvailability(room, time, date);
    if (status === "booked") return;

    const requiredHours = parseInt(bookingDetails.hours, 10);
    const index = timeSlots.indexOf(time);
    if (index === -1) {
      alert(`${bookingDetails.hours} amount of booking not available for this time slot.`);
      return;
    }

    let newBlock = [];
    if (index + requiredHours <= timeSlots.length) {
      newBlock = timeSlots
        .slice(index, index + requiredHours)
        .map((t) => ({ time: t, date: date }));
    } else {
      const todayBlock = timeSlots
        .slice(index)
        .map((t) => ({ time: t, date: date }));
      const remaining = requiredHours - todayBlock.length;
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const nextDayBlock = timeSlots
        .slice(0, remaining)
        .map((t) => ({ time: t, date: nextDay }));
      newBlock = todayBlock.concat(nextDayBlock);
    }

    const newTimes = new Map(selectedTimes);
    const blockIsSelected = newBlock.some(({ time: t, date: d }) =>
      newTimes.has(`${room}-${formatDate(d)}-${t}`)
    );

    if (blockIsSelected) {
      // Remove all timeslots for this room
      for (let key of newTimes.keys()) {
        if (key.startsWith(`${room}-`)) {
          newTimes.delete(key);
        }
      }
      setSelectedTimes(newTimes);
      onTimeSelect(Array.from(newTimes.keys()));

      // Update selectedBeds for this room: no timeslots means bed(s) become false
      {
        const roomHasSelection = Array.from(newTimes.keys()).some(key =>
          key.startsWith(`${room}-`)
        );
        const roomData = displayRooms[room];
        const bedId = roomData.bed_id;
        if (Array.isArray(bedId)) {
          bedId.forEach(id => (selectedBeds[id] = roomHasSelection));
          bedId.forEach(id => (selectedPrivateRooms[id] = roomHasSelection));
        } else {
          selectedBeds[bedId] = roomHasSelection;
          selectedPrivateRooms[bedId] = roomHasSelection;
        }
      }
      return;
    }

    const prefix = `${room}-${formatDate(date)}-`;
    for (let key of newTimes.keys()) {
      if (key.startsWith(prefix)) {
        newTimes.delete(key);
      }
    }

    const allAvailable = newBlock.every(
      ({ time: t, date: d }) => getAvailability(room, t, d) !== "booked"
    );
    if (!allAvailable) {
      alert(`${bookingDetails.hours} hours of time slot not available from this.`);
      return;
    }

    newBlock.forEach(({ time: t, date: d }) => {
      newTimes.set(`${room}-${formatDate(d)}-${t}`, true);
    });

    setSelectedTimes(newTimes);
    onTimeSelect(Array.from(newTimes.keys()));

    // Update selectedBeds for this room: if timeslots are now selected, mark bed(s) as true
    {
      const roomHasSelection = Array.from(newTimes.keys()).some(key =>
        key.startsWith(`${room}-`)
      );
      const roomData = displayRooms[room];
      const bedId = roomData.bed_id;
      if (Array.isArray(bedId)) {
        bedId.forEach(id => (selectedBeds[id] = roomHasSelection));
        bedId.forEach(id => (selectedPrivateRooms[id] = roomHasSelection));
      } else {
        selectedBeds[bedId] = roomHasSelection;
        selectedPrivateRooms[bedId] = roomHasSelection;
      }
    }
  };

  const changeDate = (direction) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));

    if (containerRef.current) {
      containerRef.current.style.transition = "transform 0.3s ease-in-out";
      containerRef.current.style.transform = `translateX(${direction === "next" ? "-100%" : "100%"})`;

      setTimeout(() => {
        setCurrentDate(newDate);
        if (containerRef.current) {
          containerRef.current.style.transition = "none";
          containerRef.current.style.transform = `translateX(${direction === "next" ? "100%" : "-100%"})`;
        }

        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = "transform 0.3s ease-in-out";
            containerRef.current.style.transform = "translateX(0)";
          }

          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        });
      }, 300);
    }
  };

  useEffect(() => {
    if (selectedPrivateRooms && bookingDetails.people) {
      const selectedRoomsCount = Object.keys(selectedPrivateRooms).filter(
        (key) => selectedPrivateRooms[key] === true
      ).length;
      if (selectedRoomsCount > parseInt(bookingDetails.people, 10)) {
        setWarningMessage(
          `You've selected ${selectedRoomsCount} beds but only ${bookingDetails.people} guests. Please adjust your selection.`
        );
      } else {
        setWarningMessage("");
      }
    }
  }, [selectedPrivateRooms, bookingDetails.people, selectedBeds, selectedRooms, selectedTimes]);

  if (roomsArray.length === 0) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md text-center">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Users className="w-12 h-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700">No Rooms Selected</h3>
          <p className="text-gray-500">Please select rooms to view availability</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Radio Button Group for bed view options */}
      {warningMessage && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <svg className="h-6 w-6 text-yellow-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-yellow-800">{warningMessage}</span>
          </div>
        </div>
      )}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center gap-3 mb-4">

          <button
            onClick={() => changeDate("prev")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            disabled={(() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);
              const prevDate = new Date(currentDate);
              prevDate.setDate(currentDate.getDate() - 1);
              prevDate.setHours(0, 0, 0, 0);
              return isAnimating || prevDate < tomorrow;
            })()}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-ezzstay-base" />
            <span className="text-sm font-medium text-gray-700">
              {formatDate(currentDate)}
            </span>
          </div>
          <button
            onClick={() => changeDate("next")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            disabled={isAnimating}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-4 justify-center mb-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="bedView"
                value="selected"
                checked={bedDisplayOption === "selected"}
                onChange={(e) => setBedDisplayOption(e.target.value)}
              />
              <span className="text-sm text-gray-700">Selected</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="bedView"
                value="available"
                checked={bedDisplayOption === "available"}
                onChange={(e) => setBedDisplayOption(e.target.value)}
              />
              <span className="text-sm text-gray-700">Available</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="bedView"
                value="all"
                checked={bedDisplayOption === "all"}
                onChange={(e) => setBedDisplayOption(e.target.value)}
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {roomsArray.map((room) => {
          const bedCount = reservationData[room] ? reservationData[room].length : 0;
          return (
            <div key={room} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-white p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-ezzstay-base text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
                      {room}
                    </div>
                    {bedCount > 0 && (
                      <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {bedCount === 1 ? "1 bed" : `${bedCount} beds`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {displayRooms[room]?.berth && displayRooms[room]?.roomType === "Dormitory" && (
                      <div
                        className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${displayRooms[room].berth.toLowerCase().includes("upper")
                            ? "bg-blue-50 text-blue-600"
                            : displayRooms[room].berth.toLowerCase().includes("lower")
                              ? "bg-green-50 text-green-600"
                              : "bg-purple-50 text-ezzstay-base"
                          }`}
                      >
                        {displayRooms[room].berth}
                      </div>
                    )}
                    {displayRooms[room]?.roomType && (
                      <div className="text-gray-700 text-sm font-medium">
                        {displayRooms[room].roomType}
                      </div>
                    )}
                    {displayRooms[room]?.roomPrice && (
                      <div className="bg-purple-50 text-ezzstay-base px-3 py-1.5 rounded-lg font-semibold text-sm">
                        Rs. {displayRooms[room].roomPrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>



              <div className="overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Time Slots</span>
                </div>
                <div ref={containerRef} className="transition-transform duration-300 ease-in-out">
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                    {timeSlots.map((time) => {
                      const status = getAvailability(room, time, currentDate);
                      const isSelected = selectedTimes.has(`${room}-${formatDate(currentDate)}-${time}`);
                      const isBooked = status === "booked";

                      return (
                        <button
                          key={`${room}-${currentDate.toISOString()}-${time}`}
                          onClick={() => handleTimeSelect(room, time, currentDate)}
                          disabled={isBooked}
                          className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${isBooked
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"
                            : isSelected
                              ? "bg-ezzstay-base text-white shadow-sm"
                              : "bg-purple-100 text-ezzstay-base hover:bg-purple-200"
                            }`}
                        >
                          {time.split(":")[0]}:00
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Bed;
