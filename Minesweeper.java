import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.*;

// 지뢰찾기 메인 클래스.
class Minesweeper extends JFrame {
  // static final 선언 부분은 지뢰 찾기에서 자주 사용되는 상수를 직관적으로 보기 위해 선언한 것임
  // 아래 상수들은 사용자가 !변경 가능함!
  static final int SIZE = 10; // 게임판 크기
  static final int MINE_COUNT = 10; // 지뢰의 갯수
  
  // 아래 상수는 사용자가 !변경 불가능함!
  static final int MINE = -1; // 지뢰를 알아보기 쉽게 하기 위해 선언

  // 게임판 배열 선언
  int[][] tile = new int[SIZE][SIZE];
  boolean[][] opend = new boolean[SIZE][SIZE];
  boolean[][] flagged = new boolean[SIZE][SIZE];
  JButton[][] btn = new JButton[SIZE][SIZE];

  /*
    !!MouseAdapter를 사용한 이유는 아래에 적었습니다!!
    원인:
    resetGame에서 addMouseListener(new MouseAdapter) 를 사용하니 새 게임을 불러 올 때 마다 객체가 여러개 생성 됨.
    여러개 생성 되는 걸 막기 위해 removeMouseListener를 사용하니 Swing 내부 리스너까지 지워버리는 현상 발생함.
    Swing 내부 리스너가 삭제되니 새로 addMouseListener를 추가해도 작동 안 함.
    
    해결:
    MouseAdapter를 배열로 생성하고 gameOver의 true, false값으로 removeMouseListener를 하지 않고 계속해서 작동 가능

    이 부분은 Claude의 도움을 받았습니다.
  */ 
  boolean gameOver = false;
  MouseAdapter[][] mouseAdapters = new MouseAdapter[SIZE][SIZE];
  
  // 게임 승리를 확인 하기위해 열린 칸 갯수를 체크
  int opendCount = 0;

  // 첫 클릭 이후, 지뢰를 배치하기 위해 선언
  boolean firstClick = true;

  // 아레에 있는 레이블 선언들은 resetGame에서 참조하기 위해 클래스필드로 선언함
  // 남은 지뢰 갯수를 표시해주는 레이블
  int remainingMines = MINE_COUNT;
  JLabel mineLabel = new JLabel("지뢰: " + remainingMines);

  // 경과 시간을 체크하기 위한 타이머 레이블
  int elapsedTime = 0;
  JLabel timeLabel = new JLabel("시간: 0초");
  // java.util.*, javax.swing.* 둘 다 Timer 클래스가 존재하기 때문에 에러 발생함, javax.swing.Timer로 명시하여 해결
  javax.swing.Timer timer = new javax.swing.Timer(1000, new ActionListener() {
    public void actionPerformed(ActionEvent e) {
      elapsedTime++;
      timeLabel.setText("시간: " + elapsedTime + "초");
    }
  });

