// src/pages/admin/AdminSoftcon.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SwipeableViews from 'react-swipeable-views';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LinkIcon from '@mui/icons-material/Link';
import { useAuth } from '../../components/auth/AuthContext';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  query
} from 'firebase/firestore';
import { db } from '../../firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TERMS = [
  "2020-1", "2020-2",
  "2021-1", "2021-2",
  "2022-1", "2022-2",
  "2023-1", "2023-2",
  "2024-1", "2024-2"
];

const CRAWL_CATEGORIES = {
  'ALL': '전체',
  'S': '소프트웨어',
  'D': '사이버보안',
  'I': 'AI융합',
  'R': '미디어',
  'M': '자기주도연구',
  'P': '자기주도 프로젝트'
};

const CATEGORIES = {
  'S': '소프트웨어',
  'D': '사이버보안',
  'I': 'AI융합',
  'R': '미디어',
  'M': '자기주도연구',
  'P': '자기주도 프로젝트'
};

const AdminSoftcon = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const functions = getFunctions();
  
  const [uploadedProjects, setUploadedProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [crawlDialogOpen, setCrawlDialogOpen] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[TERMS.length - 1]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [categoryTabIndex, setCategoryTabIndex] = useState(0);

  // 관리자 권한 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 업로드된 프로젝트 로드
  useEffect(() => {
    const fetchUploadedProjects = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      
      try {
        setLoading(true);
        const projectsRef = collection(db, 'softcon_projects');
        const querySnapshot = await getDocs(projectsRef);
        
        const groupedProjects = {};
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const term = data.term || '기타';
          const category = data.category || 'ALL';
          
          if (!groupedProjects[term]) {
            groupedProjects[term] = {};
          }
          
          if (!groupedProjects[term][category]) {
            groupedProjects[term][category] = [];
          }
          
          groupedProjects[term][category].push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        });
        
        setUploadedProjects(groupedProjects);
      } catch (error) {
        console.error('프로젝트 로드 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUploadedProjects();
  }, [currentUser]);

  // 프로젝트 삭제 핸들러
  const handleOpenDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'softcon_projects', projectToDelete.id));
      
      // 상태 업데이트
      const updatedProjects = {...uploadedProjects};
      Object.keys(updatedProjects).forEach(term => {
        Object.keys(updatedProjects[term]).forEach(category => {
          updatedProjects[term][category] = updatedProjects[term][category].filter(
            project => project.id !== projectToDelete.id
          );
        });
      });
      
      setUploadedProjects(updatedProjects);
      
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('프로젝트 삭제 중 오류:', error);
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 크롤링 핸들러
  const handleOpenCrawlDialog = () => {
    setCrawlDialogOpen(true);
  };

  const handleCrawl = async () => {
    if (!selectedTerm) {
      alert('학기를 선택해주세요.');
      return;
    }

    const isAllCategories = selectedCategory === "ALL";
    
    const categoriesToCrawl = isAllCategories 
      ? Object.keys(CRAWL_CATEGORIES).filter(cat => cat !== "ALL")
      : [selectedCategory]; 
    
    setCrawlLoading(true);
    setCrawlLogs([`크롤링 시작: ${selectedTerm} / ${CRAWL_CATEGORIES[selectedCategory]}`]);
    
    try {
      let totalProcessed = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let allLogs = [];

      const crawlSoftconData = httpsCallable(functions, 'crawlSoftconData');

      for (const category of categoriesToCrawl) {
        const requestData = {
          term: String(selectedTerm), 
          category: String(category)
        };
        
        const result = await crawlSoftconData(requestData);
        
        if (result.data && result.data.logs && Array.isArray(result.data.logs)) {
          // 마지막 두 줄의 로그만 필터링
          const filteredLogs = result.data.logs
            .filter(log => 
              log.includes('프로젝트 저장 완료:') || 
              log.includes('크롤링 완료:')
            );
          
          allLogs = [...allLogs, ...filteredLogs];
        }
        
        if (result.data && result.data.success) {
          totalProcessed += result.data.count || 0;
          totalSkipped += result.data.skipped || 0;
          totalErrors += result.data.errors || 0;
        }
      }
      
      // 로그 업데이트 (최종 결과만)
      setCrawlLogs(allLogs);

      // 프로젝트 목록 새로고침
      const projectsRef = collection(db, 'softcon_projects');
      const querySnapshot = await getDocs(projectsRef);
      
      const groupedProjects = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const term = data.term || '기타';
        const category = data.category || 'ALL';
        
        if (!groupedProjects[term]) {
          groupedProjects[term] = {};
        }
        
        if (!groupedProjects[term][category]) {
          groupedProjects[term][category] = [];
        }
        
        groupedProjects[term][category].push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });
      
      setUploadedProjects(groupedProjects);
    } catch (error) {
      console.error('크롤링 중 오류:', error);
      
      const errorMessage = error.message || '알 수 없는 오류';
      setCrawlLogs(prev => [
        ...prev, 
        `오류 발생: ${errorMessage}`
      ]);
    } finally {
      setCrawlLoading(false);
    }
  };

  // 카테고리 탭 변경 핸들러
  const handleCategoryTabChange = (event, newValue) => {
    setCategoryTabIndex(newValue);
    setSelectedCategory(Object.keys(CATEGORIES)[newValue]);
  };

  // 탭 슬라이드 변경 핸들러
  const handleChangeIndex = (index) => {
    setCategoryTabIndex(index);
    setSelectedCategory(Object.keys(CATEGORIES)[index]);
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  // 현재 선택된 학기의 프로젝트 필터링
  const currentTermProjects = uploadedProjects[selectedTerm] || {};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/admin')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          소프트콘 프로젝트 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleOpenCrawlDialog}
            sx={{ 
              bgcolor: '#0066CC',
              '&:hover': {
                bgcolor: '#004C99'
              }
            }}
          >
            크롤링
          </Button>
        </Box>
      </Box>

      {loading ? (
        <LoadingSpinner message="프로젝트를 불러오는 중..." />
      ) : (
        <Box>
          {/* 학기 선택 드롭다운 */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="term-select-label">학기 선택</InputLabel>
              <Select
                labelId="term-select-label"
                value={selectedTerm}
                label="학기 선택"
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                {TERMS.map((term) => (
                  <MenuItem key={term} value={term}>{term}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 카테고리 탭 */}
          <Tabs
            value={categoryTabIndex}
            onChange={handleCategoryTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="카테고리 탭"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              mb: 2 
            }}
          >
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <Tab key={key} label={label} />
            ))}
          </Tabs>

          {/* 스와이프 가능한 뷰 */}
          <SwipeableViews
            index={categoryTabIndex}
            onChangeIndex={handleChangeIndex}
          >
            {Object.keys(CATEGORIES).map((category, index) => (
              <Box key={category} role="tabpanel" hidden={categoryTabIndex !== index}>
                {currentTermProjects[category]?.length > 0 ? (
                <Grid container spacing={2}>
                  {currentTermProjects[category].map(project => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          height: '100%',
                          cursor: project.sourceUrl ? 'pointer' : 'default'
                        }}
                        onClick={() => project.sourceUrl && window.open(project.sourceUrl, '_blank')}
                      >
                        <Typography variant="h6" noWrap>
                          {project.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {project.subtitle}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mt: 2 
                        }}>
                          {project.sourceUrl && (
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(project.sourceUrl, '_blank');
                              }}
                            >
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          )}
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteDialog(project);
                            }}
                          >
                            삭제
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    해당 카테고리의 프로젝트가 없습니다.
                  </Typography>
                </Box>
              )}
              </Box>
            ))}
          </SwipeableViews>
        </Box>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>프로젝트 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{projectToDelete?.title}" 프로젝트를 정말 삭제하시겠습니까?
            이 작업은 되돌릴 수 없습니다.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleDeleteProject} 
            color="error"
            autoFocus
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 크롤링 다이얼로그 */}
      <Dialog
        open={crawlDialogOpen}
        onClose={() => !crawlLoading && setCrawlDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>소프트콘 프로젝트 크롤링</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="term-select-label">학기</InputLabel>
                <Select
                  labelId="term-select-label"
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">카테고리</InputLabel>
                <Select
                  labelId="category-select-label"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="카테고리"
                >
                  {Object.entries(CRAWL_CATEGORIES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {crawlLoading ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>크롤링 진행 중...</Typography>
            </Box>
          ) : (
            <Paper 
              variant="outlined" 
              sx={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                p: 2, 
                bgcolor: 'grey.100' 
              }}
            >
              {crawlLogs.map((log, index) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word' 
                  }}
                >
                  {log}
                </Typography>
              ))}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCrawlDialogOpen(false)} 
            disabled={crawlLoading}
          >
            닫기
          </Button>
          <Button 
            onClick={handleCrawl}
            variant="contained"
            color="primary"
            disabled={crawlLoading}
            startIcon={crawlLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {crawlLoading ? '크롤링 중...' : '크롤링 시작'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminSoftcon;