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
import { db } from '../firebase';
import { useAuth } from '../components/auth/AuthContext';

const commentsHook = (postId, collectionName) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [lastDoc, setLastDoc] = useState(null);  
  const [hasMore, setHasMore] = useState(true); 

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
    
    try {
      const batch = writeBatch(db);
      const commentsRef = collection(db, `${collectionName}_comments`);
      const newCommentRef = doc(commentsRef);

      const newComment = {
        postId,
        content,
        isPrivate,
        authorId: currentUser.uid,
        parentId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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

  // 답글 작성
  const addReply = async (parentId, content, parentIsPrivate) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    try {
      const batch = writeBatch(db);

      const commentsRef = collection(db, `${collectionName}_comments`);
      const newReplyRef = doc(commentsRef);
      const newReply = {
        postId,
        content,
        isPrivate: parentIsPrivate,
        authorId: currentUser.uid,
        parentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(newReplyRef, newReply);
    
      const postRef = doc(db, collectionName, postId);
      batch.update(postRef, {
        commentCount: increment(1)
      });
      
      await batch.commit();
    } catch (err) {
      console.error("Error adding reply:", err);
      setError(err);
      throw err;
    }
  };

  // 댓글 수정
  const editComment = async (commentId, newContent) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    try {
      const commentRef = doc(db, `${collectionName}_comments`, commentId);
      await updateDoc(commentRef, {
        content: newContent,
        updatedAt: serverTimestamp()
      });

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent, updatedAt: new Date() }
          : comment
      ));
    } catch (err) {
      console.error("Error editing comment:", err);
      setError(err);
      throw err;
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    
    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      const batch = writeBatch(db);
      
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
      batch.delete(doc(db, `${collectionName}_comments`, commentId));

      const postRef = doc(db, collectionName, postId);
      batch.update(postRef, {
        commentCount: increment(-(1 + replyCount))
      });
      
      await batch.commit();

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
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