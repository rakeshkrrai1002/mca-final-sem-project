// import React from "react";
// import { Routes, Route, BrowserRouter } from "react-router-dom";

// import { LoginWithOTP } from "../components/loginWithOtp/LoginWithOTP";
// import { LoginWithPassword } from "../components/loginWithPassword/LoginWithPassword";
// import { Register } from "../components/register/Register";
// import Template from "../components/template/Template";
// import PartnerRegistration from "../components/partnerregister/PartnerRegister";
// import PropertyConfiguration from "../components/propertyconfiguration/PropertyConfiguration";
// import PartnerRegister from "../components/partnerregister/PartnerRegister"
// import MainDashboard from "../components/maindashboard/MainDashboard"
// import masterTable from "../components/mastertable/mastertable";
// import GeneralPricing from "../components/generalPricing/GeneralPricing";

// // px_side
// import HomePage from "../Pages/PX_side/HomePage";
// import ShowHotel from "../Pages/PX_side/ShowHotel";
// import BedSelection from "../Pages/PX_side/BedSelection";
// import MainHotelDetails from "../Pages/PX_side/MainHotelDetails";
// import '@fortawesome/fontawesome-free/css/all.min.css';
// // import Navbar from "../components/PX_side/Navbar/Navbar";

// const AppRoutes = () => {
//   return (
//     // <BrowserRouter>
//     <Routes>
//       {/* PX side */}
//       <Route path="/" Component={HomePage} />
//       <Route path="/showhotels" element={<ShowHotel />} />
//       <Route path="/hotelDetails" element={<MainHotelDetails />}/>
//       <Route path="/floor-selection" element={<BedSelection />}/>
//       {/* <Route path="/navbar" element={<Navbar/>}/> */}

//       {/* tumlogoka */}
//       <Route path="/loginwithotp" Component={LoginWithOTP} />
//       <Route path="/loginwithpassword" Component={LoginWithPassword} />
//       <Route path="/register" Component={Register} />
//       <Route path="/template" Component={Template} />
//       {/* <Route path="/partnerregister" Component={PartnerRegistration} /> */}
//       {/* <Route path="/loginwithpassword" Component={MainDashboard} /> */}
//       <Route path="/propertyconfiguration" Component={PropertyConfiguration} />
//       <Route path="/partnerregister" Component={PartnerRegister} />
//       <Route path="/maindashboard" Component={MainDashboard} />
//       <Route path="/mastertable" Component={masterTable} />
//       <Route path="/general-pricing" Component={GeneralPricing} />

//     </Routes>
//     // </BrowserRouter>
//   );
// };

// export default AppRoutes;

// AppRoutes.js
import React from "react";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "../components/userContext/userContext";
import AdminRoutes from "./adminRoutes";
import PartnerRoutes from "./partnerRoutes";
import UserRoutes from "./userRoutes";
import { LoginWithPassword } from "../components/loginWithPassword/LoginWithPassword";
import { Register } from "../components/register/Register";

import { canAccess } from "../components/permissions/Permissions";
// import HomePage from "../Pages/PX_side/HomePage";

const AppRoutes = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  useEffect(() => {
    if (user) {
      console.log(user);
      const fetchData = async () => {
        try {
          // Fetch user role
          const roleResponse = await fetch(
            `http://127.0.0.1:8000/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          console.log("Role Data:", roleData);
          setUserRole(roleData.role);

          console.log("Role Data before access check:", roleData.role);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchData();
    }
  }, [user]);

  if (!user || userRole === "customer") {
    // If not logged in, always redirect to login.
    return (
      <>
        <Routes>
          {/* <Route path="*" element={<Navigate to="/loginwithpassword" />} /> */}

          <Route path="/*" element={<UserRoutes />} />
        </Routes>
      </>
    );
  } else if (!user || userRole === "partner") {
    // If not logged in, always redirect to login.
    return (
      <Routes>
        {/* <Route path="/" Component={HomePage} /> */}
        <Route path="/loginwithpassword" Component={LoginWithPassword} />
        <Route path="/register" Component={Register} />
        {/* <Route path="/*" element={<UserRoutes />} /> */}
        {canAccess(userRole, "partnerRoutes") && (
          <Route path="/*" element={<PartnerRoutes />} />
        )}
      </Routes>
    );
  }
  return (
    <Routes>
      {/* <Route path="/" Component={HomePage} /> */}
      <Route path="/loginwithpassword" Component={LoginWithPassword} />
      <Route path="/register" Component={Register} />
      {/* <Route path="/*" element={<UserRoutes />} /> */}

      {canAccess(userRole, "adminRoutes") && (
        <Route path="/*" element={<AdminRoutes />} />
      )}

      {/* {canAccess(userRole, "userRoutes") && (
        <Route path="/*" element={<UserRoutes />} />

      )} */}

      {/* {userRole === "admin" ? (
        <Route path="/*" element={<AdminRoutes />} />
      ) : (
        <Route path="/*" element={<UserRoutes />} />
      )} */}
    </Routes>
  );
};

export default AppRoutes;
