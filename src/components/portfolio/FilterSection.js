import React, { useState } from 'react';
import { Box, Typography, FormControlLabel, Checkbox, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { commonStyles } from './styles';

const FilterItem = ({ year, checked, onCheckChange }) => (
  <Box sx={{ mb: 1 }}>
    <FormControlLabel 
      control={
        <Checkbox 
          checked={checked}
          onChange={(e) => onCheckChange(year, e.target.checked)}
        />
      } 
      label={year}
      sx={{ 
        '.MuiFormControlLabel-label': {
          ...commonStyles.quicksandFont,
          fontWeight: 400,
        }
      }}
    />
  </Box>
);

export default function FilterSection({ onFiltersChange }) {
  const [expanded, setExpanded] = useState(false);
  const [checkedFilters, setCheckedFilters] = useState({});

  const filters = [
    {
      year: '2024-2'
    },
    {
      year: '2024-1'
    },
    {
      year: '2024-2'
    },
    {
      year: '2024-1'
    }
  ];

  const handleCheckChange = (year, checked) => {
    const newCheckedFilters = {
      ...checkedFilters,
      [year]: checked
    };
    setCheckedFilters(newCheckedFilters);
    onFiltersChange(newCheckedFilters);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const boxStyles = {
    borderRadius: '5px',
    border: '1px solid #e0e0e0',
    width: { xs: '100%', sm: '100%', md: '110%' },
    margin: { 
      xs: '0',
      sm: '0',
      md: '0px 0px 0px 5px'
    },
    padding: { 
      xs: '20px',
      sm: '25px',
      md: '30px 20px 0px 30px'
    },
    height: { 
      xs: 'auto',
      sm: 'auto',
      md: expanded ? 'auto' : '300px'
    },
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={boxStyles}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 2.5,
            ...commonStyles.quicksandFont,
          }}
        >
          Terms
        </Typography>
        <Box 
          sx={{ 
            mb: 3,
            overflow: 'hidden',
            height: {
              xs: 'auto',
              sm: 'auto',
              md: expanded ? 'auto' : '280px'
            },
          }}
        >
          {filters.map((filter, index) => (
            <FilterItem 
              key={index}
              year={filter.year}
              checked={checkedFilters[filter.year] || false}
              onCheckChange={handleCheckChange}
            />
          ))}
        </Box>
        <Box sx={{ 
          display: { 
            xs: 'none', 
            sm: 'none', 
            md: 'block' 
          }
        }}>
          <Button
            onClick={toggleExpand}
            sx={{
              width: '100%',
              justifyContent: 'center',
              color: 'primary.main',
              marginTop: 'auto',
              marginBottom: 3,
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
            endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          >
            {expanded ? '접기' : '더보기'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}