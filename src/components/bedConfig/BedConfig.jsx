import React, { useState, useEffect } from "react";
import Side from "../sidebar/sidebar";
import { canAccess } from "../permissions/Permissions";
import { useUser } from "../userContext/userContext";
import PapaParse from "papaparse";
import { FaDownload, FaUpload } from "react-icons/fa";

function BedConfig() {
  const { user } = useUser();

  const api = "127.0.0.1:8000";
  const [propertyList, setPropertyList] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [floors, setFloors] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bedDetails, setBedDetails] = useState([]);
  const [bedConfigs, setBedConfigs] = useState([]);

  const [rooms, setRooms] = useState({
    capacity_private_1_seater: 0,
    capacity_private_2_seater: 0,
    capacity_private_3_seater: 0,
    capacity_private_4_seater: 0,
    capacity_suite_room: 0,
    capacity_dormitory: 0,
  });

  const [userRole, setUserRole] = useState([]);

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
  console.log(errors);
  const handlePropertySelectChange = (e) => {
    const selected = propertyList.find(
      (property) => property.p_id === parseInt(e.target.value, 10)
    );
    setSelectedProperty(selected); // Store the full property object
  
    // Save selected property to localStorage
    if (selected) {
      localStorage.setItem("selectedProperty", JSON.stringify(selected));
    }
  
    // Reset state before fetching new data
    setFloors([]);
    setBedDetails([]);
    
    localStorage.removeItem("selectedFloor");
  };
  useEffect(() => {
    const storedProperty = localStorage.getItem("selectedProperty");
    if (storedProperty) {
      setSelectedProperty(JSON.parse(storedProperty));
    }
  }, []);
    

  const handleFloorSelectChange = (e) => {
    const selected = floors.find(
      (floor) => floor.floor_id === parseInt(e.target.value, 10)
    );
    setSelectedFloor(selected); // Store the full floor object
  
    // Save selected floor to localStorage
    if (selected) {
      localStorage.setItem("selectedFloor", JSON.stringify(selected));
    }
  
    // Reset state before fetching new data
    setRooms({
      capacity_private_1_seater: 0,
      capacity_private_2_seater: 0,
      capacity_private_3_seater: 0,
      capacity_private_4_seater: 0,
      capacity_suite_room: 0,
      capacity_dormitory: 0,
    });
    setBedDetails([]);
  };
  useEffect(() => {
    const storedFloor = localStorage.getItem("selectedFloor");
    if (storedFloor) {
      setSelectedFloor(JSON.parse(storedFloor));
    }
  }, []);
    

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

  // When a floor is selected, extract the bed configuration fields from that floor's record
  useEffect(() => {
    if (selectedFloor && floors && floors.length > 0) {
      // Find the corresponding floor object from the floors array
      const floorDetails = floors.find(
        (floor) => floor.floor_id === selectedFloor.floor_id
      );
      if (floorDetails) {
        const capacityFields = [
          "capacity_private_1_seater",
          "capacity_private_2_seater",
          "capacity_private_3_seater",
          "capacity_private_4_seater",
          "capacity_suite_room",
          "capacity_dormitory",
        ];

        // Create an object that only includes the fields required by your bed configuration form
        const filteredData = {};
        capacityFields.forEach((field) => {
          filteredData[field] =
            floorDetails[field] !== undefined ? floorDetails[field] : 0;
        });

        // Update the rooms state with the filtered capacity values
        setRooms(filteredData);
      }
    }
  }, [selectedFloor, floors]);

  const handleRoomChange = (roomType, value) => {
    setRooms((prev) => ({
      ...prev,
      [roomType]: parseInt(value, 10) || 0,
    }));

    console.log(rooms);
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch(`http://${api}/get_types`);
      if (!response.ok) {
        throw new Error("Failed to fetch types");
      }
      const types = await response.json();
      setTypes(types); // Store the fetched types in state
      return types; // Return the raw array of types
    } catch (error) {
      console.error("Error fetching types:", error);
      return []; // Return an empty array on error
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchBeds = async (floorId) => {
    try {
      const response = await fetch(`http://${api}/get_beds/${floorId}`);
      if (response.ok) {
        const beds = await response.json();
        setBedDetails(beds);
        return beds; // <== Added return statement
      } else {
        throw new Error("Failed to fetch beds");
      }
    } catch (error) {
      console.error("Error fetching beds:", error);
      return []; // <== Return an empty array on error
    }
  };

  useEffect(() => {
    if (selectedFloor?.floor_id) {
      fetchTypes();
      fetchBeds(selectedFloor.floor_id);
    }
  }, [selectedFloor]);

  const generateCSV = async () => {
    const floorId = selectedFloor?.floor_id;
    if (!floorId) {
      setErrors((prev) => ({ ...prev, floor: "Please select a floor." }));
      return;
    }
  
    try {
      const typesData = await fetchTypes(); // Wait for types to be fetched
      const typeMap = {};
      typesData.forEach((type) => {
        typeMap[type.type_id] = type.type_name;
      });
  
      const data = await fetchBeds(floorId);
      if (!Array.isArray(data) || data.length === 0) {
        generateNewCSV();
        return;
      }
  
      const mergedData = [...data];
  
      if (data.length > 0) {
        // PRIVATE ROOM VALIDATION - This part remains but no longer blocks downloads
        const privateRoomCounts = {
          "Private 1-Seater": 0,
          "Private 2-Seater": 0,
          "Private 3-Seater": 0,
          "Private 4-Seater": 0,
        };
  
        data.forEach((row) => {
          if (privateRoomCounts.hasOwnProperty(row.room_type)) {
            privateRoomCounts[row.room_type]++;
          }
        });
  
        const privateRoomLimits = {
          "Private 1-Seater": rooms.capacity_private_1_seater,
          "Private 2-Seater": rooms.capacity_private_2_seater,
          "Private 3-Seater": rooms.capacity_private_3_seater,
          "Private 4-Seater": rooms.capacity_private_4_seater,
        };
  
        // NON-PRIVATE ROOM VALIDATION - Count beds but don't validate against capacity for download
        const dormitoryBeds = [];
        const suiteBeds = [];
  
        // Keep track of unique room names as well (for room counting if needed)
        const dormitoryRooms = new Set();
        const suiteRooms = new Set();
  
        data.forEach((row) => {
          if (row.room_type.trim() === "Dormitory" && row.bed_no?.trim()) {
            dormitoryBeds.push({
              room_name: row.room_name.trim(),
              bed_no: row.bed_no.trim()
            });
            dormitoryRooms.add(row.room_name.trim());
          } else if (
            row.room_type.trim() === "Suite Room" &&
            row.bed_no?.trim()
          ) {
            suiteBeds.push({
              room_name: row.room_name.trim(),
              bed_no: row.bed_no.trim()
            });
            suiteRooms.add(row.room_name.trim());
          }
        });
  
  
        // Add missing dormitory beds
        let missingDorm = rooms.capacity_dormitory - dormitoryBeds.length;
        let dormCounter = 1;
        
        // Find the next available dormitory number
        while (dormitoryRooms.has(`Dormitory ${dormCounter}`)) {
          dormCounter++;
        }
        
        while (missingDorm > 0) {
          const newRoomName = `Dormitory ${dormCounter}`;
          const bedNo = `D-${dormCounter}-B1`;
          
          mergedData.push({
            room_name: newRoomName,
            bed_no: bedNo,
            room_type: "Dormitory",
            type_id: "",
            upper_or_lower: "lower",
            room_price_per_hour: 0,
          });
          
          dormitoryRooms.add(newRoomName);
          missingDorm--;
          dormCounter++;
          
          if (dormCounter > rooms.capacity_dormitory * 2) break; // Safety limit
        }
  
        // Add missing suite beds
        let missingSuite = rooms.capacity_suite_room - suiteBeds.length;
        let suiteCounter = 1;
        
        // Find the next available suite room number
        while (suiteRooms.has(`Suite Room ${suiteCounter}`)) {
          suiteCounter++;
        }
        
        while (missingSuite > 0) {
          const newRoomName = `Suite Room ${suiteCounter}`;
          const bedNo = `S-${suiteCounter}-B1`;
          
          mergedData.push({
            room_name: newRoomName,
            bed_no: bedNo,
            room_type: "Suite Room",
            type_id: "",
            upper_or_lower: "lower",
            room_price_per_hour: 0,
          });
          
          suiteRooms.add(newRoomName);
          missingSuite--;
          suiteCounter++;
          
          if (suiteCounter > rooms.capacity_suite_room * 2) break; // Safety limit
        }
  
        // Append missing rows for private rooms - This part remains unchanged
        Object.keys(privateRoomCounts).forEach((roomType) => {
          const seatsMatch = roomType.match(/\d+/);
          const seats = seatsMatch ? parseInt(seatsMatch[0], 10) : 1;
          const allowedCount = privateRoomLimits[roomType] * seats;
          const currentCount = privateRoomCounts[roomType];
          let missingRooms = allowedCount - currentCount;
          let roomCounter = 1;
          for (let i = 0; i < missingRooms; i++) {
            const roomId = `New-R-${roomCounter}`;
            const bedsPerRoom = seatsMatch ? parseInt(seatsMatch[0], 10) : 1;
            for (let bed = 1; bed <= bedsPerRoom; bed++) {
              mergedData.push({
                room_name: roomId,
                bed_no: `${roomId}-B${bed}`,
                room_type: roomType,
                type_id: "",
                upper_or_lower: "lower",
                room_price_per_hour: 0,
              });
            }
            roomCounter++;
          }
        });
      }
  
      const csvContent =
        `room_name,bed_no,room_type,"type_of_bed (normal/special/window)",upper_or_lower, room_price_per_hour\n` +
        mergedData
          .map(
            (row) =>
              `${row.room_name},${row.bed_no || ""},${row.room_type},${
                row.type_id ? typeMap[row.type_id] || "Unknown" : ""
              },${row.upper_or_lower},${row.room_price_per_hour || 0}`
          )
          .join("\n");
  
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "bed_config.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error fetching bed details:", error);
      setErrors((prev) => ({ ...prev, fetch: "Failed to fetch bed details." }));
      generateNewCSV();
    }
  };
  
  // The generateNewCSV function doesn't need changes as it doesn't have capacity validation blocks
  
  // The uploadCSV function should keep all its validation as it is
  
  const generateNewCSV = () => {
    let csvRows = [];
    let roomCounter = 1;
  
    const addRoomAndBeds = (roomType, count, bedsPerRoom) => {
      if (roomType === "Dormitory") {
        // For Dormitory, generate one bed per capacity unit with specific naming
        for (let i = 0; i < count; i++) {
          const roomId = `Dormitory ${i + 1}`;
          const bedId = `D-${i + 1}-B1`;
          csvRows.push(`${roomId},${bedId},${roomType},normal,lower,0`);
        }
      } else if (roomType === "Suite Room") {
        // For Suite Room, generate one bed per capacity unit with specific naming
        for (let i = 0; i < count; i++) {
          const roomId = `Suite Room ${i + 1}`;
          const bedId = `S-${i + 1}-B1`;
          csvRows.push(`${roomId},${bedId},${roomType},normal,lower,0`);
        }
      } else {
        // For private rooms, keep the original logic
        for (let i = 0; i < count; i++) {
          const roomId = `R-${roomCounter}`;
          for (let bed = 1; bed <= bedsPerRoom; bed++) {
            csvRows.push(`${roomId},${roomId}-B${bed},${roomType},normal,lower,0`);
          }
          roomCounter++;
        }
      }
    };
  
    // Generate rows based on user input
    if (rooms.capacity_private_1_seater) {
      addRoomAndBeds("Private 1-Seater", rooms.capacity_private_1_seater, 1);
    }
    if (rooms.capacity_private_2_seater) {
      addRoomAndBeds("Private 2-Seater", rooms.capacity_private_2_seater, 2);
    }
    if (rooms.capacity_private_3_seater) {
      addRoomAndBeds("Private 3-Seater", rooms.capacity_private_3_seater, 3);
    }
    if (rooms.capacity_private_4_seater) {
      addRoomAndBeds("Private 4-Seater", rooms.capacity_private_4_seater, 4);
    }
    if (rooms.capacity_suite_room) {
      addRoomAndBeds("Suite Room", rooms.capacity_suite_room, 1);
    }
    if (rooms.capacity_dormitory) {
      addRoomAndBeds("Dormitory", rooms.capacity_dormitory, 1);
    }
  
    const csvContent =
      `room_name,bed_no,room_type,"type_of_bed (normal/special/window)",upper_or_lower,room_price_per_hour\n` +
      csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "bed_config.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setErrors({ file: "Please upload a valid CSV file." });
      return;
    }

    PapaParse.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      // Add this to handle BOM
      transformHeader: (header) => header.replace(/\uFEFF/g, "").trim(),
      complete: (result) => {
        // Store the parsed CSV data (raw)
        setBedConfigs(result.data);
        // Clear any previous errors
        setErrors({});
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        setErrors({ file: "Error parsing CSV file. Please try again." });
      },
    });
  };
  const uploadCSV = async () => {
    if (!selectedFloor?.floor_id || bedConfigs.length === 0) {
      setErrors((prev) => ({
        ...prev,
        file: "Please select a floor and upload a valid CSV file.",
      }));
      return;
    }
  
    if (
      !window.confirm(
        "Existing data for this floor will be deleted and replaced with the new data and the Dormitory room prices would reset to 0 (You will need to re-publish the prices in General Pricing). Do you want to proceed?"
      )
    ) {
      return;
    }
  
    // Fetch types and create reverse mapping (type_name → type_id)
    let typesData;
    try {
      typesData = await fetchTypes();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        file: "Failed to fetch bed types. Please try again.",
      }));
      return;
    }
    const typeMap = {};
    typesData.forEach((type) => {
      typeMap[type.type_name.trim().toLowerCase()] = type.type_id;
    });
  
    // Remap CSV data to handle column name variations
    const remappedData = bedConfigs.map((row) => ({
      ...row,
      type_name: row["type_of_bed (normal/special/window)"] || row.type_name,
    }));
  
    // Configuration
    const requiredFields = ["room_name", "room_type", "type_name", "bed_no"];
    const validRoomTypes = [
      "Private 1-Seater",
      "Private 2-Seater",
      "Private 3-Seater",
      "Private 4-Seater",
      "Suite Room",
      "Dormitory",
    ];
    const privateRoomLimits = {
      "Private 1-Seater": rooms.capacity_private_1_seater,
      "Private 2-Seater": rooms.capacity_private_2_seater,
      "Private 3-Seater": rooms.capacity_private_3_seater,
      "Private 4-Seater": rooms.capacity_private_4_seater,
    };
  
    // Trackers for validation
    const dormitoryBeds = [];
    const suiteBeds = [];
    const privateRooms = {}; // { [roomType]: { [roomName]: bedCount } }
  
    const transformedData = [];
    const roomPriceTracker = {};
    
    for (let i = 0; i < remappedData.length; i++) {
      const row = remappedData[i];
  
      // Validate required fields
      for (const field of requiredFields) {
        if (!row[field]?.toString().trim()) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Missing ${field}.`,
          }));
          return;
        }
      }
  
      // Validate room_type
      const normalizedRoomType = row.room_type.trim();
      if (!validRoomTypes.includes(normalizedRoomType)) {
        setErrors((prev) => ({
          ...prev,
          file: `Row ${i + 1}: Invalid room_type "${row.room_type}".`,
        }));
        return;
      }
  
      // Validate type_name
      const normalizedTypeName = row.type_name.trim().toLowerCase();
      const typeId = typeMap[normalizedTypeName];
      if (!typeId) {
        setErrors((prev) => ({
          ...prev,
          file: `Row ${i + 1}: Invalid type "${row.type_name}".`,
        }));
        return;
      }
  
      // Validate upper_or_lower
      const upperLower = (row.upper_or_lower || "lower").trim().toLowerCase();
      if (upperLower !== "upper" && upperLower !== "lower") {
        setErrors((prev) => ({
          ...prev,
          file: `Row ${i + 1}: upper_or_lower must be "upper" or "lower".`,
        }));
        return;
      }
  
      // Private Room Validation
      if (privateRoomLimits.hasOwnProperty(normalizedRoomType)) {
        const seats = parseInt(normalizedRoomType.match(/\d+/)[0], 10) || 1;
        const roomName = row.room_name.trim();
  
        // Initialize trackers for this room type
        if (!privateRooms[normalizedRoomType]) {
          privateRooms[normalizedRoomType] = {};
        }
  
        // Track beds per room
        if (!privateRooms[normalizedRoomType][roomName]) {
          privateRooms[normalizedRoomType][roomName] = 0;
        }
        privateRooms[normalizedRoomType][roomName] += 1;
  
        // Check if room has too many beds
        if (privateRooms[normalizedRoomType][roomName] > seats) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Room "${roomName}" (${normalizedRoomType}) exceeds ${seats} beds.`,
          }));
          return;
        }
      }
  
      // Non-Private Room Validation - Track beds for dormitories and suites
      if (normalizedRoomType === "Dormitory") {
        dormitoryBeds.push({
          room_name: row.room_name.trim(),
          bed_no: row.bed_no.trim()
        });
        
        // Check if dormitory beds exceed capacity
        if (dormitoryBeds.length > rooms.capacity_dormitory) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Exceeds Dormitory bed capacity (max ${rooms.capacity_dormitory}).`,
          }));
          return;
        }
      }
  
      // For Suite Room
      if (normalizedRoomType === "Suite Room") {
        suiteBeds.push({
          room_name: row.room_name.trim(),
          bed_no: row.bed_no.trim()
        });
        
        // Check if suite beds exceed capacity
        if (suiteBeds.length > rooms.capacity_suite_room) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Exceeds Suite Room bed capacity (max ${rooms.capacity_suite_room}).`,
          }));
          return;
        }
      }
      
      let roomPricePerHour;
      if (normalizedRoomType === "Dormitory") {
        roomPricePerHour = 0; // Dormitory price is fixed at 0
      } else {
        roomPricePerHour = parseFloat(row.room_price_per_hour);
        if (isNaN(roomPricePerHour)) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Invalid room_price_per_hour value.`,
          }));
          return;
        }
      }
  
      // Validate consistent room_price_per_hour for the same room_name
      const roomName = row.room_name.trim();
      if (roomPriceTracker.hasOwnProperty(roomName)) {
        // Check if the price matches the previously stored price
        if (roomPriceTracker[roomName] !== roomPricePerHour) {
          setErrors((prev) => ({
            ...prev,
            file: `Row ${i + 1}: Room "${roomName}" has inconsistent room_price_per_hour.`,
          }));
          return;
        }
      } else {
        // Add the room_name and its price to the tracker
        roomPriceTracker[roomName] = roomPricePerHour;
      }
  
      // Add to transformed data
      transformedData.push({
        type_id: parseInt(typeId, 10),
        p_id: selectedProperty?.p_id,
        mobile_no: user.mobile,
        room_name: row.room_name.trim(),
        room_type: normalizedRoomType,
        bed_no: row.bed_no.trim(),
        upper_or_lower: upperLower,
        room_price_per_hour: roomPricePerHour || 0,
      });
    }
  
    // Post-Loop Validation for Private Rooms
    for (const [roomType, rooms] of Object.entries(privateRooms)) {
      const maxRooms = privateRoomLimits[roomType];
      const seats = parseInt(roomType.match(/\d+/)[0], 10) || 1;
  
      // Check room count
      const roomCount = Object.keys(rooms).length;
      if (roomCount > maxRooms) {
        setErrors((prev) => ({
          ...prev,
          file: `Too many ${roomType} rooms (max ${maxRooms}).`,
        }));
        return;
      }
  
      // Check each room has exactly `seats` beds
      for (const [roomName, bedCount] of Object.entries(rooms)) {
        if (bedCount !== seats) {
          setErrors((prev) => ({
            ...prev,
            file: `Room "${roomName}" (${roomType}) must have exactly ${seats} beds.`,
          }));
          return;
        }
      }
    }
  
    // Submit to backend
    setLoading(true);
    try {
      const response = await fetch(
        `http://${api}/insert_bed_config/${selectedFloor.floor_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transformedData),
        }
      );
  
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      alert("CSV uploaded successfully!");
      setBedConfigs([]);
      setBedDetails([]);
      fetchBeds(selectedFloor.floor_id);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        upload: "Upload failed. Check the CSV format.",
      }));
    } finally {
      setLoading(false);
      setErrors({});
    }
  };
  return (
    <div className="flex">
  <Side />
  <div className="bg-gradient-to-br w-full from-purple-50 to-gray-100 min-h-screen p-6">
    <div className="container mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-ezzstay-base text-white p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bed and Room Configuration</h1>
          {user && (
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-white">
                User: <strong>{user.mobile}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Grid for Horizontal Columns */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] gap-6 mb-6">
          {/* Column 1: Property and Floor Selectors */}
          <div className="space-y-4">
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Property Name:
      <select
        name="p_name"
        value={selectedProperty?.p_id || ""}
        onChange={handlePropertySelectChange}
        required
        disabled={loading}
        className="w-full mt-1 p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
      >
        <option value="">Select a property</option>
        {propertyList.map((property) => (
          <option key={property.p_id} value={property.p_id}>
            {property.p_name}
          </option>
        ))}
      </select>
      {errors.propertyName && (
        <span className="text-red-500 text-sm">
          {errors.propertyName}
        </span>
      )}
    </label>
  </div>

  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Floor Name:
      <select
        name="floor_name"
        value={selectedFloor?.floor_id || ""}
        onChange={handleFloorSelectChange}
        required
        disabled={loading || !selectedProperty}
        className="w-full mt-1 p-3 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
      >
        <option value="">Select Floor</option>
        {floors.map((floor) => (
          <option key={floor.floor_id} value={floor.floor_id}>
            {floor.floor_name}
          </option>
        ))}
      </select>
      {errors.floorName && (
        <span className="text-red-500 text-sm">
          {errors.floorName}
        </span>
      )}
    </label>
  </div>
</div>

          {/* Column 2: Room Configuration Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Private 1-Beds",
                  name: "capacity_private_1_seater",
                },
                {
                  label: "Private 2-Beds",
                  name: "capacity_private_2_seater",
                },
                {
                  label: "Private 3-Beds",
                  name: "capacity_private_3_seater",
                },
                {
                  label: "Private 4-Beds",
                  name: "capacity_private_4_seater",
                },
                { label: "Suite Room Beds", name: "capacity_suite_room" },
                { label: "Dormitory Beds", name: "capacity_dormitory" },
              ].map((capacity) => (
                <div key={capacity.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {capacity.label}
                    <input
                      type="number"
                      name={capacity.name}
                      value={rooms[capacity.name] || ""}
                      onChange={(e) =>
                        handleRoomChange(capacity.name, e.target.value)
                      }
                      className="mt-1 p-3 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all bg-gray-100 cursor-not-allowed"
                      readOnly
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Buttons (Download CSV, File Upload) */}
          <div className="space-y-4">
            {/* File Input */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:border-ezzstay-base focus:ring focus:ring-purple-200 transition-all"
              />
              {errors.selectedFile && (
                <span className="text-red-500 text-sm">
                  {errors.selectedFile}
                </span>
              )}
            </div>

            {/* Icon Buttons for CSV actions */}
            <div className="flex gap-4 mt-4">
              <button
                title="Download CSV"
                className="bg-ezzstay-base text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-md w-1/2 flex items-center justify-center gap-2"
                onClick={generateCSV}
                disabled={loading}
              >
                <FaDownload size={18} />
                <span>Download</span>
              </button>
              <button
                title="Upload CSV"
                className="bg-ezzstay-base text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-md w-1/2 flex items-center justify-center gap-2"
                onClick={uploadCSV}
                disabled={loading}
              >
                <FaUpload size={18} />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden mt-6">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left">
                <th className="p-4">Room Name</th>
                <th className="p-4">Bed No</th>
                <th className="p-4">Room Type</th>
                <th className="p-4">Type of Bed</th>
                <th className="p-4">Upper/Lower</th>
                <th className="p-4">Price per Hour</th>
              </tr>
            </thead>
            <tbody>
              {bedDetails && bedDetails.length > 0 ? (
                bedDetails.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <td className="p-4">{row.room_name}</td>
                    <td className="p-4">{row.bed_no}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm 
                          ${
                            row.room_type?.toLowerCase().includes("private")
                              ? "bg-purple-100 text-purple-800"
                              : row.room_type?.toLowerCase().includes("suite")
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-pink-100 text-pink-800"
                          }`}
                      >
                        {row.room_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm 
                          ${
                            types
                              .find((type) => type.type_id === row.type_id)
                              ?.type_name?.toLowerCase() === "normal"
                              ? "bg-green-100 text-green-800"
                              : types
                                  .find((type) => type.type_id === row.type_id)
                                  ?.type_name?.toLowerCase() === "special"
                              ? "bg-blue-100 text-blue-800"
                              : types
                                  .find((type) => type.type_id === row.type_id)
                                  ?.type_name?.toLowerCase() === "window"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {types.find((type) => type.type_id === row.type_id)
                          ?.type_name || "Unknown"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm 
                          ${
                            row.upper_or_lower?.toLowerCase() === "upper"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {row.upper_or_lower}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.room_type === "Dormitory"
                        ? "Refer to General Pricing"
                        : row.room_price_per_hour}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-12 text-center" colSpan="6">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                    <p className="mt-1 text-gray-500">Try selecting a property and floor</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}

export default BedConfig;
