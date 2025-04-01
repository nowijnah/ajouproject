// src/components/auth/ProtectedAdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export const ProtectedAdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 상태를 확인하는 중..." />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  if (currentUser.role !== 'ADMIN') {
    // 관리자가 아닌 경우 홈으로 리다이렉트
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;