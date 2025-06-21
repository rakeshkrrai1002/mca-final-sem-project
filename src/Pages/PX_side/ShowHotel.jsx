import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchHotel from "../../components/PX_side/Hotel_Search/SearchHotel";
import HotelCard from "../../components/PX_side/Hotel/HotelCard";

const ShowHotel = () => {
  const navigate = useNavigate();
  const [hotelsData, setHotelsData] = useState([]);
  const [searchFilters, setSearchFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const storedSearchData = sessionStorage.getItem("searchData");
  useEffect(() => {
    // const storedSearchData = sessionStorage.getItem("searchData");
    if (storedSearchData) {
      setSearchFilters(JSON.parse(storedSearchData));
    }

    const fetchHotels = async () => {
      try {
        const storedData = sessionStorage.getItem("searchData");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        const payload = {
          location: parsedData.location,
          date: parsedData.date,
          time: parsedData.time,
          hours: parsedData.hours,
          people: parsedData.people,
          stayType: parsedData.stayType,
          dayType: parsedData.dayType,
        };

        const response = await axios.post(
          "http://127.0.0.1:8000/search_properties",
          payload
        );
        setHotelsData(response.data);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [storedSearchData]);

  // const filteredHotels = useMemo(() => {
  //   if (!searchFilters.location) return hotelsData;

  //   // const searchLocation = searchFilters.location.toLowerCase();
  //   // return hotelsData.filter(hotel =>
  //   //   hotel.city.toLowerCase().includes(searchLocation)
  //   // );
  //   const searchLocation = searchFilters.location.toLowerCase();
  //   return hotelsData.filter(
  //     (hotel) => hotel.city.toLowerCase() === searchLocation
  //   );
  // }, [hotelsData, searchFilters.location]);

  const handleHotelClick = (hotel) => {
    const existingSearchData = sessionStorage.getItem("searchData");
    let updatedSearchData = existingSearchData
      ? JSON.parse(existingSearchData)
      : {};

    updatedSearchData = {
      ...updatedSearchData,
      selectedHotel: {
        id: hotel.p_id,
        name: hotel.p_name,
        city: hotel.city,
        numFloors: hotel.numFloors || 0,
        distance: hotel.distance || "",
        rating: hotel.rating || 0,
        reviews: hotel.reviews || "",
        pricePerHour: hotel.price_per_hr || 0,
        roomsAvailable: hotel.rooms_available || 0,
        image: hotel.prop_picture?.[0] || "",
      },
    };

    sessionStorage.setItem("searchData", JSON.stringify(updatedSearchData));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col  items-center">
          <div className="w-16 h-16 border-4  border-ezzstay-base border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700">
            Loading hotels...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <SearchHotel />

      <section className="p-3 mx-auto max-w-[88rem]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotelsData.map((hotel) => (
           <div
           key={hotel.p_id}
           onClick={() => {
             console.log("Hotel clicked:", hotel.p_name); // Add this
             handleHotelClick(hotel);
           }}
           className="cursor-pointer"
         >
              <HotelCard hotel={hotel} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ShowHotel;
