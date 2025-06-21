import React from "react";
import { BrowserRouter, Routes, Route, Router } from "react-router-dom";
// import HomePage from "./Pages/PX_side/HomePage";
import Navbar from "./components/PX_side/Navbar/Navbar";
// import ShowHotel from "./Pages/PX_side/ShowHotel";
// import MainHotelDetails from "./Pages/PX_side/MainHotelDetails";
// import BedSelection from "./Pages/PX_side/BedSelection";
// import "@fortawesome/fontawesome-free/css/all.min.css";
import AppRoutes from "./routes/AppRoutes";

import { UserProvider } from "./components/userContext/userContext";

import "./index.css";
import ProtectedRoute from "./protectedRoutes/ProtectedRoutes";
import { LoginWithPassword } from "./components/loginWithPassword/LoginWithPassword";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Navbar />
        {/* <div className="mt-20"></div> */}
        {/* <LoginWithPassword/> */}
        <div className="pt-14"></div>

        {/* <ProtectedRoute> */}
        <AppRoutes />
        {/* </ProtectedRoute> */}
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
