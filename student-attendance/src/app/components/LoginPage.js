"use client";

import { useState } from "react";
import { mockData } from "../../lib/mockData";
import "../login.css";

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState(""); // "teacher" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    // Mock authentication
    let user = null;

    if (role === "teacher") {
      user = mockData.teacherUsers.find(
        (u) => u.email === email && u.password === password,
      );
    } else if (role === "admin") {
      user = mockData.adminUsers.find(
        (u) => u.email === email && u.password === password,
      );
    }

    if (user) {
      setError("");
      onLogin({ ...user, role });
    } else {
      setError("Invalid email or password");
    }
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
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

        <p className="login-footer">
          {role === "teacher"
            ? "Demo: rajesh@college.edu / teach123 or priya@college.edu / teach123"
            : role === "admin"
              ? "Demo: admin@college.edu / admin123"
              : "Select a role to see demo credentials"}
        </p>
      </div>
    </div>
  );
}
