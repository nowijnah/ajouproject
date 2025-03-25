import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';


/**
 * 키워드 입력 컴포넌트
 */
const KeywordInput = ({ keywords, onAdd, onDelete }) => {
  const [newKeyword, setNewKeyword] = useState('');

  const handleKeywordAdd = (e) => {
    // IME 입력 중인 경우 처리하지 않음 (한국어, 일본어 등)
    if (e.type === 'keydown' && e.nativeEvent.isComposing) {
      return;
    }
    
    // 엔터키 입력 시 키워드 추가
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      
      if (newKeyword.trim()) {
        const trimmedKeyword = newKeyword.trim().toLowerCase();
        
        // 중복 키워드가 아닌 경우에만 추가
        if (!keywords.includes(trimmedKeyword)) {
          onAdd(trimmedKeyword);
          setNewKeyword('');
        }
      }
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        키워드
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        사용한 기술 스택이나 주요 키워드를 입력해주세요. (Enter로 추가)
      </Typography>
      <TextField
        fullWidth
        value={newKeyword}
        onChange={(e) => setNewKeyword(e.target.value)}
        onKeyDown={handleKeywordAdd}
        placeholder="키워드 입력 후 Enter"
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1 
      }}>
        {keywords.map((keyword) => (
          <Chip
            key={keyword}
            label={keyword}
            onDelete={() => onDelete(keyword)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
    </Box>
  );
};

export default KeywordInput;