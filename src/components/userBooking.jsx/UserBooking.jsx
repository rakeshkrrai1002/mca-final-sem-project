import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Home,
  ChevronDown,
  ChevronUp,
  Phone,
  IndianRupee,
  Download,
} from "lucide-react";
import { useUser } from "../userContext/userContext";
import jsPDF from "jspdf";
// Note: Don't use import 'jspdf-autotable' directly, it won't work properly

// Helper functions remain unchanged
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

const calculateDuration = (checkin, checkout) => {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diff = (end - start) / (1000 * 60 * 60); // hours
  return `${diff} hr${diff !== 1 ? "s" : ""}`;
};

// **** NEW: Enrichment and Grouping functions ****

// This function enriches a booking's reservations with bed details.
const enrichBooking = async (booking) => {
  // Skip if already enriched
  if (booking.enriched) return booking;

  // Extract unique bed IDs (from space_id)
  const bedIds = [...new Set(booking.reservations.map((res) => res.space_id))];
  try {
    const queryParam = bedIds.map((id) => `bed_ids=${id}`).join("&");
    const response = await fetch(
      `http://127.0.0.1:8000/get_beds_by_ids?${queryParam}`
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
    const enrichedReservations = booking.reservations.map((res) => ({
      ...res,
      bedDetails: bedMap[res.space_id] ? [bedMap[res.space_id]] : [],
    }));
    return { ...booking, reservations: enrichedReservations, enriched: true };
  } catch (error) {
    console.error("Error enriching reservations with bed details", error);
    return booking;
  }
};

// This function groups reservations by room type and details.
const groupReservations = (reservations) => {
  return reservations.reduce((groups, reservation) => {
    const bedDetail =
      reservation.bedDetails && reservation.bedDetails[0];
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
// Enhanced PDF Generation function with awesome styling
const generateBookingPDF = (booking) => {
  const doc = new jsPDF();
  const firstReservation = booking.reservations[0];
  const reservationDate = formatDate(booking.reservation_date);
  const isPaid =
    booking.amount_paid !== null &&
    booking.amount_paid >= booking.reservation_cost;

  // Enhanced styling constants
  const colors = {
    primary: [41, 128, 185],      // Professional blue
    secondary: [52, 152, 219],     // Lighter blue
    accent: [230, 126, 34],        // Orange accent
    success: [39, 174, 96],        // Green for paid
    danger: [231, 76, 60],         // Red for unpaid
    dark: [44, 62, 80],           // Dark blue-gray
    light: [236, 240, 241],       // Light gray
    white: [255, 255, 255],       // White
    text: [52, 73, 94]            // Dark gray text
  };

  // Helper function to safely set colors
  const setFillColorSafe = (color) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const setTextColorSafe = (color) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setDrawColorSafe = (color) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // === HEADER SECTION ===
  // Gradient-like header background
  setFillColorSafe(colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Add subtle shadow effect
  doc.setFillColor(0, 0, 0, 20); // Using opacity value for shadow
  doc.rect(0, 35, pageWidth, 2, 'F');

  // Hotel/Company logo placeholder (decorative element)
  setFillColorSafe(colors.white);
  doc.circle(25, 17.5, 8, 'F');
  setFillColorSafe(colors.primary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('H', 25, 21, { align: 'center' });

  // Main title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.white);
  doc.text('BOOKING CONFIRMATION', pageWidth/2, 15, { align: 'center' });
  
  // Booking number
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Booking #${booking.pnr}`, pageWidth/2, 25, { align: 'center' });

  // === STATUS INDICATOR ===
  let statusText = isPaid ? 'PAID' : 'PENDING PAYMENT';
  let statusColor = isPaid ? colors.success : colors.danger;
  
  // Add status badge in top right
  const statusX = pageWidth - 45;
  const statusY = 10;
  setFillColorSafe(statusColor);
  doc.roundedRect(statusX, statusY, 35, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.white);
  doc.text(statusText, statusX + 17.5, statusY + 5.5, { align: 'center' });

  // === BOOKING SUMMARY CARD ===
  let yPos = 50;
  
  // Card background with shadow
  doc.setFillColor(0, 0, 0, 10); // Light shadow
  doc.roundedRect(margin + 2, yPos + 2, pageWidth - (margin * 2), 45, 3, 3, 'F');
  setFillColorSafe(colors.white);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, 3, 'F');
  setDrawColorSafe(colors.light);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, 3, 'S');

  // Card header
  setFillColorSafe(colors.secondary);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 12, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.white);
  doc.text('BOOKING DETAILS', margin + 5, yPos + 8);

  // Card content
  yPos += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setTextColorSafe(colors.text);

  // Left column
  const leftCol = margin + 5;
  const rightCol = pageWidth/2 + 10;
  
  // Guest information
  doc.setFont('helvetica', 'bold');
  doc.text('Guest Information', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Name: ${firstReservation.name || 'N/A'}`, leftCol, yPos);
  yPos += 5;
  doc.text(`Mobile: ${firstReservation.mobile}`, leftCol, yPos);
  yPos += 5;
  doc.text(`Email: ${firstReservation.emailid || 'N/A'}`, leftCol, yPos);

  // Right column - Booking info
  yPos = 68;
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Information', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Date: ${reservationDate}`, rightCol, yPos);
  yPos += 5;
  doc.text(`Location: ${booking.address1}`, rightCol, yPos);
  yPos += 5;
  doc.text(`PIN: ${booking.pin}`, rightCol, yPos);

  // === RESERVATION DETAILS SECTION ===
  yPos = 110;
  
  // Section header with icon
  setFillColorSafe(colors.accent);
  doc.rect(margin, yPos, 4, 12, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.dark);
  doc.text('RESERVATION DETAILS', margin + 10, yPos + 8);

  yPos += 20;

  // Enhanced table design
  const tableY = yPos;
  const tableHeight = 15 + (booking.reservations.length * 12);
  const colWidths = [30, 45, 40, 40, 35];
  const colX = [margin, margin + 30, margin + 75, margin + 115, margin + 155];

  // Table shadow
  doc.setFillColor(0, 0, 0, 10); // Light shadow
  doc.rect(margin + 1, tableY + 1, pageWidth - (margin * 2), tableHeight, 'F');

  // Table background
  setFillColorSafe(colors.white);
  doc.rect(margin, tableY, pageWidth - (margin * 2), tableHeight, 'F');

  // Table header
  setFillColorSafe(colors.primary);
  doc.rect(margin, tableY, pageWidth - (margin * 2), 15, 'F');

  // Header text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.white);
  const headers = ['Bed No.', 'Room Name', 'Check-in', 'Check-out', 'Duration'];
  headers.forEach((header, i) => {
    doc.text(header, colX[i] + 2, tableY + 10);
  });

  // Table rows
  let currentRowY = tableY + 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColorSafe(colors.text);

  booking.reservations.forEach((reservation, index) => {
    // Alternating row colors
    if (index % 2 === 1) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, currentRowY, pageWidth - (margin * 2), 12, 'F');
    }

    const bedDetail = reservation.bedDetails && reservation.bedDetails[0];
    const bedNo = bedDetail ? bedDetail.bed_no : 'N/A';
    const roomName = bedDetail ? bedDetail.room_name : 'N/A';

    // Row data
    const rowData = [
      bedNo.toString(),
      roomName,
      formatTime(reservation.checkin_time),
      formatTime(reservation.checkout_time),
      calculateDuration(reservation.checkin_time, reservation.checkout_time)
    ];

    rowData.forEach((data, i) => {
      doc.text(data, colX[i] + 2, currentRowY + 8);
    });

    currentRowY += 12;
  });

  // Table border
  setDrawColorSafe(colors.light);
  doc.setLineWidth(0.5);
  doc.rect(margin, tableY, pageWidth - (margin * 2), tableHeight, 'S');

  // Vertical lines
  colX.slice(1).forEach(x => {
    doc.line(x, tableY, x, tableY + tableHeight);
  });

  // === PAYMENT SUMMARY ===
  yPos = tableY + tableHeight + 20;
  
  // Payment card
  const paymentCardHeight = 35;
  doc.setFillColor(0, 0, 0, 5); // Light shadow
  doc.roundedRect(margin + 1, yPos + 1, pageWidth - (margin * 2), paymentCardHeight, 3, 3, 'F');
  setFillColorSafe(colors.white);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), paymentCardHeight, 3, 3, 'F');
  setDrawColorSafe(colors.light);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), paymentCardHeight, 3, 3, 'S');

  // Payment header
  if (isPaid) {
    doc.setFillColor(39, 174, 96, 20); // Success color with low opacity
  } else {
    doc.setFillColor(231, 76, 60, 20); // Danger color with low opacity
  }
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 12, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(isPaid ? colors.success : colors.danger);
  doc.text('PAYMENT SUMMARY', margin + 5, yPos + 8);

  // Payment details
  yPos += 18;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  setTextColorSafe(colors.text);

  // Left side - amounts
  doc.text(`Total Amount: ₹${booking.reservation_cost}`, margin + 5, yPos);
  yPos += 6;
  
  if (isPaid) {
    setTextColorSafe(colors.success);
    doc.text(`Amount Paid: ₹${booking.amount_paid}`, margin + 5, yPos);
    yPos += 6;
    setTextColorSafe(colors.text);
    doc.text(`Payment ID: ${booking.payment_id || 'N/A'}`, margin + 5, yPos);
  } else {
    setTextColorSafe(colors.danger);
    doc.text(`Amount Due: ₹${booking.reservation_cost - (booking.amount_paid || 0)}`, margin + 5, yPos);
    if (booking.amount_paid) {
      yPos += 6;
      setTextColorSafe(colors.text);
      doc.text(`Paid: ₹${booking.amount_paid}`, margin + 5, yPos);
    }
  }

  // === DECORATIVE ELEMENTS ===
  // Add some decorative lines
  yPos = pageHeight - 40;
  setDrawColorSafe(colors.secondary);
  doc.setLineWidth(2);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // === FOOTER ===
  yPos += 10;
  
  // Thank you message
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setTextColorSafe(colors.primary);
  doc.text('Thank you for choosing us!', pageWidth/2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColorSafe(colors.text);
  doc.text('Please keep this confirmation for your records', pageWidth/2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth/2, yPos, { align: 'center' });

  // Add QR code placeholder (decorative)
  const qrSize = 15;
  const qrX = pageWidth - margin - qrSize;
  const qrY = pageHeight - 30;
  setFillColorSafe(colors.light);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  setDrawColorSafe(colors.text);
  doc.setLineWidth(0.5);
  doc.rect(qrX, qrY, qrSize, qrSize, 'S');
  doc.setFontSize(6);
  setTextColorSafe(colors.text);
  doc.text('QR', qrX + qrSize/2, qrY + qrSize/2 + 1, { align: 'center' });

  // Save with enhanced filename
  doc.save(`hotel-booking-${booking.pnr}-${reservationDate.replace(/\s/g, '-')}.pdf`);
};

