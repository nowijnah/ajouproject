import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase 함수 참조
const functions = getFunctions();
const getProjectLinksFunc = httpsCallable(functions, 'getProjectLinks');
const getProjectDetailsFunc = httpsCallable(functions, 'getProjectDetails');
const getMultipleProjectDetailsFunc = httpsCallable(functions, 'getMultipleProjectDetails');

// Firestore 참조
const db = getFirestore();

const SoftconCrawler = () => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('S');
  const [listType, setListType] = useState('current');
  const [term, setTerm] = useState('2024-1');
  const [maxProjects, setMaxProjects] = useState(50);
  const [projectLinks, setProjectLinks] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [savingToFirestore, setSavingToFirestore] = useState(false);

  /**
   * 크롤링 실행 핸들러
   */
  const handleStartCrawling = async () => {
    try {
      setError(null);
      setLoading(true);
      setCompleted(false);
      setProjectLinks([]);
      setProjectDetails([]);
      setProgress({ current: 0, total: 0 });
      
      // 1. 프로젝트 링크 가져오기 (Firebase Function 호출)
      const linksResponse = await getProjectLinksFunc({
        listType,
        category,
        term: listType === 'previous' ? term : null
      });
      
      const links = linksResponse.data.projects || [];
      setProjectLinks(links);
      
      if (!links || links.length === 0) {
        setError("프로젝트 링크를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }
      
      // 2. 상세 정보 가져오기 (최대 갯수 제한)
      const limitedProjects = links.slice(0, Math.min(links.length, maxProjects));
      setProgress({ current: 0, total: limitedProjects.length });
      
      // Firebase의 타임아웃 제한 때문에 한 번에 많은 프로젝트를 처리할 때는
      // getMultipleProjectDetails 함수를 사용하는 것이 좋습니다.
      if (limitedProjects.length > 10) {
        // 다중 프로젝트 정보 가져오기 (URLs 배열로 한번에 처리)
        const projectUrls = limitedProjects.map(project => project.url);
        
        const detailsResponse = await getMultipleProjectDetailsFunc({
          projectUrls,
          delayMs: 1000 // 1초 간격으로 요청
        });
        
        const details = detailsResponse.data.results || [];
        setProjectDetails(details);
      } else {
        // 프로젝트가 적은 경우 개별적으로 처리
        const details = [];
        for (let i = 0; i < limitedProjects.length; i++) {
          const detailResponse = await getProjectDetailsFunc({
            projectUrl: limitedProjects[i].url
          });
          
          details.push(detailResponse.data.details);
          setProgress({ current: i + 1, total: limitedProjects.length });
        }
        
        setProjectDetails(details);
      }
      
      setCompleted(true);
    } catch (error) {
      console.error('크롤링 오류:', error);
      setError(`크롤링 오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Firestore에 결과 저장
   */
  const saveToFirestore = async () => {
    if (!projectLinks.length || !projectDetails.length) {
      setError("저장할 데이터가 없습니다.");
      return;
    }
    
    try {
      setSavingToFirestore(true);
      
      // 링크 데이터 저장
      const linksRef = collection(db, 'projectLinks');
      await addDoc(linksRef, {
        timestamp: new Date(),
        category,
        listType,
        term: listType === 'previous' ? term : null,
        projects: projectLinks
      });
      
      // 상세 데이터 저장
      const detailsRef = collection(db, 'projectDetails');
      await addDoc(detailsRef, {
        timestamp: new Date(),
        category,
        listType,
        term: listType === 'previous' ? term : null,
        projects: projectDetails
      });
      
      alert('데이터가 Firestore에 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Firestore 저장 오류:', error);
      setError(`Firestore 저장 오류: ${error.message}`);
    } finally {
      setSavingToFirestore(false);
    }
  };

  /**
   * 결과 JSON 다운로드 핸들러
   */
  const handleDownloadResults = (type) => {
    const data = type === 'links' ? projectLinks : projectDetails;
    const filename = type === 'links' ? 'project_links.json' : 'project_details.json';
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">소프트콘 작품 크롤러</h1>
      
      {/* 크롤링 설정 영역 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold mb-4">크롤링 설정</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 목록 유형 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1">목록 유형</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="listType"
                  value="current"
                  checked={listType === 'current'}
                  onChange={() => setListType('current')}
                  disabled={loading}
                />
                <span className="ml-2">현재 작품 목록</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="listType"
                  value="previous"
                  checked={listType === 'previous'}
                  onChange={() => setListType('previous')}
                  disabled={loading}
                />
                <span className="ml-2">이전 작품 목록</span>
              </label>
            </div>
          </div>
          
          {/* 카테고리 선택 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">카테고리</label>
            <select
              id="category"
              className="w-full px-3 py-2 border rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="S">소프트웨어(S)</option>
              <option value="D">디지털미디어(D)</option>
              <option value="C">사이버보안(C)</option>
              <option value="I">인공지능융합(I)</option>
            </select>
          </div>
          
          {/* 이전 작품일 경우 학기 선택 */}
          {listType === 'previous' && (
            <div>
              <label htmlFor="term" className="block text-sm font-medium mb-1">학기 (예: 2024-1)</label>
              <input
                type="text"
                id="term"
                className="w-full px-3 py-2 border rounded-md"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="2024-1"
                disabled={loading}
              />
            </div>
          )}
          
          {/* 최대 프로젝트 수 */}
          <div>
            <label htmlFor="maxProjects" className="block text-sm font-medium mb-1">최대 프로젝트 수</label>
            <input
              type="number"
              id="maxProjects"
              className="w-full px-3 py-2 border rounded-md"
              value={maxProjects}
              onChange={(e) => setMaxProjects(parseInt(e.target.value))}
              min="1"
              max="200"
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={handleStartCrawling}
          disabled={loading}
        >
          {loading ? '크롤링 중...' : '크롤링 시작'}
        </button>
      </div>
      
      {/* 진행 상황 */}
      {loading && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">진행 상황</h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2 text-center">
            {progress.current}/{progress.total} 프로젝트 처리 완료
          </p>
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* 결과 영역 */}
      {completed && (
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">크롤링 완료!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-md border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">링크 데이터</h3>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                  onClick={() => handleDownloadResults('links')}
                >
                  다운로드
                </button>
              </div>
              <p>{projectLinks.length}개의 프로젝트 링크를 찾았습니다.</p>
            </div>
            
            <div className="bg-white p-4 rounded-md border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">상세 데이터</h3>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                  onClick={() => handleDownloadResults('details')}
                >
                  다운로드
                </button>
              </div>
              <p>{projectDetails.length}개의 프로젝트 상세 정보를 가져왔습니다.</p>
            </div>
          </div>
          
          {/* Firestore 저장 버튼 */}
          <button
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${savingToFirestore ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            onClick={saveToFirestore}
            disabled={savingToFirestore}
          >
            {savingToFirestore ? '저장 중...' : 'Firestore에 결과 저장'}
          </button>
        </div>
      )}
      
      {/* 프로젝트 링크 미리보기 */}
      {projectLinks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">프로젝트 링크 미리보기</h2>
          <div className="bg-white border rounded-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">제목</th>
                  <th className="px-4 py-2 text-left">UID</th>
                  <th className="px-4 py-2 text-left">학기</th>
                </tr>
              </thead>
              <tbody>
                {projectLinks.slice(0, 5).map((project, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{project.title}</td>
                    <td className="px-4 py-2">{project.uid}</td>
                    <td className="px-4 py-2">{project.term || '-'}</td>
                  </tr>
                ))}
                {projectLinks.length > 5 && (
                  <tr className="border-t">
                    <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                      ... 외 {projectLinks.length - 5}개
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 프로젝트 상세 정보 미리보기 */}
      {projectDetails.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 상세 정보 미리보기</h2>
          <div className="space-y-4">
            {projectDetails.slice(0, 3).map((project, index) => (
              <div key={index} className="bg-white p-4 border rounded-md">
                <h3 className="font-medium text-lg mb-2">{project.title || '제목 없음'}</h3>
                {project.error ? (
                  <p className="text-red-600">오류: {project.error}</p>
                ) : (
                  <div>
                    {project.representativeImage && (
                      <img
                        src={project.representativeImage}
                        alt={project.title}
                        className="w-full h-40 object-cover mb-3 rounded"
                      />
                    )}
                    <p className="mb-2 text-sm">{project.summary?.substring(0, 150)}...</p>
                    <div className="text-sm text-gray-600">
                      <p>UID: {project.uid}</p>
                      {project.gitRepository && (
                        <p>Git 저장소: {project.gitRepository}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {projectDetails.length > 3 && (
              <p className="text-center text-gray-500">
                ... 외 {projectDetails.length - 3}개
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftconCrawler;