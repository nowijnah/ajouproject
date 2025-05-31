import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

const REPORT_TYPES = {
  SPAM: '스팸/광고',
  INAPPROPRIATE: '부적절한 내용',
  HARASSMENT: '괴롭힘/욕설',
  COPYRIGHT: '저작권 침해',
  FAKE_INFO: '허위정보',
  OTHER: '기타'
};

const ReportDialog = ({ 
  open, 
  onClose, 
  reportType, // 'POST', 'COMMENT', 'USER'
  targetId, 
  targetUserId,
  targetTitle,
  onSuccess 
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser || !reason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Firebase Functions의 submitReport 함수 호출
      const submitReport = httpsCallable(functions, 'submitReport');
      
      const result = await submitReport({
        reportType,
        targetId,
        targetUserId,
        targetTitle,
        reason,
        description: description.trim()
      });

      if (result.data.success) {
        if (onSuccess) {
          onSuccess();
        }
        
        alert('신고가 접수되었습니다. 관리자가 검토 후 적절한 조치를 취하겠습니다.');
        handleClose();
      } else {
        throw new Error(result.data.message || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('신고 제출 중 오류:', error);
      
      // Firebase Functions 에러 메시지 처리
      let errorMessage = '신고 제출 중 오류가 발생했습니다.';
      
      if (error.code === 'functions/unauthenticated') {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = error.message || '권한이 없습니다.';
      } else if (error.code === 'functions/already-exists') {
        errorMessage = '이미 신고한 내용입니다.';
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = error.message || '잘못된 요청입니다.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onClose();
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'POST':
        return '게시글 신고';
      case 'COMMENT':
        return '댓글 신고';
      case 'USER':
        return '사용자 신고';
      default:
        return '신고하기';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!submitting ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{getReportTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {targetTitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              대상: {targetTitle}
            </Typography>
          )}
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">신고 사유</FormLabel>
            <RadioGroup
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {Object.entries(REPORT_TYPES).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio />}
                  label={label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="상세 설명 (선택사항)"
            placeholder="신고 사유에 대한 자세한 설명을 입력해주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={submitting}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={submitting || !reason}
        >
          {submitting ? '제출 중...' : '신고하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;