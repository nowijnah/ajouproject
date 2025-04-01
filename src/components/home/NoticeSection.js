// src/components/home/NoticeSection.js
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase';

const NoticeSection = () => {
  const navigate = useNavigate();
  const [mainNotice, setMainNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실시간 업데이트를 위한 리스너 설정
    const fetchMainNotice = () => {
      try {
        setLoading(true);
        
        // 메인 페이지 공지 쿼리 설정
        const noticesRef = collection(db, 'notices');
        const mainNoticeQuery = query(
          noticesRef,
          where('isMainPageNotice', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        // 실시간 리스너 설정
        const unsubscribe = onSnapshot(mainNoticeQuery, async (querySnapshot) => {
          if (!querySnapshot.empty) {
            const noticeDoc = querySnapshot.docs[0];
            setMainNotice({
              id: noticeDoc.id,
              ...noticeDoc.data(),
              createdAt: noticeDoc.data().createdAt?.toDate?.() || new Date()
            });
          } else {
            // 메인 공지가 없으면 최신 공지 가져오기
            const recentQuery = query(
              noticesRef,
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            
            const recentSnapshot = await getDocs(recentQuery);
            
            if (!recentSnapshot.empty) {
              const recentDoc = recentSnapshot.docs[0];
              setMainNotice({
                id: recentDoc.id,
                ...recentDoc.data(),
                createdAt: recentDoc.data().createdAt?.toDate?.() || new Date()
              });
            } else {
              // 공지사항이 없는 경우
              setMainNotice(null);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error('메인 공지사항 리스너 오류:', error);
          setLoading(false);
        });
        
        // 컴포넌트 언마운트 시 리스너 해제
        return () => unsubscribe();
      } catch (error) {
        console.error('메인 공지사항 로드 중 오류:', error);
        setLoading(false);
        return () => {}; // 오류 발생 시 빈 클린업 함수 반환
      }
    };
    
    return fetchMainNotice();
  }, []);

  const handleNoticeClick = () => {
    if (mainNotice) {
      navigate(`/notices/${mainNotice.id}`);
    } else {
      navigate('/notices');
    }
  };

  // 로딩 상태일 때 스켈레톤 표시
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Skeleton width="70%" height={24} />
        <Skeleton width="60%" height={24} />
        <Skeleton width="80%" height={24} />
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Skeleton variant="rectangular" width="100%" height={200} />
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
      </Box>
    );
  }

  // 공지사항이 없을 때 기본 컨텐츠
  if (!mainNotice) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          포트폴리오 작성 가이드
        </Typography>
        <Typography variant="body1">
          당신의 우수한 프로젝트와 연구 경험을 더 돋보이게 만들어보세요. 기술 스택, 주요 기능, 성과 등을 잘 정리하여 기업과 연구실에 어필할 수 있는 포트폴리오를 작성해보세요.
        </Typography>
      </Box>
    );
  }

  // 공지사항 내용 일부만 표시 (300자 제한)
  const truncatedContent = mainNotice.content.length > 300 
    ? `${mainNotice.content.substring(0, 300)}...` 
    : mainNotice.content;

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        bgcolor: '#f8f9fa', 
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
      onClick={handleNoticeClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          color: '#0A2B5D'
        }}>
          {mainNotice.title}
        </Typography>
        {mainNotice.isMainPageNotice && (
          <Box
            sx={{
              bgcolor: '#2196f3',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            공지
          </Box>
        )}
      </Box>
      
      <Box sx={{ 
        mb: 2,
        color: 'text.secondary',
        fontSize: '0.875rem'
      }}>
        {mainNotice.createdAt.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </Box>
      
      <Box sx={{ 
        '& img': { display: 'none' },  // 이미지 숨김
        '& h1, & h2, & h3, & h4, & h5, & h6': { fontSize: '1rem', fontWeight: 600, my: 1 },
        '& p': { my: 1, lineHeight: 1.5 },
        overflow: 'hidden',
        wordBreak: 'break-word',
        WebkitLineClamp: 3,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        textOverflow: 'ellipsis',
        maxHeight: '4.5em',
        mb: 2
      }}>
        <ReactMarkdown>{truncatedContent}</ReactMarkdown>
      </Box>
      
      <Box 
        sx={{ 
          textAlign: 'right',
          color: '#2196f3',
          fontWeight: 500,
          fontSize: '0.875rem'
        }}
      >
        자세히 보기 →
      </Box>
    </Box>
  );
};

export default NoticeSection;