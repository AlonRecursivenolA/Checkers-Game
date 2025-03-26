class GameManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.games = [];
  }
  
  createGame() {
    // Create a new container for this game instance.
    const gameDiv = document.createElement('div');
    gameDiv.classList.add('game-instance');
    gameDiv.id = `game-${this.games.length}`;

    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('game-controls');
    gameDiv.appendChild(controlsDiv);

    const resignButton = document.createElement('button');
    resignButton.textContent = 'Resign';
    resignButton.classList.add('game-button');
    resignButton.addEventListener('click', () => {
      showModal("Would You Like To Resign?" 
        ,() => {
        
          logic.board = logic.createBoard();
          logic.isWhiteTurn = true;
          ui.drawBoard();
        }
      );
    });
    controlsDiv.appendChild(resignButton);

    // Create "Offer Draw" button.
    const drawButton = document.createElement('button');
    drawButton.textContent = 'Offer Draw';
    drawButton.classList.add('game-button');
    drawButton.addEventListener('click', () => {
      showModal(
        "Draw Offered, would you like to accept a draw?",
        () => {
          console.log("Draw confirmed for game:", gameDiv.id);
          // Reset the board for this game instance.
          logic.board = logic.createBoard();
          logic.isWhiteTurn = true;
          ui.drawBoard();
        }
      );
    });
    controlsDiv.appendChild(drawButton);

    // Create a board container for this game.
    const boardContainer = document.createElement('div');
    boardContainer.classList.add('board-container');
    gameDiv.appendChild(boardContainer);

    this.container.appendChild(gameDiv);

    // Create new Logic and UI instances.
    const logic = new Logic();
    const ui = new UI(logic, boardContainer);
    ui.drawBoard();

    // Save this game instance.
    this.games.push({ logic, ui, container: gameDiv, resignButton, drawButton });
  }
  
  createMultipleGames(n) {
    for (let i = 0; i < n; i++) {
      this.createGame();
    }
  }
}
function showModal(message, yesCallback, noCallback) {

  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');

  const modalContainer = document.createElement('div');
  modalContainer.classList.add('modal-container');

  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  modalContainer.appendChild(messageElement);

  const yesButton = document.createElement('button');
  yesButton.textContent = 'Yes';
  yesButton.classList.add('modal-button');
  modalContainer.appendChild(yesButton);


  const noButton = document.createElement('button');
  noButton.textContent = 'No';
  noButton.classList.add('modal-button');
  modalContainer.appendChild(noButton);

  modalOverlay.appendChild(modalContainer);

  document.body.appendChild(modalOverlay);

  yesButton.addEventListener('click', () => {
    if (typeof yesCallback === 'function') {
      yesCallback();
    }
    document.body.removeChild(modalOverlay);
  });

  noButton.addEventListener('click', () => {
    if (typeof noCallback === 'function') {
      noCallback();
    }
    document.body.removeChild(modalOverlay);
  });
}


class Logic {
    constructor() {
      this.board = this.createBoard();
      this.isWhiteTurn = true;
    }
  
    createBoard() {
      let board = [];
      for (let row = 0; row < 8; row++) {
        board[row] = [];
        for (let col = 0; col < 8; col++) {
          board[row][col] = null;
          // Setup initial pieces on black squares if desired.
          if ((row + col) % 2 === 1) {
            if (row < 3) {
              board[row][col] = { isWhite: false, isBurned: false }; // Black piece
            } else if (row > 4) {
              board[row][col] = { isWhite: true, isBurned: false }; // White piece
            }
          }
        }
      }
      return board;
    }
  
    getBoard() {
      return this.board;
    }
    isSquareEmpty(moveData){
      return this.board[moveData.rowFrom][moveData.colFrom] === null
    }
    isSameSquare(moveData){
      return moveData.rowFrom === moveData.rowTo && moveData.colFrom === moveData.colTo;
    }
    isValidTurn(moveData){
      return(moveData.piece.isWhite && !this.isWhiteTurn) || (!moveData.piece.isWhite && this.isWhiteTurn)
    }
    isDestinationNotEmpty(moveData){
      return this.board[moveData.rowTo][moveData.colTo] !== null;
    }
    isDiagonalMove(moveData){
      return moveData.absRowDiff !== moveData.absColDiff
    }

    isLegalMove = function(moveData){

      if (!this.isMultiCapture(moveData)) return false; 

      if(this.isSquareEmpty(moveData)) return false;

      if(this.isValidTurn(moveData)) return false;

      if (this.isDestinationNotEmpty(moveData))  return false;
    
      if (this.isDiagonalMove(moveData)) return false;
      
      return true;
    }

