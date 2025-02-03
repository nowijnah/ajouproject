import React from 'react';
import { 
  TextField,
  Box,
  Button,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { commonStyles, searchHeaderStyles } from './styles';

const SearchHeader = ({ 
  searchText,
  setSearchText,
  handleSearch,
  activeSort,
  handleSortChange,
  sortButtons
}) => {
  return (
    <Box sx={searchHeaderStyles.container}>
      <Box sx={searchHeaderStyles.searchArea}>
        <Box 
          component="img"
          src="/ui.png"
          alt="UI Logo"
          sx={searchHeaderStyles.logo}
        />
        <TextField 
          placeholder="Search"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={searchHeaderStyles.searchField}
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

      <Box sx={searchHeaderStyles.buttonGroup}>
        {sortButtons.map((button) => (
          <Button 
            key={button.value}
            variant={activeSort === button.value ? 'contained' : 'outlined'}
            onClick={() => handleSortChange(button.value)}
            size="small"
            color="primary"
            sx={searchHeaderStyles.button}
          >
            {button.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SearchHeader;
