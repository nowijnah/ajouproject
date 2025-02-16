import React from 'react';
import { Typography, AppBar, Toolbar, Button } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const styles = {
  logo: {
    height: '40px'
  },
  text: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 300,
    letterSpacing: 1.2,
    marginLeft: '5px'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',  // 로고와 텍스트 사이 간격
  },
  siteTitle: {
    color: '#0A2B5D',
    fontWeight: 800,
    fontSize: '2rem',
    padding: '5px 0 0 0',
    transform: 'scaleY(0.9)',
    fontFamily: 'Quicksand, sans-serif',
  }
};

// 네비게이션 항목 설정
const navItems = [
  { label: 'Contact', path: '/contact' },
  { label: '포트폴리오', path: '/portfolio' },
  { label: '기업', path: '/company' },
  { label: '연구실', path: '/lab' },
  { label: 'MyPage', path: '/mypage' }
];

function LogoComponent() {
  return (
    <RouterLink to="/" style={{ ...styles.link, ...styles.logoContainer }}>
      <img src="/logo.png" alt="로고" style={styles.logo} />
      <Typography sx={styles.siteTitle}>
        AIM AJOU
      </Typography>
    </RouterLink>
  );
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppBar position="fixed" color="inherit">
      <Toolbar sx={styles.toolbar}>
        <LogoComponent />
        <div style={styles.rightGroup}>
          <RouterLink to="/portfolios" style={styles.link}>
            <Typography variant='body2' color="#000000" sx={styles.text}>포트폴리오</Typography>
          </RouterLink>
          <RouterLink to="/companies" style={styles.link}>
          <Typography variant='body2' color="#000000" sx={styles.text}>기업</Typography>
          </RouterLink>
          <RouterLink to="/labs" style={styles.link}>
          <Typography variant='body2' color="#000000" sx={styles.text}>연구실</Typography>
          </RouterLink>
          <RouterLink to="/mypage" style={styles.link}>
          <Typography variant='body2' color="#000000" sx={styles.text}>MyPage</Typography>
          </RouterLink>
          {currentUser ? (
            <RouterLink onClick={handleSignOut} style={{ textDecoration: 'none' }}>
              <button style={styles.button}>Sign out</button>
            </RouterLink>
          ) : (
            <>
              <RouterLink to="/signin" style={{ textDecoration: 'none' }}>
                <button style={styles.button}>Sign in</button>
              </RouterLink>
              <RouterLink to="/signup" style={{ textDecoration: 'none' }}>
                <button style={styles.button}>Register</button>
              </RouterLink>
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}