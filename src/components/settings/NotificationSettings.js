// components/settings/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { 
  Notifications as NotificationsIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

const NotificationSettings = () => {
  const { currentUser } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 사용자의 현재 알림 설정 가져오기
  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // 기본값은 true, 명시적으로 false인 경우에만 false로 설정
          setEmailNotifications(userData.emailNotifications !== false);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        setSnackbar({
          open: true,
          message: '알림 설정을 불러오는데 실패했습니다',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser]);

  // 알림 설정 저장
  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      // 로컬 데이터베이스 업데이트
      await updateDoc(doc(db, 'users', currentUser.uid), {
        emailNotifications: emailNotifications,
        updatedAt: new Date()
      });
      
      // Firebase Function 호출하여 설정 업데이트
      const updateNotificationSettings = httpsCallable(functions, 'updateNotificationSettings');
      await updateNotificationSettings({ emailNotifications });
      
      setSnackbar({
        open: true,
        message: '알림 설정이 저장되었습니다',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSnackbar({
        open: true,
        message: '알림 설정 저장에 실패했습니다',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          알림 설정
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          이메일 알림
        </Typography>
        
        <Box sx={{ ml: 2, mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                disabled={loading || saving}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body1">댓글 및 답글 알림</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  내 게시글에 새 댓글이 달리거나 내 댓글에 답글이 달릴 때 이메일로 알림을 받습니다.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={loading || saving}
        >
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default NotificationSettings;