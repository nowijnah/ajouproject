// controllers/softcon.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const { 
  CATEGORY_NAMES, 
  SOFTCON_URLS,
  AXIOS_CONFIG
} = require("../config/constants");
const { getAbsoluteUrl, ensureAuthorDocument } = require("../utils/firestore");

// 크롤링한 데이터를 파이어스토어에 맞게 변환
function transformForFirestore(project, term, category) {
  const teamKeywords = project.team
    .map(member => member.name)
    .filter(Boolean);
  
  const categoryName = CATEGORY_NAMES[category] || category;
  
  const filteredKeywords = [
    ...teamKeywords,
    categoryName,
    term,
    "소프트콘"
  ].filter(keyword => keyword.length > 1);
  
  return {
    title: project.title || "제목 없음",
    subtitle: `${term} ${categoryName}`,
    content: project.content || "",
    keywords: filteredKeywords,
    thumbnail: project.thumbnail || "",
    files: [
      ...(project.files && project.files.length > 0 ? project.files : [])
    ],
    links: project.links || [],
    team: project.team || [],
    term: term,
    category: category,
    authorId: "softcon-author",
    likeCount: 0,
    commentCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sourceUrl: project.sourceUrl || ""
  };
}

// 소프트콘 크롤링 함수
exports.crawlSoftconData = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  const logs = [];
  const addLog = (message) => {
    console.log(message);
    logs.push(message);
  };

  try {
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        addLog(`JSON 파싱 실패: ${e.message}`);
      }
    }
    
    const term = parsedData?.term || 
                parsedData?.data?.term || 
                parsedData?.params?.term || 
                '';
                
    const category = parsedData?.category || 
                    parsedData?.data?.category || 
                    parsedData?.params?.category || 
                    '';
    
    if (!term || !category) {
      addLog(`필수 파라미터 누락. term: ${term}, category: ${category}`);
      throw new functions.https.HttpsError(
        'invalid-argument',
        '학기와 카테고리 정보가 필요합니다.'
      );
    }

    addLog(`크롤링 시작: 학기=${term}, 카테고리=${category}`);

    await ensureAuthorDocument(db);

    const { 
      baseListUrl, 
      baseDetailUrl,
      currentTermListUrl,
      currentTermDetailUrl 
    } = SOFTCON_URLS;
    
    const isCurrentTerm = term === "2024-2";
    const listUrl = isCurrentTerm ? currentTermListUrl : baseListUrl;
    const detailUrl = isCurrentTerm ? currentTermDetailUrl : baseDetailUrl;

    // HTML 페이지 가져오기
    const getHtml = async (url) => {
      try {
        addLog(`URL 요청: ${url}`);
        const response = await axios.get(url, AXIOS_CONFIG);
        return cheerio.load(response.data);
      } catch (error) {
        addLog(`URL 요청 실패: ${url}, 오류: ${error.message}`);
        throw new Error(`URL 요청 실패: ${error.message}`);
      }
    };

    const getAllProjectsFromList = async () => {
      let url;
      if (category === "ALL") {
        if (isCurrentTerm) {
          url = `${listUrl}`; 
        } else {
          url = `${listUrl}?wTerm=${term}`; 
        }
      } else {
        if (isCurrentTerm) {
          url = `${listUrl}?category=${category}`;
        } else {
          url = `${listUrl}?category=${category}&wTerm=${term}`;
        }
      }
      
      addLog(`프로젝트 목록 URL: ${url}`);
      
      const $ = await getHtml(url);
      const projects = [];
      
      $("li.vw_close").each((_, el) => {
        try {
          const modalLink = $(el).find(".modal > div > a").first().attr("href");
          const uidMatch = modalLink ? modalLink.match(/uid=(\d+)/) : null;
          if (!uidMatch) return;
          
          const uid = uidMatch[1];
          
          let thumbnail = "";
          const imgTag = $(el).find(".vw_ma_img img").first();
          
          if (imgTag.length > 0) {
            const imgSrc = imgTag.attr("src");
            if (imgSrc) {
              thumbnail = imgSrc.startsWith('http') 
                ? imgSrc 
                : `https://softcon.ajou.ac.kr${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
                
              addLog(`프로젝트 ${uid} 썸네일 URL: ${thumbnail}`);
            }
          }
          
          const title = $(el).find("div > div > p").first().text().trim();
          
          projects.push({
            uid,
            thumbnail,
            title
          });
        } catch (error) {
          addLog(`목록 항목 처리 중 오류: ${error.message}`);
        }
      });
      
      if (projects.length === 0) {
        addLog("목록에서 프로젝트를 찾을 수 없습니다. 대체 방법으로 UID만 추출합니다.");
        
        $("a").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          
          const uidMatch = href.match(/uid=(\d+)/);
          if (uidMatch) {
            projects.push({
              uid: uidMatch[1],
              thumbnail: "",
              title: ""
            });
          }
        });
      }
      
      const uniqueProjects = [];
      const seenUids = new Set();
      
      for (const project of projects) {
        if (!seenUids.has(project.uid)) {
          seenUids.add(project.uid);
          uniqueProjects.push(project);
        }
      }
      
      addLog(`총 ${uniqueProjects.length}개의 프로젝트를 찾았습니다.`);
      
      return uniqueProjects;
    };

    const getDetailData = async (projectInfo) => {
      const { uid, thumbnail: listThumbnail, title: listTitle } = projectInfo;
    
      let url = isCurrentTerm
        ? `${detailUrl}?uid=${uid}`
        : `${detailUrl}?uid=${uid}&wTerm=${term}`;
    
      addLog(`프로젝트 상세 URL: ${url}`);
      const $ = await getHtml(url);
    
      // 썸네일 추출
      let thumbnail = listThumbnail || "";
      if (!thumbnail) {
        try {
          const titleImg = $(".dw_title img").first();
          if (titleImg.length > 0) thumbnail = titleImg.attr("src") || "";
          if (!thumbnail) {
            const detailImg = $(".work_detail img, .detail img").first();
            if (detailImg.length > 0) thumbnail = detailImg.attr("src") || "";
          }
          if (thumbnail) thumbnail = getAbsoluteUrl(thumbnail);
        } catch (error) {
          addLog(`썸네일 추출 실패 (uid: ${uid}): ${error.message}`);
        }
      }
    
      let title = $(".dw_title p").text().trim();
      if (!title || title.length < 2) {
        title = listTitle?.trim() || `프로젝트 ${uid}`;
      }
      
      // 설명 추출
      let description = "";
      const workOverview = $(".work_detail > div:last-child").text().trim();
      if (workOverview) {
        description += workOverview + "\n\n";
      } else {
        const altOverview = $(".work_detail, .detail, .content").text().trim();
        if (altOverview) description += altOverview + "\n\n";
      }
    
      // 팀 정보 또는 등록자 추출
      const team = [];
      $(".dw_wrap").each((i, el) => {
        const label = $(el).find(".dw_le").text().trim();
        if (label === "팀원") {
          $(el).find(".dw_ri ul").each((i, ul) => {
            const role = $(ul).find("li.dw1").text().trim();
            const name = $(ul).find("li.dw2").text().trim();
            const major = $(ul).find("li.dw3").text().trim();
            const grade = $(ul).find("li.dw4").text().trim();
            const email = $(ul).find("li.dw5").text().trim();
            if (name) team.push({ role, name, major, grade, email });
          });
        }
      });
    
      // 등록자 (팀원이 없을 경우만)
      if (team.length === 0) {
        const registrant = $(".dw_wrap")
          .filter((i, el) => $(el).find(".dw_le").text().includes("등록자"))
          .find(".dw1 span")
          .text()
          .trim();
        if (registrant) team.push({ name: registrant });
      }
    
      // 링크 추출
      const videoLink = $(".countsort iframe").attr("src") || "";
      let pdfLink = "";
      try {
        pdfLink = $("#pdfArea").attr("src") || "";
        if (!pdfLink) {
          $("iframe").each((i, el) => {
            const src = $(el).attr("src") || "";
            if (src.includes(".pdf")) {
              pdfLink = src;
              return false;
            }
          });
        }
        if (pdfLink) pdfLink = getAbsoluteUrl(pdfLink);
      } catch (error) {
        addLog(`PDF 링크 추출 실패 (uid: ${uid}): ${error.message}`);
      }
    
      const gitSection = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("git");
      });
      const githubLink = gitSection.find("a").attr("href") || "";
    
      return {
        uid,
        title,
        content: description,
        team,
        files: pdfLink
          ? [{ fileId: `pdf-${uid}`, type: "PDF", filename: "발표자료", url: pdfLink }]
          : [],
        links: [
          videoLink
            ? {
                linkId: `video-${uid}`,
                title: "시연 영상",
                type: "VIDEO",
                url: videoLink,
                subtitle: ""
              }
            : null,
          githubLink
            ? {
                linkId: `github-${uid}`,
                title: "GitHub 저장소",
                type: "GITHUB",
                url: githubLink,
                subtitle: ""
              }
            : null
        ].filter(Boolean),
        thumbnail,
        sourceUrl: url
      };
    };

    const projectsInfo = await getAllProjectsFromList();
    
    if (projectsInfo.length === 0) {
      throw new Error(`프로젝트 ID를 찾을 수 없습니다. 학기(${term})와 카테고리(${category})를 확인해주세요.`);
    }
    
    let processedCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    const maxProcessCount = Math.min(projectsInfo.length, 100);
    const projectsToProcess = projectsInfo.slice(0, maxProcessCount);
    
    if (projectsInfo.length > maxProcessCount) {
      addLog(`주의: ${projectsInfo.length}개 중 ${maxProcessCount}개만 처리합니다. 나머지는 다음 실행에서 처리하세요.`);
    }
    
    for (const projectInfo of projectsToProcess) {
      try {
        const docRef = db.collection("softcon_projects").doc(projectInfo.uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
          addLog(`프로젝트 ID ${projectInfo.uid} 이미 존재함 (스킵)`);
          skipCount++;
          continue; // 중복 업로드 방지
        }

        const detail = await getDetailData(projectInfo);
        
        if (!detail.title || detail.title.length < 2) {
          addLog(`프로젝트 ID ${projectInfo.uid}의 제목이 없거나 너무 짧음 (스킵)`);
          skipCount++;
          continue;
        }
        
        const firestoreData = transformForFirestore(detail, term, category);
        
        await docRef.set(firestoreData);
        processedCount++;
        
        addLog(`프로젝트 저장 완료: ${detail.title} (ID: ${projectInfo.uid}), 썸네일: ${detail.thumbnail}`);
      } catch (error) {
        addLog(`프로젝트 ID ${projectInfo.uid} 처리 중 오류: ${error.message}`);
        errorCount++;
      }
    }

    addLog(`크롤링 완료: 처리 대상 ${projectsToProcess.length}개 중 ${processedCount}개 저장, ${skipCount}개 스킵, ${errorCount}개 오류`);
    
    return { 
      success: true, 
      count: processedCount,
      skipped: skipCount,
      errors: errorCount,
      total: projectsInfo.length,
      processed: projectsToProcess.length,
      logs: logs 
    };
    
  } catch (error) {
    const errorMessage = error.message || "알 수 없는 오류";
    addLog(`크롤링 중 오류 발생: ${errorMessage}`);
    console.error("크롤링 오류:", errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      logs: logs
    };
  }
});