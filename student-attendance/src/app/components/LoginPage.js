"use client";

import { useState, useEffect } from "react";
import { setToken } from "@/lib/apiUtils";

import "../login.css";

export default function LoginPage({ onLogin }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  // Load saved credentials on component mount and auto-login if available
  useEffect(() => {
    const savedMobile = localStorage.getItem("rememberMe_mobile");
    const savedPassword = localStorage.getItem("rememberMe_password");
    const skipAutoLogin = localStorage.getItem("skipAutoLogin");

    if (savedMobile && savedPassword) {
      setMobile(savedMobile);
      setPassword(savedPassword);
      setRememberMe(true);

      // Only auto-login if skipAutoLogin flag is not set
      if (!skipAutoLogin) {
        // Auto-login with saved credentials
        setTimeout(() => {
          autoLogin(savedMobile, savedPassword);
        }, 500);
      }
      // Note: flag is NOT removed here, only removed after manual login
    }
  }, []);

  const autoLogin = (mobileNum, passwordVal) => {
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mobileNum, password: passwordVal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.token) {
          // Store JWT token
          setToken(data.token);
          // Pass user data and token to onLogin
          onLogin(data.user, data.token);
        } else {
          // If auto-login fails, just show the filled form
          console.log("Auto-login failed, showing login form");
        }
      })
      .catch((err) => {
        console.log("Auto-login error, showing login form");
      });
  };

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

          // Handle Remember Me
          if (rememberMe) {
            localStorage.setItem("rememberMe_mobile", mobile);
            localStorage.setItem("rememberMe_password", password);
          } else {
            localStorage.removeItem("rememberMe_mobile");
            localStorage.removeItem("rememberMe_password");
          }

          // Remove the skipAutoLogin flag so auto-login works next time
          localStorage.removeItem("skipAutoLogin");

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

          <div className="form-group remember-me-group">
            <label htmlFor="rememberMe" className="remember-me-label">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-me-checkbox"
              />
              Remember me
            </label>
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
