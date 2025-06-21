import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
} from "@mui/material";
import hotelIcon from "../../assets/hotel.jpg";
import dormIcon from "../../assets/dorm.jpg";
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [beds, setBeds] = useState(""); 
  const [hotelChecked, setHotelChecked] = useState(false); 
  const [dormChecked, setDormChecked] = useState(false); 

  const handleDateChange = (daysToAdd) => {
    const today = new Date();
    today.setDate(today.getDate() + daysToAdd);
    const formattedDate = today.toISOString().split("T")[0];
    setStartDate(formattedDate);
    setEndDate(formattedDate); 
  };

  const generateTimeSlots = () => {
    const times = [];
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 48; i++) {
      const hour = start.getHours().toString().padStart(2, '0');
      const minutes = start.getMinutes().toString().padStart(2, '0');
      times.push(`${hour}:${minutes}`);
      start.setMinutes(start.getMinutes() + 30);
    }
    return times;
  };

  const timeSlots = generateTimeSlots();

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
    if (!endTime) setEndDate(startDate);
  };

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value);
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${startDate}T${e.target.value}`);

    if (end < start) {
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split("T")[0]);
    } else {
      setEndDate(startDate);
    }
  };

  const handleSearchRooms = () => {
    if (!location || !startTime || !endTime || !startDate || !beds) {
      alert("Please fill all required fields");
      return;
    }

    if (!hotelChecked && !dormChecked) {
      alert("Please select at least one room type (Hotel or Dormitory).");
      return;
    }

    navigate("/template");
  };

  return (
    <Container maxWidth="sm" sx={{ my: 5 }}>
      <Grid container spacing={3} justifyContent="center" sx={{ my: 4 }}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            sx={{
              flexDirection: "column",
              p: 2,
              boxShadow: 3,
              borderRadius: 2,
              backgroundColor: "#fff",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
            onClick={() => setHotelChecked(!hotelChecked)}
          >
            <img
              src={hotelIcon}
              alt="Hotel"
              style={{ width: "100%", height: "200px", borderRadius: "8px" }}
            />
            <Typography variant="body1" sx={{ mt: 2, fontWeight: "bold" }}>
              Book Hotels
            </Typography>
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            sx={{
              flexDirection: "column",
              p: 2,
              boxShadow: 3,
              borderRadius: 2,
              backgroundColor: "#fff",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
            onClick={() => setDormChecked(!dormChecked)}
          >
            <img
              src={dormIcon}
              alt="Dormitory"
              style={{ width: "100%", height: "200px", borderRadius: "8px" }}
            />
            <Typography
              variant="body1"
              sx={{ mt: 2, fontWeight: "bold", whiteSpace: "nowrap" }}
            >
              Book Dormitory
            </Typography>
          </Button>
        </Grid>
      </Grid>

      <Box
        sx={{
          p: 4,
          backgroundColor: "#fff",
          borderRadius: 3,
          boxShadow: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
          Hourly Basis Hotels Booking
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Assured hotels of your choice
        </Typography>

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            margin="normal"
            sx={{ mb: 0 }}
          />

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                margin="normal"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                margin="normal"
              />
            </Grid>
          </Grid>

          <Grid container alignItems="center" spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={5}>
              <TextField
                select
                fullWidth
                variant="outlined"
                label="Start Time"
                value={startTime}
                onChange={handleStartTimeChange}
                margin="normal"
              >
                {timeSlots.map((time, index) => (
                  <MenuItem key={index} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={2} sx={{ textAlign: "center" }}>
              <Typography variant="h6">hrs</Typography>
            </Grid>

            <Grid item xs={5}>
              <TextField
                select
                fullWidth
                variant="outlined"
                label="End Time"
                value={endTime}
                onChange={handleEndTimeChange}
                margin="normal"
              >
                {timeSlots.map((time, index) => (
                  <MenuItem key={index} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            type="number"
            label="Number of Beds"
            placeholder="Enter number of beds"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            margin="normal"
            sx={{ mt: 1, mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={hotelChecked}
                onChange={(e) => setHotelChecked(e.target.checked)}
                color="primary"
              />
            }
            label="Hotel Rooms"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={dormChecked}
                onChange={(e) => setDormChecked(e.target.checked)}
                color="primary"
              />
            }
            label="Dormitory"
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSearchRooms}
            color="primary"
            sx={{
              py: 2,
              mt: 1,
              backgroundColor: "#d32f2f",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            SEARCH ROOMS
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
            fontWeight: "bold",
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            sx={{
              px: 4,
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#ADD8E6",
                color: "#000000",
              },
            }}
            onClick={() => handleDateChange(0)}
          >
            Today
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{
              px: 4,
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#ADD8E6",
                color: "#000000",
              },
            }}
            onClick={() => handleDateChange(1)}
          >
            Tomorrow
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{
              px: 4,
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#ADD8E6",
                color: "#000000",
              },
            }}
            onClick={() => handleDateChange(7)}
          >
            Next Week
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Booking;
