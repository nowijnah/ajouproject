import React from 'react';
import { 
  TextField,
  Box,
  Button,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { commonStyles } from './styles';

const styles = {
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
    ...commonStyles.searchField,
    width: { xs: '100%', md: 500 }
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

const SearchHeader = ({ 
  searchText,
  setSearchText,
  handleSearch,
  activeSort,
  handleSortChange,
  sortButtons
}) => {
  return (
    <Box sx={styles.container}>
      <Box sx={styles.searchArea}>
        <Box 
          component="img"
          src="/ui.png"
          alt="UI Logo"
          sx={styles.logo}
        />
        <TextField 
          placeholder="Search"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={styles.searchField}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch} edge="end">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={styles.buttonGroup}>
        {sortButtons.map((button) => (
          <Button 
            key={button.value}
            variant={activeSort === button.value ? 'contained' : 'outlined'}
            onClick={() => handleSortChange(button.value)}
            size="small"
            color="primary"
            sx={styles.button}
          >
            {button.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SearchHeader;
