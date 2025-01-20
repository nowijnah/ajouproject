import React from 'react';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import commentsHook from '../../hooks/commentsHook';

const Comments = () => {
  const { 
    comments, 
    loading, 
    addComment, 
    editComment, 
    deleteComment 
  } = commentsHook();
  // error도 추가해야됨.

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <CommentInput onSubmit={addComment} />
      <CommentList
        comments={comments}
        onEdit={editComment}
        onDelete={deleteComment}
        currentUser={{ id: 1, name: "테스트 사용자" } /* test용 -> 유저 정보 받아야 함*/}
      />
    </div>
  );
};

export default Comments;