import React, { useState } from 'react';
import { Grid, Box, Container, useMediaQuery, ThemeProvider } from '@mui/material';
import { theme, contentListStyles } from './styles';
import FilterSection from '../portfolio/FilterSection';
import ContentCard from './ContentCard';
import SearchHeader from './SearchHeader';

// 컨텐츠 타입별 설정
const contentConfig = {
  sortButtons: [
    { label: '최신순', value: 'latest' },
    { label: '인기순', value: 'popular' },
    { label: '댓글순', value: 'comment' },
  ],
  logoPath: "/default-logo.png"
};

const styles = {
  container: {
    px: { xs: 2, sm: 4, md: 6 },
    py: { xs: 2, md: 4 },
    width: '100%',
    padding: '32px 110px 48px 100px !important',
  },
  mainContent: {
    display: 'flex',
    flexDirection: { xs: 'column', lg: 'row' },
    gap: { xs: 3, md: 10 }
  },
  filterSection: {
    minWidth: '190px',
    order: -1
  }
};

// 단순화된 필터 구조
export const filters = [
  {
    techStack: '인공지능'
  },
  {
    techStack: '빅데이터'
  },
  {
    techStack: '클라우드'
  },
  {
    techStack: '보안'
  },
  {
    techStack: '임베디드'
  }
];

export default function ContentList({ type, data, filters }) {
  const config = contentConfig;
  const [activeSort, setActiveSort] = useState(config.sortButtons[0].value);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const isMobile = useMediaQuery('(max-width:900px)');

  const handleSortChange = (sortType) => {
    setActiveSort(sortType);
  };

  const handleSearch = () => {
    console.log('Searching for:', searchText);
  };

  const handleFiltersChange = (filters) => {
    setActiveFilters(filters);
    console.log('Active filters:', filters);
  };

  const getFilteredContent = () => {
    let filteredData = [...data];

    // 검색어 필터링
    if (searchText) {
      filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 필터 적용
    if (Object.keys(activeFilters).length > 0) {
      filteredData = filteredData.filter(item => {
        return Object.entries(activeFilters).some(([key, value]) => 
          value && item[key] === key
        );
      });
    }

    // 정렬 적용
    switch (activeSort) {
      case '최신순':
        filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case '인기순':
        filteredData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case '가나다순':
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return filteredData;
  };

  const renderFilterSection = () => (
    <FilterSection 
      title={config.title}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      isMobile={isMobile}
    />
  );

  const renderContentGrid = () => (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {getFilteredContent().map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <ContentCard 
              title={item.title}
              description={item.description}
              image={item.image}
              additionalInfo={item.additionalInfo}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={contentListStyles.container}>
        <Box sx={{ width: '100%' }}>
          <SearchHeader 
            searchText={searchText}
            setSearchText={setSearchText}
            handleSearch={handleSearch}
            activeSort={activeSort}
            handleSortChange={handleSortChange}
            sortButtons={config.sortButtons}
            logoPath={config.logoPath}
          />

          <Box sx={styles.mainContent}>
            {isMobile && (
              <FilterSection 
                title={config.title}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isMobile={isMobile}
              />
            )}
            {renderContentGrid()}
            {!isMobile && (
              <Box sx={styles.filterSection}>
                <FilterSection 
                  title={config.title}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  isMobile={isMobile}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
} 