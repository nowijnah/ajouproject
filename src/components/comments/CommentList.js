import React from 'react';
import { Box } from '@mui/material';
import Comment from './Comment';

const CommentList = ({ comments = [], onEdit, onDelete, currentUser }) => {
  return (
    <Box sx={{ mt: 2 }}>
      {comments.map(comment => (
        <Comment
          key={comment.id}
          author={comment.author}
          content={comment.content} 
          timestamp={comment.timestamp}
          isEditable={comment.author?.id === currentUser?.id}
          onEdit={(newContent) => onEdit(comment.id, newContent)}  
          onDelete={() => onDelete(comment.id)}
        />
      ))}
    </Box>
  );
};

export default CommentList;