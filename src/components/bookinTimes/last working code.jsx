import React, { useState, useEffect, useRef } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";
import { Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const BookingTimes = () => {

  // const api = "127.0.0.1:8000";
  const api = "127.0.0.1:8000";
  const [propertyList, setPropertyList] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [errors, setErrors] = useState({});
  // const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dormBedConfigs, setDormBedConfigs] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState("all");
  const containerRef = useRef(null);

  const [amountPaid, setAmountPaid] = useState(0);
  // Additional state for booking and modal
  const [selectedTimes, setSelectedTimes] = useState(new Map());
  const [bookingHours, setBookingHours] = useState(1);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState({});
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [sameAsOwner, setSameAsOwner] = useState(false);

  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  const timeSlots = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
  );

  // Fetch reservation info for selected floor and derive available dates
  const fetchBookedSlotsAndDates = async () => {
    try {
      const response = await fetch(
        `http://${api}/get_reservation_info/${selectedFloor.floor_id}`
      );
      const reservationData = await response.json();

      // Get all unique bed IDs FIRST
      const allBedIds = [
        ...new Set(reservationData.flatMap((g) => g.beds.map((b) => b.bed_id))),
      ];

      // Fetch all bed configurations in one go
      let configMap = {};
      if (allBedIds.length > 0) {
        const queryParam = allBedIds
          .map((bedId) => `bed_ids=${bedId}`)
          .join("&");
        try {
          const response = await fetch(
            `http://${api}/get_beds_by_ids?${queryParam}`
          );
          if (!response.ok) {
            console.error("Failed to fetch bed configurations");
          } else {
            const bedConfigs = await response.json();
            bedConfigs.forEach((config) => {
              configMap[config.bed_id] = config;
            });
          }
        } catch (err) {
          console.error("Error fetching bed configurations:", err);
        }
      }
      // Merge configs with reservations
      const mergedData = reservationData.map((group) => ({
        ...group,
        beds: group.beds.map((bed) => ({
          ...bed,
          config: configMap[bed.bed_id] || null,
        })),
      }));

      // Set BOTH states atomically
      setBookedSlots(mergedData);
      setDormBedConfigs(configMap);

      // Extract unique dates from reservation checkin times
      const dates = new Set();
      reservationData.forEach((group) => {
        group.beds.forEach((bed) => {
          bed.reservations.forEach((reservation) => {
            const date = new Date(reservation.checkin_time)
              .toISOString()
              .split("T")[0];
            dates.add(date);
          });
        });
      });
    } catch (error) {
      console.error("Error fetching reservation data:", error);
    }
  };

  useEffect(() => {
    if (selectedFloor?.floor_id) {
      fetchBookedSlotsAndDates();
    }
  }, [selectedFloor?.floor_id]);

  // (Optional) Fetch bed configuration details if needed (similar to your previous code)

  // Fetch user role and property list.
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const roleResponse = await fetch(
            `http://${api}/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          setUserRole(roleData.role);

          if (canAccess(roleData.role, "partnerPropertyList")) {
            const response = await fetch(
              `http://${api}/fetchProperty/${user.mobile}`
            );
            const data = await response.json();
            setPropertyList(data);
          } else if (canAccess(roleData.role, "allPropertyList")) {
            const response = await fetch(`http://${api}/fetchAllProperty`);
            const data = await response.json();
            setPropertyList(data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchData();
    }
  }, [user]);

  const handlePropertySelectChange = (e) => {
    const selected = propertyList.find(
      (property) => property.p_id === parseInt(e.target.value, 10)
    );
    setSelectedProperty(selected);
    setFloors([]);
    setSelectedFloor(null);
    setBookedSlots([]);
    setSelectedTimes(new Map());
    setSelectedBookings([]);
    setSelectedRooms({});
  };

  const handleFloorSelectChange = (e) => {
    const selected = floors.find(
      (floor) => floor.floor_id === parseInt(e.target.value, 10)
    );
    setSelectedFloor(selected);
    setSelectedTimes(new Map());
    setSelectedBookings([]);
    setSelectedRooms({});
  };

  // Fetch floors when a property is selected.
  useEffect(() => {
    if (selectedProperty?.p_id) {
      const fetchFloorsData = async () => {
        try {
          const response = await fetch(
            `http://${api}/get_floor/${selectedProperty.p_id}`
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

  // Format date for display and keys
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  // Determine availability of a timeslot for a room key.
  const getAvailability = (roomKey, time, date) => {
    if (!bookedSlots || !Array.isArray(bookedSlots)) return "available";

    const timeslotDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    timeslotDate.setHours(hours, minutes, 0, 0);

    // Extract bed_id from roomKey for dormitory beds
    if (roomKey.includes(" - ")) {
      const [_, bedIdPart] = roomKey.split(" - ");
      const bedId = parseInt(bedIdPart, 10);

      // Find the specific bed in all groups
      for (const group of bookedSlots) {
        const bed = group.beds.find((b) => b.bed_id === bedId);
        if (bed) {
          for (const reservation of bed.reservations) {
            if (!reservation.checkin_time || !reservation.checkout_time)
              continue;
            const checkin = new Date(reservation.checkin_time);
            const checkout = new Date(reservation.checkout_time);
            if (timeslotDate >= checkin && timeslotDate < checkout) {
              return "booked";
            }
          }
          break;
        }
      }
      return "available";
    }

    // Existing logic for normal rooms
    const group = bookedSlots.find((group) => group.group_key === roomKey);
    if (!group) return "available";

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

    return "available";
  };

  // Handle time slot selection
  const handleTimeSelect = (room, time, date) => {
    const status = getAvailability(room, time, date);
    if (status === "booked") return;

    const requiredHours = bookingHours;
    const index = timeSlots.indexOf(time);
    if (index === -1) {
      setErrors({
        ...errors,
        timeSelection: `${requiredHours} hours of booking not available for this time slot.`,
      });
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
      const updatedBookings = Array.from(newTimes.keys());
      setSelectedBookings(updatedBookings);
      const updatedSelectedRooms = { ...selectedRooms };
      delete updatedSelectedRooms[room];
      setSelectedRooms(updatedSelectedRooms);
      return;
    }

    // Clear any previous times for the room on this date
    const prefix = `${room}-${formatDate(date)}-`;
    for (let key of newTimes.keys()) {
      if (key.startsWith(prefix)) {
        newTimes.delete(key);
      }
    }

    // Check all time slots in the block for availability
    const allAvailable = newBlock.every(
      ({ time: t, date: d }) => getAvailability(room, t, d) !== "booked"
    );

    if (!allAvailable) {
      setErrors({
        ...errors,
        timeSelection: `${requiredHours} hours of time slot not available from this time.`,
      });
      return;
    }
    setErrors({ ...errors, timeSelection: null });

    newBlock.forEach(({ time: t, date: d }) => {
      newTimes.set(`${room}-${formatDate(d)}-${t}`, true);
    });
    setSelectedTimes(newTimes);
    const updatedBookings = Array.from(newTimes.keys());
    setSelectedBookings(updatedBookings);

    // Find the correct room data to store
    let roomData;
    let roomPrice = 0;

    // In the dormitory bed handling section:
    if (room.includes(" - ")) {
      const [roomName, bedIdPart] = room.split(" - ");
      const bedId = parseInt(bedIdPart.replace("Bed ", ""), 10);
      const dormitoryGroup = bookedSlots.find(
        (group) =>
          group.group_key === roomName || group.group_key.includes(roomName)
      );

      if (dormitoryGroup) {
        const matchingBed = dormitoryGroup.beds.find(
          (bed) => bed.bed_id === bedId
        );

        if (matchingBed) {
          const bedConfig = dormBedConfigs[matchingBed.bed_id];
          roomPrice = bedConfig?.room_price_per_hour || 0;

          roomData = {
            roomType: dormitoryGroup.room_type,
            bed_id: [matchingBed.bed_id],
            roomPrice: roomPrice,
            isDormBed: true,
          };
        }
      }
    } else {
      // It's a normal room
      const roomGroup = bookedSlots.find((group) => group.group_key === room);
      if (roomGroup && roomGroup.beds && roomGroup.beds.length > 0) {
        // Get all bed_ids in this room
        const bedIds = roomGroup.beds.map((bed) => bed.bed_id);

        // For non-dormitory rooms, use the room_price directly instead of bed price
        // Get the room configuration from any bed
        const anyBedConfig = dormBedConfigs[bedIds[0]];

        // Use the room price directly for non-dormitory rooms
        // If room_price_per_hour is available, use it, otherwise default to 0
        roomPrice = anyBedConfig?.room_price_per_hour || 0;

        roomData = {
          roomType: roomGroup.room_type,
          bed_id: bedIds,
          roomPrice: roomPrice,
        };
      }
    }

    if (roomData) {
      setSelectedRooms({
        ...selectedRooms,
        [room]: roomData,
      });
    } else {
      console.error("Could not find room data for:", room);
    }
  };
  // Navigate to previous or next day
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

  // Group dormitory beds by bed number (for display purposes)
  const groupDormitoryBeds = (dormitoryRoom) => {
    const bedsByNumber = {};

    dormitoryRoom.beds.forEach((bed) => {
      const bedConfig = dormBedConfigs[bed.bed_id];
      // Update the display name format
      const displayName = `${dormitoryRoom.group_key} - Bed ${
        bedConfig?.bed_no || bed.bed_id
      }`;
      const groupKey = `${dormitoryRoom.group_key} - ${bed.bed_id}`;

      if (!bedsByNumber[groupKey]) {
        bedsByNumber[groupKey] = {
          displayName,
          roomType: dormitoryRoom.room_type,
          beds: [],
          bed_id: bed.bed_id,
          bedConfig,
        };
      }
      bedsByNumber[groupKey].beds.push(bed);
    });

    return bedsByNumber;
  };
  

  // Instead of immediately processing booking, open the payment modal
  const openPaymentModal = () => {
    // Initialize room-specific reservation details (if not already present)
    const initialDetails = {};
    Object.keys(selectedRooms).forEach((roomId) => {
      initialDetails[roomId] = { name: "", mobile: "" };
    });
    setReservationDetails(initialDetails);

    // Pre-populate ownerMobile if user data exists
    if (user && user.mobile) {
      setOwnerMobile(user.mobile);
    }
    setModalOpen(true);
  };

  // Submit the reservation form from the modal
  const handleSubmitReservation = async () => {
    // Calculate total from all room bookings
    let total = 0;
    const filteredSelectedRooms = {};

    Object.keys(selectedRooms).forEach((roomId) => {
      const roomTimes = Array.from(selectedTimes.keys()).filter((timeKey) =>
        timeKey.startsWith(`${roomId}-`)
      );
      const hoursSelected = roomTimes.length;
      const roomPrice = selectedRooms[roomId].roomPrice || 0;
      const gstAmount = selectedProperty.apply_gst
        ? roomPrice * (tax.gst / 100)
        : 0;
      const serviceTaxAmount = selectedProperty.apply_service_tax
        ? roomPrice * (tax.service / 100)
        : 0;
      const otherTaxAmount = selectedProperty.apply_other_tax
        ? roomPrice * (tax.other / 100)
        : 0;
      const totalTax = gstAmount + serviceTaxAmount + otherTaxAmount;
      const roomTotal = (roomPrice + totalTax) * hoursSelected;
      total += roomTotal;

      // Create the filteredSelectedRooms structure
      filteredSelectedRooms[roomId] = {
        bed_id: selectedRooms[roomId].bed_id,
        floorId: selectedFloor.floor_id,
        roomPrice: roomPrice,
        roomTotal: roomTotal,
        roomType: selectedRooms[roomId].roomType,
        name: reservationDetails[roomId]?.name || "",
        mobile: reservationDetails[roomId]?.mobile || "",
        selectedTimes: roomTimes,
      };
    });

    const payload = {
      bookingDetails: {
        selectedHotel: selectedProperty,
        date: currentDate.toISOString().split("T")[0],
        ...(selectedProperty && {
          selectedHotel: {
            id: selectedProperty.p_id,
            name: selectedProperty.p_name,
          },
        }),
      },
      ownerName,
      ownerMobile,
      total,
      filteredSelectedRooms,
      amountPaid,
    };

    try {
      const response = await fetch(`http://${api}/post_reservation_info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit reservation");
      }
      setModalOpen(false);
      alert("Reservation successful!");
      // Reset selections and refresh available slots
      setSelectedTimes(new Map());
      setSelectedBookings([]);
      setSelectedRooms({});
      if (selectedFloor?.floor_id) {
        fetchBookedSlotsAndDates();
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while submitting the reservation.");
    }
  };

  // Update room-specific reservation details when input changes
  const handleInputChange = (roomId, field, value) => {
    setReservationDetails((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value,
      },
    }));
  };

  // for the blocked time slots

  // --- Add these new state variables for the PNR details modal ---
  const [pnrModalOpen, setPnrModalOpen] = useState(false);
  const [selectedPnr, setSelectedPnr] = useState(null);
  const [pnrReservationDetails, setPnrReservationDetails] = useState([]);

  const openPnrModal = async (pnr) => {
    try {
      // First get basic PNR details
      const pnrResponse = await fetch(
        `http://${api}/get_details_by_pnr/${pnr}`
      );
      if (!pnrResponse.ok) throw new Error("Failed to fetch PNR details");
      const pnrData = await pnrResponse.json();

      // Then get detailed reservations
      const reservationsResponse = await fetch(
        `http://${api}/get_reservation_from_pnr/${pnr}`
      );
      if (!reservationsResponse.ok)
        throw new Error("Failed to fetch reservations");
      let reservations = await reservationsResponse.json();

      // Enrich with bed details
      const uniqueBedIds = [
        ...new Set(reservations.map((reservation) => reservation.space_id)),
      ];
      const queryParam = uniqueBedIds.map((id) => `bed_ids=${id}`).join("&");

      try {
        const bedResponse = await fetch(
          `http://${api}/get_beds_by_ids?${queryParam}`
        );
        if (bedResponse.ok) {
          const beds = await bedResponse.json();
          // Create a lookup map for bed details
          const bedMap = {};
          beds.forEach((bed) => {
            bedMap[bed.bed_id] = bed;
          });
          // Enrich each reservation with its corresponding bed details (wrapped in an array)
          reservations = reservations.map((reservation) => ({
            ...reservation,
            bedDetails: bedMap[reservation.space_id]
              ? [bedMap[reservation.space_id]]
              : [],
          }));
        } else {
          console.error("Failed to fetch bed details");
        }
      } catch (err) {
        console.error(`Error fetching bed details:`, err);
      }

      // Set all state values
      setPnrReservationDetails(reservations);
      setSelectedPnr({
        pnr: pnrData.pnr,
        status: pnrData.status,
        reservation_cost: pnrData.reservation_cost,
        amount_paid: pnrData.amount_paid,
      });
      setPnrModalOpen(true);
    } catch (error) {
      console.error("Error fetching PNR details:", error);
      alert(`Error loading PNR details: ${error.message}`);
    }
  };

  const handleBookedClick = (roomKey, time, date) => {
    // Find the room group from bookedSlots based on roomKey
    let group;

    // Handle dormitory beds differently
    if (roomKey.startsWith("Dormitory")) {
      // Find the main dormitory group
      group = bookedSlots.find((g) => g.group_key === "Dormitory");
    } else {
      // For normal rooms, find the exact match
      group = bookedSlots.find((g) => g.group_key === roomKey);
    }

    if (!group) return;

    // Create a Date object for the clicked timeslot
    const timeslotDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    timeslotDate.setHours(hours, minutes, 0, 0);

    // Look for the reservation that covers this timeslot
    let foundReservation = null;
    for (const bed of group.beds) {
      for (const reservation of bed.reservations) {
        if (!reservation.checkin_time || !reservation.checkout_time) continue;
        const checkin = new Date(reservation.checkin_time);
        const checkout = new Date(reservation.checkout_time);
        if (timeslotDate >= checkin && timeslotDate < checkout) {
          foundReservation = reservation;
          break;
        }
      }
      if (foundReservation) break;
    }

    // If a reservation is found with a PNR, open the modal using openPnrModal
    if (foundReservation && foundReservation.pnr) {
      openPnrModal(foundReservation.pnr);
    }
  };

  const groupReservations = (reservations) => {
    return reservations.reduce((groups, reservation) => {
      const bedDetail = reservation.bedDetails?.[0] || {};
      const roomType = (
        reservation.room_type ||
        bedDetail.room_type ||
        ""
      ).toLowerCase();
      let roomName =
        reservation.room_name || bedDetail.room_name || "Unknown Room";
      const roomPrice = bedDetail.room_price_per_hour || 0;

      if (roomType === "dormitory") {
        roomName = bedDetail.bed_no || roomName;
      }

      const groupKey =
        roomType === "dormitory"
          ? `${roomName}-${reservation.space_id}`
          : roomName;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          roomName,
          roomType,
          roomPrice,
          reservations: [],
        };
      }
      groups[groupKey].reservations.push(reservation);
      return groups;
    }, {});
  };

  const handleCancel = async (pnr) => {
    try {
      const response = await fetch(`http://${api}/cancel_pnr_status/${pnr}`, {
        method: "PUT",
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to cancel: ${errorMessage}`);
      }

      const data = await response.json();
      alert(`Cancelled Successfully: ${data.message}`);

      // Reset selections and refresh available slots
      setSelectedTimes(new Map());
      setSelectedBookings([]);
      setSelectedRooms({});
      if (selectedFloor?.floor_id) {
        fetchBookedSlotsAndDates();
      }
    } catch (error) {
      alert(`Error cancelling booking for PNR ${pnr}: ${error.message}`);
      console.error("Error cancelling booking.", pnr, error);
    }
  };

  // Add this function to check if the cancel button should be shown based on dates
  const isWithinCancellationPeriod = (reservations) => {
    if (
      !reservations ||
      !Array.isArray(reservations) ||
      reservations.length === 0
    ) {
      return false;
    }

    const today = new Date();


    // Calculate date 2 days from today
    const twoDaysFromToday = new Date(today);
    twoDaysFromToday.setDate(today.getDate() + 2);

    return reservations.some((reservation) => {
      const checkinDate = new Date(reservation.checkin_time);

      // Check if check-in is today or within the next two days
      return checkinDate >= today && checkinDate <= twoDaysFromToday;
    });
  };

  const [tax, setTax] = useState();

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

  const handleCompletePayment = async (pnr) => {
    try {
      const response = await fetch(`http://${api}/complete_payment/${pnr}`, {
        method: "PUT",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      alert(`Payment completed: ${data.message}`);
      // Refresh data to reflect updated payment status
      // Reset selections and refresh available slots
      setSelectedTimes(new Map());
      setSelectedBookings([]);
      setSelectedRooms({});
      if (selectedFloor?.floor_id) {
        fetchBookedSlotsAndDates();
      }
    } catch (error) {
      console.error("Payment completion error:", error);
      alert(`Payment completion failed: ${error.message}`);
    }
  };

  return (
    <div className="flex">
      <Side />
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          Bookings
        </h2>
        <div className="space-y-4">
          {/* Property and Floor Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Property Name:
              <select
                name="p_name"
                onChange={handlePropertySelectChange}
                required
                // disabled={loading}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a property</option>
                {propertyList.map((property) => (
                  <option key={property.p_id} value={property.p_id}>
                    {property.p_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Floor Name:
              <select
                name="floor_name"
                onChange={handleFloorSelectChange}
                required
                disabled={!selectedProperty}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Floor</option>
                {floors.map((floor) => (
                  <option key={floor.floor_id} value={floor.floor_id}>
                    {floor.floor_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedFloor && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter Room Type:
                <select
                  value={selectedRoomTypeFilter}
                  onChange={(e) => setSelectedRoomTypeFilter(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Rooms</option>
                  <option value="dormitory">Dormitory Beds</option>
                  <option value="private">Private Rooms</option>
                </select>
              </label>
            </div>
          )}

          {/* Booking Hours Selection */}
          {selectedFloor && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Booking Duration (hours):
                <input
                  type="number"
                  min="1"
                  max="24"
                  // value={bookingHours}
                  onChange={(e) => {
                    // Remove any non-integer characters
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setBookingHours(value);
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;

                    if (isNaN(value)) {
                      // Reset to minimum value if invalid
                      setBookingHours("1");
                      alert("Please enter a valid number of hours.");
                      return;
                    }

                    if (value > 24) {
                      setBookingHours("24");
                      alert(
                        "Maximum booking hours is 24. Please contact us for multiple day booking."
                      );
                    } else if (value < 1) {
                      setBookingHours("1");
                      alert("Minimum booking hours is 1");
                    } else {
                      // Ensure the value is stored as a string for the input
                      setBookingHours(value);
                    }
                  }}
                  placeholder="Hours"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="1"
                />
              </label>
              <p className="text-sm text-gray-500">
                Select how many consecutive hours you want to book.
              </p>
            </div>
          )}

          {/* Error Message Display */}
          {errors.timeSelection && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {errors.timeSelection}
            </div>
          )}

          {/* Time Slots Section */}
          {selectedFloor && (
            <div className="mt-8 space-y-6">
              {/* Date Navigation */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center gap-3 mb-4">
                  <button
                    onClick={() => changeDate("prev")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                    disabled={isAnimating}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg cursor-pointer"
                      onClick={() =>
                        document.getElementById("datePickerInput").showPicker()
                      }
                    >
                      <Calendar className="w-4 h-4 text-ezzstay-base" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatDate(currentDate)}
                      </span>
                    </div>
                    <input
                      id="datePickerInput"
                      type="date"
                      value={
                        new Date(
                          currentDate.getTime() -
                            currentDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                      onChange={(e) => {
                        // Create a new date from the input value
                        // Adding time ensures it's the exact day selected regardless of timezone
                        const newDate = new Date(`${e.target.value}T12:00:00`);
                        setCurrentDate(newDate);
                      }}
                      className="absolute opacity-0 pointer-events-none"
                    />
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
              {/* Render all rooms */}
              {/* First render normal rooms */}
              {(selectedRoomTypeFilter === "private" ||
                selectedRoomTypeFilter === "all") &&
                bookedSlots
                  .filter((room) => !room.group_key.startsWith("Dormitory"))
                  .map((room) => {
                    // Find room price from any bed configuration
                    let roomPrice = 0;
                    if (room.beds && room.beds.length > 0) {
                      for (const bed of room.beds) {
                        const bedConfig = dormBedConfigs[bed.bed_id];
                        if (bedConfig && bedConfig.room_price_per_hour) {
                          roomPrice = bedConfig.room_price_per_hour;
                          break;
                        }
                      }
                    }

                    return (
                      <div
                        key={room.group_key}
                        className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
                      >
                        <div className="bg-gradient-to-r from-purple-50 to-white p-4 border-b">
                          <div className="flex items-center gap-2">
                            <div className="bg-ezzstay-base text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
                              {room.group_key}
                            </div>
                            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
                              {room.room_type}
                            </div>
                            {roomPrice > 0 && (
                              <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">
                                ₹{roomPrice}/hour
                              </div>
                            )}
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
                                const status = getAvailability(
                                  room.group_key,
                                  time,
                                  currentDate
                                );
                                const isSelected = selectedTimes.has(
                                  `${room.group_key}-${formatDate(
                                    currentDate
                                  )}-${time}`
                                );
                                const now = new Date();
                                const currentHour = now.getHours();
                                const viewedDate = new Date(currentDate);
                                const isToday = viewedDate.toDateString() === now.toDateString();
                                const slotHour = parseInt(time.split(':')[0], 10);

                                const isBookable = !isToday || slotHour >= currentHour;

                                return (
                                  <button
                                    key={`${room.group_key
                                      }-${currentDate.toISOString()}-${time}`}
                                    onClick={() => {
                                      if (!isBookable && status !== "booked") {
                                        alert("Booking is not allowed for past dates or times.");
                                        return;
                                      }
                                      if (status === "booked") {
                                        handleBookedClick(
                                          room.group_key,
                                          time,
                                          currentDate
                                        );
                                      } else {
                                        handleTimeSelect(
                                          room.group_key,
                                          time,
                                          currentDate
                                        );
                                      }
                                    }}

                                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${status === "booked"
                                      ? "bg-gray-200 text-gray-400 cursor-pointer"
                                      : isSelected
                                        ? "bg-ezzstay-base text-white shadow-sm"
                                        : "bg-purple-100 text-ezzstay-base hover:bg-purple-200"
                                      }`}
                                  >
                                    {time.split(":")[0]}H
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

              {/* Then render dormitory beds */}
              {(selectedRoomTypeFilter === "dormitory" ||
                selectedRoomTypeFilter === "all") &&
                bookedSlots
                  .filter((room) => room.group_key.startsWith("Dormitory"))
                  .map((dormitoryRoom) => {
                    const groupedBeds = groupDormitoryBeds(dormitoryRoom);
                    return Object.entries(groupedBeds).map(
                      ([groupKey, group]) => {
                        const price = group.bedConfig?.room_price_per_hour || 0;

                        return (
                          <div
                            key={groupKey}
                            className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
                          >
                            <div className="bg-gradient-to-r from-purple-50 to-white p-4 border-b">
                              <div className="flex items-center gap-2">
                                <div className="bg-ezzstay-base text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
                                  {group.displayName}
                                </div>
                                <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
                                  {group.roomType}
                                </div>
                                {price > 0 && (
                                  <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">
                                    ₹{price}/hour
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="overflow-hidden p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 font-medium">
                                  Time Slots
                                </span>
                              </div>
                              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                                {timeSlots.map((time) => {
                                  const status = getAvailability(
                                    groupKey,
                                    time,
                                    currentDate
                                  );
                                  const isSelected = selectedTimes.has(
                                    `${groupKey}-${formatDate(
                                      currentDate
                                    )}-${time}`
                                  );
                                  const now = new Date();
                                  const currentHour = now.getHours();
                                  const viewedDate = new Date(currentDate);
                                  const isToday = viewedDate.toDateString() === now.toDateString();
                                  const slotHour = parseInt(time.split(':')[0], 10);

                                  // Allow booking if it's not today, or if it is today and the slot hour is the current hour or later
                                  const isBookable = !isToday || slotHour >= currentHour;

                                  return (
                                    <button
                                      key={`${groupKey}-${time}`}
                                      onClick={() => {
                                        if (!isBookable && status !== "booked") {
                                          alert("Booking is not allowed for past dates or times.");
                                          return;
                                        }
                                        if (status === "booked") {
                                          handleBookedClick(
                                            groupKey,
                                            time,
                                            currentDate
                                          );
                                        } else {
                                          handleTimeSelect(
                                            groupKey,
                                            time,
                                            currentDate
                                          );
                                        }
                                      }}
                                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${status === "booked"
                                        ? "bg-gray-200 text-gray-400 cursor-pointer"
                                        : isSelected
                                          ? "bg-ezzstay-base text-white shadow-sm"
                                          : "bg-purple-100 text-ezzstay-base hover:bg-purple-200"
                                        }`}
                                    >
                                      {time.split(":")[0]}H
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    );
                  })}
              {/* Message for no booking data */}
              {bookedSlots.length === 0 && selectedFloor && (
                <div className="text-center py-8 text-gray-500">
                  Loading Details...
                </div>
              )}

              {/* Booking Summary and Action Button */}
              {selectedBookings.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Booking Summary
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You have selected {Object.keys(selectedRooms).length}{" "}
                    room(s) for booking with {bookingHours} hour blocks.
                  </p>
                  <div className="space-y-2 mb-4">
                    {Object.keys(selectedRooms).map((roomKey) => {
                      const roomData = selectedRooms[roomKey];
                      const roomPrice = roomData.roomPrice || 0;
                      const bookingCount = selectedBookings.filter((b) =>
                        b.startsWith(`${roomKey}-`)
                      ).length;
                      const totalRoomPrice = roomPrice * bookingCount;

                      // For dormitory beds, construct the display name using bed_id
                      let displayName = roomKey;
                      if (
                        roomData.isDormBed &&
                        roomData.bed_id &&
                        roomData.bed_id.length > 0
                      ) {
                        const [dormName] = roomKey.split(" - ");
                        // Get the bed configuration to find the bed number
                        const bedId = roomData.bed_id[0];
                        const bedConfig = dormBedConfigs[bedId];
                        const bedNo = bedConfig?.bed_no || bedId;
                        displayName = `${dormName} - Bed ${bedNo}`;
                      }

                      return (
                        <div
                          key={roomKey}
                          className="flex items-center justify-between bg-purple-50 p-2 rounded-md"
                        >
                          <div>
                            <span className="font-medium text-gray-700">
                              {displayName}
                            </span>
                            <div className="text-xs text-gray-500">
                              ₹{roomPrice}/hour
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {bookingCount / bookingHours} time block(s)
                            </div>
                            <div className="font-medium text-ezzstay-base">
                              ₹{totalRoomPrice}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculate subtotal */}
                  {(() => {
                    const subtotal = Object.values(selectedRooms).reduce(
                      (total, room) => {
                        const bookingCount = selectedBookings.filter((b) =>
                          b.startsWith(
                            `${Object.keys(selectedRooms).find(
                              (key) => selectedRooms[key] === room
                            )}-`
                          )
                        ).length;
                        return total + room.roomPrice * bookingCount;
                      },
                      0
                    );

                    // Calculate taxes using values from database
                    const gstAmount =
                      selectedProperty.apply_gst === 1
                        ? subtotal * (tax?.gst / 100 || 0)
                        : 0;
                    const serviceTaxAmount =
                      selectedProperty.apply_service_tax === 1
                        ? subtotal * (tax?.service / 100 || 0)
                        : 0;
                    const otherTaxAmount =
                      selectedProperty.apply_other_tax === 1
                        ? subtotal * (tax?.other / 100 || 0)
                        : 0;
                    const totalTax =
                      gstAmount + serviceTaxAmount + otherTaxAmount;
                    const grandTotal = subtotal + totalTax;

                    return (
                      <>
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">
                              ₹{subtotal.toFixed(2)}
                            </span>
                          </div>

                          {selectedProperty.apply_gst === 1 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">
                                GST ({tax?.gst || 0}%):
                              </span>
                              <span>₹{gstAmount.toFixed(2)}</span>
                            </div>
                          )}

                          {selectedProperty.apply_service_tax === 1 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">
                                Service Tax ({tax?.service || 0}%):
                              </span>
                              <span>₹{serviceTaxAmount.toFixed(2)}</span>
                            </div>
                          )}

                          {selectedProperty.apply_other_tax === 1 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">
                                Other Taxes ({tax?.other || 0}%):
                              </span>
                              <span>₹{otherTaxAmount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold text-gray-700">
                              Total Amount:
                            </span>
                            <span className="font-bold text-xl text-ezzstay-base">
                              ₹{grandTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <button
                    onClick={openPaymentModal}
                    className="w-full bg-ezzstay-base hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-4"
                  >
                    Proceed to Payment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* PNR Details Modal */}
      {pnrModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
              Booking Details for PNR: {selectedPnr?.pnr}
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div

                className={`w-3 h-3 rounded-full ${selectedPnr?.status === "active"
                  ? "bg-green-500"
                  : "bg-red-500"
                  }`}
              ></div>
              <span className="text-lg font-semibold">
                Status: {selectedPnr?.status}
              </span>
              <span className="text-lg font-semibold text-ezzstay-base">
                Total Cost: ₹{selectedPnr?.reservation_cost}
              </span>
              <span className="text-lg font-semibold text-ezzstay-base">
                Amount Paid: ₹{selectedPnr?.amount_paid}
              </span>
              {/* Add cancel button here if conditions are met */}
              {selectedPnr?.status === "active" &&
                isWithinCancellationPeriod(pnrReservationDetails) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(selectedPnr.pnr);

                      setPnrModalOpen(false);
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ml-auto"
                  >
                    Cancel
                  </button>
                )}

              {selectedPnr.status !== "cancelled" &&
                selectedPnr.amount_paid !== null &&
                (selectedPnr.reservation_cost === selectedPnr.amount_paid ? (
                  <span className="text-sm text-gray-600">Paid</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">
                      Pending Payment: Rs.
                      {selectedPnr.reservation_cost - selectedPnr.amount_paid}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompletePayment(selectedPnr.pnr);
                        setPnrModalOpen(false);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Payment Completed
                    </button>
                  </>
                ))}
            </div>

            {pnrReservationDetails.length > 0 ? (
              <div className="space-y-4">
                {Object.values(groupReservations(pnrReservationDetails)).map(
                  (group, index) => {
                    const rep = group.reservations[0];
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-100 p-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {group.roomType === "dormitory"
                              ? "Dormitory Bed"
                              : "Room"}
                            : {group.roomName}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-gray-600">
                              {group.roomType}
                            </span>
                            <span className="text-ezzstay-base font-medium">
                              ₹{group.roomPrice}/hour
                            </span>
                          </div>
                        </div>

                        <div className="p-4 grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-800 mb-2">
                              Guest Details
                            </h4>
                            <div className="space-y-2">
                              <p className="text-gray-600">
                                <span className="font-medium">Name:</span>{" "}
                                {rep.name || "N/A"}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Mobile:</span>{" "}
                                {rep.mobile || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between mb-3">
                              <span className="text-gray-600 font-medium">
                                Check-In
                              </span>
                              <span className="text-gray-600 font-medium">
                                Check-Out
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">
                                {new Date(rep.checkin_time).toLocaleString()}
                              </span>
                              <span className="mx-2">→</span>
                              <span className="text-sm">
                                {new Date(rep.checkout_time).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                  Total Hours:
                                </span>
                                <span className="font-semibold text-ezzstay-base">
                                  {Math.ceil(
                                    (new Date(rep.checkout_time) -
                                      new Date(rep.checkin_time)) /
                                    (1000 * 60 * 60)
                                  )}{" "}
                                  hours
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">
                No reservation details found
              </p>
            )}

            <button
              onClick={() => setPnrModalOpen(false)}
              className="mt-6 w-full bg-ezzstay-base text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
      {/* Payment Modal (similar to TotalPay) */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="max-h-screen overflow-y-auto py-10"
            style={{ width: "400px" }}
          >
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">
                Enter Reservation Details
              </h2>
              {/* Owner Details */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Owner Details</h3>
                <input
                  type="text"
                  placeholder="Owner Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Owner Mobile"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  className={`w-full p-2 border rounded ${
                    user && user.mobile ? "bg-gray-100" : ""
                  }`}
                  readOnly={user && user.mobile ? true : false}
                  required
                />
              </div>
              {/* Room Specific Details */}
              {Object.keys(selectedRooms).map((roomId, index) => (
                <div key={roomId} className="mb-4">
                  <h3 className="font-semibold mb-2">Room {roomId} Details</h3>
                  {index === 0 && (
                    <div className="mb-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={sameAsOwner}
                        onChange={(e) => {
                          setSameAsOwner(e.target.checked);
                          if (e.target.checked) {
                            handleInputChange(roomId, "name", ownerName);
                            handleInputChange(roomId, "mobile", ownerMobile);
                          }
                        }}
                        className="mr-2"
                      />
                      <label className="text-sm">Same as Owner</label>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Name"
                    value={reservationDetails[roomId]?.name || ""}
                    onChange={(e) =>
                      handleInputChange(roomId, "name", e.target.value)
                    }
                    className="w-full p-2 border rounded mb-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile"
                    value={reservationDetails[roomId]?.mobile || ""}
                    onChange={(e) =>
                      handleInputChange(roomId, "mobile", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              ))}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="fullAmount"
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Get the grandTotal from the booking summary calculation
                        const subtotal = Object.values(selectedRooms).reduce(
                          (total, room) => {
                            const bookingCount = selectedBookings.filter((b) =>
                              b.startsWith(
                                `${Object.keys(selectedRooms).find(
                                  (key) => selectedRooms[key] === room
                                )}-`
                              )
                            ).length;
                            return total + room.roomPrice * bookingCount;
                          },
                          0
                        );
                        const gstAmount =
                          selectedProperty.apply_gst === 1
                            ? subtotal * (tax?.gst / 100 || 0)
                            : 0;
                        const serviceTaxAmount =
                          selectedProperty.apply_service_tax === 1
                            ? subtotal * (tax?.service / 100 || 0)
                            : 0;
                        const otherTaxAmount =
                          selectedProperty.apply_other_tax === 1
                            ? subtotal * (tax?.other / 100 || 0)
                            : 0;
                        const totalTax =
                          gstAmount + serviceTaxAmount + otherTaxAmount;
                        const grandTotal = subtotal + totalTax;

                        setAmountPaid(grandTotal.toFixed(2));
                      } else {
                        setAmountPaid("");
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="fullAmount" className="text-sm">
                    Paid full amount
                  </label>
                </div>
                <input
                  type="number"
                  placeholder="Amount Paid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      return; // Keep empty if user cleared the field
                    }

                    // Parse the entered value
                    const enteredAmount = parseFloat(e.target.value) || 0;

                    // Get the grandTotal from the booking summary calculation
                    const subtotal = Object.values(selectedRooms).reduce(
                      (total, room) => {
                        const bookingCount = selectedBookings.filter((b) =>
                          b.startsWith(
                            `${Object.keys(selectedRooms).find(
                              (key) => selectedRooms[key] === room
                            )}-`
                          )
                        ).length;
                        return total + room.roomPrice * bookingCount;
                      },
                      0
                    );
                    const gstAmount =
                      selectedProperty.apply_gst === 1
                        ? subtotal * (tax?.gst / 100 || 0)
                        : 0;
                    const serviceTaxAmount =
                      selectedProperty.apply_service_tax === 1
                        ? subtotal * (tax?.service / 100 || 0)
                        : 0;
                    const otherTaxAmount =
                      selectedProperty.apply_other_tax === 1
                        ? subtotal * (tax?.other / 100 || 0)
                        : 0;
                    const totalTax =
                      gstAmount + serviceTaxAmount + otherTaxAmount;
                    const grandTotal = subtotal + totalTax;

                    // Ensure amount paid doesn't exceed total
                    const validAmount = Math.min(enteredAmount, grandTotal);
                    setAmountPaid(validAmount);
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <button
                onClick={handleSubmitReservation}
                className="w-full bg-ezzstay-base text-white py-3 rounded-xl mt-4 font-semibold hover:bg-purple-800 transition-colors"
              >
                Submit Reservation
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-ezzstay-base py-3 rounded-xl mt-2 border border-ezzstay-base font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTimes;
