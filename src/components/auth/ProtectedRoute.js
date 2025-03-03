import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." size="medium" />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};