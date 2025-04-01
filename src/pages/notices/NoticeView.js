// src/pages/notices/NoticeView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

// 아이콘 import
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';

import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../components/auth/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// 커스텀 렌더러: 링크에 download 속성이 있으면 다운로드 기능 추가
const CustomLink = ({ node, ...props }) => {
  const { href, title, children } = props;
  
  // download 키워드가 title에 있는지 확인
  const isDownloadLink = title === 'download';
  
  if (isDownloadLink) {
    return (
      <Box 
        component="span" 
        sx={{ 
          display: 'inline-flex',
          alignItems: 'center',
          bgcolor: 'rgba(0, 51, 161, 0.1)',
          borderRadius: '4px',
          padding: '4px 8px',
          mr: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'rgba(0, 51, 161, 0.2)'
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          window.open(href, '_blank');
        }}
      >
        <FileDownloadIcon sx={{ fontSize: 16, mr: 0.5 }} />
        {children}
      </Box>
    );
  }
  
  // 일반 링크는 그대로 처리하되, 긴 URL 처리
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{
        wordBreak: 'break-all',
        overflowWrap: 'break-word'
      }}
      {...props} 
    />
  );
};

// 긴 URL을 줄바꿈하여 표시하는 컴포넌트
const BreakableText = ({ children }) => {
  return (
    <span style={{ 
      wordBreak: 'break-all', 
      overflowWrap: 'break-word',
      display: 'inline-block',
      maxWidth: '100%'
    }}>
      {children}
    </span>
  );
};

// 마크다운 내 코드블록을 위한 커스텀 렌더러
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }
  
  return (
    <pre style={{ 
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'break-word',
      maxWidth: '100%'
    }}>
      <code className={className} {...props}>{children}</code>
    </pre>
  );
};

// 마크다운 내 일반 텍스트를 위한 커스텀 렌더러
const Paragraph = ({ children }) => {
  return (
    <p style={{ 
      wordBreak: 'break-word',
      overflowWrap: 'break-word'
    }}>
      {children}
    </p>
  );
};

const NoticeView = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 공지사항 불러오기
  useEffect(() => {
    const fetchNotice = async () => {
      if (!noticeId) return;
      
      try {
        setLoading(true);
        const noticeDoc = await getDoc(doc(db, 'notices', noticeId));
        
        if (noticeDoc.exists()) {
          setNotice({
            id: noticeDoc.id,
            ...noticeDoc.data(),
            createdAt: noticeDoc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: noticeDoc.data().updatedAt?.toDate?.() || new Date()
          });
        } else {
          setError('공지사항을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('공지사항 로드 중 오류:', err);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotice();
  }, [noticeId]);

  // 관리자인지 확인
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  // 공지사항 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/admin/notices`, { state: { editNoticeId: noticeId } });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/notices')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">공지사항</Typography>
      </Box>

      {loading ? (
        <Paper elevation={1} sx={{ borderRadius: 2, p: 4 }}>
          <Skeleton width="70%" height={60} />
          <Skeleton width="30%" height={30} sx={{ mt: 1, mb: 3 }} />
          <Divider sx={{ my: 3 }} />
          <Skeleton height={30} />
          <Skeleton height={30} />
          <Skeleton height={30} />
          <Skeleton height={30} width="80%" />
        </Paper>
      ) : error ? (
        <Paper elevation={1} sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/notices')}
            sx={{ mt: 2 }}
          >
            목록으로 돌아가기
          </Button>
        </Paper>
      ) : notice ? (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                {notice.title}
              </Typography>
              {isAdmin && (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleEdit}
                  sx={{ minWidth: 0, p: 1 }}
                >
                  수정
                </Button>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {notice.createdAt.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              {notice.isMainPageNotice && (
                <Chip 
                  label="메인 표시" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2 }} 
                />
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ 
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                my: 2
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                fontWeight: 600,
                wordBreak: 'break-all',
                overflowWrap: 'break-word'
              },
              '& p': {
                mb: 2,
                lineHeight: 1.7,
                wordBreak: 'break-all',
                overflowWrap: 'break-word'
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                '&:hover': {
                  textDecoration: 'underline'
                }
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'grey.300',
                pl: 2,
                ml: 0,
                color: 'text.secondary',
                wordBreak: 'break-all',
                overflowWrap: 'break-word'
              },
              '& pre, & code': {
                fontFamily: 'monospace',
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                overflowX: 'auto',
                width: '100%'
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2
              }
            }}>
              <ReactMarkdown 
                components={{
                  a: CustomLink,
                  code: CodeBlock,
                  p: Paragraph,
                  // HTML 태그에 클래스를 붙이는 방식으로도 처리
                  text: ({ value }) => <BreakableText>{value}</BreakableText>
                }}
              >
                {notice.content}
              </ReactMarkdown>
            </Box>
            
            {/* 첨부파일 목록 (마크다운 내에 포함되지 않은 파일들) */}
            {notice.files && notice.files.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  첨부 파일
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {notice.files.map((file, index) => {
                    // 파일 타입에 따라 다른 스타일 적용
                    const isImage = file.type === 'IMAGE';
                    
                    return (
                      <Button
                        key={file.fileId || index}
                        variant="outlined"
                        size="small"
                        startIcon={isImage ? <ImageIcon /> : <FileDownloadIcon />}
                        onClick={() => window.open(file.url, '_blank')}
                        sx={{ 
                          borderColor: isImage ? 'primary.light' : 'primary.main',
                          color: isImage ? 'primary.light' : 'primary.main',
                          maxWidth: '100%',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {file.filename || `파일 ${index + 1}`}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
            
            {/* 관련 링크 섹션 (URL이 특별히 긴 경우를 위한 섹션) */}
            {notice.links && notice.links.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  관련 링크
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {notice.links.map((link, index) => (
                    <Box 
                      key={link.linkId || index}
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 2,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1
                      }}
                    >
                      <LinkIcon 
                        sx={{ 
                          color: 'primary.main',
                          mt: 0.5,
                          flexShrink: 0
                        }} 
                      />
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{ 
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {link.title || '링크'}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<FileDownloadIcon />}
                          sx={{ 
                            mt: 1,
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            textTransform: 'none'
                          }}
                        >
                          {link.url}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      ) : null}
    </Container>
  );
};

export default NoticeView;