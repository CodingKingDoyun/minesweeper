import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.*;

// 지뢰찾기 메인 클래스.
class Minesweeper extends JFrame {
  // static final 선언 부분은 지뢰 찾기에서 자주 사용되는 상수를 직관적으로 보기 위해 선언한 것임
  // 아래 상수들은 사용자가 !변경 가능함!
  static final int SIZE = 10; // 게임판 크기
  static final int MINE_COUNT = 15; // 지뢰의 갯수
  
  // 아래 상수는 사용자가 !변경 불가능함!
  static final int MINE = -1; // 지뢰를 알아보기 쉽게 하기 위해 선언

  int[][] tile = new int[SIZE][SIZE];
  boolean[][] opend = new boolean[SIZE][SIZE];
  JButton[][] btn = new JButton[SIZE][SIZE];
  
  public Minesweeper() {
    setTitle("Minesweeper");
    setSize(600, 600);
    setLayout(new GridLayout(SIZE, SIZE));
    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    
    Random random = new Random();
  
    // 게임판 초기화
    // TODO: MINE_COUNT가 SIZE * SIZE 이상일 경우 예외 처리 추가
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
            if(isMine_Cols < 0 || isMine_Cols > SIZE - 1 || isMine_Rows < 0 || isMine_Rows > SIZE - 1) continue;

            // 지뢰를 찾으면 카운트 올라감
            if(tile[isMine_Rows][isMine_Cols] == MINE) tile[rows][cols]++;
          }  
        }
      }
    }

    // 버튼 생성 및 ActionListener 등록
    for(int row = 0; row < SIZE; row++) {
      for(int col = 0; col < SIZE; col++) {
        // ActionListener 안에서 row, col을 참조하기 위해 final 변수 r, c로 복사
        final int r = row, c = col;
        btn[r][c] = new JButton();
        btn[r][c].setContentAreaFilled(true);
        btn[r][c].setBackground(Color.DARK_GRAY);
        btn[r][c].addActionListener(new ActionListener() {
          public void actionPerformed(ActionEvent e) {
            JButton btn = (JButton)e.getSource();
            open(r, c);
          }
        });
        add(btn[r][c]);
      }
    }
    setVisible(true);
  }

  // 주변 지뢰가 0인 칸을 재귀 호출하여 연쇄로 열기 위한 메소드
  void open(int row, int col) {
    // row와 col이 게임판의 인덱스를 넘어갔는지 반드시 먼저 확인 후 opned배열 확인 해야함
    if(row < 0 || row > SIZE - 1 || col < 0 || col > SIZE - 1) return;
    if(opend[row][col]) return;

    int value = tile[row][col];
    btn[row][col].setText(tile[row][col] == MINE ? "지뢰" : String.valueOf(value));
    opend[row][col] = true;

    btn[row][col].setBackground(Color.LIGHT_GRAY);
    btn[row][col].setBorder(BorderFactory.createLoweredBevelBorder());
    for(ActionListener al : btn[row][col].getActionListeners()) {
      btn[row][col].removeActionListener(al);
    }
    
    if(value == 0) {
      for(int dr = -1; dr <= 1; dr++) {
        for(int dc = -1; dc <= 1; dc++) {
          if(dr == 0 && dc == 0) continue;
          // 재귀 호출로 연쇄 열기 시도
          open(row + dr, col + dc);
        }
      }
    }
  }

  public static void main(String[] args) {
    Minesweeper frame = new Minesweeper();
  }
}