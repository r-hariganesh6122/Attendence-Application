"use client";

import { useState } from "react";
import { setToken } from "@/lib/apiUtils";

import "../login.css";

export default function LoginPage({ onLogin }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!mobile.trim()) {
      setError("Please enter your mobile number");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    // Real authentication via API
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.token) {
          setError("");
          // Store JWT token
          setToken(data.token);
          // Pass user data and token to onLogin
          onLogin(data.user, data.token);
        } else {
          setError(data.message || "Invalid mobile or password");
        }
      })
      .catch(() => setError("Server error. Please try again later."));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Attendance Management System</h1>
        <p className="login-subtitle">Enter your credentials to login</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="mobile" className="form-label">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your mobile number"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
              />
              <button
                type="button"
                className="eye-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && <span className="error-message">{error}</span>}

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
