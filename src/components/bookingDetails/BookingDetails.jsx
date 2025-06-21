import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";

const BookingDetails = () => {
  const api = "127.0.0.1:8000";
  const [pnrDetails, setPnrDetails] = useState([]);
  const [openPNR, setOpenPNR] = useState({});
  const { user } = useUser();
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [checkInFilter, setCheckInFilter] = useState("");
  const [checkOutFilter, setCheckOutFilter] = useState("");
  const [filteredPnrDetails, setFilteredPnrDetails] = useState([]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const roleResponse = await fetch(
        `http://${api}/getUserRole/${user.mobile}`
      );
      const roleData = await roleResponse.json();

      if (canAccess(roleData.role, "partnerPropertyList")) {
        const response = await fetch(
          `http://${api}/get_pnr_with_reservations/${user.mobile}`
        );
        const data = await response.json();
        setPnrDetails(data);
      } else if (canAccess(roleData.role, "allPropertyList")) {
        const response = await fetch(`http://${api}/get_pnr_with_reservations`);
        const data = await response.json();
        setPnrDetails(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const togglePNR = async (pnr) => {
    // Toggle the collapsible view
    setOpenPNR((prev) => ({ ...prev, [pnr]: !prev[pnr] }));

    // Find the PNR item from pnrDetails
    const pnrItem = pnrDetails.find((item) => item.pnr === pnr);
    // If the PNR is being opened and hasn't been enriched yet, fetch bed details
    if (pnrItem && !pnrItem.enriched && !openPNR[pnr]) {
      // Extract unique bed ids (from space_id)
      const bedIds = [
        ...new Set(pnrItem.reservations.map((res) => res.space_id)),
      ];
      try {
        // Build query string to send multiple bed_ids
        const queryParam = bedIds.map((id) => `bed_ids=${id}`).join("&");
        const response = await fetch(
          `http://${api}/get_beds_by_ids?${queryParam}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch bed details");
        }
        const beds = await response.json();
        // Create a lookup map: { bed_id: bedDetail }
        const bedMap = {};
        beds.forEach((bed) => {
          bedMap[bed.bed_id] = bed;
        });
        // Enrich each reservation with its corresponding bed details (wrapped in an array)
        const enrichedReservations = pnrItem.reservations.map((res) => ({
          ...res,
          bedDetails: bedMap[res.space_id] ? [bedMap[res.space_id]] : [],
        }));
        // Update pnrDetails to mark this PNR as enriched and update its reservations
        setPnrDetails((prev) =>
          prev.map((item) =>
            item.pnr === pnr
              ? { ...item, reservations: enrichedReservations, enriched: true }
              : item
          )
        );
      } catch (error) {
        console.error("Error enriching reservations with bed details", error);
      }
    }
  };
  const groupReservations = (reservations) => {
    return reservations.reduce((groups, reservation) => {
      // Check for bedDetails if provided in the reservation. Otherwise, rely on reservation fields.
      const bedDetail = reservation.bedDetails && reservation.bedDetails[0];
      const roomType = (
        reservation.room_type ||
        (bedDetail && bedDetail.room_type) ||
        ""
      ).toLowerCase();
      let roomName =
        reservation.room_name ||
        (bedDetail && bedDetail.room_name) ||
        "Unknown Room";
      let roomPrice = (bedDetail && bedDetail.room_price_per_hour) || "0";

      if (roomType === "dormitory") {
        roomName = (bedDetail && bedDetail.bed_no) || roomName;
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
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel the booking for PNR ${pnr}?`
    );
    if (!confirmCancel) return;

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
      setPnrDetails([]);
      fetchData();
    } catch (error) {
      alert(`Error cancelling booking for PNR ${pnr}: ${error.message}`);
      console.error("Error cancelling booking.", pnr, error);
    }
  };

  const isWithinCancellationPeriod = (reservations) => {
    if (
      !reservations ||
      !Array.isArray(reservations) ||
      reservations.length === 0
    ) {
      return false;
    }
    const today = new Date();
    const twoDaysFromToday = new Date(today);
    twoDaysFromToday.setDate(today.getDate() + 2);
    return reservations.some((reservation) => {
      const checkinDate = new Date(reservation.checkin_time);
      return checkinDate >= today && checkinDate <= twoDaysFromToday;
    });
  };

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
      fetchData();
    } catch (error) {
      console.error("Payment completion error:", error);
      alert(`Payment completion failed: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!Array.isArray(pnrDetails) || pnrDetails.length === 0) {
      setFilteredPnrDetails([]);
      return;
    }

    let filtered = [...pnrDetails];

    // Filter by reservation_date (created date)
    if (createdDateFilter) {
      const createdDate = createdDateFilter.split("T")[0];
      filtered = filtered.filter((item) => {
        return (
          item.reservation_date &&
          item.reservation_date.split("T")[0] === createdDate
        );
      });
    }

    // Filter by check-in date (must be >= checkInFilter)
    if (checkInFilter) {
      filtered = filtered.filter((item) => {
        // Must have reservations with checkin_time >= checkInFilter
        return (
          item.reservations &&
          item.reservations.some(
            (res) =>
              res.checkin_time &&
              new Date(res.checkin_time) >=
              new Date(`${checkInFilter}T00:00:00`)
          )
        );
      });
    }

    // Filter by check-out date (must be <= checkOutFilter)
    if (checkOutFilter) {
      filtered = filtered.filter((item) => {
        // Must have reservations with checkout_time <= checkOutFilter
        return (
          item.reservations &&
          item.reservations.some(
            (res) =>
              res.checkout_time &&
              new Date(res.checkout_time) <=
              new Date(`${checkOutFilter}T23:59:59`)
          )
        );
      });
    }

    setFilteredPnrDetails(filtered);
  }, [pnrDetails, createdDateFilter, checkInFilter, checkOutFilter]);

  const getReservationDateRange = (reservations) => {
    if (!reservations || reservations.length === 0) return null;

    // Initialize using the first reservation's times.
    let minDate = new Date(reservations[0].checkin_time);
    let maxDate = new Date(reservations[0].checkout_time);

    // Loop through reservations to update the minimum checkin and maximum checkout.
    reservations.forEach((reservation) => {
      const checkin = new Date(reservation.checkin_time);
      const checkout = new Date(reservation.checkout_time);
      if (checkin < minDate) {
        minDate = checkin;
      }
      if (checkout > maxDate) {
        maxDate = checkout;
      }
    });

    return { minDate, maxDate };
  };


  return (
    <div className="flex">
      <Side />
      <div className="bg-gradient-to-br w-full from-purple-50 to-gray-100 min-h-screen p-6">
        <div className="container mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-ezzstay-base text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Bookings</h1>
              {user && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <span className="text-white">
                    User: <strong>{user.mobile}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Booking Creation Date
                </label>
                <input
                  type="date"
                  value={createdDateFilter}
                  onChange={(e) => setCreatedDateFilter(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Check-In Date (From)
                </label>
                <input
                  type="date"
                  value={checkInFilter}
                  onChange={(e) => setCheckInFilter(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Check-Out Date (To)
                </label>
                <input
                  type="date"
                  value={checkOutFilter}
                  onChange={(e) => setCheckOutFilter(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setCreatedDateFilter("");
                  setCheckInFilter("");
                  setCheckOutFilter("");
                }}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {Array.isArray(filteredPnrDetails) && filteredPnrDetails.length > 0 ? (
              <div className="space-y-4">
                {filteredPnrDetails.slice().reverse().map((pnrItem) => (
                  <div
                    key={pnrItem.pnr}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* PNR Header */}
                    <div
                      onClick={() => togglePNR(pnrItem.pnr)}
                      className="cursor-pointer bg-gray-50 hover:bg-purple-50 transition-colors duration-200 p-4 flex flex-col md:flex-row justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-4 h-4 rounded-full ${pnrItem.status === "active"
                            ? "bg-green-500"
                            : pnrItem.status === "cancelled"
                              ? "bg-red-500"
                              : pnrItem.status === "expired"
                                ? "bg-gray-500"
                                : "bg-yellow-500"
                            }`}
                        ></div>
                        <span className="font-semibold text-gray-800">PNR: {pnrItem.pnr}</span>
                        <span className="text-sm text-gray-600">
                          Cost: Rs.{pnrItem.reservation_cost}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${pnrItem.status === "active"
                            ? "bg-green-100 text-green-800"
                            : pnrItem.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : pnrItem.status === "expired"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {pnrItem.status}
                        </span>
                      </div>

                      {/* Date range preview (only shown if there are reservations) */}
                      {pnrItem.reservations && pnrItem.reservations.length > 0 && (
                        <div className="mt-2 md:mt-0 text-sm text-gray-600">
                          {(() => {
                            const range = getReservationDateRange(pnrItem.reservations);
                            if (range) {
                              return (
                                <>
                                  {range.minDate.toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                  &nbsp;-&nbsp;
                                  {range.maxDate.toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {/* Retain Cancel and Payment Buttons */}
                        {pnrItem.status !== "cancelled" && pnrItem.amount_paid !== null && (
                          pnrItem.reservation_cost === pnrItem.amount_paid ? (
                            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Paid
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Pending Payment: Rs.{pnrItem.reservation_cost - pnrItem.amount_paid}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompletePayment(pnrItem.pnr);
                                }}
                                className="bg-ezzstay-base text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                              >
                                Mark as Paid
                              </button>
                            </div>
                          )
                        )}

                        {pnrItem.status === "active" &&
                          isWithinCancellationPeriod(pnrItem.reservations) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(pnrItem.pnr);
                              }}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          )}

                        {/* Arrow Toggle */}
                        <span className="text-gray-600">
                          {openPNR[pnrItem.pnr] ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Reservation Details */}
                    {openPNR[pnrItem.pnr] && (
                      <div className="p-6 border-t border-gray-200 divide-y divide-gray-100">
                        {Array.isArray(pnrItem.reservations) && pnrItem.reservations.length > 0 ? (
                          Object.values(groupReservations(pnrItem.reservations)).map((group) => {
                            const rep = group.reservations[0];
                            return (
                              <div
                                key={group.roomName + (group.roomType === "dormitory" ? rep.space_id : "")}
                                className="py-4"
                              >
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                  {group.roomType === "dormitory" ? "Bed" : "Room"}: {group.roomName} ({group.roomType || "N/A"})
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                      {rep.name || "Guest"}
                                    </h4>
                                    <div className="space-y-2 text-gray-600">
                                      <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                        </svg>
                                        {rep.mobile || "N/A"}
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                        {rep.emailid || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                      <div className="flex justify-between mb-2">
                                        <span className="text-gray-500">Check-In</span>
                                        <span className="text-gray-500">Check-Out</span>
                                      </div>
                                      <div className="flex justify-between font-medium">
                                        <span>{new Date(rep.checkin_time).toLocaleString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        }) || "N/A"}</span>
                                        <span className="text-gray-400">→</span>
                                        <span>{new Date(rep.checkout_time).toLocaleString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        }) || "N/A"}</span>
                                      </div>
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-500">Room Price</span>
                                          <span className="text-xl font-bold text-ezzstay-base">
                                            ₹{group.roomPrice}/hr
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-gray-600">
                            {Array.isArray(pnrDetails) && pnrDetails.length > 0
                              ? "No bookings match your filter criteria."
                              : "Loading bookings..."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
