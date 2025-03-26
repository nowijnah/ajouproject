import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import CodeIcon from '@mui/icons-material/Code';

/**
 * 게시물 키워드 컴포넌트 - 기술 스택이나 주요 키워드 태그 표시
 */
const PostKeywords = ({ keywords = [] }) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <Box sx={{ 
      px: 4, 
      py: 5,
      borderTop: '1px solid',
      borderColor: 'divider',
      background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
    }}>
      <Box sx={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 1
        }}>
          <CodeIcon 
            sx={{ 
              color: '#0066CC',
              fontSize: '1.5rem'
            }} 
          />
          <Typography 
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#1a1a1a',
              fontSize: '1.1rem',
              letterSpacing: '0.3px'
            }}
          >
            Keywords
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1.2,
          px: 0.5
        }}>
          {keywords.map((keyword, index) => (
            <Chip
              key={`${keyword}-${index}`}
              label={keyword}
              sx={{
                bgcolor: 'rgba(0, 102, 204, 0.08)',
                color: '#0066CC',
                border: '1px solid rgba(0, 102, 204, 0.2)',
                borderRadius: '8px',
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.8,
                  fontSize: '0.875rem',
                  fontWeight: 500
                },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 102, 204, 0.12)',
                  transform: 'translateY(-1px)'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PostKeywords;