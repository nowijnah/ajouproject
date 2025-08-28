import React from 'react';
// import ReactDOM from 'react-dom'; 
import App from './App';
import './firebase'; // Firebase가 앱 시작과 동시에 초기화되도록 보장

import { createRoot } from 'react-dom/client'; // React 18용
const container = document.getElementById('app'); // 'app' ID를 가진 DOM 요소를 가져옵니다.
const root = createRoot(container); // createRoot를 사용하여 root 생성

root.render(
  <React.StrictMode> {/* React.StrictMode를 다시 추가하여 잠재적 문제 경고 활성화 */}
    <App />
  </React.StrictMode>
);