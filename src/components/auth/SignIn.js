import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Box,
  Link,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Chrome, EyeOff, Eye, Mail, Lock } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AJOU_BLUE = '#0A2B5D';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState(0); // 0: 학생,교수, 1: 기업
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRoleChange = (event, newValue) => {
    setRole(newValue);
    setError('');
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (role !== 1) { // 기업이 아닌 경우
      setError('기업 회원만 이메일 로그인이 가능합니다.');
      return;
    }
    try {
      await login(email, password);
      navigate('/');  
    } catch (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (role === 1) { // 기업인 경우
      setError('기업 회원은 이메일로 로그인해주세요.');
      return;
    }
    try {
      await loginWithGoogle();
      navigate('/');  
    } catch (error) {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  const renderLoginForm = () => {
    if (role === 1) { // 기업 로그인
      return (
        <Box component="form" onSubmit={handleEmailSignIn} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={20} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2, 
              bgcolor: AJOU_BLUE,
              py: 1.5,
              '&:hover': {
                bgcolor: '#0D3B7D'
              }
            }}
          >
            로그인
          </Button>
        </Box>
      );
    }

    // 학생/교수 로그인
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleGoogleSignIn}
          startIcon={<Chrome />}
          sx={{ 
            mt: 3, 
            mb: 2, 
            bgcolor: AJOU_BLUE,
            py: 1.5,
            '&:hover': {
              bgcolor: '#0D3B7D'
            }
          }}
        >
          아주대학교 계정으로 로그인
        </Button>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          @ajou.ac.kr 계정만 사용 가능합니다
        </Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: isMobile ? 4 : 8
        }}
      >
        {/*웹 이름*/}
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 4, 
            color: AJOU_BLUE,
            fontWeight: 'bold'
          }}
        >
          AIM AJOU
        </Typography>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            borderRadius: 2
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 1
              }}
            >
              {error}
            </Alert>
          )}

          <Tabs 
            value={role} 
            onChange={handleRoleChange} 
            variant="fullWidth" 
            sx={{ 
              mb: 3,
              '& .MuiTabs-indicator': {
                backgroundColor: AJOU_BLUE,
              },
              '& .Mui-selected': {
                color: AJOU_BLUE,
              }
            }}
          >
            <Tab label="학생/교수" />
            <Tab label="기업" />
          </Tabs>

          {renderLoginForm()}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              계정이 없으신가요?{' '}
              <Link 
                component={RouterLink} 
                to="/signup" 
                sx={{ 
                  color: AJOU_BLUE,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                회원가입
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};