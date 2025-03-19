// PortfolioPage.js
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ContentList from '../../components/card/ContentList';
import AnimatedLoading from '../../components/common/AnimatedLoading';

export default function PortfolioPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFirestoreData = async (collectionName) => {
    try {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Firestore에서 ${collectionName} 가져오기 완료:`, data);
      return data;
    } catch (error) {
      console.error(`Firestore에서 ${collectionName} 데이터 가져오기 오류:`, error);
      return [];
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const portfolioData = await fetchFirestoreData('portfolios');  // 기존 포트폴리오
      const softconProjects = await fetchFirestoreData('softcon_projects');  // Softcon 데이터

      setPosts([...portfolioData, ...softconProjects]); // 합쳐서 상태 업데이트
      setLoading(false);
    };

    loadData();
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