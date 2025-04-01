// src/pages/notices/NoticeView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../components/auth/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const NoticeView = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 공지사항 불러오기
  useEffect(() => {
    const fetchNotice = async () => {
      if (!noticeId) return;
      
      try {
        setLoading(true);
        const noticeDoc = await getDoc(doc(db, 'notices', noticeId));
        
        if (noticeDoc.exists()) {
          setNotice({
            id: noticeDoc.id,
            ...noticeDoc.data(),
            createdAt: noticeDoc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: noticeDoc.data().updatedAt?.toDate?.() || new Date()
          });
        } else {
          setError('공지사항을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('공지사항 로드 중 오류:', err);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotice();
  }, [noticeId]);

  // 관리자인지 확인
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  // 공지사항 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/admin/notices`, { state: { editNoticeId: noticeId } });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/notices')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">공지사항</Typography>
      </Box>

      {loading ? (
        <Paper elevation={1} sx={{ borderRadius: 2, p: 4 }}>
          <Skeleton width="70%" height={60} />
          <Skeleton width="30%" height={30} sx={{ mt: 1, mb: 3 }} />
          <Divider sx={{ my: 3 }} />
          <Skeleton height={30} />
          <Skeleton height={30} />
          <Skeleton height={30} />
          <Skeleton height={30} width="80%" />
        </Paper>
      ) : error ? (
        <Paper elevation={1} sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/notices')}
            sx={{ mt: 2 }}
          >
            목록으로 돌아가기
          </Button>
        </Paper>
      ) : notice ? (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                {notice.title}
              </Typography>
              {isAdmin && (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleEdit}
                  sx={{ minWidth: 0, p: 1 }}
                >
                  수정
                </Button>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {notice.createdAt.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              {notice.isMainPageNotice && (
                <Chip 
                  label="메인 표시" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2 }} 
                />
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ 
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                my: 2
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                fontWeight: 600
              },
              '& p': {
                mb: 2,
                lineHeight: 1.7
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'grey.300',
                pl: 2,
                ml: 0,
                color: 'text.secondary'
              },
              '& pre, & code': {
                fontFamily: 'monospace',
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                overflowX: 'auto'
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2
              }
            }}>
              <ReactMarkdown>{notice.content}</ReactMarkdown>
            </Box>
          </Box>
        </Paper>
      ) : null}
    </Container>
  );
};

export default NoticeView;