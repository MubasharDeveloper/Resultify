// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  // ✅ If allowedRoles is empty, allow all logged-in users
  if (allowedRoles.length === 0) {
    return children;
  }

  // 🔐 If role is NOT allowed, redirect to unauthorized
  if (!allowedRoles.includes(user.roleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
