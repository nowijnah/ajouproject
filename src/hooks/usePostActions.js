import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * 게시물 작업(수정/삭제 등)을 관리하는 커스텀 훅
 * @param {string} postId - 게시물 ID
 * @param {string} collectionName - 컬렉션 이름 (portfolios, labs, companies)
 * @param {Object} postData - 게시물 데이터 객체
 */
const usePostActions = (postId, collectionName, postData) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // 게시물 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/${collectionName}/${postId}/edit`);
  };

  // 게시물 삭제 처리
  const handleDelete = async () => {
    if (!postId || deleting) return;
    
    try {
      setDeleting(true);
      setError(null);

      const batch = writeBatch(db);
      
      // 1. 댓글 삭제
      const commentsRef = collection(db, `${collectionName}_comments`);
      const commentsQuery = query(commentsRef, where("postId", "==", postId));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. 좋아요 삭제
      const likesRef = collection(db, 'likes');
      const likesQuery = query(likesRef, where("postId", "==", postId));
      const likesSnapshot = await getDocs(likesQuery);
      likesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. 파일 삭제 (스토리지)
      if (postData?.files) {
        for (const file of postData.files) {
          if (file.url) {
            try {
              const fileRef = ref(storage, file.url);
              await deleteObject(fileRef);
            } catch (fileError) {
              console.error('Error deleting file:', fileError);
              // 파일 삭제 실패해도 계속 진행
            }
          }
        }
      }

      // 4. 썸네일 삭제 (스토리지)
      if (postData?.thumbnail) {
        try {
          const thumbnailRef = ref(storage, postData.thumbnail);
          await deleteObject(thumbnailRef);
        } catch (thumbnailError) {
          console.error('Error deleting thumbnail:', thumbnailError);
          // 썸네일 삭제 실패해도 계속 진행
        }
      }

      // 5. 게시글 문서 삭제
      const postRef = doc(db, collectionName, postId);
      batch.delete(postRef);

      // 일괄 처리 실행
      await batch.commit();

      // 성공 시 목록 페이지로 이동
      navigate(`/${collectionName}`);
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('게시글 삭제 중 오류가 발생했습니다.');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    handleEdit,
    handleDelete,
    deleting,
    error
  };
};

export default usePostActions;