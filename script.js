const board = document.getElementById('board');
const currentPieceLabel = document.getElementById('current-piece');
const currentMoveLabel = document.getElementById('current-move');
const scoreLabel = document.getElementById('score');

const PIECES = {
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'Z': [[1, 1, 0], [0, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]]
};

const PIECE_COLORS = {
    'I': 'teal',
    'O': 'yellow',
    'T': 'pink',
    'S': 'green',
    'Z': 'red',
    'J': 'blue',
    'L': 'orange'
};

let selectedPiece = null;
let currentMove = 0;
let piecesPlaced = 0;
let moves = [];
const boardState = Array(20).fill().map(() => Array(10).fill(0));
let historyStack = [];

function initBoard() {
    for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        board.appendChild(cell);
    }
    renderBoard();
}

function renderBoard() {
    Array.from(board.children).forEach((cell, index) => {
        const x = index % 10;
        const y = Math.floor(index / 10);
        cell.style.backgroundColor = boardState[y][x] ? '#fff' : '#444';
    });
}

function clearBoard() {
    Array.from(board.children).forEach(cell => cell.style.backgroundColor = '#444');
}

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


function selectPiece(pieceName) {
    selectedPiece = PIECES[pieceName];
    currentPieceLabel.textContent = pieceName;
    calculateMoves();
    displayCurrentMove();

    const quickPlace = document.getElementById('quickPlace').checked;
    if (quickPlace) {
        confirmMove();  // Automatically confirm the move
    }
}

function calculateMoves() {
    moves = [];
    const pieceName = currentPieceLabel.textContent;
    let maxRotations = pieceName === 'O' ? 1 : pieceName === 'I' || pieceName === 'Z' || pieceName === 'S' ? 2 : 4;

    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(selectedPiece, rotation);
        const pieceWidth = rotatedPiece[0].length;

        for (let x = 0; x <= 10 - pieceWidth; x++) {
            const offsetY = getDropHeight(rotatedPiece, x);
            const tempBoard = boardState.map(row => row.slice()); // Copy the board state

            const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, tempBoard);
            const gaps = calculateGapsOnTempBoard(tempBoard);
            const bumpiness = calculateBumpinessOnTempBoard(tempBoard);
            const heightPenalty = calculateHeightPenalty(tempBoard);

            const iDependencies = calculateIDependenciesOnTempBoard(tempBoard);

            const immediateScore = (gaps * 1.5 + bumpiness * 0.1 - linesCleared * 0.5 + heightPenalty * 1) + iDependencies * 2.5;
            const lookAheadScore = calculateLookAheadScore(tempBoard);
            const averageLookAheadScore = (immediateScore + lookAheadScore / 2);

            moves.push({
                rotation,
                offsetX: x,
                offsetY,
                score: averageLookAheadScore,
                gaps,
                bumpiness,
                lineClears: linesCleared,
                heightPenalty,
                iDependencies
            });
        }
    }

    moves.sort((a, b) => a.score - b.score);
    currentMove = 0;
    displayCurrentMove();
}



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
                const lookAheadBoard = tempBoard.map(row => row.slice()); // Copy the board state

                placePieceOnBoard(rotatedPiece, x, offsetY, lookAheadBoard); // Place and clear lines

                const gaps = calculateGapsOnTempBoard(lookAheadBoard);
                const bumpiness = calculateBumpinessOnTempBoard(lookAheadBoard);
                const linesCleared = clearFullLinesOnTempBoard(lookAheadBoard);
                const heightPenalty = calculateHeightPenalty(tempBoard);

                const iDependencies = calculateIDependenciesOnTempBoard(lookAheadBoard);

                const lookAheadMoveScore = (gaps * 1.5 + bumpiness * 0.1 - linesCleared * 0.5 + heightPenalty * 1) + iDependencies * 2.5;

                if (lookAheadMoveScore < bestScoreForPiece) {
                    bestScoreForPiece = lookAheadMoveScore;
                }
            }
        }

        totalBestScore += bestScoreForPiece;
        piecesEvaluated++;
    }

    return totalBestScore / piecesEvaluated;
}


// Helper function to place a piece on a board state (used in look-ahead)
function placePieceOnBoard(piece, offsetX, offsetY, board) {
    let linesCleared = 0; // Track lines cleared here
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                board[offsetY + y][offsetX + x] = 1;
            }
        });
    });

    // Clear lines and count them
    linesCleared = clearFullLinesOnTempBoard(board);
    return linesCleared; // Return the count
}



