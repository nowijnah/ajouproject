import React, { useEffect, useState } from 'react';
import { Box, Typography, Fade } from '@mui/material';

const AnimatedLoading = ({ message = '콘텐츠를 불러오는 중입니다', fullPage = false }) => {
  const AJOU_BLUE = 'rgb(0, 51, 161)';
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  // 로딩 애니메이션 진행도
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 1));
    }, 30);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 로딩 메시지의 점(...) 애니메이션
  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearInterval(dotsTimer);
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullPage ? '100vh' : '50vh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'white',
        position: fullPage ? 'fixed' : 'static',
        top: 0,
        left: 0,
        zIndex: fullPage ? 9999 : 1
      }}
    >
      <Fade in={true} timeout={800}>
        <Box sx={{ textAlign: 'center' }}>
          {/* 로고 애니메이션 */}
          <Box
            component="img"
            src="/logo.png"
            alt="AJOU Logo"
            sx={{
              width: { xs: 120, sm: 150 },
              height: 'auto',
              mb: 4,
              animation: 'pulse 1.5s infinite ease-in-out alternate'
            }}
          />

          {/* 진행 막대 */}
          <Box
            sx={{
              width: { xs: 200, sm: 300 },
              height: 4,
              bgcolor: 'rgba(0, 51, 161, 0.1)',
              borderRadius: 2,
              mb: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                bgcolor: AJOU_BLUE,
                borderRadius: 2,
                transition: 'width 0.3s ease-in-out'
              }}
            />
          </Box>

          {/* 로딩 메시지 */}
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontFamily: 'Quicksand, sans-serif',
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {message}{dots}
          </Typography>
        </Box>
      </Fade>

      {/* 애니메이션을 위한 CSS */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default AnimatedLoading;