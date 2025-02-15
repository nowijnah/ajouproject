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
    updateDoc
  } from 'firebase/firestore';
import { db } from '../../firebase';
import ReactMarkdown from 'react-markdown';
import useLike from '../../hooks/useLike'; 
import {useAuth} from '../auth/AuthContext';
import { 
    Container, Paper, Typography, Box, Button, 
    Grid, Dialog, DialogContent, DialogTitle, 
    DialogActions, IconButton, Avatar, Tooltip,
    useTheme, Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    Close as CloseIcon,
    ThumbUp as ThumbUpIcon,
    ThumbUpOutlined as ThumbUpOutlinedIcon,
    FilePresent as FileIcon,
    Download as DownloadIcon,
    OpenInNew as OpenInNewIcon,
    Image as ImageIcon,
    GitHub as GitHubIcon,
    YouTube as YouTubeIcon,
    Link as LinkIcon,
    Code as CodeIcon
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
    const { currentUser } = useAuth();
    const navigate = useNavigate();
   
    const [postData, setPostData] = useState(previewData || null);
    const [authorData, setAuthorData] = useState(previewAuthor || null);
    const [selectedFile, setSelectedFile] = useState(null);
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
                // preview 모드에서도 좋아요 상태 초기화
                if (currentUser) {
                    await initializeLikeStatus(currentUser.uid);
                }
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
    }, [collectionName, postId, previewData, previewAuthor, currentUser]); // currentUser 의존성 추가

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

    if (!postData || !authorData) return <div>Loading...</div>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
    
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentUser ? (
                    <Tooltip title={
                     isLiked ? '좋아요 취소' : '좋아요'
                    }>
                    <IconButton 
                        onClick={handleLike}
                        sx={{ 
                        color: isLiked ? 'rgb(0, 51, 161)' : 'grey.500',
                        '&:hover': { color: 'rgb(0, 51, 161)' }
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
                <Typography variant="body2" color="text.secondary">
                    {likeCount}
                </Typography>
                </Box>
            </Box>
    
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
                    }}
                >
                    {postData.subtitle}
                </Typography>
                )}
    
            {currentUser?.userId === authorData?.userId && (
                <IconButton
                onClick={handleEdit}
                sx={{ 
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    color: '#0066CC',
                }}
                >
                <EditIcon />
                </IconButton>
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
                    src={postData.thumbnail}
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
                            mb: 2
                        },
                        '& p': {
                            mb: 2,
                            lineHeight: 1.7
                        },
                        '& a': {
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
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
                        objectFit: 'contain'
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                    댓글 {postData.commentCount || 0}
            </Typography>
            </Box>
            
            {!previewData && (  // 미리보기가 아닐 때만 댓글 표시
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
                )}
            </Paper>
        </Container>
    );
}

export default BasePostView;