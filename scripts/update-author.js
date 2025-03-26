const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  // config 내용
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAuthor() {
  try {
    await updateDoc(doc(db, 'users', 'softcon-author'), {
      userId: 'softcon-author'  // 이 필드 추가
    });
    console.log('Author updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating author:', error);
    process.exit(1);
  }
}

updateAuthor();