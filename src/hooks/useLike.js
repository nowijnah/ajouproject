import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc, 
  doc,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const useLike = (postId, collectionName, userId) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 좋아요 토글
  const toggleLike = async () => {
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(db, collectionName, postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }

        const q = query(
          collection(db, 'likes'),
          where('postId', '==', postId),
          where('userId', '==', userId)
        );
        const likesSnapshot = await getDocs(q);
        
        const currentLikeCount = postDoc.data().likeCount || 0;

        if (likesSnapshot.empty) {
          // 좋아요 추가
          const newLikeRef = doc(collection(db, 'likes'));
          transaction.set(newLikeRef, {
            userId,
            postId,
            collectionName,
            createdAt: serverTimestamp()
          });

          transaction.update(postRef, {
            likeCount: currentLikeCount + 1
          });

          setIsLiked(true);
          setLikeCount(currentLikeCount + 1);
        } else {
          // 좋아요 취소
          const likeDoc = likesSnapshot.docs[0];
          transaction.delete(doc(db, 'likes', likeDoc.id));

          transaction.update(postRef, {
            likeCount: Math.max(0, currentLikeCount - 1)
          });

          setIsLiked(false);
          setLikeCount(Math.max(0, currentLikeCount - 1));
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 초기 좋아요 상태 및 카운트 설정
  const initializeLikeStatus = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      
      // 게시물의 좋아요 수 가져오기
      const postRef = doc(db, collectionName, postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentLikeCount = postDoc.data().likeCount || 0;
        setLikeCount(currentLikeCount);

        // 사용자의 좋아요 여부 확인
        if (userId) {
          const q = query(
            collection(db, 'likes'),
            where('postId', '==', postId),
            where('userId', '==', userId)
          );
          const querySnapshot = await getDocs(q);
          setIsLiked(!querySnapshot.empty);
        }
      }
    } catch (error) {
      console.error('Error initializing like status:', error);
    } finally {
      setLoading(false);
    }
  };

  // userId가 변경될 때마다 좋아요 상태 초기화
  useEffect(() => {
    initializeLikeStatus();
  }, [postId, collectionName, userId]);

  return {
    isLiked,
    likeCount,
    loading,
    toggleLike
  };
};

export default useLike;