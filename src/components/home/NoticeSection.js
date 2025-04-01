// src/components/home/NoticeSection.js
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
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
  const [mainNotices, setMainNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 마크다운 내용에서 이미지 URL 추출
  const extractImagesFromMarkdown = (markdownContent) => {
    if (!markdownContent) return [];
    
    // 마크다운 이미지 형식 ![alt](url) 패턴 찾기
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(markdownContent)) !== null && images.length < 2) {
      if (match[1] && !match[1].includes('download')) {
        images.push(match[1]);
      }
    }
    
    return images.slice(0, 2); // 최대 2개까지만 반환
  };

  // HTML 태그에서 이미지 URL 추출
  const extractImagesFromHTML = (markdownContent) => {
    if (!markdownContent) return [];
    
    // HTML 이미지 태그 <img src="url"> 패턴 찾기
    const htmlImageRegex = /<img.*?src=["'](.*?)["']/g;
    const images = [];
    let match;
    
    while ((match = htmlImageRegex.exec(markdownContent)) !== null && images.length < 2) {
      if (match[1] && !match[1].includes('download')) {
        images.push(match[1]);
      }
    }
    
    return images.slice(0, 2); // 최대 2개까지만 반환
  };

  // 파일 목록에서 이미지 파일 추출
  const extractImagesFromFiles = (files) => {
    if (!files || !Array.isArray(files)) return [];
    
    // 타입이 IMAGE인 파일만 필터링
    const imageFiles = files.filter(file => file.type === 'IMAGE' && file.url);
    
    // 최대 2개 반환
    return imageFiles.slice(0, 2).map(file => file.url);
  };

  // 링크에서 이미지 URL을 추출 (일반적인 이미지 확장자 감지 및 타이틀 검사)
  const extractImagesFromLinks = (links) => {
    if (!links || !Array.isArray(links)) return [];
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageLinks = links.filter(link => {
      if (!link.url) return false;
      
      // URL이 이미지 확장자로 끝나는지 확인
      const url = link.url.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => url.endsWith(ext));
      
      // 타이틀에 '이미지' 또는 'image'가 포함되어 있는지 확인
      const titleHasImageKeyword = link.title && 
        (link.title.toLowerCase().includes('이미지') || 
         link.title.toLowerCase().includes('image'));
      
      return hasImageExtension || titleHasImageKeyword;
    });
    
    return imageLinks.slice(0, 2).map(link => link.url);
  };

  // 마크다운 내의 링크 텍스트에서 이미지 링크 추출
  const extractImagesFromLinkText = (markdownContent) => {
    if (!markdownContent) return [];
    
    // 마크다운 링크 패턴 [text](url) 찾기
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const images = [];
    let match;
    
    while ((match = linkRegex.exec(markdownContent)) !== null && images.length < 2) {
      const linkText = match[1]; // 링크 텍스트
      const url = match[2]; // URL
      
      if (!url) continue;
      
      // URL이 이미지 확장자로 끝나는지 확인
      const urlLower = url.toLowerCase();
      const isImageUrl = imageExtensions.some(ext => urlLower.endsWith(ext));
      
      // 링크 텍스트에 '이미지' 또는 'image'가 포함되어 있는지 확인
      const textHasImageKeyword = 
        linkText.toLowerCase().includes('이미지') || 
        linkText.toLowerCase().includes('image');
      
      if (isImageUrl || textHasImageKeyword) {
        images.push(url);
      }
    }
    
    return images.slice(0, 2); // 최대 2개까지만 반환
  };

  // BasePostUpload.js 스타일의 이미지 URL 추출 (여러 소스에서 통합)
  const getNoticeImages = (notice) => {
    if (!notice) return [];
    
    // 1. 마크다운에서 이미지 추출
    const markdownImages = extractImagesFromMarkdown(notice.content);
    
    // 2. HTML 태그에서 이미지 추출
    const htmlImages = extractImagesFromHTML(notice.content);
    
    // 3. 파일 목록에서 이미지 추출
    const fileImages = extractImagesFromFiles(notice.files);
    
    // 4. 링크에서 이미지 추출
    const linkImages = extractImagesFromLinks(notice.links);
    
    // 5. 마크다운 링크 텍스트에서 이미지 추출 (새로 추가)
    const linkTextImages = extractImagesFromLinkText(notice.content);
    
    // 모든 이미지 소스 합치기 (중복 URL 제거)
    const allImages = [...markdownImages];
    
    // 각 이미지 소스를 순회하며 중복이 아닌 이미지만 추가
    const addUniqueImages = (images) => {
      images.forEach(url => {
        if (!allImages.includes(url) && allImages.length < 2) {
          allImages.push(url);
        }
      });
    };
    
    // 각 소스에서 추출한 이미지들 추가
    addUniqueImages(htmlImages);
    addUniqueImages(fileImages);
    addUniqueImages(linkImages);
    addUniqueImages(linkTextImages);
    
    return allImages.slice(0, 2); // 최대 2개만 사용
  };

  useEffect(() => {
    // 실시간 업데이트를 위한 리스너 설정
    const fetchMainNotices = () => {
      try {
        setLoading(true);
        
        // 메인 페이지 공지 쿼리 설정
        const noticesRef = collection(db, 'notices');
        const mainNoticeQuery = query(
          noticesRef,
          where('isMainPageNotice', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        // 실시간 리스너 설정
        const unsubscribe = onSnapshot(mainNoticeQuery, async (querySnapshot) => {
          if (!querySnapshot.empty) {
            const noticesData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date()
              };
            });
            
            // 각 공지에 이미지 정보 추가 및 디버그 출력
            const noticesWithImages = noticesData.map(notice => {
              const images = getNoticeImages(notice);
              console.log(`공지 ${notice.id} 이미지:`, images);
              return {
                ...notice,
                images
              };
            });
            
            setMainNotices(noticesWithImages);
          } else {
            // 메인 공지가 없으면 최신 공지 가져오기
            const recentQuery = query(
              noticesRef,
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            
            const recentSnapshot = await getDocs(recentQuery);
            
            if (!recentSnapshot.empty) {
              const recentDocs = recentSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate?.() || new Date()
                };
              });
              
              // 각 공지에 이미지 정보 추가
              const noticesWithImages = recentDocs.map(notice => ({
                ...notice,
                images: getNoticeImages(notice)
              }));
              
              setMainNotices(noticesWithImages);
            } else {
              // 공지사항이 없는 경우
              setMainNotices([]);
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
    
    return fetchMainNotices();
  }, []);

  const handleNoticeClick = (noticeId) => {
    navigate(`/notices/${noticeId}`);
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
  if (mainNotices.length === 0) {
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

  return (
    <>
      {mainNotices.map((notice, noticeIndex) => {
        // 공지사항 내용 일부만 표시 (300자 제한)
        const truncatedContent = notice.content?.length > 300 
          ? `${notice.content.substring(0, 300)}...` 
          : notice.content;

        return (
          <Box 
            key={notice.id}
            sx={{ 
              p: { xs: 2, sm: 3, md: 4 }, 
              bgcolor: '#f8f9fa', 
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              mb: noticeIndex < mainNotices.length - 1 ? 3 : 0
            }}
            onClick={() => handleNoticeClick(notice.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: '#0A2B5D'
              }}>
                {notice.title}
              </Typography>
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
            </Box>
            
            <Box sx={{ 
              mb: 2,
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}>
              {notice.createdAt.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Box>
            
            <Grid container spacing={2}>
              {/* 텍스트 영역 */}
              <Grid item xs={12} md={notice.images?.length > 0 ? 6 : 12}>
                <Box sx={{ 
                  '& img': { display: 'none' },  // 이미지 숨김 (별도로 표시하므로)
                  '& h1, & h2, & h3, & h4, & h5, & h6': { fontSize: '1rem', fontWeight: 600, my: 1 },
                  '& p': { my: 1, lineHeight: 1.5 },
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  WebkitLineClamp: 3,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis',
                  maxHeight: notice.images?.length > 0 ? '15em' : '4.5em',
                  mb: 2
                }}>
                  <ReactMarkdown>{truncatedContent}</ReactMarkdown>
                </Box>
              </Grid>
              
              {/* 이미지 영역 */}
              {notice.images?.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Grid container spacing={1}>
                    {notice.images.map((imageUrl, index) => (
                      <Grid item xs={notice.images.length === 1 ? 12 : 6} key={index}>
                        <Box 
                          component="img"
                          src={imageUrl}
                          alt={`공지사항 이미지 ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: { xs: '200px', sm: '180px' },
                            objectFit: 'cover',
                            borderRadius: 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      })}
    </>
  );
};

export default NoticeSection;