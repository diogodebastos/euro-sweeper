export interface Tile {
  isVisible: boolean;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type Board = Tile[][];

export function createBoard(shape: number[][], numMines: number): Board {
  const cols = shape[0].length;
  const validTiles: number[] = [];
  shape.forEach((row, r) => row.forEach((cell, c) => {
    if (cell === 1) validTiles.push(r * cols + c);
  }));

  // Pick mines with a partial Fisher-Yates shuffle
  const mines = new Set<number>();
  for (let i = 0; i < numMines && i < validTiles.length; i++) {
    const j = i + Math.floor(Math.random() * (validTiles.length - i));
    [validTiles[i], validTiles[j]] = [validTiles[j], validTiles[i]];
    mines.add(validTiles[i]);
  }
  return boardWithMines(shape, mines);
}

// Builds a board with mines at the given cells (row * cols + col).
export function boardWithMines(shape: number[][], mines: Set<number>): Board {
  const rows = shape.length;
  const cols = shape[0].length;
  const board: Board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      isVisible: shape[r][c] === 1,
      isMine: shape[r][c] === 1 && mines.has(r * cols + c),
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

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

  const stack: [number, number][] = [[row, col]];
  const visited = new Set<string>();
  visited.add(`${row},${col}`);

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;

    if (newBoard[r][c].isRevealed) continue;

    newBoard[r][c].isRevealed = true;
    newBoard[r][c].isFlagged = false;

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

  // After flood fill, we need to recount all revealed tiles to get the new total
  let totalRevealed = 0;
  newBoard.forEach(row => {
    row.forEach(tile => {
      if (tile.isRevealed) {
        totalRevealed++;
      }
    });
  });

  return { board: newBoard, revealedCount: totalRevealed };
}

// Reveals a random safe area to start the game, preferring a tile with no
// neighbouring mines so the first move opens up the board.
export function openingMove(board: Board): { board: Board; revealedCount: number } {
  const safeTiles: { row: number; col: number }[] = [];
  const zeroMineTiles: { row: number; col: number }[] = [];

  board.forEach((row, r) => {
    row.forEach((tile, c) => {
      if (tile.isVisible && !tile.isMine) {
        safeTiles.push({ row: r, col: c });
        if (tile.adjacentMines === 0) {
          zeroMineTiles.push({ row: r, col: c });
        }
      }
    });
  });

  const options = zeroMineTiles.length > 0 ? zeroMineTiles : safeTiles;
  if (options.length === 0) return { board, revealedCount: 0 };
  const { row, col } = options[Math.floor(Math.random() * options.length)];
  return floodFill(board, row, col);
}
