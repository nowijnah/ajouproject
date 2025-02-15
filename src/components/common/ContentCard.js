import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { ThumbUp as ThumbUpIcon, ThumbUpOutlined as ThumbUpOutlinedIcon, ChatBubbleOutline as CommentIcon } from '@mui/icons-material';
import { useAuth } from '../../components/auth/AuthContext';
import { contentCardStyles } from '../../components/common/styles';
import useLike from '../../hooks/useLike';

const ContentCard = ({ 
  id,
  title, 
  description, 
  image, 
  likeCount: initialLikeCount = 0, 
  commentCount = 0,
  collectionName,
  type
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isLiked, likeCount, loading, toggleLike } = useLike(
    id, 
    collectionName,
    currentUser?.uid || null
  );

  const handleClick = () => {
    navigate(`/${collectionName}/${id}`);
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

  const getDefaultImage = () => {
    switch(type) {
      case 'portfolio':
        return '/default-portfolio-thumbnail.jpg';
      case 'company':
        return '/default-company-thumbnail.jpg';
      default:
        return '/default-thumbnail.jpg';
    }
  };

  return (
    <Card 
      onClick={handleClick}
      sx={{
        ...contentCardStyles.card,
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
          image={image || getDefaultImage()}
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
                  color: isLiked ? 'rgb(0, 51, 161)' : 'text.secondary',
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
                  <ThumbUpOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </span>
              </Tooltip>
            )}
            <Typography variant="caption" sx={{ color: 'rgb(0, 51, 161)' }}>
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