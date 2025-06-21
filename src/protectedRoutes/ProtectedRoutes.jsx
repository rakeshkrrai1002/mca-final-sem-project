import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../components/userContext/userContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user || !user.token) {
    return <Navigate to="/loginwithpassword" replace />;
    // window.location.href = '/loginwithpassword';

  }
  return children;
};

export default ProtectedRoute;
