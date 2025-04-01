// src/pages/admin/AdminSoftcon.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';

import { useAuth } from '../../components/auth/AuthContext';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// TabPanel 컴포넌트를 직접 구현
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 소프트콘 데이터 처리 및 업로드 컴포넌트
const AdminSoftcon = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [uploadedProjects, setUploadedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');

  // 관리자 권한 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 소프트콘 데이터 로드
  useEffect(() => {
    const fetchSoftconData = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      
      try {
        setLoading(true);
        
        // 1. JSON 파일에서 가져온 원본 데이터
        const originalResponse = await fetch('/softcon_data/project_details.json');
        const originalData = await originalResponse.json();
        setProjects(originalData);
        
        // 2. Firestore에 업로드된 프로젝트 목록
        const projectsRef = collection(db, 'softcon_projects');
        const querySnapshot = await getDocs(projectsRef);
        
        const uploadedData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
        setUploadedProjects(uploadedData);
      } catch (error) {
        console.error('소프트콘 데이터 로드 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSoftconData();
  }, [currentUser]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 프로젝트 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // 프로젝트 삭제
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'softcon_projects', projectToDelete.uid || projectToDelete.id));
      
      // 상태 업데이트
      setUploadedProjects(prev => prev.filter(project => 
        project.uid !== projectToDelete.uid && project.id !== projectToDelete.id
      ));
      
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('프로젝트 삭제 중 오류:', error);
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 업로드 다이얼로그 열기
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  // 프로젝트 전체 업로드
  const handleUploadAllProjects = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      setProcessStatus('소프트콘 프로젝트 업로드를 준비 중입니다...');
      
      // 소프트콘 작성자 확인 또는 생성
      const authorId = 'softcon-author';
      const authorRef = doc(db, 'users', authorId);
      const authorDoc = await getDoc(authorRef);
      
      if (!authorDoc.exists()) {
        setProcessStatus('소프트콘 작성자 계정을 생성 중입니다...');
        
        // 작성자 계정 생성
        await setDoc(authorRef, {
          userId: authorId,
          displayName: "아주대학교 소프트콘",
          role: "ADMIN",
          profileImage: "/path/to/softcon-logo.png",
          email: "softcon@ajou.ac.kr",
          createdAt: serverTimestamp()
        });
      }
      
      // 현재 업로드된 프로젝트 ID 추출
      const uploadedIds = uploadedProjects.map(p => p.uid || p.id);
      const projectsToUpload = projects.filter(p => !uploadedIds.includes(p.uid));
      
      setProcessStatus(`총 ${projectsToUpload.length}개의 프로젝트를 업로드합니다...`);
      
      // 프로젝트 업로드
      let successCount = 0;
      let errorCount = 0;
      
      for (const [index, project] of projectsToUpload.entries()) {
        try {
          setProcessStatus(`프로젝트 ${index + 1}/${projectsToUpload.length} 업로드 중...`);
          
          // 썸네일 URL 생성
          let thumbnailUrl = project.representativeImage;
          if (!thumbnailUrl || thumbnailUrl.includes("no_registrant.jpg")) {
            thumbnailUrl = "";
          }
          
          // 이미지 URL 정리
          const imageUrls = (project.images || []).filter(url => url && !url.includes("no_registrant.jpg"));
          
          // 소프트콘 프로젝트 데이터 구성
          const projectData = {
            uid: project.uid,
            title: project.title || "제목 없음",
            subtitle: "소프트콘 프로젝트",
            content: project.summary || project.textContent || "",
            keywords: project.teamInfo?.members?.map(m => m.name) || [],
            thumbnail: thumbnailUrl,
            files: imageUrls?.map((img, idx) => ({
              fileId: `img-${idx}`,
              type: 'IMAGE',
              filename: `이미지 ${idx+1}`,
              url: img
            })) || [],
            links: [
              ...(project.gitRepository ? [{
                linkId: 'git',
                type: 'GITHUB',
                title: 'GitHub 저장소',
                url: project.gitRepository
              }] : []),
              ...(project.presentationUrl ? [{
                linkId: 'presentation',
                type: 'LINK',
                title: '발표자료',
                url: project.presentationUrl
              }] : []),
              ...(project.videoUrl ? [{
                linkId: 'video',
                type: 'YOUTUBE',
                title: '발표 동영상',
                url: project.videoUrl
              }] : [])
            ],
            authorId: authorId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            likeCount: parseInt(project.likeCount || 0),
            commentCount: parseInt(project.commentCount || 0),
            sourceUrl: project.url,
            term: project.term,
            teamInfo: project.teamInfo
          };
          
          // Firestore에 저장
          await setDoc(doc(db, 'softcon_projects', project.uid), projectData);
          successCount++;
        } catch (error) {
          console.error(`프로젝트 업로드 오류 (${project.uid}):`, error);
          errorCount++;
        }
      }
      
      setProcessStatus(`업로드 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);
      
      // 업로드된 프로젝트 목록 다시 로드
      const projectsRef = collection(db, 'softcon_projects');
      const querySnapshot = await getDocs(projectsRef);
      const updatedProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setUploadedProjects(updatedProjects);
      
      setTimeout(() => {
        setProcessing(false);
        setUploadDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error('일괄 업로드 중 오류:', error);
      setProcessStatus(`오류 발생: ${error.message}`);
      setTimeout(() => {
        setProcessing(false);
      }, 2000);
    }
  };

  if (!currentUser) {
    return <LoadingSpinner message="로그인 상태를 확인하는 중..." />;
  }

  if (currentUser.role !== 'ADMIN') {
    return null;
  }

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
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleOpenUploadDialog}
          sx={{ 
            bgcolor: '#0066CC',
            '&:hover': {
              bgcolor: '#004C99'
            }
          }}
        >
          일괄 업로드
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="소프트콘 관리 탭"
        >
          <Tab label="원본 데이터" />
          <Tab label="업로드된 프로젝트" />
        </Tabs>
      </Box>

      {/* 원본 데이터 탭 */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <LoadingSpinner message="소프트콘 데이터를 불러오는 중..." />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>제목</TableCell>
                  <TableCell>학기</TableCell>
                  <TableCell>팀원</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      원본 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => {
                    const isUploaded = uploadedProjects.some(p => p.uid === project.uid);
                    
                    return (
                      <TableRow key={project.uid} hover>
                        <TableCell>{project.uid}</TableCell>
                        <TableCell>{project.title}</TableCell>
                        <TableCell>{project.term}</TableCell>
                        <TableCell>
                          {project.teamInfo?.members?.map(member => member.name).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {project.gitRepository && (
                              <Chip 
                                label="GitHub" 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                onClick={() => window.open(project.gitRepository, '_blank')}
                                icon={<LinkIcon />}
                              />
                            )}
                            {project.presentationUrl && (
                              <Chip 
                                label="발표자료" 
                                size="small" 
                                color="secondary" 
                                variant="outlined" 
                                onClick={() => window.open(project.presentationUrl, '_blank')}
                                icon={<LinkIcon />}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {isUploaded ? (
                            <Chip 
                              label="업로드됨" 
                              size="small" 
                              color="success" 
                            />
                          ) : (
                            <Chip 
                              label="미업로드" 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* 업로드된 프로젝트 탭 */}
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <LoadingSpinner message="프로젝트를 불러오는 중..." />
        ) : (
          <>
            <Grid container spacing={3}>
              {uploadedProjects.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>업로드된 프로젝트가 없습니다.</Typography>
                  </Paper>
                </Grid>
              ) : (
                uploadedProjects.map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}>
                      <CardActionArea 
                        onClick={() => navigate(`/portfolios/${project.uid || project.id}`)}
                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={project.thumbnail || '/default-img.png'}
                          alt={project.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" noWrap>
                            {project.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {project.term}
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {project.keywords?.slice(0, 3).map((keyword, index) => (
                              <Chip
                                key={index}
                                label={keyword}
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            {project.keywords?.length > 3 && (
                              <Chip
                                label={`+${project.keywords.length - 3}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteDialog(project);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}
      </TabPanel>
      
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
      
      {/* 업로드 다이얼로그 */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !processing && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>소프트콘 프로젝트 일괄 업로드</DialogTitle>
        <DialogContent>
          {processing ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>{processStatus}</Typography>
            </Box>
          ) : (
            <>
              <DialogContentText>
                총 {projects.length}개의 소프트콘 프로젝트 중 {uploadedProjects.length}개가 이미 업로드되어 있습니다.
                아직 업로드되지 않은 {projects.length - uploadedProjects.length}개의 프로젝트를 업로드하시겠습니까?
              </DialogContentText>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  업로드될 프로젝트:
                </Typography>
                <Box sx={{ mt: 1, maxHeight: '200px', overflowY: 'auto', pl: 2 }}>
                  {projects
                    .filter(p => !uploadedProjects.some(up => up.uid === p.uid))
                    .map(project => (
                      <Typography key={project.uid} variant="body2" sx={{ mb: 0.5 }}>
                        • {project.title} ({project.term})
                      </Typography>
                    ))
                  }
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUploadDialogOpen(false)}
            disabled={processing}
          >
            취소
          </Button>
          <Button 
            onClick={handleUploadAllProjects}
            variant="contained"
            color="primary"
            disabled={processing || projects.length === uploadedProjects.length}
          >
            업로드
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminSoftcon;