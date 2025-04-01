const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors")({ origin: true });
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

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

// 카테고리 이름 매핑
const CATEGORY_NAMES = {
  'S': '소프트웨어',
  'D': '사이버보안',
  'I': 'AI융합',
  'R': '미디어',
  'M': '자기주도연구',
  'P': '자기주도 프로젝트'
};

exports.getSoftconTerms = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      terms: TERMS,
      categories: CATEGORIES
    });
  });
});

async function ensureAuthorDocument() {
  const authorRef = db.collection('users').doc('softcon-author');
  const doc = await authorRef.get();
  
  if (!doc.exists) {
    await authorRef.set({
      displayName: "아주대학교 소프트콘",
      role: "ADMIN",
      profileImage: "/images/softcon-logo.png",
      email: "softcon@ajou.ac.kr",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("소프트콘 작성자 정보가 생성되었습니다.");
  }
}

// URL을 절대 경로로 변환
function getAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://softcon.ajou.ac.kr${url.startsWith('/') ? '' : '/'}${url}`;
}

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

// 크롤링 함수
exports.crawlSoftconData = functions.https.onCall(async (data, context) => {
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

    await ensureAuthorDocument();

    const baseListUrl = "https://softcon.ajou.ac.kr/works/works_list_prev.asp";
    const baseDetailUrl = "https://softcon.ajou.ac.kr/works/works_prev.asp";
    
    const isCurrentTerm = term === "2024-2";
    const currentTermListUrl = "https://softcon.ajou.ac.kr/works/works_list.asp";
    const currentTermDetailUrl = "https://softcon.ajou.ac.kr/works/works.asp";
    
    const listUrl = isCurrentTerm ? currentTermListUrl : baseListUrl;
    const detailUrl = isCurrentTerm ? currentTermDetailUrl : baseDetailUrl;

    const axiosConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://softcon.ajou.ac.kr/'
      },
      timeout: 30000
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

    const getAllProjectsFromList = async () => {
      let url;
      if (isCurrentTerm) {
        url = `${listUrl}?category=${category}`;
      } else {
        url = `${listUrl}?category=${category}&wTerm=${term}`;
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
      
      let url;
      if (isCurrentTerm) {
        url = `${detailUrl}?uid=${uid}`;
      } else {
        url = `${detailUrl}?uid=${uid}&wTerm=${term}`;
      }
      
      addLog(`프로젝트 상세 URL: ${url}`);
      
      const $ = await getHtml(url);

      let thumbnail = listThumbnail || "";
      
      if (!thumbnail) {
        try {
          const titleImg = $(".dw_title img").first();
          if (titleImg.length > 0) {
            thumbnail = titleImg.attr("src") || "";
          }
          
          if (!thumbnail) {
            const detailImg = $(".work_detail img, .detail img").first();
            if (detailImg.length > 0) {
              thumbnail = detailImg.attr("src") || "";
            }
          }
          
          if (thumbnail) {
            thumbnail = getAbsoluteUrl(thumbnail);
          }
        } catch (error) {
          addLog(`썸네일 추출 실패 (uid: ${uid}): ${error.message}`);
        }
      }

      let title = listTitle || "";
      
      if (!title) {
        title = $(".dw_title p").text().trim();
        if (!title) {
          title = $("h1, h2, .title").first().text().trim();
        }
      }
      
      let description = "";
      
      const workOverview = $(".work_detail > div:last-child").text().trim();
      if (workOverview) {
        description += workOverview + "\n\n";
      } else {
        const altWorkOverview = $(".work_detail, .detail, .content").text().trim();
        if (altWorkOverview) {
          description += altWorkOverview + "\n\n";
        }
      }
      
      const teamSection = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("팀원");
      });
      
      if (teamSection.length > 0) {
        description += "팀원 정보:\n";
        
        teamSection.find("ul").each((i, el) => {
          const role = $(el).find("li.dw1").text().trim();
          const name = $(el).find("li.dw2").text().trim();
          const major = $(el).find("li.dw3").text().trim();
          const grade = $(el).find("li.dw4").text().trim();
          
          if (name) {
            description += `- ${role} ${name} (${major}`;
            if (grade) description += `, ${grade}학년`;
            description += ")\n";
          }
        });
        
        description += "\n";
      }
      
      const mentorSection = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("멘토");
      });
      
      if (mentorSection.length > 0) {
        description += "멘토:\n";
        
        mentorSection.find("ul").each((i, el) => {
          const name = $(el).find("li.dw2").text().trim();
          const affiliation = $(el).find("li.dw3").text().trim();
          
          if (name) {
            description += `- ${name}`;
            if (affiliation) description += ` (${affiliation})`;
            description += "\n";
          }
        });
        
        description += "\n";
      }
            
      const team = [];
      teamSection.find("ul").each((i, el) => {
        const role = $(el).find("li.dw1").text().trim();
        const name = $(el).find("li.dw2").text().trim();
        const major = $(el).find("li.dw3").text().trim();
        const grade = $(el).find("li.dw4").text().trim();
        const email = $(el).find("li.dw5").text().trim();

        team.push({ role, name, major, grade, email });
      });
      
      const videoLink = $(".countsort iframe").attr("src") || "";

      let pdfLink = "";
      try {
        pdfLink = $("#pdfArea").attr("src") || "";
        
        if (!pdfLink) {
          $("iframe").each((i, el) => {
            const src = $(el).attr("src") || "";
            if (src.includes(".pdf")) {
              pdfLink = src;
              return false; // 루프 중단
            }
          });
        }
        
        if (pdfLink) {
          pdfLink = getAbsoluteUrl(pdfLink);
        }
      } catch (error) {
        addLog(`PDF 링크 추출 실패 (uid: ${uid}): ${error.message}`);
      }

      const gitSection = $(".dw_wrap").filter((i, el) => {
        return $(el).find(".dw_le").text().includes("git");
      });
      const githubLink = gitSection.find("a").attr("href") || "";
      
      const data = {
        uid,
        title: title || `프로젝트 ${uid}`,
        content: description || "",
        team,
        files: pdfLink ? [{ 
          fileId: `pdf-${uid}`,
          type: 'PDF',
          filename: '발표자료',
          url: pdfLink
        }] : [],
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
            type: "GITHUB",
            url: githubLink,
            subtitle: ""
          } : null
        ].filter(Boolean),
        thumbnail,
        sourceUrl: url
      };
      
      return data;
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

// 이메일 전송 유틸리티 함수 - MailerSend 확장 프로그램 사용
async function sendEmail(to, subject, htmlContent) {
  try {
    // emails 컬렉션에 문서 추가 (MailerSend 확장이 이 컬렉션을 모니터링)
    const result = await admin.firestore().collection('emails').add({
      to: [{ email: to }],
      from: { email: "ajou-aim@trial-q3enl6kj7km42vwr.mlsender.net", name: "AIM AJOU" },
      subject: subject,
      html: htmlContent
    });
    
    console.log('Email document added successfully:', result.id);
    return { success: true, emailId: result.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// 테스트 이메일 발송 함수
exports.testEmailSend = onCall(async (request) => {
  try {
    console.log('테스트 이메일 발송 시도 중...');
    
    // 요청에서 수신자 이메일을 받거나 기본값 사용
    const recipientEmail = request.data && request.data.email ? request.data.email : 'a856412@gmail.com';
    
    const htmlContent = `
      <h1>이메일 테스트</h1>
      <p>이 이메일은 Firebase Functions에서 발송된 테스트 이메일입니다.</p>
      <p>현재 시간: ${new Date().toISOString()}</p>
    `;
    
    console.log('이메일 옵션:', { to: recipientEmail, subject: '테스트 이메일' });
    
    // 이메일 발송 시도
    const result = await sendEmail(recipientEmail, '테스트 이메일', htmlContent);
    
    return { 
      success: true, 
      message: '이메일 발송 요청 성공',
      result
    };
  } catch (error) {
    console.error('테스트 이메일 발송 실패:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack
    };
  }
});

// 기본 테스트 함수
exports.helloWorld = onCall((request) => {
  const data = request.data;
  const auth = request.auth;
  
  const userId = auth ? auth.uid : 'unauthenticated';
  console.log("Request from user:", userId);
  
  return { 
    message: "Hello from Firebase!",
    receivedData: data,
    userId: userId,
    timestamp: new Date().toISOString()
  };
});

// 공통 알림 처리 함수
const processCommentNotification = async (snapshot, collectionName) => {
  try {
    if (!snapshot) {
      console.log("스냅샷이 없습니다");
      return null;
    }
    
    const commentData = snapshot.data();
    const { postId, authorId, content, parentId } = commentData;
    
    // 게시물 정보 가져오기
    const postRef = admin.firestore().collection(collectionName).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      console.log('게시물이 존재하지 않습니다');
      return null;
    }
    
    const postData = postDoc.data();
    const postAuthorId = postData.authorId;
    
    // 작성자 정보 가져오기
    const authorRef = admin.firestore().collection('users').doc(authorId);
    const authorDoc = await authorRef.get();
    
    if (!authorDoc.exists) {
      console.log('작성자가 존재하지 않습니다');
      return null;
    }
    
    const authorData = authorDoc.data();
    
    // 알림 유형 및 수신자 결정
    let notificationType, recipientId;
     
    if (parentId) {
      // 댓글에 대한 답글인 경우
      notificationType = 'REPLY';
      
      // 부모 댓글의 작성자 찾기
      const parentCommentRef = admin.firestore().collection(`${collectionName}_comments`).doc(parentId);
      const parentCommentDoc = await parentCommentRef.get();
      
      if (!parentCommentDoc.exists) {
        console.log('부모 댓글이 존재하지 않습니다');
        return null;
      }
      
      recipientId = parentCommentDoc.data().authorId;
      
      // 자신의 댓글에 자신이 답글을 다는 경우 알림 제외
      if (recipientId === authorId) {
        console.log('작성자가 자신의 댓글에 답글을 달았습니다. 알림이 필요하지 않습니다.');
        return null;
      }
    } else {
      // 게시물에 대한 새 댓글인 경우
      notificationType = 'COMMENT';
      recipientId = postAuthorId;
      
      // 자신의 게시물에 자신이 댓글을 다는 경우 알림 제외
      if (recipientId === authorId) {
        console.log('작성자가 자신의 게시물에 댓글을 달았습니다. 알림이 필요하지 않습니다.');
        return null;
      }
    }
    
    // 수신자 정보 가져오기
    const recipientRef = admin.firestore().collection('users').doc(recipientId);
    const recipientDoc = await recipientRef.get();
    
    if (!recipientDoc.exists) {
      console.log('수신자가 존재하지 않습니다');
      return null;
    }
    
    const recipientData = recipientDoc.data();
    
    // Firestore에 알림 생성
    const notificationRef = admin.firestore().collection('notifications').doc();
    await notificationRef.set({
      userId: recipientId,
      authorId: authorId,
      type: notificationType,
      postId: postId,
      commentId: snapshot.id,
      parentId: parentId || null,
      collectionName: collectionName,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 사용자가 이메일 알림을 활성화했는지 확인
    if (recipientData.emailNotifications !== false) {
      try {
        // 수신자 이메일 로깅
        console.log('이메일 발송 시도. 수신자:', recipientData.email);
        
        // 이메일 알림 보내기
        const recipientEmail = recipientData.email;
        const authorName = authorData.displayName || '사용자';
        const postTitle = postData.title || '게시물';
        
        let emailSubject, emailContent;
        
        if (notificationType === 'COMMENT') {
          emailSubject = `게시물에 새 댓글이 달렸습니다: ${postTitle}`;
          emailContent = `
            <h2>새 댓글 알림</h2>
            <p>${authorName}님이 "${postTitle}" 게시물에 댓글을 달았습니다.</p>
            <p>댓글 내용: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"</p>
            <p><a href="https://ajou-project-cafd9.web.app/#/${collectionName}/${postId}">게시물 바로가기</a></p>
          `;
        } else {
          emailSubject = `댓글에 새 답글이 달렸습니다`;
          emailContent = `
            <h2>새 답글 알림</h2>
            <p>${authorName}님이 회원님의 댓글에 답글을 달았습니다.</p>
            <p>답글 내용: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"</p>
            <p><a href="https://ajou-project-cafd9.web.app/#/${collectionName}/${postId}">게시물 바로가기</a></p>
          `;
        }
        
        // MailerSend 확장 프로그램 사용하여 이메일 발송
        const result = await sendEmail(recipientEmail, emailSubject, emailContent);
        console.log('이메일 발송 결과:', result);
      } catch (emailError) {
        // 이메일 발송 실패 시 로그만 남기고 계속 진행
        console.error('이메일 발송 실패:', emailError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('알림 처리 중 오류 발생:', error);
    return { error: error.message };
  }
};

// CORS 문제 해결을 위한 HTTP 함수 추가
exports.sendCommentNotification = onRequest((request, response) => {
  // CORS 허용
  return cors(request, response, async () => {
    try {
      // 요청 데이터 가져오기
      const { commentId, collectionName } = request.body;
      
      if (!commentId || !collectionName) {
        return response.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
      }
      
      // Firestore에서 댓글 데이터 가져오기
      const commentRef = admin.firestore().collection(`${collectionName}_comments`).doc(commentId);
      const commentDoc = await commentRef.get();
      
      if (!commentDoc.exists) {
        return response.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
      }
      
      // 알림 처리 함수 호출
      const result = await processCommentNotification(commentDoc, collectionName);
      
      return response.status(200).json({ success: true, result });
    } catch (error) {
      console.error('댓글 알림 처리 중 오류 발생:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// 포트폴리오 댓글에 대한 함수
exports.onPortfolioCommentCreate = onDocumentCreated(
  "portfolios_comments/{commentId}", 
  (event) => {
    return processCommentNotification(event.data, 'portfolios');
  }
);

// 연구실 댓글에 대한 함수
exports.onLabCommentCreate = onDocumentCreated(
  "labs_comments/{commentId}", 
  (event) => {
    return processCommentNotification(event.data, 'labs');
  }
);

// 기업 댓글에 대한 함수
exports.onCompanyCommentCreate = onDocumentCreated(
  "companies_comments/{commentId}", 
  (event) => {
    return processCommentNotification(event.data, 'companies');
  }
);

// 알림 읽음 표시 처리를 위한 Callable 함수
exports.markNotificationAsRead = onCall(async (request) => {
  // 인증 확인
  if (!request.auth) {
    throw new Error('이 기능을 사용하려면 로그인해야 합니다.');
  }
  
  const { notificationId } = request.data;
  
  if (!notificationId) {
    throw new Error('알림 ID가 필요합니다.');
  }
  
  try {
    const notificationRef = admin.firestore().collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();
    
    if (!notificationDoc.exists) {
      throw new Error('해당 알림을 찾을 수 없습니다.');
    }
    
    // 권한 확인 - 현재 사용자가 알림의 소유자인지 확인
    const notificationData = notificationDoc.data();
    if (notificationData.userId !== request.auth.uid) {
      throw new Error('이 알림을 수정할 권한이 없습니다.');
    }
    
    // 알림 읽음 표시 업데이트
    await notificationRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('알림 읽음 표시 중 오류 발생:', error);
    throw new Error(error.message);
  }
});

// 알림 설정 업데이트를 위한 Callable 함수
exports.updateNotificationSettings = onCall(async (request) => {
  // 인증 확인
  if (!request.auth) {
    throw new Error('이 기능을 사용하려면 로그인해야 합니다.');
  }
  
  const { emailNotifications } = request.data;
  
  if (emailNotifications === undefined) {
    throw new Error('이메일 알림 설정값이 필요합니다.');
  }
  
  try {
    const userRef = admin.firestore().collection('users').doc(request.auth.uid);
    
    await userRef.update({
      emailNotifications: Boolean(emailNotifications),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('알림 설정 업데이트 중 오류 발생:', error);
    throw new Error(error.message);
  }
});

// 모든 알림 읽음 표시를 위한 함수
exports.markAllNotificationsAsRead = onCall(async (request) => {
  // 인증 확인
  if (!request.auth) {
    throw new Error('이 기능을 사용하려면 로그인해야 합니다.');
  }
  
  try {
    const userId = request.auth.uid;
    
    // 사용자의 읽지 않은 알림 찾기
    const notificationsRef = admin.firestore().collection('notifications');
    const unreadQuery = notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false);
    
    const snapshot = await unreadQuery.get();
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    // 일괄 업데이트를 위한 batch 생성
    const batch = admin.firestore().batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        read: true,
        readAt: now
      });
    });
    
    await batch.commit();
    
    return { 
      success: true, 
      count: snapshot.size 
    };
  } catch (error) {
    console.error('모든 알림 읽음 표시 중 오류 발생:', error);
    throw new Error(error.message);
  }
});

// 알림 삭제 함수
exports.deleteNotification = onCall(async (request) => {
  // 인증 확인
  if (!request.auth) {
    throw new Error('이 기능을 사용하려면 로그인해야 합니다.');
  }
  
  const { notificationId } = request.data;
  
  if (!notificationId) {
    throw new Error('알림 ID가 필요합니다.');
  }
  
  try {
    const notificationRef = admin.firestore().collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();
    
    if (!notificationDoc.exists) {
      throw new Error('해당 알림을 찾을 수 없습니다.');
    }
    
    // 권한 확인
    const notificationData = notificationDoc.data();
    if (notificationData.userId !== request.auth.uid) {
      throw new Error('이 알림을 삭제할 권한이 없습니다.');
    }
    
    // 알림 삭제
    await notificationRef.delete();
    
    return { success: true };
  } catch (error) {
    console.error('알림 삭제 중 오류 발생:', error);
    throw new Error(error.message);
  }
});

// 오래된 알림 자동 정리 (예: 30일이 지난 알림)
exports.cleanupOldNotifications = onSchedule({
  schedule: "0 0 * * *", // 매일 자정에 실행
  timeZone: "Asia/Seoul"
}, async () => {
  try {
    // 30일 전 날짜 계산
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    // 30일이 지난 알림 쿼리
    const notificationsRef = admin.firestore().collection('notifications');
    const oldNotificationsQuery = notificationsRef
      .where('createdAt', '<', cutoffDate);
    
    const snapshot = await oldNotificationsQuery.get();
    
    if (snapshot.empty) {
      console.log('삭제할 오래된 알림이 없습니다.');
      return null;
    }
    
    // 일괄 삭제를 위한 batch 생성
    const batch = admin.firestore().batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`${snapshot.size}개의 오래된 알림이 삭제되었습니다.`);
    return null;
  } catch (error) {
    console.error('오래된 알림 정리 중 오류 발생:', error);
    return null;
  }
});