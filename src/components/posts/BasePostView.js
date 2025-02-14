import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ReactMarkdown from 'react-markdown';
import {useAuth} from '../auth/AuthContext';
import { 
    Container, Paper, Typography, Box, Button, 
    Grid, Dialog, DialogContent, DialogTitle, 
    DialogActions, IconButton, Avatar, Tooltip,
    useTheme 
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
    Link as LinkIcon
} from '@mui/icons-material';
import Comments from '../comments/Comments';

function BasePostView({
    collectionName,
    previewData,     
    previewAuthor, 
    currentUser,  
    onLike,
    onEdit
   }) {
    const theme = useTheme();
    const { postId } = useParams();
    const navigate = useNavigate();
   
    const [postData, setPostData] = useState(previewData || null);
    const [authorData, setAuthorData] = useState(previewAuthor || null);
    const [likeData, setLikeData] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLiked, setIsLiked] = useState(
      likeData?.some(like => like.userId === currentUser?.userId) || false
    );
      
    useEffect(() => {
        const fetchPost = async () => {
          // preview 모드 체크
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
              }
            } catch (error) {
              console.error('Error fetching post:', error);
            }
          }
        };
      
        fetchPost();
    }, [collectionName, postId, previewData, previewAuthor]);
    
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
    const handleLike = () => {
      if (!currentUser) return;
      setIsLiked(!isLiked);
      onLike && onLike({
        postId: postData.postId,
        userId: currentUser.userId,
        isLiked: !isLiked
      });
    };
  
    // 작성자 프로필로 이동
    const handleAuthorClick = () => {
      window.location.href = `/profile/${authorData.userId}`;
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
                    authorData?.userId === currentUser?.userId 
                        ? `좋아요 ${postData.likeCount}개`
                        : isLiked ? '좋아요 취소' : '좋아요'
                    }>
                    <IconButton 
                        onClick={handleLike}
                        sx={{ 
                        color: isLiked ? 'primary.main' : 'grey.500',
                        '&:hover': { color: 'primary.main' }
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
                    {postData.likeCount}
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

            {!previewData && (  // 미리보기가 아닐 때만 댓글 표시
                <Box sx={{ 
                    px: 4, 
                    py: 4,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    댓글
                    </Typography>
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