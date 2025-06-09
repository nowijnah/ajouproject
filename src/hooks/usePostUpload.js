import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * 게시물 업로드 및 수정 기능을 제공하는 커스텀 훅
 * @param {string} collectionName - 컬렉션 이름 (portfolios, labs, companies)
 * @param {string} postId - 수정 시 사용할 게시물 ID (선택 사항)
 * @param {Object} currentUser - 현재 로그인한 사용자 정보
 */
const usePostUpload = (collectionName, postId, currentUser) => {
  const navigate = useNavigate();
  
  // 기본 정보 상태
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // 첨부 파일 관련 상태
  const [thumbnail, setThumbnail] = useState(null);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [keywords, setKeywords] = useState([]);
  
  // 초기 데이터 로딩 (수정 모드)
  useEffect(() => {
    const fetchPost = async () => {
      if (postId && postId !== 'preview-id') {
        try {
          const postDoc = await getDoc(doc(db, collectionName, postId));
          if (postDoc.exists()) {
            const data = postDoc.data();
            
            // 기본 정보 설정
            setTitle(data.title || '');
            setSubtitle(data.subtitle || '');
            setMarkdownContent(data.content || '');
            setThumbnail(data.thumbnail || null);
            setKeywords(data.keywords || []);
            
            // 파일 데이터 설정
            if (data.files) {
              setFiles(data.files.map(file => ({
                ...file,
                fileId: file.fileId || `file-${Date.now()}-${Math.random()}`
              })));
            }
            
            // 링크 데이터 설정
            if (data.links) {
              setLinks(data.links.map(link => ({
                ...link,
                linkId: link.linkId || `link-${Date.now()}-${Math.random()}`
              })));
            }
          }
        } catch (error) {
          console.error('Error loading post:', error);
        }
      }
    };
  
    fetchPost();
  }, [postId, collectionName]);

  // 파일 관련 핸들러
  const handleDrop = (e, textAreaRef) => {
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length > 0 && textAreaRef.current) {
      const cursorPosition = textAreaRef.current.selectionStart;
      
      for (const file of validFiles) {
        const markdown = file.type === 'application/pdf' 
          ? `[PDF: ${file.name}](${URL.createObjectURL(file)})\n`
          : `![${file.name}](${URL.createObjectURL(file)})\n`;
        
        const newContent = markdownContent.slice(0, cursorPosition) + 
                    markdown + 
                    markdownContent.slice(cursorPosition);
        
        setMarkdownContent(newContent);
        
        const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'PDF';
        handleAddFile({
          fileId: `file-${Date.now()}-${Math.random()}`,
          file: file,
          type: fileType,
          description: ''
        });
      }
    }
  };

  // 파일 추가
  const handleAddFile = (fileData) => {
    setFiles(prev => [...prev, fileData]);
  };

  // 파일 설명 업데이트
  const handleUpdateFileDescription = (fileId, description) => {
    setFiles(prev => prev.map(file => 
      file.fileId === fileId ? { ...file, description } : file
    ));
  };

  // 파일 삭제
  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.fileId !== fileId));
  };

  // 링크 추가
  const handleAddLink = (linkData) => {
    setLinks(prev => [...prev, linkData]);
  };

  // 링크 삭제
  const handleRemoveLink = (linkId) => {
    setLinks(prev => prev.filter(link => link.linkId !== linkId));
  };

  // 키워드 추가
  const handleAddKeyword = (keyword) => {
    setKeywords(prev => [...prev, keyword]);
  };

  // 키워드 삭제
  const handleRemoveKeyword = (keyword) => {
    setKeywords(prev => prev.filter(kw => kw !== keyword));
  };

  // 썸네일 설정
  const handleSetThumbnail = (file) => {
    setThumbnail(file);
  };

  // 썸네일 삭제
  const handleRemoveThumbnail = () => {
    setThumbnail(null);
  };

  // 게시물 제출 (저장/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || !currentUser) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let thumbnailUrl = thumbnail;

      if (!thumbnail) {
        const imageFile = files.find(fileItem => fileItem.type === 'IMAGE' && fileItem.file);
        if (imageFile) {
          const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}-${imageFile.file.name}`);
          const thumbnailSnapshot = await uploadBytes(thumbnailRef, imageFile.file);
          thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
        }
      } 
      // 새로운 썸네일이 File 객체인 경우 업로드
      else if (thumbnail instanceof File) {
        const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}-${thumbnail.name}`);
        const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
      }

      // 2. 파일 업로드
      const uploadedFiles = await Promise.all(
        files.map(async (fileItem) => {
          // 이미 업로드된 파일은 그대로 사용
          if (fileItem.url) {
            return fileItem;
          }
          
          // 새로운 파일 업로드
          const fileRef = ref(storage, `files/${currentUser.uid}/${Date.now()}-${fileItem.file.name}`);
          const fileSnapshot = await uploadBytes(fileRef, fileItem.file);
          const url = await getDownloadURL(fileSnapshot.ref);
          
          return {
            fileId: fileItem.fileId,
            url: url,
            filename: fileItem.file.name,
            type: fileItem.type,
            description: fileItem.description
          };
        })
      );

      const updatedData = {
        title,
        subtitle,
        content: markdownContent,
        files: uploadedFiles,
        links,
        thumbnail: thumbnailUrl,
        keywords,
        updatedAt: serverTimestamp()
      };

      if (postId && postId !== 'preview-id') {
        await updateDoc(doc(db, collectionName, postId), updatedData);
        alert('게시글이 수정되었습니다.');
        navigate(`/${collectionName}/${postId}`);
      } else {
        // 새 게시물 작성 모드
        updatedData.authorId = currentUser.uid;
        updatedData.likeCount = 0;
        updatedData.commentCount = 0;
        updatedData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, collectionName), updatedData);
        alert('게시글이 작성되었습니다.');
        navigate(`/${collectionName}/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      alert(`업로드 중 오류 발생: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 미리보기 토글
  const togglePreview = () => {
    setIsPreview(prev => !prev);
  };

  // 데이터를 객체로 반환
  return {
    // 기본 정보 상태 및 설정
    title,
    setTitle,
    subtitle,
    setSubtitle,
    markdownContent,
    setMarkdownContent,
    isSubmitting,
    isPreview,
    togglePreview,
    
    // 파일 및 메타데이터 상태
    thumbnail,
    files,
    links,
    keywords,
    
    // 핸들러 함수
    handleDrop,
    handleAddFile,
    handleUpdateFileDescription,
    handleRemoveFile,
    handleAddLink,
    handleRemoveLink,
    handleAddKeyword,
    handleRemoveKeyword,
    handleSetThumbnail,
    handleRemoveThumbnail,
    handleSubmit,
    
    // 미리보기용 데이터
    previewData: {
      postId: postId || 'preview-id',
      authorId: currentUser?.uid,
      title,
      subtitle,
      content: markdownContent,
      files,
      links,
      likeCount: 0,
      commentCount: 0,
      thumbnail,
      createdAt: new Date(),
      updatedAt: new Date(),
      keywords
    },
    previewAuthor: currentUser ? {
      id: currentUser.uid,
      displayName: currentUser.displayName,
      profileImage: currentUser.photoURL,
      role: currentUser.role || 'STUDENT'
    } : null
  };
};

export default usePostUpload;