import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
const hotelImages = [
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    alt: 'Luxury hotel room with ocean view'
  },
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd',
    alt: 'Modern hotel bathroom'
  },
  {
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
    alt: 'Hotel pool area'
  },
  {
    url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
    alt: 'Hotel restaurant'
  }
];

const ImageSlider = () => {
  return (
    <div className=" w-full">
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="w-full aspect-[16/9] md:aspect-[21/9]"
      >
        {hotelImages.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              <img
                src={`${image.url}?auto=format&fit=crop&w=1920&q=80`}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;