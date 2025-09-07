// src/components/Board.js
import React from 'react';
import Cell from './Cell';

/*
  Board 컴포넌트는 2차원 보드를 렌더링합니다.
  - 각 셀은 Cell 컴포넌트로 렌더
  - CSS Grid를 사용하여 행/열 배치를 간단히 구성
  - 마우스 이벤트(좌클릭/우클릭/양쪽클릭)를 상위(App)로 전달
*/

export default function Board({ board, status, onOpen, onFlag, onChord }) {
  // CSS Grid에서 열 개수를 동적으로 지정하기 위해 스타일에 '--cols' 커스텀 속성 사용
  const cols = board[0]?.length || 0;

  // "양쪽 클릭(Chord)" UX를 구현하는 방법:
  // 1) 실제로 브라우저의 '양쪽 버튼 동시' 이벤트는 다루기 까다로움
  // 2) 대안으로: 숫자 칸을 클릭할 때 Shift 키가 눌려있으면 chord로 처리
  // 3) 또는 이미 오픈된 숫자칸을 다시 클릭하면 chord 시도
  // 여기서는 Shift+클릭(또는 이미 열린 숫자칸 클릭)을 onChord로 전달하는 방식을 사용합니다.

  const handleCellMouseDown = (e, r, c, cell) => {
    // 우클릭은 contextmenu에서 처리하므로 여기선 패스
    if (e.button === 2) return;

    // 이미 열린 숫자칸을 클릭 -> chord 시도
    if (cell.isRevealed && cell.neighbor > 0) {
      onChord(r, c);
      return;
    }

    // 일반 좌클릭: Shift 누르면 chord, 아니면 오픈
    if (e.shiftKey) {
      onChord(r, c);
    } else {
      onOpen(r, c);
    }
  };

  // 우클릭(깃발)
  const handleCellRightClick = (e, r, c) => {
    e.preventDefault(); // 기본 컨텍스트 메뉴 방지
    onFlag(r, c);
  };

  return (
    <div
      className="board"
      style={{ '--cols': cols }}
      role="grid"
      aria-label="지뢰찾기 보드"
    >
      {board.map((row, r) => (
        <div className="row" role="row" key={r}>
          {row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              cell={cell}
              status={status}
              onMouseDown={(e) => handleCellMouseDown(e, r, c, cell)}
              onContextMenu={(e) => handleCellRightClick(e, r, c)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
