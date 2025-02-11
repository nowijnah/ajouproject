import React from 'react';
import { useAuth } from '../auth/AuthContext';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import commentsHook from '../../hooks/commentsHook';

const Comments = ({ postId, collectionName }) => {
  const { currentUser } = useAuth();
  const { 
    comments, 
    loading, 
    error,
    addComment, 
    addReply,
    editComment, 
    deleteComment 
  } = commentsHook(postId, collectionName);

  if (loading) return <div>댓글을 불러오는 중...</div>;
  if (error) return <div>댓글을 불러오는데 실패했습니다.</div>;
  if (!currentUser) return <div>댓글을 작성하려면 로그인이 필요합니다.</div>;

  return (
    <div>
      <CommentInput onSubmit={addComment} />
      <CommentList
        comments={comments}
        onEdit={editComment}
        onDelete={deleteComment}
        onReply={addReply}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Comments;