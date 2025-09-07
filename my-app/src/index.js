// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css'; 
// ↑ 전역 스타일을 한 곳에서 import 합니다. CRA 기준으로 index.js에서 import하면 전체에 적용됩니다.

import App from './App';

/*
  React 18부터는 createRoot API를 사용합니다.
  - root 엘리먼트(#root)에 React 앱을 마운트합니다.
  - StrictMode는 개발 중 잠재적 문제를 두 번 렌더링하여 경고를 주므로 초보자라면
    "왜 두 번 호출되지?" 혼란이 있을 수 있습니다. 학습 편의를 위해 제거해도 됩니다.
*/
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
