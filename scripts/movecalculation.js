// Generates all possible moves for the current piece and returns a score
function calculateMoves() {
    moves = [];
    if (!selectedPiece) {
        const tempBoard = boardState.map(row => row.slice());
        const immediateScore = calculateBoardScore(tempBoard, 0); 
        const lookAheadScore = calculateLookAheadScore(tempBoard);
        const averageLookAheadScore = (immediateScore + lookAheadScore / 2);
        
        moves.push({
            score: averageLookAheadScore,
            gaps: calculateGapsOnTempBoard(tempBoard),
            bumpiness: calculateBumpinessOnTempBoard(tempBoard),
            heightPenalty: calculateHeightPenalty(tempBoard),
            iDependencies: calculateIDependenciesOnTempBoard(tempBoard)
        });

        moves.sort((a, b) => a.score - b.score);
        currentMove = 0;
        displayCurrentMove();
        return;
    }

    const pieceName = currentPieceLabel.textContent;
    let maxRotations = pieceName === 'O' ? 1 : pieceName === 'I' || pieceName === 'Z' || pieceName === 'S' ? 2 : 4;

    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(selectedPiece, rotation);
        const pieceWidth = rotatedPiece[0].length;

        for (let x = 0; x <= 10 - pieceWidth; x++) {
            const offsetY = getDropHeight(rotatedPiece, x);
            if (offsetY < 0) continue;

            const tempBoard = boardState.map(row => row.slice());
            const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, tempBoard);

            const immediateScore = calculateBoardScore(tempBoard, linesCleared);
            const lookAheadScore = calculateLookAheadScore(tempBoard);
            const averageLookAheadScore = (immediateScore + lookAheadScore / 2);

            moves.push({
                rotation,
                offsetX: x,
                offsetY,
                score: averageLookAheadScore,
                gaps: calculateGapsOnTempBoard(tempBoard),
                bumpiness: calculateBumpinessOnTempBoard(tempBoard),
                lineClears: linesCleared,
                heightPenalty: calculateHeightPenalty(tempBoard),
                iDependencies: calculateIDependenciesOnTempBoard(tempBoard)
            });
        }
    }
    moves.sort((a, b) => a.score - b.score);
    currentMove = 0;
    displayCurrentMove();
}


// Evaluates future possible moves
function calculateLookAheadScore(tempBoard) {
    const pieces = Object.keys(PIECES);
    let totalBestScore = 0;
    let piecesEvaluated = 0;
    
    for (let pieceName of pieces) {
        const piece = PIECES[pieceName];
        let bestScoreForPiece = Infinity;
        let maxRotations = pieceName === 'O' ? 1 : pieceName === 'I' || pieceName === 'Z' || pieceName === 'S' ? 2 : 4;
        
        for (let rotation = 0; rotation < maxRotations; rotation++) {
            const rotatedPiece = rotatePiece(piece, rotation);
            const pieceWidth = rotatedPiece[0].length;
            
            for (let x = 0; x <= 10 - pieceWidth; x++) {
                const offsetY = getDropHeight(rotatedPiece, x);
                if (offsetY < 0) continue;
                
                const lookAheadBoard = tempBoard.map(row => row.slice()); 
                const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, lookAheadBoard); 
                
                const lookAheadMoveScore = calculateBoardScore(lookAheadBoard, linesCleared);
                bestScoreForPiece = Math.min(bestScoreForPiece, lookAheadMoveScore);
            }
        }
        totalBestScore += bestScoreForPiece;
        piecesEvaluated++;
    }
    return totalBestScore / piecesEvaluated;
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
    const weights = document.getElementById('autoPlayMode').checked ? currentWeights : initialWeights;
    
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