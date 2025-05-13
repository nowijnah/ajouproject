// controllers/notifications.js - 최종 수정본
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { loadEmailTemplate, sendEmail } = require("../utils/email");
const { createNotification } = require("../utils/firestore");

// 안전한 로깅 함수 - 순환 참조 방지
function safeLog(message, data) {
  try {
    console.log(message);
    if (typeof data === 'object' && data !== null) {
      // 주요 속성만 로깅
      const safeData = {};
      for (const key in data) {
        const value = data[key];
        if (typeof value !== 'object' || value === null) {
          safeData[key] = value;
        } else {
          safeData[key] = '[객체]';
        }
      }
      console.log(JSON.stringify(safeData, null, 2));
    } else {
      console.log(String(data));
    }
  } catch (error) {
    console.log(`로깅 오류: ${error.message}`);
  }
}

// 댓글 알림 이메일 전송 함수
exports.sendCommentNotification = functions.https.onCall(async (data, context) => {
  try {
    console.log('알림 함수 호출됨');
    safeLog('수신된 데이터:', data);
    
    // 파라미터 추출 - 다양한 가능한 위치에서 검색
    let commentId, postId, collectionName;
    
    // 기본 객체 형태
    if (data && typeof data === 'object') {
      commentId = data.commentId;
      postId = data.postId;
      collectionName = data.collectionName;
    }
    
    // 중첩된 객체 형태 (data.data 패턴)
    if (data && data.data && typeof data.data === 'object') {
      commentId = commentId || data.data.commentId;
      postId = postId || data.data.postId;
      collectionName = collectionName || data.data.collectionName;
    }
    
    // 데이터가 문자열이면 JSON 파싱 시도
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        commentId = commentId || parsed.commentId;
        postId = postId || parsed.postId;
        collectionName = collectionName || parsed.collectionName;
      } catch (e) {
        console.error('문자열을 JSON으로 파싱 실패:', e.message);
      }
    }
    
    console.log(`추출된 파라미터: commentId=${commentId}, postId=${postId}, collectionName=${collectionName}`);
    
    // 필수 파라미터 검증
    if (!commentId) {
      console.error('commentId가 누락됨');
      throw new functions.https.HttpsError('invalid-argument', '댓글 ID가 누락되었습니다.');
    }
    
    if (!postId) {
      console.error('postId가 누락됨');
      throw new functions.https.HttpsError('invalid-argument', '게시물 ID가 누락되었습니다.');
    }
    
    if (!collectionName) {
      console.error('collectionName이 누락됨');
      throw new functions.https.HttpsError('invalid-argument', '컬렉션 이름이 누락되었습니다.');
    }
    
    console.log(`유효한 파라미터 확인: commentId=${commentId}, postId=${postId}, collectionName=${collectionName}`);
    
    const db = admin.firestore();
    
    // 댓글 정보 가져오기
    console.log(`댓글 문서 조회: ${collectionName}_comments/${commentId}`);
    const commentRef = db.collection(`${collectionName}_comments`).doc(commentId);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      console.error(`댓글을 찾을 수 없음: ${commentId}`);
      throw new functions.https.HttpsError('not-found', '댓글을 찾을 수 없습니다.');
    }
    
    const comment = commentDoc.data();
    console.log('댓글 데이터 확인:', comment.authorId);
    
    // 게시물 정보 가져오기
    console.log(`게시물 문서 조회: ${collectionName}/${postId}`);
    const postRef = db.collection(collectionName).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      console.error(`게시물을 찾을 수 없음: ${postId}`);
      throw new functions.https.HttpsError('not-found', '게시물을 찾을 수 없습니다.');
    }
    
    const post = postDoc.data();
    console.log('게시물 제목:', post.title);
    
    // 자신의 게시물에 자신이 댓글을 작성한 경우도 알림 전송
    if (post.authorId === comment.authorId) {
      console.log('자신의 게시물에 댓글 작성 - 알림 전송함 (자기 알림 활성화)');
    }
    
    // 게시물 작성자 정보 가져오기
    console.log(`게시물 작성자 정보 조회: users/${post.authorId}`);
    const recipientUserRef = db.collection('users').doc(post.authorId);
    const recipientUserDoc = await recipientUserRef.get();
    
    if (!recipientUserDoc.exists) {
      console.error(`게시물 작성자 정보를 찾을 수 없음: ${post.authorId}`);
      throw new functions.https.HttpsError('not-found', '게시물 작성자 정보를 찾을 수 없습니다.');
    }
    
    const recipientUser = recipientUserDoc.data();
    console.log('수신자 정보:', recipientUser.displayName);
    
    // 댓글 작성자 정보 가져오기
    console.log(`댓글 작성자 정보 조회: users/${comment.authorId}`);
    const authorUserRef = db.collection('users').doc(comment.authorId);
    const authorUserDoc = await authorUserRef.get();
    
    if (!authorUserDoc.exists) {
      console.error(`댓글 작성자 정보를 찾을 수 없음: ${comment.authorId}`);
      throw new functions.https.HttpsError('not-found', '댓글 작성자 정보를 찾을 수 없습니다.');
    }
    
    const authorUser = authorUserDoc.data();
    console.log('작성자 정보:', authorUser.displayName);
    
    // Firestore에 알림 저장 (이메일 전송 성공 여부와 무관하게 저장)
    const isReply = comment.parentId !== null;
    console.log(`알림 타입: ${isReply ? '답글' : '댓글'}`);
    
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
    
    console.log(`알림 데이터 저장 완료: ${notificationRef.id}`);
    
    // 이메일 알림 설정이 꺼져있는 경우 이메일 발송 X
    if (recipientUser.emailNotifications === false) {
      console.log(`이메일 알림 설정이 꺼져있음: ${recipientUser.email}`);
      return { 
        success: true, 
        message: '이메일 알림 설정이 꺼져있어 앱 내 알림만 전송되었습니다.' 
      };
    }
    
    try {
      // 이메일 템플릿 로드
      const templateName = isReply ? 'reply-notification' : 'comment-notification';
      console.log(`템플릿 로드 시도: ${templateName}`);
      const template = loadEmailTemplate(templateName);
      
      // 템플릿 데이터 설정
      const templateData = {
        recipientName: recipientUser.displayName || '사용자',
        authorName: authorUser.displayName || '사용자',
        postTitle: post.title || '게시물',
        commentContent: comment.content || '',
        postUrl: `https://aimajou.web.app/${collectionName}/${postId}`,
        unsubscribeUrl: 'https://aimajou.web.app/settings',
        isReply: isReply
      };
      
      // 이메일 옵션 설정
      const mailOptions = {
        from: '"AIM AJOU" <noreply@aimajou.web.app>',
        to: recipientUser.email,
        subject: isReply ? '새 답글 알림' : '새 댓글 알림',
        html: template(templateData)
      };
      
      console.log('이메일 발송 준비 완료:', recipientUser.email);
      
      // 이메일 발송
      await sendEmail(mailOptions);
      console.log('이메일 발송 성공');
      
      return { 
        success: true,
        emailSent: true
      };
    } catch (emailError) {
      console.error('이메일 발송 실패:', emailError.message);
      // 이메일 실패해도 알림은 이미 저장됨
      return { 
        success: true, 
        emailSent: false,
        emailError: true, 
        message: '앱 내 알림은 저장되었지만 이메일 발송에 실패했습니다.'
      };
    }
  } catch (error) {
    console.error('댓글 알림 처리 중 오류:', error);
    throw new functions.https.HttpsError('internal', `알림 처리 실패: ${error.message}`);
  }
});

