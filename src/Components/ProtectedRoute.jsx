import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  const authenticated = localStorage.getItem("authenticated") === "true";

  if (!token || !authenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
export default ProtectedRoute;
