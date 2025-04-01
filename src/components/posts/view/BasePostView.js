import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';import { useAuth } from '../../auth/AuthContext';
import Comments from '../../comments/Comments';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostKeywords from './PostKeywords';
import PostAttachments from './PostAttachments';
import PostLinks from './PostLinks';
import usePostData from '../../../hooks/usePostData';
import usePostActions from '../../../hooks/usePostActions';
import AnimatedLoading from '../../common/AnimatedLoading';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * 게시물 상세 보기 컴포넌트
 * 리팩토링된 버전으로 여러 작은 컴포넌트로 분리되었습니다.
 */
const BasePostView = ({
  collectionName,
  previewData,     
  previewAuthor
}) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 게시물 데이터 로딩
  const {
    postData,
    authorData,
    loading,
    error,
    isLiked,
    likeCount,
    toggleLike,
    fetchLikedUsers,
    getDisplayImage
  } = usePostData(postId, collectionName, previewData, previewAuthor);
  console.log(postData);
  
  // 게시물 작업 관련 훅
  const {
    handleEdit,
    handleDelete,
    deleting
  } = usePostActions(postId, collectionName, postData);

  // 작성자 프로필로 이동
  const handleAuthorClick = () => {
    if (!authorData?.id) return;
    
    if (currentUser?.uid === authorData.id) {
      navigate('/mypage');
    } else {
      navigate(`/profile/${authorData.id}`);
    }
  };

  // 좋아요 토글
  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      await toggleLike();
    } catch (error) {
      alert(error.message);
    }
  };

  // 로딩 중
  if (loading) {
    return <AnimatedLoading message="게시물을 불러오는 중입니다" />;
  }

  // 에러 발생 시
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // 데이터 없음
  if (!postData || !authorData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            게시물을 찾을 수 없습니다.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* 헤더 - 작성자 정보, 좋아요, 수정/삭제 버튼 */}
        <PostHeader
          postId={postId}
          postData={postData}
          authorData={authorData}
          isLiked={isLiked}
          likeCount={likeCount}
          isPreview={Boolean(previewData)}
          currentUser={currentUser}
          collectionName={collectionName}
          onDelete={handleDelete}
          onLike={handleLike}
          onAuthorClick={handleAuthorClick}
        />
        
        {/* 본문 - 제목, 부제목, 썸네일, 마크다운 내용 */}
        <PostContent
          title={postData.title}
          subtitle={postData.subtitle}
          content={postData.content}
          thumbnailUrl={postData.thumbnail === 'markdown-image' ? null : postData.thumbnail}
          getDisplayImage={getDisplayImage}
        />
        
        {/* 키워드 */}
        <PostKeywords keywords={postData.keywords} />
        
        {/* 첨부 파일 */}
        <PostAttachments files={postData.files} />
        
        {/* 관련 링크 */}
        <PostLinks links={postData.links} />

        {/* 댓글 섹션 */}
        {!previewData && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 4, pt: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                댓글 {postData.commentCount || 0}
              </Typography>
            </Box>
            
            <Box sx={{ 
              px: 4, 
              py: 4,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Comments
                postId={postId}
                collectionName={collectionName}
                postAuthorId={postData?.authorId}
              />
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default BasePostView;