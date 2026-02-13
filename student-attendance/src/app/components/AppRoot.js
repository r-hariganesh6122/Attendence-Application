"use client";

import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";
import { clearToken, setToken } from "@/lib/apiUtils";

export default function AppRoot() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Restore user from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsLoggedIn(true);
        // Ensure token is set in localStorage (in case it got cleared)
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to restore session:", error);
        clearToken();
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      setToken(token);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("user");
    clearToken();
  };

  if (!isMounted) {
    return null;
  }

  // Safety check: if user or user.role is missing, show login
  if (!user || !user.role) {
    return <LoginPage onLogin={handleLogin} />;
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
