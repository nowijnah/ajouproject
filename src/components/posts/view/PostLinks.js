import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import LinkIcon from '@mui/icons-material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/**
 * 게시물 링크 컴포넌트 - 관련 링크(GitHub, YouTube 등) 표시
 */
const PostLinks = ({ links = [] }) => {
  if (!links || links.length === 0) return null;

  // 링크 타입에 따른 아이콘 선택
  const getLinkIcon = (type) => {
    switch (type) {
      case 'GITHUB':
        return <GitHubIcon />;
      case 'YOUTUBE':
        return <YouTubeIcon />;
      default:
        return <LinkIcon />;
    }
  };

  return (
    <Box sx={{ 
      px: 4, 
      py: 4,
      borderTop: '1px solid',
      borderColor: 'divider'
    }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        관련 링크
      </Typography>
      <Grid container spacing={2}>
        {links.map((link) => (
          <Grid item xs={12} key={link.linkId || link.url}>
            <Paper
              elevation={0}
              component="a"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open(link.url, '_blank');
              }}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'grey.50'
                }
              }}
            >
              {getLinkIcon(link.type)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">
                  {link.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    textDecoration: 'none'
                  }}
                >
                  {link.url}
                </Typography>
              </Box>
              <OpenInNewIcon 
                sx={{ 
                  fontSize: 16,
                  color: 'text.secondary'
                }} 
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PostLinks;