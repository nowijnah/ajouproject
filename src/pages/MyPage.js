import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Container
} from '@mui/material';
import {
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import CompanyCard from '../pages/companies/CompanyCard';
import PortfolioCard from '../pages/portfolios/PortfolioCard';
import LabCard from '../pages/labs/LabCard';  // LabCard import 추가

const MyPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!currentUser?.uid || !userRole) return;

      try {
        let collectionName;
        switch(userRole) {
          case 'STUDENT':
            collectionName = 'portfolios';
            break;
          case 'PROFESSOR':
            collectionName = 'labs';
            break;
          case 'COMPANY':
            collectionName = 'companies';
            break;
          default:
            return;
        }

        const postsRef = collection(db, collectionName);
        const q = query(
          postsRef,
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // 서버 타임스탬프를 Date 객체로 변환
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date()
        }));

        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [currentUser, userRole]);

  const handleUploadClick = () => {
    switch(userRole) {
      case 'STUDENT':
        navigate('/portfolios/new');
        break;
      case 'PROFESSOR':
        navigate('/labs/new'); 
        break;
      case 'COMPANY':
        navigate('/companies/new');
        break;
      default:
        alert('업로드 권한이 없습니다.');
        break;
    }
  };

  const getContentTitle = () => {
    switch(userRole) {
      case 'STUDENT':
        return '포트폴리오';
      case 'PROFESSOR':
        return '연구실 정보';
      case 'COMPANY':
        return '기업 게시물';
      default:
        return '게시물';
    }
  };

  const renderCard = (post) => {
    const commonProps = {
      id: post.id,
      title: post.title || '',
      description: post.description || post.subtitle || '',
      image: post.thumbnail || '',
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0
    };

    switch(userRole) {
      case 'STUDENT':
        return <PortfolioCard {...commonProps} />;
      case 'PROFESSOR':
        return <LabCard {...commonProps} />;  // 교수 역할일 때 LabCard 사용
      case 'COMPANY':
        return <CompanyCard {...commonProps} />;
      default:
        return <CompanyCard {...commonProps} />;
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pt: '64px' }}>
      <Box sx={{ 
        width: '100%',
        backgroundColor: 'white',
        py: 11,
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 700,
            color: 'rgb(0, 51, 161)',
            mb: 1 
          }}>
            {currentUser?.displayName || '사용자'}
          </Typography>
          {userRole === 'STUDENT' && (
            <Typography variant="h5" sx={{ 
              fontWeight: 400,
              color: 'rgb(0, 51, 161)',
              mb: 2
            }}>
              아주대학교
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ 
        width: '100%',
        backgroundColor: 'rgb(0, 51, 161)',
        py: 6
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {getContentTitle()}
            </Typography>
            {currentUser && (
              <Button
                startIcon={<EditIcon />}
                onClick={handleUploadClick}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                variant="outlined"
              >
                Upload
              </Button>
            )}
          </Box>

          {loading ? (
            <Typography sx={{ color: 'white' }}>Loading...</Typography>
          ) : (
            <Grid container spacing={3}>
              {userPosts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  {renderCard(post)}
                </Grid>
              ))}
              {userPosts.length === 0 && (
                <Grid item xs={12}>
                  <Typography sx={{ color: 'white', textAlign: 'center' }}>
                    아직 등록된 {getContentTitle()}가 없습니다.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default MyPage;