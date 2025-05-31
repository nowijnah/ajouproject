import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';

import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArticleIcon from '@mui/icons-material/Article';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useAuth } from '../../components/auth/AuthContext';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  where,
  startAfter,
  limit,
  getCountFromServer,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ROWS_PER_PAGE = 10;

const REPORT_TYPES = {
  SPAM: '스팸/광고',
  INAPPROPRIATE: '부적절한 내용',
  HARASSMENT: '괴롭힘/욕설',
  COPYRIGHT: '저작권 침해',
  FAKE_INFO: '허위정보',
  OTHER: '기타'
};

const SANCTION_TYPES = {
  NONE: '조치 없음',
  WARNING: '경고',
  COMMENT_BAN: '댓글 금지',
  LOGIN_BAN: '로그인 금지'
};

const ROLE_FILTERS = {
  ALL: '전체',
  ADMIN: '관리자',
  PROFESSOR: '교수',
  STUDENT: '학생',
  COMPANY: '기업',
  DEFAULT: '일반'
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 기존 차단 관련 상태와 함수 제거 (더 이상 필요 없음)
  // handleBlockUser, handleToggleBlockUser 함수들도 제거됨

  const [roleData, setRoleData] = useState({});
  const [userPostCounts, setUserPostCounts] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [userReports, setUserReports] = useState({});
  const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);
  const [sanctionType, setSanctionType] = useState('NONE');
  const [sanctionNote, setSanctionNote] = useState('');

  // 필터링 관련 상태
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'BLOCKED', 'ACTIVE', 'REPORTED'

  // 관리자 권한 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 사용자별 게시글 수 가져오기
  useEffect(() => {
    const fetchUserPostCounts = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;

      try {
        const collections = ['portfolios', 'labs', 'companies'];
        const postCounts = {};

        for (const collectionName of collections) {
          const postsRef = collection(db, collectionName);
          const postsSnapshot = await getDocs(postsRef);

          postsSnapshot.docs.forEach(doc => {
            const authorId = doc.data().authorId;
            if (authorId) {
              postCounts[authorId] = (postCounts[authorId] || 0) + 1;
            }
          });
        }

        setUserPostCounts(postCounts);
      } catch (error) {
        console.error('Error fetching user post counts:', error);
      }
    };

    fetchUserPostCounts();
  }, [currentUser]);

  // 신고 데이터 가져오기
  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;

      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const reportsData = await Promise.all(
          querySnapshot.docs.map(async (reportDoc) => {
            const reportData = reportDoc.data();

            // 신고자 정보 가져오기
            let reporterData = null;
            try {
              const reporterDoc = await getDoc(doc(db, 'users', reportData.reporterId));
              if (reporterDoc.exists()) {
                reporterData = reporterDoc.data();
              }
            } catch (error) {
              console.error('Error fetching reporter data:', error);
            }

            return {
              id: reportDoc.id,
              ...reportData,
              reporter: reporterData,
              createdAt: reportData.createdAt?.toDate?.() || new Date(),
              reviewedAt: reportData.reviewedAt?.toDate?.() || null
            };
          })
        );

        // 사용자별로 신고 그룹화
        const groupedReports = {};
        reportsData.forEach(report => {
          const userId = report.targetUserId;
          if (!groupedReports[userId]) {
            groupedReports[userId] = [];
          }
          groupedReports[userId].push(report);
        });

        setUserReports(groupedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [currentUser]);

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsersByRole = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;

      try {
        setLoading(true);

        const roles = ['ADMIN', 'PROFESSOR', 'STUDENT', 'COMPANY', 'DEFAULT'];
        let allUsers = [];
        const roleStats = {};

        for (const role of roles) {
          const roleQuery = query(
            collection(db, 'users'),
            where('role', '==', role),
            orderBy('createdAt', 'desc')
          );

          const roleSnapshot = await getDocs(roleQuery);
          const usersWithRole = roleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            lastActivity: doc.data().lastActivity?.toDate?.() || null
          }));

          roleStats[role] = usersWithRole.length;
          allUsers = [...allUsers, ...usersWithRole];
        }

        allUsers.sort((a, b) => b.createdAt - a.createdAt);

        setRoleData(roleStats);
        setUsers(allUsers);
        setTotalUsers(allUsers.length);

      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersByRole();
  }, [currentUser]);

  // 필터링 로직
  useEffect(() => {
    let filtered = users;

    // 검색 결과가 있으면 검색 결과를 기준으로 필터링
    if (searchResults.length > 0) {
      filtered = searchResults;
    }

    // 역할 필터링
    if (selectedRoleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter);
    }

    // 상태 필터링
    switch (statusFilter) {
      case 'BLOCKED':
        filtered = filtered.filter(user => user.isBlocked === true);
        break;
      case 'ACTIVE':
        filtered = filtered.filter(user => user.isBlocked !== true);
        break;
      case 'REPORTED':
        filtered = filtered.filter(user => {
          const reports = userReports[user.id] || [];
          return reports.some(report => report.status === 'PENDING');
        });
        break;
      case 'ALL':
      default:
        // 모든 사용자 표시
        break;
    }

    setFilteredUsers(filtered);
    setPage(0); // 필터 변경 시 첫 페이지로 이동
  }, [users, searchResults, selectedRoleFilter, statusFilter, userReports]);

  // 페이지 변경
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 사용자 검색
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, 'users');

      const emailQuery = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );

      const nameQuery = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );

      let roleQuery = null;
      const searchTermLower = searchTerm.toLowerCase();

      if (['학생', 'student'].some(term => searchTermLower.includes(term))) {
        roleQuery = query(usersRef, where('role', '==', 'STUDENT'));
      } else if (['교수', 'professor'].some(term => searchTermLower.includes(term))) {
        roleQuery = query(usersRef, where('role', '==', 'PROFESSOR'));
      } else if (['관리자', 'admin'].some(term => searchTermLower.includes(term))) {
        roleQuery = query(usersRef, where('role', '==', 'ADMIN'));
      } else if (['기업', 'company'].some(term => searchTermLower.includes(term))) {
        roleQuery = query(usersRef, where('role', '==', 'COMPANY'));
      }

      const queries = [getDocs(emailQuery), getDocs(nameQuery)];
      if (roleQuery) queries.push(getDocs(roleQuery));

      const results = await Promise.all(queries);

      const emailResults = results[0].docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate?.() || null
      }));

      const nameResults = results[1].docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate?.() || null
      }));

      let roleResults = [];
      if (roleQuery) {
        roleResults = results[2].docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          lastActivity: doc.data().lastActivity?.toDate?.() || null
        }));
      }

      const combined = [...emailResults];

      nameResults.forEach(user => {
        if (!combined.some(u => u.id === user.id)) {
          combined.push(user);
        }
      });

      roleResults.forEach(user => {
        if (!combined.some(u => u.id === user.id)) {
          combined.push(user);
        }
      });

      combined.sort((a, b) => b.createdAt - a.createdAt);

      setSearchResults(combined);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  // 행 확장/축소
  const handleToggleRow = (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  // 사용자 역할 변경
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserRole(user.role || 'DEFAULT');
    setEditDialogOpen(true);
  };

  // 사용자 역할 저장
  const handleSaveUserRole = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        role: userRole,
        originalRole: userRole // originalRole 필드가 필요한 경우 유지
      });

      // 상태 업데이트
      setUsers(prev => prev.map(user =>
        user.id === selectedUser.id ? { ...user, role: userRole } : user
      ));

      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(user =>
          user.id === selectedUser.id ? { ...user, role: userRole } : user
        ));
      }

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('사용자 역할을 변경하는 중 오류가 발생했습니다.');
    }
  };

  // ***** 이전에 제거 지시했던 handleBlockUser 및 handleToggleBlockUser 함수는 완전히 제거되었습니다. *****
  // handleBlockUser 및 handleToggleBlockUser 함수는 이제 handleOpenUserActionDialog 및 handleApplyUserAction으로 대체됩니다.

  // 사용자 조치 다이얼로그 열기 (기존 차단 버튼 기능을 확장)
  const handleOpenUserActionDialog = async (user) => {
    setSelectedUser(user);

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // 현재 사용자 상태에 따라 기본 선택값 설정
        if (userData.isBlocked === true) {
          setSanctionType('LOGIN_BAN');
        } else if (userData.isCommentBanned === true) {
          setSanctionType('COMMENT_BAN');
        } else {
          setSanctionType('NONE');
        }

        // 기존 관리자 메모가 있다면 가져오기
        const reports = userReports[user.id] || [];
        const latestReportWithNote = reports
          .filter(report => report.adminNote)
          .sort((a, b) => b.reviewedAt - a.reviewedAt)[0];
        setSanctionNote(latestReportWithNote?.adminNote || '');
      }
    } catch (error) {
      console.error('사용자 상태 확인 중 오류:', error);
      setSanctionType('NONE');
      setSanctionNote('');
    }

    setSanctionDialogOpen(true);
  };

  // 조치 적용 (신고와 상관없이 사용자 상태만 변경)
  const handleApplyUserAction = async () => {
    if (!selectedUser) return;

    try {
      // 사용자에게 조치 적용
      const userUpdateData = {};

      switch (sanctionType) {
        case 'COMMENT_BAN':
          // 댓글만 금지, 로그인은 허용
          userUpdateData.isCommentBanned = true;
          userUpdateData.isBlocked = false;
          break;
        case 'LOGIN_BAN':
          // 로그인 차단 (당연히 댓글도 불가능)
          userUpdateData.isBlocked = true;
          userUpdateData.isCommentBanned = true;
          break;
        case 'WARNING':
          // 경고만, 모든 제재 해제
          userUpdateData.isCommentBanned = false;
          userUpdateData.isBlocked = false;
          break;
        case 'NONE':
          // 조치 없음, 모든 제재 해제
          userUpdateData.isCommentBanned = false;
          userUpdateData.isBlocked = false;
          break;
        default:
          break;
      }

      // 조치 적용일시 기록
      userUpdateData.lastSanctionDate = serverTimestamp();
      userUpdateData.lastSanctionType = sanctionType;
      userUpdateData.lastSanctionBy = currentUser.uid;
      if (sanctionNote.trim()) {
        userUpdateData.lastSanctionNote = sanctionNote;
      }

      // 사용자 상태 업데이트
      await updateDoc(doc(db, 'users', selectedUser.id), userUpdateData);

      console.log(`사용자 ${selectedUser.displayName}에게 조치 적용:`, {
        sanctionType,
        isBlocked: userUpdateData.isBlocked,
        isCommentBanned: userUpdateData.isCommentBanned
      });

      // 미처리 신고가 있다면 함께 처리
      const reports = userReports[selectedUser.id] || [];
      const pendingReports = reports.filter(report => report.status === 'PENDING');

      if (pendingReports.length > 0) {
        const updatePromises = pendingReports.map(report =>
          updateDoc(doc(db, 'reports', report.id), {
            status: sanctionType === 'NONE' ? 'REVIEWED' : 'RESOLVED',
            action: sanctionType,
            reviewedAt: serverTimestamp(),
            reviewedBy: currentUser.uid,
            adminNote: sanctionNote
          })
        );

        await Promise.all(updatePromises);

        // 신고 상태 업데이트
        setUserReports(prev => ({
          ...prev,
          [selectedUser.id]: (prev[selectedUser.id] || []).map(report => {
            const isTargetReport = pendingReports.some(pr => pr.id === report.id);
            if (isTargetReport) {
              return {
                ...report,
                status: sanctionType === 'NONE' ? 'REVIEWED' : 'RESOLVED',
                action: sanctionType,
                reviewedAt: new Date(), // 클라이언트 측 UI 업데이트용
                reviewedBy: currentUser.uid,
                adminNote: sanctionNote
              };
            }
            return report;
          })
        }));
      }

      // UI 상태 업데이트
      // Firestore의 serverTimestamp()는 즉시 Date 객체로 변환되지 않으므로, UI를 위해 현재 시간으로 임시 업데이트
      const updatedUser = {
        ...selectedUser,
        ...userUpdateData,
        lastActivity: new Date(), // UI 업데이트용
        lastSanctionDate: new Date() // UI 업데이트용
      };

      setUsers(prev => prev.map(user =>
        user.id === selectedUser.id ? updatedUser : user
      ));

      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(user =>
          user.id === selectedUser.id ? updatedUser : user
        ));
      }

      setSanctionDialogOpen(false);

      // 조치 타입에 따른 적절한 메시지
      let message = '';
      switch (sanctionType) {
        case 'COMMENT_BAN':
          message = `${selectedUser.displayName}님의 댓글 작성이 금지되었습니다.`;
          break;
        case 'LOGIN_BAN':
          message = `${selectedUser.displayName}님의 로그인이 차단되었습니다.`;
          break;
        case 'WARNING':
          message = `${selectedUser.displayName}님에게 경고 조치가 적용되었습니다.`;
          break;
        case 'NONE':
          message = `${selectedUser.displayName}님의 모든 제재가 해제되었습니다.`;
          break;
        default:
          message = '조치가 적용되었습니다.';
      }
      alert(message);

    } catch (error) {
      console.error('조치 적용 중 오류:', error);
      alert('조치 적용 중 오류가 발생했습니다.');
    }
  };

  // 역할별 칩 렌더링
  const renderRoleChip = (role) => {
    switch(role) {
      case 'ADMIN':
        return <Chip label="관리자" color="error" size="small" />;
      case 'PROFESSOR':
        return <Chip label="교수" color="secondary" size="small" />;
      case 'STUDENT':
        return <Chip label="학생" color="primary" size="small" />;
      case 'COMPANY':
        return <Chip label="기업" color="success" size="small" />;
      default:
        return <Chip label="일반" size="small" variant="outlined" />;
    }
  };

  // 상태 칩 렌더링
  const renderStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return <Chip label="대기중" color="warning" size="small" />;
      case 'REVIEWED':
        return <Chip label="검토완료" color="info" size="small" />;
      case 'RESOLVED':
        return <Chip label="해결됨" color="success" size="small" />;
      default:
        return <Chip label="알 수 없음" size="small" />;
    }
  };

  // 신고 유형 칩 렌더링
  const renderReportTypeChip = (reportType) => {
    const colors = {
      SPAM: 'default',
      INAPPROPRIATE: 'error',
      HARASSMENT: 'error',
      COPYRIGHT: 'warning',
      FAKE_INFO: 'info',
      OTHER: 'default'
    };

    return (
      <Chip
        label={REPORT_TYPES[reportType] || reportType}
        color={colors[reportType] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  // 마지막 활동 시간 포맷팅
  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return '활동 없음';

    const now = new Date();
    const diff = now - lastActivity;

    if (diff < 24 * 60 * 60 * 1000) {
      return '오늘';
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}일 전`;
    }

    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (7 * 24 * 60 * 60 * 1000))}주 전`;
    }

    return lastActivity.toLocaleDateString('ko-KR');
  };

  // 현재 페이지의 사용자 가져오기
  const getCurrentPageUsers = () => {
    const startIndex = page * ROWS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ROWS_PER_PAGE);
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
          사용자 관리
        </Typography>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              전체 사용자
            </Typography>
          </Paper>
        </Grid>
        {Object.entries(ROLE_FILTERS).slice(1).map(([key, label]) => (
          <Grid item xs={12} sm={6} md={2} key={key}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {roleData[key] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 검색 및 필터 폼 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="사용자 검색"
              placeholder="이메일, 이름으로 검색"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>권한</InputLabel>
              <Select
                value={selectedRoleFilter}
                label="권한"
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
              >
                {Object.entries(ROLE_FILTERS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label} {key !== 'ALL' && `(${roleData[key] || 0})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                label="상태"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="ACTIVE">정상</MenuItem>
                <MenuItem value="BLOCKED">차단됨</MenuItem>
                <MenuItem value="REPORTED">신고됨</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ whiteSpace: 'nowrap' }}
              >
                검색
              </Button>
              {(searchTerm || selectedRoleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    handleClearSearch();
                    setSelectedRoleFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  초기화
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSpinner message="사용자 정보를 불러오는 중..." />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell width="40px"></TableCell>
                  <TableCell>사용자</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>권한</TableCell>
                  <TableCell>게시글</TableCell>
                  <TableCell>신고</TableCell>
                  <TableCell>마지막 활동</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getCurrentPageUsers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      {searchTerm ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentPageUsers().map((user) => {
                    const reports = userReports[user.id] || [];
                    const pendingReports = reports.filter(report => report.status === 'PENDING').length;

                    return (
                      <React.Fragment key={user.id}>
                        <TableRow hover sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRow(user.id)}
                              disabled={reports.length === 0}
                            >
                              {reports.length > 0 && (expandedRows.has(user.id) ?
                                <ExpandLessIcon /> : <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                src={user.profileImage}
                                alt={user.displayName}
                                sx={{ width: 32, height: 32, mr: 1 }}
                              >
                                {user.displayName?.[0]}
                              </Avatar>
                              <Typography>{user.displayName || '이름 없음'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            {user.email}
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            {renderRoleChip(user.role)}
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            <Tooltip title="게시글 수">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ArticleIcon fontSize="small" color="primary" />
                                <Typography variant="body2">
                                  {userPostCounts[user.id] || 0}개
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            {reports.length > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Badge badgeContent={pendingReports} color="error">
                                  <NotificationImportantIcon
                                    fontSize="small"
                                    color={pendingReports > 0 ? "error" : "warning"}
                                  />
                                </Badge>
                                <Typography variant="body2">
                                  {reports.length}건
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                없음
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell onClick={() => reports.length > 0 && handleToggleRow(user.id)}>
                            <Tooltip title={user.lastActivity ? new Date(user.lastActivity).toLocaleString('ko-KR') : '활동 없음'}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {formatLastActivity(user.lastActivity)}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {/* 사용자 상태에 따른 동적 상태 표시 */}
                            {user.isBlocked ? (
                              <Chip
                                label="로그인 차단"
                                size="small"
                                color="error"
                                variant="filled"
                              />
                            ) : user.isCommentBanned ? (
                              <Chip
                                label="댓글 금지"
                                size="small"
                                color="warning"
                                variant="filled"
                                icon={<NotificationImportantIcon />}
                              />
                            ) : (
                              <Chip
                                label="정상"
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => handleEditUser(user)}
                              size="small"
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <Tooltip title="사용자 조치">
                              <IconButton
                                onClick={() => handleOpenUserActionDialog(user)}
                                size="small"
                                sx={{
                                  color: user.isBlocked ? 'error.main' :
                                         user.isCommentBanned ? 'warning.main' : 'primary.main'
                                }}
                              >
                                <GavelIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* 확장된 신고 상세 정보 */}
                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0, border: 'none' }}>
                            <Collapse in={expandedRows.has(user.id)}> {/* <<<< 이 부분 괄호 수정됨 */}
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                  신고 내역 ({reports.length}건)
                                </Typography>
                                <List dense>
                                  {reports.map((report, index) => (
                                    <React.Fragment key={report.id}>
                                      <ListItem sx={{ px: 0 }}>
                                        <Box sx={{ width: '100%' }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                              {renderReportTypeChip(report.reason)}
                                              <Chip
                                                label={report.reportType}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                              />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                              {renderStatusChip(report.status)}
                                              <Typography variant="caption" color="text.secondary">
                                                {report.createdAt.toLocaleDateString('ko-KR')}
                                              </Typography>
                                            </Box>
                                          </Box>
                                          <Typography variant="body2" color="text.secondary" noWrap>
                                            대상: {report.targetTitle || '제목 없음'}
                                          </Typography>
                                          {report.description && (
                                            <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                                              {report.description}
                                            </Typography>
                                          )}
                                          {report.reporter && (
                                            <Typography variant="caption" color="text.secondary">
                                              신고자: {report.reporter.displayName || '알 수 없음'}
                                            </Typography>
                                          )}
                                          {report.status !== 'PENDING' && report.adminNote && (
                                            <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                                              <Typography variant="caption" color="info.contrastText">
                                                관리자 메모: {report.adminNote}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </ListItem>
                                      {index < reports.length - 1 && <Divider />}
                                    </React.Fragment>
                                  ))}
                                </List>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count} (필터링된 결과: ${filteredUsers.length}/${users.length})`
            }
          />
        </>
      )}

      {/* 사용자 역할 수정 다이얼로그 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      >
        <DialogTitle>사용자 권한 변경</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>권한</InputLabel>
              <Select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                label="권한"
              >
                <MenuItem value="DEFAULT">일반</MenuItem>
                <MenuItem value="STUDENT">학생</MenuItem>
                <MenuItem value="PROFESSOR">교수</MenuItem>
                <MenuItem value="COMPANY">기업</MenuItem>
                <MenuItem value="ADMIN">관리자</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSaveUserRole}
            variant="contained"
            color="primary"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
      {/* 사용자 조치 다이얼로그 (기존 조치 다이얼로그 교체) */}
      <Dialog
        open={sanctionDialogOpen}
        onClose={() => setSanctionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          사용자 조치 관리
          {selectedUser && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedUser.displayName || selectedUser.email}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {/* 현재 상태 표시 */}
            {selectedUser && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>현재 상태</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedUser.isBlocked ? (
                    <Chip label="로그인 차단" color="error" size="small" />
                  ) : selectedUser.isCommentBanned ? (
                    <Chip label="댓글 금지" color="warning" size="small" />
                  ) : (
                    <Chip label="정상" color="success" size="small" />
                  )}

                  {/* 신고 현황 표시 */}
                  {userReports[selectedUser.id] && (
                    <Chip
                      label={`신고 ${userReports[selectedUser.id].length}건`}
                      color={userReports[selectedUser.id].filter(r => r.status === 'PENDING').length > 0 ? "error" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">조치 선택</FormLabel>
              <RadioGroup
                value={sanctionType}
                onChange={(e) => setSanctionType(e.target.value)}
              >
                <FormControlLabel
                  value="NONE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        조치 없음 (정상)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 0 }}>
                        모든 제재를 해제하고 정상 상태로 복구
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="WARNING"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        경고
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 0 }}>
                        경고 후 기존 제재 해제 (경고 기록 남김)
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="COMMENT_BAN"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
                        댓글 금지
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 0 }}>
                        댓글 작성만 금지, 로그인 및 게시물 보기는 가능
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="LOGIN_BAN"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                        로그인 차단
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 0 }}>
                        로그인 차단 (댓글도 자동 차단, 모든 서비스 이용 불가)
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="관리자 메모 (선택사항)"
              placeholder="조치 사유나 추가 설명을 입력해주세요."
              value={sanctionNote}
              onChange={(e) => setSanctionNote(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSanctionDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleApplyUserAction}
            variant="contained"
            color="primary"
          >
            조치 적용
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;