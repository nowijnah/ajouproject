import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Box, 
  Avatar,
  TextField,
  Button
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon 
} from '@mui/icons-material';

const Comment = ({ author, content, timestamp, onEdit, onDelete, onReply, isEditable, isReply }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [replyContent, setReplyContent] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onEdit(editedContent);
      setIsEditing(false);
    }
  };

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <Card sx={{ 
      mb: 2, 
      boxShadow: isReply ? 0 : 1,
      bgcolor: isReply ? 'rgba(0, 0, 0, 0.02)' : 'white'  
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ 
            bgcolor: isReply ? 'secondary.main' : 'primary.main', 
            width: isReply ? 28 : 32, 
            height: isReply ? 28 : 32,
            mr: 2 
          }}>
            {author?.name?.[0] || '?'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
              {author?.name || '익명'}
            </Typography>
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
              {new Date(timestamp).toLocaleString()}
            </Typography>
          </Box>
          {isEditable && !isEditing && (
            <Box>
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          {isEditing && (
            <Box>
              <IconButton size="small" color="primary" onClick={handleSave}>
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={handleCancel}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        {!isEditing ? (
          <Typography variant="body2" sx={{ ml: 6 }}>
            {content}
          </Typography>
        ) : (
          <Box sx={{ ml: 6 }}>
            <TextField
              fullWidth
              multiline
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
        )}
        {!isReply && (
          <Button 
            size="small" 
            onClick={() => setIsReplying(true)}
            sx={{ ml: 6, mt: 1 }}
          >
            답글 달기
          </Button>
        )}
        {isReplying && (
          <Box sx={{ ml: 6, mt: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleReplySubmit}
              >
                답글 달기
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setIsReplying(false)}
              >
                취소
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Comment;