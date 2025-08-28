import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import NotificationImportantIcon from '@mui/icons-material/NotificationImportant'; // 벨 모양 신고 아이콘
import ReportDialog from './ReportDialog';

const InlineReportButton = ({ 
  reportType, 
  targetId, 
  targetUserId, 
  targetTitle,
  variant = 'subtle', // 'subtle', 'chip', 'text'
  size = 'small'
}) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleReport = () => {
    setReportDialogOpen(true);
  };

  // 신고 유형별 텍스트
  const getReportText = () => {
    switch (reportType) {
      case 'POST':
        return '게시글 신고';
      case 'COMMENT':
        return '댓글 신고';
      case 'USER':
        return '사용자 신고';
      default:
        return '신고';
    }
  };

  const getShortText = () => {
    switch (reportType) {
      case 'POST':
        return '신고';
      case 'COMMENT':
        return '신고';
      case 'USER':
        return '신고';
      default:
        return '신고';
    }
  };

  // Subtle 버튼 (가장 자연스러운)
  if (variant === 'subtle') {
    return (
      <>
        <Tooltip title={getReportText()}>
          <Button
            size={size}
            onClick={handleReport}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              minWidth: 'auto',
              color: 'text.secondary',
              padding: '2px 8px',
              fontSize: '0.75rem',
              '&:hover': {
                color: 'warning.main',
                backgroundColor: 'rgba(255, 152, 0, 0.08)'
              }
            }}
            startIcon={
              <NotificationImportantIcon 
                sx={{ 
                  fontSize: '14px !important',
                  color: isHovered ? 'warning.main' : 'inherit'
                }} 
              />
            }
          >
            {getShortText()}
          </Button>
        </Tooltip>
        
        <ReportDialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          reportType={reportType}
          targetId={targetId}
          targetUserId={targetUserId}
          targetTitle={targetTitle}
        />
      </>
    );
  }

  // Chip 버튼
  if (variant === 'chip') {
    return (
      <>
        <Tooltip title={getReportText()}>
          <Chip
            icon={<NotificationImportantIcon sx={{ fontSize: '16px !important' }} />}
            label={getShortText()}
            size={size}
            onClick={handleReport}
            sx={{
              height: size === 'small' ? '24px' : '32px',
              fontSize: '0.75rem',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                color: 'warning.main',
                borderColor: 'warning.main',
                backgroundColor: 'rgba(255, 152, 0, 0.08)',
                '& .MuiChip-icon': {
                  color: 'warning.main'
                }
              }
            }}
            variant="outlined"
          />
        </Tooltip>
        
        <ReportDialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          reportType={reportType}
          targetId={targetId}
          targetUserId={targetUserId}
          targetTitle={targetTitle}
        />
      </>
    );
  }

  // Text 버튼 (링크 스타일)
  if (variant === 'text') {
    return (
      <>
        <Box
          component="span"
          onClick={handleReport}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            color: 'text.secondary',
            fontSize: '0.75rem',
            textDecoration: isHovered ? 'underline' : 'none',
            '&:hover': {
              color: 'warning.main'
            }
          }}
        >
          <NotificationImportantIcon sx={{ fontSize: '14px' }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'inherit',
              textDecoration: 'inherit'
            }}
          >
            {getShortText()}
          </Typography>
        </Box>
        
        <ReportDialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          reportType={reportType}
          targetId={targetId}
          targetUserId={targetUserId}
          targetTitle={targetTitle}
        />
      </>
    );
  }

  return null;
};

export default InlineReportButton;