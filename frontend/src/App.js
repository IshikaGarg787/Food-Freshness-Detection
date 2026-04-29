import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home    from "./pages/Home";
import Scanner from "./pages/Scanner";
import Upload  from "./pages/Upload";
import About   from "./pages/About";
import Login   from "./pages/Login";
import Signup  from "./pages/Signup";
import Navbar  from "./components/Navbar";

// ProtectedRoute: redirects to /login if not logged in
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  // Try to load user from localStorage on first load
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      {/* Only show Navbar when logged in */}
      {user && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={user ? <Navigate to="/" /> : <Login  onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />} />

        {/* Protected routes — need login */}
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Home user={user} />
          </ProtectedRoute>
        } />
        <Route path="/scanner" element={
          <ProtectedRoute user={user}>
            <Scanner />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute user={user}>
            <Upload />
          </ProtectedRoute>
        } />
        <Route path="/about" element={
          <ProtectedRoute user={user}>
            <About />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
