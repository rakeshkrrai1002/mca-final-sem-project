import React from "react";
import { Box, Grid, Typography, Button } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

const BookingCard = ({
  startTime,
  endTime,
  duration,
  beds,
  dormitory,
  serviceName,
  roomType,
  price,
  oldPrice,
  rating,
  reviews,
}) => { 
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: 3,
        mb: 2, 
      }}
    >
      <Grid container justifyContent="space-between" alignItems="center">
       
        <Grid item xs={12} sm={6}>
          <Typography sx={{ fontWeight: "bold", color: "#0070f3" }}>DOMSTAY</Typography>
        </Grid>
        <Grid item xs={12} sm={6} textAlign="right">
          <Typography sx={{ color: "#483D8B", fontWeight: "bold", fontSize: "14px" }}>
            StayDeal 10% OFF
          </Typography>
        </Grid>
      </Grid>

      <Grid container alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>

        <Grid item xs={12} sm={6}>
          <Typography sx={{ fontWeight: "bold", fontSize: "20px" }}>
            {startTime} – {endTime}
          </Typography>
          <Typography sx={{ color: "gray", fontSize: "12px" }}>
            {duration} &bull; {beds} Beds (Single)
            
            {dormitory && <span> &bull; {dormitory} Dormitory (Single)</span>}
          </Typography>
        </Grid>
       
        <Grid item xs={12} sm={6} textAlign="right">
          <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>From ₹{price}</Typography>
          <Typography
            sx={{
              textDecoration: "line-through",
              color: "gray",
              fontSize: "12px",
            }}
          >
            ₹{oldPrice}
          </Typography>
        </Grid>
      </Grid>

      
      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontWeight: "bold", fontSize: "16px" }}>{serviceName}</Typography>
        <Typography sx={{ color: "gray", fontSize: "14px" }}>{roomType}</Typography>
      </Box>

      
      <Box sx={{ mt: 1 }} display="flex" alignItems="center">
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#43a047",
            "&:hover": { backgroundColor: "#388e3c" },
            color: "#fff",
            fontSize: "12px",
            fontWeight: "bold",
            px: 1,
            py: 0.5,
          }}
        >
          <StarIcon sx={{ fontSize: "16px", mr: 0.5 }} /> {rating}
        </Button>
        <Typography sx={{ ml: 1, fontSize: "12px", color: "gray" }}>{reviews}</Typography>
      </Box>
    </Box>
  );
};

const BookingCards = () => {
  return (
    <Box sx={{ p: 2, backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      
      <BookingCard
        startTime="15:30"
        endTime="1:00"
        duration="9h 30m"
        beds="3"
        serviceName="Ibis Hotels"
        roomType="A/C (2+1)"
        price="800"
        oldPrice="1050"
        rating="4.2"
        reviews="100"
      />
      
      <BookingCard
        startTime="21:00"
        endTime="04:00"
        duration="7h 00m"
        beds="2"
        dormitory="1"  
        serviceName="NOVOTEL"
        roomType="A/C+Dormitory (2+1)"
        price="1100"
        oldPrice="1350"
        rating="4.3"
        reviews="90"
      />
    </Box>
  );
};

export default BookingCards;
