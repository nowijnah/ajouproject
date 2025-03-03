import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import useLike from './useLike';
import { useAuth } from '../components/auth/AuthContext';

/**
 * 게시물 데이터를 로드하고 관리하는 커스텀 훅
 * @param {string} postId - 게시물 ID
 * @param {string} collectionName - 컬렉션 이름 (portfolios, labs, companies)
 * @param {Object} previewData - 미리보기 모드에서 사용할 데이터 (선택 사항)
 * @param {Object} previewAuthor - 미리보기 모드에서 사용할 작성자 정보 (선택 사항)
 */
const usePostData = (postId, collectionName, previewData = null, previewAuthor = null) => {
  const { currentUser } = useAuth();
  const [postData, setPostData] = useState(previewData || null);
  const [authorData, setAuthorData] = useState(previewAuthor || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // 좋아요 관련 훅 사용
  const { isLiked, likeCount, toggleLike } = useLike(
    postId, 
    collectionName,
    currentUser?.uid || null
  );

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchPost = async () => {
      if (previewData) {
        setPostData(previewData);
        setAuthorData(previewAuthor);
        setLoading(false);
        return;
      }

      if (!collectionName || !postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 게시물 데이터 가져오기
        const postDoc = await getDoc(doc(db, collectionName, postId));
        
        if (postDoc.exists()) {
          const data = postDoc.data();
          setPostData({ id: postDoc.id, ...data });
          
          // 작성자 정보 가져오기
          if (data.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', data.authorId));
            if (authorDoc.exists()) {
              setAuthorData({ id: authorDoc.id, ...authorDoc.data() });
            }
          }
        } else {
          setError('게시물을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [collectionName, postId, previewData, previewAuthor]);

  // 좋아요한 사용자 목록 가져오기
  const fetchLikedUsers = async () => {
    if (!postId || previewData) return [];
    
    try {
      setLoadingLikes(true);
      
      const likesRef = collection(db, 'likes');
      const q = query(likesRef, where('postId', '==', postId));
      const likesSnapshot = await getDocs(q);
      
      const usersPromises = likesSnapshot.docs.map(async (likeDoc) => {
        const userData = likeDoc.data();
        const userDoc = await getDoc(doc(db, 'users', userData.userId));
        
        if (userDoc.exists()) {
          return {
            id: userDoc.id,
            ...userDoc.data()
          };
        }
        return null;
      });
      
      const users = (await Promise.all(usersPromises)).filter(user => user !== null);
      setLikedUsers(users);
      return users;
    } catch (err) {
      console.error('Error fetching liked users:', err);
      return [];
    } finally {
      setLoadingLikes(false);
    }
  };

  // 게시물 이미지 URL 가져오기
  const getDisplayImage = () => {
    if (!postData) return '';

    // 1. 기존 썸네일 이미지가 있으면 사용
    if (postData.thumbnail && postData.thumbnail !== 'undefined') 
      return postData.thumbnail;
    
    // 2. 첨부 파일 중 이미지가 있으면 첫 번째 이미지 사용
    const imageFile = postData.files?.find(file => file.type === 'IMAGE' && file.url);
    if (imageFile) return imageFile.url;
    
    // 3. 기본 이미지 사용
    return `/default-img.png`;
  };

  return {
    postData,
    authorData,
    loading,
    error,
    isLiked,
    likeCount,
    toggleLike,
    likedUsers,
    loadingLikes,
    fetchLikedUsers,
    getDisplayImage
  };
};

export default usePostData;