// 앱 내 알림 읽음 처리 함수
exports.markNotificationAsRead = functions.https.onCall(async (data, context) => {
  try {
    const { notificationId } = data;
    
    if (!notificationId || !context.auth) {
      throw new functions.https.HttpsError('invalid-argument', '필수 정보가 누락되었거나 인증되지 않았습니다.');
    }
    
    const db = admin.firestore();
    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();
    
    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError('not-found', '알림을 찾을 수 없습니다.');
    }
    
    const notification = notificationDoc.data();
    
    // 본인의 알림만 읽음 처리 가능
    if (notification.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '권한이 없습니다.');
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
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const { emailNotifications } = data;
    
    if (emailNotifications === undefined) {
      throw new functions.https.HttpsError('invalid-argument', '알림 설정이 지정되지 않았습니다.');
    }
    
    const db = admin.firestore();
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

// 이메일 발송 테스트 함수 (notifications.js 파일 맨 아래에 추가)
exports.testEmailSending = functions.https.onCall(async (data, context) => {
  try {
    // SMTP 연결 테스트
    const { smtpTransport, sendEmail } = require("../utils/email");
    
    const testResult = await smtpTransport.verify();
    console.log('SMTP 연결 테스트 결과:', testResult);
    
    // 간단한 이메일 발송 테스트
    const mailOptions = {
      from: '"AIM AJOU" <noreply@aimajou.web.app>',
      to: data.testEmail || "your-test-email@gmail.com",
      subject: '이메일 발송 테스트',
      html: '<h1>이메일 테스트</h1><p>이메일 발송 기능이 정상적으로 작동합니다.</p>'
    };
    
    const result = await sendEmail(mailOptions);
    console.log('테스트 이메일 발송 성공:', result);
    
    return { 
      success: true, 
      smtpTest: testResult, 
      emailSent: true, 
      messageId: result.messageId 
    };
  } catch (error) {
    console.error('이메일 테스트 중 오류:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
});