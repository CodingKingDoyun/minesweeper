import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.*;

class Minesweeper extends JFrame {
  public Minesweeper() {
    setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    setTitle("Minesweeper");
    setLayout(new GridLayout(10, 10));
    setSize(600,600);
    
    int[][] tile = new int[10][10];
    boolean[][] opend = new boolean[10][10];
    
    Random random = new Random();
    for(int i = 0; i < 10; i++) {
      int random_Cols, random_Rows;
      do {
        random_Rows = random.nextInt(10);
        random_Cols = random.nextInt(10);
      } while(tile[random_Rows][random_Cols] == -1);
      tile[random_Rows][random_Cols] = -1;
    }
    
    for(int rows = 0; rows < 10; rows++){
      for(int cols = 0; cols < 10; cols++){
        for(int isMine_Rows = rows - 1; isMine_Rows <= rows + 1; isMine_Rows++) {
          for(int isMine_Cols = cols - 1; isMine_Cols <= cols + 1; isMine_Cols++) {
            if(tile[rows][cols] == -1) continue;
            if(isMine_Cols < 0 || isMine_Cols > 9 || isMine_Rows < 0 || isMine_Rows > 9) continue;
            if(tile[isMine_Rows][isMine_Cols] == -1) tile[rows][cols]++;
          }  
        }
      }
    }

    for(int rows = 0; rows < 10; rows++) {
      for(int cols = 0; cols < 10; cols++) {
        final int tile_Value = tile[rows][cols];
        JButton button = new JButton();

        button.addActionListener(new ActionListener() {
          public void actionPerformed(ActionEvent e) {
            JButton btn = (JButton)e.getSource();

            switch(tile_Value) {
              case -1:
                button.setText("지뢰");
                button.setForeground(Color.GRAY);
                break;
              case 0:
                button.setText("");
                break;
              case 1:
                button.setText("1");
                button.setForeground(Color.blue);
                break;
              case 2:
                button.setText("2");
                button.setForeground(Color.green);
                break;
              case 3:
                button.setText("3");
                button.setForeground(Color.red);
                break;
              case 4:
                button.setText("4");
                button.setForeground(Color.blue);
                break;
              case 5:
                button.setText("5");
                button.setForeground(Color.black);
                break;
              case 6:
                button.setText("6");
                button.setForeground(Color.green);
                break;
              case 7:
                button.setText("7");
                break;
              default:
                button.setText("8");
                break;
            }
            btn.setEnabled(false);
          }
        });

        add(button);
      }
    }
    setVisible(true);
  }
  
  public static void main(String[] args) {
    Minesweeper frame = new Minesweeper();
  }
}