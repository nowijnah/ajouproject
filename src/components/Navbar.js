// Navbar.js

import React from 'react';
import { Typography, AppBar, Toolbar, useMediaQuery, Box, Avatar } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const AJOU_BLUE = 'rgb(0, 51, 161)';

const styles = {
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
    padding: '7px 13px 7px 13px',
    marginLeft: '10px',
  },
  userName: {
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '0.9rem',
    color: '#000000',
    whiteSpace: 'nowrap'
  },
  avatar: {
    width: 32,
    height: 32,
    cursor: 'pointer'
  },
  logo: {
    height: '40px'
  },
  text: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 300,
    letterSpacing: 1.2,
    marginLeft: '5px',
    whiteSpace: 'nowrap',
    transition: 'all'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    overflowX: 'auto',
    minHeight: '64px',
    padding: '0 20px'
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexShrink: 0
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  link: {
    textDecoration: 'none',
    color: '#000000',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: 300,
    transition: 'all'  // 모든 속성 변화에 부드러운 전환 효과 적용
  },
  activeLink: {
    fontWeight: 500
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexShrink: 0
  },
  siteTitle: {
    color: AJOU_BLUE,
    fontWeight: 800,
    fontSize: '1.5rem',
    padding: '5px 0 0 0',
    transform: 'scaleY(0.9)',
    fontFamily: 'Quicksand, sans-serif',
    whiteSpace: 'nowrap'
  }
};

function LogoComponent() {
  const isSmallScreen = useMediaQuery('(max-width:700px)');
  return (
    <RouterLink to="/" style={{ ...styles.link, ...styles.logoContainer }}>
      <img src="/logo.png" alt="로고" style={styles.logo} />
      {!isSmallScreen && (
        <Typography sx={styles.siteTitle}>
          AIM AJOU
        </Typography>
      )}
    </RouterLink>
  );
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery('(max-width:900px)');

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/mypage');
  };

  // 현재 페이지 확인 함수
  const isActivePage = (path) => {
    return location.pathname.startsWith(path);
  };

  // 링크 스타일 계산 함수
  const getLinkStyle = (path) => ({
    ...styles.link,
    ...(isActivePage(path) && styles.activeLink),
  });

  return (
    <AppBar position="fixed" color="inherit">
    <Toolbar sx={styles.toolbar}>
      <LogoComponent />
      <div style={styles.rightGroup}>
        <RouterLink to="/portfolios" style={getLinkStyle('/portfolios')}>
          <Typography 
            variant='body2' 
            sx={{ 
              ...styles.text,
              fontWeight: isActivePage('/portfolios') ? 500 : 300
            }}
          >
            포트폴리오
          </Typography>
        </RouterLink>
        <RouterLink to="/companies" style={getLinkStyle('/companies')}>
          <Typography 
            variant='body2' 
            sx={{ 
              ...styles.text,
              fontWeight: isActivePage('/companies') ? 500 : 300
            }}
          >
            기업
          </Typography>
        </RouterLink>
        <RouterLink to="/labs" style={getLinkStyle('/labs')}>
          <Typography 
            variant='body2' 
            sx={{ 
              ...styles.text,
              fontWeight: isActivePage('/labs') ? 500 : 300
            }}
          >
            연구실
          </Typography>
        </RouterLink>
        {currentUser ? (
            <>
        <RouterLink to="/mypage" style={getLinkStyle('/mypage')}>
          <Typography 
            variant='body2' 
            sx={{ 
              ...styles.text,
              fontWeight: isActivePage('/mypage') ? 500 : 300
            }}
          >
            MyPage
          </Typography>
        </RouterLink>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RouterLink onClick={handleSignOut} style={{ textDecoration: 'none' }}>
                  <button style={styles.button}>Sign out</button>
                </RouterLink>
                {!isSmallScreen && (
                  <Box sx={styles.userProfile}>
                    <Avatar 
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      onClick={handleProfileClick}
                      sx={styles.avatar}
                    >
                      {!currentUser.photoURL && currentUser.displayName?.[0]}
                    </Avatar>
                    <Typography sx={styles.userName}>
                      {currentUser.displayName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
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