import { createTheme } from '@mui/material';

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 800,
      md: 1255,
      lg: 1255.1,
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
  // filterBox: {
  //   borderRadius: '5px',
  //   margin: '148px 20px 0px -40px',
  //   padding: '30px 0px 0px 10px',
  //   border: '1px solid #e0e0e0',
  //   width: 190,
  //   height: 400,
  //   flexShrink: 0,
  // },
  searchField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px',
      backgroundColor: '#fff',
      '&:hover': {
        '& > fieldset': {
          borderColor: '#1976d2',
        }
      }
    },
    '& .MuiOutlinedInput-input': {
      padding: '10px 25px',
    }
  },
};

export const contentListStyles = {
  container: {
    px: { xs: 2, sm: 4, md: 6 },
    py: { xs: 2, md: 4 },
    width: '100%',
    padding: '32px 120px 48px 130px !important',
  },
  mainContent: {
    display: 'flex',
    flexDirection: { xs: 'column', lg: 'row' },
    gap: { xs: 3, md: 10 }
  },
  // filterSection: {
  //   minWidth: '190px',
  //   order: -1
  // }
};

export const searchHeaderStyles = {
  container: {
    display: 'flex', 
    flexDirection: {
      xs: 'column',
      sm: 'column',
      md: 'row'
    },
    alignItems: { xs: 'stretch', md: 'center' },
    justifyContent: 'space-between',
    gap: 4,
    mb: 4
  },
  searchArea: {
    display: 'flex', 
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'center', md: 'center' },
    gap: { xs: 3, md: 7 }
  },
  logo: {
    width: { xs: 150, md: 220 },
    height: 'auto',
  },
  searchField: {
    width: { xs: '100%', md: 500 },
    '& .MuiOutlinedInput-input': {
      padding: '10px 15px',
      marginLeft: '8px'
    },
    '& .MuiInputBase-input': {
      marginLeft: '8px'
    }
  },
  buttonGroup: {
    display: 'flex', 
    gap: 2,
    justifyContent: { xs: 'center', lg: 'flex-end' },
    flexWrap: 'wrap'
  },
  button: {
    flexShrink: 0,
    minWidth: 'auto'
  }
};

export const contentCardStyles = {
  card: {
    border: '1px solid #e0e0e0',
    boxShadow: 'none',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  mediaBox: {
    height: { xs: 150, sm: 200 },
    position: 'relative',
    margin: '16px 16px 0 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  title: {
    fontSize: { xs: '1rem', sm: '1.25rem' },
    fontWeight: 600,
    mb: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  description: {
    fontSize: { xs: '0.875rem', sm: '1rem' },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical'
  },
  additionalInfo: {
    mt: 1,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontStyle: 'italic',
    opacity: 0.8
  }
};

// export const filterSectionStyles = {
//   box: {
//     borderRadius: '5px',
//     border: '1px solid #e0e0e0',
//     width: { xs: '100%', sm: '100%', md: '100%' },
//     margin: { 
//       xs: '0',
//       sm: '0px 0px 0px 0px',
//       md: '0px 13px 0px 13px'
//     },
//     padding: { 
//       xs: '30px 30px 0px 30px',
//       sm: '30px 30px 0px 30px',
//       md: '30px 30px 0px 30px'
//     },
//     backgroundColor: '#fff',
//     display: 'flex',
//     flexDirection: 'column'
//   },
//   expandButton: {
//     width: '100%',
//     justifyContent: 'center',
//     color: 'primary.main',
//     marginTop: 1,
//     marginBottom: 3,
//     '&:hover': {
//       backgroundColor: 'transparent',
//     }
//   },
  // filterItem: {
  //   checkbox: {
  //     color: 'rgb(0, 51, 161)',
  //     '&.Mui-checked': {
  //       color: 'rgb(0, 51, 161)',
  //     },
  //     '& .MuiSvgIcon-root': {
  //       fontSize: 20,
  //     }
  //   },
  //   label: {
  //     fontSize: '0.95rem',
  //     fontWeight: 350,
  //     color: '#333'
  //   }
  // }
//};