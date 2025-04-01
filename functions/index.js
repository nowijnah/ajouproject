// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

const TERMS = [
  "2020-1", "2020-2",
  "2021-1", "2021-2",
  "2022-1", "2022-2",
  "2023-1", "2023-2",
  "2024-1", "2024-2"
];

const CATEGORIES = ["S", "D", "I", "R", "M", "P"];

// CORS를 적용한 HTTP 함수 - 앱에서는 사용하지 않음
exports.getSoftconTerms = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      terms: TERMS,
      categories: CATEGORIES
    });
  });
});

// 크롤링 함수 (Firebase Callable Function)
exports.crawlSoftconData = functions.https.onCall(async (data, context) => {
  // 로그 배열 초기화
  const logs = [];
  const addLog = (message) => {
    console.log(message);
    logs.push(message);
  };

  try {
    // 디버깅을 위한 로그 추가
    console.log("함수 호출됨");
    console.log("데이터 타입:", typeof data);
    console.log("데이터 값:", data);
    
    if (data === null || data === undefined) {
      addLog("데이터가 null 또는 undefined입니다.");
      throw new functions.https.HttpsError(
        'invalid-argument',
        '유효한 데이터가 전달되지 않았습니다.'
      );
    }
    
    // 데이터가 문자열이면 JSON으로 파싱 시도
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        addLog("문자열 데이터를 JSON으로 파싱했습니다.");
      } catch (e) {
        addLog(`JSON 파싱 실패: ${e.message}`);
      }
    }
    
    // 모든 데이터 키 출력
    if (typeof parsedData === 'object' && parsedData !== null) {
      addLog(`데이터 키: ${Object.keys(parsedData).join(', ')}`);
    }
    
    // term과 category 값 추출 시도
    const term = parsedData?.term || 
                parsedData?.data?.term || 
                parsedData?.params?.term || 
                '';
                
    const category = parsedData?.category || 
                    parsedData?.data?.category || 
                    parsedData?.params?.category || 
                    '';
    
    addLog(`추출된 term: ${term}, category: ${category}`);
    
    // 값 검증
    if (!term || !category) {
      addLog(`필수 파라미터 누락. term: ${term}, category: ${category}`);
      throw new functions.https.HttpsError(
        'invalid-argument',
        '학기와 카테고리 정보가 필요합니다.'
      );
    }

    addLog(`크롤링 시작: 학기=${term}, 카테고리=${category}`);

    // URL 설정
    const baseListUrl = "https://softcon.ajou.ac.kr/works/works_list_prev.asp";
    const baseDetailUrl = "https://softcon.ajou.ac.kr/works/works_prev.asp";
    
    // 최신 학기인 2024-2는 다른 URL 사용 (HTML 분석 기준)
    const isCurrentTerm = term === "2024-2";
    const currentTermListUrl = "https://softcon.ajou.ac.kr/works/works_list.asp";
    const currentTermDetailUrl = "https://softcon.ajou.ac.kr/works/works.asp";
    
    const listUrl = isCurrentTerm ? currentTermListUrl : baseListUrl;
    const detailUrl = isCurrentTerm ? currentTermDetailUrl : baseDetailUrl;

    // HTTP 요청 헤더 추가
    const axiosConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://softcon.ajou.ac.kr/'
      },
      timeout: 30000 // 30초 타임아웃 설정
    };

    // HTML 페이지 가져오기
    const getHtml = async (url) => {
      try {
        addLog(`URL 요청: ${url}`);
        const response = await axios.get(url, axiosConfig);
        return cheerio.load(response.data);
      } catch (error) {
        addLog(`URL 요청 실패: ${url}, 오류: ${error.message}`);
        throw new Error(`URL 요청 실패: ${error.message}`);
      }
    };

    // 프로젝트 목록 페이지에서 모든 UID 추출
    const getAllProjectIds = async () => {
      // 쿼리 매개변수 설정
      let url;
      if (isCurrentTerm) {
        url = `${listUrl}?category=${category}`;
      } else {
        url = `${listUrl}?category=${category}&wTerm=${term}`;
      }
      
      addLog(`프로젝트 목록 URL: ${url}`);
      
      // HTML 가져오기
      const $ = await getHtml(url);
      const uids = [];
      
      // 모달 링크에서 UID 추출 (HTML 구조 기반)
      $(".modal > div > a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        
        // UID와 wTerm 매개변수 추출
        const uidMatch = href.match(/uid=(\d+)/);
        if (uidMatch) {
          uids.push(uidMatch[1]);
        }
      });
      
      // UID를 찾지 못한 경우 다른 방법 시도
      if (uids.length === 0) {
        addLog("첫 번째 방법으로 UID를 찾지 못해 모든 링크 검색");
        $("a").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          
          const uidMatch = href.match(/uid=(\d+)/);
          if (uidMatch) {
            uids.push(uidMatch[1]);
          }
        });
      }
      
      // 중복 제거 및 로그
      const uniqueUids = [...new Set(uids)];
      addLog(`총 ${uniqueUids.length}개의 프로젝트 ID를 찾았습니다.`);
      
      if (uniqueUids.length === 0) {
        addLog("프로젝트 ID를 찾을 수 없습니다. HTML 구조를 확인하세요.");
      }
      
      return uniqueUids;
    };

    // 프로젝트 상세 페이지에서 데이터 추출
    const getDetailData = async (uid) => {
      // 쿼리 매개변수 설정
      let url;
      if (isCurrentTerm) {
        url = `${detailUrl}?uid=${uid}`;
      } else {
        url = `${detailUrl}?uid=${uid}&wTerm=${term}`;
      }
      
      addLog(`프로젝트 상세 URL: ${url}`);
      
      // HTML 가져오기
      const $ = await getHtml(url);

      // 프로젝트 제목
      let title = $(".dw_title p").text().trim();
      if (!title) {
        title = $("h1, h2, .title").first().text().trim();
      }
      
      // 프로젝트 설명
      let description = $(".work_detail > div:last-child").text().trim();
      if (!description) {
        description = $(".work_detail, .detail, .content").text().trim();
      }
      
      // 영상 링크
      const videoLink = $(".countsort iframe").attr("src") || "";

      const pdfLink = $("#pdfArea").attr("src") || "";

      // 팀원 정보
      const teamWrap = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("팀원");
      });
      const team = [];

      teamWrap.find("ul").each((i, el) => {
        const role = $(el).find("li").eq(0).text().replace(/\s/g, "");
        const name = $(el).find("li").eq(1).text().trim();
        const major = $(el).find("li").eq(2).text().trim();
        const grade = $(el).find("li").eq(3).text().trim();
        const email = $(el).find("li").eq(4).text().trim();

        team.push({ role, name, major, grade, email });
      });
      
      // 썸네일 이미지 URL
      let thumbnailUrl = "";
      try {
        const imgEl = $(".work_detail img, .detail img").first();
        if (imgEl.length > 0) {
          thumbnailUrl = imgEl.attr("src") || "";
          // 상대 경로를 절대 경로로 변환
          if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
            thumbnailUrl = `https://softcon.ajou.ac.kr${thumbnailUrl.startsWith('/') ? '' : '/'}${thumbnailUrl}`;
          }
        }
      } catch (error) {
        addLog(`썸네일 추출 실패 (uid: ${uid}): ${error.message}`);
      }

      const githubLink = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("git");
      }).find("a").attr("href") || "";

      
      // 결과 데이터 객체
      const data = {
        uid,
        authorId: "admin",
        title: title || `프로젝트 ${uid}`,
        content: description || "",
        team,
        keywords: category ? [category] : [],
        thumbnailUrl,
        files: pdfLink ? [{ name: "발표자료", url: pdfLink }] : [],
        links: [
          videoLink ? {
            linkId: `video-${uid}`,
            title: "시연 영상",
            type: "VIDEO",
            url: videoLink,
            subtitle: ""
          } : null,
          githubLink ? {
            linkId: `github-${uid}`,
            title: "GitHub 저장소",
            type: "WEBSITE",
            url: githubLink,
            subtitle: ""
          } : null
        ].filter(Boolean),
        likeCount: 0,
        commentCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      return data;
    };

    // 메인 크롤링 프로세스
    const uids = await getAllProjectIds();
    
    // UID가 없으면 오류 반환
    if (uids.length === 0) {
      throw new Error(`프로젝트 ID를 찾을 수 없습니다. 학기(${term})와 카테고리(${category})를 확인해주세요.`);
    }
    
    // 각 프로젝트 처리
    let processedCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // 프로세싱할 UID 수를 제한 (혹시 모를 타임아웃 방지)
    const maxProcessCount = Math.min(uids.length, 50);
    const uidsToProcess = uids.slice(0, maxProcessCount);
    
    if (uids.length > maxProcessCount) {
      addLog(`주의: ${uids.length}개 중 ${maxProcessCount}개만 처리합니다. 나머지는 다음 실행에서 처리하세요.`);
    }
    
    // 각 UID에 대해 상세 정보 크롤링
    for (const uid of uidsToProcess) {
      try {
        // Firestore에 이미 존재하는지 확인
        const docRef = db.collection("softcon_projects").doc(uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
          addLog(`프로젝트 ID ${uid} 이미 존재함 (스킵)`);
          skipCount++;
          continue; // 중복 업로드 방지
        }

        // 상세 정보 가져오기
        const detail = await getDetailData(uid);
        
        // 제목이 없는 경우 스킵
        if (!detail.title || detail.title.length < 2) {
          addLog(`프로젝트 ID ${uid}의 제목이 없거나 너무 짧음 (스킵)`);
          skipCount++;
          continue;
        }
        
        // Firestore에 저장
        await docRef.set(detail);
        processedCount++;
        
        addLog(`프로젝트 저장 완료: ${detail.title} (ID: ${uid})`);
      } catch (error) {
        // 에러 객체에서 필요한 정보만 추출
        addLog(`프로젝트 ID ${uid} 처리 중 오류: ${error.message}`);
        errorCount++;
      }
    }

    // 최종 결과 로그
    addLog(`크롤링 완료: 처리 대상 ${uidsToProcess.length}개 중 ${processedCount}개 저장, ${skipCount}개 스킵, ${errorCount}개 오류`);
    
    // 안전한 결과 반환
    return { 
      success: true, 
      count: processedCount,
      skipped: skipCount,
      errors: errorCount,
      total: uids.length,
      processed: uidsToProcess.length,
      logs: logs 
    };
    
  } catch (error) {
    // 전역 오류 처리 - 오류 객체에서 필요한 정보만 추출
    const errorMessage = error.message || "알 수 없는 오류";
    addLog(`크롤링 중 오류 발생: ${errorMessage}`);
    console.error("크롤링 오류:", errorMessage);
    
    // 디버깅을 위해 모든 로그 반환
    return {
      success: false,
      error: errorMessage,
      logs: logs
    };
  }
});