import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useAuth } from '../auth/AuthContext';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import commentsHook from '../../hooks/commentsHook';

const Comments = ({ postId, collectionName, postAuthorId }) => {
  const { currentUser } = useAuth();
  const { 
    comments, 
    loading, 
    error,
    hasMore,
    loadMoreComments,
    addComment, 
    addReply,
    editComment, 
    deleteComment 
  } = commentsHook(postId, collectionName);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          댓글을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (collectionName === 'softcon_projects') {
    return (
      <Typography 
        color="text.secondary" 
        textAlign="center" 
        sx={{ py: 4 }}
      >
        댓글이 허용되지 않은 게시물입니다.
      </Typography>
    );
  }


  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        댓글을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  return (
    <div>
      {currentUser ? (
        currentUser.role === 'default' ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            승인된 회사 계정만 댓글을 작성할 수 있습니다.
          </Alert>
        ) : (
          <CommentInput onSubmit={addComment} />
        )
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          댓글을 작성하려면 로그인이 필요합니다.
        </Alert>
      )}
      
      <CommentList
        comments={comments}
        onEdit={editComment}
        onDelete={deleteComment}
        onReply={addReply}
        currentUser={currentUser}
        postAuthorId={postAuthorId} 
        hasMore={hasMore}
        onLoadMore={loadMoreComments}
        postId={postId}  
        collectionName={collectionName} 
      />
    </div>
  );
};

export default Comments;