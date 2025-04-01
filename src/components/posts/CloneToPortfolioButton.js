import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import CloneIcon from '@mui/icons-material/ContentCopy';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';

/**
 * 소프트콘 프로젝트를 사용자의 포트폴리오로 복제하는 버튼 컴포넌트
 * 
 * @param {Object} props
 * @param {Object} props.postData 
 * @param {string} props.postId 
 */
function CloneToPortfolioButton({ postData, postId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cloning, setCloning] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!cloning) {
      setDialogOpen(false);
    }
  };

  // 복제 처리
  const handleClone = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setCloning(true);

      const sourceDocRef = doc(db, 'softcon_projects', postId);
      const sourceDocSnap = await getDoc(sourceDocRef);
      
      if (!sourceDocSnap.exists()) {
        throw new Error('소프트콘 프로젝트를 찾을 수 없습니다.');
      }
      
      const sourceData = sourceDocSnap.data();

      const portfolioData = {
        title: `[복제] ${sourceData.title || '소프트콘 프로젝트'}`,
        subtitle: sourceData.subtitle || '소프트콘 프로젝트 복제본',
        content: sourceData.content || '',
        
        files: sourceData.files || [],
        links: sourceData.links || [],
        thumbnail: sourceData.thumbnail || null,
        
        keywords: [...(sourceData.keywords || []), '소프트콘프로젝트'],
        
        authorId: currentUser.uid,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        clonedFrom: {
          id: postId,
          type: 'softcon_projects',
          originalAuthor: sourceData.authorId,
          clonedAt: serverTimestamp()
        }
      };

      const newDocRef = await addDoc(collection(db, 'portfolios'), portfolioData);
      
      setCloning(false);
      setDialogOpen(false);
      
      alert('소프트콘 프로젝트가 내 포트폴리오로 복제되었습니다.');
      navigate(`/portfolios/${newDocRef.id}`);
      
    } catch (error) {
      console.error('프로젝트 복제 중 오류 발생:', error);
      alert(`복제 중 오류가 발생했습니다: ${error.message}`);
      setCloning(false);
    }
  };

  return (
    <>
      <Tooltip title="내 포트폴리오로 복제하기">
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloneIcon />}
          onClick={handleOpenDialog}
          sx={{ 
            borderColor: 'rgb(0, 51, 161)',
            color: 'rgb(0, 51, 161)',
            '&:hover': {
              backgroundColor: 'rgba(0, 51, 161, 0.04)',
              borderColor: 'rgb(0, 51, 161)',
            }
          }}
        >
          복제하기
        </Button>
      </Tooltip>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          소프트콘 프로젝트 복제
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            이 소프트콘 프로젝트를 내 포트폴리오로 복제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            복제하면 프로젝트의 모든 내용(텍스트, 이미지, 링크 등)이 내 포트폴리오로 복사됩니다.
            복제 후에는 자유롭게 수정할 수 있습니다.
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            disabled={cloning}
          >
            취소
          </Button>
          <Button 
            onClick={handleClone}
            variant="contained"
            disabled={cloning}
            color="primary"
            startIcon={cloning ? <CircularProgress size={20} color="inherit" /> : <CloneIcon />}
          >
            {cloning ? '복제 중...' : '복제하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CloneToPortfolioButton;