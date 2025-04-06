// src/pages/admin/AdminUsers.js
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

import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAuth } from '../../components/auth/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  where,
  startAfter,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../../firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ROWS_PER_PAGE = 10;

const AdminUsers = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [roleData, setRoleData] = useState({});

  // 관리자 권한 확인
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 사용자 수 가져오기
  useEffect(() => {
    const fetchUserCount = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getCountFromServer(usersRef);
        setTotalUsers(snapshot.data().count);
      } catch (error) {
        console.error('Error getting user count:', error);
      }
    };
    
    fetchUserCount();
  }, [currentUser]);

  // 사용자 목록 가져오기 - 수정된 역할별 로직
  useEffect(() => {
    const fetchUsersByRole = async () => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      
      try {
        setLoading(true);
        
        // 역할 목록
        const roles = ['ADMIN', 'PROFESSOR', 'STUDENT', 'COMPANY', 'DEFAULT'];
        let allUsers = [];
        const roleStats = {};
        
        // 각 역할별로 사용자 가져오기
        for (const role of roles) {
          console.log(`Fetching users with role: ${role}`);
          
          const roleQuery = query(
            collection(db, 'users'),
            where('role', '==', role),
            orderBy('createdAt', 'desc')
          );
          
          const roleSnapshot = await getDocs(roleQuery);
          const usersWithRole = roleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          
          roleStats[role] = usersWithRole.length;
          console.log(`Found ${usersWithRole.length} users with role ${role}`);
          
          allUsers = [...allUsers, ...usersWithRole];
        }
        
        // 사용자를 생성 날짜 기준으로 정렬
        allUsers.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log('Role statistics:', roleStats);
        setRoleData(roleStats);
        
        // 전체 사용자 목록 업데이트
        setUsers(allUsers);
        
        // 사용자 총 수 업데이트
        setTotalUsers(allUsers.length);
        
        // 첫 페이지 표시를 위한 처리
        if (allUsers.length > 0) {
          const firstPageUsers = allUsers.slice(0, ROWS_PER_PAGE);
          const lastUser = firstPageUsers[firstPageUsers.length - 1];
          
          // lastVisible 설정
          setLastVisible({
            data: () => ({
              createdAt: lastUser.createdAt
            })
          });
        } else {
          setLastVisible(null);
        }
        
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsersByRole();
  }, [currentUser]);

  // 페이지 변경 시 데이터 로드
  const handleChangePage = (event, newPage) => {
    if (newPage < page) {
      // 이전 페이지로 이동
      setPage(0);
      return;
    }
    
    setPage(newPage);
    
    // 페이지에 맞게 사용자 목록 슬라이싱
    const startIndex = newPage * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    
    // lastVisible 업데이트
    if (users.length > endIndex) {
      setLastVisible({
        data: () => ({
          createdAt: users[endIndex - 1].createdAt
        })
      });
    } else {
      setLastVisible(null);
    }
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
      
      // 이메일 검색
      const emailQuery = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );
      
      // 이름 검색
      const nameQuery = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );
      
      // 역할 검색 (한글/영문 지원)
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
      
      // 쿼리 실행
      const queries = [getDocs(emailQuery), getDocs(nameQuery)];
      if (roleQuery) queries.push(getDocs(roleQuery));
      
      const results = await Promise.all(queries);
      
      // 결과 합치기
      const emailResults = results[0].docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      const nameResults = results[1].docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      // 역할 검색 결과 (있는 경우)
      let roleResults = [];
      if (roleQuery) {
        roleResults = results[2].docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
      }
      
      // 중복 제거
      const combined = [...emailResults];
      
      // 이름 결과 추가
      nameResults.forEach(user => {
        if (!combined.some(u => u.id === user.id)) {
          combined.push(user);
        }
      });
      
      // 역할 결과 추가
      roleResults.forEach(user => {
        if (!combined.some(u => u.id === user.id)) {
          combined.push(user);
        }
      });
      
      console.log(`Search found ${combined.length} users`);
      
      // 결과를 생성 날짜 기준으로 정렬
      combined.sort((a, b) => b.createdAt - a.createdAt);
      
      setSearchResults(combined);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
        role: userRole
      });
      
      // 목록 업데이트
      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(user => 
          user.id === selectedUser.id ? { ...user, role: userRole } : user
        ));
      } else {
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? { ...user, role: userRole } : user
        ));
      }
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('사용자 역할을 변경하는 중 오류가 발생했습니다.');
    }
  };

  // 사용자 차단/차단해제
  const handleBlockUser = (user) => {
    setUserToBlock(user);
    setBlockDialogOpen(true);
  };

  const handleToggleBlockUser = async () => {
    if (!userToBlock) return;
    
    const newBlockedState = !userToBlock.isBlocked;
    
    try {
      await updateDoc(doc(db, 'users', userToBlock.id), {
        isBlocked: newBlockedState
      });
      
      // 목록 업데이트
      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(user => 
          user.id === userToBlock.id ? { ...user, isBlocked: newBlockedState } : user
        ));
      } else {
        setUsers(prev => prev.map(user => 
          user.id === userToBlock.id ? { ...user, isBlocked: newBlockedState } : user
        ));
      }
      
      setBlockDialogOpen(false);
      setUserToBlock(null);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      alert('사용자 차단 상태를 변경하는 중 오류가 발생했습니다.');
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

  // 현재 페이지의 사용자 가져오기
  const getCurrentPageUsers = () => {
    if (searchResults.length > 0) {
      return searchResults;
    }
    
    const startIndex = page * ROWS_PER_PAGE;
    return users.slice(startIndex, startIndex + ROWS_PER_PAGE);
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
      
      {/* 디버깅 정보 - 개발 중에만 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2">디버깅 정보:</Typography>
          <Typography variant="body2">총 사용자 수: {totalUsers}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {Object.entries(roleData).map(([role, count]) => (
              <Chip 
                key={role} 
                label={`${role}: ${count}명`} 
                size="small" 
                variant="outlined" 
              />
            ))}
          </Box>
        </Paper>
      )}
      
      {/* 검색 폼 */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="사용자 검색"
          placeholder="이메일, 이름 또는 역할(학생, 교수 등)으로 검색"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ ml: 2, whiteSpace: 'nowrap' }}
        >
          검색
        </Button>
      </Paper>

      {loading ? (
        <LoadingSpinner message="사용자 정보를 불러오는 중..." />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>사용자</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>권한</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getCurrentPageUsers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      {searchTerm ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentPageUsers().map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{renderRoleChip(user.role)}</TableCell>
                      <TableCell>
                        {user.createdAt?.toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <Chip 
                            label="차단됨" 
                            size="small" 
                            color="error" 
                            variant="outlined" 
                            icon={<BlockIcon />} 
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
                        <IconButton 
                          onClick={() => handleBlockUser(user)}
                          size="small"
                          sx={{ color: user.isBlocked ? 'success.main' : 'error.main' }}
                        >
                          {user.isBlocked ? <CheckCircleIcon /> : <BlockIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 페이지네이션 (검색 결과가 없을 때만 표시) */}
          {searchResults.length === 0 && (
            <TablePagination
              component="div"
              count={totalUsers}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
            />
          )}
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
            <FormControl fullWidth>
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
      
      {/* 사용자 차단/해제 다이얼로그 */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
      >
        <DialogTitle>
          {userToBlock?.isBlocked ? '사용자 차단 해제' : '사용자 차단'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {userToBlock?.isBlocked
              ? `"${userToBlock?.displayName || userToBlock?.email}" 사용자의 차단을 해제하시겠습니까?`
              : `"${userToBlock?.displayName || userToBlock?.email}" 사용자를 차단하시겠습니까?`
            }
            {!userToBlock?.isBlocked && (
              <Typography sx={{ color: 'error.main', mt: 2 }}>
                차단된 사용자는 로그인은 가능하지만 게시글 작성, 댓글 작성 등의 활동이 제한됩니다.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleToggleBlockUser} 
            color={userToBlock?.isBlocked ? "success" : "error"}
            variant="contained"
            autoFocus
          >
            {userToBlock?.isBlocked ? '차단 해제' : '차단'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;