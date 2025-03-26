import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import DialogContentText from '@mui/material/DialogContentText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import PersonIcon from '@mui/icons-material/Person';
import CloneToPortfolioButton from '../CloneToPortfolioButton';

/**
 * 게시물 헤더 컴포넌트 - 작성자 정보, 좋아요, 수정/삭제 버튼 등을 표시
 */
const PostHeader = ({
  postId,
  postData,
  authorData,
  isLiked,
  likeCount,
  isPreview,
  currentUser,
  collectionName,
  onDelete,
  onLike,
  onAuthorClick,
}) => {
  const navigate = useNavigate();
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 소프트콘 프로젝트인지 확인
  const isSoftconProject = collectionName === 'softcon_projects';

  // 좋아요 목록 보기
  const handleOpenLikes = () => {
    if (likeCount > 0) {  // 좋아요가 있을 때만 팝업 열기
      setShowLikesDialog(true);
      fetchLikedUsers();
    }
  };

  const handleCloseLikes = () => {
    setShowLikesDialog(false);
  };

  // 좋아요한 유저 목록 가져오기
  const fetchLikedUsers = async () => {
    // 이 함수는 컴포넌트를 사용하는 상위 컴포넌트에서 props로 받거나,
    // 여기서 직접 구현할 수 있습니다. 우선 상위 컴포넌트에서 받아와서 처리하도록 수정
    try {
      setLoadingLikes(true);
      // 여기서 좋아요한 유저 목록을 가져오는 로직 구현
      // ...
      
      setLoadingLikes(false);
    } catch (error) {
      console.error('Error fetching liked users:', error);
      setLoadingLikes(false);
    }
  };

  // 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/${collectionName}/${postId}/edit`);
  };

  // 삭제 확인 다이얼로그 열기
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (deleting) return;
    
    try {
      setDeleting(true);
      await onDelete();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeleting(false);
    }
  };

  // 유저 프로필 페이지로 이동
  const handleUserClick = (userId) => {
    handleCloseLikes();
    if (currentUser?.uid === userId) {
      navigate('/mypage');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <>
      {/* 작성자 정보 및 액션 버튼 */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box 
          onClick={onAuthorClick}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
        >
          <Avatar 
            src={authorData?.profileImage} 
            alt={authorData?.displayName}
            sx={{ width: 48, height: 48 }}
          >
            {!authorData?.profileImage && authorData?.displayName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {authorData?.displayName || '사용자'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {authorData?.role === 'STUDENT' ? '학생' : 
                authorData?.role === 'COMPANY' ? '기업' :
                authorData?.role === 'PROFESSOR' ? '교수' : '관리자'}
            </Typography>
          </Box>
        </Box>

        {!isPreview && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 소프트콘 프로젝트이고 STUDENT 권한이 있을 때 복제 버튼 표시 */}
            {isSoftconProject && currentUser?.role === 'STUDENT' && (
              <CloneToPortfolioButton postData={postData} postId={postId} />
            )}
            
            {/* 작성자일 경우 수정/삭제 버튼 */}
            {currentUser?.uid === authorData?.id && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="수정">
                  <IconButton
                    onClick={handleEdit}
                    sx={{ 
                      color: 'rgb(0, 51, 161)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 51, 161, 0.04)'
                      }
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                  <IconButton
                    onClick={handleDeleteClick}
                    sx={{ 
                      color: '#d32f2f',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.04)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
            {/* 좋아요 버튼과 카운트 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentUser ? (
                <Tooltip title={isLiked ? '좋아요 취소' : '좋아요'}>
                  <IconButton 
                    onClick={onLike}
                    sx={{ 
                      color: isLiked ? 'rgb(0, 51, 161)' : 'grey.500',
                      '&:hover': { bgcolor: 'rgba(0, 51, 161, 0.04)' }
                    }}
                  >
                    {isLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="로그인이 필요합니다">
                  <span>
                    <IconButton disabled>
                      <ThumbUpOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Typography 
                variant="body2" 
                color="text.secondary"
                onClick={handleOpenLikes}
                className="likes-trigger"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { 
                    color: 'rgb(0, 51, 161)',
                    textDecoration: 'underline'
                  }
                }}
              >
                {likeCount}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 좋아요 유저 목록 팝업 */}
      <Popover
        open={showLikesDialog}
        onClose={handleCloseLikes}
        anchorEl={document.querySelector('.likes-trigger')}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            width: 250,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
            },
          }
        }}
      >
        {loadingLikes ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : likedUsers.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              아직 좋아요한 사용자가 없습니다.
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 1, pb: 1 }}>
            {likedUsers.map((user) => (
              <ListItem 
                button 
                onClick={() => handleUserClick(user.id)}
                key={user.id}
                sx={{ 
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 51, 161, 0.04)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={user.profileImage}
                    alt={user.displayName}
                    sx={{ width: 32, height: 32 }}
                  >
                    {!user.profileImage && <PersonIcon sx={{ fontSize: 20 }} />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.displayName}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { fontWeight: 500 }
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          게시글 삭제
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            정말로 이 게시글을 삭제하시겠습니까?
            삭제된 게시글은 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            취소
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={deleting}
            autoFocus
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostHeader;