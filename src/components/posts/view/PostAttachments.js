import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Image';

import FileIcon from '@mui/icons-material/FilePresent';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * 게시물 첨부 파일 컴포넌트 - 이미지 및 다운로드 가능한 첨부 파일 표시
 */
const PostAttachments = ({ files = [] }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!files || files.length === 0) return null;

  // 파일 미리보기
  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  // 미리보기 닫기
  const handleClosePreview = () => {
    setSelectedFile(null);
  };

  // 파일 다운로드
  const handleDownload = (file) => {
    window.open(file.url, '_blank');
  };

  return (
    <>
      <Box sx={{ 
        px: 4, 
        py: 4,
        bgcolor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          첨부파일
        </Typography>
        <Grid container spacing={2}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.fileId || file.url}>
              <Paper
                elevation={0}
                onClick={() => handleFileClick(file)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2 
                }}>
                  {file.type === 'IMAGE' ? (
                    <ImageIcon color="primary" />
                  ) : (
                    <FileIcon color="primary" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {file.filename}
                    </Typography>
                    {file.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        display="block"
                      >
                        {file.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 파일 미리보기 다이얼로그 */}
      <Dialog
        open={Boolean(selectedFile)}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {selectedFile?.filename}
          </Typography>
          <IconButton 
            onClick={handleClosePreview}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedFile?.type === 'IMAGE' ? (
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400
            }}>
              <img
                src={selectedFile.url}
                alt={selectedFile.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'cover'
                }}
              />
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 4
            }}>
              <FileIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              <Typography>
                이 파일은 미리보기를 지원하지 않습니다
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePreview}>
            닫기
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload(selectedFile)}
          >
            다운로드
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostAttachments;