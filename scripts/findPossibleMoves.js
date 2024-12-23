// Generate all possible moves for the currently selected piece
function generateMovesForCurrentPiece() {
    const pieceName = currentPieceLabel.textContent;
    const maxRotations = getMaxRotations(pieceName);

    // Use a set to track processed (offsetX, offsetY, rotation) combinations
    const processedMoves = new Set();

    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(selectedPiece, rotation);

        // Calculate the drop height for the piece first
        for (let x = 0; x <= 10 - rotatedPiece[0].length; x++) {
            const offsetY = getDropHeight(rotatedPiece, x);
            if (offsetY < 0) continue; // No valid drop height, skip

            // Try sliding the piece left or right after calculating its drop height
            slidePiece(rotatedPiece, x, offsetY, rotation, processedMoves);
        }
    }
}

// Determine the maximum number of rotations for a piece
function getMaxRotations(pieceName) {
    if (pieceName === 'O') return 1;
    if (['I', 'Z', 'S'].includes(pieceName)) return 2;
    return 4;
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
function slidePiece(piece, dropX, dropY, rotation, processedMoves) {
    let offsetX = dropX;
    let offsetY = dropY;

    const originalMoveKey = `${offsetX},${offsetY},${rotation}`;
    if (!processedMoves.has(originalMoveKey) && isPieceSupported(piece, offsetX, offsetY)) {
        processMove(piece, offsetX, offsetY, rotation);
        processedMoves.add(originalMoveKey);
    }

    while (offsetX > 0 && !checkCollision(piece, offsetX - 1, offsetY)) {
        offsetX--;
        if (isPieceSupported(piece, offsetX, offsetY)) {
            const moveKey = `${offsetX},${offsetY},${rotation}`;
            if (!processedMoves.has(moveKey)) {
                processMove(piece, offsetX, offsetY, rotation);
                processedMoves.add(moveKey);
            }
        } else {
            break;
        }
    }

    offsetX = dropX;
    while (offsetX < 10 - piece[0].length && !checkCollision(piece, offsetX + 1, offsetY)) {
        offsetX++;
        if (isPieceSupported(piece, offsetX, offsetY)) {
            const moveKey = `${offsetX},${offsetY},${rotation}`;
            if (!processedMoves.has(moveKey)) {
                processMove(piece, offsetX, offsetY, rotation);
                processedMoves.add(moveKey);
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




// Returns a rotated version of the piece
function rotatePiece(piece, rotation) {
    let rotated = piece;
    for (let r = 0; r < rotation; r++) {
        rotated = rotated[0].map((_, colIndex) => rotated.map(row => row[colIndex]).reverse());
    }
    return rotated;
}

