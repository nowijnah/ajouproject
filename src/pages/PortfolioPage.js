import React from 'react';
import ContentList from '../components/common/ContentList';
import { filters } from '../components/common/ContentList';

const SAMPLE_PORTFOLIOS = [
  {
    id: 1,
    title: "에코잉",
    description: "한지원",
    image: "/ecoing.png",
  },
  {
    id: 2,
    title: "2024-1 파란학기",
    description: "강수빈",
    image: "/dog.png",
  },
  // ... 기존 포트폴리오 데이터
];

const portfolioFilters = [
  { semester: '2024-2' },
  { semester: '2024-1' },
  { semester: '2023-2' },
  { semester: '2023-1' }
];

export default function PortfolioPage() {
  return (
    <ContentList 
      type="portfolio"
      data={SAMPLE_PORTFOLIOS}
      filters={filters}
    />
  );
} 