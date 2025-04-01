// src/pages/admin/AdminNotices.js
import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '../../components/common/LoadingSpinner';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
import { db } from '../../firebase';
import MarkdownEditor from '../../components/posts/upload/MarkdownEditor';

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
    } else {
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
      setIsMainPageNotice(false);
    }
    setDialogOpen(true);
  };

  // 공지사항 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = (notice) => {
    setNoticeToDelete(notice);
    setDeleteDialogOpen(true);
  };

  // 공지사항 저장
  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      const noticeData = {
        title: noticeTitle,
        content: noticeContent,
        isMainPageNotice,
        authorId: currentUser.uid,
        updatedAt: serverTimestamp()
      };
      
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
        
        // 메인 페이지 공지로 설정된 경우 기존 메인 페이지 공지를 해제
        if (isMainPageNotice) {
          const mainNotices = notices.filter(n => n.isMainPageNotice);
          for (const notice of mainNotices) {
            await updateDoc(doc(db, 'notices', notice.id), {
              isMainPageNotice: false,
              updatedAt: serverTimestamp()
            });
          }
          
          // 상태 업데이트
          setNotices(prev => prev.map(notice => 
            notice.isMainPageNotice 
              ? { ...notice, isMainPageNotice: false, updatedAt: new Date() } 
              : notice
          ));
        }
        
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

  // 드래그 앤 드롭 이미지 처리
  const handleDrop = (e, textAreaRef) => {
    // 구현은 생략 (MarkdownEditor 컴포넌트에서 처리)
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
          
          <Box sx={{ mt: 2 }}>
            <MarkdownEditor
              value={noticeContent}
              onChange={setNoticeContent}
              onDrop={handleDrop}
              placeholder="공지사항 내용을 입력해주세요."
            />
          </Box>
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