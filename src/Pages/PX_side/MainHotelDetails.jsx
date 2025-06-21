import { React, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FacilitiesDetails from '../../components/PX_side/Hotel/FacilitiesDetails';
import EditableBookingDetails from '../../components/PX_side/Hotel_Search/EditableBookingDetails';
import ImageSlider from '../../components/PX_side/Hotel/ImageSlider';
import axios from "axios";

const MainHotelDetails = () => {
  const location = useLocation();
  const hotel = location.state?.hotel;

  const [facilities, setFacilities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/get_property_common_settings/${hotel.p_id}`);
        setFacilities(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch facilities:", error);
        setLoading(false);
      }
    };

    if (hotel?.p_id) {
      fetchFacilities();
    }
  }, [hotel?.p_id]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Hotel Name and Rating */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {hotel.p_name}
              </h1>
              <div className="flex items-center mt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-gray-600 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-600 text-lg">{hotel.city}</p>
              </div>
            </div>

            {/* <div className="flex flex-col items-start md:items-end">
              <div className="flex items-center bg-white rounded-lg  p-2">
                <div className="flex items-center space-x-1 text-yellow-500">
                  {Array.from({ length: Math.floor(4.5) }, (_, index) => (
                    <svg
                      key={index}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                  <span className="text-lg font-bold text-gray-800 ml-2">4.5</span>
                </div>
                <div className="ml-2 pl-2 border-l border-gray-300">
                  <span className="text-sm text-blue-600 font-medium">165+ reviews</span>
                </div>
              </div>


            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Photos and Facilities */}
          <div className="lg:col-span-2">
            {/* Photo Gallery Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Gallery</h2>
              </div>
              <div className="p-2">
                <ImageSlider />
              </div>
            </div>

            {/* Facilities Card - Uncomment when needed */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Amenities & Facilities</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="text-gray-500">Loading facilities...</span>
                  </div>
                ) : facilities ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Free WiFi', available: facilities.wifi_available },
                      { name: 'Free Parking', available: facilities.parking_available },
                      { name: 'Room Service', available: facilities.room_service_available },
                      { name: 'AC', available: facilities.ac_available },
                      { name: 'Restaurant', available: facilities.restaurant_available },
                      { name: 'Laundry', available: facilities.laundry_available },
                    ].map((facility, index) => (
                      facility.available ? (
                        <div key={index} className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 text-ezzstay-base mr-2"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{facility.name}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No facility information available</div>
                )}
              </div>
            </div>

            {/* Hotel Description Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">About This Property</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 leading-relaxed">
                  {facilities?.additional_information ?
                    facilities.additional_information :
                    `Experience luxury and comfort at ${hotel.p_name}, ideally located in ${hotel.city}. 
        Our hotel offers premium amenities and exceptional service to make your stay memorable. 
        Whether you're traveling for business or leisure, our dedicated staff is committed to 
        ensuring your comfort and satisfaction throughout your stay.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-8">
              <div className="p-4 border-b border-gray-100 bg-blue-50">
                <h2 className="text-xl font-bold text-gray-800">Book Your Stay</h2>
                <p className="text-sm text-gray-500 mt-1">Best price guaranteed</p>
              </div>
              <div className="p-4">
                <EditableBookingDetails />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHotelDetails;