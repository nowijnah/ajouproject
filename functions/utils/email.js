// utils/email.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// SMTP 설정 - 환경 변수 사용
const smtpConfig = {
  host: process.env.SMTP_ADDRESS || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER_NAME, 
    pass: process.env.SMTP_PASSWORD  
  },
  authentication: process.env.SMTP_AUTHENTICATION || "login",
  enableStartTls: process.env.SMTP_ENABLE_STARTTLS_AUTO === "true" || true,
  tls: process.env.SMTP_TLS === "true" || false,
  tlsOptions: {
    rejectUnauthorized: process.env.SMTP_OPENSSL_VERIFY_MODE === "peer" || true
  },
  pool: process.env.SMTP_POOL === "true" || false,
  debug: true // 디버깅 활성화
};

// 설정 로깅 (비밀번호 제외)
console.log('SMTP 설정 (비밀번호 제외):', {
  ...smtpConfig,
  auth: { user: smtpConfig.auth.user, pass: '********' }
});

const smtpTransport = nodemailer.createTransport(smtpConfig);

// 이메일 템플릿 로드 함수 - 기존 작동했던 코드 기반
function loadEmailTemplate(templateName) {
  try {
    // 템플릿 경로는 리팩토링된 구조에 맞춰 변경
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    console.log('템플릿 파일 경로:', templatePath);
    
    // 템플릿 파일 존재 확인
    if (!fs.existsSync(templatePath)) {
      console.error(`템플릿 파일이 존재하지 않습니다: ${templatePath}`);
      
      // 기본 템플릿 반환 (파일이 없는 경우)
      return (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.isReply ? '새 답글 알림' : '새 댓글 알림'}</title>
        </head>
        <body>
          <h2>${data.isReply ? '새 답글 알림' : '새 댓글 알림'}</h2>
          <p>안녕하세요, ${data.recipientName}님!</p>
          <p>${data.authorName}님이 회원님의 ${data.isReply ? '댓글에 답글' : '게시글에 댓글'}을 남겼습니다.</p>
          <div style="margin: 20px 0; padding: 10px; border-left: 4px solid #007bff; background-color: #f8f9fa;">
            <p>${data.commentContent}</p>
          </div>
          <p><a href="${data.postUrl}" style="color: #007bff; text-decoration: none;">게시글 보러가기</a></p>
          <p style="color: #6c757d; font-size: 0.8em; margin-top: 30px;">
            이메일 수신을 원하지 않으시면 <a href="${data.unsubscribeUrl}" style="color: #007bff;">여기</a>를 클릭하여 설정을 변경하세요.
          </p>
        </body>
        </html>
      `;
    }
    
    // 템플릿 파일이 존재하면 로드하여 컴파일
    const template = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(template);
  } catch (error) {
    console.error(`템플릿 로드 중 오류: ${error.message}`);
    console.error(error.stack);
    
    // 오류 발생 시 기본 템플릿 반환
    return (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>알림</title>
      </head>
      <body>
        <h2>${data.isReply ? '새 답글 알림' : '새 댓글 알림'}</h2>
        <p>새 알림이 있습니다. 사이트에서 확인해주세요.</p>
        <p><a href="${data.postUrl}">게시글 바로가기</a></p>
      </body>
      </html>
    `;
  }
}

// 이메일 전송 함수
async function sendEmail(options) {
  try {
    console.log('이메일 전송 시도:', options.to);
    
    const result = await smtpTransport.sendMail(options);
    console.log('이메일 전송 성공:', options.to, result.messageId);
    return result;
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    
    // SMTP 연결 테스트
    try {
      console.log('SMTP 연결 테스트 시도...');
      await smtpTransport.verify();
      console.log('SMTP 연결 테스트 성공');
    } catch (verifyError) {
      console.error('SMTP 연결 테스트 실패:', verifyError);
    }
    
    throw error;
  }
}

module.exports = {
  smtpTransport,
  loadEmailTemplate,
  sendEmail
};