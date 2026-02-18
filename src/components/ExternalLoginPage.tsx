import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Card,
  Alert,
} from "@aws-amplify/ui-react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";

type AuthStep = "email" | "otp";

export const ExternalLoginPage = () => {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Get redirect URL from query params (set by generateLink.tsx)
  const redirectUrl = searchParams.get("redirect") || "/secure-view";
  

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call your backend API to send OTP
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Store session ID from backend
      setSessionId(data.sessionId);
      setStep("otp");
      setResendCooldown(60);
      
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call your backend API to verify OTP
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          sessionId: sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      // Store access token in localStorage
      const { accessToken, expiresIn, email: userEmail } = data;
      
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      localStorage.setItem('external_access_token', accessToken);
      localStorage.setItem('external_token_expiry', expiryTime.toString());
      localStorage.setItem('external_user_email', userEmail);
      
      // Navigate to the secure-view page (or wherever redirect points)
      navigate(redirectUrl, { replace: true });
      
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSessionId(data.sessionId);
      setOtp("");
      setError("");
      setResendCooldown(60);
      
    } catch (err: any) {
      console.error("Error resending OTP:", err);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "2rem",
      }}
    >
      <Card
        variation="elevated"
        style={{
          maxWidth: "450px",
          width: "100%",
          padding: "3rem 2.5rem",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Logo */}
        <Flex direction="column" alignItems="center" gap="1.5rem" style={{ marginBottom: "2rem" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo}
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <Flex direction="column" alignItems="center" gap="0.5rem">
            <Heading level={3} style={{ margin: 0, textAlign: "center", color: "#1f2937" }}>
              Secure Access
            </Heading>
            <Text fontSize="0.95rem" color="#6b7280" style={{ textAlign: "center" }}>
              Verify your identity to view shared files
            </Text>
          </Flex>
        </Flex>

        {/* Error Alert */}
        {error && (
          <Alert variation="error" isDismissible onDismiss={() => setError("")} style={{ marginBottom: "1.5rem" }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Email Input */}
        {step === "email" && (
          <form onSubmit={handleSendOTP}>
            <Flex direction="column" gap="1.5rem">
              <Flex direction="column" gap="0.5rem">
                <Text fontSize="0.875rem" fontWeight={600} color="#374151">
                  Email Address
                </Text>
                <TextField
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  size="large"
                  innerStartComponent={
                    <Mail size={18} color="#9ca3af" style={{ marginLeft: "0.5rem" }} />
                  }
                />
              </Flex>

              <Button
                type="submit"
                variation="primary"
                size="large"
                isLoading={loading}
                isDisabled={!email}
                style={{ width: "100%" }}
              >
                <Flex gap="0.5rem" alignItems="center" justifyContent="center">
                  Send Verification Code
                  <ArrowRight size={18} />
                </Flex>
              </Button>

              <Text fontSize="0.8rem" color="#9ca3af" style={{ textAlign: "center", marginTop: "0.5rem" }}>
                A one-time password will be sent to your email
              </Text>
            </Flex>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <Flex direction="column" gap="1.5rem">
              <Flex direction="column" gap="0.5rem">
                <Text fontSize="0.875rem" fontWeight={600} color="#374151">
                  Verification Code
                </Text>
                <Text fontSize="0.8rem" color="#6b7280" style={{ marginBottom: "0.5rem" }}>
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </Text>
                <TextField
                  label="OTP"
                  placeholder="000000"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoFocus
                  size="large"
                  maxLength={6}
                  innerStartComponent={
                    <Lock size={18} color="#9ca3af" style={{ marginLeft: "0.5rem" }} />
                  }
                  style={{ letterSpacing: "0.5rem", fontSize: "1.25rem", textAlign: "center" }}
                />
              </Flex>

              <Button
                type="submit"
                variation="primary"
                size="large"
                isLoading={loading}
                isDisabled={otp.length !== 6}
                style={{ width: "100%" }}
              >
                <Flex gap="0.5rem" alignItems="center" justifyContent="center">
                  Verify & Continue
                  <ArrowRight size={18} />
                </Flex>
              </Button>

              {/* Resend and Back buttons */}
              <Flex gap="0.5rem" justifyContent="space-between">
                <Button
                  variation="link"
                  size="small"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setSessionId("");
                  }}
                  isDisabled={loading}
                >
                  ← Change Email
                </Button>
                <Button
                  variation="link"
                  size="small"
                  onClick={handleResendOTP}
                  isDisabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </Button>
              </Flex>
            </Flex>
          </form>
        )}
      </Card>

      {/* Footer */}
      <Text fontSize="0.85rem" color="#9ca3af" style={{ marginTop: "2rem", textAlign: "center" }}>
        This is a secure area. Unauthorized access is prohibited.
      </Text>
    </Flex>
  );
};