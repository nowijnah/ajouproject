import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ContentList from '../../components/common/ContentList';
import { filters } from '../../components/common/ContentList';
import ContentCard from '../../components/common/ContentCard';

export default function CompanyPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'companies');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
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

            return {
              id: postDoc.id,
              title: postData.title,
              description: authorName,
              image: postData.thumbnail || '',
              content: postData.content,
              authorId: postData.authorId,
              createdAt: postData.createdAt,
              likeCount: postData.likeCount || 0,
              commentCount: postData.commentCount || 0,
              files: postData.files || [],
              links: postData.links || []
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

  const renderCard = (post) => (
    <ContentCard
      id={post.id}
      title={post.title}
      description={post.description}
      image={post.image}
      likeCount={post.likeCount}
      commentCount={post.commentCount}
      collectionName="companies"
      type="company"
    />
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ContentList 
      type="company"
      data={posts}
      filters={filters}
      renderCard={renderCard}
    />
  );
}