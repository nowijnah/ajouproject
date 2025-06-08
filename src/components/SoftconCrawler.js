import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ajouBlue = '#003876'; 

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
  "2024-1", "2024-2",
  "2025-1"
];

const CATEGORIES = ["ALL","S", "D", "I", "R", "M", "P"];

const SoftconCrawler = () => {
  const [selectedTerm, setSelectedTerm] = useState(TERMS[TERMS.length - 1]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [status, setStatus] = useState('ready'); 
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const functions = getFunctions();

  const getCategoryName = (code) => {
    const categoryMap = {
      'ALL': '전체',
      'S': '소프트웨어',
      'D': '사이버보안',
      'I': 'AI융합',
      'R': '미디어',
      'M': '자기주도연구',
      'P': '자기주도 프로젝트'
    };
    return categoryMap[code] || code;
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  };

  const handleCrawl = async () => {
    if (!selectedTerm) {
      alert('학기를 선택해주세요.');
      return;
    }

    const isAllCategories = selectedCategory === "ALL";
    const categoriesToCrawl = isAllCategories 
      ? CATEGORIES.filter(cat => cat !== "ALL")
      : [selectedCategory]; 
    
    setLoading(true);
    setStatus('loading');
    setResult(null);
    
    addLog(`크롤링 시작: ${selectedTerm} / ${getCategoryName(selectedCategory)}`);
    
    try {
      let totalProcessed = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (const category of categoriesToCrawl) {
        addLog(`${getCategoryName(category)} 크롤링 중...`);
        
        const crawlSoftconData = httpsCallable(functions, 'crawlSoftconData');
        
        const requestData = {
          term: String(selectedTerm),
          category: String(category)
        };
        
        const result = await crawlSoftconData(requestData);
        
        if (result.data && result.data.success) {
          totalProcessed += result.data.count || 0;
          totalSkipped += result.data.skipped || 0;
          totalErrors += result.data.errors || 0;
          addLog(`${getCategoryName(category)} 완료: ${result.data.count || 0}개`);
        }
      }
      
      const finalResult = {
        processed: totalProcessed,
        skipped: totalSkipped,
        errors: totalErrors,
        categories: categoriesToCrawl.map(cat => getCategoryName(cat)).join(', ')
      };
      
      setResult(finalResult);
      setStatus('success');
      addLog(`크롤링 완료: 총 ${totalProcessed}개 처리됨`);
      
    } catch (error) {
      console.error('크롤링 중 오류:', error);
      setStatus('error');
      setResult({ error: error.message || '알 수 없는 오류가 발생했습니다.' });
      addLog(`오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusAlert = () => {
    switch (status) {
      case 'ready':
        return (
          <Alert severity="info">
            크롤링 도구가 준비되었습니다. 학기와 카테고리를 선택하고 크롤링을 시작하세요.
          </Alert>
        );
      case 'loading':
        return (
          <Alert severity="warning" icon={<CircularProgress size={20} />}>
            크롤링 진행 중입니다. 잠시만 기다려주세요...
          </Alert>
        );
      case 'success':
        return (
          <Alert severity="success">
            크롤링이 완료되었습니다!
            <br />
            • 처리된 데이터: {result?.processed || 0}개
            {result?.skipped > 0 && <><br />• 스킵된 데이터: {result.skipped}개</>}
            {result?.errors > 0 && <><br />• 오류: {result.errors}개</>}
            <br />• 대상 카테고리: {result?.categories}
          </Alert>
        );
      case 'error':
        return (
          <Alert severity="error">
            크롤링 중 오류가 발생했습니다.
            <br />
            오류 메시지: {result?.error}
          </Alert>
        );
      default:
        return null;
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
                  disabled={loading}
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
                  disabled={loading}
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

        <Paper sx={{ p: 3 }}>
          {getStatusAlert()}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SoftconCrawler;