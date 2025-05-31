import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AnimatedLoading from "../common/AnimatedLoading";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 활동시간 업데이트 함수
  const updateLastActivity = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating last activity:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 로그인 차단 확인
            if (userData.isBlocked === true) {
              alert('이 계정은 차단되어 로그인할 수 없습니다. 관리자에게 문의하세요.');
              await signOut(auth);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            
            // admin 필드와 currentRole을 기반으로 현재 역할 결정
            const isAdmin = userData.admin === true;
            const currentRole = userData.currentRole || userData.role || "STUDENT";
            
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: currentRole,
              admin: userData.admin || false,
              originalRole: userData.originalRole || userData.role || "STUDENT",
              currentRole: currentRole,
              // 차단 관련 상태 명확히 설정
              isBlocked: userData.isBlocked || false,
              isCommentBanned: userData.isCommentBanned || false,
              ...(userData.role === "STUDENT" || userData.role === "PROFESSOR" || userData.role === "STAFF"
                ? { major: userData.major || "정보 없음" }
                : {}),
              ...userData,
            });

            // 로그인 시 활동시간 업데이트
            await updateLastActivity(user.uid);
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // 2. Google 로그인 함수 수정 (차단 체크 강화)
const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
  provider.addScope("https://www.googleapis.com/auth/userinfo.email");
  provider.addScope("https://www.googleapis.com/auth/user.emails.read");
  provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential.accessToken;
  const user = result.user;

  if (!user.email.endsWith("@ajou.ac.kr")) {
    throw new Error("아주대학교 계정만 사용 가능합니다.");
  }

  // 기존 사용자 정보 확인 및 차단 상태 체크
  const userDoc = await getDoc(doc(db, "users", user.uid));
  let existingUserData = null;
  
  if (userDoc.exists()) {
    existingUserData = userDoc.data();
    
    // 차단 상태 확인 강화
    if (existingUserData.isBlocked === true) {
      await signOut(auth);
      throw new Error("이 계정은 관리자에 의해 차단되어 로그인할 수 없습니다.\n문의사항이 있으시면 관리자에게 연락해주세요.");
    }
  }

    let role = "STUDENT";
    let major = null;

    if (token) {
      try {
        const response = await fetch(
          "https://people.googleapis.com/v1/people/me?personFields=organizations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        console.log("Google People API 응답 데이터:", data);
    
        const organizations = data.organizations || [];
        const university = organizations.find((org) => org.metadata?.primary);
    
        if (university) {
          major = university.department || "정보 없음"; 
          console.log("학과 정보:", major);
    
          if (university.jobDescription && university.jobDescription.includes("교원")) {
            role = "PROFESSOR";
          } else if (university.jobDescription && university.jobDescription.includes("직원")) {
            role = "STAFF";
          }
        } else {
          console.warn("Google People API에서 학과 정보를 찾을 수 없음.");
        }
      } catch (error) {
        console.error("Google People API 호출 실패:", error);
      }
    }
    
    const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    admin: existingUserData?.admin || false,
    originalRole: existingUserData?.originalRole || role,
    currentRole: existingUserData?.currentRole || role,
    // 차단 관련 상태 보존 및 초기화
    isBlocked: existingUserData?.isBlocked || false,
    isCommentBanned: existingUserData?.isCommentBanned || false,
    createdAt: existingUserData?.createdAt || serverTimestamp(),
    lastActivity: serverTimestamp(),
  };

    if (role === "STUDENT" || role === "PROFESSOR") {
      userData.major = major || "정보 없음";
    } else if (role === "STAFF") {
      userData.department = major || "정보 없음"; 
    }

    // **핵심 수정: 기존 사용자인 경우에도 안전하게 데이터 업데이트**
    if (existingUserData) {
      // 기존 사용자: 필요한 필드만 업데이트 (merge: true 옵션 사용)
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        // 추가적으로 보존해야 할 기존 필드들이 있다면 여기에 추가
        ...existingUserData,
        // 업데이트가 필요한 필드들은 새 값으로 덮어쓰기
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastActivity: serverTimestamp(),
      }, { merge: true });
    } else {
      // 새 사용자: 전체 데이터 생성
      await setDoc(doc(db, "users", user.uid), userData);
    }

    setCurrentUser({
      ...userData,
      createdAt: existingUserData?.createdAt?.toDate() || new Date(),
      lastActivity: new Date()
    });

    return result;
  };

  const signUpWithEmail = async (email, password, companyName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: companyName,
      role: "COMPANY",
      // 기업 계정도 기본적으로 admin은 false
      admin: false,
      originalRole: "COMPANY",
      currentRole: "COMPANY", // 현재 역할도 설정
      // 차단 관련 상태 초기화
      isBlocked: false,
      isCommentBanned: false,
      createdAt: new Date(),
      lastActivity: new Date(), // 가입 시 활동시간 설정
    });

    return user;
  };

  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 로그인 전 차단 상태 확인
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.isBlocked === true) {
        await signOut(auth);
        throw new Error("이 계정은 차단되어 로그인할 수 없습니다. 관리자에게 문의하세요.");
      }
    }
    
    // 이메일 로그인 시에도 활동시간 업데이트
    await updateLastActivity(userCredential.user.uid);
    
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const value = { 
    currentUser, 
    loading, 
    loginWithGoogle, 
    signUpWithEmail, 
    loginWithEmail, 
    logout,
    updateLastActivity, // 활동시간 업데이트 함수 노출
    // admin 필드만 확인 (currentRole과 상관없이)
    isAdmin: currentUser?.admin === true
  };
  
  if (loading) {
    return <AnimatedLoading message="사용자 정보를 불러오는 중입니다" fullPage={true} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const checkAdminRole = async (userId) => {
  if (!userId) return false;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // admin 필드가 true인지 확인
      return userData.admin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};