import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Box, Typography } from '@mui/material';
import ContentList from '../../components/card/ContentList';
import AnimatedLoading from '../../components/common/AnimatedLoading';

export default function LabPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'labs');
        const q = query(
          postsRef, 
          where('isPublic', '==', true),
        );
        const querySnapshot = await getDocs(q);
        
        const postsWithAuthors = await Promise.all(
          querySnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            let authorName = '알 수 없음';
            
            if (postData.authorId) {
              const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
              if (authorDoc.exists()) {
                authorName = authorDoc.data().displayName || '알 수 없음';
              }
            }

            const createdAt = postData.createdAt?.toDate?.() || new Date(postData.createdAt) || new Date();

            return {
              id: postDoc.id,
              title: postData.title || '',
              subtitle: postData.subtitle,
              description: `${authorName} 교수님`,
              image: postData.thumbnail || '',
              content: postData.content || '',
              authorId: postData.authorId || '',
              createdAt: postData.createdAt,
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
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <AnimatedLoading message="연구실 정보를 불러오는 중입니다" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          데이터를 불러오는 중 오류가 발생했습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <ContentList 
      type="lab"
      data={posts}
    />
  );
}