// Enhanced BookingTicket component
const BookingTicket = ({ booking }) => {
  const [expanded, setExpanded] = useState(false);
  // NEW: Local state to hold enriched booking details.
  const [enrichedBooking, setEnrichedBooking] = useState(booking);
  const firstReservation = enrichedBooking.reservations[0];
  const reservationDate = formatDate(enrichedBooking.reservation_date);
  const isPaid =
    enrichedBooking.amount_paid !== null &&
    enrichedBooking.amount_paid >= enrichedBooking.reservation_cost;
  const isUpcoming = new Date(firstReservation.checkin_time) > new Date();

  // Check if the booking is for today
  const today = new Date();
  const checkinDate = new Date(firstReservation.checkin_time);
  const isToday =
    today.getDate() === checkinDate.getDate() &&
    today.getMonth() === checkinDate.getMonth() &&
    today.getFullYear() === checkinDate.getFullYear();

  // Determine the left border color based on status
  let statusColor = "border-blue-600"; // default for upcoming
  let statusBgColor = "bg-blue-50";

  if (isToday) {
    statusColor = "border-green-600"; // today's bookings
    statusBgColor = "bg-green-50";
  } else if (!isUpcoming) {
    statusColor = "border-gray-400"; // past bookings
    statusBgColor = "bg-gray-50";
  }

  // Handle PDF download
  const handleDownloadPDF = (e) => {
    e.stopPropagation(); // Prevent the click from toggling the expanded state
    generateBookingPDF(enrichedBooking);
  };

  // NEW: When the ticket is expanded, enrich the booking if not already done.
  useEffect(() => {
    if (expanded && !enrichedBooking.enriched) {
      enrichBooking(enrichedBooking).then((updatedBooking) => {
        setEnrichedBooking(updatedBooking);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div
      className={`mb-6 bg-white rounded-lg shadow-md overflow-hidden border-l-4 transition-all duration-200 hover:shadow-lg ${statusColor}`}
    >
      {/* Ticket Header */}
      <div
        className={`p-5 ${statusBgColor} border-b cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800">
                Booking #{enrichedBooking.pnr}
              </span>
              <div className="ml-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {enrichedBooking.reservations.length}{" "}
                {enrichedBooking.reservations.length === 1 ? "Bed" : "Beds"}
              </div>
            </div>

            <div className="flex mt-2 sm:mt-0 sm:ml-4">
              {isToday && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Today's Stay
                </div>
              )}

              {!isUpcoming && !isToday && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  Past Stay
                </div>
              )}

              {isUpcoming && !isToday && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Upcoming
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {isPaid ? (
              <div className="flex items-center text-green-600 mr-3 font-medium">
                <CheckCircle size={18} className="mr-1" />
                <span>Paid</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 mr-3 font-medium">
                <XCircle size={18} className="mr-1" />
                <span>Unpaid</span>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownloadPDF}
              className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
              aria-label="Download booking details"
              title="Download booking details as PDF"
            >
              <Download size={18} className="text-blue-600" />
            </button>

            {expanded ? (
              <ChevronUp size={20} className="text-gray-500" />
            ) : (
              <ChevronDown size={20} className="text-gray-500" />
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm text-gray-700">
          <div className="flex items-center">
            <Calendar size={16} className="mr-2 text-blue-600" />
            <span>{reservationDate}</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-2 text-blue-600" />
            <span>
              {formatTime(firstReservation.checkin_time)} -{" "}
              {formatTime(firstReservation.checkout_time)}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-5">
          <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-lg">
                Reservation Summary
              </h3>
              <div className="text-xl font-bold text-blue-700">
                ₹{enrichedBooking.reservation_cost}
              </div>
            </div>

            <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <MapPin
                  size={16}
                  className="mr-2 text-blue-600 flex-shrink-0"
                />
                <span>
                  {enrichedBooking.address1}, {enrichedBooking.pin}
                </span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-blue-600 flex-shrink-0" />
                <span>Contact: {firstReservation.mobile}</span>
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 text-lg mb-3">
            Your Reservation
          </h3>
          {/* NEW: Render Grouped Reservations */}
          <div className="space-y-4">
            {enrichedBooking.reservations &&
            enrichedBooking.reservations.length > 0 ? (
              Object.values(
                groupReservations(enrichedBooking.reservations)
              ).map((group) => {
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
                            <span>Mobile: </span>
                            {rep.mobile || "N/A"}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>Email: </span>
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
                            <span>
                              {formatTime(rep.checkin_time)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span>
                              {formatTime(rep.checkout_time)}
                            </span>
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
                No reservations available
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              <span className="font-medium">Payment Ref:</span>{" "}
              {enrichedBooking.payment_id || "Pending payment"}
            </div>
            <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg">
              <IndianRupee
                size={18}
                className={isPaid ? "mr-2 text-green-600" : "mr-2 text-red-600"}
              />
              <span className="font-bold">
                {isPaid ? (
                  <span className="text-green-700">
                    Paid in full: {enrichedBooking.amount_paid}
                  </span>
                ) : (
                  <span className="text-red-700">
                    Balance due:{" "}
                    {enrichedBooking.reservation_cost - (enrichedBooking.amount_paid || 0)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// The rest of the UserBooking component remains unchanged
const UserBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'today', 'past'
  const { user } = useUser();

  useEffect(() => {
    // Function to get the currently logged in user
    const getLoggedInUser = () => {
      if (user) {
        // If user is already an object (likely from your context)
        if (typeof user === "object") {
          return user.mobile;
        }

        // If user is a string that needs parsing
        try {
          const userData = typeof user === "string" ? JSON.parse(user) : user;
          console.log("userData is ", userData);
          return userData.mobile;
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      }

      // If user data isn't available, return null or a default
      return null;
    };

    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Get the current user's ID
        const userId = getLoggedInUser();

        if (!userId) {
          throw new Error("No user is currently logged in");
        }

        // Make the API call with the user ID
        const response = await fetch(
          `http://127.0.0.1:8000/myBookings?user_id=${userId}`
        );

        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check if the data is in the expected format
        if (!Array.isArray(data)) {
          throw new Error("Received invalid data format from server");
        }

        setBookings(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(`Failed to fetch bookings: ${err.message}`);
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstReservation = booking.reservations[0];
    const checkinTime = new Date(firstReservation.checkin_time);

    if (filter === "today") {
      return checkinTime >= today && checkinTime < tomorrow;
    } else if (filter === "upcoming") {
      return checkinTime > now;
    } else if (filter === "past") {
      return checkinTime < now;
    }

    return true;
  });

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter(
      (b) => new Date(b.reservations[0].checkin_time) > new Date()
    ).length,
    today: bookings.filter((b) => {
      const checkin = new Date(b.reservations[0].checkin_time);
      const now = new Date();
      return (
        checkin.getDate() === now.getDate() &&
        checkin.getMonth() === now.getMonth() &&
        checkin.getFullYear() === now.getFullYear()
      );
    }).length,
    past: bookings.filter(
      (b) => new Date(b.reservations[0].checkin_time) < new Date()
    ).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg ">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          Unable to load your bookings
        </h3>
        <p className="mt-1 text-sm text-gray-500 max-w-md text-center">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4  max-w-7xl">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          My Reservations
        </h1>
        <p className="text-gray-600 mb-4">
          View and manage all your hotel bookings in one place
        </p>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto mb-1 border-b">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
              filter === "all"
                ? "text-blue-700 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            All Bookings{" "}
            <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
              filter === "today"
                ? "text-green-700 border-green-600"
                : "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Today{" "}
            <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              {counts.today}
            </span>
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
              filter === "upcoming"
                ? "text-blue-700 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Upcoming{" "}
            <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {counts.upcoming}
            </span>
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
              filter === "past"
                ? "text-gray-700 border-gray-600"
                : "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Past Stays{" "}
            <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
              {counts.past}
            </span>
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <Home size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {filter === "all"
              ? "You don't have any hotel bookings yet."
              : `You don't have any ${
                  filter === "upcoming"
                    ? "upcoming"
                    : filter === "today"
                    ? "today's"
                    : "past"
                } bookings.`}
          </p>
        </div>
      ) : (
        <div>
          {filteredBookings.map((booking) => (
            <BookingTicket key={booking.pnr} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBooking;
