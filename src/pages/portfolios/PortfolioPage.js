// PortfolioPage.js
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ContentList from '../../components/card/ContentList';
import AnimatedLoading from '../../components/common/AnimatedLoading';

export default function PortfolioPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 1. 게시글 데이터 가져오기
        const postsRef = collection(db, 'portfolios');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // 2. 각 게시글의 작성자 정보 가져오기
        const postsWithAuthors = await Promise.all(
          querySnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            let authorName = '알 수 없음';
            
            // 작성자 정보 가져오기
            if (postData.authorId) {
              const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
              if (authorDoc.exists()) {
                authorName = authorDoc.data().displayName || '알 수 없음';
              }
            }

            return {
              id: postDoc.id,
              title: postData.title,
              subtitle: postData.subtitle,
              description: authorName, // 부제목 대신 작성자 이름 표시
              image: postData.thumbnail || '',
              content: postData.content,
              authorId: postData.authorId,
              createdAt: postData.createdAt,
              likeCount: postData.likeCount,
              commentCount: postData.commentCount,
              files: postData.files || [],
              links: postData.links || [],
              keywords: postData.keywords || []
            };
          })
        );

        setPosts(postsWithAuthors);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <AnimatedLoading message="포트폴리오를 불러오는 중입니다" />;
  }

  return (
    <ContentList 
      type="portfolio"
      data={posts}
    />
  );
}