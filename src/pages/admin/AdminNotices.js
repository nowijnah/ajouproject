// src/pages/admin/AdminNotices.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';

// 재사용 가능한 기존 컴포넌트 import
import MarkdownEditor from '../../components/posts/upload/MarkdownEditor';
import FileUploader from '../../components/posts/upload/FileUploader';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// 아이콘
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EyeIcon from '@mui/icons-material/Visibility';

// Firebase
import { useAuth } from '../../components/auth/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import ReactMarkdown from 'react-markdown';

const AdminNotices = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [isMainPageNotice, setIsMainPageNotice] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const textAreaRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(false);

  // 관리자 권한 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 공지사항 목록 불러오기
  useEffect(() => {
    const fetchNotices = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const noticesRef = collection(db, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const noticesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
        setNotices(noticesList);
      } catch (error) {
        console.error('공지사항 로드 중 오류:', error);
        alert('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotices();
  }, [currentUser]);

  // 공지사항 추가/수정 다이얼로그 열기
  const handleOpenDialog = (notice = null) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeTitle(notice.title);
      setNoticeContent(notice.content);
      setIsMainPageNotice(notice.isMainPageNotice || false);
      // 기존 파일 정보 설정
      setFiles(notice.files || []);
    } else {
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
      setIsMainPageNotice(false);
      setFiles([]);
    }
    setDialogOpen(true);
    setPreviewMode(false);
  };

  // 공지사항 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = (notice) => {
    setNoticeToDelete(notice);
    setDeleteDialogOpen(true);
  };

  // 드래그 앤 드롭으로 받은 파일 처리 (MarkdownEditor에서 호출)
  const handleDrop = (e, textAreaRef) => {
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.type.includes('document')
    );

    if (validFiles.length > 0 && textAreaRef.current) {
      const cursorPosition = textAreaRef.current.selectionStart;
      
      for (const file of validFiles) {
        let markdown = '';
        let fileType = '';
        
        if (file.type.startsWith('image/')) {
          const tempUrl = URL.createObjectURL(file);
          markdown = `![${file.name}](${tempUrl})\n`;
          fileType = 'IMAGE';
        } else {
          const tempUrl = URL.createObjectURL(file);
          markdown = `[${file.type === 'application/pdf' ? 'PDF: ' : '문서: '}${file.name}](${tempUrl})\n`;
          fileType = file.type === 'application/pdf' ? 'PDF' : 'DOC';
        }
        
        const newContent = noticeContent.slice(0, cursorPosition) + 
                    markdown + 
                    noticeContent.slice(cursorPosition);
        
        setNoticeContent(newContent);
        
        // 파일 목록에 추가
        handleAddFile({
          fileId: `file-${Date.now()}-${Math.random()}`,
          file: file,
          type: fileType,
          description: file.name,
          tempUrl
        });
      }
    }
  };

  // 파일 추가 (FileUploader에서 호출)
  const handleAddFile = (fileData) => {
    setFiles(prev => [...prev, fileData]);
  };

  // 파일 설명 업데이트 (FileUploader에서 호출)
  const handleUpdateFileDescription = (fileId, description) => {
    setFiles(prev => prev.map(file => 
      file.fileId === fileId ? { ...file, description } : file
    ));
  };

  // 파일 삭제 (FileUploader에서 호출)
  const handleRemoveFile = (fileId) => {
    // 파일 목록에서 삭제할 파일 정보 찾기
    const fileToRemove = files.find(file => file.fileId === fileId);
    
    if (fileToRemove) {
      // 해당 파일의 마크다운 패턴을 찾아 삭제
      let updatedContent = noticeContent;
      
      if (fileToRemove.type === 'IMAGE') {
        // 이미지 마크다운 패턴: ![파일이름](URL)
        const imgPattern = new RegExp(`!\\[.*?\\]\\(${fileToRemove.tempUrl || fileToRemove.url}\\)`, 'g');
        updatedContent = updatedContent.replace(imgPattern, '');
      } else {
        // 파일 링크 마크다운 패턴: [파일이름](URL)
        const linkPattern = new RegExp(`\\[.*?\\]\\(${fileToRemove.tempUrl || fileToRemove.url}\\)`, 'g');
        updatedContent = updatedContent.replace(linkPattern, '');
      }
      
      setNoticeContent(updatedContent);
      setFiles(prev => prev.filter(file => file.fileId !== fileId));
    }
  };

  // 공지사항 저장
  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      // 1. 파일 업로드
      const uploadedFiles = await Promise.all(
        files.map(async (fileItem) => {
          // 이미 업로드된 파일은 그대로 사용
          if (fileItem.url && !fileItem.file) {
            return fileItem;
          }
          
          // 새로운 파일 업로드
          const fileRef = ref(storage, `notices/${currentUser.uid}/${Date.now()}-${fileItem.file.name}`);
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
      
      // 2. 임시 URL을 실제 URL로 변경
      let updatedContent = noticeContent;
      
      files.forEach((fileItem) => {
        if (fileItem.tempUrl) {
          const uploadedFile = uploadedFiles.find(f => f.fileId === fileItem.fileId);
          
          if (uploadedFile) {
            // 임시 URL을 실제 업로드된 URL로 교체
            if (fileItem.type === 'IMAGE') {
              // 이미지 마크다운 패턴: ![파일이름](tempUrl)
              const imgPattern = new RegExp(`!\\[.*?\\]\\(${fileItem.tempUrl}\\)`, 'g');
              updatedContent = updatedContent.replace(imgPattern, `![${uploadedFile.filename}](${uploadedFile.url})`);
            } else {
              // 파일 링크 마크다운 패턴: [파일이름](tempUrl)
              // 다운로드를 위해 특별한 형식으로 표시
              const linkPattern = new RegExp(`\\[.*?\\]\\(${fileItem.tempUrl}\\)`, 'g');
              updatedContent = updatedContent.replace(linkPattern, `[${uploadedFile.filename}](${uploadedFile.url} "download")`);
            }
          }
        }
      });
      
      // 3. 공지사항 데이터 준비
      const noticeData = {
        title: noticeTitle,
        content: updatedContent,
        isMainPageNotice,
        authorId: currentUser.uid,
        files: uploadedFiles,
        updatedAt: serverTimestamp()
      };
      
      // 4. 공지사항 저장 또는 수정
      if (editingNotice) {
        // 수정
        await updateDoc(doc(db, 'notices', editingNotice.id), noticeData);
        
        // 상태 업데이트
        setNotices(prev => prev.map(notice => 
          notice.id === editingNotice.id 
            ? { ...notice, ...noticeData, updatedAt: new Date() } 
            : notice
        ));
      } else {
        // 새 공지사항
        noticeData.createdAt = serverTimestamp();
        
        // 새 공지사항 추가
        const newNoticeRef = doc(collection(db, 'notices'));
        await setDoc(newNoticeRef, noticeData);
        
        // 상태 업데이트
        setNotices(prev => [
          {
            id: newNoticeRef.id,
            ...noticeData,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          ...prev
        ]);
      }
      
      setDialogOpen(false);
      setSaving(false);
    } catch (error) {
      console.error('공지사항 저장 중 오류:', error);
      alert('공지사항을 저장하는 중 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'notices', noticeToDelete.id));
      
      // 상태 업데이트
      setNotices(prev => prev.filter(notice => notice.id !== noticeToDelete.id));
      
      setDeleteDialogOpen(false);
      setNoticeToDelete(null);
    } catch (error) {
      console.error('공지사항 삭제 중 오류:', error);
      alert('공지사항을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 미리보기 모드 토글
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  if (!currentUser) {
    return <LoadingSpinner message="로그인 상태를 확인하는 중..." />;
  }

  if (currentUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/admin')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          공지사항 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            bgcolor: '#0066CC',
            '&:hover': {
              bgcolor: '#004C99'
            }
          }}
        >
          공지사항 작성
        </Button>
      </Box>

      {loading ? (
        <LoadingSpinner message="공지사항을 불러오는 중..." />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width="50%">제목</TableCell>
                <TableCell>작성일</TableCell>
                <TableCell>메인표시</TableCell>
                <TableCell align="right">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    등록된 공지사항이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => (
                  <TableRow key={notice.id} hover>
                    <TableCell>{notice.title}</TableCell>
                    <TableCell>
                      {notice.createdAt.toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      {notice.isMainPageNotice ? '✓' : ''}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => handleOpenDialog(notice)}
                        size="small"
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleOpenDeleteDialog(notice)}
                        size="small"
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* 공지사항 추가/수정 다이얼로그 */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="제목"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              required
            />
          </Box>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={isMainPageNotice}
                onChange={(e) => setIsMainPageNotice(e.target.checked)}
              />
            }
            label="메인 페이지에 표시"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EyeIcon />}
              onClick={togglePreviewMode}
            >
              {previewMode ? "에디터로 돌아가기" : "미리보기"}
            </Button>
          </Box>

          {!previewMode ? (
            // 마크다운 에디터 컴포넌트 사용
            <MarkdownEditor
              value={noticeContent}
              onChange={setNoticeContent}
              onDrop={handleDrop}
              placeholder="공지사항 내용을 입력해주세요. 이미지나 파일을 드래그하여 추가할 수 있습니다."
            />
          ) : (
            <Box sx={{
              height: '400px',
              overflow: 'auto',
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'grey.50'
            }}>
              <ReactMarkdown>{noticeContent}</ReactMarkdown>
            </Box>
          )}

          {/* 파일 업로더 컴포넌트 사용 */}
          <FileUploader
            files={files}
            onAddFiles={handleAddFile}
            onUpdateDescription={handleUpdateFileDescription}
            onRemoveFile={handleRemoveFile}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button 
            onClick={handleSaveNotice}
            variant="contained"
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>공지사항 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            공지사항 "{noticeToDelete?.title}"을(를) 삭제하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleDeleteNotice} 
            color="error"
            autoFocus
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminNotices;