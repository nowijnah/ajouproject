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

function ViewPost({ title, subtitle, content, thumbnail, files, links, onEdit }) {
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

        {thumbnail && (
        <Box sx={{ 
          width: '100%', 
          height: '300px', 
          position: 'relative',
          mb: 4,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <img
            src={URL.createObjectURL(thumbnail)}
            alt="Post thumbnail"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      )}

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

        {(files.length > 0 || links.length > 0) && (
          <Box sx={{ 
            padding: theme.spacing(4),
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {files.map((fileItem, index) => (
              <Box
                key={`file-${index}`}
                sx={{
                  border: '1px dashed #6366F1',
                  borderRadius: '8px',
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  },
                }}
                onClick={() => handleFileClick(fileItem.file)}
              >
                <Typography sx={{ 
                  color: '#6366F1',
                  fontSize: '1rem',
                  fontWeight: 500,
                  mb: 0.5
                }}>
                  {fileItem.file.name}
                </Typography>
                {fileItem.description && (
                  <Typography sx={{ 
                    color: '#6B7280',
                    fontSize: '0.875rem'
                  }}>
                    {fileItem.description}
                  </Typography>
                )}
              </Box>
            ))}

            {links.map((linkItem, index) => (
              <Box
                key={`link-${index}`}
                component="a"
                href={linkItem.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  border: '1px dashed #6366F1',
                  borderRadius: '8px',
                  p: 2,
                  textDecoration: 'none',
                  display: 'block',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  },
                }}
              >
                <Typography sx={{ 
                  color: '#6366F1',
                  fontSize: '1rem',
                  fontWeight: 500,
                  mb: 0.5
                }}>
                  {linkItem.url.split('/').pop() || linkItem.url}
                </Typography>
                {linkItem.description && (
                  <Typography sx={{ 
                    color: '#6B7280',
                    fontSize: '0.875rem'
                  }}>
                    {linkItem.description}
                  </Typography>
                )}
              </Box>
            ))}
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