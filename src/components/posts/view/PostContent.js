import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';

/**
 * 게시물 내용 컴포넌트 - 제목, 부제목, 썸네일 이미지, 마크다운 내용 표시
 */
const PostContent = ({ 
  title, 
  subtitle, 
  content, 
  thumbnailUrl,
  getDisplayImage
}) => {
  const theme = useTheme();

  return (
    <>
      {/* Title Section */}
      <Box sx={{
        position: 'relative',
        textAlign: 'center',
        p: 6
      }}>
        <Typography 
          variant="h1" 
          sx={{
            color: '#0066CC',
            fontSize: '2.5rem',
            fontWeight: 700,
            mb: 2,
            fontFamily: "'Noto Sans KR', sans-serif",
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography 
            variant="subtitle1"
            sx={{
              color: '#0066CC',
              fontSize: '1.1rem',
              fontWeight: 400,
              opacity: 0.9,
              fontFamily: "'Noto Sans KR', sans-serif",
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <Box sx={{ 
          width: '100%',
          height: '400px',
          position: 'relative',
          mb: 4
        }}>
          <img
            src={getDisplayImage ? getDisplayImage() : thumbnailUrl}
            alt="Post thumbnail"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      )}

      {/* Content */}
      <Box sx={{ px: 4, py: 6 }}>
        <Box sx={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: theme.shape.borderRadius,
            my: 2
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            color: theme.palette.text.primary,
            mt: 4,
            mb: 2,
            wordBreak: 'break-word'
          },
          '& p': {
            mb: 2,
            lineHeight: 1.7,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            wordBreak: 'break-all',
            '&:hover': {
              textDecoration: 'underline'
            }
          },
          '& pre, & code': {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowX: 'auto'
          }
        }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </Box>
    </>
  );
};

export default PostContent;