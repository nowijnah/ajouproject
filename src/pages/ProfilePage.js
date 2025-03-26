import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { useParams } from 'react-router-dom';
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

const ProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  // 사용자 정보 및 역할 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // 사용자의 게시물 가져오기
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId || !userRole) return;

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
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId, userRole]);

  const getContentTitle = () => {
    switch(userRole) {
      case 'STUDENT':
        return '포트폴리오';
      case 'PROFESSOR':
        return '연구실';
      case 'COMPANY':
        return '기업 게시물';
      default:
        return '게시물';
    }
  };

  const renderCard = (post) => {
    const commonProps = {
      id: post.id,
      title: post.title,
      description: post.description || post.subtitle || '',
      image: post.thumbnail || '',
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0
    };

    switch(userRole) {
      case 'STUDENT':
        return <PortfolioCard {...commonProps} />;
      case 'COMPANY':
        return <CompanyCard {...commonProps} />;
      default:
        return <CompanyCard {...commonProps} />;
    }
  };

  if (!userData) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', pt: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

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
            {userData?.displayName || '사용자'}
          </Typography>
          <Typography variant="h5" sx={{ 
            fontWeight: 400,
            color: 'rgb(0, 51, 161)',
            mb: 2
          }}>
            아주대학교
          </Typography>
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

export default ProfilePage;