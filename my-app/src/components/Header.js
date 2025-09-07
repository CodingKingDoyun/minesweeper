// src/components/Header.js
import React from 'react';
import useTimer from '../hooks/useTimer';

/*
  Header 컴포넌트는 상단 정보 표시줄입니다.
  - 남은 깃발(=지뢰) 수
  - 타이머 (게임 중에만 증가)
  - 리셋 버튼(스마일 아이콘 느낌)
  - 난이도 선택 드롭다운
  모든 상태는 App에서 내려받고, 타이머만 내부 커스텀 훅(useTimer)로 관리합니다.
*/

export default function Header({
  status,          // 'ready' | 'playing' | 'won' | 'lost'
  flagsLeft,       // 남은 깃발 수
  isTimerRunning,  // 타이머 실행 여부 (App에서 내려줌)
  shouldResetTimer,// 타이머 리셋 신호 (ready일 때 true)
  level,           // 현재 난이도 키
  levels,          // 난이도 사전 {beginner, intermediate, expert}
  onReset,         // 리셋 클릭 콜백
  onChangeLevel,   // 난이도 변경 콜백
}) {
  // 커스텀 훅: isRunning(true/false)와 shouldReset(true) 신호를 받아
  // 초 단위로 흘러가는 시간을 반환합니다.
  const seconds = useTimer(isTimerRunning, shouldResetTimer);

  // 상태별로 얼굴(이모지)로 피드백 주기
  const face = status === 'lost' ? '😵'
              : status === 'won' ? '😎'
              : isTimerRunning    ? '🙂'
              : '😊';

  // 숫자를 3자리로 0 패딩(미니 전광판 느낌)
  const pad3 = (n) => String(n).padStart(3, '0');

  return (
    <div className="header">
      {/* 왼쪽: 남은 깃발 수 */}
      <div className="panel counter" aria-label="남은 지뢰 수">
        {pad3(flagsLeft)}
      </div>

      {/* 가운데: 리셋 버튼(스마일) */}
      <button className="reset" onClick={onReset} aria-label="게임 리셋">
        {face}
      </button>

      {/* 오른쪽: 타이머 */}
      <div className="panel counter" aria-label="경과 시간(초)">
        {pad3(seconds)}
      </div>

      {/* 난이도 선택: 접근성 위해 label + select */}
      <label className="level-label">
        난이도:&nbsp;
        <select
          className="level-select"
          value={level}
          onChange={(e) => onChangeLevel(e.target.value)}
        >
          {Object.entries(levels).map(([key, v]) => (
            <option key={key} value={key}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
