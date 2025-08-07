export interface Tile {
  isVisible: boolean;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type Board = Tile[][];

export function createBoard(shape: number[][], numMines: number): Board {
  const rows = shape.length;
  const cols = shape[0].length;
  let board: Board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      isVisible: shape[r][c] === 1,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  const validTiles: { row: number, col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isVisible) {
        validTiles.push({ row: r, col: c });
      }
    }
  }

  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < numMines && validTiles.length > 0) {
    const randIndex = Math.floor(Math.random() * validTiles.length);
    const { row, col } = validTiles[randIndex];
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
    validTiles.splice(randIndex, 1);
  }

  // Calculate adjacent mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let mineCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
              mineCount++;
            }
          }
        }
        board[r][c].adjacentMines = mineCount;
      }
    }
  }

  return board;
}


export function floodFill(board: Board, row: number, col: number): { board: Board; revealedCount: number } {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  let revealedCount = 0;

  const stack: [number, number][] = [[row, col]];
  const visited = new Set<string>();
  visited.add(`${row},${col}`);

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;

    if (!newBoard[r][c].isRevealed) {
      newBoard[r][c].isRevealed = true;
      newBoard[r][c].isFlagged = false;
      revealedCount++;
    }

    if (newBoard[r][c].adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;

          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isVisible && !visited.has(`${nr},${nc}`)) {
             if (!newBoard[nr][nc].isRevealed) {
                stack.push([nr, nc]);
                visited.add(`${nr},${nc}`);
             }
          }
        }
      }
    }
  }

  return { board: newBoard, revealedCount };
}
