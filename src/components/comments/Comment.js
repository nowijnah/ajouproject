import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Box, 
  Avatar,
  TextField
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon 
} from '@mui/icons-material';

const Comment = ({ author, content, timestamp, onEdit, onDelete, isEditable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

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

  return (
    <Card sx={{ mb: 2, boxShadow: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 2 }}>
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
      </CardContent>
    </Card>
  );
};

export default Comment;