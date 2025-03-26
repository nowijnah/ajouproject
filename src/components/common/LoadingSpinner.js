import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const LoadingSpinner = ({ message = '로딩 중...', size = 'medium' }) => {
  // AJOU 대학 색상
  const AJOU_BLUE = 'rgb(0, 51, 161)';

  // 크기에 따른 스타일 설정
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          spinner: 30,
          thickness: 3,
          minHeight: '100px',
          fontSize: '0.875rem'
        };
      case 'large':
        return {
          spinner: 80,
          thickness: 5,
          minHeight: '70vh',
          fontSize: '1.25rem'
        };
      case 'medium':
      default:
        return {
          spinner: 60,
          thickness: 4,
          minHeight: '50vh',
          fontSize: '1rem'
        };
    }
  };

  const sizeConfig = getSize();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: sizeConfig.minHeight,
        gap: 2
      }}
    >
      <CircularProgress
        size={sizeConfig.spinner}
        thickness={sizeConfig.thickness}
        sx={{
          color: AJOU_BLUE,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      {message && (
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            mt: 2,
            fontWeight: 500,
            fontFamily: 'Quicksand, sans-serif',
            fontSize: sizeConfig.fontSize
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;