let squares = []; 
let board = []; 
const container = document.getElementById("board-container");
let isWhiteTurn = true;
let canCaptureAgain = false;
let previousMultiCapturePieceRow = -1; 
let previousMultiCapturePieceCol = -1;
let gameState = undefined
let isResigned;
let isDrawAccepted;
const turnDisplay = document.getElementById('turn-display');
const startGameBtn = document.getElementById('start-button');
const resignBtn = document.getElementById('resign-button');
const offerDrawBtn = document.getElementById('draw-button')
let gameOverModal = document.getElementById('gameoverModal');
let modal = document.getElementById('myModal');
let closeButton = document.getElementById('closeModal');
let agreeModal = document.getElementById('agreeModal');
let modalH2 = document.querySelector("#myModal h2");
let restartGameBtn = document.getElementById('restart-button');
let previousPiece;
let highlightSquares = []

container.addEventListener("click", (event) => {

  if(canCaptureAgain){
    return false;
  }

  const target = event.target;
  if (!target) return;

  let targetCol = target.dataset.col;
  let targetRow = target.dataset.row;

  if(!target.classList.contains("checker-piece")) {
    previousPiece.classList.remove("selected");
  }

  // if (!targetCol || !targetRow || board[targetRow][targetCol] === null) return;
  

  let objColor = board[targetRow][targetCol]
  if(!objColor) {
    return false;
  }
  objColor = objColor.isWhite;
  if (objColor !== isWhiteTurn) return;

  if(previousPiece){
      previousPiece.classList.remove("selected");
  }

  if (target.classList.contains("checker-piece")) {
      lightUpSquares(target)
      target.classList.add("selected");
      previousPiece = target;
   } 
   //else {
  //     previousPiece = null; 
  // }
});

container.addEventListener("click", (event) => {
  const target = event.target;
  let isValidMoveMade = false;
  
  if (previousPiece && !target.classList.contains("checker-piece")) {
    const move = initMove(previousPiece, target);
    
    if (isValidMove(move)) {
      const moveData = createMoveData(move);
      if (CanIMove(moveData) && !canCaptureAgain) {
        MakeMove(target, moveData);
        isValidMoveMade = true;
      }
      else if (canCaptureMove(moveData)) {
        if (isWrongPieceWhileMultiCapturing(moveData)) return false;

        MakeJump(target, moveData);
        handlePromotionIfAvaiable(moveData);

        if (hasCaptureAvailable(moveData)) { 
          previousMultiCapturePieceRow = moveData.rowTo;
          previousMultiCapturePieceCol = moveData.colTo;
          previousPiece.classList.add("selected");
          lightUpSquares(previousPiece)
          canCaptureAgain = true;
          changeTurn();
        }
        else {
          previousMultiCapturePieceRow = -1;
          previousMultiCapturePieceCol = -1;
          previousPiece.classList.remove("selected");
          canCaptureAgain = false;
        }
        isValidMoveMade = true;
      }

      handlePromotionIfAvaiable();

      if (isValidMoveMade) {
        boardUpdates();
        changeTurn();
        turnDisplay.innerHTML = isWhiteTurn ? "White's Turn" : "Black's Turn";
        if(!canCaptureAgain)
          turnOffSquares()
      }
    } else {
      console.log("Invalid move!");
    }

    if (IsGameOver()) {
      closeModal();
      return;
    }
  }
});

function turnOffSquares() {
  for (let targetR = 0; targetR < 8; targetR++) {
    for (let targetC = 0; targetC < 8; targetC++) {

      const targetSquare = document.querySelector(`[data-row='${targetR}'][data-col='${targetC}']`);
      const computedStyle = getComputedStyle(targetSquare);
      if (computedStyle.backgroundImage.includes('softblack.png')) {
        targetSquare.style.backgroundImage = 'url("./imgs/blackMarble.jpg")';  
      }
  }
}
}



startGameBtn.addEventListener('click', ()=>{
  gameState = initializeBoard();
  turnDisplay.innerHTML = "White's Turn"
  startGameBtn.classList.add('display-none');
  resignBtn.classList.remove('display-none');
  resignBtn.classList.add('display-true');
  offerDrawBtn.classList.remove('display-none');
  offerDrawBtn.classList.add('display-true');
})

 resignBtn.addEventListener('click', ()=> {
   closeModal(); 
})

