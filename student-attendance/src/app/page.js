"use client";

import { useState } from "react";
import "./attendance.css";
import LoginPage from "./components/LoginPage";
import AttendancePage from "./components/AttendancePage";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPhone, setUserPhone] = useState("");

  const handleLogin = (phoneNumber) => {
    setUserPhone(phoneNumber);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserPhone("");
  };

  return isLoggedIn ? (
    <AttendancePage userPhone={userPhone} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
