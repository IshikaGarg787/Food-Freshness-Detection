import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home    from "./pages/Home";
import Scanner from "./pages/Scanner";
import Upload  from "./pages/Upload";
import About   from "./pages/About";
import Login   from "./pages/Login";
import Signup  from "./pages/Signup";
import Navbar  from "./components/Navbar";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      {/* Navbar always visible — shows Login button when logged out */}
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        {/* All pages publicly accessible — auth handled inside each page */}
        <Route path="/"        element={<Home    user={user} />} />
        <Route path="/scanner" element={<Scanner user={user} />} />
        <Route path="/upload"  element={<Upload  user={user} />} />
        <Route path="/about"   element={<About />} />

        {/* Auth pages redirect home if already logged in */}
        <Route path="/login"  element={user ? <Navigate to="/" /> : <Login  onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
}

export default App;
