import React from 'react';

const Comment = ({ 
  author,          
  content,        
  timestamp,     
  onEdit,         
  onDelete,       
  isEditable = false, 
}) => {
  return (
    <div className="comment">
      <div className="comment-header">
        <span className="author">{author}</span>
        <span className="timestamp">{timestamp}</span>
      </div>
      <div className="comment-content">
        {content}
      </div>
      {isEditable && (
        <div className="comment-actions">
          <button onClick={onEdit}>수정</button>
          <button onClick={onDelete}>삭제</button>
        </div>
      )}
    </div>
  );
};

export default Comment;