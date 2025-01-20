import { createTheme } from '@mui/material';

export const theme = createTheme({
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
          },
          '&:hover fieldset': {
            borderColor: 'rgb(0, 51, 161)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'rgb(0, 51, 161)',
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
    width: 500,
    '& .MuiInputBase-root': {
      height: '35px',
    },
    '& .MuiInputBase-input': {
      paddingLeft: '25px',
    },
  },
};