    getMoveData(move) {
      const rowFrom = Math.floor(move.from.row);
      const colFrom = Math.floor(move.from.col);
      const rowTo = Math.floor(move.to.row);
      const colTo = Math.floor(move.to.col);
      const rowDiff = rowTo - rowFrom;
      const colDiff = colTo - colFrom;
      const jumpedRow = Math.floor(rowFrom + rowDiff / 2);
      const jumpedCol = Math.floor(colFrom + colDiff / 2);
      const absRowDiff = Math.abs(rowDiff);
      const absColDiff = Math.abs(colDiff);
  
      const piece = this.board[rowFrom][colFrom];
      const isKing = piece.isKing;
      const direction = piece.isWhite ? -1 : 1;
      const captureDirection = piece.isWhite ? -2 : 2;
  
      return {
        move,
        rowFrom,
        colFrom,
        rowTo,
        colTo,
        rowDiff,
        colDiff,
        jumpedRow,
        jumpedCol,
        absRowDiff,
        absColDiff,
        piece,
        isKing,
        direction,
        captureDirection,
      };
    }

    ZeroPiecesLeft(){
      let numberOfWhitePieces = 0;
      let numbersofBlackPieces = 0;
      for(let r = 0; r<8; r++){
        for(let c = 0; c<8; c++){
          if(this.board[r][c] === null) continue;
          if(this.board[r][c].isWhite) numberOfWhitePieces++;
          else if(!this.board[r][c].isWhite) numbersofBlackPieces++;
    
        }
      }
      if(numbersofBlackPieces === 0 
        || numberOfWhitePieces === 0) 
        return true;
    
      return false;
    }

    isValidatedRegularMove(moveData){
      if(this.board[moveData.rowFrom][moveData.colFrom].isKing){ 
        return moveData.absRowDiff === 1 && moveData.absColDiff === 1;
      }
      return (moveData.rowFrom + moveData.direction === moveData.rowTo && moveData.absRowDiff === 1  && moveData.absColDiff === 1);
    }
    isCapturePieceExists(moveData){
      return this.board[moveData.jumpedRow][moveData.jumpedCol] 
      && this.board[moveData.jumpedRow][moveData.jumpedCol].isWhite !== moveData.isWhite
    }

    isValidatedCaptureMove(moveData) {
      return (
        // Allow capturing in both directions by checking absolute row difference
        Math.abs(moveData.rowDiff) === 2 
        && moveData.absColDiff === 2 
        && this.isCapturePieceExists(moveData)
      );
    }
    
    handlePromotion(move) {
      const piece = this.board[move.to.row][move.to.col];
      if (!piece) return;
      if (piece.isWhite && move.to.row === 0 && !piece.isKing) {
        piece.isKing = true;
        console.log("White piece promoted to king!");
      } else if (!piece.isWhite && move.to.row === 7 && !piece.isKing) {
        piece.isKing = true;
      }
    }

    isMultiCapture(moveData){
      if (this.activeCapturePiece) {
        if (moveData.rowFrom !== this.activeCapturePiece.row || moveData.colFrom !== this.activeCapturePiece.col) 
          return false;
      }
      return true;
    }

    isValidatedMove(move) {
      // if (!this.isLegalMove(moveData)) return false;

      let moveData = this.getMoveData(move);
      return this.isLegalMove(moveData) 
      && (this.isValidatedCaptureMove(moveData) 
      || this.isValidatedRegularMove(moveData));
    } 
    

    hasPlayerMadeCapturingMove(piece, row, col) {
      const directions = [-2, 2];
    
      for (let dr of directions) {
        for (let dc of directions) {
          let midRow = row + dr / 2;
          let midCol = col + dc / 2;
          let endRow = row + dr;
          let endCol = col + dc;
    
          if (
            endRow < 0 || endRow >= 8 ||
            endCol < 0 || endCol >= 8 ||
            midRow < 0 || midRow >= 8 ||
            midCol < 0 || midCol >= 8
          ) {
            continue;
          }
          
          if (
            this.board[midRow][midCol] !== null && 
            this.board[midRow][midCol] !== undefined &&
            this.board[midRow][midCol].isWhite !== piece.isWhite &&
            this.board[endRow][endCol] === null
          ) {
            return true;
            
          }
        }
      }
      return false;
    }

    makeBurnedPiece(r, c) {
      let square = document.querySelector(`#board-container .square[data-row="${r}"][data-col="${c}"]`);
      if (square) {
        let pieceEle = square.querySelector('.white-piece-img, .black-piece-img');
        if (pieceEle) {
          pieceEle.style.backgroundImage = "";
          pieceEle.classList.add('burned-piece')
          console.log(pieceEle)
          this.board[r][c] = null;
        }
      }
    }
    updateBurnedPiece(r, c) {
      this.board[r][c].isBurned = true;

      let square = document.querySelector(`#board-container .square[data-row="${r}"][data-col="${c}"]`);
      if (square) {
        let pieceEle = square.querySelector('.white-piece-img, .black-piece-img');
        if (pieceEle) {
          pieceEle.remove();
        }
      
      }
    }
    
