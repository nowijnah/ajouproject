import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
/**
 * 썸네일 이미지 업로더 컴포넌트
 */
const ThumbnailUploader = ({ thumbnail, onChange, onRemove }) => {
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onChange(file);
    } else {
      alert('이미지 파일을 선택하세요.');
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" gutterBottom>
        대표 이미지
      </Typography>
      <Box sx={{ 
        border: '2px dashed',
        borderColor: thumbnail ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        p: 2,
        position: 'relative',
      }}>
        {thumbnail ? (
          <Box sx={{ position: 'relative' }}>
            <img
              src={thumbnail instanceof File ? URL.createObjectURL(thumbnail) : thumbnail}
              alt="Thumbnail preview"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '4px',
              }}
            />
            <IconButton
              onClick={onRemove}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Button
            component="label"
            sx={{
              width: '100%',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            <ImageIcon sx={{ fontSize: 40 }} />
            <Typography>대표 이미지 추가</Typography>
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ThumbnailUploader;