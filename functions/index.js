// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

admin.initializeApp();
const db = admin.firestore();

const TERMS = [
  "2020-1", "2020-2",
  "2021-1", "2021-2",
  "2022-1", "2022-2",
  "2023-1", "2023-2",
  "2024-1", "2024-2"
];

const CATEGORIES = ["ALL","S", "D", "I", "R", "M", "P"];

// 카테고리 이름 매핑
const CATEGORY_NAMES = {
  'ALL': '전체',
  'S': '소프트웨어',
  'D': '사이버보안',
  'I': 'AI융합',
  'R': '미디어',
  'M': '자기주도연구',
  'P': '자기주도 프로젝트'
};

// SMTP 설정
const smtpTransport = nodemailer.createTransport({
  host: "smtp.gmail.com", // 또는 적절한 SMTP 서버
  port: 587,
  secure: false, // true는 465 포트, false는 다른 포트
  auth: {
    user: process.env.SMTP_USER_NAME,
    pass: process.env.SMTP_PASSWORD
  },
  authentication: "login",
  enableStartTls: true,
  tls: false,
  tlsOptions: {
    rejectUnauthorized: true
  },
  pool: false
});

// 이메일 템플릿 로드 함수
function loadEmailTemplate(templateName) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(template);
}

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

// 댓글 알림 이메일 전송 함수
exports.sendCommentNotification = functions.https.onCall(async (data, context) => {
  try {
    const { commentId, postId, collectionName } = data;
    
    if (!commentId || !postId || !collectionName) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    
    // 댓글 정보 가져오기
    const commentRef = db.collection(`${collectionName}_comments`).doc(commentId);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const comment = commentDoc.data();
    
    // 게시물 정보 가져오기
    const postRef = db.collection(collectionName).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    
    const post = postDoc.data();
    
    // 게시물 작성자와 댓글 작성자가 같은 경우 알림 X
    if (post.authorId === comment.authorId) {
      return { success: true, message: '자신의 게시물에 댓글을 작성하여 알림을 보내지 않습니다.' };
    }
    
    // 게시물 작성자 정보 가져오기
    const recipientUserRef = db.collection('users').doc(post.authorId);
    const recipientUserDoc = await recipientUserRef.get();
    
    if (!recipientUserDoc.exists) {
      throw new Error('게시물 작성자 정보를 찾을 수 없습니다.');
    }
    
    const recipientUser = recipientUserDoc.data();
    
    // 이메일 알림 설정이 꺼져있는 경우 알림 X
    if (recipientUser.emailNotifications === false) {
      return { success: true, message: '이메일 알림 설정이 꺼져있습니다.' };
    }
    
    // 댓글 작성자 정보 가져오기
    const authorUserRef = db.collection('users').doc(comment.authorId);
    const authorUserDoc = await authorUserRef.get();
    
    if (!authorUserDoc.exists) {
      throw new Error('댓글 작성자 정보를 찾을 수 없습니다.');
    }
    
    const authorUser = authorUserDoc.data();
    
    // 이메일 템플릿 로드
    const isReply = comment.parentId !== null;
    const templateName = isReply ? 'reply-notification' : 'comment-notification';
    const template = loadEmailTemplate(templateName);
    
    // 템플릿 데이터 설정
    const templateData = {
      recipientName: recipientUser.displayName || '사용자',
      authorName: authorUser.displayName || '사용자',
      postTitle: post.title,
      commentContent: comment.content,
      postUrl: `https://aimajou.web.app/${collectionName}/${postId}`, // 실제 도메인으로 변경
      unsubscribeUrl: 'https://aimajou.web.app/settings' // 실제 도메인으로 변경
    };
    
    // 이메일 옵션 설정
    const mailOptions = {
      from: '"AIM AJOU" <noreply@aimajou.web.app>', // 실제 발신자 이메일로 변경
      to: recipientUser.email,
      subject: isReply ? '새 답글 알림' : '새 댓글 알림',
      html: template(templateData)
    };
    
    // 이메일 발송
    await smtpTransport.sendMail(mailOptions);
    
    // Firestore에 알림 저장
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      userId: post.authorId,
      authorId: comment.authorId,
      postId,
      commentId,
      collectionName,
      type: isReply ? 'REPLY' : 'COMMENT',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('댓글 알림 전송 중 오류:', error);
    throw new functions.https.HttpsError('internal', `알림 전송 실패: ${error.message}`);
  }
});

