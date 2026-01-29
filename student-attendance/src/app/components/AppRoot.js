"use client";

import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";

export default function AppRoot() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isMounted) {
    return null;
  }

  return isLoggedIn ? (
    user.role === "teacher" ? (
      <TeacherDashboard user={user} onLogout={handleLogout} />
    ) : (
      <AdminDashboard user={user} onLogout={handleLogout} />
    )
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
