const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');

require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const projectsData = JSON.parse(fs.readFileSync('./softcon_data/project_details.json', 'utf8'));

async function createAuthorDocument() {
  const authorDoc = doc(db, 'users', 'softcon-author');
  
  const authorData = {
    displayName: "아주대학교 소프트콘",
    role: "ADMIN",
    profileImage: "/path/to/softcon-logo.png",
    email: "softcon@ajou.ac.kr",
    createdAt: serverTimestamp()
  };
  
  try {
    await setDoc(authorDoc, authorData);
    console.log("작성자 정보 생성 완료");
  } catch (error) {
    console.error("작성자 정보 생성 오류:", error);
  }
}

async function uploadToFirestore() {
  const softconCollection = collection(db, 'softcon_projects');
  
  for (const project of projectsData) {
    if (!project.uid) continue; 
    
    const projectDoc = doc(softconCollection, project.uid);
    
    const firestoreData = {
      title: project.title || "제목 없음",
      subtitle: "소프트콘 프로젝트",
      content: project.summary || project.textContent || "",
      keywords: project.teamInfo?.members?.map(m => m.name) || [],
      thumbnail: project.representativeImage || "",
      files: project.images?.map((img, idx) => ({
        fileId: `img-${idx}`,
        type: 'IMAGE',
        filename: `이미지 ${idx+1}`,
        url: img
      })) || [],
      links: [
        ...(project.gitRepository ? [{
          linkId: 'git',
          type: 'GITHUB',
          title: 'GitHub 저장소',
          url: project.gitRepository
        }] : []),
        ...(project.presentationUrl ? [{
          linkId: 'presentation',
          type: 'LINK',
          title: '발표자료',
          url: project.presentationUrl
        }] : []),
        ...(project.videoUrl ? [{
          linkId: 'video',
          type: 'YOUTUBE',
          title: '발표 동영상',
          url: project.videoUrl
        }] : [])
      ],
      authorId: "softcon-author",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: parseInt(project.likeCount || 0),
      commentCount: parseInt(project.commentCount || 0),
      sourceUrl: project.url,
      originalData: project // 원본 데이터도 저장해두면 나중에 유용????? 무슨 원본 데이터야
    };
    
    try {
      await setDoc(projectDoc, firestoreData);
      console.log(`성공적으로 업로드됨: ${project.uid}`);
    } catch (error) {
      console.error(`업로드 오류 (${project.uid}):`, error);
    }
  }
  
  console.log('모든 데이터 업로드 완료!');
}

async function main() {
    try {
      await createAuthorDocument();
      
      await uploadToFirestore();
      
      console.log('모든 작업이 완료되었습니다.');
      
      process.exit(0);
    } catch (error) {
      console.error('오류 발생:', error);
      process.exit(1);
    }
  }

main().catch(console.error);