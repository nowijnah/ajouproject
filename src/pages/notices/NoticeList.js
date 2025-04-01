// src/pages/notices/NoticeList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const NoticeList = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 공지사항 목록 불러오기
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const noticesRef = collection(db, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const noticesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
        setNotices(noticesList);
      } catch (error) {
        console.error('공지사항 로드 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotices();
  }, []);

  const handleNoticeClick = (noticeId) => {
    navigate(`/notices/${noticeId}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">공지사항</Typography>
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? (
          <List>
            {[...Array(5)].map((_, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={<Skeleton width="70%" height={30} />}
                    secondary={<Skeleton width="30%" height={20} />}
                  />
                </ListItem>
                {index < 4 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : notices.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              등록된 공지사항이 없습니다.
            </Typography>
          </Box>
        ) : (
          <List>
            {notices.map((notice, index) => (
              <React.Fragment key={notice.id}>
                <ListItem
                  button
                  onClick={() => handleNoticeClick(notice.id)}
                  sx={{
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 51, 161, 0.04)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {notice.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {notice.createdAt.toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notices.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default NoticeList;