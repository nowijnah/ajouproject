import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import useReplies from '../../hooks/useReplies';

const roleConfig = {
  STUDENT: { label: '학생', color: 'primary' },
  PROFESSOR: { label: '교수', color: 'secondary' },
  COMPANY: { label: '기업', color: 'success' },
  ADMIN: { label: '관리자', color: 'error' }
};

const Comment = ({ 
  id,
  author, 
  content, 
  timestamp, 
  onEdit, 
  onDelete, 
  onReply, 
  isEditable, 
  isReply,
  isPrivate,
  currentUser,
  postAuthorId,
  postId,
  collectionName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [replyContent, setReplyContent] = useState('');

  const {
    replyList,
    replyCount,
    loadingReplies,
    hasMoreReplies,
    error,
    loadInitialReplies,
    loadMoreReplies
  } = useReplies(id, postId, collectionName);

  // 권한 체크
  const canViewComment = !isPrivate || 
    (currentUser && currentUser.uid === author?.id) || 
    (currentUser && currentUser.uid === postAuthorId);

  const canReply = currentUser && (
    (!isPrivate && !isReply) ||
    (isPrivate && (
      currentUser.uid === postAuthorId || 
      (author && currentUser.uid === author.id)
    ))
  );

  // 권한이 없으면 비공개 메시지 표시
  if (!canViewComment) {
    return (
      <Card sx={{ 
        mb: 1.5, 
        boxShadow: isReply ? 0 : 1,
        bgcolor: 'grey.50',
        borderRadius: '8px'
      }}>
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <LockIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2">비공개 댓글입니다.</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onEdit(editedContent);
      setIsEditing(false);
    }
  };

  const handleShowReplies = async () => {
    if (!showReplies) {
      await loadInitialReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async () => {
    if (!currentUser) {
      alert('답글을 작성하려면 로그인이 필요합니다.');
      return;
    }
    
    if (replyContent.trim()) {
      await onReply(id, replyContent, isPrivate);
      setReplyContent('');
      setIsReplying(false);
      
      // 답글 작성하고 새로고침
      if (!showReplies) {
        setShowReplies(true);
      }
      await loadInitialReplies();
    }
  };

  return (
    <Card sx={{ 
      mb: 1.5, 
      boxShadow: isReply ? 0 : 1,
      bgcolor: isReply ? 'grey.50' : 'white',
      borderRadius: '8px'
    }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Avatar 
            sx={{ width: 28, height: 28, mr: 1.5 }}
            src={author?.profileImage || null}
          >
            {(author?.displayName?.[0] || '?').toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {author?.displayName || '익명'}
              </Typography>
              {author?.role && (
                <Chip
                  label={roleConfig[author.role]?.label || author.role}
                  color={roleConfig[author.role]?.color || 'default'}
                  size="small"
                  sx={{ height: 20 }}
                />
              )}
              {isPrivate && (
                <Tooltip title="비공개 댓글">
                  <LockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {(timestamp instanceof Date) ? 
                timestamp.toLocaleString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 
                '날짜 없음'}
            </Typography>
          </Box>
          {isEditable && !isEditing && (
            <Box>
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          {isEditing && (
            <Box>
              <IconButton size="small" color="primary" onClick={handleSave}>
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={handleCancel}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {!isEditing ? (
          <Typography
            variant="body2"
            sx={{
              ml: 5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {content}
          </Typography>
        ) : (
          <Box sx={{ ml: 5 }}>
            <TextField
              fullWidth
              multiline
              size="small"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        {/* 댓글에 답글 아이콘 */}
        {!isReply && (
          <Box sx={{ ml: 5, mt: 1, display: 'flex', gap: 1 }}>
            {canReply && (
              <Button 
                size="small" 
                onClick={() => setIsReplying(true)}
                sx={{ 
                  minWidth: 0, 
                  px: 1,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                답글 남기기
              </Button>
            )}
            {replyCount > 0 && (
              <Button
                size="small"
                onClick={handleShowReplies}
                sx={{ 
                  minWidth: 0, 
                  px: 1,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                {showReplies ? '답글 숨기기' : `답글 ${replyCount}개`}
              </Button>
            )}
          </Box>
        )}

        {error && (
          <Typography color="error" variant="caption" sx={{ ml: 5 }}>
            답글을 불러오는데 실패했습니다.
          </Typography>
        )}

        {/* 답글 목록 */}
        {showReplies && (
          <Box sx={{ ml: 5, mt: 1.5 }}>
            {loadingReplies ? (
              <CircularProgress size={20} sx={{ ml: 2 }} />
            ) : (
              <>
                {replyList.map(reply => (
                  <Comment
                    key={reply.id}
                    {...reply}
                    timestamp={reply.createdAt}
                    isReply={true}
                    currentUser={currentUser}
                    postAuthorId={postAuthorId}
                    postId={postId}
                    collectionName={collectionName}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
                {hasMoreReplies && (
                  <Button
                    size="small"
                    onClick={loadMoreReplies}
                    sx={{ 
                      mt: 1,
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    이전 답글 더보기
                  </Button>
                )}
              </>
            )}
          </Box>
        )}

        {/* 답글 작성 폼 */}
        {isReplying && (
          <Box sx={{ ml: 5, mt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="답글을 입력하세요..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
              >
                취소
              </Button>
              <Button 
                size="small" 
                variant="contained"
                onClick={handleReply}
                disabled={!replyContent.trim()}
              >
                답글 달기
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Comment;