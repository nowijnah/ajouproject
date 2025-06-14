import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { Button } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import NotificationMenu from './notifications/NotificationMenu';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
    cursor: 'pointer', // 클릭 가능함을 표시
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
    transition: 'all 0.3s ease'
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
    transition: 'all 0.3s ease'  // 모든 속성 변화에 부드러운 전환 효과 적용
  },
  activeLink: {
    fontWeight: 500,
    position: 'relative'
  },
  activeLinkIndicator: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    width: '70%',
    height: '4px',
    backgroundColor: AJOU_BLUE,
    borderRadius: '4px',
    transform: 'translateX(-50%)',
    boxShadow: '0 1px 3px rgba(0, 51, 161, 0.3)'
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
  },
  roleChip: {
    marginLeft: '8px',
    height: '22px',
    fontSize: '0.7rem',
    fontWeight: 500,
    backgroundColor: 'rgba(0, 51, 161, 0.08)',
    color: AJOU_BLUE,
    border: '1px solid rgba(0, 51, 161, 0.2)'
  },
  adminRoleChip: {
    marginLeft: '8px',
    height: '22px',
    fontSize: '0.7rem',
    fontWeight: 500,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    color: '#d32f2f',
    border: '1px solid rgba(211, 47, 47, 0.2)'
  },
  // 프로필 팝오버 스타일
  profilePopover: {
    p: 3,
    width: 300,
    maxWidth: '90vw',
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    mb: 2,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    mb: 2,
  },
  profileName: {
    fontWeight: 600,
    mb: 0.5,
  },
  profileDetail: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    mb: 2,
  },
  profileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    py: 1,
  },
  adminButton: {
    backgroundColor: '#d32f2f',
    color: 'white',
    '&:hover': {
      backgroundColor: '#b71c1c',
    },
    mt: 2,
    width: '100%',
  },
  normalButton: {
    backgroundColor: '#757575',
    color: 'white',
    '&:hover': {
      backgroundColor: '#616161',
    },
    mt: 2,
    width: '100%',
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

// 사용자 역할 변환 함수
const getRoleText = (role) => {
  switch(role) {
    case 'STUDENT': return '학생';
    case 'COMPANY': return '기업';
    case 'PROFESSOR': return '교수';
    case 'ADMIN': return '관리자';
    default: return '일반';
  }
};

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery('(max-width:900px)');
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  
  // 프로필 팝오버 상태 관리
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfilePopoverOpen = Boolean(profileAnchorEl);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleMyPageClick = () => {
    navigate('/mypage');
    handleProfileClose();
  };

  // 관리자 모드 전환 함수
  const handleSwitchToAdmin = async () => {
    if (!currentUser) return;
    
    try {
      // 현재 역할을 originalRole에 저장하고 역할을 관리자로 변경
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        originalRole: currentUser.role, // 현재 역할 저장
        role: 'ADMIN'
      });
      
      // 페이지 새로고침 (AuthContext가 최신 사용자 정보를 가져오도록)
      window.location.reload();
    } catch (error) {
      console.error('Error switching to admin:', error);
      alert('관리자 모드 전환 중 오류가 발생했습니다.');
    }
  };

  // 일반 모드 전환 함수
  const handleSwitchToNormal = async () => {
    if (!currentUser) return;
    
    try {
      // 사용자의 원래 역할로 되돌리기
      const userRef = doc(db, 'users', currentUser.uid);
      // 원래 역할이 저장되어 있지 않으면 기본값으로 STUDENT 설정
      let originalRole = currentUser.originalRole || 'STUDENT';
      
      await updateDoc(userRef, {
        role: originalRole
      });
      
      // 페이지 새로고침 (AuthContext가 최신 사용자 정보를 가져오도록)
      window.location.reload();
    } catch (error) {
      console.error('Error switching to normal role:', error);
      alert('일반 모드 전환 중 오류가 발생했습니다.');
    }
  };

  // 현재 페이지 확인 함수
  const isActivePage = (path) => {
    return location.pathname.startsWith(path);
  };

  // 링크 스타일 계산 함수
  const getLinkStyle = (path) => ({
    ...styles.link,
    ...(isActivePage(path) && styles.activeLink),
    position: 'relative'
  });

  return (
    <AppBar position="fixed" color="inherit">
      <Toolbar sx={styles.toolbar}>
        <LogoComponent />
        <div style={styles.rightGroup}>
          <Box sx={{ position: 'relative' }}>
            <RouterLink to="/portfolios" style={getLinkStyle('/portfolios')}>
              <Typography 
                variant='body2' 
                sx={{ 
                  ...styles.text,
                  fontWeight: isActivePage('/portfolios') ? 600 : 400,
                  color: isActivePage('/portfolios') ? AJOU_BLUE : 'inherit',
                  transform: isActivePage('/portfolios') ? 'scale(1.05)' : 'scale(1)',
                  textShadow: isActivePage('/portfolios') ? '0 0 0.5px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                포트폴리오
              </Typography>
              {isActivePage('/portfolios') && <div style={styles.activeLinkIndicator}></div>}
            </RouterLink>
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            <RouterLink to="/companies" style={getLinkStyle('/companies')}>
              <Typography 
                variant='body2' 
                sx={{ 
                  ...styles.text,
                  fontWeight: isActivePage('/companies') ? 600 : 400,
                  color: isActivePage('/companies') ? AJOU_BLUE : 'inherit',
                  transform: isActivePage('/companies') ? 'scale(1.05)' : 'scale(1)',
                  textShadow: isActivePage('/companies') ? '0 0 0.5px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                기업
              </Typography>
              {isActivePage('/companies') && <div style={styles.activeLinkIndicator}></div>}
            </RouterLink>
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            <RouterLink to="/labs" style={getLinkStyle('/labs')}>
              <Typography 
                variant='body2' 
                sx={{ 
                  ...styles.text,
                  fontWeight: isActivePage('/labs') ? 600 : 400,
                  color: isActivePage('/labs') ? AJOU_BLUE : 'inherit',
                  transform: isActivePage('/labs') ? 'scale(1.05)' : 'scale(1)',
                  textShadow: isActivePage('/labs') ? '0 0 0.5px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                연구실
              </Typography>
              {isActivePage('/labs') && <div style={styles.activeLinkIndicator}></div>}
            </RouterLink>
          </Box>
          
          {currentUser ? (
            <>
              <Box sx={{ position: 'relative' }}>
                {isAdmin ? (
                  <RouterLink to="/admin" style={getLinkStyle('/admin')}>
                    <Typography 
                      variant='body2' 
                      sx={{ 
                        ...styles.text,
                        fontWeight: isActivePage('/admin') ? 600 : 400,
                        color: isActivePage('/admin') ? '#d32f2f' : 'inherit',
                        transform: isActivePage('/admin') ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      관리자
                    </Typography>
                    {isActivePage('/admin') && <div style={{...styles.activeLinkIndicator, backgroundColor: '#d32f2f'}}></div>}
                  </RouterLink>
                ) : (
                  <RouterLink to="/mypage" style={getLinkStyle('/mypage')}>
                    <Typography 
                      variant='body2' 
                      sx={{ 
                        ...styles.text,
                        fontWeight: isActivePage('/mypage') ? 500 : 300,
                        color: isActivePage('/mypage') ? AJOU_BLUE : 'inherit'
                      }}
                    >
                      MyPage
                    </Typography>
                    {isActivePage('/mypage') && <div style={styles.activeLinkIndicator}></div>}
                  </RouterLink>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* 여기에 NotificationMenu 컴포넌트 추가 */}
                <NotificationMenu />
                
                <RouterLink onClick={handleSignOut} style={{ textDecoration: 'none' }}>
                  <button style={styles.button}>Sign out</button>
                </RouterLink>
                
                {!isSmallScreen && (
                  <Box 
                    sx={styles.userProfile}
                    onClick={handleProfileClick}
                  >
                    <Avatar 
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      sx={styles.avatar}
                    >
                      {!currentUser.photoURL && currentUser.displayName?.[0]}
                    </Avatar>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={styles.userName}>
                        {currentUser.displayName}
                      </Typography>
                      {currentUser.role && (
                        <Chip 
                          label={getRoleText(currentUser.role)} 
                          size="small"
                          sx={isAdmin ? styles.adminRoleChip : styles.roleChip}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* 프로필 팝오버 추가 */}
              <Popover
                open={isProfilePopoverOpen}
                anchorEl={profileAnchorEl}
                onClose={handleProfileClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Paper sx={styles.profilePopover}>
                  {/* 프로필 헤더 섹션 */}
                  <Box sx={styles.profileSection}>
                    <Avatar 
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      sx={styles.largeAvatar}
                    >
                      {!currentUser.photoURL && currentUser.displayName?.[0]}
                    </Avatar>
                    <Typography variant="h6" sx={styles.profileName}>
                      {currentUser.displayName || '사용자'}
                    </Typography>
                    <Chip 
                      label={getRoleText(currentUser.role)} 
                      size="small"
                      color={isAdmin ? "error" : "primary"}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* 사용자 정보 섹션 */}
                  <Box sx={styles.profileDetail}>
                    <Box sx={styles.profileItem}>
                      <Typography variant="body2" color="text.secondary">이메일</Typography>
                      <Typography variant="body2">{currentUser.email}</Typography>
                    </Box>
                    
                    {(currentUser.role === 'STUDENT' || currentUser.role === 'PROFESSOR') && (
                      <Box sx={styles.profileItem}>
                        <Typography variant="body2" color="text.secondary">학과</Typography>
                        <Typography variant="body2">{currentUser.major || '정보 없음'}</Typography>
                      </Box>
                    )}
                    
                    <Box sx={styles.profileItem}>
                      <Typography variant="body2" color="text.secondary">계정 유형</Typography>
                      <Typography variant="body2">
                        {currentUser.email.endsWith('@ajou.ac.kr') ? '아주대학교 계정' : '일반 계정'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={handleMyPageClick}
                    sx={{ mb: 1 }}
                  >
                    마이페이지
                  </Button>
                  
                  {/* 관리자일 때는 일반 모드로 전환 버튼 표시 */}
                  {isAdmin && (
                    <Button 
                      variant="contained"
                      onClick={handleSwitchToNormal}
                      sx={styles.normalButton}
                    >
                      일반 모드로 전환
                    </Button>
                  )}
                  
                  {/* 관리자가 아닐 때는 관리자 모드로 전환 버튼 표시 (ADMIN 역할로 설정된 계정은 항상 관리자) */}
                  {currentUser.admin === true && !isAdmin && (
                    <Button 
                      variant="contained"
                      onClick={handleSwitchToAdmin}
                      sx={styles.adminButton}
                    >
                      관리자 모드로 전환
                    </Button>
                  )}
                </Paper>
              </Popover>
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