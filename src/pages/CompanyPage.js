import React from 'react';
import ContentList from '../components/common/ContentList';
import { filters } from '../components/common/ContentList';

const companyData = [
  {
    id: 1,
    title: "뱅크 샐러드",
    description: "테크",
    image: "/logo.png",
  },
  {
    id: 2,
    title: "토스",
    description: "소프트스킬",
    image: "/dnag.png",
  },
  // ... 기존 포트폴리오 데이터
];

export default function CompanyPage() {
  return (
    <ContentList 
      type="company"
      data={companyData}
      filters={filters}
    />
  );
} 