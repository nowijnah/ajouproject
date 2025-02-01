import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Container, Paper, Typography, Box, Button, 
  Grid, Dialog, DialogContent, DialogTitle, 
  DialogActions, IconButton, useTheme
} from '@mui/material';
import {
  Edit,
  FileText,
  Download as DownloadIcon,
  X as CloseIcon,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';

function ViewPost({ title, subtitle, content, files, links, onEdit }) {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleClosePreview = () => {
    setSelectedFile(null);
  };

  const handleDownload = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: theme.spacing(6, 2),
          marginBottom: theme.spacing(4),
          borderBottom: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Title */}
          <Typography 
            variant="h1" 
            sx={{
              color: '#0066CC',
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: theme.spacing(1),
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {title}
          </Typography>

          {/* Subtitle */}
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
            {subtitle}
          </Typography>

          {/* Edit Button */}
          {onEdit && (
            <Button
              startIcon={<Edit size={20} />}
              onClick={onEdit}
              sx={{ 
                position: 'absolute',
                right: 24,
                top: 24,
                color: '#0066CC',
              }}
            >
              Edit
            </Button>
          )}
        </Box>

        {/* Content Section */}
        <Box sx={{ padding: theme.spacing(4) }}>
          <Box sx={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: theme.palette.text.primary,
              marginTop: theme.spacing(3),
              marginBottom: theme.spacing(2),
            },
            '& p': {
              marginBottom: theme.spacing(2),
              lineHeight: 1.7,
            },
          }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </Box>
        </Box>

        {/* Files Section */}
        {files && files.length > 0 && (
          <Box sx={{ 
            padding: theme.spacing(4),
            backgroundColor: theme.palette.grey[50],
            borderTop: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              첨부 자료
            </Typography>
            <Grid container spacing={3}>
              {files.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                const isPdf = file.type === 'application/pdf';
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      onClick={() => handleFileClick(file)}
                      sx={{
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                    >
                      <Box sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.palette.grey[100],
                      }}>
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : isPdf ? (
                          <FileText size={48} color="#0066CC" />
                        ) : (
                          <FileText size={48} color={theme.palette.grey[500]} />
                        )}
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Links Section */}
        {links && links.length > 0 && (
          <Box sx={{ 
            padding: theme.spacing(4),
            borderTop: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              첨부 링크
            </Typography>
            <Grid container spacing={2}>
              {links.map((link, index) => (
                <Grid item xs={12} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:hover': {
                        backgroundColor: theme.palette.grey[50],
                      },
                    }}
                  >
                    <LinkIcon size={20} color="#0066CC" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0066CC',
                        textDecoration: 'none',
                        flex: 1,
                      }}
                    >
                      {link}
                    </a>
                    <ExternalLinkIcon size={16} color="#0066CC" />
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
              {selectedFile?.name}
            </Typography>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon size={20} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedFile?.type.startsWith('image/') ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: 400,
              }}>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt={selectedFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                py: 4,
              }}>
                <FileText size={100} color="#0066CC" />
                <Typography>
                  This file type cannot be previewed
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePreview}>Close</Button>
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              onClick={() => handleDownload(selectedFile)}
              sx={{
                bgcolor: '#0066CC',
                '&:hover': {
                  bgcolor: '#0055AA',
                },
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default ViewPost;