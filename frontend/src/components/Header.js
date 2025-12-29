import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Header = ({ currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>🏆 HighStakes Auction</h1>
        </Link>

        <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>

          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${
                  location.pathname === "/dashboard" ? "active" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/create-auction"
                className={`nav-link ${
                  location.pathname === "/create-auction" ? "active" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sell Item
              </Link>
              <div className="user-menu">
                <span className="welcome">Welcome, {currentUser.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link
                to="/login"
                className="login-btn"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="register-btn"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
