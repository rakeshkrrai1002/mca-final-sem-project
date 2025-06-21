import React, { useState, useEffect } from "react";
import { useUser } from "../userContext/userContext";
import { canAccess } from "../permissions/Permissions";
import AdminMainDashboard from "./AdminMainDashboard";
import PartnerMainDashboard from "./PartnerMainDashboard";

export const MainDashboard = () => {
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

  return (
    <>
      {canAccess(userRole, "adminRoutes") ? (
        <AdminMainDashboard />
      ) : (
        <PartnerMainDashboard />
      )}
    </>
  );
};

export default MainDashboard;
