import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Signup failed. Please try again.");
        return;
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin(data.user);
      navigate("/");
    } catch (err) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🥬</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join FreshScan and start detecting freshness</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    padding: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  logo: { fontSize: "52px", marginBottom: "16px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: "15px", color: "#6b7280", marginBottom: "28px" },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "left",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" },
  label: { fontSize: "14px", fontWeight: "600", color: "#374151" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d1fae5",
    fontSize: "15px",
    outline: "none",
    background: "#f9fafb",
  },
  button: {
    marginTop: "8px",
    padding: "14px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  switchText: { marginTop: "24px", fontSize: "14px", color: "#6b7280" },
  link: { color: "#16a34a", fontWeight: "700", textDecoration: "none" },
};
