// config/constants.js
// 학기 상수
exports.TERMS = [
    "2020-1", "2020-2",
    "2021-1", "2021-2",
    "2022-1", "2022-2",
    "2023-1", "2023-2",
    "2024-1", "2024-2"
  ];
  
  // 카테고리 상수
  exports.CATEGORIES = ["ALL", "S", "D", "I", "R", "M", "P"];
  
  // 카테고리 이름 매핑
  exports.CATEGORY_NAMES = {
    'ALL': '전체',
    'S': '소프트웨어',
    'D': '사이버보안',
    'I': 'AI융합',
    'R': '미디어',
    'M': '자기주도연구',
    'P': '자기주도 프로젝트'
  };
  
  // URL 설정
  exports.SOFTCON_URLS = {
    baseListUrl: "https://softcon.ajou.ac.kr/works/works_list_prev.asp",
    baseDetailUrl: "https://softcon.ajou.ac.kr/works/works_prev.asp",
    currentTermListUrl: "https://softcon.ajou.ac.kr/works/works_list.asp",
    currentTermDetailUrl: "https://softcon.ajou.ac.kr/works/works.asp"
  };
  
  // Axios 설정
  exports.AXIOS_CONFIG = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://softcon.ajou.ac.kr/'
    },
    timeout: 30000
  };