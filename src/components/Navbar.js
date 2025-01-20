// components/Navbar.js
import React from 'react';
import { Typography, AppBar, Toolbar } from '@mui/material';

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
    gap: '10px'
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  }
};

function LogoComponent() {
    return <img src="/logo.png" alt="로고" style={styles.logo} />;
}

export default function Navbar() {
  return (
    <AppBar position="fixed" color="inherit">
      <Toolbar sx={styles.toolbar}>
        <LogoComponent />
        <div style={styles.rightGroup}>
          <Typography variant='body2' color="#000000" sx={styles.text}>Contact</Typography>
          <Typography variant='body2' color="#000000" sx={styles.text}>포트폴리오</Typography>
          <Typography variant='body2' color="#000000" sx={styles.text}>기업</Typography>
          <Typography variant='body2' color="#000000" sx={styles.text}>연구실</Typography>
          <Typography variant='body2' color="#000000" sx={styles.text}>MyPage</Typography>
          <button style={styles.button}>Sign in</button>
          <button style={styles.button}>Register</button>
        </div>
      </Toolbar>
    </AppBar>
  );
}