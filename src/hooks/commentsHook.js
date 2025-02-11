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
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/auth/AuthContext';

const commentsHook = (postId, collectionName) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // 댓글 실시간 업데이트
  useEffect(() => {
    if (!postId || !collectionName) return;

    const commentsRef = collection(db, `${collectionName}_comments`);
    const q = query(
      commentsRef,
      where("postId", "==", postId),
      orderBy("timestamp", "desc")
      ,limit(10)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching comments:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId, collectionName]);

  const addComment = async (content) => {
    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      await addDoc(commentsRef, {
        postId,
        content,
        author: {
          id: currentUser.uid,
          name: currentUser.displayName || '익명',
          photoURL: currentUser.photoURL
        },
        timestamp: serverTimestamp(),
        parentId: null
      });
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const addReply = async (parentId, content) => {
    try {
      const commentsRef = collection(db, `${collectionName}_comments`);
      await addDoc(commentsRef, {
        postId,
        content,
        author: {
          id: currentUser.uid,
          name: currentUser.displayName || '익명',
          photoURL: currentUser.photoURL
        },
        timestamp: serverTimestamp(),
        parentId
      });
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const editComment = async (commentId, newContent) => {
    try {
      const commentRef = doc(db, `${collectionName}_comments`, commentId);
      await updateDoc(commentRef, {
        content: newContent,
        editedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, `${collectionName}_comments`, commentId);
      await deleteDoc(commentRef);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    addReply,
    editComment,
    deleteComment
  };
};

export default commentsHook;