import React from 'react';
import ContentList from '../components/common/ContentList';
import { filters } from '../components/common/ContentList';

const labData = [
  {
    id: 1,
    title: "AIMS 서비스 개발 진행중",
    description: "최재영교수님",
    image: "/aims.png",
  },
];

export default function LabPage() {
  return (
    <ContentList 
      type="lab"
      data={labData}
      filters={filters}
    />
  );
} 