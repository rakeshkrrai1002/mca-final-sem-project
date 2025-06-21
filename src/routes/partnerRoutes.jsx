import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";

import { LoginWithOTP } from "../components/loginWithOtp/LoginWithOTP";
// import { LoginWithPassword } from "../components/loginWithPassword/LoginWithPassword";
// import { Register } from "../components/register/Register";
import Template from "../components/template/Template";
// import PartnerRegistration from "../components/partnerregister/PartnerRegister";
import PropertyConfiguration from "../components/propertyconfiguration/PropertyConfiguration";
import PartnerRegister from "../components/partnerregister/PartnerRegister"
import MainDashboard from "../components/maindashboard/MainDashboard"
import masterTable from "../components/mastertable/mastertable";
import GeneralPricing from "../components/generalPricing/GeneralPricing";
import BedConfig from "../components/bedConfig/BedConfig";
import PartnerStatistic from "../components/partnerStatistic/PartnerStatistic";
import DomStatistic from "../components/domStatistic/DomStatistic";
import PartnershipAgreement from "../components/partnershipAgreement/PartnershipAgreement";
import DomsLogsCorrection from "../components/domLogsCorrection/DomsLogsCorrection"
import RoomConfig from "../components/roomConfig/RoomConfig";
import BookingDetails from "../components/bookingDetails/BookingDetails";
import BookingTimes from "../components/bookinTimes/BookingTimes";
import UserRoutes from "./userRoutes";
import FacilitiesAmenities from "../components/facilities/Facilities";
// import PartnerApproval from "../components/partnerApproval/PartnerApproval";
// import BedConfig from "../components/bedConfig/BedConfig";

// import BedConfig from "../components/bedconfig/BedConfig";



const PartnerRoutes = () => (
    <Routes>
      <Route path="/loginwithotp" Component={LoginWithOTP} />
      {/* <Route path="/loginwithpassword" Component={LoginWithPassword} /> */}
      {/* <Route path="/register" Component={Register} /> */}
      <Route path="/template" Component={Template} />
      {/* <Route path="/partnerregister" Component={PartnerRegistration} /> */}
      {/* <Route path="/loginwithpassword" Component={MainDashboard} /> */}
      <Route path="/propertyconfiguration" Component={PropertyConfiguration} />
      <Route path="/partnerregister" Component={PartnerRegister} />
      <Route path="/maindashboard" Component={MainDashboard} />
      <Route path="/mastertable" Component={masterTable} />
      <Route path="/general-pricing" Component={GeneralPricing} />
      <Route path="/bed-configuration" Component={BedConfig} />
      <Route path="/room-configuration" Component={RoomConfig} />
      <Route path="/booking-details" Component={BookingDetails} />
      <Route path= "/booking-times" Component={BookingTimes} />
      <Route path="/*" element={<UserRoutes />} />
      {/* <Route path="/partner-approval" Component={PartnerApproval} /> */}
      <Route path="/partner-statistics" Component={PartnerStatistic} />
      <Route path="/dom-statistics" Component={DomStatistic} />
      <Route path= "/partnership-agreement" Component={PartnershipAgreement} />
      <Route path= "/dom-logs-correction" Component={DomsLogsCorrection} />
      <Route path="/facilities-amenities" Component={FacilitiesAmenities} />
    </Routes>
  );

  export default PartnerRoutes;