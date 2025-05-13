import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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

// 관리자 전용 라우트 추가
export const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." size="medium" />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  if (currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};