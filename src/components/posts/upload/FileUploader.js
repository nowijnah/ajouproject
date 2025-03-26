import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import UploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';

/**
 * 파일 업로더 컴포넌트
 */
const FileUploader = ({ files, onAddFiles, onUpdateDescription, onRemoveFile }) => {
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    selectedFiles.forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'IMAGE' 
                      : file.type === 'application/pdf' ? 'PDF' 
                      : 'DOC';
      
      onAddFiles({
        fileId: `file-${Date.now()}-${Math.random()}`,
        file: file,
        type: fileType,
        description: ''
      });
    });
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        파일 첨부
      </Typography>
      <Button
        component="label"
        variant="outlined"
        startIcon={<UploadIcon />}
        sx={{ mb: 2 }}
      >
        파일 선택
        <input
          type="file"
          hidden
          multiple
          onChange={handleFileChange}
        />
      </Button>

      {files.length > 0 && (
        <List>
          {files.map((file) => (
            <ListItem 
              key={file.fileId}
              sx={{ 
                bgcolor: 'grey.50',
                borderRadius: 1,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
              }}>
                <Typography>
                  {file.filename || file.file.name}
                </Typography>
                <IconButton 
                  onClick={() => onRemoveFile(file.fileId)}
                  sx={{ color: 'error.main' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="파일 설명 입력"
                value={file.description || ''}
                onChange={(e) => onUpdateDescription(file.fileId, e.target.value)}
                sx={{ mt: 1 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUploader;