import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

        {/* Right Side — user info + logout */}
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && (
            <span style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              👤 {user.name}
            </span>
          )}
          {user && (
            <button
              onClick={onLogout}
              style={{
                padding: "7px 16px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "none",   /* hidden on mobile, shown via CSS below */
              }}
              className="logout-btn-desktop"
            >
              Logout
            </button>
          )}
          {/* Hamburger */}
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
        {user && (
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

        {/* Logout button in sidebar */}
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

      {/* Inline style for desktop logout button visibility */}
      <style>{`
        @media (min-width: 769px) {
          .logout-btn-desktop { display: block !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;
