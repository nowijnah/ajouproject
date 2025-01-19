const CommentInput = ({ onSubmit }) => {
    const [content, setContent] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(content);
      setContent('');
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하시죠"
        />
        <button type="submit">등록</button>
      </form>
    );
  };