import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  serverTimestamp,
  getDoc,
  increment
} from 'firebase/firestore';
import { db, functions } from '../firebase';
import { useAuth } from '../components/auth/AuthContext';
import { httpsCallable } from 'firebase/functions';

const commentsHook = (postId, collectionName) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, updateLastActivity } = useAuth();
  const [lastDoc, setLastDoc] = useState(null);  
  const [hasMore, setHasMore] = useState(true); 

  // 사용자 댓글 권한 확인 (실시간)
  const checkCommentPermission = async (userId) => {
    if (!userId) return { allowed: false, message: "로그인이 필요합니다." };

    try {
      // 실시간으로 사용자 상태 확인
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { allowed: false, message: "사용자 정보를 찾을 수 없습니다." };
      }

      const userData = userDoc.data();

      // 1. 로그인 차단 체크 (최우선)
      if (userData.isBlocked === true) {
        return { 
          allowed: false, 
          message: "계정이 관리자에 의해 차단되어 댓글을 작성할 수 없습니다.\n문의사항이 있으시면 관리자에게 연락해주세요." 
        };
      }

      // 2. 댓글 금지 체크
      if (userData.isCommentBanned === true) {
        return { 
          allowed: false, 
          message: "댓글 작성이 관리자에 의해 제한된 계정입니다.\n문의사항이 있으시면 관리자에게 연락해주세요." 
        };
      }

      // 3. 승인되지 않은 기업 계정 체크
      if (userData.role === 'DEFAULT') {
        return { 
          allowed: false, 
          message: "승인된 회사 계정만 댓글을 작성할 수 있습니다." 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking comment permission:", error);
      return { allowed: false, message: "권한 확인 중 오류가 발생했습니다." };
    }
  };


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

  // 댓글 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId || !collectionName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const commentsRef = collection(db, `${collectionName}_comments`);
        const q = query(
          commentsRef,
          where("postId", "==", postId),
          where("parentId", "==", null),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const snapshot = await getDocs(q);

        // 각 댓글에 대한 작성자 정보 가져오기
        const commentsData = await Promise.all(
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

        setComments(commentsData);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 10);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId, collectionName]);

  const updateCommentCount = async (postId, increment = true) => {
    const postRef = doc(db, collectionName, postId);
    await updateDoc(postRef, {
      commentCount: increment(increment ? 1 : -1)
    });
  };
  
  // 댓글 작성
  const addComment = async (content, isPrivate = false) => {
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  
  // 댓글 권한 확인 강화
  const permission = await checkCommentPermission(currentUser.uid);
  if (!permission.allowed) {
    throw new Error(permission.message);
  }
  
  try {
    // 활동시간 업데이트
    if (updateLastActivity) {
      await updateLastActivity(currentUser.uid);
    }

    const batch = writeBatch(db);
    const commentsRef = collection(db, `${collectionName}_comments`);
    const newCommentRef = doc(commentsRef);

    const newComment = {
      postId,
      content,
      isPrivate,
      authorId: currentUser.uid,
      parentId: null,
      authorRole: currentUser.currentRole || currentUser.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      collectionName
    };
    
    batch.set(newCommentRef, newComment);

    const postRef = doc(db, collectionName, postId);
    batch.update(postRef, {
      commentCount: increment(1)
    });
  
    await batch.commit();
    const author = await fetchUserData(currentUser.uid);

    // 댓글 추가 후 바로 목록 업데이트
    setComments(prev => [{
      id: newCommentRef.id,
      ...newComment,
      author,
      createdAt: new Date(),
      updatedAt: new Date()
    }, ...prev]);

    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err);
      throw err;
    }
  };

  const addReply = async (parentId, content, parentIsPrivate) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    // 댓글 권한 확인 강화
    const permission = await checkCommentPermission(currentUser.uid);
    if (!permission.allowed) {
      throw new Error(permission.message);
    }
    
    try {
      // 활동시간 업데이트
      if (updateLastActivity) {
        await updateLastActivity(currentUser.uid);
      }

      const batch = writeBatch(db);

      const commentsRef = collection(db, `${collectionName}_comments`);
      const newReplyRef = doc(commentsRef);
      const newReply = {
        postId,
        content,
        isPrivate: parentIsPrivate,
        authorId: currentUser.uid,
        parentId,
        authorRole: currentUser.currentRole || currentUser.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        collectionName
      };

      batch.set(newReplyRef, newReply);
    
      const postRef = doc(db, collectionName, postId);
      batch.update(postRef, {
        commentCount: increment(1)
      });
      
      await batch.commit();

      try {
        const sendCommentNotification = httpsCallable(functions, 'sendCommentNotification');
        const result = await sendCommentNotification({
          commentId: newReplyRef.id,
          postId,
          collectionName
        });
      } catch (error) {
        console.error('Error triggering notification:', error);
      }
    } catch (err) {
      console.error("Error adding reply:", err);
      setError(err);
      throw err;
    }
  };

  const deleteComment = async (commentId) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    try {
      // 활동시간 업데이트
      if (updateLastActivity) {
        await updateLastActivity(currentUser.uid);
      }

      const commentsRef = collection(db, `${collectionName}_comments`);
      const batch = writeBatch(db);
      
      // 댓글 정보 먼저 가져오기
      const commentRef = doc(db, `${collectionName}_comments`, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error("댓글을 찾을 수 없습니다.");
      }
      
      const commentData = commentSnap.data();
      const isReply = commentData.parentId !== null;
      
      if (isReply) {
        // 답글인 경우 해당 답글만 삭제
        batch.delete(commentRef);
        
        // 게시물 댓글 카운트 감소
        const postRef = doc(db, collectionName, postId);
        batch.update(postRef, {
          commentCount: increment(-1)
        });
        
        await batch.commit();
        
        // 상태 업데이트는 useReplies에서 처리되므로 여기서는 생략
      } else {
        // 부모 댓글인 경우 기존 로직대로 처리
        const repliesQuery = query(
          commentsRef,
          where("parentId", "==", commentId)
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        
        const replyCount = repliesSnapshot.docs.length;
  
        repliesSnapshot.docs.forEach(replyDoc => {
          batch.delete(doc(db, `${collectionName}_comments`, replyDoc.id));
        });
        
        // 원본 댓글 삭제
        batch.delete(commentRef);
  
        const postRef = doc(db, collectionName, postId);
        batch.update(postRef, {
          commentCount: increment(-(1 + replyCount))
        });
        
        await batch.commit();
  
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(err);
      throw err;
    }
  };
  
  // 수정된 답글 편집 함수
  const editComment = async (commentId, newContent) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    try {
      // 활동시간 업데이트
      if (updateLastActivity) {
        await updateLastActivity(currentUser.uid);
      }

      const commentRef = doc(db, `${collectionName}_comments`, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error("댓글을 찾을 수 없습니다.");
      }
      
      await updateDoc(commentRef, {
        content: newContent,
        updatedAt: serverTimestamp()
      });
  
      // UI 상태 업데이트
      const commentData = commentSnap.data();
      const isReply = commentData.parentId !== null;
      
      if (!isReply) {
        // 일반 댓글인 경우 기존 상태 업데이트 로직 사용
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: newContent, updatedAt: new Date() }
            : comment
        ));
      }
      // 답글인 경우는 useReplies에서 상태를 관리하므로 여기서는 별도 처리가 필요하지 않음
    } catch (err) {
      console.error("Error editing comment:", err);
      setError(err);
      throw err;
    }
  };

  // 댓글 더보기
  const loadMoreComments = async () => {
    if (!lastDoc || !hasMore) return;

    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      const q = query(
        commentsRef,
        where("postId", "==", postId),
        where("parentId", "==", null),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      
      // 각 댓글에 대한 작성자 정보 가져오기
      const newComments = await Promise.all(
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

      setComments(prev => [...prev, ...newComments]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error("Error loading more comments:", err);
      setError(err);
    }
  };

  return {
    comments,
    loading,
    error,
    hasMore,
    loadMoreComments,
    addComment,
    addReply,
    editComment,
    deleteComment
  };
};

export default commentsHook;