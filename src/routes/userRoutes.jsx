import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// px_side
import HomePage from "../Pages/PX_side/HomePage";
import ShowHotel from "../Pages/PX_side/ShowHotel";
import BedSelection from "../Pages/PX_side/BedSelection";
import MainHotelDetails from "../Pages/PX_side/MainHotelDetails";
import { LoginWithPassword } from "../components/loginWithPassword/LoginWithPassword";
import { Register } from "../components/register/Register";
import '@fortawesome/fontawesome-free/css/all.min.css';
import UserBooking from "../components/userBooking.jsx/UserBooking";
// import Navbar from "../components/PX_side/Navbar/Navbar";


const UserRoutes = () => (
    
    <Routes>
      {/* PX side */}
      <Route path="/" Component={HomePage} />
              <Route path="/loginwithpassword" Component={LoginWithPassword} />
              <Route path="/register" Component={Register} />
      {/* <Route path="/" Component={HomePage} /> */}
      <Route path="/showhotels" element={<ShowHotel />} />
      <Route path="/hotelDetails" element={<MainHotelDetails />}/>
      <Route path="/floor-selection" element={<BedSelection />}/>
      <Route path="/user-booking" element={<UserBooking />}/>
      {/* <Route path="/navbar" element={<Navbar/>}/> */}

    </Routes>
  );
  
  export default UserRoutes;


// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import { useUser } from "../components/userContext/userContext";
// import { canAccess } from "../components/permissions/Permissions";

// // PX_side Pages
// import HomePage from "../Pages/PX_side/HomePage";
// import ShowHotel from "../Pages/PX_side/ShowHotel";
// import BedSelection from "../Pages/PX_side/BedSelection";
// import MainHotelDetails from "../Pages/PX_side/MainHotelDetails";
// import '@fortawesome/fontawesome-free/css/all.min.css';

// const UserRoutes = () => {
//   const { user } = useUser();

//   // Check permission using the "pxSide" key
//   if (!canAccess(user?.role, "userRoutes")) {
//     return (
//       <div style={{ padding: "2rem", textAlign: "center" }}>
//         <h2>Access Denied</h2>
//         <p>
//           You are logged in as <strong>{user?.role}</strong> and cannot access user routes.
//           <br />
//           Please log in as a regular user to view this content.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       <Route path="/" Component={HomePage} />
//       <Route path="/showhotels" element={<ShowHotel />} />
//       <Route path="/hotelDetails" element={<MainHotelDetails />} />
//       <Route path="/floor-selection" element={<BedSelection />} />
//     </Routes>
//   );
// };

// export default UserRoutes;
