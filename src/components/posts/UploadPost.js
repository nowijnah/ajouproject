import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Grid,
  Link,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  // Link as LinkIcon,
  Add as AddIcon,
  Visibility as Eye,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Add as PlusIcon,
  ImageOutlined as ImageIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ViewPost from '../posts/ViewPost.js';
// import { Eye } from 'lucide-react';

const StyledInput = styled('input')({
  display: 'none',
});

const MarkdownPreview = styled(Box)(({ theme }) => ({
  height: '400px',
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '& img': {
    maxWidth: '100%',
  },
}));

const MarkdownEditor = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    height: '400px',
    '& textarea': {
      height: '100% !important',
    },
  },
}));

function UploadPost({ savedContent, onSave }) {
    const theme = useTheme();
    const [title, setTitle] = useState(savedContent?.title || '');
    const [subtitle, setSubtitle] = useState(savedContent?.subtitle || '');
    const [markdownContent, setMarkdownContent] = useState(savedContent?.content || '');
    const [files, setFiles] = useState(savedContent?.files || []);
    const [links, setLinks] = useState(savedContent?.links || []);
    const [newLink, setNewLink] = useState('');
    const [newLinkDescription, setNewLinkDescription] = useState('');
    const [selectedFileDescription, setSelectedFileDescription] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [thumbnail, setThumbnail] = useState(savedContent?.thumbnail || null);
  
    const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files);
      // 파일 선택시 설명 입력 다이얼로그 표시 또는 바로 입력 필드 표시
      selectedFiles.forEach(file => {
        setFiles(prev => [...prev, {
          file: file,
          description: ''  // 사용자가 입력할 설명
        }]);
      });
    };
    
    const updateFileDescription = (index, description) => {
      setFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, description } : item
      ));
    };
    
    const handleLinkAdd = (e) => {
      e.preventDefault();
      if (newLink.trim()) {
        setLinks(prev => [...prev, {
          url: newLink.trim(),
          description: newLinkDescription.trim()
        }]);
        setNewLink('');
        setNewLinkDescription('');
      }
    };    

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeLink = (index) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = {
      title,
      subtitle,
      thumbnail,
      content: markdownContent,
      files,
      links,
      timestamp: new Date().toISOString(),
    };
    if (onSave) {
      onSave(content);
    }
    setIsPreview(true);
  };

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

  if (isPreview) {
    return (
      <ViewPost
        title={title}
        subtitle={subtitle}
        content={markdownContent}
        thumbnail={thumbnail}
        files={files}
        links={links}
        onEdit={() => setIsPreview(false)}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">글 작성하기</Typography>
          {(title || markdownContent) && (
            <Button
              startIcon={<Eye size={20} />}
              onClick={() => setIsPreview(true)}
              sx={{ color: '#0066CC' }}
            >
              Preview
            </Button>
          )}
        </Box>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title and Subtitle Fields */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0066CC',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0066CC',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0066CC',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="부제목"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0066CC',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0066CC',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0066CC',
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* 섬네일 추가 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              대표 이미지
            </Typography>
            <Box sx={{ 
              border: '2px dashed',
              borderColor: thumbnail ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              p: 2,
              position: 'relative',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}>
              {thumbnail ? (
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={URL.createObjectURL(thumbnail)}
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
                    <CloseIcon size={20} />
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
                  <ImageIcon size={40} />
                  <Typography>대표 이미지 추가</Typography>
                </Button>
              )}
            </Box>
          </Grid>

          {/* Markdown Editor */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              내용 (Markdown)
            </Typography>
            <MarkdownEditor
              fullWidth
              multiline
              variant="outlined"
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder="Write your content in Markdown..."
            />
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              미리보기
            </Typography>
            <MarkdownPreview>
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </MarkdownPreview>
          </Grid>

          {/* File Upload */}
          <Grid item xs={12}>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  파일 첨부
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <label htmlFor="file-upload">
                    <StyledInput
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Button variant="contained" component="span"
                    style={{ backgroundColor: '#0066CC' }}>
                      Choose Files
                    </Button>
                  </label>
                </Box>

                {files.length > 0 && (
                  <List>
                    {files.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={file.name} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeFile(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
{/* File List */}
{files.length > 0 && (
            <List sx={{ mt: 2 }}>
              {files.map((fileItem, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography>{fileItem.file.name}</Typography>
                    <IconButton 
                      onClick={() => removeFile(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="파일 설명 입력"
                    value={fileItem.description}
                    onChange={(e) => updateFileDescription(index, e.target.value)}
                    sx={{ mt: 1 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          {/* Links Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Add Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Enter URL"
                variant="outlined"
              />
              <TextField
                fullWidth
                value={newLinkDescription}
                onChange={(e) => setNewLinkDescription(e.target.value)}
                placeholder="링크 설명 입력"
                variant="outlined"
              />
              <Button
                onClick={handleLinkAdd}
                variant="outlined"
                startIcon={<PlusIcon />}
                sx={{ alignSelf: 'flex-end' }}
              >
                Add Link
              </Button>
            </Box>

            {/* Added Links List */}
            {links.length > 0 && (
              <List sx={{ mt: 2 }}>
                {links.map((linkItem, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography 
                        sx={{ 
                          color: '#0066CC',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {linkItem.url}
                      </Typography>
                      <IconButton 
                        onClick={() => removeLink(index)}
                        sx={{ color: 'error.main' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="링크 설명 입력"
                      value={linkItem.description}
                      onChange={(e) => {
                        const newLinks = [...links];
                        newLinks[index] = { ...linkItem, description: e.target.value };
                        setLinks(newLinks);
                      }}
                      sx={{ mt: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

            <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 4,
              bgcolor: '#0066CC',
              '&:hover': {
                bgcolor: '#0055AA',
              },
            }}
          >
            Submit
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
export default UploadPost;