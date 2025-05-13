// utils/firestore.js
const admin = require("firebase-admin");

// URL을 절대 경로로 변환
function getAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://softcon.ajou.ac.kr${url.startsWith('/') ? '' : '/'}${url}`;
}

// 소프트콘 작성자 정보 생성 함수
async function ensureAuthorDocument(db) {
  try {
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
    return true;
  } catch (error) {
    console.error("소프트콘 작성자 정보 생성 중 오류:", error);
    return false;
  }
}

// 알림 생성 함수
async function createNotification(db, data) {
  try {
    // 필수 필드 검증
    if (!data.userId) {
      console.error("알림 생성 실패: userId 누락");
      throw new Error("알림 생성에 필요한 userId가 누락되었습니다.");
    }
    
    if (!data.authorId) {
      console.error("알림 생성 실패: authorId 누락");
      throw new Error("알림 생성에 필요한 authorId가 누락되었습니다.");
    }
    
    if (!data.postId) {
      console.error("알림 생성 실패: postId 누락");
      throw new Error("알림 생성에 필요한 postId가 누락되었습니다.");
    }
    
    if (!data.commentId) {
      console.error("알림 생성 실패: commentId 누락");
      throw new Error("알림 생성에 필요한 commentId가 누락되었습니다.");
    }
    
    if (!data.type) {
      console.error("알림 생성 실패: type 누락");
      throw new Error("알림 생성에 필요한 type이 누락되었습니다.");
    }

    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      userId: data.userId,
      authorId: data.authorId,
      postId: data.postId,
      commentId: data.commentId,
      collectionName: data.collectionName || '',
      type: data.type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`알림 생성 성공: ${data.type}, ID: ${notificationRef.id}`);
    return notificationRef.id;
  } catch (error) {
    console.error("알림 생성 중 오류:", error);
    throw error;
  }
}

// 사용자 데이터 가져오기
async function getUserData(db, userId) {
  try {
    if (!userId) {
      console.error("사용자 데이터 조회 실패: userId 누락");
      throw new Error("사용자 ID가 필요합니다.");
    }
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log(`사용자를 찾을 수 없음: ${userId}`);
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error(`사용자 데이터 조회 중 오류 (ID: ${userId}):`, error);
    return null;
  }
}

// 문서 존재 여부 확인
async function documentExists(db, collection, docId) {
  try {
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();
    return doc.exists;
  } catch (error) {
    console.error(`문서 존재 확인 중 오류 (${collection}/${docId}):`, error);
    return false;
  }
}

module.exports = {
  getAbsoluteUrl,
  ensureAuthorDocument,
  createNotification,
  getUserData,
  documentExists
};