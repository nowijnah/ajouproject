// components/notifications/NotificationMenu.js
import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  ChatBubble as ChatBubbleIcon,
  Reply as ReplyIcon,
  MarkEmailRead as MarkEmailReadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';

const NOTIFICATION_TYPES = {
  COMMENT: 'COMMENT',
  REPLY: 'REPLY'
};

const NotificationMenu = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const open = Boolean(anchorEl);

  // 알림 목록 불러오기
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        
        // 알림 아이템에 필요한 추가 데이터 가져오기
        const notificationsData = await Promise.all(
          snapshot.docs.map(async (notificationDoc) => {
            const data = notificationDoc.data();
            
            // 작성자 정보 가져오기
            let authorData = null;
            try {
              const authorDoc = await getDoc(doc(db, 'users', data.authorId));
              authorData = authorDoc.exists() ? { id: authorDoc.id, ...authorDoc.data() } : null;
            } catch (error) {
              console.error('Author data fetch error:', error);
            }
            
            // 게시물 정보 가져오기
            let postData = null;
            try {
              const postDoc = await getDoc(doc(db, data.collectionName || 'portfolios', data.postId));
              postData = postDoc.exists() ? { id: postDoc.id, ...postDoc.data() } : null;
            } catch (error) {
              console.error('Post data fetch error:', error);
            }
            
            // 댓글 정보 가져오기
            let commentData = null;
            if (data.commentId) {
              try {
                const commentDoc = await getDoc(
                  doc(db, `${data.collectionName || 'portfolios'}_comments`, data.commentId)
                );
                commentData = commentDoc.exists() ? { id: commentDoc.id, ...commentDoc.data() } : null;
              } catch (error) {
                console.error('Comment data fetch error:', error);
              }
            }
            
            // createdAt 처리
            let createdAt = data.createdAt;
            if (createdAt instanceof Timestamp) {
              createdAt = createdAt.toDate();
            } else if (!(createdAt instanceof Date)) {
              createdAt = new Date(createdAt);
            }
            
            return {
              id: notificationDoc.id,
              ...data,
              author: authorData,
              post: postData,
              comment: commentData,
              createdAt
            };
          })
        );
        
        setNotifications(notificationsData);
        
        // 읽지 않은 알림 개수 계산
        const unread = notificationsData.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // 30초마다 알림 새로고침
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // 알림 클릭 시 게시물로 이동
  const handleNotificationClick = async (notification) => {
    try {
      // 알림 읽음 표시
      if (!notification.read) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: new Date()
        });
        
        // 읽음 처리 후 목록 업데이트
        setNotifications(prev => 
          prev.map(item => 
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
        
        // 읽지 않은 알림 개수 업데이트
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Firebase Function 호출
        try {
          const markNotificationAsRead = httpsCallable(functions, 'markNotificationAsRead');
          await markNotificationAsRead({ notificationId: notification.id });
        } catch (error) {
          console.error('Error calling markNotificationAsRead:', error);
        }
      }
      
      // 게시물 페이지로 이동
      if (notification.post) {
        const collectionName = notification.collectionName || 'portfolios';
        navigate(`/${collectionName}/${notification.postId}`);
      }
      
      handleCloseMenu();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // 모든 알림 읽음 표시
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      // 각 알림 읽음 표시
      await Promise.all(
        unreadNotifications.map(notification => 
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
            readAt: new Date()
          })
        )
      );
      
      // 목록 업데이트
      setNotifications(prev => 
        prev.map(item => ({ ...item, read: true }))
      );
      
      setUnreadCount(0);
      
      // 알림 메뉴 닫기
      handleCloseMenu();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}분 전`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  // 알림 타입에 따른 아이콘 및 텍스트 반환
  const getNotificationContent = (notification) => {
    const authorName = notification.author?.displayName || '알 수 없음';
    const postTitle = notification.post?.title || '삭제된 게시물';
    
    if (notification.type === NOTIFICATION_TYPES.COMMENT) {
      return {
        icon: <ChatBubbleIcon sx={{ color: 'primary.main' }} />,
        text: `${authorName}님이 회원님의 게시글 "${postTitle}"에 댓글을 남겼습니다.`
      };
    } else if (notification.type === NOTIFICATION_TYPES.REPLY) {
      return {
        icon: <ReplyIcon sx={{ color: 'primary.main' }} />,
        text: `${authorName}님이 회원님의 댓글에 답글을 남겼습니다.`
      };
    } else {
      return {
        icon: <NotificationsIcon sx={{ color: 'primary.main' }} />,
        text: '새로운 알림이 있습니다.'
      };
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <IconButton
        aria-label="notifications"
        color="inherit"
        onClick={handleOpenMenu}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsIcon />
          ) : (
            <NotificationsNoneIcon />
          )}
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="h6">알림</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              모두 읽음 표시
            </Button>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              새로운 알림이 없습니다
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.map((notification) => {
              const { icon, text } = getNotificationContent(notification);
              return (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: notification.read ? 'none' : '3px solid',
                    borderColor: 'primary.main',
                    bgcolor: notification.read ? 'transparent' : 'rgba(0, 51, 161, 0.05)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.read ? 'normal' : 'bold',
                          mb: 0.5
                        }}
                      >
                        {text}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    }
                  />
                </MenuItem>
              );
            })}
            
            <Divider />
            <MenuItem
              onClick={() => {
                navigate('/settings');
                handleCloseMenu();
              }}
              sx={{ py: 1.5, justifyContent: 'center' }}
            >
              <Typography 
                color="primary" 
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                알림 설정 관리
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu;