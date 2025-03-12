import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';

const useReplies = (commentId, postId, collectionName) => {
  const [replyList, setReplyList] = useState([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [loadingCount, setLoadingCount] = useState(true);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [lastReplyDoc, setLastReplyDoc] = useState(null);
  const [error, setError] = useState(null);

  // 답글 개수 가져오기
  useEffect(() => {
    const fetchReplyCount = async () => {
      if (!commentId || !postId || !collectionName) return;

      try {
        setLoadingCount(true);
        const commentsRef = collection(db, `${collectionName}_comments`);
        const countQuery = query(
          commentsRef,
          where("postId", "==", postId),
          where("parentId", "==", commentId)
        );

        const snapshot = await getCountFromServer(countQuery);
        setReplyCount(snapshot.data().count);
      } catch (err) {
        console.error("Error fetching reply count:", err);
        setError(err);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchReplyCount();
  }, [commentId, postId, collectionName]);

  // 사용자 정보 가져오기
  const fetchUserData = async (authorId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', authorId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  };

  const loadInitialReplies = async () => {
    if (!commentId || !postId || !collectionName) return;
    
    setLoadingReplies(true);
    setError(null);
    
    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      const repliesQuery = query(
        commentsRef,
        where("postId", "==", postId),
        where("parentId", "==", commentId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(repliesQuery);
      
      if (!snapshot.empty) {
        const replies = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const author = await fetchUserData(data.authorId);
            
            // createdAt과 updatedAt을 명시적으로 변환
            let createdAt;
            if (data.createdAt) {
              if (data.createdAt.toDate) {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
              } else {
                createdAt = new Date(data.createdAt);
              }
            } else {
              createdAt = new Date();
            }
            
            let updatedAt;
            if (data.updatedAt) {
              if (data.updatedAt.toDate) {
                updatedAt = data.updatedAt.toDate();
              } else if (data.updatedAt instanceof Date) {
                updatedAt = data.updatedAt;
              } else {
                updatedAt = new Date(data.updatedAt);
              }
            } else {
              updatedAt = new Date();
            }

            return {
              id: doc.id,
              ...data,
              author,
              createdAt,
              updatedAt
            };
          })
        );
        
        setReplyList(replies.reverse());
        setLastReplyDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMoreReplies(snapshot.docs.length === 10);
      } else {
        setReplyList([]);
        setHasMoreReplies(false);
      }
    } catch (err) {
      console.error("Error loading replies:", err);
      setError(err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const loadMoreReplies = async () => {
    if (!lastReplyDoc || !hasMoreReplies) return;
    
    setLoadingReplies(true);
    setError(null);

    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      const repliesQuery = query(
        commentsRef,
        where("postId", "==", postId),
        where("parentId", "==", commentId),
        orderBy("createdAt", "desc"),
        startAfter(lastReplyDoc),
        limit(10)
      );

      const snapshot = await getDocs(repliesQuery);
      
      if (!snapshot.empty) {
        const newReplies = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const author = await fetchUserData(data.authorId);
            
            return {
              id: doc.id,
              ...data,
              author,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date()
            };
          })
        );
        
        setReplyList(prev => [...prev, ...newReplies.reverse()]);
        setLastReplyDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMoreReplies(snapshot.docs.length === 10);
      } else {
        setHasMoreReplies(false);
      }
    } catch (err) {
      console.error("Error loading more replies:", err);
      setError(err);
    } finally {
      setLoadingReplies(false);
    }
  };

  // commentId가 변경될 때 상태 초기화
  useEffect(() => {
    setReplyList([]);
    setHasMoreReplies(true);
    setLastReplyDoc(null);
    setError(null);
  }, [commentId]);

  return {
    replyList,
    replyCount,
    loadingReplies,
    loadingCount,
    hasMoreReplies,
    error,
    loadInitialReplies,
    loadMoreReplies
  };
};

export default useReplies;