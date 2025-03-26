const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

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