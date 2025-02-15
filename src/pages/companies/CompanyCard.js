import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { ThumbUp as ThumbUpIcon, ChatBubbleOutline as CommentIcon } from '@mui/icons-material';
import { contentCardStyles } from '../../components/common/styles';

const CompanyCard = ({ 
  id,
  title, 
  description, 
  image, 
  likeCount = 0, 
  commentCount = 0 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/companies/${id}`);
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
          image={image || '/default-company-thumbnail.jpg'}
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
            <ThumbUpIcon sx={{ fontSize: 16, color: 'rgb(0, 51, 161)' }} />
            <Typography variant="caption" sx={{ color: 'rgb(0, 51, 161)' }}>
              {likeCount}
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

export default CompanyCard;