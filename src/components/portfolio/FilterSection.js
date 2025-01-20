import React, { useState } from 'react';
import { Box, Typography, FormControlLabel, Checkbox, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { commonStyles } from './styles';

const FilterItem = ({ year, descriptions = ['Description'], checked, onCheckChange }) => (
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
    <Typography 
      variant="body2" 
      color="text.secondary" 
      sx={{ 
        pl: 4,
        mt: -1,
        ...commonStyles.quicksandFont,
        fontWeight: 500,
      }}
    >
      {descriptions.map((desc, index) => (
        <React.Fragment key={index}>
          {desc}<br/>
        </React.Fragment>
      ))}
    </Typography>
  </Box>
);

export default function FilterSection({ onFiltersChange }) {
  const [expanded, setExpanded] = useState(false);
  const [checkedFilters, setCheckedFilters] = useState({});

  const filters = [
    {
      year: '2024-2',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2024-1',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2023-2',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2023-1',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2022-2',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2022-1',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2021-2',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2021-1',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2020-2',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
    },
    {
      year: '2020-1',
      descriptions: ['파란학기', 'SW캡스톤디자인', '자기주도프로젝트'],
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
    ...commonStyles.filterBox,
    height: expanded ? 'auto' : '400px',
    transition: 'height 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={boxStyles}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 1,
            ...commonStyles.quicksandFont,
          }}
        >
          Terms
        </Typography>
        <Box 
          sx={{ 
            mb: 3,
            flex: 1,
            overflow: 'hidden',
            height: expanded ? 'auto' : '280px',
            transition: 'height 0.3s ease-in-out',
          }}
        >
          {filters.map((filter, index) => (
            <FilterItem 
              key={index}
              year={filter.year}
              descriptions={filter.descriptions}
              checked={checkedFilters[filter.year] || false}
              onCheckChange={handleCheckChange}
            />
          ))}
        </Box>
        <Button
          onClick={toggleExpand}
          sx={{
            width: '100%',
            justifyContent: 'center',
            color: 'primary.main',
            marginTop: 'auto',
            marginBottom: 1,
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
  );
}