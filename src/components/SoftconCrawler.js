import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  CircularProgress,
  ThemeProvider,
  createTheme
} from '@mui/material';

// 아주대학교 테마 색상
const ajouBlue = '#003876'; // 아주대학교 공식 파란색

// 커스텀 테마 생성
const ajouTheme = createTheme({
  palette: {
    primary: {
      main: ajouBlue,
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
        }
      }
    }
  }
});

const TERMS = [
  "2020-1", "2020-2",
  "2021-1", "2021-2",
  "2022-1", "2022-2",
  "2023-1", "2023-2",
  "2024-1", "2024-2"
];

const CATEGORIES = ["S", "D", "I", "R", "M", "P"];

const SoftconCrawler = () => {
  const [selectedTerm, setSelectedTerm] = useState(TERMS[TERMS.length - 1]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [logMessages, setLogMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const functions = getFunctions();
  
  useEffect(() => {
    const initMessage = "크롤링 도구가 준비되었습니다. 학기와 카테고리를 선택하고 크롤링을 시작하세요.";
    setLogMessages([initMessage]);
    console.log("초기화 완료", { TERMS, CATEGORIES });
  }, []);

  const getCategoryName = (code) => {
    const categoryMap = {
      'S': '소프트웨어',
      'D': '사이버보안',
      'I': 'AI융합',
      'R': '미디어',
      'M': '자기주도연구',
      'P': '자기주도 프로젝트'
    };
    return categoryMap[code] || code;
  };

  const handleCrawl = async () => {
    if (!selectedTerm || !selectedCategory) {
      alert('학기와 카테고리를 선택해주세요.');
      return;
    }

    setLogMessages(prev => [...prev, `크롤링 시작: ${selectedTerm} / ${getCategoryName(selectedCategory)}`]);
    setLoading(true);

    try {
      setLogMessages(prev => [...prev, `직접 HTTP 요청 테스트 중...`]);
      
      const crawlSoftconData = httpsCallable(functions, 'crawlSoftconData');
      
      const requestData = {
        term: String(selectedTerm), 
        category: String(selectedCategory)
      };
      
      setLogMessages(prev => [...prev, `파라미터: ${JSON.stringify(requestData)}`]);
      
      const result = await crawlSoftconData(requestData);
      
      if (result.data && result.data.logs && Array.isArray(result.data.logs)) {
        setLogMessages(prev => [...prev, ...result.data.logs]);
      }
      
      if (result.data && result.data.success) {
        setLogMessages(prev => [
          ...prev, 
          `크롤링 완료: ${result.data.count}개 데이터 처리됨${
            result.data.skipped ? `, ${result.data.skipped}개 스킵됨` : ''
          }${
            result.data.errors ? `, ${result.data.errors}개 오류` : ''
          }`
        ]);
      } else {
        setLogMessages(prev => [
          ...prev, 
          `크롤링 실패: ${result.data?.error || '알 수 없는 오류'}`
        ]);
      }
    } catch (error) {
      console.error('크롤링 중 오류:', error);
      
      const errorMessage = error.message || '알 수 없는 오류';
      const errorDetails = error.details ? 
        (typeof error.details === 'string' ? error.details : JSON.stringify(error.details)) : '';
      
      setLogMessages(prev => [
        ...prev, 
        `오류 발생: ${errorMessage}`,
        errorDetails ? `상세 오류: ${errorDetails}` : ''
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={ajouTheme}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" color="primary" gutterBottom align="center" sx={{ mb: 3 }}>
          소프트콘 크롤링
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="term-select-label">학기</InputLabel>
                <Select
                  labelId="term-select-label"
                  id="term-select"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  label="학기"
                >
                  {TERMS.map((term) => (
                    <MenuItem key={term} value={term}>{term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">카테고리</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="카테고리"
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {getCategoryName(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCrawl}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? '크롤링 중...' : '크롤링 시작'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            크롤링 로그
          </Typography>
          
          <Box 
            sx={{ 
              height: '300px', 
              overflowY: 'auto',
              bgcolor: '#f5f5f5',
              p: 2,
              borderRadius: 1
            }}
          >
            <Box 
              component="pre"
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem',
                margin: 0,
                color: '#333'
              }}
            >
              {logMessages.length > 0 ? logMessages.join('\n') : '아직 로그가 없습니다.'}
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SoftconCrawler;