offerDrawBtn.addEventListener('click', ()=>{
  modal.style.display = "block"
  // isDrawAccepted = true
  let drawOfferingUser = isWhiteTurn ? "White " : "black "
  drawOfferingUser += "has offered a draw"
  modalH2.innerHTML = drawOfferingUser
});
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});
closeButton.addEventListener('click', () => { 
  isDrawAccepted = false;
  modal.style.display = "none";
});

agreeModal.addEventListener('click', () => {
  isDrawAccepted = true;
  modal.style.display = "none";
  closeModal(); 
})

restartGameBtn.addEventListener('click', () => {
  resetBoard();
  gameState = initializeBoard();
  gameOverModal.style.display = "none";
  
});

function lightUpSquares(target) {
  const fromRow = parseInt(target.dataset.row);
  const fromCol = parseInt(target.dataset.col);

  for (let targetR = 0; targetR < 8; targetR++) {
    for (let targetC = 0; targetC < 8; targetC++) {
      if (!board[targetR] || board[targetR][targetC] !== null) continue;

      const targetSquare = document.querySelector(`[data-row='${targetR}'][data-col='${targetC}']`);
      if (!targetSquare) continue;

      const targetPiece = targetSquare.querySelector('.checker-piece'); 
      if (targetPiece !== null) continue;

      const from = new Position(fromRow, fromCol);
      const to = new Position(targetR, targetC);
      const movingPiece = new Move(from, to);

      const moveData = createMoveData(movingPiece);
      if (isValidMove(movingPiece) && (CanIMove(moveData) || canCaptureMove(moveData))) {
        // console.log(targetPiece.classList)
        targetSquare.style.backgroundImage = 'none';
        targetSquare.style.backgroundImage = 'url("./imgs/softblack.png")';
        console.log('hey')
      }
    }
  }
}

