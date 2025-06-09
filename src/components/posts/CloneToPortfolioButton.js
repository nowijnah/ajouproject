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
import Alert from '@mui/material/Alert';

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
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleOpenDialog = () => {
    // 팀원인지 확인
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const isTeamMember = checkIfTeamMember(currentUser.email);
    setIsTeamMember(isTeamMember);
    
    if (!isTeamMember) {
      setErrorMessage('이 프로젝트의 팀원만 가져갈 수 있습니다.');
    } else {
      setErrorMessage('');
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!cloning) {
      setDialogOpen(false);
      setErrorMessage('');
    }
  };

  /**
   * 사용자 이메일로 팀원인지 확인하는 함수
   * 이메일 마지막 두 자리가 마스킹 처리('**')되어 있는 점 고려
   * 
   * @param {string} userEmail
   * @return {boolean}
   */
  const checkIfTeamMember = (userEmail) => {
    if (!userEmail || !postData || !postData.team || !Array.isArray(postData.team)) {
      return false;
    }

    const userEmailPrefix = userEmail.split('@')[0];
    
    // 팀 멤버 확인
    return postData.team.some(member => {
      // 이메일이 없으면 이름으로 확인 (이메일이 없는 경우 대비)
      if (!member.email && member.name) {
        return currentUser.displayName === member.name;
      }
      
      if (!member.email) return false;
      
      const teamEmailParts = member.email.split('@');
      if (teamEmailParts.length !== 2) return false;
      
      const teamEmailPrefix = teamEmailParts[0]; 
      
      const unmaskedPart = teamEmailPrefix.replace(/\*+$/, '');
      
      return userEmailPrefix.startsWith(unmaskedPart);
    });
  };

  // 복제 처리
  const handleClone = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isTeamMember) {
      setErrorMessage('이 프로젝트의 팀원만 가져갈 수 있습니다.');
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
        title: `[softcon] ${sourceData.title || '소프트콘 프로젝트'}`,
        subtitle: sourceData.subtitle || '소프트콘 프로젝트입니다.',
        content: sourceData.content || '',
        
        files: sourceData.files || [],
        links: sourceData.links || [],
        thumbnail: sourceData.thumbnail || null,
        
        keywords: [...(sourceData.keywords || []), '소프트콘프로젝트'],
        
        team: sourceData.team || [],
        
        authorId: currentUser.uid,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: true,
        
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
      
      alert('소프트콘 프로젝트를 성공적으로 가져왔습니다.');
      navigate(`/portfolios/${newDocRef.id}`);
      
    } catch (error) {
      console.error('프로젝트 가져오는 중 오류 발생:', error);
      setErrorMessage(`프로젝트를 가져오는 중 오류가 발생했습니다: ${error.message}`);
      setCloning(false);
    }
  };

  return (
    <>
      <Tooltip title="내 포트폴리오로 가져오기">
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloneIcon />}
          onClick={handleOpenDialog}
          sx={{ 
            borderColor: '#003876', // Ajou Blue 색상
            color: '#003876',
            '&:hover': {
              backgroundColor: 'rgba(0, 56, 118, 0.04)',
              borderColor: '#003876',
            }
          }}
        >
          가져오기
        </Button>
      </Tooltip>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          소프트콘 프로젝트 가져오기
        </DialogTitle>
        
        <DialogContent>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          
          {isTeamMember ? (
            <>
              <Typography variant="body1" gutterBottom>
                이 소프트콘 프로젝트를 내 포트폴리오로 가져오시겠습니까?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                가져오면 프로젝트의 모든 내용(텍스트, 이미지, 링크 등)이 내 포트폴리오로 복사됩니다.
                가져온 후에는 자유롭게 수정할 수 있습니다.
              </Typography>
            </>
          ) : (
            <Typography variant="body1">
              이 프로젝트는 팀원만 가져올 수 있습니다. 프로젝트 팀원으로 등록되어 있지 않은 것 같습니다.
              만약 팀원이라면 이메일 주소를 확인해 주세요.
            </Typography>
          )}
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
            disabled={cloning || !isTeamMember}
            color="primary"
            startIcon={cloning ? <CircularProgress size={20} color="inherit" /> : <CloneIcon />}
            sx={{ 
              bgcolor: '#003876', // Ajou Blue 색상
              '&:hover': {
                bgcolor: '#00294F',
              }
            }}
          >
            {cloning ? '가져오는 중...' : '가져오기'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CloneToPortfolioButton;