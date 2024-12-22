// Main function to calculate moves
function calculateMoves() {
    moves = [];
    generateMovesForCurrentPiece();
    moves.sort((a, b) => a.score - b.score);
    currentMove = 0;
    displayCurrentMove();
}

// Generate all possible moves for the currently selected piece
async function generateMovesForCurrentPiece() {
    const pieceName = currentPieceLabel.textContent;
    const maxRotations = getMaxRotations(pieceName);
    const processedMoves = new Set();

    // Create a queue of moves to process with increasing depth
    const moveQueue = [];

    // First, generate all initial positions
    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(selectedPiece, rotation);
        
        for (let x = 0; x <= 10 - rotatedPiece[0].length; x++) {
            const offsetY = getDropHeight(rotatedPiece, x);
            if (offsetY < 0) continue;

            moveQueue.push({
                piece: rotatedPiece,
                x: x,
                y: offsetY,
                rotation: rotation,
                depth: 1,
                board: copyBoard(boardState)
            });
        }
    }

    // Process moves with increasing depth
    for (let currentDepth = 1; currentDepth <= lookAheadDepth; currentDepth++) {
        const depthMoves = moveQueue.filter(move => move.depth === currentDepth);
        
        for (const move of depthMoves) {
            if (currentDepth === 1) {
                // For depth 1, just process the immediate move
                const moveKey = `${move.x},${move.y},${move.rotation}`;
                if (!processedMoves.has(moveKey) && isPieceSupported(move.piece, move.x, move.y)) {
                    await processDeepMove(move.piece, move.x, move.y, move.rotation, move.board, currentDepth);
                    processedMoves.add(moveKey);
                    
                    // Update display after each base move is processed
                    moves.sort((a, b) => a.score - b.score);
                    displayCurrentMove();
                    
                    // Add sliding positions for depth 1
                    await slidePieceAsync(move.piece, move.x, move.y, move.rotation, processedMoves, move.board, currentDepth);
                }
            } else {
                // For deeper moves, explore all possible next pieces
                const tempBoard = copyBoard(move.board);
                const linesCleared = placePieceOnBoard(move.piece, move.x, move.y, tempBoard);
                
                // Generate next moves for all possible pieces
                for (const nextPieceName of Object.keys(PIECES)) {
                    const nextPiece = PIECES[nextPieceName];
                    const nextMaxRotations = getMaxRotations(nextPieceName);
                    
                    for (let nextRotation = 0; nextRotation < nextMaxRotations; nextRotation++) {
                        const rotatedNextPiece = rotatePiece(nextPiece, nextRotation);
                        
                        for (let nextX = 0; nextX <= 10 - rotatedNextPiece[0].length; nextX++) {
                            const nextY = getDropHeight(rotatedNextPiece, nextX);
                            if (nextY < 0) continue;
                            
                            moveQueue.push({
                                piece: rotatedNextPiece,
                                x: nextX,
                                y: nextY,
                                rotation: nextRotation,
                                depth: currentDepth + 1,
                                board: copyBoard(tempBoard)
                            });
                        }
                    }
                }
            }
            
            // Add a small delay to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 0));
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
async function processDeepMove(piece, offsetX, offsetY, rotation, startBoard, depth) {
    const tempBoard = copyBoard(startBoard);
    const linesCleared = placePieceOnBoard(piece, offsetX, offsetY, tempBoard);
    
    // Calculate immediate score for this move
    const immediateScore = calculateBoardScore(tempBoard, linesCleared);
    
    // Store the move with its score
    moves.push({
        rotation,
        offsetX,
        offsetY,
        score: immediateScore,
        depth: depth,
        gaps: calculateGapsOnTempBoard(tempBoard),
        bumpiness: calculateBumpinessOnTempBoard(tempBoard),
        heightPenalty: calculateHeightPenalty(tempBoard),
        iDependencies: calculateIDependenciesOnTempBoard(tempBoard),
        linesSent: calculateLinesSent(linesCleared),
        sideBlocks: checkBlocksOnSides(tempBoard)
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
    const sideBlocks = checkBlocksOnSides(board); // Check for blocks on sides
    const linesSent = calculateLinesSent(linesCleared); // Calculate lines sent based on lines cleared

    return gaps * multipliers.gaps + 
           bumpiness * multipliers.bumpiness + 
           heightPenalty * multipliers.heightPenalty + 
           iDependencies * multipliers.iDependencies + 
           linesSent * multipliers.linesSent + 
           sideBlocks * multipliers.sideBlocks; // Incorporate side block penalty
}

// Calculate how many lines this move would send using TETRIO's line sending system
function calculateLinesSent(linesCleared) {
    if (linesCleared === 4) return 4; // Quad
    if (linesCleared === 3) return 2; // Triple
    if (linesCleared === 2) return 1; // Double
    return 0; // Single or no line
}

// Check for blocks on the left or right side of the board
function checkBlocksOnSides(board) {
    const leftSide = board.some(row => row[0] === 1); // Check leftmost column
    const rightSide = board.some(row => row[9] === 1); // Check rightmost column
    return (leftSide && rightSide) ? 1 : 0; // Return 1 only if both sides have blocks
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