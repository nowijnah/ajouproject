
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
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
              admin: userData.admin || false,
              ...(userData.role === "STUDENT" || userData.role === "PROFESSOR" || userData.role === "STAFF"
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
    provider.addScope("https://www.googleapis.com/auth/user.emails.read");
    provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    
    provider.setCustomParameters({
      'hd': 'ajou.ac.kr'
    });

    let result = null;
    let user = null;

    try {
      result = await signInWithPopup(auth, provider);
      user = result.user;

      if (!user.email.endsWith("@ajou.ac.kr")) {
        await deleteUser(user);
        
        try {
          await deleteDoc(doc(db, "users", user.uid));
        } catch (firestoreError) {
          console.warn("Firestore 문서 삭제 실패 (문서가 존재하지 않을 수 있음):", firestoreError);
        }
        
        throw new Error("아주대학교 계정만 사용 가능합니다.");
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

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
        admin: false,
        createdAt: serverTimestamp(),
      };

      if (role === "STUDENT" || role === "PROFESSOR") {
        userData.major = major || "정보 없음";
      } else if (role === "STAFF") {
        userData.department = major || "정보 없음"; 
      }

      await setDoc(doc(db, "users", user.uid), userData);
      setCurrentUser(userData);

      return result;

    } catch (error) {
      // 도메인 체크 실패로 인한 사용자 삭제 후 에러가 발생한 경우
      // 또는 기타 에러가 발생한 경우 처리
      console.error("Google 로그인 실패:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, companyName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: companyName,
      role: "DEFAULT",
      admin: false,
      createdAt: new Date(),
    });

    return user;
  };

  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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