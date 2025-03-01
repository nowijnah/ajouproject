import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    deleteDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db } from '../../firebase';
import ReactMarkdown from 'react-markdown';
import useLike from '../../hooks/useLike'; 
import {useAuth} from '../auth/AuthContext';
import { 
    Container, Paper, Typography, Box, Button, 
    Grid, Popover, IconButton, Avatar, Tooltip,
    useTheme, Chip, List, ListItem, ListItemAvatar, 
    ListItemText, Dialog, DialogContent, DialogTitle, 
    DialogActions, DialogContentText
} from '@mui/material';
import {
    Edit as EditIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    ThumbUp as ThumbUpIcon,
    ThumbUpOutlined as ThumbUpOutlinedIcon,
    FilePresent as FileIcon,
    Download as DownloadIcon,
    OpenInNew as OpenInNewIcon,
    Image as ImageIcon,
    GitHub as GitHubIcon,
    YouTube as YouTubeIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import Comments from '../comments/Comments';


function BasePostView({
    collectionName,
    previewData,     
    previewAuthor,
    onLike,
    onEdit
   }) {
    const theme = useTheme();
    const { postId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [postData, setPostData] = useState(previewData || null);
    const [authorData, setAuthorData] = useState(previewAuthor || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showLikesDialog, setShowLikesDialog] = useState(false);
    const [likedUsers, setLikedUsers] = useState([]);
    const [loadingLikes, setLoadingLikes] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // currentUser.uid를 useLike 훅에 전달
    const { isLiked, likeCount, toggleLike } = useLike(
        postId, 
        collectionName,
        currentUser?.uid || null
    );
      
    useEffect(() => {
        const fetchPost = async () => {
          if (previewData) {
            setPostData(previewData);
            setAuthorData(previewAuthor);
            return;
          }
      
          // 실제 데이터 fetch
          if (collectionName && postId) {
            try {
              const postDoc = await getDoc(doc(db, collectionName, postId));
              if (postDoc.exists()) {
                const data = postDoc.data();
                setPostData({ id: postDoc.id, ...data });
                
                // 작성자 정보 가져오기
                if (data.authorId) {
                  const authorDoc = await getDoc(doc(db, 'users', data.authorId));
                  if (authorDoc.exists()) {
                    setAuthorData({ id: authorDoc.id, ...authorDoc.data() });
                  }
                }

                // 좋아요 상태 초기화 (작성자 정보 가져온 후)
                if (currentUser) {
                    await initializeLikeStatus(currentUser.uid);
                }
              }
            } catch (error) {
              console.error('Error fetching post:', error);
            }
          }
        };
      
        fetchPost();
    }, [collectionName, postId, previewData, previewAuthor, currentUser]);
    
    const fetchLikedUsers = async () => {
        if (!postId || previewData) return;
        
        try {
            setLoadingLikes(true);
            const likesRef = collection(db, 'likes');
            const q = query(likesRef, where('postId', '==', postId));
            const likesSnapshot = await getDocs(q);
            
            const usersPromises = likesSnapshot.docs.map(async (likeDoc) => {
                const userData = likeDoc.data();
                const userDoc = await getDoc(doc(db, 'users', userData.userId));
                if (userDoc.exists()) {
                    return {
                        id: userDoc.id,
                        ...userDoc.data()
                    };
                }
                return null;
            });
            
            const users = (await Promise.all(usersPromises)).filter(user => user !== null);
            setLikedUsers(users);
        } catch (error) {
            console.error('Error fetching liked users:', error);
        } finally {
            setLoadingLikes(false);
        }
    };

    const handleOpenLikes = () => {
        if (likeCount > 0) {  // 좋아요가 있을 때만 팝업 열기
            setShowLikesDialog(true);
            fetchLikedUsers();
        }
    };

    const handleCloseLikes = () => {
        setShowLikesDialog(false);
    };

    const handleUserClick = (userId) => {
        handleCloseLikes();
        if (currentUser?.uid === userId) {
            navigate('/mypage');
        } else {
            navigate(`/profile/${userId}`);
        }
    };

    const handleEdit = () => {
        navigate(`/${collectionName}/${postId}/edit`);
    };                                                                

    // 파일 미리보기
    const handleFileClick = (file) => {
      setSelectedFile(file);
    };
  
    const handleClosePreview = () => {
      setSelectedFile(null);
    };

    // 파일 다운로드 
    const handleDownload = (file) => {
        window.open(file.url, '_blank');
      };
  
    // 좋아요
    const handleLike = async () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            await toggleLike();
        } catch (error) {
            alert(error.message);
        }
    };
  
    // 작성자 프로필로 이동
    const handleAuthorClick = () => {
        if (!authorData?.id) return;
    
        if (currentUser?.uid === authorData.id) {
            navigate('/mypage');
        } else {
            navigate(`/profile/${authorData.id}`);
        }
    };

    // 대표 이미지 가져오기
    const getDisplayImage = () => {
        // 1. 기존 썸네일 이미지가 있으면 사용
        if (postData.thumbnail && postData.thumbnail !== 'undefined') 
            return postData.thumbnail;
        
        // 2. 첨부 파일 중 이미지가 있으면 첫 번째 이미지 사용
        const imageFile = postData.files?.find(file => file.type === 'IMAGE' && file.url);
        if (imageFile) return imageFile.url;
        
        // 3. 기본 이미지 사용
        return `/default-img.png`;
    };
  
    // 링크 아이콘 선택
    const getLinkIcon = (type) => {
      switch (type) {
        case 'GITHUB':
          return <GitHubIcon />;
        case 'YOUTUBE':
          return <YouTubeIcon />;
        default:
          return <LinkIcon />;
      }
    };

    const handleDelete = async () => {
        if (!currentUser || !postData || deleting) return;
        
        try {
            setDeleting(true);

            const batch = writeBatch(db);
            
            // 1. 댓글 삭제
            const commentsRef = collection(db, `${collectionName}_comments`);
            const commentsQuery = query(commentsRef, where("postId", "==", postId));
            const commentsSnapshot = await getDocs(commentsQuery);
            commentsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 2. 좋아요 삭제
            const likesRef = collection(db, 'likes');
            const likesQuery = query(likesRef, where("postId", "==", postId));
            const likesSnapshot = await getDocs(likesQuery);
            likesSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 3. 파일 삭제 (스토리지)
            if (postData.files) {
                for (const file of postData.files) {
                    if (file.url) {
                        try {
                            const fileRef = ref(storage, file.url);
                            await deleteObject(fileRef);
                        } catch (error) {
                            console.error('Error deleting file:', error);
                        }
                    }
                }
            }

            // 4. 썸네일 삭제 (스토리지)
            if (postData.thumbnail) {
                try {
                    const thumbnailRef = ref(storage, postData.thumbnail);
                    await deleteObject(thumbnailRef);
                } catch (error) {
                    console.error('Error deleting thumbnail:', error);
                }
            }

            // 5. 게시글 문서 삭제
            const postRef = doc(db, collectionName, postId);
            batch.delete(postRef);

            // 일괄 처리 실행
            await batch.commit();

            // 성공 메시지 표시 후 목록 페이지로 이동
            alert('게시글이 삭제되었습니다.');
            navigate(`/${collectionName}`);

        } catch (error) {
            console.error('Error deleting post:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    if (!postData || !authorData) return <div>Loading...</div>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
            
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Author Info and Likes Section */}
            <Box sx={{ 
                p: 3, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box 
                onClick={handleAuthorClick}
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                }}
                >
                    <Box 
                        onClick={handleAuthorClick}
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
                />
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {authorData?.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                    {authorData?.role === 'STUDENT' ? '학생' : 
                        authorData?.role === 'COMPANY' ? '기업' :
                        authorData?.role === 'PROFESSOR' ? '교수' : '관리자'}
                    </Typography>
                </Box>
                </Box>
                </Box>
                {!previewData && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                            onClick={handleLike}
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

            {/* Title Section */}
            <Box sx={{
                position: 'relative',
                textAlign: 'center',
                p: 6
            }}>
                <Typography 
                variant="h1" 
                sx={{
                    color: '#0066CC',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    mb: 2,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    wordBreak: 'break-word', // 추가: 긴 단어 처리
                    whiteSpace: 'pre-wrap'    // 추가: 줄바꿈 유지
                }}
                >
                {postData.title}
                </Typography>
    
                {postData.subtitle && (
                <Typography 
                    variant="subtitle1"
                    sx={{
                    color: '#0066CC',
                    fontSize: '1.1rem',
                    fontWeight: 400,
                    opacity: 0.9,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    wordBreak: 'break-word', // 추가: 긴 단어 처리
                    whiteSpace: 'pre-wrap'    // 추가: 줄바꿈 유지
                    }}
                >
                    {postData.subtitle}
                </Typography>
                )}
    
            </Box>
    
            {/* Thumbnail */}
            {postData.thumbnail && (
                <Box sx={{ 
                width: '100%',
                height: '400px',
                position: 'relative',
                mb: 4
                }}>
                <img
                    src={getDisplayImage()}
                    alt="Post thumbnail"
                    style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    }}
                />
                </Box>
            )}
    
            {/* Content */}
            <Box sx={{ px: 4, py: 6 }}>
                    <Box sx={{ 
                        maxWidth: '800px', 
                        margin: '0 auto',
                        '& img': {
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: theme.shape.borderRadius,
                            my: 2
                        },
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                            color: theme.palette.text.primary,
                            mt: 4,
                            mb: 2,
                            wordBreak: 'break-word'  // 추가: 제목의 긴 단어 처리
                        },
                        '& p': {
                            mb: 2,
                            lineHeight: 1.7,
                            wordBreak: 'break-word',  // 추가: 본문의 긴 단어 처리
                            whiteSpace: 'pre-wrap'     // 추가: 줄바꿈 유지
                        },
                        '& a': {
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            wordBreak: 'break-all',   // 추가: 링크의 긴 단어 처리
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        },
                        '& pre, & code': {
                            whiteSpace: 'pre-wrap',   // 추가: 코드 블록 처리
                            wordBreak: 'break-word',
                            overflowX: 'auto'
                        }
                    }}>
                        <ReactMarkdown>{postData.content}</ReactMarkdown>
                    </Box>
            </Box>

            {/* Keywords */}
            {postData.keywords && postData.keywords.length > 0 && (
                    <Box sx={{ 
                        px: 4, 
                        py: 5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
                    }}>
                        <Box sx={{ 
                            maxWidth: '800px', 
                            margin: '0 auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3
                        }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 1
                            }}>
                                <CodeIcon 
                                    sx={{ 
                                        color: '#0066CC',
                                        fontSize: '1.5rem'
                                    }} 
                                />
                                <Typography 
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#1a1a1a',
                                        fontSize: '1.1rem',
                                        letterSpacing: '0.3px'
                                    }}
                                >
                                    Keywords
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: 1.2,
                                px: 0.5
                            }}>
                                {postData.keywords.map((keyword, index) => (
                                    <Chip
                                        key={`${keyword}-${index}`}
                                        label={keyword}
                                        sx={{
                                            bgcolor: 'rgba(0, 102, 204, 0.08)',
                                            color: '#0066CC',
                                            border: '1px solid rgba(0, 102, 204, 0.2)',
                                            borderRadius: '8px',
                                            '& .MuiChip-label': {
                                                px: 1.5,
                                                py: 0.8,
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            },
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: 'rgba(0, 102, 204, 0.12)',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
            )}
    
            {/* Files Section */}
            {postData.files && postData.files.length > 0 && (
                <Box sx={{ 
                px: 4, 
                py: 4,
                bgcolor: 'grey.50',
                borderTop: '1px solid',
                borderColor: 'divider'
                }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    첨부파일
                </Typography>
                <Grid container spacing={2}>
                    {postData.files.map((file) => (
                    <Grid item xs={12} sm={6} md={4} key={file.fileId}>
                        <Paper
                        elevation={0}
                        onClick={() => handleFileClick(file)}
                        sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                            bgcolor: 'grey.100'
                            }
                        }}
                        >
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2 
                        }}>
                            {file.type === 'IMAGE' ? (
                            <ImageIcon color="primary" />
                            ) : (
                            <FileIcon color="primary" />
                            )}
                            <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" noWrap>
                                {file.filename}
                            </Typography>
                            {file.description && (
                                <Typography 
                                variant="caption" 
                                color="text.secondary"
                                display="block"
                                >
                                {file.description}
                                </Typography>
                            )}
                            </Box>
                        </Box>
                        </Paper>
                    </Grid>
                    ))}
                </Grid>
                </Box>
            )}
    
            {/* Links Section */}
            {postData.links && postData.links.length > 0 && (
                <Box sx={{ 
                px: 4, 
                py: 4,
                borderTop: '1px solid',
                borderColor: 'divider'
                }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    관련 링크
                </Typography>
                <Grid container spacing={2}>
                    {postData.links.map((link) => (
                    <Grid item xs={12} key={link.linkId}>
                        <Paper
                        elevation={0}
                        component="a"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            e.preventDefault();
                            window.open(link.url, '_blank');
                        }}
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            textDecoration: 'none',
                            color: 'inherit',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                            bgcolor: 'grey.50'
                            }
                        }}
                        >
                        {getLinkIcon(link.type)}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">
                            {link.title}
                            </Typography>
                            <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                                display: 'block',
                                textDecoration: 'none'
                            }}
                            >
                            {link.url}
                            </Typography>
                        </Box>
                        <OpenInNewIcon 
                            sx={{ 
                            fontSize: 16,
                            color: 'text.secondary'
                            }} 
                        />
                        </Paper>
                    </Grid>
                    ))}
                </Grid>
                </Box>
            )}
    
            {/* File Preview Dialog */}
            <Dialog
                open={Boolean(selectedFile)}
                onClose={handleClosePreview}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
                }}>
                <Typography variant="h6">
                    {selectedFile?.filename}
                </Typography>
                <IconButton 
                    onClick={handleClosePreview}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
                </DialogTitle>
                
                <DialogContent>
                {selectedFile?.type === 'IMAGE' ? (
                    <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 400
                    }}>
                    <img
                        src={selectedFile.url}
                        alt={selectedFile.filename}
                        style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        objectFit: 'cover'
                        }}
                    />
                    </Box>
                ) : (
                    <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    py: 4
                    }}>
                    <FileIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                    <Typography>
                        이 파일은 미리보기를 지원하지 않습니다
                    </Typography>
                    </Box>
                )}
                </DialogContent>
    
                <DialogActions>
                <Button onClick={handleClosePreview}>
                    닫기
                </Button>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedFile)}
                >
                    다운로드
                </Button>
                </DialogActions>
            </Dialog>

            {!previewData && (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                            댓글 {postData.commentCount || 0}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ 
                        px: 4, 
                        py: 4,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Comments
                            postId={postId}
                            collectionName={collectionName}
                            postAuthorId={postData?.authorId}
                        />
                    </Box>
                </>
            )}
            </Paper>
        </Container>
    );
}

export default BasePostView;