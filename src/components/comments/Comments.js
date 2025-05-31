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

  // 댓글 작성 권한 확인
  const getCommentPermissionMessage = () => {
    if (!currentUser) {
      return { type: 'info', message: '댓글을 작성하려면 로그인이 필요합니다.' };
    }

    // 로그인 차단 체크 (가장 우선순위)
    if (currentUser.isBlocked === true) {
      return { 
        type: 'error', 
        message: '계정이 관리자에 의해 차단되어 서비스 이용이 제한됩니다.\n문의사항이 있으시면 관리자에게 연락해주세요.' 
      };
    }

    // 댓글 금지 체크
    if (currentUser.isCommentBanned === true) {
      return { 
        type: 'warning', 
        message: '댓글 작성이 제한된 계정입니다.\n문의사항이 있으시면 관리자에게 연락해주세요.' 
      };
    }

    // 승인되지 않은 기업 계정 체크
    if (currentUser.role === 'DEFAULT') {
      return { 
        type: 'info', 
        message: '승인된 회사 계정만 댓글을 작성할 수 있습니다.' 
      };
    }

    // 모든 조건을 통과하면 댓글 작성 허용
    return null;
  };

  const permissionMessage = getCommentPermissionMessage();

  return (
    <div>
      {permissionMessage ? (
        <Alert severity={permissionMessage.type} sx={{ mb: 2 }}>
          {permissionMessage.message}
        </Alert>
      ) : (
        <CommentInput onSubmit={addComment} />
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