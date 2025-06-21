import React, { useEffect, useState } from "react";
import Side from "../sidebar/sidebar";
import { useUser } from "../userContext/userContext";
import {
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

export function UserApproval() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (mobile, newStatus) => {
    try {
      const role_id = newStatus === 3 ? 3 : 4;
      const response = await fetch(
        `http://127.0.0.1:8000/update_user_status/${mobile}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update status");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.mobile === mobile ? { ...user, role_id } : user
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.message || "Failed to update user status.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex h-screen">
      <Side />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="p-6 pb-0 bg-white sticky top-0 z-10">
          <Typography variant="h4" className="font-bold mb-4">
            User Role Approval
          </Typography>
          
          {/* Table Header - Fixed */}
          <div className="pr-4"> {/* Adjust padding to match scrollbar */}
            <TableContainer component={Paper} className="shadow-lg">
              <Table>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="font-bold">Mobile Number</TableCell>
                    <TableCell className="font-bold">Current Type</TableCell>
                    <TableCell className="font-bold">Change Type</TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <TableContainer component={Paper} className="shadow-lg rounded-b-lg">
            <Table>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.mobile}>
                      <TableCell>{user.mobile}</TableCell>
                      <TableCell>
                        {user.role_id === 3 ? "Customer" : "Partner"}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={user.role_id === 3 ? "Customer" : "Partner"}
                            onChange={(e) =>
                              handleStatusChange(user.mobile, e.target.value)
                            }
                          >
                            <MenuItem value="Customer">Customer</MenuItem>
                            <MenuItem value="Partner">Partner</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}

export default UserApproval;