// Helper function to clear full lines on the temporary board and return the count of lines cleared
function clearFullLinesOnTempBoard(tempBoard) {
    let linesCleared = 0;
    for (let y = 0; y < 20; y++) {
        if (tempBoard[y].every(cell => cell === 1)) {
            // Remove the full line and add an empty line at the top
            tempBoard.splice(y, 1);
            tempBoard.unshift(Array(10).fill(0));
            linesCleared++;
        }
    }
    return linesCleared;
}
function calculateGapsOnTempBoard(tempBoard) {
    let gaps = 0;
    for (let x = 0; x < 10; x++) {
        let blockFound = false;
        for (let y = 0; y < 20; y++) {
            if (tempBoard[y][x] === 1) {
                blockFound = true;
            } else if (blockFound && tempBoard[y][x] === 0) {
                // It's a gap, now calculate how many sides are covered
                let coverScore = 0;

                // Check the left side (if x == 0, it's considered solid)
                if (x === 0 || tempBoard[y][x - 1] === 1) {
                    coverScore++;
                }

                // Check the right side (if x == 9, it's considered solid)
                if (x === 9 || tempBoard[y][x + 1] === 1) {
                    coverScore++;
                }

                // Check above the gap (if y == 0, it's considered solid)
                if (y === 0 || tempBoard[y - 1][x] === 1) {
                    coverScore++;
                }

                // Add the cover score to the gap score
                gaps += coverScore;
            }
        }
    }
    return gaps;
}
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

    // Calculate bumpiness as the sum of height differences between adjacent columns
    let bumpiness = 0;
    for (let x = 0; x < 9; x++) {
        bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    return bumpiness;
}
function calculateHeightPenalty(board) {
    let maxHeight = 0;

    // Loop through each column
    for (let x = 0; x < 10; x++) {
        // Find the highest block in the column
        for (let y = 0; y < 20; y++) {
            if (board[y][x] === 1) {
                maxHeight = Math.max(maxHeight, 20 - y); // Update maxHeight based on the block's height
                break; // Stop at the first block in this column
            }
        }
    }

    return maxHeight; // The highest block on the board
}


function calculateIDependenciesOnTempBoard(tempBoard) {
    let iDependencies = 0;

    // Loop over columns 0 to 9 (all columns)
    for (let x = 0; x < 10; x++) {
        let depth = 0;  // Track the depth of a potential I-Dependency

        for (let y = 0; y < 20; y++) {
            // Check the "solid" condition for left and right edges (x = 0 and x = 9)
            let leftSolid = (x === 0 || tempBoard[y][x - 1] === 1);
            let rightSolid = (x === 9 || tempBoard[y][x + 1] === 1);

            // Check if this is an empty space with solid boundaries on both sides
            if (tempBoard[y][x] === 0 && leftSolid && rightSolid) {
                // Found part of a 1-wide gap enclosed horizontally, increase depth count
                depth++;
            } else {
                // If we encounter a filled cell or no solid boundary, check if we had a valid I-Dependency
                if (depth >= 3) {
                    iDependencies++;  // Count this as an I-Dependency
                }
                depth = 0;  // Reset depth after encountering an obstacle
            }
        }

        // After checking all rows for this column, check if we had a valid I-Dependency at the end
        if (depth >= 3) {
            iDependencies++;
        }
    }

    return iDependencies;
}


function displayCurrentMove() {
    if (!selectedPiece) return;
    const move = moves[currentMove];
    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    drawPiece(rotatedPiece, move.offsetX, move.offsetY, true); // Draw as gray (preview)
    currentMoveLabel.textContent = currentMove + 1;
    scoreLabel.textContent = `Score: ${move.score.toFixed(2)} (Gaps: ${move.gaps}, Bumpiness: ${move.bumpiness}, Line Clears: ${move.lineClears}, I-Dependencies: ${move.iDependencies}, Height Penalty: ${move.heightPenalty})`;
}





function getDropHeight(piece, offsetX) {
    // Find the lowest Y position where the piece can be placed without overlap
    for (let y = 0; y <= 20 - piece.length; y++) {
        if (checkCollision(piece, offsetX, y)) {
            return y - 1;
        }
    }
    return 20 - piece.length;
}

function checkCollision(piece, offsetX, offsetY) {
    // Check if a piece at a given position collides with existing blocks
    return piece.some((row, y) => row.some((cell, x) => cell && boardState[offsetY + y][offsetX + x]));
}

