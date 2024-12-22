// Renders a piece on the board
function drawPiece(piece, offsetX, offsetY, preview = true) {
    clearBoard();
    renderBoard();
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const index = (offsetY + y) * 10 + (offsetX + x);
                if (index >= 0 && index < 200) {
                    board.children[index].style.backgroundColor = preview ? '#888' : '#fff';
                }
            }
        });
    });
}

// Checks if piece placement is valid
function checkCollision(piece, offsetX, offsetY) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col] !== 0) {
                const boardY = offsetY + row;
                const boardX = offsetX + col;
                if (
                    boardY >= 20 || // Prevent going outside the bottom of the board
                    boardX < 0 || boardX >= 10 || // Horizontal boundaries
                    (boardY >= 0 && boardState[boardY][boardX] !== 0) // Collision with existing blocks
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Calculates lowest possible position for a piece
function getDropHeight(piece, offsetX) {
    for (let y = 0; y <= 20 - piece.length; y++) {
        if (checkCollision(piece, offsetX, y)) {
            return y - 1;
        }
    }
    return 20 - piece.length;
}

// Function to attempt sliding the piece left or right after determining drop height
async function slidePieceAsync(piece, dropX, dropY, rotation, processedMoves, startBoard, depth) {
    let offsetX = dropX;
    let offsetY = dropY;

    // Try sliding left
    while (offsetX > 0 && !checkCollision(piece, offsetX - 1, offsetY)) {
        offsetX--;
        if (isPieceSupported(piece, offsetX, offsetY)) {
            const moveKey = `${offsetX},${offsetY},${rotation}`;
            if (!processedMoves.has(moveKey)) {
                await processDeepMove(piece, offsetX, offsetY, rotation, startBoard, depth);
                processedMoves.add(moveKey);
                
                // Update display after each move is processed
                moves.sort((a, b) => a.score - b.score);
                displayCurrentMove();
            }
        } else {
            break;
        }
    }

    // Reset and try sliding right
    offsetX = dropX;
    while (offsetX < 10 - piece[0].length && !checkCollision(piece, offsetX + 1, offsetY)) {
        offsetX++;
        if (isPieceSupported(piece, offsetX, offsetY)) {
            const moveKey = `${offsetX},${offsetY},${rotation}`;
            if (!processedMoves.has(moveKey)) {
                await processDeepMove(piece, offsetX, offsetY, rotation, startBoard, depth);
                processedMoves.add(moveKey);
                
                // Update display after each move is processed
                moves.sort((a, b) => a.score - b.score);
                displayCurrentMove();
            }
        } else {
            break;
        }
    }
}

function isPieceSupported(piece, offsetX, offsetY) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x] === 1) {
                const boardX = offsetX + x;
                const boardY = offsetY + y;

                // Check if the piece is on the bottom row or on another block
                if (boardY === 19 || boardState[boardY + 1] && boardState[boardY + 1][boardX] === 1) {
                    return true;  // Supported if it's on the bottom or another block
                }
            }
        }
    }
    return false;  // Not supported (floating)
}


// Places a piece permanently on the board
function placePiece(piece, offsetX, offsetY) {

    if (historyStack.length >= 50) {
        historyStack.shift(); 
    }

    historyStack.push(boardState.map(row => row.slice())); 

    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const index = (offsetY + y) * 10 + (offsetX + x);
                if (index >= 0 && index < 200) {
                    boardState[offsetY + y][offsetX + x] = 1;
                    board.children[index].style.backgroundColor = '#fff'; 
                }
            }
        });
    });

    clearFullLines();
    renderBoard();
}

// Returns a rotated version of the piece
function rotatePiece(piece, rotation) {
    let rotated = piece;
    for (let r = 0; r < rotation; r++) {
        rotated = rotated[0].map((_, colIndex) => rotated.map(row => row[colIndex]).reverse());
    }
    return rotated;
}

// Sets the current piece and calculates possible moves
function selectPiece(pieceName) {
    selectedPiece = PIECES[pieceName];
    currentPieceLabel.textContent = pieceName;
    calculateMoves();
    displayCurrentMove();

    const quickPlace = document.getElementById('quickPlace').checked;
    if (quickPlace) {
        confirmMove();  
    }
}