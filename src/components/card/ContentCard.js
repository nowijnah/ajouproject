// ContentCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import CommentIcon from '@mui/icons-material/ChatBubbleOutline';

import { useAuth } from '../../components/auth/AuthContext';
import { contentCardStyles } from '../../components/card/styles';
import useLike from '../../hooks/useLike';

const ContentCard = ({ 
  id,
  title, 
  description, 
  image, 
  content = '',  // 마크다운 콘텐츠
  likeCount: initialLikeCount = 0, 
  commentCount = 0,
  type = 'portfolio', // 'portfolio', 'company', 'lab'
  files = [],
  customStyles = {} // 추가적인 스타일 오버라이드를 위한 props
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // collectionName을 올바르게 결정
  const getCollectionName = () => {
    switch(type) {
      case 'portfolio': return 'portfolios';
      case 'company': return 'companies'; // 'companys'가 아닌 'companies'로 수정
      case 'lab': return 'labs';
      default: return `${type}s`; // 기본 복수형
    }
  };
  
  const { isLiked, likeCount, loading, toggleLike } = useLike(
    id, 
    getCollectionName(), // 수정된 함수 사용
    currentUser?.uid || null
  );

  // 마크다운 내용에서 이미지 URL 추출하는 함수
  const extractImagesFromMarkdown = (content) => {
    if (!content) return [];
    
    // Markdown 이미지 구문 찾기: ![alt text](image-url)
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const matches = [...(content.matchAll(imageRegex) || [])];
    
    return matches.map(match => match[1]).filter(url => {
      // 로컬 파일 URL은 제외하고 원격 URL만 반환
      return !url.startsWith('blob:') && !url.startsWith('data:');
    });
  };

  // 게시물에서 썸네일 추출 함수
const getThumbnailFromPost = (image, content, files) => {
  // 디버깅 정보 출력 (문제 해결 후 제거 가능)
  console.log('썸네일 처리:', { image, hasContent: !!content, filesCount: files?.length });
  
  // 1. 이미 썸네일이 있으면 그대로 사용 (null이나 undefined가 아닌 모든 값)
  if (image) {
    // 'markdown-image'는 특수 케이스로 건너뛰기
    if (image !== 'markdown-image') {
      return image;
    }
  }
  
  // 2. 마크다운 내용에서 이미지 추출
  if (content) {
    const markdownImages = extractImagesFromMarkdown(content);
    if (markdownImages.length > 0) {
      console.log('마크다운에서 추출된 이미지:', markdownImages[0]);
      return markdownImages[0];
    }
  }
  
  // 3. 첨부 파일 중 이미지가 있으면 첫 번째 이미지 사용
  const imageFile = files?.find(file => file.type === 'IMAGE' && file.url);
  if (imageFile) {
    console.log('첨부 파일에서 추출된 이미지:', imageFile.url);
    return imageFile.url;
  }
  
  // 4. 기본 이미지 사용
  return `/default-img.png`;
};
  
  // 이미지 처리
  const getDisplayImage = () => {
    return getThumbnailFromPost(image, content, files);
  };

  const handleClick = () => {
    // 수정된 함수를 사용해 올바른 경로 생성
    navigate(`/${getCollectionName()}/${id}`);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await toggleLike();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Card 
      onClick={handleClick}
      sx={{
        ...contentCardStyles.card,
        ...customStyles,
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <Box sx={contentCardStyles.mediaBox}>
        <CardMedia
          component="img"
          image={getDisplayImage()}
          alt={title}
          sx={contentCardStyles.media}
        />
      </Box>
      <CardContent sx={{ p: 2, flexGrow: 1 }}>
        <Typography 
          variant="h6" 
          component="h2"
          sx={contentCardStyles.title}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={contentCardStyles.description}
        >
          {description}
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            mt: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {currentUser ? (
              <IconButton
                onClick={handleLikeClick}
                size="small"
                disabled={loading}
                sx={{ 
                  p: 0.5,
                  color: 'rgb(0, 51, 161)',
                  '&:hover': { bgcolor: 'rgba(0, 51, 161, 0.1)' }
                }}
              >
                {isLiked ? (
                  <ThumbUpIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            ) : (
              <Tooltip title="로그인이 필요합니다">
                <span>
                  <ThumbUpOutlinedIcon sx={{ fontSize: 16, color: 'rgb(0, 51, 161)' }} />
                </span>
              </Tooltip>
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgb(0, 51, 161)',
                minWidth: '20px'
              }}
            >
              {loading ? initialLikeCount : likeCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CommentIcon sx={{ fontSize: 16, color: 'rgb(0, 51, 161)' }} />
            <Typography variant="caption" sx={{ color: 'rgb(0, 51, 161)' }}>
              {commentCount}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContentCard;