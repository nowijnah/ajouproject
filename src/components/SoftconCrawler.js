// 클라이언트 측 코드 (SoftconCrawlerPage.js)
import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

// 카테고리 데이터 하드코딩
const TERMS = [
  "2020-1", "2020-2",
  "2021-1", "2021-2",
  "2022-1", "2022-2",
  "2023-1", "2023-2",
  "2024-1", "2024-2"
];

const CATEGORIES = ["S", "D", "I", "R", "M", "P"];

const SoftconCrawler = () => {
  // 기본값 설정 (가장 최근 학기와 첫 번째 카테고리)
  const [selectedTerm, setSelectedTerm] = useState(TERMS[TERMS.length - 1]); // 2024-1
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]); // S
  const [logMessages, setLogMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Firebase 함수 인스턴스 가져오기
  const functions = getFunctions();
  
  // 초기화 메시지
  useEffect(() => {
    const initMessage = "크롤링 도구가 준비되었습니다. 학기와 카테고리를 선택하고 크롤링을 시작하세요.";
    setLogMessages([initMessage]);
    console.log("초기화 완료", { TERMS, CATEGORIES });
  }, []);

  // 카테고리 표시명 함수
  const getCategoryName = (code) => {
    const categoryMap = {
      'S': '소프트웨어',
      'D': '사이버보안',
      'I': 'AI융합',
      'R': '미디어',
      'M': '자기주도연구',
      'P': '자기주도 프로젝트'
    };
    return categoryMap[code] || code;
  };

  const handleCrawl = async () => {
    // 다시 값 체크
    if (!selectedTerm || !selectedCategory) {
      alert('학기와 카테고리를 선택해주세요.');
      return;
    }

    // 선택된 값 로깅 (디버깅용)
    console.log("크롤링 시작:", {
      term: selectedTerm,
      category: selectedCategory
    });

    setLogMessages(prev => [...prev, `크롤링 시작: ${selectedTerm} / ${getCategoryName(selectedCategory)}`]);
    setLoading(true);

    try {
      // 직접 HTTP 요청으로 테스트 (Firebase Functions 문제 확인용)
      setLogMessages(prev => [...prev, `직접 HTTP 요청 테스트 중 (디버깅용)...`]);
      
      // Firebase 함수 참조
      const crawlSoftconData = httpsCallable(functions, 'crawlSoftconData');
      
      // 파라미터 객체 (단순화된 형태로 전달)
      const requestData = {
        term: String(selectedTerm), 
        category: String(selectedCategory)
      };
      
      setLogMessages(prev => [...prev, `파라미터: ${JSON.stringify(requestData)}`]);
      
      // Firebase 함수 호출
      const result = await crawlSoftconData(requestData);
      
      // 응답 로깅
      console.log("크롤링 응답:", result.data);
      
      // 로그 메시지 처리
      if (result.data && result.data.logs && Array.isArray(result.data.logs)) {
        setLogMessages(prev => [...prev, ...result.data.logs]);
      }
      
      // 결과 요약 로깅
      if (result.data && result.data.success) {
        setLogMessages(prev => [
          ...prev, 
          `크롤링 완료: ${result.data.count}개 데이터 처리됨${
            result.data.skipped ? `, ${result.data.skipped}개 스킵됨` : ''
          }${
            result.data.errors ? `, ${result.data.errors}개 오류` : ''
          }`
        ]);
      } else {
        setLogMessages(prev => [
          ...prev, 
          `크롤링 실패: ${result.data?.error || '알 수 없는 오류'}`
        ]);
      }
    } catch (error) {
      console.error('크롤링 중 오류:', error);
      
      // Firebase callable 함수의 오류 세부 정보 추출
      const errorMessage = error.message || '알 수 없는 오류';
      const errorDetails = error.details ? 
        (typeof error.details === 'string' ? error.details : JSON.stringify(error.details)) : '';
      
      setLogMessages(prev => [
        ...prev, 
        `오류 발생: ${errorMessage}`,
        errorDetails ? `상세 오류: ${errorDetails}` : ''
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">소프트콘 작품 크롤링</h1>

      <div className="mb-4">
        <label className="mr-2 font-medium">학기</label>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {TERMS.map((term) => (
            <option key={term} value={term}>{term}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mr-2 font-medium">카테고리</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {getCategoryName(category)}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCrawl}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '크롤링 중...' : '크롤링 시작'}
      </button>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">크롤링 로그</h2>
        <pre className="bg-gray-100 p-3 rounded h-80 overflow-auto whitespace-pre-wrap text-sm">
          {logMessages.length > 0 ? logMessages.join('\n') : '아직 로그가 없습니다.'}
        </pre>
      </div>
    </div>
  );
};

export default SoftconCrawler;