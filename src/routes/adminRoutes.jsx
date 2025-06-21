import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";

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
// import BedConfig from "../components/bedConfig/BedConfig";
import PartnerApproval from "../components/partnerApproval/PartnerApproval";
import PartnerRoutes from "./partnerRoutes";
import UserApproval from "../components/userApproval/UserApproval";
// import BedConfig from "../components/bedConfig/BedConfig";

// import BedConfig from "../components/bedconfig/BedConfig";



const AdminRoutes = () => (
    <Routes>
      {/* <Route path="/loginwithotp" Component={LoginWithOTP} /> */}
      {/* <Route path="/loginwithpassword" Component={LoginWithPassword} /> */}
      {/* <Route path="/register" Component={Register} /> */}
      {/* <Route path="/template" Component={Template} /> */}
      {/* <Route path="/partnerregister" Component={PartnerRegistration} /> */}
      {/* <Route path="/loginwithpassword" Component={MainDashboard} /> */}
      {/* <Route path="/propertyconfiguration" Component={PropertyConfiguration} />
      <Route path="/partnerregister" Component={PartnerRegister} />
      <Route path="/maindashboard" Component={MainDashboard} />
      <Route path="/mastertable" Component={masterTable} />
      <Route path="/general-pricing" Component={GeneralPricing} />
      <Route path="/bed-configuration" Component={BedConfig} /> */}
      <Route path="/*" element={<PartnerRoutes />} />
      <Route path="/partner-approval" Component={PartnerApproval} />
      <Route path= "/user-approval" Component={UserApproval} />
    </Routes>
  );

  export default AdminRoutes;




// import React from "react";
// import { Routes, Route, BrowserRouter } from "react-router-dom";
// import { useUser } from "../components/userContext/userContext";
// import { canAccess } from "../components/permissions/Permissions";

// import { LoginWithOTP } from "../components/loginWithOtp/LoginWithOTP";
// // import { LoginWithPassword } from "../components/loginWithPassword/LoginWithPassword";
// // import { Register } from "../components/register/Register";
// import Template from "../components/template/Template";
// // import PartnerRegistration from "../components/partnerregister/PartnerRegister";
// import PropertyConfiguration from "../components/propertyconfiguration/PropertyConfiguration";
// import PartnerRegister from "../components/partnerregister/PartnerRegister"
// import MainDashboard from "../components/maindashboard/MainDashboard"
// import masterTable from "../components/mastertable/mastertable";
// import GeneralPricing from "../components/generalPricing/GeneralPricing";



// // const UserRoutes = () => {
// //     const { user } = useUser();

// //     // Check permission using the "pxSide" key
// //     if (!canAccess(user?.role, "adminRoutes")) {
// //         return (
// //             <div style={{ padding: "2rem", textAlign: "center" }}>
// //                 <h2>Access Denied</h2>
// //                 <p>
// //                     You are logged in as <strong>{user?.role}</strong> and cannot access partner routes.
// //                     <br />
// //                     Please log in as a partner to view this content.
// //                 </p>
// //             </div>
// //         );
// //     }

// //     return (
// //         <Routes>
// //             <Route path="/loginwithotp" Component={LoginWithOTP} />
// //             {/* <Route path="/loginwithpassword" Component={LoginWithPassword} /> */}
// //             {/* <Route path="/register" Component={Register} /> */}
// //             <Route path="/template" Component={Template} />
// //             {/* <Route path="/partnerregister" Component={PartnerRegistration} /> */}
// //             {/* <Route path="/loginwithpassword" Component={MainDashboard} /> */}
// //             <Route path="/propertyconfiguration" Component={PropertyConfiguration} />
// //             <Route path="/partnerregister" Component={PartnerRegister} />
// //             <Route path="/maindashboard" Component={MainDashboard} />
// //             <Route path="/mastertable" Component={masterTable} />
// //             <Route path="/general-pricing" Component={GeneralPricing} />

// //         </Routes>
// //     );
// // };

// // export default UserRoutes;
