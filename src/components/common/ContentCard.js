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
import { useAuth } from '../auth/AuthContext';
import { contentCardStyles } from '../../components/card/styles';
import useLike from '../../hooks/useLike';

const ContentCard = ({ 
  id,
  title, 
  description, 
  image, 
  likeCount: initialLikeCount = 0, 
  commentCount = 0,
  type = 'portfolio', // 'portfolio', 'company', 'lab'
  files = [],
  customStyles = {} // 추가적인 스타일 오버라이드를 위한 props
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isLiked, likeCount, loading, toggleLike } = useLike(
    id, 
    `${type}s`, // portfolios, companies, labs
    currentUser?.uid || null
  );

  // 이미지 처리
  const getDisplayImage = () => {
    // 1. 기존 썸네일 이미지가 있으면 사용
    if (image) return image;
    
    // 2. 첨부 파일 중 이미지가 있으면 첫 번째 이미지 사용
    const imageFile = files?.find(file => file.type === 'IMAGE' && file.url);
    if (imageFile) return imageFile.url;
    
    // 3. 기본 이미지 사용
    return `/default-img.png`;
  };

  const handleClick = () => {
    navigate(`/${type}s/${id}`);
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