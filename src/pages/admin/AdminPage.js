// src/pages/admin/AdminPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';

import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';

import { useAuth } from '../../components/auth/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 사용자가 관리자인지 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return <LoadingSpinner message="로그인 상태를 확인하는 중..." />;
  }

  if (currentUser.role !== 'ADMIN') {
    return null; // 이미 useEffect에서 처리했으므로 렌더링하지 않음
  }

  const adminMenus = [
    {
      title: '공지사항 관리',
      description: '공지사항을 게시하고 관리합니다.',
      icon: <NotificationsIcon sx={{ fontSize: 40, color: '#0066CC' }} />,
      action: () => navigate('/admin/notices')
    },
    {
      title: '사용자 관리',
      description: '사용자 계정을 관리하고 권한을 설정합니다.',
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#0066CC' }} />,
      action: () => navigate('/admin/users')
    },
    {
      title: '소프트콘 관리',
      description: '소프트콘 프로젝트를 업로드하고 관리합니다.',
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#0066CC' }} />,
      action: () => navigate('/admin/softcon')
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0A2B5D', fontWeight: 700 }}>
          관리자 대시보드
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          아주대학교 산학협력 플랫폼의 관리자 기능에 접근할 수 있습니다.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {adminMenus.map((menu, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {menu.icon}
                </Box>
                <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  {menu.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {menu.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                <Button 
                  size="large" 
                  variant="contained"
                  onClick={menu.action}
                  sx={{ 
                    bgcolor: '#0066CC',
                    '&:hover': {
                      bgcolor: '#004C99'
                    }
                  }}
                >
                  바로가기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminPage;