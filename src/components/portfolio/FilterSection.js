import React, { useState } from 'react';
import { Box, Typography, FormControlLabel, Checkbox, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { commonStyles, filterSectionStyles } from '../common/styles';

const FilterItem = ({ filter, checked, onCheckChange }) => (
  <Box sx={{ mb: 1 }}>
    <FormControlLabel 
      control={
        <Checkbox 
          checked={checked}
          onChange={(e) => onCheckChange(filter.techStack, e.target.checked)}
          sx={{
            color: 'rgb(0, 51, 161)',
            '&.Mui-checked': {
              color: 'rgb(0, 51, 161)',
            },
            '& .MuiSvgIcon-root': {
              fontSize: 20,
            }
          }}
        />
      } 
      label={filter.techStack}
      sx={{ 
        '.MuiFormControlLabel-label': {
          ...commonStyles.quicksandFont,
          fontSize: '0.95rem',
          fontWeight: 350,
          color: '#333'
        }
      }}
    />
  </Box>
);

export default function FilterSection({ filters, onFiltersChange }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(
    filters.reduce((acc, filter) => ({
      ...acc,
      [filter.techStack]: false
    }), {})
  );

  const handleFilterChange = (techStack, checked) => {
    const newSelectedFilters = {
      ...selectedFilters,
      [techStack]: checked
    };
    setSelectedFilters(newSelectedFilters);
    onFiltersChange(newSelectedFilters);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const boxHeightStyles = {
    xs: expanded ? 'auto' : '300px',
    sm: expanded ? 'auto' : '350px',
    md: expanded ? 'auto' : '350px'
  };

  const boxStyles = {
    borderRadius: '5px',
    border: '1px solid #e0e0e0',
    width: { xs: '100%', sm: '100%', md: '100%' },
    margin: { 
      xs: '0',
      sm: '0px 0px 0px 0px',
      md: '0px 13px 0px 13px'
    },
    padding: { 
      xs: '30px 30px 0px 30px',
      sm: '30px 30px 0px 30px',
      md: '30px 30px 0px 30px'
    },
    height: boxHeightStyles,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={filterSectionStyles.box}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 2.5,
            ...commonStyles.quicksandFont,
            fontWeight: 350
          }}
        >
          Skill
        </Typography>
        <Box 
          sx={{ 
            mb: 3,
            overflow: 'hidden',
            height: {
              ...boxHeightStyles,
              xs: expanded ? 'auto' : '200px',
              sm: expanded ? 'auto' : '200px',
              md: expanded ? 'auto' : '200px'
            },
          }}
        >
          {filters.map((filter) => (
            <FilterItem 
              key={filter.techStack}
              filter={filter}
              checked={selectedFilters[filter.techStack] || false}
              onCheckChange={handleFilterChange}
            />
          ))}
        </Box>
        <Box sx={{ 
          display: { 
            xs: 'block',
            sm: 'block',
            md: 'block'
          }
        }}>
          <Button
            onClick={toggleExpand}
            sx={{
              width: '100%',
              justifyContent: 'center',
              color: 'primary.main',
              marginTop: 1,
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