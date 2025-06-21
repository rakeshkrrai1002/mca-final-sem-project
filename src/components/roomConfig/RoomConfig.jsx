import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";
import { use } from "react";

const RoomConfig = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState([]);
  const api = "127.0.0.1:8000";
  //   const api = "127.0.0.1:8000";
  const [propertyList, setPropertyList] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [floors, setFloors] = useState([]);
  const [existingRooms, setExistingRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      console.log(user);
      const fetchData = async () => {
        try {
          // Fetch user role
          const roleResponse = await fetch(
            `http://${api}/getUserRole/${user.mobile}`
          );
          const roleData = await roleResponse.json();
          console.log("Role Data:", roleData);
          setUserRole(roleData.role);

          console.log("Role Data before access check:", roleData.role);
          console.log(
            "Can access adminDetails?",
            canAccess(roleData.role, "adminDetails")
          );

          // Ensure we use the updated roleData instead of userRole (since state updates are async)
          if (canAccess(roleData.role, "partnerPropertyList")) {
            const response = await fetch(
              `http://${api}/fetchProperty/${user.mobile}`
            );
            const data = await response.json();
            console.log("property Data:", data);
            setPropertyList(data);
          } else if (canAccess(roleData.role, "allPropertyList")) {
            const response = await fetch(`http://${api}/fetchAllProperty`);
            const data = await response.json();
            setPropertyList(data);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchData();
    }
  }, [user]);

  const handlePropertySelectChange = (e) => {
    const selected = propertyList.find(
      (property) => property.p_id === parseInt(e.target.value, 10)
    );
    setSelectedProperty(selected); // Store the full property object

    // Reset state before fetching new data
    setFloors([]);
  };

  const handleFloorSelectChange = (e) => {
    const selected = floors.find(
      (floor) => floor.floor_id === parseInt(e.target.value, 10)
    );
    setSelectedFloor(selected); // Store the full floor object
  };

  // Fetch floors when the selected property changes
  useEffect(() => {
    if (selectedProperty?.p_id) {
      const fetchFloorsData = async () => {
        try {
          const response = await fetch(
            `http://${api}/get_floor/${selectedProperty.p_id}`
          );
          if (!response.ok) throw new Error("Failed to fetch floors");

          const data = await response.json();
          setFloors(data); // This populates the floors array (as before)
        } catch (error) {
          console.error("Error fetching floors:", error);
        }
      };

      fetchFloorsData();
    }
  }, [selectedProperty?.p_id]);

  useEffect(() => {
    const fetchRoomsData = async () => {
      try {
        const response = await fetch(
          `http://${api}/get_rooms/${selectedFloor.floor_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch rooms");

        const data = await response.json();
        setExistingRooms(data); // This populates the existingRooms array
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRoomsData();
  }, [selectedFloor?.floor_id]);

  const mapRoomTypeToId = (typeName) => {
    const mapping = {
      private: 1,
      dormitory: 2,
      "suite room": 3,
    };
    return mapping[typeName.trim().toLowerCase()] || null;
  };

  // Function to add a new room entry
  const handleAddRoom = () => {
    setRooms([...rooms, { name: "", capacity: "", type: "", price: "" }]);
  };

  // Function to handle changes in individual room fields
  const handleRoomChange = (e, index) => {
    const { name, value } = e.target;
    // Assuming the input name follows the format "rooms[index].fieldName"
    const field = name.split(".").pop();

    // Create a new copy of rooms and update the relevant field
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setRooms(updatedRooms);
  };

  const handleSave = async () => {
    try {
      // Insert new rooms (if any exist in the "rooms" state array)
      if (rooms.length > 0) {
        const insertResponse = await fetch("/insert_rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rooms),
        });
        const insertData = await insertResponse.json();
        console.log("Insert response:", insertData);
      }

      // Update existing rooms using their floor_id as identifier
      for (let i = 0; i < existingRooms.length; i++) {
        const room = existingRooms[i];
        // Map the room type name (from dropdown) to room_type_id
        const roomTypeId = mapRoomTypeToId(room.type);

        const updateResponse = await fetch(`/update_rooms/${room.floor_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_name: room.name,
            room_type_id: roomTypeId,
            room_capacity: room.capacity,
            price: room.price,
          }),
        });
        const updateData = await updateResponse.json();
        console.log("Update response:", updateData);
      }

      // Optionally, refetch or update your state to reflect the latest room data,
      // ensuring that the dropdowns display the correct values.
    } catch (error) {
      console.error("Error saving room data:", error);
    }
  };

  return (
    <div className="flex">
      <Side />
      <div className="max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Room Configuration
          </h2>
          {user && (
            <span className="text-gray-700">
              User: <strong>{user.mobile}</strong>
            </span>
          )}
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="mb-4">
            <label className="block text-base font-medium text-gray-800">
              Property Name:
              <select
                name="p_name"
                onChange={handlePropertySelectChange}
                required
                disabled={loading}
                className="w-full mt-2 p-3 border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
              >
                <option value="">Select a property</option>
                {propertyList.map((property) => (
                  <option key={property.p_id} value={property.p_id}>
                    {property.p_name}
                  </option>
                ))}
              </select>
              {errors.propertyName && (
                <span className="text-red-600 text-sm">
                  {errors.propertyName}
                </span>
              )}
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-base font-medium text-gray-800">
              Floor Name:
              <select
                name="floor_name"
                onChange={handleFloorSelectChange}
                required
                disabled={loading}
                className="w-full mt-2 p-3 border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
              >
                <option value="">Select Floor</option>
                {floors.map((floor) => (
                  <option key={floor.floor_id} value={floor.floor_id}>
                    {floor.floor_name}
                  </option>
                ))}
              </select>
              {errors.floorName && (
                <span className="text-red-600 text-sm">{errors.floorName}</span>
              )}
            </label>
          </div>
          {existingRooms.map((room, index) => (
            <div
              key={index}
              className="mb-6 p-6 border border-gray-300 rounded-lg bg-white"
            >
              <h4 className="mb-4 text-xl font-semibold text-gray-900">
                Room {index + 1}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <label className="block text-base font-medium text-gray-800">
                  Room Name
                  <input
                    type="text"
                    name={`rooms[${index}].name`}
                    value={room.name}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Capacity
                  <input
                    type="number"
                    name={`rooms[${index}].capacity`}
                    value={room.capacity}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Room Type
                  <select
                    name={`rooms[${index}].type`}
                    value={room.type}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  >
                    <option value="">Select Room Type</option>
                    <option value="private">Private</option>
                    <option value="dormitory">Dormitory</option>
                    <option value="suite">Suite Room</option>
                  </select>
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Price
                  <input
                    type="number"
                    name={`rooms[${index}].price`}
                    value={room.price}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
              </div>
            </div>
          ))}
          {rooms.map((room, index) => (
            <div
              key={index}
              className="mb-6 p-6 border border-gray-300 rounded-lg bg-white"
            >
              <h4 className="mb-4 text-xl font-semibold text-gray-900">
                Room {index + 1}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <label className="block text-base font-medium text-gray-800">
                  Room Name
                  <input
                    type="text"
                    name={`rooms[${index}].name`}
                    value={room.name}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Capacity
                  <input
                    type="number"
                    name={`rooms[${index}].capacity`}
                    value={room.capacity}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Room Type
                  <select
                    name={`rooms[${index}].type`}
                    value={room.type}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  >
                    <option value="">Select Room Type</option>
                    <option value="private">Private</option>
                    <option value="dormitory">Dormitory</option>
                    <option value="suite">Suite Room</option>
                  </select>
                </label>
                <label className="block text-base font-medium text-gray-800">
                  Price
                  <input
                    type="number"
                    name={`rooms[${index}].price`}
                    value={room.price}
                    onChange={(e) => handleRoomChange(e, index)}
                    className="mt-2 p-3 block w-full border border-gray-400 rounded-md shadow focus:border-blue-600 focus:ring-blue-600"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddRoom}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md w-auto mx-auto block"
        >
          Add Rooms
        </button>
        <button
          onClick={handleSave}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md w-auto mx-auto block"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default RoomConfig;
