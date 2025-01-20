import React, { useState } from 'react';
import { 
  Typography, 
  Grid,
  TextField,
  Box,
  Container,
  Button,
  ThemeProvider,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { theme, commonStyles } from './styles';
import FilterSection from './FilterSection';
import PortfolioCard from './PortfolioCard';

export default function PortfolioList() {
  const [activeSort, setActiveSort] = useState('최신순');
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  const portfolios = [
    {
      id: 1,
      title: "2024-1학기 소프트콘",
      description: "강수빈",
      image: "/logo.png",
      year: "2024-1"
    },
    {
      id: 2,
      title: "토스",
      description: "2024-1 파란학기",
      image: "/dnag.png",
      year: "2024-1"
    },
    {
      id: 3,
      title: "0000",
      description: "□□□□□□□",
      image: "/puppy.png",
      year: "2023-2"
    },
    {
      id: 4,
      title: "2023-2 캡스톤디자인",
      description: "김민수",
      image: "/placeholder.png",
      year: "2023-2"
    },
    {
      id: 5,
      title: "네이버 부스트캠프",
      description: "이지원",
      image: "/placeholder.png",
      year: "2023-1"
    },
    {
      id: 6,
      title: "카카오 인턴십",
      description: "박준영",
      image: "/placeholder.png",
      year: "2023-1"
    },
    {
      id: 7,
      title: "SW마에스트로",
      description: "정다연",
      image: "/placeholder.png",
      year: "2022-2"
    },
    {
      id: 8,
      title: "구글 인턴십",
      description: "최유진",
      image: "/placeholder.png",
      year: "2022-2"
    },
    {
      id: 9,
      title: "삼성 청년 SW 아카데미",
      description: "한상우",
      image: "/placeholder.png",
      year: "2022-1"
    }
  ];

  const handleSortChange = (sortType) => {
    setActiveSort(sortType);
    // todo: 정렬 로직 구현
  };

  const handleSearch = () => {
    // todo: 검색 로직 구현
    console.log('Searching for:', searchText);
  };

  const handleFiltersChange = (filters) => {
    setActiveFilters(filters);
    // todo: 필터링 로직 구현
    console.log('Active filters:', filters);
  };

  const getFilteredPortfolios = () => {
    return portfolios;
  };

  const sortButtons = [
    { label: '최신순', value: '최신순' },
    { label: '인기순', value: '인기순' },
    { label: '업데이트순', value: '업데이트순' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ ml:16, mt: 10, mb: 4, mr:8}}>
        <Box sx={{ display: 'flex', gap: 6, mb: 4}}>
          <FilterSection onFiltersChange={handleFiltersChange} />
          
          <Box sx={{ flexGrow: 1}}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, mt: 1, ml: -35}}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Box 
                  component="img"
                  src="/ui.png"
                  alt="UI Logo"
                  sx={{ 
                    width: 200,
                    height: 'auto',
                  }}
                />
                <TextField 
                  placeholder="Search"
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={commonStyles.searchField}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleSearch}
                          edge="end"
                          sx={{ color: 'rgb(0, 51, 161)' }}
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {sortButtons.map((button) => (
                  <Button 
                    key={button.value}
                    variant={activeSort === button.value ? 'contained' : 'outlined'}
                    onClick={() => handleSortChange(button.value)}
                    size="small"
                    color="primary"
                  >
                    {button.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {getFilteredPortfolios().map((portfolio) => (
                <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                  <PortfolioCard {...portfolio} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}