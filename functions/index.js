// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 로컬 개발 환경에서는 .env 파일 로드
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log('로컬 환경: .env 파일에서 환경 변수를 로드했습니다.');
  } catch (error) {
    console.warn('.env 파일 로드 실패:', error.message);
  }
}

// 환경 변수 설정
try {
  // Firebase 환경에서는 functions.config()에서 환경 변수 로드
  if (functions.config().smtp) {
    if (!process.env.SMTP_ADDRESS) process.env.SMTP_ADDRESS = functions.config().smtp.address;
    if (!process.env.SMTP_PORT) process.env.SMTP_PORT = functions.config().smtp.port;
    if (!process.env.SMTP_USER_NAME) process.env.SMTP_USER_NAME = functions.config().smtp.user_name;
    if (!process.env.SMTP_PASSWORD) process.env.SMTP_PASSWORD = functions.config().smtp.password;
    if (!process.env.SMTP_DOMAIN) process.env.SMTP_DOMAIN = functions.config().smtp.domain;
    if (!process.env.SMTP_AUTHENTICATION) process.env.SMTP_AUTHENTICATION = functions.config().smtp.authentication;
    if (!process.env.SMTP_ENABLE_STARTTLS_AUTO) process.env.SMTP_ENABLE_STARTTLS_AUTO = functions.config().smtp.enable_starttls_auto;
    if (!process.env.SMTP_TLS) process.env.SMTP_TLS = functions.config().smtp.tls;
    if (!process.env.SMTP_OPENSSL_VERIFY_MODE) process.env.SMTP_OPENSSL_VERIFY_MODE = functions.config().smtp.openssl_verify_mode;
    if (!process.env.SMTP_POOL) process.env.SMTP_POOL = functions.config().smtp.pool;
    
    // 하위 호환성 유지를 위한 설정
    process.env.SMTP_EMAIL = process.env.SMTP_USER_NAME;
  }
  
  // 주요 환경 변수 확인
  if (!process.env.SMTP_USER_NAME || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP 계정 정보가 설정되지 않았습니다.");
  }
} catch (error) {
  console.error("환경 변수 설정 중 오류 발생:", error);
}

// Firebase 초기화
admin.initializeApp();

// 각 컨트롤러 모듈 불러오기
const termsController = require("./controllers/terms");
const softconController = require("./controllers/softcon");
const notificationsController = require("./controllers/notifications");

// 모듈별 함수 내보내기
exports.getSoftconTerms = termsController?.getSoftconTerms;
exports.crawlSoftconData = softconController?.crawlSoftconData;
exports.sendCommentNotification = notificationsController.sendCommentNotification;
exports.markNotificationAsRead = notificationsController.markNotificationAsRead;
exports.updateNotificationSettings = notificationsController.updateNotificationSettings;

// functions/index.js 파일에 다음 내보내기 추가
exports.testEmailSending = notificationsController.testEmailSending;