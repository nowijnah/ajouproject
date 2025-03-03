import React from 'react';
import AnimatedLoading from './AnimatedLoading';
import LoadingSpinner from './LoadingSpinner';

/**
 * 페이지 로딩 컴포넌트
 * @param {Object} props
 * @param {string} props.type - 로딩 타입 ('animated', 'spinner')
 * @param {string} props.message - 로딩 메시지
 * @param {boolean} props.fullPage - 전체 페이지를 덮을지 여부
 */
const PageLoading = ({ 
  type = 'animated', 
  message,
  fullPage = false
}) => {
  // 로딩 타입에 따라 다른 컴포넌트 반환
  switch (type) {
    case 'spinner':
      return <LoadingSpinner message={message} />;
    case 'animated':
    default:
      return <AnimatedLoading message={message} fullPage={fullPage} />;
  }
};

export default PageLoading;