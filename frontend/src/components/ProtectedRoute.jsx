import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();

  // 1. Safe Token Retriever Utility
  const getValidToken = () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const token = localStorage.getItem('token');
      const rawToken = accessToken || token;

      // Unset/Invalid string values check
      if (!rawToken || rawToken === 'undefined' || rawToken === 'null') {
        return null;
      }

      // Quick JWT Structural Validation (Header.Payload.Signature)
      const tokenParts = rawToken.split('.');
      if (tokenParts.length !== 3) {
        return null;
      }

      return rawToken;
    } catch (error) {
      console.error('Authentication Error:', error);
      return null;
    }
  };

  const authToken = getValidToken();

  // 2. Fallback Logic: Redirect to login with current location preserved
  if (!authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Render Authorized Child Components
  return <Outlet />;
};

export default React.memo(ProtectedRoute);