import React, { useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../auth/AuthContext';

const roleConfig = {
  STUDENT: { label: '학생', color: 'primary' },
  PROFESSOR: { label: '교수', color: 'secondary' },
  COMPANY: { label: '기업', color: 'success' },
  ADMIN: { label: '관리자', color: 'error' }
};

const CommentInput = ({ 
  onSubmit, 
  isReply, 
  parentIsPrivate
}) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // 비공개 댓글 답글일 경우
  const isPrivateDisabled = isReply && parentIsPrivate;
  const effectiveIsPrivate = isPrivateDisabled ? true : isPrivate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content, effectiveIsPrivate);
      setContent('');
      if (!isPrivateDisabled) {
        setIsPrivate(false);
      }
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Avatar 
          sx={{ width: 32, height: 32 }}
          src={currentUser?.profileImage || null}
        >
          {(currentUser?.displayName?.[0] || '?').toUpperCase()}
        </Avatar>
        <Typography variant="subtitle2">
          {currentUser ? (currentUser.displayName || '사용자') : '익명'}
        </Typography>
        {currentUser?.role && (
          <Chip
            label={roleConfig[currentUser.role]?.label || currentUser.role}
            color={roleConfig[currentUser.role]?.color || 'default'}
            size="small"
            sx={{ height: 20 }}
          />
        )}
      </Box>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
          size="small"
          sx={{ mb: 1 }}
        />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Tooltip title={
            isPrivateDisabled 
              ? "원본 댓글이 비공개이므로 답글도 비공개입니다" 
              : "비공개 댓글은 작성자와 게시글 작성자만 볼 수 있습니다"
          }>
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveIsPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  size="small"
                  disabled={isPrivateDisabled}
                  icon={<LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />}
                  checkedIcon={<LockIcon sx={{ fontSize: 20 }} />}
                />
              }
              label={
                <Typography 
                  variant="body2" 
                  color={isPrivateDisabled ? "text.disabled" : "text.secondary"}
                >
                  비공개 {isReply ? '답글' : '댓글'}
                </Typography>
              }
            />
          </Tooltip>
          <Button 
            type="submit" 
            variant="contained" 
            size="small"
            disabled={!content.trim()}
          >
            {isReply ? '답글 달기' : '댓글 달기'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CommentInput;