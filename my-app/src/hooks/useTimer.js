// src/hooks/useTimer.js
import { useEffect, useRef, useState } from 'react';

/*
  useTimer 커스텀 훅
  - 인자로 isRunning(true/false), shouldReset(true/false)을 받습니다.
  - 초 단위 숫자를 반환합니다.
  - App -> Header로 신호를 내려주면, Header는 이 훅을 통해 타이머를 구동합니다.
  - setInterval을 사용하며, 컴포넌트가 사라지거나 isRunning이 false가 되면 정리합니다.
*/

export default function useTimer(isRunning, shouldReset) {
  const [sec, setSec] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // 리셋 신호가 들어오면 시간을 0으로 초기화
    if (shouldReset) setSec(0);
  }, [shouldReset]);

  useEffect(() => {
    // 실행 여부가 바뀔 때마다 interval을 관리
    if (isRunning) {
      // 1초마다 sec +1
      intervalRef.current = setInterval(() => {
        setSec((s) => Math.min(s + 1, 999)); // 전통 규칙처럼 999에서 멈추기
      }, 1000);
    } else {
      // 실행 안 함: 혹시 남아있을 수 있는 interval 제거
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // 클린업: 언마운트나 의존성 변경 때 interval 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  return sec;
}
