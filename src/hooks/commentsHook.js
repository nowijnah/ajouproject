import { useState, useEffect } from 'react';

const commentsHook = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 테스트용 더미 데이터
  useEffect(() => {
    setComments([
      {
        id: 1,
        author: { id: 1, name: '사용자1' },
        content: '테스트 댓글 1',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        author: { id: 2, name: '사용자2' },
        content: '테스트 댓글 2',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const addComment = (content) => {
    const newComment = {
      id: comments.length + 1,
      author: { id: 1, name: '현재 사용자' } /*테스트용!*/ ,
      content,
      timestamp: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);
  };

  // 댓글 수정 함수
  const editComment = (commentId, newContent) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, content: newContent }
        : comment
    ));
  };

  const deleteComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  return {
    comments,
    loading,
    error,
    addComment,
    editComment,
    deleteComment
  };
};

export default commentsHook;