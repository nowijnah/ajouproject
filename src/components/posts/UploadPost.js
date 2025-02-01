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
  Link as LinkIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ViewPost from '../portfolio/ViewPost.js';
import { Eye } from 'lucide-react';

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
    const [isPreview, setIsPreview] = useState(false);
    
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleLinkAdd = (e) => {
    e.preventDefault();
    if (newLink.trim()) {
      setLinks(prev => [...prev, newLink.trim()]);
      setNewLink('');
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

  if (isPreview) {
    return (
      <ViewPost
        title={title}
        subtitle={subtitle}
        content={markdownContent}
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

            {/* Links Section */}
            <Grid item xs={12}>
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    링크 첨부
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Enter URL"
                      variant="outlined"
                    />
                    <Button
                      variant="contained"
                      onClick={handleLinkAdd}
                      startIcon={<AddIcon />}
                      style={{ backgroundColor: '#0066CC' }}
                    >
                      add
                    </Button>
                  </Box>

                  {links.length > 0 && (
                    <List>
                      {links.map((link, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Link href={link} target="_blank" rel="noopener noreferrer">
                                {link}
                              </Link>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => removeLink(index)}>
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