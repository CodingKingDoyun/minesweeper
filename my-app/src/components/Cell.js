// src/components/Cell.js
import React from 'react';

/*
  Cell 컴포넌트는 "한 칸"을 표현합니다.
  - isRevealed(열림), isFlagged(깃발), isMine(지뢰), neighbor(주변 지뢰 수)에 따라
    다른 스타일과 내용을 보여줍니다.
  - 숫자 색상은 전통적인 지뢰찾기 색을 참고하여 CSS 클래스에 맵핑합니다.
*/

export default function Cell({ cell, status, onMouseDown, onContextMenu }) {
  const {
    isRevealed,
    isFlagged,
    isMine,
    neighbor, // 주변 지뢰 수(0~8)
  } = cell;

  // 셀의 클래스 이름을 상태에 따라 조합
  const classNames = [
    'cell',
    isRevealed ? 'open' : 'closed',
    isFlagged ? 'flag' : '',
    isRevealed && isMine ? 'mine' : '',
    isRevealed && neighbor > 0 ? `n${neighbor}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 표시할 내용:
  // - 열리지 않은 상태: 깃발이면 💪, 아니면 빈 칸(커버)
  // - 열린 상태: 지뢰면 💣, 0이면 빈 칸, 1~8이면 숫자
  const content = (() => {
    if (!isRevealed) {
      return isFlagged ? '💪' : '';
    }
    if (isMine) return '💣';
    return neighbor > 0 ? <span style={{ fontSize: '20px' }}>{neighbor}</span> : '';
  })();

  // 패배 상태에서 "잘못 꽂은 깃발"을 표시하고 싶다면 여기서 추가 로직을 넣을 수 있습니다.
  // (예: 패배 시, 깃발인데 지뢰가 아니었다면 ❌ 기호 등)
  // 이번 구현은 단순화를 위해 생략합니다.

  return (
    <button
      type="button"
      className={classNames}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      aria-label={isRevealed ? (isMine ? '지뢰' : `숫자 ${neighbor}`) : '닫힌 칸'}
      // 접근성: 열린 숫자칸은 읽기 전용으로 보이게 할 수도 있으나 여기서는 클릭 가능(Chord)
    >
      {content}
    </button>
  );
}
