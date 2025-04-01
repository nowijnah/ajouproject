// pages/SettingsPage.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useAuth } from '../components/auth/AuthContext';
import NotificationSettings from '../components/settings/NotificationSettings';
import AnimatedLoading from '../components/common/AnimatedLoading';

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!currentUser) {
    return <AnimatedLoading message="로그인이 필요합니다" />;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pt: '64px' }}>
      <Box sx={{ 
        width: '100%',
        backgroundColor: 'white',
        py: 6,
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            사용자 설정
          </Typography>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { 
                fontWeight: 500,
                px: 3
              }
            }}
          >
            <Tab label="알림 설정" />
            <Tab label="계정 정보" />
            <Tab label="개인정보 보호" />
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {activeTab === 0 && (
          <NotificationSettings />
        )}
        
        {activeTab === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              계정 정보
            </Typography>
            <Typography>
              계정 정보 설정 화면입니다. (추후 구현 예정)
            </Typography>
          </Paper>
        )}
        
        {activeTab === 2 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              개인정보 보호
            </Typography>
            <Typography>
              개인정보 보호 설정 화면입니다. (추후 구현 예정)
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SettingsPage;