function closeModal() {
  let modal = document.getElementById("gameoverModal");
  let modalDisplay = document.querySelector("#gameoverID h2")
  let displayMsg = "";
  switch (isDrawAccepted){
    case true: displayMsg = "Game Ended By Agreement!"
    break;
    case false: displayMsg = isWhiteTurn ? "Black Has Won the Game!" : "White Has Won the Game!";
    break;
    default:displayMsg = isWhiteTurn ? "Black Has Won the Game!" : "White Has Won the Game!";
    break;
  }
    modalDisplay.innerHTML = displayMsg
    modal.classList.remove("display-none");
    modal.style.display = "block"; 
    startGameBtn.addEventListener('click', () => {
      resetBoard()
      initializeBoard()
    })
}
function resetBoard() {
  container.innerHTML = ''; 
  board = []; 
  squares = []; 
  previousMultiCapturePieceRow = -1; 
  previousMultiCapturePieceCol = -1;
  isWhiteTurn = true;
  previousPiece = null;
  canCaptureAgain = null;
  isDrawAccepted = null;
  isResigned = null;
  turnDisplay.innerHTML = "White's Turn";
}
function initializeBoard() {

  container.style.outline = '3px solid black';
  for (let row = 0; row < 8; row++) {
    board[row] = [];
    for (let col = 0; col < 8; col++) {
      board[row][col] = null; // All squares start empty
    }
  }
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = row;
      square.dataset.col = col;
      if ((row + col) % 2 === 0) {
        square.style.backgroundImage = "url('./imgs/whiteMarble.jpg')";
        board[row][col] = null; 
      } else {
        square.style.backgroundImage = "url('./imgs/blackMarble.jpg')";
        if (row < 3) {
          const piece = document.createElement("img");
          piece.name = "blackPiece";
          piece.src = "./imgs/blackPiece.png";
          piece.classList.add("checker-piece");
          piece.dataset.row = row;
          piece.dataset.col = col;
          piece.dataset.color = "black";
          square.appendChild(piece);
          board[row][col] = new Piece(false);
        } else if (row > 4) {
          const piece = document.createElement("img");
          piece.src = "./imgs/whitePiece.png";
          piece.classList.add("checker-piece");
          piece.classList.add("whitePiece");
          piece.dataset.row = row;
          piece.dataset.col = col;
          piece.dataset.color = "white";
          square.appendChild(piece);
          board[row][col] = new Piece(true);
        }
      }
      container.appendChild(square);
      squares.push(square);
      
    }
  }
}
function initMove(previousPiece ,target) {
  if (!previousPiece) return null;
  const from = new Position(previousPiece.dataset.row, previousPiece.dataset.col);
  const to = new Position(target.dataset.row, target.dataset.col);
  return new Move(from, to);
}
function isValidMove(move) {

  // const isKing = board[move.from.row][move.from.col].isKing; // use it for checking valid moves for king
    if (!move) return false;
    const row = Math.floor(move.from.row);
    const col = Math.floor(move.from.col);
    const piece = board[row][col];
  if (!piece) return false;

  if(move.from.row === move.to.row && move.from.col === move.to.col) return false;

  if((piece.isWhite && !isWhiteTurn)) return false;

  if(!piece.isWhite && isWhiteTurn) return false;

  if (move.to.row < 0 || move.to.row >= 8 || move.to.col < 0 || move.to.col >= 8) return false;

  if (board[move.to.row][move.to.col])  return false; // all the checkings here refer to the object, do i  need to check the dom object?

  let fromSquare = document.querySelector(`[data-row="${move.from.row}"][data-col="${move.from.col}"]`);
  let toSquare = document.querySelector(`[data-row="${move.to.row}"][data-col="${move.to.col}"]`);

  if(!fromSquare.querySelector(".checker-piece")) return false; //means the DOM object doesn't exist - null

  if(toSquare.querySelector(".checker-piece")) return false; //means the destination is occupied, isn't a valid move.

  const rowDiff = move.to.row - move.from.row;
  const colDiff = move.to.col - move.from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);

  if (absRowDiff !== absColDiff) return false;

  return true;
}
function hasCaptureAvailable(moveData) {

  if(board[moveData.rowTo][moveData.colTo] === null) return false;
  
  const directions = board[moveData.rowTo][moveData.colTo].isKing
    ? [[-2, -2], [-2, 2], [2, -2], [2, 2]]  
    : board[moveData.rowTo][moveData.colTo].isWhite
      ? (isWhiteTurn ? [[-2, -2], [-2, 2]] : [])  // White piece on white turn, move upward
      : (isWhiteTurn ? [] : [[2, -2], [2, 2]]);  // Black piece on black turn, move downward
  
  for (let [dr, dc] of directions) {
    const toRow = moveData.rowTo + dr;
    const toCol = moveData.colTo + dc;
    if (toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
      const midRow = moveData.rowTo + dr / 2;
      const midCol = moveData.colTo + dc / 2;
      if (board[midRow][midCol] && board[midRow][midCol].isWhite !== board[moveData.rowTo][moveData.colTo].isWhite &&
          board[toRow][toCol] === null) {
        return true;
      }
    }
  }
  return false;
}
function MakeMove(target, moveData) {
  if (handleBurnedPiece(target, moveData)) {

  } else {
    target.appendChild(previousPiece);  // Using previousPiece from moveData
    board[moveData.rowTo][moveData.colTo] = board[previousPiece.dataset.row][previousPiece.dataset.col];
    board[previousPiece.dataset.row][previousPiece.dataset.col] = null;
    previousPiece.dataset.row = moveData.rowTo;  // Use moveData.rowTo
    previousPiece.dataset.col = moveData.colTo;  // Use moveData.colTo
  }
}
function removePiece(jumpedRow, jumpedCol) {
  const jumpedSquare = document.querySelector(`[data-row='${jumpedRow}'][data-col='${jumpedCol}']`);
  if (jumpedSquare) {
      const piece = jumpedSquare.querySelector(".checker-piece");
      if (piece) {
          piece.remove(); // Remove from DOM
          board[jumpedRow][jumpedCol] = null; // Update board array
      }
  }
}
function MakeJump(target, moveData) {
  target.appendChild(previousPiece);  // No need to use moveData for previousPiece
  
  board[moveData.rowTo][moveData.colTo] = board[previousPiece.dataset.row][previousPiece.dataset.col];
  previousPiece.dataset.row = moveData.rowTo;  // Use moveData.rowTo
  previousPiece.dataset.col = moveData.colTo;  // Use moveData.colTo
  
  board[moveData.move.from.row][moveData.move.from.col] = null;
  
  const jumpedSquare = document.querySelector(`[data-row='${moveData.jumpedRow}'][data-col='${moveData.jumpedCol}']`);
  if (jumpedSquare) {
    const piece = jumpedSquare.querySelector(".checker-piece");
    if (piece) {
      piece.remove();  // Remove from DOM
      board[moveData.jumpedRow][moveData.jumpedCol] = null;  // Update board array
    }
  }
}
function CanIMove(moveData){

  if(board[moveData.rowFrom][moveData.colFrom].isKing){ 
    return moveData.absRowDiff === 1 
    && moveData.absColDiff === 1 
    && board[moveData.rowTo][moveData.colTo] === null;
  }
  return (moveData.rowFrom + moveData.direction === moveData.rowTo 
    && moveData.absRowDiff === 1 
    && moveData.absColDiff === 1 
    && board[moveData.rowTo][moveData.colTo] === null);
}
function boardUpdates(){
  previousPiece.style.border = "none";
  // previousPiece = null;
}
function canCaptureMove(moveData) {
  if (!board[moveData.rowFrom][moveData.colFrom]) return false;

  const piece = board[moveData.rowFrom][moveData.colFrom];
  // const colDifference = moveData.colTo - moveData.colFrom;

  return (
    (piece.isKing ? (moveData.rowDiff === 2 || moveData.rowDiff === -2) : moveData.rowDiff === moveData.captureDirection) 
    && moveData.absColDiff === 2 
    && board[moveData.jumpedRow][moveData.jumpedCol] 
    && board[moveData.jumpedRow][moveData.jumpedCol].isWhite !== piece.isWhite 
    && board[moveData.rowTo][moveData.colTo] === null 
  );
}
function createMoveData(move) {

  const rowFrom = Math.floor(move.from.row);
  const colFrom = Math.floor(move.from.col);
  const rowTo = Math.floor(move.to.row);
  const colTo = Math.floor(move.to.col);
  const rowDiff = rowTo - rowFrom; // Signed difference
  const colDiff = colTo - colFrom;
  const jumpedRow = Math.floor(parseInt(move.from.row) + (parseInt(rowDiff) / 2));
  const jumpedCol = Math.floor(parseInt(move.from.col) + (parseInt(colDiff) / 2));
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  const piece = board[rowFrom][colFrom];
  const isKing = piece.isKing; //incorrect defenetion . i
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
function isWrongPieceWhileMultiCapturing(moveData) {
  return canCaptureAgain && 
         (previousMultiCapturePieceRow !== moveData.rowFrom || 
          previousMultiCapturePieceCol !== moveData.colFrom);
}
function handlePromotionIfAvaiable(moveData){
  
  for(let c = 1; c< 8; c+=2){

    if(board[0][c] === null) continue;

    if(board[0][c].isWhite && !board[0][c].isKing){
      board[0][c].isKing = true;
      const pieceElement = document.querySelector(`[data-row='${0}'][data-col='${c}']`);
      const promotePiece = pieceElement.querySelector('.checker-piece')
      promotePiece.src = "./imgs/whiteKing.png";
    }
  }

  for(let c = 0; c < 8; c+=2){

    if(board[7][c] === null) continue;

    if(!board[7][c].isWhite && !board[7][c].isKing){
      board[7][c].isKing = true;
      const pieceElement = document.querySelector(`[data-row='${7}'][data-col='${c}']`);
      const promotePiece = pieceElement.querySelector('.checker-piece');
      promotePiece.src = "./imgs/blackKing.png";
    }
  }
}  
function ZeroPiecesLeft(){
  let numberOfWhitePieces = 0;
  let numbersofBlackPieces = 0;
  for(let r = 0; r<8; r++){
    for(let c = 0; c<8; c++){
      if(board[r][c] === null) continue;
      if(board[r][c].isWhite) numberOfWhitePieces++;
      else if(!board[r][c].isWhite) numbersofBlackPieces++;

    }
  }
  if(numbersofBlackPieces === 0 
    || numberOfWhitePieces === 0) 
    return true;

  return false;
}
function isStaleMate() {
  const isWhitePiece = isWhiteTurn ? true : false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === null || board[r][c].isWhite !== isWhitePiece) continue;

      const selectedSquare = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
      const previousPiece = selectedSquare.querySelector('.checker-piece'); 
      if(previousPiece === null) continue;

      for (let targetR = 0; targetR < 8; targetR++) {
        for (let targetC = 0; targetC < 8; targetC++) {
          if (board[targetR][targetC] !== null && board[targetR][targetC].isWhite === isWhitePiece) continue;

          const targetSquare = document.querySelector(`[data-row='${targetR}'][data-col='${targetC}']`);
          const targetPiece = targetSquare.querySelector('.checker-piece'); 

          if(targetPiece !== null) continue;

            const from = new Position(r, c);
            const to = new Position(targetR, targetC);
            let movingPiece = new Move(from, to);

            if (movingPiece === null || movingPiece === undefined) continue;

            const moveData = createMoveData(movingPiece);

          if (isValidMove(movingPiece) && (CanIMove(moveData) || canCaptureMove(moveData))) { //canCaptureMove(moveData)
            return false; 
          }
        }
      }
    }
  }

  return false;
}

