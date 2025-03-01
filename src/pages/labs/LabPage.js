import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ContentList from '../../components/card/ContentList';

export default function LabPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 1. 연구실 데이터 가져오기
        const postsRef = collection(db, 'labs');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // 2. 각 연구실의 교수 정보 가져오기
        const postsWithAuthors = await Promise.all(
          querySnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            let authorName = '알 수 없음';
            
            // 작성자(교수) 정보 가져오기
            if (postData.authorId) {
              const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
              if (authorDoc.exists()) {
                authorName = authorDoc.data().displayName || '알 수 없음';
              }
            }

            // createdAt 처리
            const createdAt = postData.createdAt?.toDate?.() || new Date(postData.createdAt) || new Date();

            return {
              id: postDoc.id,
              title: postData.title || '',
              subtitle: postData.subtitle,
              description: `${authorName} 교수님`,
              image: postData.thumbnail || '',
              content: postData.content || '',
              authorId: postData.authorId || '',
              createdAt, // Timestamp를 Date 객체로 변환
              likeCount: postData.likeCount || 0,
              commentCount: postData.commentCount || 0,
              files: postData.files || [],
              links: postData.links || [],
              techStack: postData.techStack || [],
              researchAreas: postData.researchAreas || [],
              keywords: postData.keywords || []
            };
          })
        );

        setPosts(postsWithAuthors);
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ContentList 
      type="lab"
      data={posts}
    />
  );
}