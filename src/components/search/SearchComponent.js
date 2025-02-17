import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import _ from 'lodash';

const SearchComponent = ({ data, onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');
  const [filteredData, setFilteredData] = useState(data);

  const sortButtons = [
    { value: 'latest', label: '최신순' },
    { value: 'likes', label: '인기순' },
    { value: 'comments', label: '댓글순' }
  ];

  const sortData = (results) => {
    switch (activeSort) {
      case 'likes':
        return _.orderBy(results, [(item) => item.likeCount || 0], ['desc']);
      case 'comments':
        return _.orderBy(results, [(item) => item.commentCount || 0], ['desc']);
      case 'latest':
      default:
        return _.orderBy(results, [(item) => {
          const date = item.createdAt?.toDate?.() || item.createdAt;
          return new Date(date).getTime();
        }], ['desc']);
    }
  };

  const handleSortChange = (value) => {
    setActiveSort(value);
    const sortedResults = sortData(filteredData);
    onSearchResults(sortedResults);
  };

  const debouncedSearch = _.debounce((term, category) => {
    if (!term.trim()) {
      const sortedData = sortData(data);
      setFilteredData(sortedData);
      onSearchResults(sortedData);
      return;
    }

    const searchLower = term.toLowerCase();
    
    const results = data.filter(item => {
      switch (category) {
        case 'title':
          return (
            item.title?.toLowerCase().includes(searchLower) ||
            (item.subtitle?.toLowerCase().includes(searchLower) || false)
          );
        case 'content':
          return item.content?.toLowerCase().includes(searchLower);
        case 'keywords':
          return item.keywords?.some(keyword => 
            keyword.toLowerCase().includes(searchLower)
          );
        case 'all':
        default:
          return (
            item.title?.toLowerCase().includes(searchLower) ||
            (item.subtitle?.toLowerCase().includes(searchLower) || false) ||
            item.content?.toLowerCase().includes(searchLower) ||
            item.keywords?.some(keyword => 
              keyword.toLowerCase().includes(searchLower)
            )
          );
      }
    });

    const sortedResults = sortData(results);
    setFilteredData(sortedResults);
    onSearchResults(sortedResults);
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm, searchCategory);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, searchCategory, data]);

  // 초기 데이터 정렬
  useEffect(() => {
    if (data.length > 0) {
      const sortedData = sortData(data);
      setFilteredData(sortedData);
      onSearchResults(sortedData);
    }
  }, [data, activeSort]);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 3, 
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      gap: 3
    }}>
      {/* 로고 */}
      <Box 
        component="img"
        src="/ui.png"
        alt="UI Logo"
        sx={{ 
          height: 80,
          width: 'auto',
          objectFit: 'contain'
        }}
      />
      
      {/* 검색창 */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        alignItems: 'center',
        width: '100%',
        maxWidth: 800
      }}>
        <FormControl 
          size="small"
          sx={{ width: 120,
           }}
        >
          <Select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="title">제목</MenuItem>
            <MenuItem value="content">내용</MenuItem>
            <MenuItem value="keywords">키워드</MenuItem>
          </Select>
        </FormControl>

        <TextField 
          fullWidth
          placeholder="검색어를 입력하세요"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* 정렬 버튼들 */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: 1,
        width: '100%'
      }}>
        {sortButtons.map((button) => (
          <Button 
            key={button.value}
            variant={activeSort === button.value ? 'contained' : 'outlined'}
            onClick={() => handleSortChange(button.value)}
            size="small"
            sx={{
              minWidth: 'auto',
              px: 2
            }}
          >
            {button.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SearchComponent;