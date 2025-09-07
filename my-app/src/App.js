// src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import {
  createEmptyBoard,
  lazyPlaceMinesAfterFirstClick,
  revealCascade,
  toggleFlagAt,
  countFlags,
  checkWinCondition,
} from './utils/minesweeper';

/*
  App 컴포넌트는 "게임 전체"의 상태를 관리하는 루트입니다.
  - 난이도(행/열/지뢰수)
  - 보드 데이터(2차원 셀 배열)
  - 게임 상태(대기/진행/승리/패배)
  - 남은 깃발 개수
  - 타이머 시작/정지 신호 (Header로 내려보냄)
  등 핵심 로직을 모두 여기서 컨트롤합니다.
*/

export default function App() {
  // 난이도 옵션을 정의합니다. (초급/중급/고급)
  const DIFFICULTIES = useMemo(() => ({
    beginner: { rows: 9, cols: 9, mines: 10, label: '초급 (9x9 / 10)' },
    intermediate: { rows: 16, cols: 16, mines: 40, label: '중급 (16x16 / 40)' },
    expert: { rows: 16, cols: 30, mines: 99, label: '고급 (16x30 / 99)' },
  }), []);

  // 현재 선택된 난이도 키
  const [level, setLevel] = useState('beginner');

  // 현재 난이도에서의 행, 열, 지뢰 개수
  const { rows, cols, mines } = DIFFICULTIES[level];

  // 보드 상태: 2차원 배열(셀 오브젝트들)
  const [board, setBoard] = useState(() => createEmptyBoard(rows, cols));

  // 게임 상태: 'ready' | 'playing' | 'won' | 'lost'
  const [status, setStatus] = useState('ready');

  // 첫 클릭이 발생했는지? (첫 클릭까지는 지뢰를 실제로 심지 않습니다: 안전한 첫 클릭 보장)
  const [firstClickDone, setFirstClickDone] = useState(false);

  // 정확한 "남은 깃발" 계산을 위해 별도 상태로 저장합니다 (지뢰 수 - 현재 깃발 수)
  const [flagsLeft, setFlagsLeft] = useState(mines);

  // 게임이 리셋될 때 타이머를 초기화/정지시키고, 게임 중에는 작동하도록 Header에 신호를 내려보냅니다.
  const isTimerRunning = status === 'playing';
  const shouldResetTimer = status === 'ready'; // 새 게임 시작 상태에서 Header 타이머 0으로

  // 난이도가 바뀌거나 새 게임을 누르면 새로운 빈 보드를 생성합니다.
  useEffect(() => {
    resetGame(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // 보조 함수: 게임 리셋
  const resetGame = (nextLevel = level) => {
    const { rows: r, cols: c, mines: m } = DIFFICULTIES[nextLevel];
    setBoard(createEmptyBoard(r, c)); // 아직 지뢰 배치 X
    setStatus('ready');
    setFirstClickDone(false);
    setFlagsLeft(m);
  };

  // 좌클릭(오픈) 처리
  const handleOpen = (r, c) => {
    // 이미 승패가 결정됐으면 클릭을 무시합니다.
    if (status === 'won' || status === 'lost') return;

    // 아직 첫 클릭 전이라면, 첫 클릭 지점 주변에는 지뢰가 없도록 "지연 배치"를 합니다.
    let workingBoard = board;
    if (!firstClickDone) {
      workingBoard = lazyPlaceMinesAfterFirstClick(board, r, c, mines);
      setFirstClickDone(true);
      setStatus('playing'); // 첫 클릭 시점부터 게임 시작으로 간주 -> 타이머 스타트
    }

    // 이미 열려있거나 깃발이 꽂힌 칸은 열지 않습니다.
    const cell = workingBoard[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    // 칸 열기 + 0이면 연쇄 오픈(DFS/BFS 형태)까지 진행
    const { nextBoard, exploded } = revealCascade(workingBoard, r, c);

    if (exploded) {
      // 지뢰를 밟음 -> 모든 지뢰를 드러나게 하고 게임 오버로 설정
      const exposed = nextBoard.map(row =>
        row.map(cell => {
          if (cell.isMine) {
            return { ...cell, isRevealed: true };
          }
          return cell;
        })
      );
      setBoard(exposed);
      setStatus('lost');
      return;
    }

    // 승리 조건 체크: 모든 "지뢰가 아닌 칸"이 열렸는지
    const hasWon = checkWinCondition(nextBoard, mines);
    if (hasWon) {
      // 승리 시에는 남은 지뢰에 깃발을 자동으로 꽂아주는 연출을 할 수 있습니다(선택).
      const autoFlagged = nextBoard.map(row =>
        row.map(cell => (cell.isMine ? { ...cell, isFlagged: true } : cell))
      );
      setBoard(autoFlagged);
      setStatus('won');
      setFlagsLeft(0);
      return;
    }

    // 계속 진행
    setBoard(nextBoard);
    // 깃발 개수도 갱신(혹시 연쇄 로직 중 변화가 있을 수 있어 안전하게 재계산)
    setFlagsLeft(mines - countFlags(nextBoard));
  };

  // 우클릭(깃발 토글) 처리
  const handleFlag = (r, c) => {
    // 승패 결정 시 무시
    if (status === 'won' || status === 'lost') return;

    // 아직 첫 클릭 전에도 깃발은 허용(정석 규칙과 동일)
    const { nextBoard, changed } = toggleFlagAt(board, r, c);
    if (!changed) return;

    setBoard(nextBoard);
    setFlagsLeft(mines - countFlags(nextBoard));
  };

  // 숫자칸에서 "치환 오픈(Chord)" — 이미 숫자가 열려 있고,
  // 주변 깃발 수가 숫자와 같으면 주변 미오픈 칸을 한꺼번에 오픈
  const handleChord = (r, c) => {
    if (status !== 'playing') return; // 진행 중일 때만 사용
    const cell = board[r][c];
    if (!cell.isRevealed || cell.neighbor !== cellNeighborFlags(board, r, c)) return;

    // 주변 미오픈 칸들을 한꺼번에 open 시도
    let working = board;
    const neighbors = getNeighborsPos(board, r, c);
    let exploded = false;
    neighbors.forEach(({ nr, nc }) => {
      const target = working[nr][nc];
      if (!target.isRevealed && !target.isFlagged) {
        const res = revealCascade(working, nr, nc);
        working = res.nextBoard;
        if (res.exploded) exploded = true;
      }
    });

    if (exploded) {
      const exposed = working.map(row =>
        row.map(cell => (cell.isMine ? { ...cell, isRevealed: true } : cell))
      );
      setBoard(exposed);
      setStatus('lost');
      return;
    }

    const hasWon = checkWinCondition(working, mines);
    if (hasWon) {
      const autoFlagged = working.map(row =>
        row.map(cell => (cell.isMine ? { ...cell, isFlagged: true } : cell))
      );
      setBoard(autoFlagged);
      setStatus('won');
      setFlagsLeft(0);
      return;
    }

    setBoard(working);
    setFlagsLeft(mines - countFlags(working));
  };

  // 유틸: 특정 칸 주변의 "깃발 개수" 계산 (Chord용)
  const cellNeighborFlags = (b, r, c) => {
    const around = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    let cnt = 0;
    for (const [dr, dc] of around) {
      const nr = r + dr, nc = c + dc;
      if (b[nr] && b[nr][nc] && b[nr][nc].isFlagged) cnt++;
    }
    return cnt;
  };

  // 이 함수는 Board에게 넘겨지는 콜백들을 묶어 전달합니다.
  const actions = {
    onOpen: handleOpen,
    onFlag: handleFlag,
    onChord: handleChord,
    onReset: () => resetGame(level),
    onChangeLevel: (lv) => setLevel(lv),
  };

  return (
    <div className="app">
      {/* 헤더: 남은 지뢰 수(=깃발 수), 타이머, 리셋 버튼, 난이도 셀렉터 */}
      <Header
        status={status}
        flagsLeft={flagsLeft}
        isTimerRunning={isTimerRunning}
        shouldResetTimer={shouldResetTimer}
        level={level}
        levels={DIFFICULTIES}
        onReset={actions.onReset}
        onChangeLevel={actions.onChangeLevel}
      />

      {/* 보드: 셀을 클릭/우클릭/양쪽클릭(chord) 등 인터랙션 처리 */}
      <Board
        board={board}
        status={status}
        onOpen={actions.onOpen}
        onFlag={actions.onFlag}
        onChord={actions.onChord}
      />

      {/* 하단 도움말 */}
      <div className="help">
        <p>좌클릭: 칸 열기 · 우클릭: 깃발 토글 · 숫자 칸에서 양쪽 클릭(또는 숫자 클릭+Shift): 주변 일괄 오픈</p>
      </div>
    </div>
  );
}

/* ----- 보드 주변 좌표 유틸 (App 전용 간단 헬퍼) ----- */
function getNeighborsPos(board, r, c) {
  const ds = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  const res = [];
  for (const [dr, dc] of ds) {
    const nr = r + dr, nc = c + dc;
    if (board[nr] && board[nr][nc]) res.push({ nr, nc });
  }
  return res;
}