    getCaptureMovesForPiece(piece, row, col) {
      const captureMoves = [];
      const directions = [-2, 2];
      
      for (let dr of directions) {
        for (let dc of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          const midRow = row + dr / 2;
          const midCol = col + dc / 2;
          
          if (
            newRow < 0 || newRow >= 8 ||
            newCol < 0 || newCol >= 8 ||
            midRow < 0 || midRow >= 8 ||
            midCol < 0 || midCol >= 8
          ) {
            continue;
          }

          if (this.board[newRow][newCol] !== null) continue;

            const midPiece = this.board[midRow][midCol];

          if (midPiece && midPiece.isWhite !== piece.isWhite) {
            captureMoves.push(new Move(new Position(row, col), new Position(newRow, newCol)));
          }
        }
      }
      return captureMoves;
    }
    hasCaptureOpportunity(piece, row, col) {
      let directions = [-2, 2];
      
      for (let dr of directions) {
        for (let dc of [-2, 2]) {
          let midRow = row + dr / 2;
          let midCol = col + dc / 2;
          let endRow = row + dr;
          let endCol = col + dc;
          
          if (
            this.board[midRow] &&
            this.board[midRow][midCol] &&
            this.board[midRow][midCol].isWhite !== piece.isWhite &&
            this.board[endRow] &&
            this.board[endRow][endCol] === null
          ) {
            return true;
          }
        }
      }
      return false;
    }
    