// 앱 내 알림 읽음 처리 함수
exports.markNotificationAsRead = functions.https.onCall(async (data, context) => {
  try {
    const { notificationId } = data;
    
    if (!notificationId || !context.auth) {
      throw new Error('필수 정보가 누락되었거나 인증되지 않았습니다.');
    }
    
    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();
    
    if (!notificationDoc.exists) {
      throw new Error('알림을 찾을 수 없습니다.');
    }
    
    const notification = notificationDoc.data();
    
    // 본인의 알림만 읽음 처리 가능
    if (notification.userId !== context.auth.uid) {
      throw new Error('권한이 없습니다.');
    }
    
    await notificationRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('알림 읽음 처리 중 오류:', error);
    throw new functions.https.HttpsError('internal', `알림 읽음 처리 실패: ${error.message}`);
  }
});

// 알림 설정 업데이트 함수
exports.updateNotificationSettings = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('인증이 필요합니다.');
    }
    
    const { emailNotifications } = data;
    
    if (emailNotifications === undefined) {
      throw new Error('알림 설정이 지정되지 않았습니다.');
    }
    
    const userRef = db.collection('users').doc(context.auth.uid);
    await userRef.update({
      emailNotifications: !!emailNotifications, // Boolean으로 변환
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('알림 설정 업데이트 중 오류:', error);
    throw new functions.https.HttpsError('internal', `알림 설정 업데이트 실패: ${error.message}`);
  }
});

// functions/index.js에 추가할 함수들

// 사용자 차단 상태 확인 함수
async function checkUserStatus(uid) {
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    
    if (userData.isBlocked === true) {
      throw new functions.https.HttpsError('permission-denied', '차단된 계정입니다.');
    }

    return userData;
  } catch (error) {
    console.error('사용자 상태 확인 중 오류:', error);
    throw error;
  }
}

// 댓글 작성 권한 확인 함수
async function checkCommentPermission(uid) {
  const userData = await checkUserStatus(uid);
  
  if (userData.isCommentBanned === true) {
    throw new functions.https.HttpsError('permission-denied', '댓글 작성이 제한된 계정입니다.');
  }
  
  return userData;
}

// 기존 댓글 알림 함수 수정 (권한 체크 추가)
exports.sendCommentNotification = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    // 사용자 상태 및 댓글 권한 확인
    await checkCommentPermission(context.auth.uid);

    const { commentId, postId, collectionName } = data;
    
    if (!commentId || !postId || !collectionName) {
      throw new functions.https.HttpsError('invalid-argument', '필수 정보가 누락되었습니다.');
    }
    
    // 댓글 정보 가져오기
    const commentRef = db.collection(`${collectionName}_comments`).doc(commentId);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      throw new functions.https.HttpsError('not-found', '댓글을 찾을 수 없습니다.');
    }
    
    const comment = commentDoc.data();
    
    // 댓글 작성자와 현재 사용자가 같은지 확인
    if (comment.authorId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '권한이 없습니다.');
    }
    
    // 게시물 정보 가져오기
    const postRef = db.collection(collectionName).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      throw new functions.https.HttpsError('not-found', '게시물을 찾을 수 없습니다.');
    }
    
    const post = postDoc.data();
    
    // 게시물 작성자와 댓글 작성자가 같은 경우 알림 X
    if (post.authorId === comment.authorId) {
      return { success: true, message: '자신의 게시물에 댓글을 작성하여 알림을 보내지 않습니다.' };
    }
    
    // 게시물 작성자 정보 가져오기
    const recipientUserRef = db.collection('users').doc(post.authorId);
    const recipientUserDoc = await recipientUserRef.get();
    
    if (!recipientUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', '게시물 작성자 정보를 찾을 수 없습니다.');
    }
    
    const recipientUser = recipientUserDoc.data();
    
    // 이메일 알림 설정이 꺼져있는 경우 알림 X
    if (recipientUser.emailNotifications === false) {
      return { success: true, message: '이메일 알림 설정이 꺼져있습니다.' };
    }
    
    // 댓글 작성자 정보 가져오기
    const authorUserRef = db.collection('users').doc(comment.authorId);
    const authorUserDoc = await authorUserRef.get();
    
    if (!authorUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', '댓글 작성자 정보를 찾을 수 없습니다.');
    }
    
    const authorUser = authorUserDoc.data();
    
    // 이메일 템플릿 로드
    const isReply = comment.parentId !== null;
    const templateName = isReply ? 'reply-notification' : 'comment-notification';
    const template = loadEmailTemplate(templateName);
    
    // 템플릿 데이터 설정
    const templateData = {
      recipientName: recipientUser.displayName || '사용자',
      authorName: authorUser.displayName || '사용자',
      postTitle: post.title,
      commentContent: comment.content,
      postUrl: `https://aimajou.web.app/${collectionName}/${postId}`, // 실제 도메인으로 변경
      unsubscribeUrl: 'https://aimajou.web.app/settings' // 실제 도메인으로 변경
    };
    
    // 이메일 옵션 설정
    const mailOptions = {
      from: '"AIM AJOU" <noreply@aimajou.web.app>', // 실제 발신자 이메일로 변경
      to: recipientUser.email,
      subject: isReply ? '새 답글 알림' : '새 댓글 알림',
      html: template(templateData)
    };
    
    // 이메일 발송
    await smtpTransport.sendMail(mailOptions);
    
    // Firestore에 알림 저장
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      userId: post.authorId,
      authorId: comment.authorId,
      postId,
      commentId,
      collectionName,
      type: isReply ? 'REPLY' : 'COMMENT',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('댓글 알림 전송 중 오류:', error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError('internal', `알림 전송 실패: ${error.message}`);
  }
});

