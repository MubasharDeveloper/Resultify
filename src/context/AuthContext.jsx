// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../Firebase_config";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const roleToRootLink = {
    Admin: "/admin-dashboard",
    HOD: "/hod-dashboard",
    Teacher: "/teacher-dashboard",
  };

  const login = async (userData) => {
    try {
      setLoading(true);
  
      // Fetch department name if departmentId exists
      let departmentName = null;
      if (userData.departmentId) {
        const deptDoc = await getDoc(doc(db, "Departments", userData.departmentId));
        if (deptDoc.exists()) {
          departmentName = deptDoc.data().name;
        }
      }
  
      // Fetch role name if roleId exists
      let roleName = null;
      if (userData.roleId) {
        const roleDoc = await getDoc(doc(db, "Roles", userData.roleId));
        if (roleDoc.exists()) {
          roleName = roleDoc.data().name;
        }
      }
  
      // ✅ Map roleName to rootLink
      const rootLink = roleToRootLink[roleName] || "/"; // fallback to home if unknown role
  
      const updatedUser = {
        ...userData,
        departmentName,
        roleName,
        rootLink, // ✅ Include rootLink
      };
  
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading, }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
