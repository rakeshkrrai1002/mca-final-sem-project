import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
// import { Bed } from "lucide-react";

const Bed2 = ({
  bookingDetails,
  selectedRooms = {},
  floorId,
  selectedBeds = { selectedBeds },
  selectedPrivateRooms = { selectedPrivateRooms },
  onTimeSelect = () => {},
}) => {
  const [selectedTimes, setSelectedTimes] = useState(new Map());
  const [currentDate, setCurrentDate] = useState(
    bookingDetails.date ? new Date(bookingDetails.date) : new Date()
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const [bookedSlots, setbookedSlots] = useState();

  const [reservationData, setReservationData] = useState({});

  // Load reservationData from sessionStorage when the component mounts
  useEffect(() => {
    const storedReservation = sessionStorage.getItem("reservationData");
    if (storedReservation) {
      setReservationData(JSON.parse(storedReservation));
    }
  }, []);

  console.log(selectedRooms);
  console.log(floorId);
  // Generate time slots from 00:00 to 23:00
  const timeSlots = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
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
      const dateObj = bookingDetails.date
        ? new Date(bookingDetails.date)
        : currentDate;

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

        // Check and select rooms only if all time slots are available
        Object.keys(selectedRooms).forEach((room) => {
          // Skip dormitory rooms for auto-selection
          if (selectedRooms[room]?.roomType === "Dormitory") {
            return; // Skip this room
          }

          // Check if all time slots are available for this room
          const allAvailable = defaultBlock.every(
            ({ time, date }) =>
              getAvailability(room, time, date) === "available"
          );

          // Only select this room if all time slots are available
          if (allAvailable) {
            defaultBlock.forEach(({ time, date }) => {
              const key = `${room}-${formatDate(date)}-${time}`;
              defaultTimes.set(key, true);
            });
          }
        });

        console.log("defaultTimes is ,", defaultTimes);
        setSelectedTimes(defaultTimes);
        onTimeSelect(Array.from(defaultTimes.keys()));
      }
    }
  }, [bookingDetails, selectedRooms, bookedSlots]);

  useEffect(() => {
    const getbookedSlots = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/get_reservation_info/${floorId}`
        );
        const bookedSlots = await response.json();
        // console.log("Role Data:", bookedSlots);
        setbookedSlots(bookedSlots);
        console.log("reservation data is", bookedSlots);
      } catch (error) {
        console.error("Error fetching reservation data:", error);
      }
    };

    getbookedSlots();
  }, [floorId]);

  const getAvailability = (room, time, date) => {
    if (!bookedSlots || !Array.isArray(bookedSlots)) {
      console.warn("bookedSlots is undefined or not an array");
      return "available";
    }

    const formattedDate = date.toISOString().split("T")[0];
    const [hours, minutes] = time.split(":").map(Number);
    const timeslotDate = new Date(date);
    timeslotDate.setHours(hours, minutes, 0, 0);

    // Check if room is a dormitory (format like "R-12-1062")
    const isDormitory = selectedRooms[room]?.roomType === "Dormitory";

    if (isDormitory) {
      // Extract the dormitory room number part from the room string (e.g., "R-12" from "R-12-1062")
      const roomParts = room.split("-");
      const dormitoryRoomNumber = `${roomParts[0]}-${roomParts[1]}`;
      const bedId = selectedRooms[room].bed_id;

      // Find all groups that match the dormitory room pattern
      for (const group of bookedSlots) {
        // Check if the bed ID is found in any group's beds
        for (const bed of group.beds) {
          // If this is the specific bed we're looking for
          if (bed.bed_id === bedId) {
            for (const reservation of bed.reservations) {
              if (!reservation.checkin_time || !reservation.checkout_time)
                continue;
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
      // Original logic for private rooms
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

  const handleTimeSelect = (room, time, date) => {
    const status = getAvailability(room, time, date);
    if (status === "booked") return;

    const requiredHours = parseInt(bookingDetails.hours, 10);
    const index = timeSlots.indexOf(time);
    if (index === -1) {
      alert(
        `${bookingDetails.hours} amount of booking not available for this time slot.`
      );
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
        const roomHasSelection = Array.from(newTimes.keys()).some((key) =>
          key.startsWith(`${room}-`)
        );
        const bedId = selectedRooms[room].bed_id;
        if (Array.isArray(bedId)) {
          bedId.forEach((id) => (selectedBeds[id] = roomHasSelection));
          bedId.forEach((id) => (selectedPrivateRooms[id] = roomHasSelection));
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
      alert(
        `${bookingDetails.hours} hours of time slot not available from this.`
      );
      return;
    }

    newBlock.forEach(({ time: t, date: d }) => {
      newTimes.set(`${room}-${formatDate(d)}-${t}`, true);
    });

    setSelectedTimes(newTimes);
    onTimeSelect(Array.from(newTimes.keys()));

    // Update selectedBeds for this room: if timeslots are now selected, mark bed(s) as true
    {
      const roomHasSelection = Array.from(newTimes.keys()).some((key) =>
        key.startsWith(`${room}-`)
      );
      const bedId = selectedRooms[room].bed_id;
      if (Array.isArray(bedId)) {
        bedId.forEach((id) => (selectedBeds[id] = roomHasSelection));
        bedId.forEach((id) => (selectedPrivateRooms[id] = roomHasSelection));
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
      containerRef.current.style.transform = `translateX(${
        direction === "next" ? "-100%" : "100%"
      })`;

      setTimeout(() => {
        setCurrentDate(newDate);
        if (containerRef.current) {
          containerRef.current.style.transition = "none";
          containerRef.current.style.transform = `translateX(${
            direction === "next" ? "100%" : "-100%"
          })`;
        }

        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.transition =
              "transform 0.3s ease-in-out";
            containerRef.current.style.transform = "translateX(0)";
          }

          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        });
      }, 300);
    }
  };

  const roomsArray = Object.keys(selectedRooms);
  console.log("gc", roomsArray.length);

  if (roomsArray.length === 0) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md text-center">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Users className="w-12 h-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700">
            No Rooms Selected
          </h3>
          <p className="text-gray-500">
            Please select rooms to view availability
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center gap-3 mb-4">
          <button
            onClick={() => changeDate("prev")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            disabled={isAnimating}
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
            <div className="w-4 h-4 bg-purple-100 rounded-full border border-purple-200"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full border border-gray-300"></div>
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-ezzstay-base rounded-full border border-purple-700"></div>
            <span className="text-sm text-gray-600">Selected</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {roomsArray.map((room) => {
          const bedCount = reservationData[room]
            ? reservationData[room].length
            : 0;
          return (
            <div
              key={room}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
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
                    {selectedRooms[room]?.roomType && (
                      <div className="text-gray-700 text-sm font-medium">
                        {selectedRooms[room].roomType}
                      </div>
                    )}
                    {selectedRooms[room]?.roomPrice && (
                      <div className="bg-purple-50 text-ezzstay-base px-3 py-1.5 rounded-lg font-semibold text-sm">
                        Rs. {selectedRooms[room].roomPrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">
                    Time Slots
                  </span>
                </div>
                <div
                  ref={containerRef}
                  className="transition-transform duration-300 ease-in-out"
                >
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                    {timeSlots.map((time) => {
                      const status = getAvailability(room, time, currentDate);
                      const isSelected = selectedTimes.has(
                        `${room}-${formatDate(currentDate)}-${time}`
                      );
                      const isBooked = status === "booked";

                      return (
                        <button
                          key={`${room}-${currentDate.toISOString()}-${time}`}
                          onClick={() =>
                            handleTimeSelect(room, time, currentDate)
                          }
                          disabled={isBooked}
                          className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                            isBooked
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
