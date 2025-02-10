import React from 'react';
import ContentList from '../components/common/ContentList';
import { filters } from '../components/common/ContentList';

const companyData = [
  {
    id: 1,
    title: "테크스펙은 문서가 아니다",
    description: "banksalad",
    image: "/techspec.png",
  },
  {
    id: 2,
    title: "시니어 사용자가 어려워하는 UX 5가지",
    description: "toss",
    image: "/toss.png",
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