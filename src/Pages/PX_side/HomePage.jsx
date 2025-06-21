import React, { useRef } from 'react';
import SearchHotel from '../../components/PX_side/Hotel_Search/SearchHotel';

import { Clock, MapPin, Search, Star, Shield, Clock3, Timer, Coffee, Briefcase, Moon } from 'lucide-react';

const Home = () => {
  // Create a ref for the hero section
  const heroSectionRef = useRef(null);
  
  // Function to scroll to hero section
  const scrollToHero = () => {
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div ref={heroSectionRef} className="relative min-h-screen">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-purple-100/90"></div>
            <img 
              src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80" 
              alt="Luxury Hotel"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative z-10 max-w-screen-2xl md:max-w-[90rem] mx-auto px-4 h-screen flex flex-col justify-center items-center">
            <div className="space-y-4 md:space-y-6  translate-y-[-10%] text-center">
              {/* <div className="inline-flex items-center px-6 py-2 rounded-full bg-ezzstay-base/5 border border-ezzstay-base/10 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-ezzstay-base mr-2" />
                <span className="text-ezzstay-base">Book Luxury by the Hour</span>
              </div> */}
              
              <h1 className=" text-5xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-ezzstay-base leading-tight">
                Time is Luxury
              </h1>
              <p className="text-base md:text-xl text-gray-700 max-w-2xl mx-auto">
                Transform any hour into a luxurious escape. Premium hotels available exactly when you need them.
              </p>
            <SearchHotel />
            </div>
            
            {/* Search Bar */}
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-ezzstay-base">
              Perfect for Every Occasion
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <Briefcase className="w-6 h-6" />, title: "Business Meetings", desc: "Professional spaces for your meetings" },
                { icon: <Coffee className="w-6 h-6" />, title: "Day Break", desc: "Recharge between flights or meetings" },
                { icon: <Moon className="w-6 h-6" />, title: "Power Nap", desc: "Quick rest in premium comfort" },
                { icon: <Clock3 className="w-6 h-6" />, title: "Hourly Flexibility", desc: "Book only the time you need" }
              ].map((item, index) => (
                <div key={index} className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50 to-white p-6 border border-blue-100 hover:border-purple-300 transition-all shadow-lg hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-ezzstay-base flex items-center justify-center mb-4 text-white">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Hotels */}
        <div className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-ezzstay-base">
              Premium Hotels by the Hour
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80",
                  name: "The Metropolitan",
                  price: "75",
                  rating: 5,
                  location: "Downtown"
                },
                {
                  image: "https://images.unsplash.com/photo-1455587734955-081b22074882",
                  name: "Skyline Retreat",
                  price: "95",
                  rating: 5,
                  location: "City Center"
                },
                {
                  image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80",
                  name: "Harbor View",
                  price: "85",
                  rating: 5,
                  location: "Waterfront"
                }
              ].map((hotel, index) => (
                <div key={index} className="group bg-white rounded-2xl overflow-hidden border border-blue-100 hover:border-purple-300 transition-all shadow-xl hover:shadow-2xl">
                  <div className="relative">
                    <img 
                      src={hotel.image} 
                      alt={hotel.name}
                      className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-ezzstay-base text-white font-semibold shadow-lg">
                      ₹{hotel.price}/hr
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{hotel.name}</h3>
                      <div className="flex items-center text-yellow-500">
                        {Array(hotel.rating).fill(null).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {hotel.location}
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-600 to-ezzstay-base hover:from-blue-700 hover:to-purple-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-24 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-90"></div>
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&q=80" 
              alt="Luxury"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 mb-8">
              Time is Precious. Spend it Well.
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join the revolution in luxury hotel bookings. Pay by the hour, enjoy premium comfort.
            </p>
            <button 
              onClick={scrollToHero} 
              className="bg-gradient-to-r from-purple-600 to-ezzstay-base hover:from-blue-700 hover:to-purple-600 text-white px-12 py-5 rounded-full text-lg font-bold transition-all shadow-xl hover:shadow-2xl">
              Start Booking Now
            </button>
          </div>
        </div>
        
        {/* Footer Section */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-ezzstay-base">EEZSTAY</h3>
                <p className="text-gray-400 mb-4">Transform any hour into a luxurious escape. Premium hotels available exactly when you need them.</p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Search Hotels</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Support</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400">© 2025 EEZSTAY. All rights reserved.</p>
                <p className="text-gray-400 mt-2 md:mt-0">
                  Website by <a href="https://vedaion.tech/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-white transition-colors">Vedaion Technologies</a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;