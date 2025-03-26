import React, { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SoftconProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        
        const projectsQuery = query(collection(db, 'softcon_projects'));
        const querySnapshot = await getDocs(projectsQuery);
        
        const authorDoc = await getDoc(doc(db, 'users', 'softcon-author'));
        const authorData = authorDoc.exists() ? authorDoc.data() : null;

        const projectsList = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          projectsList.push({
            id: doc.id,
            ...data,
            author: authorData
          });
        });
        
        console.log('가져온 프로젝트 수:', projectsList.length);
        console.log('첫 번째 프로젝트:', projectsList[0]);
        console.log('작성자 정보:', authorData);
        
        setProjects(projectsList);
      } catch (err) {
        console.error('프로젝트 로딩 중 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>소프트콘 프로젝트 불러오는 중...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (projects.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>프로젝트가 없습니다.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        소프트콘 프로젝트
      </Typography>
      
      <Grid container spacing={3}>
        {projects.map(project => (
          <Grid item xs={12} key={project.id}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5">{project.title}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {project.subtitle}
              </Typography>
              
              {project.thumbnail && (
                <Box sx={{ my: 2, textAlign: 'center' }}>
                  <img 
                    src={project.thumbnail} 
                    alt={project.title}
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                  />
                </Box>
              )}
              
              <Typography variant="body1" sx={{ mt: 2 }}>
                {project.content}
              </Typography>
              
              {/* 나머지 내용 표시 (키워드, 팀 정보 등) */}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SoftconProjectsPage;