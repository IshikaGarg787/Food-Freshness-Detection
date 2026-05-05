import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      onLogin(data.user);
      navigate("/");
    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🥬</div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Login to your FreshScan account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>Sign up here</Link>
        </p>
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
  logo:     { fontSize: "52px", marginBottom: "16px" },
  title:    { fontSize: "26px", fontWeight: "800", color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: "14px", color: "#6b7280", marginBottom: "24px" },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: "10px", padding: "12px 16px", fontSize: "14px",
    marginBottom: "16px", textAlign: "left",
  },
  form:  { display: "flex", flexDirection: "column", gap: "14px" },
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
  switchText: { marginTop: "20px", fontSize: "13px", color: "#6b7280" },
  link: { color: "#16a34a", fontWeight: "700", textDecoration: "none" },
};

console.log("API =", API);