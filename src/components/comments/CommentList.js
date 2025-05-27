import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Comment from './Comment';

const CommentList = ({ 
  comments = [], 
  onEdit, 
  onDelete, 
  onReply, 
  currentUser, 
  postAuthorId, 
  hasMore, 
  onLoadMore,
  postId,         
  collectionName  
}) => {
  // 댓글만 (답글 ㄴㄴ)
  const parentComments = comments.filter(comment => !comment.parentId);
  
  return (
    <Box sx={{ mt: 2 }}>
      {parentComments.length === 0 ? (
        <Typography 
          color="text.secondary" 
          textAlign="center" 
          sx={{ py: 4 }}
        >
          첫 번째 댓글을 작성해보세요.
        </Typography>
      ) : (
        parentComments.map(comment => (
          <Comment
            key={comment.id}
            id={comment.id}   
            author={comment.author}
            content={comment.content}
            timestamp={comment.createdAt}
            authorRole={comment.authorRole}
            isEditable={comment.author?.id === currentUser?.uid}
            onEdit={(newContent) => onEdit(comment.id, newContent)}
            onDelete={() => onDelete(comment.id)}
            onReply={onReply}
            isReply={false}
            isPrivate={comment.isPrivate}
            currentUser={currentUser}
            postAuthorId={postAuthorId}
            postId={postId}  
            collectionName={collectionName} 
          />
        ))
      )}

      {hasMore && parentComments.length >= 10 && (
        <Button 
          fullWidth 
          variant="text" 
          onClick={onLoadMore}
          sx={{ 
            mt: 2,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          댓글 더보기
        </Button>
      )}
    </Box>
  );
};

export default CommentList;