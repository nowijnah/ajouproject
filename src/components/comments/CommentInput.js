import React, { useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const CommentInput = ({ onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            endIcon={<SendIcon />}
            disabled={!content.trim()}
          >
            등록
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CommentInput;