// ProtectedRoute.js - 기존 파일을 이것으로 교체

import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." size="medium" />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // 차단된 사용자 처리 강화
  if (currentUser.isBlocked === true) {
    return (
      <Container maxWidth="md" sx={{ pt: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              계정이 차단되었습니다
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              이 계정은 관리자에 의해 차단되어 서비스 이용이 제한됩니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              문의사항이 있으시면 관리자에게 연락해주세요.
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            color="error" 
            onClick={logout}
            sx={{ mt: 2 }}
          >
            로그아웃
          </Button>
        </Box>
      </Container>
    );
  }

  return children;
};

// 관리자 전용 라우트 - admin 필드 확인으로 수정
export const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." size="medium" />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // admin 필드로 관리자 권한 확인
  if (currentUser.admin !== true && currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 댓글 작성이 필요한 기능에 대한 라우트 강화
export const CommentProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." size="medium" />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // 로그인 차단 확인
  if (currentUser.isBlocked === true) {
    return <Navigate to="/" replace />;
  }

  // 댓글 금지 확인
  if (currentUser.isCommentBanned === true) {
    return (
      <Container maxWidth="md" sx={{ pt: 8 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            댓글 작성이 제한되었습니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            이 계정은 관리자에 의해 댓글 작성이 제한되어 이 기능을 사용할 수 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            문의사항이 있으시면 관리자에게 연락해주세요.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return children;
};