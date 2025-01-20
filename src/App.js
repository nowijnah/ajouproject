import React from 'react';
import { Typography, AppBar, Toolbar } from '@mui/material';
// test용
import Comments from './components/comments/Comments';

const styles = {
  logo: {
    height: '40px'
  },
  text: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 300,
    letterSpacing: 1.2,
    marginLeft: '5px'  // 텍스트 사이 간격
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between'  // 로고와 오른쪽 그룹 사이 공간 분배
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'  // 요소들 사이 간격
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  }
};

function Component() {
    return <img src="/logo.png" alt="로고" style={styles.logo} />;
}

export default function App() {
  return (
    <React.Fragment>
      <AppBar position="fixed" color="inherit">
        <Toolbar sx={styles.toolbar}>
          <Component />
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
      {/* testing 용 */}
      <Toolbar />
      <Comments/>
    </React.Fragment>
  );
}