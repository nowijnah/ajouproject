const CommentList = ({ 
    comments, 
    onEdit,         
    onDelete,  
    currentUser
  }) => {
    return (
      <div className="comment-list">
        {comments.map(comment => (
          <Comment
            key={comment.id}
            {...comment}
            isEditable={comment.author.id === currentUser?.id}
            onEdit={() => onEdit(comment.id)}
            onDelete={() => onDelete(comment.id)}
          />
        ))}
      </div>
    );
  };