// 신고 제출 함수 (권한 체크 추가)
exports.submitReport = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    // 사용자 상태 확인 (차단된 사용자는 신고 불가)
    await checkUserStatus(context.auth.uid);

    const { reportType, targetId, targetUserId, targetTitle, reason, description } = data;
    
    if (!reportType || !targetId || !targetUserId || !reason) {
      throw new functions.https.HttpsError('invalid-argument', '필수 정보가 누락되었습니다.');
    }

    // 자신을 신고하는 것 방지
    if (context.auth.uid === targetUserId) {
      throw new functions.https.HttpsError('invalid-argument', '자신을 신고할 수 없습니다.');
    }

    // 중복 신고 확인
    const existingReportQuery = await db.collection('reports')
      .where('reporterId', '==', context.auth.uid)
      .where('targetId', '==', targetId)
      .where('targetUserId', '==', targetUserId)
      .where('reportType', '==', reportType)
      .get();

    if (!existingReportQuery.empty) {
      throw new functions.https.HttpsError('already-exists', '이미 신고한 내용입니다.');
    }

    // 신고자 정보 가져오기
    const reporterDoc = await db.collection('users').doc(context.auth.uid).get();
    const reporterData = reporterDoc.exists ? reporterDoc.data() : null;

    // 신고 데이터 저장
    await db.collection('reports').add({
      reporterId: context.auth.uid,
      reporterName: reporterData?.displayName || '알 수 없음',
      reporterEmail: reporterData?.email || '',
      reportType,
      targetId,
      targetUserId,
      targetTitle: targetTitle || '',
      reason,
      description: description || '',
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      action: null
    });

    return { success: true, message: '신고가 접수되었습니다.' };
  } catch (error) {
    console.error('신고 제출 중 오류:', error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError('internal', `신고 제출 실패: ${error.message}`);
  }
});

// 사용자 차단 해제 함수 (관리자용)
exports.unblockUser = functions.https.onCall(async (data, context) => {
  try {
    // 인증 및 관리자 권한 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'ADMIN') {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }

    const { userId } = data;
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', '사용자 ID가 필요합니다.');
    }

    // 사용자 차단 해제
    await db.collection('users').doc(userId).update({
      isBlocked: false,
      isCommentBanned: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: '사용자 차단이 해제되었습니다.' };
  } catch (error) {
    console.error('사용자 차단 해제 중 오류:', error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError('internal', `차단 해제 실패: ${error.message}`);
  }
});

// 내보낼 헬퍼 함수들
exports.checkUserStatus = checkUserStatus;
exports.checkCommentPermission = checkCommentPermission;