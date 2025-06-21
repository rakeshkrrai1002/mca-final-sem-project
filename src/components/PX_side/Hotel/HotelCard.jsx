import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaBed, FaStar, FaStarHalf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const HotelCard = ({ hotel }) => {
  const navigate = useNavigate();
  const [minPricePerHour, setMinPricePerHour] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigation = () => {
    navigate("/hotelDetails", { state: { hotel } });
  };

  // Function to get pre-signed URL
  const getPresignedUrl = async (objectKey) => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/presigned_url", {
        params: { object_key: objectKey },
      });

      if (response.data && response.data.presigned_url) {
        return response.data.presigned_url;
      } else {
        console.error("No presigned URL found in response:", response.data);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch pre-signed URL:", error);
      return null;
    }
  };

  // Fetch pricing details
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setIsLoading(true);
        // Fetch general pricing data
        const generalPricingResponse = await fetch(
          `http://127.0.0.1:8000/get_general_pricing/${hotel.p_id}`
        );
        const generalPricingData = await generalPricingResponse.json();

        // Initialize minRate to 0
        let minRate = 0;

        // Get minimum from general pricing if available
        if (
          Array.isArray(generalPricingData) &&
          generalPricingData.length > 0
        ) {
          const rates = generalPricingData
            .map((item) => item.rate)
            .filter((rate) => rate > 0);
          if (rates.length > 0) {
            minRate = Math.min(...rates);
          }
        }

        // Fetch property beds data
        const propertyBedsResponse = await fetch(
          `http://127.0.0.1:8000/get_property_beds/${hotel.p_id}`
        );
        const propertyBedsData = await propertyBedsResponse.json();

        let minRoomPrice = null;

        if (Array.isArray(propertyBedsData) && propertyBedsData.length > 0) {
          // Filter out 0 and null room_price_per_hour values
          const validPrices = propertyBedsData
            .map((item) => item.room_price_per_hour)
            .filter((price) => price !== 0 && price !== null && price > 0);

          if (validPrices.length > 0) {
            minRoomPrice = Math.min(...validPrices);

            // Set minRate to minRoomPrice if minRoomPrice is less than minRate or if minRate is 0
            if (minRate === 0 || minRoomPrice < minRate) {
              minRate = minRoomPrice;
            }
          }
        }

        // Ensure we don't end up with a 0 rate if we had any valid prices
        if (minRate === 0 && minRoomPrice > 0) {
          minRate = minRoomPrice;
        }

        // Set the final minimum price
        setMinPricePerHour(minRate);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [hotel.p_id]);

  // Fetch pre-signed URL for the image
  useEffect(() => {
    const fetchImageUrl = async () => {
      const imageName =
        hotel.image_urls ||
        hotel.image_urls?.[0] ||
        "prop-hotel-img/hotel images/default_image.jpeg";

      if (!imageName) {
        console.error("No image name found in hotel object");
        setImageError(true);
        return;
      }

      const imageKey = `${imageName}`;

      if (imageKey) {
        try {
          const url = await getPresignedUrl(imageKey);

          if (url) {
            setImageUrl(url);
            setImageError(false);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error("Error fetching image URL:", error);
          setImageError(true);
        }
      } else {
        setImageError(true);
      }
    };

    fetchImageUrl();
  }, [hotel]);

  // Generate stars based on rating
  // const renderStars = (rating) => {
  //   const fullStars = Math.floor(rating);
  //   const hasHalfStar = rating % 1 >= 0.5;

  //   return (
  //     <div className="flex text-yellow-500">
  //       {[...Array(fullStars)].map((_, i) => (
  //         <FaStar key={`full-${i}`} className="w-4 h-4" />
  //       ))}
  //       {hasHalfStar && <FaStarHalf className="w-4 h-4" />}
  //       {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
  //         <FaStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
  //       ))}
  //     </div>
  //   );
  // };

  return (
    <div
      onClick={handleNavigation}
      className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 bg-white cursor-pointer transform hover:scale-[1.02] transition-transform"
    >
      {/* Image Section with gradient overlay */}
      <div className="relative h-48 w-full bg-gray-200">
        {imageUrl && !imageError ? (
          <>
            <img
              src={imageUrl}
              alt={hotel.p_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
            {imageError ? "Image not available" : "Loading image..."}
          </div>
        )}

        {/* Location badge - overlay on image */}
        <div className="absolute top-3 left-3 flex items-center space-x-1 bg-white/90 text-ezzstay-base px-2 py-1 rounded-full text-sm font-medium shadow-md">
          <FaMapMarkerAlt size={14} />
          <span>{hotel.distance}</span>
        </div>

        {/* Rooms available badge - overlay on image */}
        <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 text-ezzstay-base px-2 py-1 rounded-full text-sm font-medium shadow-md">
          <FaBed size={14} />
          <span>{hotel.rooms_available} Rooms</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 space-y-3">
        {/* Hotel Name with Rating */}
        <div className="flex flex-col space-y-1">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
            {hotel.p_name}
          </h3>

          {/* Ratings and Reviews */}
          {/* <div className="flex items-center space-x-2">
            {renderStars(hotel.rating || 4.5)}
            <span className="text-sm text-gray-600">12+ reviews</span>
          </div> */}
        </div>

        {/* Price Section with Call-to-Action */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="space-y-0">
            {isLoading ? (
              <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : minPricePerHour > 0 ? (
              <>
                <p className="text-xs text-gray-500">Starting at</p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-ezzstay-base">
                    ₹{minPricePerHour}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">/hr</span>
                  {(hotel.apply_gst === 1 ||
                    hotel.apply_service_tax === 1 ||
                    hotel.apply_other_tax === 1) && (
                    <span className="text-xs text-gray-500 ml-1">+ taxes</span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Price unavailable</p>
            )}
          </div>

          <button
            className="bg-ezzstay-base text-white px-4 py-2 rounded-lg font-medium hover:bg-ezzstay-dark transition-colors"
            onClick={handleNavigation}
            >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