function rotatePiece(piece, rotation) {
    let rotated = piece;
    for (let r = 0; r < rotation; r++) {
        rotated = rotated[0].map((_, colIndex) => rotated.map(row => row[colIndex]).reverse());
    }
    return rotated;
}

function previousMove() {
    if (currentMove > 0) {
        currentMove--;
        displayCurrentMove();
    }
}

function nextMove() {
    if (currentMove < moves.length - 1) {
        currentMove++;
        displayCurrentMove();
    }
}

function confirmMove() {
    if (!selectedPiece) return;
    const move = moves[currentMove];
    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    placePiece(rotatedPiece, move.offsetX, move.offsetY);

    piecesPlaced++;
    document.getElementById('pieces-placed').textContent = piecesPlaced;
    console.log('Move confirmed, pieces placed:', piecesPlaced);
}

function placePiece(piece, offsetX, offsetY) {
    // Save the current board state to the history stack
    if (historyStack.length >= 50) {
        historyStack.shift(); // Remove the oldest entry if stack exceeds 50 states
    }
    historyStack.push(boardState.map(row => row.slice())); // Save a deep copy

    // Place the piece on the board
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const index = (offsetY + y) * 10 + (offsetX + x);
                if (index >= 0 && index < 200) {
                    boardState[offsetY + y][offsetX + x] = 1;
                    board.children[index].style.backgroundColor = '#fff'; // Set to white on placement
                }
            }
        });
    });

    // Check and clear any full lines
    clearFullLines();
    renderBoard();
}

function undoMove() {
    if (historyStack.length > 0) {
        const lastState = historyStack.pop(); // Retrieve the last saved state
        for (let y = 0; y < 20; y++) {
            boardState[y] = lastState[y].slice(); // Deep copy the state back to the board
        }
        renderBoard();
        piecesPlaced = Math.max(0, piecesPlaced - 1); // Decrement pieces placed count
        document.getElementById('pieces-placed').textContent = piecesPlaced;
    } else {
        console.log("No moves to undo!");
    }
}





function clearFullLines() {
    for (let y = 0; y < 20; y++) {
        if (isLineFull(y)) {
            removeLine(y);
        }
    }
}

function isLineFull(y) {
    // Check if all cells in row y are filled (1)
    return boardState[y].every(cell => cell === 1);
}

function removeLine(y) {
    // Remove the full line and shift everything above it down
    for (let row = y; row > 0; row--) {
        boardState[row] = boardState[row - 1].slice();
    }
    // Clear the top row after shifting
    boardState[0] = Array(10).fill(0);
}





// Get reference to the checkbox
const randomModeCheckbox = document.getElementById('autoPlayMode');

let randomModeInterval;

randomModeCheckbox.addEventListener('change', function() {
    if (this.checked) {
        startRandomMode();
    } else {
        stopRandomMode();
    }
});

let pieceIndex = 0;  // Start with the first piece

function startRandomMode() {
    clearInterval(randomModeInterval);

    // Retrieve PPS from the textbox, defaulting to 2 if empty
    const pps = parseFloat(document.getElementById("autoplaySpeed").value) || 2;

    // Calculate interval in milliseconds
    const interval = 1000 / pps;

    // Check if the checkbox is checked
    const randomModeEnabled = document.getElementById("randomModeToggle").checked;

    randomModeInterval = setInterval(() => {
        const letters = Object.keys(PIECES);

        // Select piece based on toggle
        let selectedPiece;
        if (randomModeEnabled) {
            const randomIndex = Math.floor(Math.random() * letters.length);
            selectedPiece = letters[randomIndex]; // Select a random piece
        } else {
            selectedPiece = letters[pieceIndex];  // Sequential selection
            pieceIndex = (pieceIndex + 1) % letters.length; // Loop back to 0 if necessary
        }

        // Select the piece and confirm the move
        setTimeout(() => {
            selectPiece(selectedPiece);
        }, interval / 3);

        setTimeout(() => {
            confirmMove();
        }, interval / 1.5);

    }, interval);  // Use the calculated interval based on PPS
}




function stopRandomMode() {
    clearInterval(randomModeInterval);
}

/*
function startRandomMode() {
    clearInterval(randomModeInterval);

    randomModeInterval = setInterval(() => {
        const letters = Object.keys(PIECES);
        const randomIndex = Math.floor(Math.random() * letters.length);
        const randomLetter = letters[randomIndex];

        setTimeout(() => {
            selectPiece(randomLetter);
        }, 150);
        setTimeout(() => {
            confirmMove();
        }, 300);
    }, 450);
}
*/


// Initialize the board on page load
initBoard();
