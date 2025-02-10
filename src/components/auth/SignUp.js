import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Tabs,
  Tab,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  TextareaAutosize
} from '@mui/material';
import { Chrome, EyeOff, Eye, Mail, Lock, User } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
} from 'firebase/auth';
<<<<<<< HEAD
import { auth, db } from '../../firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

=======
import { auth, db } from '../../firebase';  // firebase 설정 파일 경로에 맞게 수정
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


>>>>>>> d858f3a (signup&signin)
const AJOU_BLUE = '#0A2B5D';

export const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (event, newValue) => {
    setRole(newValue);
    setError('');
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (role !== 2) {
      setError('기업 회원만 이메일 회원가입이 가능합니다.');
      return;
    }

    try {
<<<<<<< HEAD

      if (!email || !password || !displayName || !description) {
        setError('모든 필드를 입력해주세요.');
        return;
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);

=======
      const result = await createUserWithEmailAndPassword(auth, email, password);
>>>>>>> d858f3a (signup&signin)
      await setDoc(doc(db, 'users', result.user.uid), {
        userId: result.user.uid,
        email,
        displayName,
        description,
        role: 'default',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
<<<<<<< HEAD
      
=======
>>>>>>> d858f3a (signup&signin)
      navigate('/');
    } catch (error) {
      setError('회원가입에 실패했습니다.');
    }
  };

  const handleGoogleSignUp = async () => {
    if (role === 2) {
      setError('기업 회원은 이메일로 가입해주세요.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const email = result.user.email;
      if (!email.endsWith('@ajou.ac.kr')) {
        setError('아주대학교 계정으로만 가입이 가능합니다.');
        await auth.signOut();
        return;
      }

<<<<<<< HEAD
=======
      // 추가 정보 입력을 위한 상태 업데이트
>>>>>>> d858f3a (signup&signin)
      setShowDescriptionForm(true);
      setTempUserData(result.user);
    } catch (error) {
      setError('Google 회원가입에 실패했습니다.');
    }
  };

  // 구글 로그인 후 추가 정보 입력 폼
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  const handleDescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', tempUserData.uid), {
        userId: tempUserData.uid,
        email: tempUserData.email,
        displayName: tempUserData.displayName,
        description,
<<<<<<< HEAD
        role: 'STUDENT',
=======
        role: role === 0 ? 'STUDENT' : 'PROFESSOR',
>>>>>>> d858f3a (signup&signin)
        profileImage: tempUserData.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      navigate('/');
    } catch (error) {
      setError('추가 정보 저장에 실패했습니다.');
    }
  };

  if (showDescriptionForm) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Typography variant="h4" align="center" gutterBottom>
            추가 정보 입력
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleDescriptionSubmit}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="자기소개"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              placeholder="자신을 소개해주세요"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ 
                mt: 3,
                bgcolor: AJOU_BLUE,
                '&:hover': {
                  bgcolor: '#0D3B7D'
                }
              }}
            >
              완료
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          회원가입
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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

        {role === 2 ? (
          <form onSubmit={handleEmailSignUp}>
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
            <TextField
              fullWidth
              label="회사명"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="회사 소개"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              placeholder="회사를 소개해주세요"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ 
                mt: 3,
                bgcolor: AJOU_BLUE,
                '&:hover': {
                  bgcolor: '#0D3B7D'
                }
              }}
            >
              회원가입
            </Button>
          </form>
        ) : (
          <Button
            fullWidth
            variant="contained"
            onClick={handleGoogleSignUp}
            startIcon={<Chrome />}
            sx={{ 
              mt: 2,
              bgcolor: AJOU_BLUE,
              '&:hover': {
                bgcolor: '#0D3B7D'
              }
            }}
          >
            아주대학교 계정으로 회원가입
          </Button>
        )}

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            이미 계정이 있으신가요?{' '}
            <Link 
              component={RouterLink} 
              to="/signin"
              sx={{ 
                color: AJOU_BLUE,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              로그인
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};