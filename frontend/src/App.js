import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

// Components
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ItemDetail from "./pages/ItemDetail";
import Dashboard from "./pages/Dashboard";
import CreateAuction from "./pages/CreateAuction";

const socket = io("http://localhost:5000");

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setCurrentUser(JSON.parse(user));
      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setCurrentUser(userData.user);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData.user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header currentUser={currentUser} onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={login} />
                )
              }
            />
            <Route
              path="/register"
              element={
                currentUser ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Register onLogin={login} />
                )
              }
            />
            <Route
              path="/item/:id"
              element={<ItemDetail socket={socket} currentUser={currentUser} />}
            />
            <Route
              path="/dashboard"
              element={
                currentUser ? (
                  <Dashboard currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/create-auction"
              element={
                currentUser ? (
                  <CreateAuction currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
