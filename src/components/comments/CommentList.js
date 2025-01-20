import React from 'react';
import { Box } from '@mui/material';
import Comment from './Comment';

const CommentList = ({ comments = [], onEdit, onDelete, onReply, currentUser }) => {
  const getCommentsWithReplies = () => {
    const parentComments = comments.filter(comment => !comment.parentId);
    
    return parentComments.map(comment => {
      const replies = comments.filter(reply => reply.parentId === comment.id);
      
      return (
        <Box key={comment.id}>
          {/* 댓글 */}
          <Comment
            author={comment.author}
            content={comment.content}
            timestamp={comment.timestamp}
            isEditable={comment.author?.id === currentUser?.id}
            onEdit={(newContent) => onEdit(comment.id, newContent)}
            onDelete={() => onDelete(comment.id)}
            onReply={(content) => onReply(comment.id, content)}
            isReply={false} 
          />
          
          {/* 답글 */}
          <Box sx={{ ml: 6, borderLeft: '2px solid #e0e0e0', pl: 2 }}>
            {replies.map(reply => (
              <Comment
                key={reply.id}
                author={reply.author}
                content={reply.content}
                timestamp={reply.timestamp}
                isEditable={reply.author?.id === currentUser?.id}
                onEdit={(newContent) => onEdit(reply.id, newContent)}
                onDelete={() => onDelete(reply.id)}
                isReply={true} 
              />
            ))}
          </Box>
        </Box>
      );
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      {getCommentsWithReplies()}
    </Box>
  );
};

export default CommentList;