// src/utils/minesweeper.js
/*
  이 파일은 지뢰찾기의 "순수 로직"을 담당합니다.
  - 보드 생성, 첫 클릭 후 지뢰 지연 배치, 주변 지뢰 수 계산
  - 셀 열기(연쇄 오픈), 깃발 토글, 승리 체크 등
  UI(React 컴포넌트)와 분리하여 테스트/이해를 쉽게 합니다.
*/

/* -------- 기본 셀 생성 헬퍼 -------- */
function makeCell(row, col) {
  return {
    row, col,          // 위치
    isMine: false,     // 지뢰 여부
    isRevealed: false, // 열렸는가
    isFlagged: false,  // 깃발 꽂혔는가
    neighbor: 0,       // 주변 지뢰 수
  };
}

/* -------- 빈 보드 생성 -------- */
export function createEmptyBoard(rows, cols) {
  const board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => makeCell(r, c))
  );
  return board;
}

/* -------- 이웃 좌표 순회 -------- */
const OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function forEachNeighbor(board, r, c, fn) {
  for (const [dr, dc] of OFFSETS) {
    const nr = r + dr, nc = c + dc;
    if (board[nr] && board[nr][nc]) {
      fn(board[nr][nc], nr, nc);
    }
  }
}

/* -------- 지뢰 배치(첫 클릭 이후, 안전 보장) --------
   - 첫 클릭 칸과 그 주변 8칸에는 지뢰를 두지 않습니다.
   - 무작위 위치에 mines 개수만큼 배치 후, neighbor 숫자 재계산
*/
export function lazyPlaceMinesAfterFirstClick(board, clickR, clickC, mines) {
  const rows = board.length;
  const cols = board[0].length;

  // 깊은 복사하여 원본을 건드리지 않도록 함
  const next = board.map(row => row.map(cell => ({ ...cell })));

  // 금지 구역: 첫 클릭 칸 + 주변 8칸
  const banned = new Set();
  const key = (r, c) => `${r},${c}`;
  banned.add(key(clickR, clickC));
  forEachNeighbor(next, clickR, clickC, (n) => banned.add(key(n.row, n.col)));

  // 모든 좌표를 모으고, 금지구역 제외
  const coords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!banned.has(key(r, c))) coords.push([r, c]);
    }
  }

  // 좌표를 섞어서 앞에서 mines개를 지뢰로 지정 (Fisher-Yates)
  shuffle(coords);
  for (let i = 0; i < mines && i < coords.length; i++) {
    const [r, c] = coords[i];
    next[r][c].isMine = true;
  }

  // 주변 지뢰 수 계산
  recalcNeighbors(next);

  return next;
}

/* -------- 배열 섞기(Fisher-Yates) -------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* -------- 주변 지뢰 수 재계산 -------- */
function recalcNeighbors(board) {
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) {
        cell.neighbor = 0; // 지뢰칸의 숫자는 사용하지 않으나 초기화
      } else {
        let cnt = 0;
        forEachNeighbor(board, cell.row, cell.col, (n) => {
          if (n.isMine) cnt++;
        });
        cell.neighbor = cnt;
      }
    }
  }
}

/* -------- 셀 열기 + 연쇄열기 --------
   - 클릭한 칸이 지뢰면 exploded = true
   - 0이면 주변을 재귀/반복적으로 열어 "빈 공간"을 확장
*/
export function revealCascade(board, r, c) {
  const next = board.map(row => row.map(cell => ({ ...cell })));
  const start = next[r][c];

  if (start.isFlagged || start.isRevealed) {
    return { nextBoard: next, exploded: false };
  }

  // 지뢰 클릭 시 즉시 실패
  if (start.isMine) {
    start.isRevealed = true;
    return { nextBoard: next, exploded: true };
  }

  // BFS 방식으로 0 주변을 확장
  const queue = [];
  const push = (cell) => {
    if (!cell.isRevealed && !cell.isFlagged) {
      cell.isRevealed = true;
      // neighbor가 0이면 주변을 더 열기 위해 큐에 추가
      if (cell.neighbor === 0) queue.push(cell);
    }
  };

  push(start);

  while (queue.length) {
    const cur = queue.shift();
    forEachNeighbor(next, cur.row, cur.col, (n) => {
      if (!n.isRevealed && !n.isFlagged && !n.isMine) {
        n.isRevealed = true;
        if (n.neighbor === 0) queue.push(n);
      }
    });
  }

  return { nextBoard: next, exploded: false };
}

/* -------- 깃발 토글 --------
   - 이미 열린 칸에는 깃발을 꽂을 수 없음
*/
export function toggleFlagAt(board, r, c) {
  const next = board.map(row => row.map(cell => ({ ...cell })));
  const cell = next[r][c];
  if (cell.isRevealed) return { nextBoard: next, changed: false };
  cell.isFlagged = !cell.isFlagged;
  return { nextBoard: next, changed: true };
}

/* -------- 현재 깃발 총 개수 -------- */
export function countFlags(board) {
  let cnt = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) cnt++;
    }
  }
  return cnt;
}

/* -------- 승리 조건 --------
   - "지뢰가 아닌 모든 칸"이 열렸는가?
*/
export function checkWinCondition(board, totalMines) {
  let revealedSafe = 0;
  let totalSafe = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine) {
        totalSafe++;
        if (cell.isRevealed) revealedSafe++;
      }
    }
  }
  return revealedSafe === totalSafe;
}
