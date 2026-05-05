import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function Signup({ onLogin }) {
  const navigate = useNavigate();

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — OTP
  const [step, setStep] = useState(1);   // 1 = form, 2 = otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  // ── Step 1: Submit form ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Signup failed. Please try again.");
        return;
      }

      // Move to OTP step
      setStep(2);
    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ───────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;   // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);    // only last digit
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs[5].current?.focus();
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────
  const handleVerify = async (e) => {
  e.preventDefault();
  setError("");

  const otpString = otp.join("");

  if (otpString.length < 6) {
    setError("Please enter all 6 digits.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API}/auth/verify-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otpString }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || "Wrong OTP. Please try again.");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    onLogin(data.user);
    navigate("/");
  } catch (err) {
    setError("Could not connect to server.");
  } finally {
    setLoading(false);
  }
};

  // ── Resend OTP ───────────────────────────────────────────
  const handleResend = async () => {
    setError("");
    setResendMsg("");
    setOtp(["", "", "", "", "", ""]);
    otpRefs[0].current?.focus();

    try {
      const resendOtp = async () => {
        await fetch(`${API}/auth/resend-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "signup" }),
        });
        alert("OTP resent!");
      };
      const data = await res.json();
      if (res.ok) setResendMsg("✅ New OTP sent! Check your inbox.");
      else setError(data.detail || "Failed to resend OTP.");
    } catch {
      setError("Could not connect to server.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🥬</div>

        {step === 1 ? (
          <>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Join FreshScan and start detecting freshness</p>

            {error && <div style={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" required style={styles.input} />
              </div>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Sending OTP..." : "Continue →"}
              </button>
            </form>

            <p style={styles.switchText}>
              Already have an account?{" "}
              <Link to="/login" style={styles.link}>Login here</Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Verify Your Email</h1>
            <p style={styles.subtitle}>
              We sent a 6-digit code to<br />
              <strong style={{ color: "#16a34a" }}>{email}</strong>
            </p>

            {error && <div style={styles.errorBox}>{error}</div>}
            {resendMsg && <div style={styles.successBox}>{resendMsg}</div>}

            <form onSubmit={handleVerify} style={styles.form}>
              {/* OTP Boxes */}
              <div style={styles.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      ...styles.otpBox,
                      borderColor: digit ? "#16a34a" : "#d1fae5",
                      background: digit ? "#f0fdf4" : "white",
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                Didn't receive the code?
              </p>
              <button onClick={handleResend} style={styles.resendBtn}>
                Resend OTP
              </button>
            </div>

            <button onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
              style={styles.backBtn}>
              ← Change email
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", padding: "20px",
  },
  card: {
    background: "white", borderRadius: "20px", padding: "48px 40px",
    width: "100%", maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)", textAlign: "center",
  },
  logo: { fontSize: "52px", marginBottom: "16px" },
  title: { fontSize: "26px", fontWeight: "800", color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: "14px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: "10px", padding: "12px 16px", fontSize: "14px",
    marginBottom: "16px", textAlign: "left",
  },
  successBox: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534",
    borderRadius: "10px", padding: "12px 16px", fontSize: "14px",
    marginBottom: "16px",
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: {
    padding: "11px 14px", borderRadius: "10px",
    border: "1px solid #d1fae5", fontSize: "14px",
    outline: "none", background: "#f9fafb",
  },
  button: {
    marginTop: "4px", padding: "13px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "white", border: "none", borderRadius: "12px",
    fontSize: "15px", fontWeight: "700", cursor: "pointer",
  },
  otpRow: {
    display: "flex", gap: "10px", justifyContent: "center", margin: "8px 0",
  },
  otpBox: {
    width: "48px", height: "56px", textAlign: "center",
    fontSize: "24px", fontWeight: "800", color: "#111",
    border: "2px solid", borderRadius: "12px",
    outline: "none", transition: "all 0.15s",
  },
  resendBtn: {
    background: "none", border: "1px solid #d1fae5", color: "#16a34a",
    borderRadius: "8px", padding: "8px 20px", fontSize: "13px",
    fontWeight: "700", cursor: "pointer",
  },
  backBtn: {
    marginTop: "16px", background: "none", border: "none",
    color: "#9ca3af", fontSize: "13px", cursor: "pointer",
    textDecoration: "underline",
  },
  switchText: { marginTop: "20px", fontSize: "13px", color: "#6b7280" },
  link: { color: "#16a34a", fontWeight: "700", textDecoration: "none" },
};
