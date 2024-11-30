// Main function to calculate moves
function calculateMoves() {
    moves = [];
    generateMovesForCurrentPiece();
    moves.sort((a, b) => a.score - b.score);
    currentMove = 0;
    displayCurrentMove();
}

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

// Process a single move by simulating the board state
function processMove(piece, offsetX, offsetY, rotation) {
    const tempBoard = copyBoard(boardState);
    const linesCleared = placePieceOnBoard(piece, offsetX, offsetY, tempBoard);

    const moveScore = calculateMoveScore(tempBoard, linesCleared);
    moves.push({
        rotation,
        offsetX,
        offsetY,
        score: moveScore,
        gaps: calculateGapsOnTempBoard(tempBoard),
        bumpiness: calculateBumpinessOnTempBoard(tempBoard),
        lineClears: linesCleared,
        heightPenalty: calculateHeightPenalty(tempBoard),
        iDependencies: calculateIDependenciesOnTempBoard(tempBoard)
    });
}

// Calculate the score for a move
function calculateMoveScore(board, linesCleared) {
    const immediateScore = calculateBoardScore(board, linesCleared);
    const lookAheadScore = calculateLookAheadScore(board, 1, lookAheadDepth);  // Start with depth 1
    return (immediateScore + lookAheadScore / 2);
}

// Evaluates future possible moves based on the given lookAheadDepth
function calculateLookAheadScore(tempBoard, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) {
        return 0; // Stop recursion at max depth
    }

    let totalBestScore = 0;
    let piecesEvaluated = 0;

    const pieces = Object.keys(PIECES);

    for (let pieceName of pieces) {
        const piece = PIECES[pieceName];
        const maxRotations = getMaxRotations(pieceName);

        // Evaluate the best move for this piece considering future moves
        const bestScoreForPiece = evaluatePieceLookAhead(tempBoard, piece, maxRotations, currentDepth, maxDepth);

        totalBestScore += bestScoreForPiece;
        piecesEvaluated++;
    }

    return totalBestScore / piecesEvaluated;
}

// Evaluate the best possible score for a given piece and its rotations considering future moves
function evaluatePieceLookAhead(tempBoard, piece, maxRotations, currentDepth, maxDepth) {
    let bestScore = Infinity;

    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(piece, rotation);

        for (let x = 0; x <= 10 - rotatedPiece[0].length; x++) {
            const offsetY = getDropHeight(rotatedPiece, x);
            if (offsetY < 0) continue;

            const lookAheadBoard = copyBoard(tempBoard);
            const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, lookAheadBoard);
            const moveScore = calculateBoardScore(lookAheadBoard, linesCleared);

            // Evaluate future moves by recursively calling calculateLookAheadScore
            const futureScore = calculateLookAheadScore(lookAheadBoard, currentDepth + 1, maxDepth);

            // Combine the current move score and the future evaluation
            const totalScore = moveScore + futureScore;

            bestScore = Math.min(bestScore, totalScore);
        }
    }

    return bestScore;
}

// Helper function to create a deep copy of the board state
function copyBoard(board) {
    return board.map(row => row.slice());
}


// Updates board state with new piece
function placePieceOnBoard(piece, offsetX, offsetY, board) {
    let linesCleared = 0; 
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                board[offsetY + y][offsetX + x] = 1;
            }
        });
    });

    linesCleared = clearFullLinesOnTempBoard(board);
    return linesCleared; 
}

// Similar to clearFullLines() but works on a temporary board state for move simulation. Returns number of lines cleared.
function clearFullLinesOnTempBoard(tempBoard) {
    let linesCleared = 0;
    for (let y = 0; y < 20; y++) {
        if (tempBoard[y].every(cell => cell === 1)) {

            tempBoard.splice(y, 1);
            tempBoard.unshift(Array(10).fill(0));
            linesCleared++;
        }
    }
    return linesCleared;
}

// Evaluates board state quality
function calculateBoardScore(board, linesCleared) {
    const gaps = calculateGapsOnTempBoard(board);
    const bumpiness = calculateBumpinessOnTempBoard(board);
    const heightPenalty = calculateHeightPenalty(board);
    const iDependencies = calculateIDependenciesOnTempBoard(board);
    
    // Always use currentWeights when auto play is enabled
    const weights = document.getElementById('autoPlayMode').checked ? currentWeights : multipliers;
    
    return gaps * weights.gaps + 
           bumpiness * weights.bumpiness + 
           linesCleared * weights.lineClears + 
           heightPenalty * weights.heightPenalty + 
           iDependencies * weights.iDependencies;
}

// Measures height differences between columns
function calculateBumpinessOnTempBoard(tempBoard) {
    const heights = Array(10).fill(0);
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 20; y++) {
            if (tempBoard[y][x] === 1) {
                heights[x] = 20 - y;
                break;
            }
        }
    }

    let bumpiness = 0;
    for (let x = 0; x < 9; x++) {
        bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    return bumpiness;
}

// Counts empty spaces beneath filled cells
function calculateGapsOnTempBoard(tempBoard) {
    let gaps = 0;
    for (let x = 0; x < 10; x++) {
        let blockFound = false;
        for (let y = 0; y < 20; y++) {
            if (tempBoard[y][x] === 1) {
                blockFound = true;
            } else if (blockFound && tempBoard[y][x] === 0) {

                let coverScore = 0;

                if (x === 0 || tempBoard[y][x - 1] === 1) {
                    coverScore++;
                }

                if (x === 9 || tempBoard[y][x + 1] === 1) {
                    coverScore++;
                }

                if (y === 0 || tempBoard[y - 1][x] === 1) {
                    coverScore++;
                }

                gaps += coverScore;
            }
        }
    }
    return gaps;
}

// Measures the tallest column on the board
function calculateHeightPenalty(board) {
    let maxHeight = 0;

    for (let x = 0; x < 10; x++) {

        for (let y = 0; y < 20; y++) {
            if (board[y][x] === 1) {
                maxHeight = Math.max(maxHeight, 20 - y); 
                break; 
            }
        }
    }

    return maxHeight; 
}

// Counts the amount of spots on the board that requires an I-piece to fill it
function calculateIDependenciesOnTempBoard(tempBoard) {
    let iDependencies = 0;

    for (let x = 0; x < 10; x++) {
        let depth = 0;  

        for (let y = 0; y < 20; y++) {

            let leftSolid = (x === 0 || tempBoard[y][x - 1] === 1);
            let rightSolid = (x === 9 || tempBoard[y][x + 1] === 1);

            if (tempBoard[y][x] === 0 && leftSolid && rightSolid) {

                depth++;
            } else {

                if (depth >= 3) {
                    iDependencies++;  
                }
                depth = 0;  
            }
        }

        if (depth >= 3) {
            iDependencies++;
        }
    }

    return iDependencies;
}