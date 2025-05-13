// src/components/auth/SignUp.js - admin 필드 추가
import React, { useState } from "react";
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Mail, Lock, User } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const AJOU_BLUE = "#0A2B5D";

export const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !companyName) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      // 기업 회원가입 시 admin 필드는 false로 설정됨
      // 이 필드는 AuthContext에서 이미 기본값으로 설정됨
      await signUpWithEmail(email, password, companyName);
      navigate("/");
    } catch (error) {
      setError("회원가입 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: isMobile ? 4 : 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, color: AJOU_BLUE, fontWeight: "bold" }}>
        AIM AJOU
      </Typography>
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}
        <Typography variant="h7" component="h2" sx={{ mb: 3, textAlign: "center" }}>
          기업 회원가입
        </Typography>
        <form onSubmit={handleEmailSignUp}>
          <TextField
            fullWidth
            label="회사명"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2, bgcolor: AJOU_BLUE, py: 1.5, "&:hover": { bgcolor: "#0D3B7D" } }}
          >
            회원가입
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            학생/교수님은 <Button 
              variant="text" 
              component={RouterLink} 
              to="/signin" 
              sx={{ p: 0, minWidth: 'auto', textTransform: 'none', color: AJOU_BLUE, fontWeight: 'medium' }}
            >
              로그인 페이지
            </Button>에서 아주대학교 계정으로 로그인해 주세요.
          </Typography>
        </Box>
      </Paper>
      </Box>
    </Container>
  );
};