"use client";

import { useState } from "react";
import "../login.css";

export default function LoginPage({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation - check if phone number is 10 digits
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setError("");
    onLogin(phoneNumber);
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Student Attendance</h1>
        <p className="login-subtitle">Enter your phone number to login</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              value={phoneNumber}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              maxLength="10"
              className="form-input"
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <p className="login-footer">
          Please enter your registered phone number
        </p>
      </div>
    </div>
  );
}
