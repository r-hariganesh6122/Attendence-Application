"use client";

import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";
import AcademicCoordinatorDashboard from "./AcademicCoordinatorDashboard";
import { clearToken, setToken } from "@/lib/apiUtils";

export default function AppRoot() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);

  // Restore user from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("activeRole");

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsLoggedIn(true);
        setToken(storedToken);

        // Use stored active role or default to user's role
        if (storedRole) {
          setActiveRole(storedRole);
        } else {
          setActiveRole(parsed.role);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        clearToken();
        localStorage.removeItem("user");
        localStorage.removeItem("activeRole");
      }
    }

    // Initialize app (start Sunday locker scheduler)
    fetch("/api/init").catch((error) =>
      console.error("Failed to initialize app:", error),
    );
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      setToken(token);
    }

    // Use the activeRole if set, otherwise use user's role
    const roleToUse = userData.activeRole || userData.role;
    setActiveRole(roleToUse);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    localStorage.setItem("skipAutoLogin", "true");
    clearToken();
  };

  if (!isMounted) {
    return null;
  }

  // Safety check: if user or user.role is missing, show login
  if (!user || !user.role) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return isLoggedIn && activeRole ? (
    activeRole === "teacher" ? (
      <TeacherDashboard user={user} onLogout={handleLogout} />
    ) : activeRole === "academic_coordinator" ? (
      <AcademicCoordinatorDashboard user={user} />
    ) : (
      <AdminDashboard user={user} onLogout={handleLogout} />
    )
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
