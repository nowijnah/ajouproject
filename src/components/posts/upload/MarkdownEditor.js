import React, { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import ReactMarkdown from 'react-markdown';

/**
 * 마크다운 에디터 컴포넌트 - 에디터와 미리보기 기능 제공
 */
const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "마크다운으로 내용을 작성해주세요. 이미지나 PDF 파일을 드래그하여 추가할 수 있습니다.",
  required = true,
  onDrop
}) => {
  const textAreaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 & 드롭 핸들러
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
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (onDrop) onDrop(e, textAreaRef);
  };

  // 마크다운 구문 삽입
  const insertMarkdownSyntax = (syntax) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
  
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = value.substring(start, end);
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
      value.substring(0, start) +
      insertText +
      value.substring(end);
  
    // 변경 내용 부모 컴포넌트에 전달
    onChange(newContent);
  
    // 커서 위치 조정
    setTimeout(() => {
      textArea.focus();
      const newCursorPos = start + insertText.length;
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Grid container spacing={3}>
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            variant="outlined"
            required={required}
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
          <ReactMarkdown>{value}</ReactMarkdown>
        </Box>
      </Grid>
    </Grid>
  );
};

export default MarkdownEditor;