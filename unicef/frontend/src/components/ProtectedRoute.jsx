// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const { user, loading, accessToken } = useSelector((state) => state.auth);

  // While loading (rehydration in progress), show a spinner or placeholder
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // If no user and no token, redirect to login
  if (!user && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected component
  return children;
}

export default ProtectedRoute;