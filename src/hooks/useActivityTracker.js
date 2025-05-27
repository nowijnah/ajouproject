// src/hooks/useActivityTracker.js - 사용자 활동 추적 훅

import { useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';

const useActivityTracker = () => {
  const { currentUser, updateLastActivity } = useAuth();

  const trackActivity = async () => {
    if (currentUser && updateLastActivity) {
      await updateLastActivity(currentUser.uid);
    }
  };

  // 페이지 로드 시 활동 추적
  useEffect(() => {
    trackActivity();
  }, []);

  // 사용자 상호작용 시 활동 추적
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      trackActivity();
    };

    // 다양한 사용자 활동 이벤트 리스너 추가
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let lastActivityTime = Date.now();

    const throttledActivity = () => {
      const now = Date.now();
      // 5분마다 한 번만 업데이트 (너무 자주 업데이트되는 것을 방지)
      if (now - lastActivityTime > 5 * 60 * 1000) {
        lastActivityTime = now;
        handleUserActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    // 페이지 언로드 시 마지막 활동 시간 업데이트
    const handleBeforeUnload = () => {
      trackActivity();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  return trackActivity;
};

export default useActivityTracker;