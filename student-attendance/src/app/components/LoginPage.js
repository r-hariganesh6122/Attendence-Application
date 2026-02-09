"use client";

import { useState } from "react";

import "../login.css";

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState(""); // "teacher" or "admin"
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role");
      return;
    }

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
      body: JSON.stringify({ identifier: mobile, password, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setError("");
          onLogin(data.user);
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
        <p className="login-subtitle">Select your role and login</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="role-selection">
              <div className="role-option">
                <input
                  type="radio"
                  id="teacher"
                  name="role"
                  value="teacher"
                  checked={role === "teacher"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label htmlFor="teacher" className="role-label">
                  Teacher
                </label>
              </div>
              <div className="role-option">
                <input
                  type="radio"
                  id="admin"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label htmlFor="admin" className="role-label">
                  Administrator
                </label>
              </div>
            </div>
          </div>

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
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input"
            />
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
