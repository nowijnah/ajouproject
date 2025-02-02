import React from 'react';
import ContentList from '../components/common/ContentList';
import { filters } from '../components/common/ContentList';

const labData = [
  {
    id: 1,
    title: "인공지능 연구실",
    description: "딥러닝, 머신러닝 연구",
    image: "/ai-lab.png",
  },
  {
    id: 2,
    title: "빅데이터 연구실",
    description: "데이터 분석 및 처리",
    image: "/bigdata-lab.png",
  },
  // ... 기존 연구실 데이터
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