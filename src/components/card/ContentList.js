import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { theme, contentListStyles } from './styles';
import CompanyCard  from '../../pages/companies/CompanyCard';
import PortfolioCard from '../../pages/portfolios/PortfolioCard';
import LabCard from '../../pages/labs/LabCard';
import SearchComponent from '../search/SearchComponent';

export default function ContentList({ type, data}) {
  const [searchResults, setSearchResults] = useState(data);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  }

  const renderCard = (item) => {
    // content 프로퍼티가 전달되는지 확인
    const props = {
      ...item,
      content: item.content || '', // content가 없으면 빈 문자열 기본값 설정
    };
    
    switch (type) {
      case 'portfolio':
        return <PortfolioCard {...props} />;
      case 'lab':
        return <LabCard {...props} />;
      case 'company':
        return <CompanyCard {...props} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={contentListStyles.container}>
      
      {/* 검색 */}
      <SearchComponent 
        data={data} 
        onSearchResults={handleSearchResults}
      />

      {/* 결과 */}
      <Grid container spacing={3}>
        {searchResults.length > 0 ? (
          searchResults.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              {renderCard(item)}
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <Typography variant="h6">
                검색 결과가 없습니다
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                다른 검색어로 다시 시도해보세요
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      </Container>
    </ThemeProvider>
  );
} 