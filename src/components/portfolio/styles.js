import { createTheme } from '@mui/material';

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 800,
      md: 1280,
      lg: 1281,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: 'rgb(0, 51, 161)',
      contrastText: '#fff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          border: '2px primary',
          height: '35px',
          padding: '6px 16px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          '& fieldset': {
            borderColor: 'rgb(0, 51, 161)',
            borderWidth: '2px'  
          },
          '&:hover fieldset': {
            borderColor: 'rgb(0, 51, 161) !important',  // 호버 상태에서 색상 고정
            borderWidth: '1.5px' 
          },
          '&.Mui-focused fieldset': {
            borderColor: 'rgb(0, 51, 161)',
            borderWidth: '2px'
          },
        },
      },
    },
  },
});

export const commonStyles = {
  quicksandFont: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 300,
    letterSpacing: 1.2,
  },
  filterBox: {
    borderRadius: '5px',
    margin: '148px 20px 0px -50px',
    padding: '30px 0px 0px 30px',
    border: '1px solid #e0e0e0',
    width: 190,
    height: 400,
    flexShrink: 0,
  },
  searchField: {
    '& .MuiInputBase-root': {
      height: '45px',
    },
    '& .MuiInputBase-input': {
      paddingLeft: '25px',
    },
  },
};