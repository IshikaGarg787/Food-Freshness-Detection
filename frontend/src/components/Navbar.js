import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const navItems = [
  { path: "/",        label: "Dashboard", icon: "🏠" },
  { path: "/scanner", label: "Live Scan",  icon: "📷" },
  { path: "/upload",  label: "Upload",     icon: "📤" },
  { path: "/about",   label: "About",      icon: "🌿" },
];

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo">
          <div className="logo-icon">🥬</div>
          <span className="logo-text">FreshScan</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-links">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={location.pathname === path ? "active" : ""}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <>
              {/* Logged in: show name + logout */}
              <span className="nav-username">👤 {user.name}</span>
              <button onClick={onLogout} className="nav-logout-btn nav-auth-btn-desktop">
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Logged out: show Login + Signup */}
              <button onClick={() => navigate("/login")} className="nav-login-btn nav-auth-btn-desktop">
                Login
              </button>
              <button onClick={() => navigate("/signup")} className="nav-signup-btn nav-auth-btn-desktop">
                Sign Up
              </button>
            </>
          )}

          {/* Hamburger (mobile) */}
          <div className="hamburger" onClick={() => setMenuOpen(true)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🥬 FreshScan</span>
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {/* User info in sidebar */}
        {user ? (
          <div style={{
            padding: "12px 20px",
            background: "#f0fdf4",
            margin: "0 0 8px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#166534",
          }}>
            👤 {user.name}<br />
            <span style={{ fontSize: "12px", fontWeight: "400", color: "#6b7280" }}>
              {user.email}
            </span>
          </div>
        ) : (
          <div style={{ padding: "12px 20px 4px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
              style={{ flex: 1, padding: "10px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
            >
              Login
            </button>
            <button
              onClick={() => { navigate("/signup"); setMenuOpen(false); }}
              style={{ flex: 1, padding: "10px", background: "#16a34a", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
            >
              Sign Up
            </button>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={location.pathname === path ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ fontSize: "20px" }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {user && (
          <button
            onClick={() => { onLogout(); setMenuOpen(false); }}
            style={{
              margin: "16px 20px",
              padding: "12px",
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              width: "calc(100% - 40px)",
            }}
          >
            🚪 Logout
          </button>
        )}

        <div className="sidebar-food-art">🍎🥦🍋🫐🥕</div>
      </div>

      <style>{`
        .nav-username {
          font-size: 13px; font-weight: 600; color: #374151;
          display: none;
        }
        .nav-auth-btn-desktop { display: none; }
        .nav-login-btn {
          padding: 7px 18px;
          background: #f0fdf4; color: #16a34a;
          border: 1px solid #bbf7d0; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .nav-login-btn:hover { background: #dcfce7; }
        .nav-signup-btn {
          padding: 7px 18px;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: white; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(22,163,74,0.3);
        }
        .nav-signup-btn:hover { opacity: 0.9; }
        .nav-logout-btn {
          padding: 7px 16px;
          background: #fef2f2; color: #dc2626;
          border: 1px solid #fecaca; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .nav-logout-btn:hover { background: #fee2e2; }
        @media (min-width: 769px) {
          .nav-username { display: flex; align-items: center; gap: 6px; }
          .nav-auth-btn-desktop { display: block; }
        }
      `}</style>
    </>
  );
}

export default Navbar;
