import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import React from 'react';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // 로딩 중일 때 보여줄 거 정하기
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};