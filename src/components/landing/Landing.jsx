import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Rating,
  Divider,
} from "@mui/material";
import { DirectionsBus, Phone, Usb, Add, Sos } from "@mui/icons-material"; 
export const Landing = () => {
  return (
    <Box
      sx={{ 
        
        backgroundColor: "#fff", 
        borderRadius: 2,
        padding: 3, 
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        maxWidth: 320, 
        margin: "auto",
        transition: "0.3s", 
        mt:4,
        "&:hover": {
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", 
        },
      }}
    >
     
      <Grid container alignItems="center" justifyContent="space-between">
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
           Deluxe Hotel
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Rating
            name="read-only"
            value={4.3}
            precision={0.1}
            readOnly
            sx={{ fontSize: "1.2rem", mr: 1 }}
          />
          <Typography variant="caption" sx={{ color: "#4CAF50" }}>
            299
          </Typography>
        </Box>
      </Grid>

      <Divider sx={{ my: 2 }} /> 

     
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        Beds available:
      </Typography>
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        Min cost:
      </Typography>
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        Dist from Dest:
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Location: 
      </Typography>

     
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 1,
          padding: 1,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", 
        }}
      >
        <IconButton>
          <DirectionsBus sx={{ color: "#000" }} />
        </IconButton>
        <IconButton>
          <Sos sx={{ color: "#000" }} />
        </IconButton>
        <IconButton>
          <Phone sx={{ color: "#000" }} />
        </IconButton>
        <IconButton>
          <Usb sx={{ color: "#000" }} />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton>
            <Add sx={{ color: "#000" }} />
          </IconButton>
          <Typography variant="body1" sx={{ fontSize: "1rem" }}>
            4
          </Typography>
        </Box>
      </Box>

     
      <Button
        fullWidth
        variant="contained"
        color="error"
        sx={{
          mt: 3, 
          fontWeight: "bold",
          padding: 1.5, 
          fontSize: "1rem", 
          textTransform: "none", 
        }}
      >
        Select Seats
      </Button>
    </Box>
  );
};