  public Minesweeper() {
    // 창 설정
    setTitle("Minesweeper");
    setSize(500, 550);
    setResizable(false);
    setLayout(new BorderLayout());
    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    
    // 지뢰 랜덤 배치를 위해 선언
    Random random = new Random();
  
    // 게임판 초기화
    for(int i = 0; i < MINE_COUNT; i++) {
      int random_Cols, random_Rows;

      // 지뢰를 중복없이 랜덤 배치함
      do {
        random_Rows = random.nextInt(SIZE);
        random_Cols = random.nextInt(SIZE);
      } while(tile[random_Rows][random_Cols] == MINE);
      tile[random_Rows][random_Cols] = MINE;
    }
    
    // 각 타일의 주변 8칸 지뢰 갯수를 카운트하여 타일에 기록
    for(int rows = 0; rows < SIZE; rows++){
      for(int cols = 0; cols < SIZE; cols++){
        for(int isMine_Rows = rows - 1; isMine_Rows <= rows + 1; isMine_Rows++) {
          for(int isMine_Cols = cols - 1; isMine_Cols <= cols + 1; isMine_Cols++) {
            // 비정상적인 접근을 하면 반복문을 넘어감 (1)현재 타일이 지뢰인지 (2)현재 타일이 게임판을 넘어갔는지
            if(tile[rows][cols] == MINE) continue;
            if(isOutofBounds(isMine_Rows, isMine_Cols)) continue;

            // 지뢰를 찾으면 카운트 올라감
            if(tile[isMine_Rows][isMine_Cols] == MINE) tile[rows][cols]++;
          }  
        }
      }
    }
    
    // 게임 상단 메뉴 패널 생성
    JPanel topPanel = new JPanel();
    topPanel.setBackground(Color.LIGHT_GRAY);

    // 게임을 초기화 시키는 버튼 생성
    JButton newGameButton = new JButton("새 게임");
    newGameButton.setFocusable(false);
    newGameButton.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) {
        resetGame();
      }
    });

    // 게임 상단 메뉴에 컴포넌트 연결
    topPanel.add(mineLabel);
    topPanel.add(newGameButton);
    topPanel.add(timeLabel);

    // 게임판 패널 생성
    JPanel gamePanel = new JPanel(new GridLayout(SIZE, SIZE));

    // 버튼 생성 및 ActionListener 등록
    for(int row = 0; row < SIZE; row++) {
      for(int col = 0; col < SIZE; col++) {
        // ActionListener 안에서 row, col을 참조하기 위해 final 변수 r, c로 복사
        final int r = row, c = col;
        btn[r][c] = new JButton();
        btn[r][c].setFocusable(false);
        btn[r][c].setContentAreaFilled(true);
        btn[r][c].setBackground(Color.DARK_GRAY);
        btn[r][c].setBorder(BorderFactory.createLineBorder(Color.GRAY, 1));

        // 마우스 좌클릭 입력을 받고 타일을 여는 메소드 실행
        btn[r][c].addActionListener(new ActionListener() {
          public void actionPerformed(ActionEvent e) {
            if(gameOver == true) return;
            if(flagged[r][c] == true) return;
            if(!timer.isRunning()) timer.start();

            // 열린 칸 클릭 시 주변 깃발 개수와 주변 지뢰 개수가 같을 경우 주변 칸 연쇄 열기 작동
            if(opend[r][c] == true) {
              int flagCount = 0;
              // 현재 칸 주변의 깃발 개수를 카운트하여 저장
              for(int isFlag_Row = -1; isFlag_Row <= 1; isFlag_Row++) {
                for(int isFlag_Col = -1; isFlag_Col <= 1; isFlag_Col++) {
                  int nr = r + isFlag_Row, nc = c + isFlag_Col;
                  
                  // (1)현재 칸은 탐색하지 않음, (2)탐색할려는 위치가 배열을 넘어가면 넘김
                  if(isFlag_Row == 0 && isFlag_Col == 0) continue;
                  if(isOutofBounds(nr, nc)) continue;

                  if(flagged[nr][nc]) flagCount++;
                }
              }

              // 열린 칸 클릭 시, 주변의 깃발 개수가 주변의 지뢰 개수가 동일하면 주변 칸에 연쇄 오픈 실행
              if(flagCount == tile[r][c]) {
                // 단순히 주변 칸에 접근하는 것이므로 dr, dc로 선언함
                for(int dr = -1; dr <= 1; dr++) {
                  for(int dc = -1; dc <= 1; dc++) {
                    int nr = r + dr, nc = c + dc;
                    
                    // 아래 두 조건은 깃발 개수 카운트하는 코드와 동일
                    if(dr == 0 && dc == 0) continue;
                    if(isOutofBounds(nr, nc)) continue;
                    // (3)현재 칸에 깃발이 있다면 넘김
                    if(flagged[nr][nc]) continue;

                    open(nr, nc);
                  }
                }
              } 
            } else {
              open(r, c);
            }
          }
        });
        
        // 마우스 우클릭 입력을 받고 깃발을 꽂음
        mouseAdapters[r][c] = new MouseAdapter() {
          public void mousePressed(MouseEvent e) {
            if(gameOver == true) return;
            if(e.getButton() == MouseEvent.BUTTON3) {
              if(opend[r][c] == true) return;
              if(flagged[r][c] == false && remainingMines > 0) {
                flagged[r][c] = true;
                btn[r][c].setForeground(Color.RED);
                btn[r][c].setText("깃발");
                remainingMines--;
              } else if(flagged[r][c] == true) {
                flagged[r][c] = false;
                btn[r][c].setForeground(Color.DARK_GRAY);
                btn[r][c].setText("");
                remainingMines++;
              }
              mineLabel.setText("지뢰: " + remainingMines);
            }
          }
        };
        btn[r][c].addMouseListener(mouseAdapters[r][c]);
        gamePanel.add(btn[r][c]);
      }
    }
    
    // 생성한 패널을 레이아웃에 배치
    add(topPanel, BorderLayout.NORTH);
    add(gamePanel, BorderLayout.CENTER);

    setVisible(true);
  }

  // 주변 지뢰가 0인 칸을 재귀 호출하여 연쇄로 열기 위한 메소드
  void open(int row, int col) {
    // row와 col이 게임판의 인덱스를 넘어갔는지 반드시 먼저 확인 후 opned배열 확인 해야함
    if(isOutofBounds(row, col)) return;
    if(opend[row][col]) return;
    if(flagged[row][col]) return;

    int value = tile[row][col];
    btn[row][col].setForeground(Color.DARK_GRAY);

    switch (value) {
      // 클릭한 곳이 지뢰면 게임오버 처리
      case -1:
        btn[row][col].setText("지뢰");
        mineLabel.setText("게임 오버!");
      
        // 게임 오버시 모든 지뢰 위치 표시
        for(int r = 0; r < SIZE; r++) {
          for(int c = 0; c < SIZE; c++) {
            // 깃발이 잘못된 위치에 꽂혀있다면 'X' 표시
            if(flagged[r][c] == true && tile[r][c] != -1) {
              btn[r][c].setText("X");
              btn[r][c].setBackground(Color.LIGHT_GRAY);
              btn[r][c].setBorder(BorderFactory.createLoweredBevelBorder());
            }
            else if(tile[r][c] == -1 && flagged[r][c] == false) {
              btn[r][c].setText("지뢰");
              btn[r][c].setBackground(Color.LIGHT_GRAY);
              btn[r][c].setBorder(BorderFactory.createLoweredBevelBorder());
            }
          }
        }

        gameOver = true;
        timer.stop();
        return;

      // 각 주변 지뢰 갯수에 따라 케이스 선택
      case 0:
        btn[row][col].setText("");
        break;
      case 1:
        btn[row][col].setText("1");
        break;
      case 2:
        btn[row][col].setText("2");
        break;
      case 3:
        btn[row][col].setText("3");
        break;
      case 4:
        btn[row][col].setText("4");
        break;
      case 5:
        btn[row][col].setText("5");
        break;
      case 6:
        btn[row][col].setText("6");
        break;
      case 7:
        btn[row][col].setText("7");
        break;
      case 8:
        btn[row][col].setText("8");
        break;
      default:
        break;
    }

    // 버튼에 눌려진 효과를 주기 위해 색상과 테두리 변경
    btn[row][col].setBackground(Color.LIGHT_GRAY);
    btn[row][col].setBorder(BorderFactory.createLoweredBevelBorder());
    opendCount++;
    opend[row][col] = true;

    // 게임 승리 조건 확인
    if(opendCount == (SIZE * SIZE) - MINE_COUNT) {
      mineLabel.setText("게임 승리!");
      timer.stop();
      gameOver = true;
    }
    
    // 현재 칸 주변에 지뢰가 없을 경우 주변 칸에 연쇄 열기 작동
    if(value == 0) {
      for(int dr = -1; dr <= 1; dr++) {
        for(int dc = -1; dc <= 1; dc++) {
          if(dr == 0 && dc == 0) continue;
          // 재귀 호출로 연쇄 열기
          open(row + dr, col + dc);
        }
      }
    }
  }

  void resetGame() {
    // 배열 초기화
    tile = new int[SIZE][SIZE];
    opend = new boolean[SIZE][SIZE];
    flagged = new boolean[SIZE][SIZE];

    // 남은 지뢰 갯수 초기화
    remainingMines = MINE_COUNT;
    mineLabel.setText("지뢰: " + remainingMines);
    
    // 경과 시간 초기화
    elapsedTime = 0;
    timer.stop();
    timeLabel.setText("시간: 0초");
    
    opendCount = 0;
    gameOver = false;

    // 지뢰 재배치
    Random random = new Random();
    for(int i = 0; i < MINE_COUNT; i++) {
      int random_Cols, random_Rows;

      // 지뢰를 중복없이 랜덤 배치함
      do {
        random_Rows = random.nextInt(SIZE);
        random_Cols = random.nextInt(SIZE);
      } while(tile[random_Rows][random_Cols] == MINE);
      tile[random_Rows][random_Cols] = MINE;
    }
    
    // 주변 8칸 지뢰 수 재계산
    for(int rows = 0; rows < SIZE; rows++){
      for(int cols = 0; cols < SIZE; cols++){
        for(int isMine_Rows = rows - 1; isMine_Rows <= rows + 1; isMine_Rows++) {
          for(int isMine_Cols = cols - 1; isMine_Cols <= cols + 1; isMine_Cols++) {
            // 비정상적인 접근을 하면 반복문을 넘어감 (1)현재 타일이 지뢰인지 (2)현재 타일이 게임판을 넘어갔는지
            if(tile[rows][cols] == MINE) continue;
            if(isOutofBounds(isMine_Rows, isMine_Cols)) continue;

            // 지뢰를 찾으면 카운트 올라감
            if(tile[isMine_Rows][isMine_Cols] == MINE) tile[rows][cols]++;
          }  
        }
      }
    }

    // 버튼 상태 초기화
    for(int row = 0; row < SIZE; row++) {
      for(int col = 0; col < SIZE; col++) {
        final int r = row, c = col;
        btn[r][c].setText("");
        btn[r][c].setBackground(Color.DARK_GRAY);
        btn[r][c].setForeground(Color.DARK_GRAY);
        btn[r][c].setBorder(BorderFactory.createLineBorder(Color.GRAY, 1));

        // ActionListener 재등록을 위해 삭제
        for(ActionListener al : btn[r][c].getActionListeners()) {
          btn[r][c].removeActionListener(al);
        }

        // 마우스 좌클릭 입력을 받고 타일을 여는 메소드 실행
        btn[r][c].addActionListener(new ActionListener() {
          public void actionPerformed(ActionEvent e) {
            if(gameOver == true) return;
            if(flagged[r][c] == true) return;
            if(!timer.isRunning()) timer.start();

            // 열린 칸 클릭 시 주변 깃발 개수와 주변 지뢰 개수가 같을 경우 주변 칸 연쇄 열기 작동
            // 주석 추가 필요
            if(opend[r][c] == true) {
              int aroundFlag = 0;
              for(int isFlagRow = -1; isFlagRow <= 1; isFlagRow++) {
                for(int isFlagCol = -1; isFlagCol <= 1; isFlagCol++) {
                  if(isFlagRow == 0 && isFlagCol == 0) continue;
                  int nr = r + isFlagRow, nc = c + isFlagCol;
                  if(isOutofBounds(nr,nc)) continue;
                  if(flagged[nr][nc]) aroundFlag++;
                }
              }
              if(aroundFlag == tile[r][c]) {
                for(int aroundFlagRow = -1; aroundFlagRow <= 1; aroundFlagRow++) {
                  for(int aroundFlagCol = -1; aroundFlagCol <= 1; aroundFlagCol++) {
                    if(aroundFlagRow == 0 && aroundFlagCol == 0) continue;
                    int nr = r + aroundFlagRow, nc = c + aroundFlagCol;
                    if(isOutofBounds(nr,nc)) continue;
                    if(flagged[nr][nc]) continue;
                    open(nr, nc);
                  }
                }
              } 
            } else {
              open(r, c);
            }
          }
        });
      }
    }
  }
  
  // row, col 값이 게임판 배열을 넘어가는지 확인하는 메소드
  boolean isOutofBounds(int row, int col) {
    if(row < 0 || row > SIZE - 1 || col < 0 || col > SIZE -1) {
      return true;
    } else {
      return false;
    }
  }

  public static void main(String[] args) {
    Minesweeper frame = new Minesweeper();
  }
}