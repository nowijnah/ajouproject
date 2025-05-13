import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import LinkIcon from '@mui/icons-material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * 게시물 링크 컴포넌트 - 관련 링크(GitHub, YouTube 등) 표시
 * 클릭 시 바로 새 탭에서 링크 열기
 */
const PostLinks = ({ links = [],  sourceUrl  }) => {

  const allLinks = [
    ...links,
    sourceUrl
      ? {
          linkId: "source-url",
          url: sourceUrl,
          type: "SOURCE",
          title: "소프트콘 원본 페이지"
        }
      : null
  ].filter(Boolean);
  
  if (!links || links.length === 0) return null;

  // 링크 타입에 따른 아이콘 선택
  const getLinkIcon = (type) => {
    switch (type) {
      case 'GITHUB':
        return <GitHubIcon color="primary" />;
      case 'YOUTUBE':
      case 'VIDEO':
        return <YouTubeIcon color="error" />;
      default:
        return <LinkIcon color="primary" />;
    }
  };

  // 링크 클릭 처리 - 바로 새 탭에서 열기
  const handleLinkClick = (url, e) => {
    e.preventDefault();
    window.open(url, '_blank');
  };
  // 링크 타이틀 표시
  const getLinkTitle = (link) => {
    if (link.title) return link.title;
    
    if (link.type === 'GITHUB') return 'GitHub 저장소';
    if (link.type === 'YOUTUBE' || link.type === 'VIDEO') return '시연 영상';
    
    if (link.url.toLowerCase().includes('.pdf')) return 'PDF 문서';
    
    return '관련 링크';
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
        {allLinks.map((link, index) => (
          <Grid item xs={12} key={link.linkId || link.url || index}>
            <Paper
              elevation={0}
              component="a"
              href={link.url}
              onClick={(e) => handleLinkClick(link.url, e)}
              target="_blank"
              rel="noopener noreferrer"
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
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {getLinkTitle(link)}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    textDecoration: 'none',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
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