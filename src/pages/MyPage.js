import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import EditIcon from '@mui/icons-material/Edit';
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
import LabCard from '../pages/labs/LabCard';

const MyPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

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

  // 내 게시글 가져오기
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
          type: collectionName,
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

  // 좋아요한 게시글 가져오기
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // 1. 사용자가 좋아요한 문서들 가져오기
        const likesRef = collection(db, 'likes');
        const likesQuery = query(
          likesRef,
          where('userId', '==', currentUser.uid)
        );
        const likesSnapshot = await getDocs(likesQuery);

        // 2. 각 좋아요한 게시글의 실제 데이터 가져오기
        const likedPostsPromises = likesSnapshot.docs.map(async (likeDoc) => {
          const likeData = likeDoc.data();
          
          const postRef = doc(db, likeData.collectionName, likeData.postId);
          const postDoc = await getDoc(postRef);
          
          if (postDoc.exists()) {
            // 작성자 정보 가져오기
            const authorRef = doc(db, 'users', postDoc.data().authorId);
            const authorDoc = await getDoc(authorRef);
            const authorName = authorDoc.exists() ? authorDoc.data().displayName : '알 수 없음';

            if(likeData.collectionName === "softcon_projects") {
              likeData.collectionName = "portfolios";
            }
            
            return {
              id: postDoc.id,
              ...postDoc.data(),
              type: likeData.collectionName,
              description: authorName,
              createdAt: postDoc.data().createdAt?.toDate?.() || new Date(postDoc.data().createdAt) || new Date()
            };
          }
          return null;
        });

        const likedPosts = (await Promise.all(likedPostsPromises))
          .filter(post => post !== null)
          .sort((a, b) => b.createdAt - a.createdAt);

        setLikedPosts(likedPosts);
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [currentUser]);

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      description: post.type === 'labs' ? `${post.description || post.subtitle || ''} 교수님` : (post.description || post.subtitle || ''),
      image: post.thumbnail || '',
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0
    };

    switch(post.type) {
      case 'portfolios':
        return <PortfolioCard {...commonProps} />;
      case 'labs':
        return <LabCard {...commonProps} />;
      case 'companies':
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {getContentTitle()}
              </Typography>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': { color: 'white' }
                  },
                  '& .MuiTabs-indicator': { 
                    backgroundColor: 'white' 
                  }
                }}
              >
                <Tab label="내 게시글" />
                <Tab label="좋아요한 게시글" />
              </Tabs>
            </Box>
            {currentUser && activeTab === 0 && (
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
              {(activeTab === 0 ? userPosts : likedPosts).map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  {renderCard(post)}
                </Grid>
              ))}
              {(activeTab === 0 ? userPosts : likedPosts).length === 0 && (
                <Grid item xs={12}>
                  <Typography sx={{ color: 'white', textAlign: 'center' }}>
                    {activeTab === 0 
                      ? `아직 등록된 ${getContentTitle()}가 없습니다.`
                      : '좋아요한 게시글이 없습니다.'}
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