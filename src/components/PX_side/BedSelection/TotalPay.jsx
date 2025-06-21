//payment page

import React, { useState, useEffect } from "react";
import { Bed as BedIcon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../userContext/userContext";
import { validateMobile } from "../../../utils/validation";

const TotalPay = ({
  selectedRooms,
  selectedTimes,
  bookingDetails,
  floorId,
}) => {
  // Helper function for exact prefix matching.
  const roomTimeMatches = (time, roomId) => {
    const prefix = `${roomId}-`;
    return time.slice(0, prefix.length) === prefix;
  };

  // Compute a filtered list of room IDs that have at least one timeslot selected.
  const filteredRoomIds = Object.keys(selectedRooms).filter((roomId) =>
    selectedTimes.some((time) => roomTimeMatches(time, roomId))
  );
  console.log("filter", filteredRoomIds);

  // Calculate total number of beds across the filtered rooms.
  const totalBedsCount = filteredRoomIds.reduce((acc, roomId) => {
    const room = selectedRooms[roomId];
    return acc + (Array.isArray(room.bed_id) ? room.bed_id.length : 1);
  }, 0);

  // Calculate subtotal dynamically based on roomPrice in selectedRooms.
  const calculateSubtotal = () => {
    let subtotal = 0;
    filteredRoomIds.forEach((roomId) => {
      const room = selectedRooms[roomId];
      // Determine hours selected for this room using our helper for an exact match.
      const hoursSelected = selectedTimes.filter((time) =>
        roomTimeMatches(time, roomId)
      ).length;
      subtotal += room.roomPrice * hoursSelected;
    });
    return subtotal;
  };

  console.log("selectedRooms", selectedRooms);

  const subtotal = calculateSubtotal();
  // const total = subtotal + totalTax;
  // const gstAmount = hotelDetails.apply_gst === 1 ? subtotal * (tax?.gst / 100 || 0) : 0;
  // const serviceTaxAmount = hotelDetails.apply_service_tax === 1 ? subtotal * (tax?.service / 100 || 0) : 0;
  // const otherTaxAmount = hotelDetails.apply_other_tax === 1 ? subtotal * (tax?.other / 100 || 0) : 0;
  // const totalTax = gstAmount + serviceTaxAmount + otherTaxAmount;

  const [modalOpen, setModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState({});
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [sameAsOwner, setSameAsOwner] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  // Set ownerMobile when user is available
  useEffect(() => {
    if (user && user.mobile) {
      setOwnerMobile(user.mobile);
    }
  }, [user]);

  const handleInputChange = (roomId, field, value) => {
    setReservationDetails((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value,
      },
    }));
  };

  const handlePayment = () => {
    // Initialize reservation details regardless of login status
    const initialDetails = {};
    filteredRoomIds.forEach((roomId) => {
      initialDetails[roomId] = { name: "", mobile: "" };
    });
    setReservationDetails(initialDetails);

    // If user is logged in, set ownerMobile automatically
    if (user && user.mobile) {
      setOwnerMobile(user.mobile);
    }

    // Open payment modal directly
    setModalOpen(true);
  };
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Check if all fields are filled
    if (!ownerName || !ownerMobile) {
      return;
    }

    for (const roomId of filteredRoomIds) {
      if (
        !reservationDetails[roomId]?.name ||
        !reservationDetails[roomId]?.mobile
      ) {
        return;
      }
    }

    // Validate owner mobile number using validateMobile
    if (!validateMobile(ownerMobile)) {
      alert("Please enter a valid mobile number for the owner.");
      return;
    }
    // Validate guest mobile numbers for each room using validateMobile
    for (const roomId of filteredRoomIds) {
      if (!validateMobile(reservationDetails[roomId]?.mobile)) {
        alert(
          `Please enter a valid mobile number for the guest in room ${roomId}.`
        );
        return;
      }
    }

    // Build payload: for each room, include its name, mobile,
    // bookingDetails and selectedTimes associated with that room.
    const reservations = filteredRoomIds.map((roomId) => {
      const roomTimes = selectedTimes.filter((time) =>
        roomTimeMatches(time, roomId)
      );
      const hoursSelected = roomTimes.length;
      // const price = selectedRooms[roomId].roomPrice * hoursSelected;
      const price = String(selectedRooms[roomId].roomPrice * hoursSelected);
      return {
        floorId: floorId,
        room: roomId,
        name: reservationDetails[roomId]?.name || "",
        mobile: reservationDetails[roomId]?.mobile || "",
        selectedTimes: roomTimes,
        price: price,
      };
    });
    console.log("rev is", reservations);

    const filteredSelectedRooms = {};
    filteredRoomIds.forEach((roomId) => {
      // Find the corresponding reservation object to get the selectedTimes
      const roomReservation = reservations.find((res) => res.room === roomId);

      // Clone the original room data
      filteredSelectedRooms[roomId] = {
        ...selectedRooms[roomId],
        // Add the selectedTimes array from the reservation
        name: roomReservation ? roomReservation.name : null,
        mobile: roomReservation ? roomReservation.mobile : null,
        selectedTimes: roomReservation ? roomReservation.selectedTimes : [],
      };
    });
    console.log("weee", filteredSelectedRooms);

    // Make sure ownerMobile is included in the payload
    const payload = {
      bookingDetails,
      ownerName,
      ownerMobile,
      total,
      filteredSelectedRooms,
    };

    try {
      // Create Razorpay order via your FastAPI endpoint
      const orderResponse = await fetch("http://127.0.0.1:8000/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Assuming total is in INR (e.g., 500 for ₹500)
        body: JSON.stringify({ amount: total }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create payment order");
      }
      const orderData = await orderResponse.json();
      const { order_id } = orderData;

      // Razorpay Checkout Options
      const options = {
        key: "rzp_test_0nH69rvztCJPB7",
        amount: total * 100, // amount in paise
        currency: "INR",
        name: "Hotel Booking",
        description: "Room Booking Payment",
        order_id: order_id,
        handler: async function (response) {
          // Payment successful; now verify payment in backend
          const verifyResponse = await fetch(
            "http://127.0.0.1:8000/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                payload: payload, // pass your reservation details along
              }),
            }
          );
          if (!verifyResponse.ok) {
            throw new Error("Payment verification failed");
          }
          // On successful verification, close modal and navigate home
          setModalOpen(false);
          alert(
            "Reservation successful. please Log in to download your ticket"
          );
          navigate("/");
        },
        prefill: {
          name: ownerName,
          email: "", // If you have an email field, add it here
          contact: ownerMobile,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("An error occurred during payment processing.");
    }
  };

  // to apply taxes
  const [hotelDetails, selectedHotelDetails] = useState([]);


  const [tax, setTax] = useState();

  useEffect(() => {
    const fetchHotelTax = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/get_property_by_id/${bookingDetails.selectedHotel.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch property data");

        const data = await response.json();
        selectedHotelDetails(data);
        console.log("hotel data", data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHotelTax();

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

  const gstAmount =
    hotelDetails.apply_gst === 1 ? subtotal * (tax?.gst / 100 || 0) : 0;
  const serviceTaxAmount =
    hotelDetails.apply_service_tax === 1
      ? subtotal * (tax?.service / 100 || 0)
      : 0;
  const otherTaxAmount =
    hotelDetails.apply_other_tax === 1 ? subtotal * (tax?.other / 100 || 0) : 0;
  const totalTax = gstAmount + serviceTaxAmount + otherTaxAmount;
  const total = subtotal + totalTax;

  return (
    <div className="mt-8">
      <div className="bg-purple-50 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-ezzstay-base">
            Selected Rooms
          </h3>
          {/* <span className="bg-ezzstay-base text-white px-4 py-2 rounded-lg flex items-center gap-2"> */}
          <span className="border-ezzstay-base text-ezzstay-base px-4 py-2 rounded-lg flex items-center gap-2">
            <BedIcon size={18} />
            <span>
              {totalBedsCount} {totalBedsCount === 1 ? "Bed" : "Beds"}
            </span>
          </span>
          {/* <Link to="/hotelDetails" className="flex-1">
          change room
        </Link> */}
        </div>

        <div className="grid gap-4">
          {filteredRoomIds.map((roomId) => {
            const room = selectedRooms[roomId];
            const hoursSelected = selectedTimes.filter((time) =>
              roomTimeMatches(time, roomId)
            ).length;
            // Calculate the number of beds for this room
            const roomBedsCount = Array.isArray(room.bed_id)
              ? room.bed_id.length
              : 1;
            return (
              <div
                key={roomId}
                className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <BedIcon className="text-ezzstay-base" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ezzstay-base">
                      Bed {roomId}
                    </h4>
                    <p className="text-sm text-gray-500">{room.roomType}</p>
                    {room.roomType==="Dormitory" && (<p className="text-sm text-gray-500">{room.berth}</p>)}
                    <p className="text-sm text-gray-500">
                      {hoursSelected} {hoursSelected === 1 ? "hour" : "hours"}{" "}
                      selected
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-ezzstay-base">
                    {roomBedsCount} {roomBedsCount === 1 ? "Bed" : "Beds"}
                  </div>
                  <div className="font-bold text-ezzstay-base">
                    ₹ {room.roomPrice * hoursSelected}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹ {room.roomPrice}/hr
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-ezzstay-base">
              ₹ {subtotal}
            </span>
          </div>
          {hotelDetails.apply_gst === 1 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">GST ({tax?.gst || 0}%):</span>
              <span className="font-semibold text-ezzstay-base">
                ₹ {gstAmount.toFixed(2)}
              </span>
            </div>
          )}
          {hotelDetails.apply_service_tax === 1 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">
                Service Tax ({tax?.service || 0}%):
              </span>
              <span className="font-semibold text-ezzstay-base">
                ₹ {serviceTaxAmount.toFixed(2)}
              </span>
            </div>
          )}
          {hotelDetails.apply_other === 1 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">
                Other Taxes ({tax?.other || 0}%):
              </span>
              <span className="font-semibold text-ezzstay-base">
                ₹ {otherTaxAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-ezzstay-base">Total</span>
            <span className="text-ezzstay-base">₹ {total}</span>
          </div>
        </div>

        <button
          className="w-full bg-ezzstay-base text-white py-4 rounded-xl mt-6 text-xl font-semibold hover:bg-purple-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          onClick={handlePayment}
        >
          Proceed to Payment
        </button>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div
            className="max-h-screen overflow-y-auto py-10 scrollbar-hide w-full max-w-md"
            style={{ scrollbarWidth: "none" }}
          >
            <div
              className="bg-white rounded-xl p-6 shadow-xl mx-4"
              style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <h2 className="text-xl font-bold mb-4 text-ezzstay-base border-b pb-2">
                Reservation Details
              </h2>

              <form onSubmit={handleSubmitReservation}>
                {/* Owner Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-gray-700 flex items-center">
                    <span className="bg-purple-100 p-1 rounded-full mr-2 text-ezzstay-base text-xs">
                      1
                    </span>
                    Your Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:outline-none transition ${
                          formSubmitted && !ownerName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {formSubmitted && !ownerName && (
                        <p className="text-red-500 text-xs mt-1">
                          Owner name is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Your Mobile *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter mobile number"
                        value={ownerMobile}
                        onChange={(e) => setOwnerMobile(e.target.value)}
                        className={`w-full p-3 border rounded-lg ${
                          user && user.mobile ? "bg-gray-100" : ""
                        } focus:ring-2 focus:ring-purple-300 focus:outline-none transition ${
                          formSubmitted && !ownerMobile
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        readOnly={user && user.mobile ? true : false}
                        required
                      />
                      {formSubmitted && !ownerMobile && (
                        <p className="text-red-500 text-xs mt-1">
                          Owner mobile is required
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Room Specific Details */}
                <div className="space-y-6">
                  <h3 className="font-semibold mb-3 text-gray-700 flex items-center">
                    <span className="bg-purple-100 p-1 rounded-full mr-2 text-ezzstay-base text-xs">
                      2
                    </span>
                    Bed Details
                  </h3>

                  {filteredRoomIds.map((roomId, index) => {
                    // Calculate the number of beds for this room in the modal as well
                    const room = selectedRooms[roomId];
                    const roomBedsCount = Array.isArray(room.bed_id)
                      ? room.bed_id.length
                      : 1;

                    return (
                      <div
                        key={roomId}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-ezzstay-base">
                            Bed {roomId} ({roomBedsCount}{" "}
                            {roomBedsCount === 1 ? "Bed" : "Beds"})
                          </h4>
                          {index === 0 && (
                            <div className="flex items-center">
                              <input
                                id={`sameAsOwner-${roomId}`}
                                type="checkbox"
                                checked={sameAsOwner}
                                onChange={(e) => {
                                  setSameAsOwner(e.target.checked);
                                  if (e.target.checked) {
                                    handleInputChange(
                                      roomId,
                                      "name",
                                      ownerName
                                    );
                                    handleInputChange(
                                      roomId,
                                      "mobile",
                                      ownerMobile
                                    );
                                  }
                                }}
                                className="mr-2 h-4 w-4 text-ezzstay-base rounded focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`sameAsOwner-${roomId}`}
                                className="text-sm text-gray-600"
                              >
                                Same as owner
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Guest Name *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter guest name"
                              value={reservationDetails[roomId]?.name || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  roomId,
                                  "name",
                                  e.target.value
                                )
                              }
                              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:outline-none transition ${
                                formSubmitted &&
                                !reservationDetails[roomId]?.name
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              required
                            />
                            {formSubmitted &&
                              !reservationDetails[roomId]?.name && (
                                <p className="text-red-500 text-xs mt-1">
                                  Guest name is required
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Guest Mobile *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter guest mobile"
                              value={reservationDetails[roomId]?.mobile || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  roomId,
                                  "mobile",
                                  e.target.value
                                )
                              }
                              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:outline-none transition ${
                                formSubmitted &&
                                !reservationDetails[roomId]?.mobile
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              required
                            />
                            {formSubmitted &&
                              !reservationDetails[roomId]?.mobile && (
                                <p className="text-red-500 text-xs mt-1">
                                  Guest mobile is required
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col space-y-3 mt-6">
                  <button
                    type="submit"
                    className="w-full bg-ezzstay-base text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition-colors flex items-center justify-center shadow-md"
                  >
                    Confirm Reservation
                  </button>
                  <button
                    type="button"
                    className="w-full text-ezzstay-base py-3 rounded-xl border border-ezzstay-base font-semibold hover:bg-gray-100 transition-colors"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalPay;
