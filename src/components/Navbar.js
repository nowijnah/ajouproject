// components/Navbar.js
import React from 'react';
import { Typography, AppBar, Toolbar, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

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
    <RouterLink to="/" style={styles.link}>
      <img src="/logo.png" alt="로고" style={styles.logo} />
    </RouterLink>
  );
}

export default function Navbar() {
  return (
    <AppBar position="fixed" color="inherit">
      <Toolbar sx={styles.toolbar}>
        <LogoComponent />
        <div style={styles.rightGroup}>
          <Typography variant='body2' color="#000000" sx={styles.text}>Contact</Typography>
          <RouterLink to="/portfolio" style={styles.link}>
            <Typography variant='body2' color="#000000" sx={styles.text}>포트폴리오</Typography>
          </RouterLink>
          <RouterLink to="/company" style={styles.link}>
          <Typography variant='body2' color="#000000" sx={styles.text}>기업</Typography>
          </RouterLink>
          <RouterLink to="/lab" style={styles.link}>
          <Typography variant='body2' color="#000000" sx={styles.text}>연구실</Typography>
          </RouterLink>
          <Typography variant='body2' color="#000000" sx={styles.text}>MyPage</Typography>
          <button style={styles.button}>Sign in</button>
          <button style={styles.button}>Register</button>
        </div>
      </Toolbar>
    </AppBar>
  );
}