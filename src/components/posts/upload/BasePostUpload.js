import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../auth/AuthContext';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';

import UploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EyeIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';

import BasePostView from '../view/BasePostView';

function BasePostUpload({ collectionName }) {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const textAreaRef = useRef(null);

    // 기본 정보
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // 파일 관련
    const [thumbnail, setThumbnail] = useState(null);
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
  
    // 링크 관련
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState('');
    const [newLinkDescription, setNewLinkDescription] = useState('');
  
    // 키워드 관련
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
  
    useEffect(() => {
      const fetchPost = async () => {
        if (postId && postId !== 'preview-id') {  // 수정 모드일 때만
          try {
            const postDoc = await getDoc(doc(db, collectionName, postId));
            if (postDoc.exists()) {
              const data = postDoc.data();
              setTitle(data.title);
              setSubtitle(data.subtitle || '');
              setMarkdownContent(data.content);
              setThumbnail(data.thumbnail || null);
              setKeywords(data.keywords || []);
              
              // 기존 파일 데이터 설정
              if (data.files) {
                setFiles(data.files.map(file => ({
                  ...file,
                  fileId: file.fileId || `file-${Date.now()}-${Math.random()}`
                })));
              }
              
              // 기존 링크 데이터 설정
              if (data.links) {
                setLinks(data.links.map(link => ({
                  ...link,
                  linkId: link.linkId || `link-${Date.now()}-${Math.random()}`
                })));
              }
            }
          } catch (error) {
            console.error('Error loading post:', error);
          }
        }
      };
    
      fetchPost();
    }, [postId, collection]);

    // 썸네일
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
        setThumbnail(file);
        } else {
        // 에러 핸들링 추가하기
        alert('이미지 파일을 선택하세요.');
        }
    };

    const removeThumbnail = () => {
        setThumbnail(null);
    };

    // 파일
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        selectedFiles.forEach(file => {
        const fileType = file.type.startsWith('image/') ? 'IMAGE' 
                        : file.type === 'application/pdf' ? 'PDF' 
                        : 'DOC';
        setFiles(prev => [...prev, {
            fileId: `file-${Date.now()}-${Math.random()}`,
            file: file,
            type: fileType,
            description: ''
        }]);
        });
    };

    const updateFileDescription = (fileId, description) => {
        setFiles(prev => prev.map(file => 
        file.fileId === fileId ? { ...file, description } : file
        ));
    };

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(file => file.fileId !== fileId));
    };

    // 링크
    const handleLinkAdd = (e) => {
        e.preventDefault();
        if (newLink.trim()) {
        let formattedUrl = newLink.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = `https://${formattedUrl}`;
        } // https 추가

        const type = newLink.includes('github.com') ? 'GITHUB'
                    : newLink.includes('youtube.com') ? 'YOUTUBE'
                    : 'WEBSITE';
        
        setLinks(prev => [...prev, {
          linkId: `link-${Date.now()}-${Math.random()}`,
          url: formattedUrl,
          title: newLinkDescription.trim() || formattedUrl,
          type
        }]);
        setNewLink('');
        setNewLinkDescription('');
        }
    };

    const removeLink = (linkId) => {
        setLinks(prev => prev.filter(link => link.linkId !== linkId));
    };

    // 드래그 & 드롭
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        if (validFiles.length > 0) {
        const textArea = textAreaRef.current;
        const cursorPosition = textArea.selectionStart;
        
        for (const file of validFiles) {
            const markdown = file.type === 'application/pdf' 
            ? `[PDF: ${file.name}](${URL.createObjectURL(file)})\n`
            : `![${file.name}](${URL.createObjectURL(file)})\n`;
            
            const newContent = markdownContent.slice(0, cursorPosition) + 
                        markdown + 
                        markdownContent.slice(cursorPosition);
            
            setMarkdownContent(newContent);
            
            const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'PDF';
            setFiles(prev => [...prev, {
            fileId: `file-${Date.now()}-${Math.random()}`,
            file: file,
            type: fileType,
            description: ''
            }]);
        }
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // 키워드
    const handleKeywordAdd = (e) => {
      if (e.type === 'keydown' && e.nativeEvent.isComposing) {
        return;
      }
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
      if (newKeyword.trim()) {
        const trimmedKeyword = newKeyword.trim().toLowerCase();
        if (!keywords.includes(trimmedKeyword)) {
          setKeywords([...keywords, trimmedKeyword]);
          setNewKeyword('');
        }
      }
    }
    };

    const handleKeywordDelete = (keyword) => {
      setKeywords(keywords.filter(kw => kw !== keyword));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return; // 제출중일 때
        }
        
        try {
            setIsSubmitting(true);
            
            let thumbnailUrl = thumbnail;

            if (!thumbnail) {
              const imageFile = files.find(fileItem => fileItem.type === 'IMAGE' && fileItem.file);
              if (imageFile) {
                const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}-${imageFile.file.name}`);
                const thumbnailSnapshot = await uploadBytes(thumbnailRef, imageFile.file);
                thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
              }
            } 
            // 새로운 썸네일일 경우에만 업로드
            else if (thumbnail instanceof File) {
              const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}-${thumbnail.name}`);
              const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnail);
              thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
            }
            
            // 새로운 썸네일일 경우에만 업로드
            if (thumbnail instanceof File) {
            const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}-${thumbnail.name}`);
            const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnail);
            thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
            }

            // 새로운 파일들만 업로드
            const uploadedFiles = await Promise.all(
            files.map(async (fileItem) => {
                // 이미 업로드된 파일은 그대로 사용
                if (fileItem.url) {
                return fileItem;
                }
                // 새로운 파일 업로드
                const fileRef = ref(storage, `files/${currentUser.uid}/${Date.now()}-${fileItem.file.name}`);
                const fileSnapshot = await uploadBytes(fileRef, fileItem.file);
                const url = await getDownloadURL(fileSnapshot.ref);
                
                return {
                fileId: fileItem.fileId,
                url: url,
                filename: fileItem.file.name,
                type: fileItem.type,
                description: fileItem.description
                };
            })
        );

        const updatedData = {
            title,
            subtitle,
            content: markdownContent,
            files: uploadedFiles,
            links,
            thumbnail: thumbnailUrl,
            keywords,
            updatedAt: serverTimestamp()
        };

        if (postId) {
          await updateDoc(doc(db, collectionName, postId), updatedData);
          alert('게시글이 수정되었습니다.');
          navigate(`/${collectionName}/${postId}`);
        } else {
            updatedData.authorId = currentUser.uid;
            updatedData.likeCount = 0;
            updatedData.commentCount = 0;
            updatedData.createdAt = serverTimestamp();
            
            const docRef = await addDoc(collection(db, collectionName), updatedData);
            alert('게시글이 작성되었습니다.');
            navigate(`/${collectionName}/${docRef.id}`);
        }

      } catch (error) {
          console.error('Error:', error);
          alert(`업로드 중 오류 발생: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    const insertMarkdownSyntax = (syntax, placeholder = '') => {
      const textArea = document.querySelector('textarea');
      if (!textArea) return;
    
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const selectedText = markdownContent.substring(start, end);
      let insertText = '';
    
      switch(syntax) {
        case 'bold':
          insertText = `**${selectedText || '굵은 텍스트'}**`;
          break;
        case 'italic':
          insertText = `*${selectedText || '기울임 텍스트'}*`;
          break;
        case 'strikethrough':
          insertText = `~~${selectedText || '취소선 텍스트'}~~`;
          break;
        case 'code':
          insertText = selectedText.includes('\n') 
            ? `\`\`\`\n${selectedText || '코드 블록'}\n\`\`\``
            : `\`${selectedText || '인라인 코드'}\``;
          break;
        case 'link':
          insertText = `[${selectedText || '링크 텍스트'}](url)`;
          break;
        case 'image':
          insertText = `![${selectedText || '이미지 설명'}](이미지 URL)`;
          break;
        case 'heading':
          insertText = `# ${selectedText || '제목'}`;
          break;
        case 'quote':
          insertText = `> ${selectedText || '인용문'}`;
          break;
        case 'bullet':
          insertText = selectedText
            ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
            : '- 목록 항목';
          break;
        case 'number':
          insertText = selectedText
            ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
            : '1. 목록 항목';
          break;
        default:
          insertText = selectedText;
      }
    
      const newContent = 
        markdownContent.substring(0, start) +
        insertText +
        markdownContent.substring(end);
    
      setMarkdownContent(newContent);
    
      // 커서 위치 조정
      setTimeout(() => {
        textArea.focus();
        const newCursorPos = start + insertText.length;
        textArea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    };

    if (isPreview) {
      return (
        <>
          <Button
            variant="contained"
            onClick={() => setIsPreview(false)}
            sx={{ 
              position: 'fixed',
              top: 80,
              right: 20,
              zIndex: 9999
            }}
          >
            수정 페이지로 돌아가기
          </Button>
          
          <BasePostView
            collectionName={collectionName}
            previewData={{
              postId: postId || 'preview-id',
              authorId: currentUser.uid,
              type: 'PORTFOLIO',
              title,
              subtitle,
              content: markdownContent,
              files,
              links,
              likeCount: 0,
              commentCount: 0,
              thumbnail,
              createdAt: new Date(),
              updatedAt: new Date(),
              keywords
            }}
            previewAuthor={{
              userId: currentUser.uid,
              displayName: currentUser.displayName,
              profileImage: currentUser.photoURL,
              role: currentUser.role || 'STUDENT'
            }}
          />
        </>
      );
    }
      
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            {/* 헤더 */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4 
            }}>
              <Typography variant="h4" component="h1">
                {postId ? '포트폴리오 수정' : '포트폴리오 작성'}
              </Typography>
              {(title || markdownContent) && (
                <Button
                  startIcon={<EyeIcon />}
                  onClick={() => setIsPreview(true)}
                  sx={{ color: '#0066CC' }}
                >
                  미리보기
                </Button>
              )}
            </Box>
      
            <form onSubmit={handleSubmit}>
    
              {/* 제목&부제목 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="부제목"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
      
              {/* 섬네일 */}
              <Grid item xs={12} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  대표 이미지
                </Typography>
                <Box sx={{ 
                  border: '2px dashed',
                  borderColor: thumbnail ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  p: 2,
                  position: 'relative',
                }}>
                  {thumbnail ? (
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={thumbnail instanceof File ? URL.createObjectURL(thumbnail) : thumbnail}
                        alt="Thumbnail preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                      <IconButton
                        onClick={removeThumbnail}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'grey.100' },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      component="label"
                      sx={{
                        width: '100%',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                      <ImageIcon sx={{ fontSize: 40 }} />
                      <Typography>대표 이미지 추가</Typography>
                    </Button>
                  )}
                </Box>
              </Grid>
      
              {/* Markdown Editor and Preview */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    내용 작성
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      '& .MuiTextField-root': {
                        backgroundColor: isDragging ? 'rgba(0, 102, 204, 0.05)' : 'transparent',
                      },
                    }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Box sx={{ 
                    mb: 2,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('bold')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      <strong>B</strong>
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('italic')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      <em>I</em>
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('strikethrough')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      <span style={{ textDecoration: 'line-through' }}>S</span>
                    </Button>
                    <Divider orientation="vertical" flexItem />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('heading')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      H
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('quote')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      "
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('code')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      {'</>'}
                    </Button>
                    <Divider orientation="vertical" flexItem />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('bullet')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      •
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('number')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      1.
                    </Button>
                    <Divider orientation="vertical" flexItem />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('link')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      🔗
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => insertMarkdownSyntax('image')}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      🖼
                    </Button>
                  </Box>
                    {isDragging && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 102, 204, 0.1)',
                          border: '2px dashed #0066CC',
                          borderRadius: 1,
                          zIndex: 1,
                        }}
                      >
                        <Typography variant="body1" color="primary">
                          파일을 여기에 놓아주세요
                        </Typography>
                      </Box>
                    )}
                    <TextField
                      inputRef={textAreaRef}
                      fullWidth
                      multiline
                      rows={15}
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      placeholder="마크다운으로 내용을 작성해주세요. 이미지나 PDF 파일을 드래그하여 추가할 수 있습니다."
                      variant="outlined"
                      required
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    미리보기
                  </Typography>
                  <Box sx={{
                    height: '400px',
                    overflow: 'auto',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }}>
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </Box>
                </Grid>
              </Grid>
      
              {/* 파일 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  파일 첨부
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 2 }}
                >
                  파일 선택
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
      
                {files.length > 0 && (
                  <List>
                    {files.map((file) => (
                      <ListItem 
                        key={file.fileId}
                        sx={{ 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch'
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          <Typography>
                            {file.filename || file.file.name}
                          </Typography>
                          <IconButton 
                            onClick={() => removeFile(file.fileId)}
                            sx={{ color: 'error.main' }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="파일 설명 입력"
                          value={file.description}
                          onChange={(e) => updateFileDescription(file.fileId, e.target.value)}
                          sx={{ mt: 1 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
      
              {/* 링크 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  링크 추가
    
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="URL을 입력하세요"
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    value={newLinkDescription}
                    onChange={(e) => setNewLinkDescription(e.target.value)}
                    placeholder="링크 설명을 입력하세요"
                    variant="outlined"
                  />
                  <Button
                    onClick={handleLinkAdd}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    링크 추가
                  </Button>
                </Box>
      
                {links.length > 0 && (
                  <List sx={{ mt: 2 }}>
                    {links.map((link) => (
                      <ListItem 
                        key={link.linkId}
                        sx={{ 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          flex: 1
                        }}>
                          <Typography>{link.url}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {link.title}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => removeLink(link.linkId)}
                          sx={{ color: 'error.main' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
    
              {/* 키워드 */}
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
                          onDelete={() => handleKeywordDelete(keyword)}
                          color="primary"
                        variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              
              {/* 등록 */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  mt: 4,
                  bgcolor: '#0066CC',
                  '&:hover': {
                    bgcolor: '#0055AA',
                  },
                }}
              >
                {isSubmitting ? '처리중...' : (postId ? '수정 완료' : '작성 완료')}
              </Button>
            </form>
          </Paper>
        </Container>
    );
}

export default BasePostUpload;