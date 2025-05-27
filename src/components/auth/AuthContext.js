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
            
            // admin 필드와 currentRole을 기반으로 현재 역할 결정
            const isAdmin = userData.admin === true;
            const currentRole = userData.currentRole || userData.role || "STUDENT";
            
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              // 현재 역할 (관리자 모드 전환 시 변경됨)
              role: currentRole,
              // admin 필드 값 보존
              admin: userData.admin || false,
              // 원래 역할 저장 (최초 가입 시의 역할)
              originalRole: userData.originalRole || userData.role || "STUDENT",
              // 현재 역할 저장
              currentRole: currentRole,
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
      // 기본적으로 admin은 false (Firebase Console에서 수동으로 true로 변경해야 함)
      admin: false,
      originalRole: role,
      currentRole: role, // 현재 역할도 초기에는 원래 역할과 동일
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(), // 가입 시 활동시간 설정
    };

    if (role === "STUDENT" || role === "PROFESSOR") {
      userData.major = major || "정보 없음";
    } else if (role === "STAFF") {
      userData.department = major || "정보 없음"; 
    }

    await setDoc(doc(db, "users", user.uid), userData);
    setCurrentUser({
      ...userData,
      createdAt: new Date(),
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
      createdAt: new Date(),
      lastActivity: new Date(), // 가입 시 활동시간 설정
    });

    return user;
  };

  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
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