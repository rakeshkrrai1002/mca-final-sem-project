import React from "react";
import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import { useNavigate } from "react-router-dom";

const PartnershipAgreement = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4">
        <Side />
      </div>

      {/* Main Content */}
      <div className="w-full h-full p-8 flex justify-center items-center">
        <img
          src="https://wp101.com/wp-content/uploads/2023/12/how-to-create-a-coming-soon-page-in-wordpress.png"
          alt="Coming Soon"
          className="w-full h-full rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default PartnershipAgreement;