function IsGameOver(){
  if(ZeroPiecesLeft()) { isWhiteTurn = !isWhiteTurn; return true;}
  if(hasPlayerResigned()) return true;
  if(hasDrawAccepted()) return true;
  if(isStaleMate()) return true;
  return false;
}
function hasPlayerResigned(){
  return isResigned;
}

function hasDrawAccepted(){
  return isDrawAccepted;
}

function changeTurn(){
  isWhiteTurn = !isWhiteTurn;
}
function makeBurnedPiece(target, r, c, moveData){
        const pieceElement = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        if (pieceElement) {
          const childToRemove = pieceElement.querySelector('.checker-piece'); // Adjust the selector
          if(previousPiece !== childToRemove){
            target.appendChild(previousPiece);
            board[moveData.rowTo][moveData.colTo] = board[previousPiece.dataset.row][previousPiece.dataset.col]
            board[previousPiece.dataset.row][previousPiece.dataset.col] = null;
            previousPiece.dataset.row = moveData.rowTo;
            previousPiece.dataset.col = moveData.colTo;
          }
          if (childToRemove) {
            childToRemove.src = "./imgs/burned.png";      
            setTimeout(()=>{
              childToRemove.remove();
            },750)
          }
          if(previousPiece){
          previousPiece.dataset.row = moveData.rowTo;
          previousPiece.dataset.col = moveData.colTo;
          }
          board[r][c] = null; // remove the piece object
          return true;
        }
}
function handleBurnedPiece(target, moveData){
  for(let r = 0; r< 8; r++){
    for(let c = 0; c<8; c++){
      if(board[r][c] === null || board[r][c].isWhite !== isWhiteTurn){
        continue
      }

      if(notCapturedAPieceButAvailable(board[r][c], r, c, moveData)){
          makeBurnedPiece(target, r, c, moveData)
          return true;
      }
    }
  }
  return false;
}
function isValidPosition(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function notCapturedAPieceButAvailable(piece, row, col, moveData) {
  // Determine the direction based on whether the piece is white or black
  let moveDirection = piece.isWhite ? -2 : 2;
  let directions = piece.isKing ? [-2, 2] : [moveDirection]; // Kings can move in both directions
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].isWhite === piece.isWhite) {
        continue; // Skip if the piece at this square is not an opponent
      }
      for (let dr of directions) {
        for (let dc of [-2, 2]) {  
          let midRow = row + dr / 2;   
          let midCol = col + dc / 2;   
          let endRow = row + dr;       
          let endCol = col + dc;      
          if (
            board[midRow][midCol] !== null &&                 
            board[midRow][midCol].isWhite !== piece.isWhite && 
            board[endRow][endCol] === null                    
          ) {
            return true; 
          }
        }
      }
    }
  }
  return false;  // No capture was possible
}
function Piece(isWhite) {
  this.isWhite = isWhite;
  this.isKing = false; // if he is a king is only measures by the object and not the DOM
}
function Position(row, col){
  this.row = row
  this.col = col
}
function Move(from, to){
  this.from = from;
  this.to = to;
}