    canCapture() {
      // Loop over every board cell.
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.board[r][c] === null || this.board[r][c].isWhite !== this.isWhiteTurn) {
            continue;
          }
          if (this.hasCaptureOpportunity(this.board[r][c], r, c)) {
            return {row:r,col:c}
          }
        }
      }
      return null;
    }
    getCaptureCandidateForAllPieces() {
      let candidates = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          let piece = this.board[row][col];
          // Only check pieces that belong to the current turn.
          if (piece && piece.isWhite === this.isWhiteTurn) {
            let candidate = this.getCaptureCandidate(piece, row, col);
            if (candidate !== null) {
              candidates.push({
                piece: piece,
                from: { row: row, col: col },
                candidate: candidate
              });
            }
          }
        }
      }
      return candidates;
    }

    isCaptureAgainPossible(piece, row, col) {
      const directions = [-2, 2];
      
      for (let dr of directions) {
        for (let dc of [-2, 2]) {
          let newRow = row + dr;
          let newCol = col + dc;
          let midRow = row + dr / 2;
          let midCol = col + dc / 2;

          if (
            newRow < 0 || newRow >= 8 ||
            newCol < 0 || newCol >= 8 ||
            midRow < 0 || midRow >= 8 ||
            midCol < 0 || midCol >= 8
          ) {
            continue;
          }

          if (this.board[newRow][newCol] !== null) continue;

          let midPiece = this.board[midRow][midCol];
          if (midPiece && midPiece.isWhite !== piece.isWhite) {
            return {
              jumpedRow: midRow,
              jumpedCol: midCol,
              destination: { row: newRow, col: newCol }
            };
          }
        }
      }
      return null;
    }
    
    
    
    makeMove(move) {
      let piece = this.board[move.from.row][move.from.col];
      if (!piece) return;
      
      let moveData = this.getMoveData(move)

      const isCaptureMove = (moveData.absRowDiff === 2 && moveData.absColDiff === 2);
      
      if (isCaptureMove) {
        this.executeCapture(moveData, move, piece);
        let furtherCapture = this.isCaptureAgainPossible(piece, move.to.row, move.to.col);
        if (furtherCapture !== null) {
          this.activeCapturePiece = { row: move.to.row, col: move.to.col };
          return;
        }
        }
      else {
        let availableCaptures = this.canCapture();
        if (availableCaptures) {
          this.updateBurnedPiece(availableCaptures.row, availableCaptures.col);
        }
        if(!availableCaptures){
          this.executeMove(move, piece)
        }
        if(availableCaptures && !(move.from.row === availableCaptures.row && move.from.col === availableCaptures.col)){
          this.executeMove(move, piece)
      }
    }
      this.handlePromotion(move);
      this.setNextTurn();
    
  }
  setNextTurn(){
    this.activeCapturePiece = null;
    this.isWhiteTurn = !this.isWhiteTurn;
  }
  executeMove(move, piece){ 
    this.board[move.from.row][move.from.col] = null;
    this.board[move.to.row][move.to.col] = piece
  }
  executeCapture(moveData, move, piece){
    this.board[moveData.jumpedRow][moveData.jumpedCol] = null;
    this.board[move.from.row][move.from.col] = null;
    this.board[move.to.row][move.to.col] = piece;
  }
  }

  class Position {
    constructor(row, col) {
      this.row = row;
      this.col = col;
    }
  }
  
  class Move {
    constructor(from, to) {
      this.from = from;
      this.to = to;
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager('games-container');
    
    gameManager.createGame();
    
    // Add a listener to the "New Game" button.
    const newGameButton = document.getElementById('new-game-button');
    newGameButton.addEventListener('click', () => {
      gameManager.createGame();
    });
  });

  class UI {
    constructor(logic, container) {
      this.logic = logic;

      if (typeof container === 'string') {
        this.container = document.getElementById(container);
        if (!this.container) {
          console.error(`No element found with id "${container}".`);
          return;
        }
      } else {

        this.container = container;
      }
      if (!this.container) {
        console.error("No valid container provided.");
        return;
      }
      this.boardElement = document.createElement('div');
      this.boardElement.className = 'checkers-board';
      this.container.appendChild(this.boardElement);
    }
  
    drawBoard() {
      this.boardElement.innerHTML = ''; 
      let board = this.logic.getBoard();
      let burnedPiece = { square: undefined, piece: undefined };
  
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          let square = document.createElement('div');
          square.classList.add('square');
          square.dataset.row = row;
          square.dataset.col = col;
  
          if ((row + col) % 2 === 0) {
            square.classList.add('white-tile');
          } else {
            square.classList.add('black-tile');
          }
  
          let pieceData = board[row][col];
          if (pieceData) {
            let piece = document.createElement('div');
            if (pieceData.isBurned) {
              // Make burned logic.
              piece.classList.add('burned-piece');
              square.appendChild(piece);
              this.boardElement.appendChild(square);
              burnedPiece.piece = piece;
              burnedPiece.square = square;
              board[row][col].isBurned = false;
              board[row][col] = null;
            } else if (pieceData.isKing) {
              piece.classList.add(pieceData.isWhite ? 'white-king' : 'black-king');
            } else {
              piece.classList.add(pieceData.isWhite ? 'white-piece-img' : 'black-piece-img');
            }
            piece.draggable = true;
            piece.addEventListener('dragstart', this.handleDragStart.bind(this));
            square.appendChild(piece);
          }
          square.addEventListener('dragover', (e) => e.preventDefault());
          square.addEventListener('drop', this.handleDrop.bind(this));
          this.boardElement.appendChild(square);
        }
      }
      if (burnedPiece.square !== undefined) {
        setTimeout(() => {
          burnedPiece.square.removeChild(burnedPiece.piece);
        }, 750);
      }
    }
    
    checkGameOver() {
      if (this.logic.ZeroPiecesLeft()) {
        const modalOverlay = document.createElement('div');
        modalOverlay.classList.add('modal-overlay');

        const modalContainer = document.createElement('div');
        modalContainer.classList.add('modal-container');
        modalContainer.innerHTML = `
          <h2>Game Over</h2>
          <p>The game is over!</p>
        `;
        modalOverlay.appendChild(modalContainer);

        document.body.appendChild(modalOverlay);

        setTimeout(() => {
          modalOverlay.remove();
          this.logic.board = this.logic.createBoard(); 
          this.logic.isWhiteTurn = true;
          this.drawBoard();
        }, 3000);
      }
    }
   
    
    // Drag start handler (as a class method)
    handleDragStart(event) {
      let pieceEl = event.target;
      let squareEl = pieceEl.parentElement;
      let row = squareEl.dataset.row;
      let col = squareEl.dataset.col;
      // Pass the starting position as drag data.
      this.previousPieceRow = parseInt(row);
      this.previousPieceCol = parseInt(col);
    }
  
    // Drop handler (as a class method)
    handleDrop(event) {
      event.preventDefault();
      let targetSquare = event.currentTarget;
      // let targetRow = parseInt(targetSquare.dataset.row);
      // let targetCol = parseInt(targetSquare.dataset.col);
      let from = new Position(this.previousPieceRow, this.previousPieceCol)
      let to = new Position(parseInt(targetSquare.dataset.row), parseInt(targetSquare.dataset.col))

      // from = {row : this.previousPieceRow, col: this.previousPieceCol}
      // Retrieve the original square's position from drag data.
      let move = new Move(from, to);
      if (this.logic.isValidatedMove(move)) {
        
        this.logic.makeMove(move);
        this.drawBoard();
        this.checkGameOver();
      } else {
        console.log("Invalid move");
      }
    }
  }
  // Initialization once the DOM is loaded.
  document.addEventListener('DOMContentLoaded', () => {
    const logic = new Logic();
    const ui = new UI(logic, 'board-container');
    ui.drawBoard();
  });
  