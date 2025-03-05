import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  TextField, 
  List, 
  ListItem, 
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * 링크 입력 컴포넌트
 */
const LinkInput = ({ links, onAddLink, onRemoveLink }) => {
  const [newLink, setNewLink] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');

  const handleLinkAdd = (e) => {
    e.preventDefault();
    
    if (!newLink.trim()) return;

    // URL 형식 검증 및 https:// 추가
    let formattedUrl = newLink.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // 링크 타입 자동 감지
    const type = formattedUrl.includes('github.com') ? 'GITHUB'
                : formattedUrl.includes('youtube.com') ? 'YOUTUBE'
                : 'WEBSITE';
    
    // 새 링크 추가
    onAddLink({
      linkId: `link-${Date.now()}-${Math.random()}`,
      url: formattedUrl,
      title: newLinkDescription.trim() || formattedUrl,
      type
    });

    // 입력 필드 초기화
    setNewLink('');
    setNewLinkDescription('');
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        링크 추가
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          type="url"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="URL을 입력하세요"
          variant="outlined"
        />
        <TextField
          fullWidth
          value={newLinkDescription}
          onChange={(e) => setNewLinkDescription(e.target.value)}
          placeholder="링크 설명을 입력하세요"
          variant="outlined"
        />
        <Button
          onClick={handleLinkAdd}
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{ alignSelf: 'flex-end' }}
          disabled={!newLink.trim()}
        >
          링크 추가
        </Button>
      </Box>

      {links.length > 0 && (
        <List sx={{ mt: 2 }}>
          {links.map((link) => (
            <ListItem 
              key={link.linkId}
              sx={{ 
                bgcolor: 'grey.50',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                flex: 1
              }}>
                <Typography>{link.url}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {link.title}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => onRemoveLink(link.linkId)}
                sx={{ color: 'error.main' }}
              >
                <CloseIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default LinkInput;