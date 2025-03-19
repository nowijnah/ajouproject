import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Box,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Chrome, Mail, Lock, User } from "lucide-react";
import { useAuth } from "./AuthContext";

const AJOU_BLUE = "#0A2B5D";

export const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("STUDENT"); // 기본값: 학생
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const handleRoleChange = (event, newValue) => {
    setRole(newValue);
    setError("");
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !companyName) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(email, password, companyName);
      navigate("/");
    } catch (error) {
      setError("회원가입 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (error) {
      setError("Google 회원가입 실패: " + error.message);
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
        <Tabs
          value={role}
          onChange={handleRoleChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            "& .MuiTabs-indicator": { backgroundColor: AJOU_BLUE },
            "& .Mui-selected": { color: AJOU_BLUE },
          }}
        >
          <Tab label="학생/교수" value="STUDENT" />
          <Tab label="기업" value="COMPANY" />
        </Tabs>
        {role === "COMPANY" ? (
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
              sx={{ mt: 3, bgcolor: AJOU_BLUE }}
            >
              회원가입
            </Button>
          </form>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGoogleSignUp}
              startIcon={<Chrome />}
              sx={{  mt: 3, mb: 2, bgcolor: AJOU_BLUE, py: 1.5, "&:hover": { bgcolor: "#0D3B7D" } }}
            >
              아주대학교 계정으로 회원가입
            </Button>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>@ajou.ac.kr 계정만 사용 가능합니다</Typography>
          </Box>
        )}
      </Paper>

      </Box>
    </Container>
  );
};