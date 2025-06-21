import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export const LoginWithOTP = ({ setFormType }) => {
  const navigate = useNavigate();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);

  const handleGenerateOTP = async () => {
    if (mobile.length === 10 && /^\d{10}$/.test(mobile)) {
      try {
        const formattedMobile = `+91${mobile}`;
        const response = await fetch("http://127.0.0.1:8000/loginwithotp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mobile: formattedMobile }),
        });
        if (response.ok) {
          setIsOtpSent(true);
          startOtpTimer();
        } else {
          alert("Failed to send OTP. Please try again.");
        }
      } catch (error) {
        console.error("Error sending OTP:", error);
        alert("Failed to send OTP. Please try again.");
      }
    } else {
      alert("Please enter a valid 10-digit mobile number");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.trim() === "") {
      alert("Please enter the OTP.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/verifyotp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: `+91${mobile}`, otp }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("OTP verified successfully!");
        navigate("/maindashboard");
      } else {
        alert(result.error || "Failed to verify OTP.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Failed to verify OTP. Please try again.");
    }
  };

  const startOtpTimer = () => {
    let timeLeft = 30;
    const intervalId = setInterval(() => {
      timeLeft--;
      setTimer(timeLeft);

      if (timeLeft === 0) {
        clearInterval(intervalId);
      }
    }, 1000);
  };

  return (
    <Container maxWidth="xs" sx={{ my: 5 }}>
      <Box
        sx={{
          p: 4,
          backgroundColor: "#ffffff",
          borderRadius: 3,
          boxShadow: 4,
          textAlign: "center",
          border: "1px solid #e0e0e0",
        }}
      >
        {isOtpSent ? (
          <>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
              Verify OTP
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please enter the OTP sent to <strong>{mobile}</strong>.
              <Button onClick={() => setIsOtpSent(false)} sx={{ ml: 1 }}>
                EDIT
              </Button>
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
              InputProps={{
                style: {
                  borderRadius: 8,
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                py: 2,
                mt: 3,
                backgroundColor: "#00796b",
                "&:hover": { backgroundColor: "#004d40" },
              }}
              onClick={handleVerifyOTP}
            >
              Submit OTP
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Resend OTP (3 tries)
            </Typography>
            {timer > 0 ? (
              <Typography variant="body2" sx={{ mt: 1 }}>
                You can resend OTP in {timer}s
              </Typography>
            ) : (
              <Button variant="text" sx={{ mt: 1 }}>
                Resend OTP
              </Button>
            )}
          </>
        ) : (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", mb: 2, fontFamily: "roboto" }}
            >
              Login with OTP
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              label="Enter your mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              margin="normal"
              InputProps={{
                style: {
                  borderRadius: 8,
                },
              }}
            />

            <Box sx={{ textAlign: "left", my: 2 }}>
              <FormControlLabel
                control={<Checkbox />}
                label="I'm not a robot"
                sx={{ justifyContent: "flex-start" }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                py: 2,
                mt: 3,
                backgroundColor: "#00796b",
                "&:hover": { backgroundColor: "#004d40" },
              }}
              onClick={handleGenerateOTP}
            >
              Generate OTP
            </Button>
          </>
        )}

        <Button
          onClick={() => navigate("/loginwithpassword")}
          variant="outlined"
          sx={{
            mt: 3,
            py: 1,
            px: 2,
            borderColor: "#1e88e5",
            color: "#1e88e5",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: "bold",
            transition: "0.3s",
            "&:hover": {
              backgroundColor: "#000000",
              color: "#fff",
              borderColor: "#1e88e5",
            },
          }}
        >
          Back to Login
        </Button>
      </Box>
    </Container>
  );
};
