import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
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
      {thumbnailUrl && thumbnailUrl !== 'markdown-image' && (
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 4,
          padding: '20px 0'
        }}>
          <img
            src={thumbnailUrl}
            alt="Post thumbnail"
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              objectFit: 'contain',
              display: 'block'
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