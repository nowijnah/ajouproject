// src/components/auth/AuthContext.js - 수정된 부분

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AnimatedLoading from "../common/AnimatedLoading";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: userData.role || "DEFAULT",
              // admin 필드 추가 - 기본값은 false
              admin: userData.admin || false,
              ...(userData.role === "STUDENT" || userData.role === "PROFESSOR"
                ? { major: userData.major || "정보 없음" }
                : {}),
              ...userData,
            });
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
    provider.addScope("https://www.googleapis.com/auth/user.emails.read"); // ✅ 변경된 올바른 범위
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
        console.log("Google People API 응답 데이터:", data); // 응답 확인
    
        const organizations = data.organizations || [];
        const university = organizations.find((org) => org.metadata?.primary);
    
        if (university) {
          major = university.department || "정보 없음"; 
          console.log("학과 정보:", major);
    
          if (university.jobDescription && university.jobDescription.includes("교원")) {
            role = "PROFESSOR"; // 교수이면 역할 변경
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
      // admin 필드 추가 - 기본값은 false
      admin: false,
      createdAt: serverTimestamp(),
    };

    if (role === "STUDENT" || role === "PROFESSOR") {
      userData.major = major || "정보 없음";
    }

    await setDoc(doc(db, "users", user.uid), userData);
    setCurrentUser(userData);

    return result;
  };

  const signUpWithEmail = async (email, password, companyName) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: companyName,
      role: "DEFAULT",
      // admin 필드 추가 - 기본값은 false
      admin: false,
      createdAt: new Date(),
    });

    return user;
  };

  const loginWithEmail = async (email, password) => {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
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
    isAdmin: currentUser?.role === 'ADMIN'
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
      return userData.role === 'ADMIN';
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