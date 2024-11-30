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

function drawPiece(piece, offsetX, offsetY) {
    clearBoard();
    renderBoard();
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const index = (offsetY + y) * 10 + (offsetX + x);
                if (index >= 0 && index < 200) {
                    board.children[index].style.backgroundColor = '#fff';
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
    let maxRotations;

    // Set the number of rotations based on piece type
    if (pieceName === 'O') {
        maxRotations = 1;
    } else if (pieceName === 'I' || pieceName === 'Z' || pieceName === 'S') {
        maxRotations = 2;
    } else {
        maxRotations = 4;
    }

    // Calculate all moves for each rotation
    for (let rotation = 0; rotation < maxRotations; rotation++) {
        const rotatedPiece = rotatePiece(selectedPiece, rotation);
        const pieceWidth = rotatedPiece[0].length;
        for (let x = 0; x <= 10 - pieceWidth; x++) {
            let offsetY = getDropHeight(rotatedPiece, x);

            // Make a copy of the board to simulate placing the piece
            const tempBoard = boardState.map(row => row.slice());

            // Place the piece on the temporary board
            rotatedPiece.forEach((row, y) => {
                row.forEach((cell, cellX) => {
                    if (cell === 1) {
                        tempBoard[offsetY + y][x + cellX] = 1;
                    }
                });
            });

            // Clear lines in the temporary board
            const linesCleared = clearFullLinesOnTempBoard(tempBoard);

            // Calculate gaps, bumpiness, height bonus, and I-Dependency on the updated board
            const gaps = calculateGapsOnTempBoard(tempBoard);
            const bumpiness = calculateBumpinessOnTempBoard(tempBoard);
            const heightPenalty = calculateheightPenalty(offsetY);
            const iDependencies = calculateIDependenciesOnTempBoard(tempBoard);

            const score = (gaps * 2.0 + bumpiness * 0.5 - linesCleared * 0.5 + heightPenalty * 1) + iDependencies * 5.0;

            moves.push({
                rotation,
                offsetX: x,
                offsetY,
                score,
                gaps,
                bumpiness,
                lineClears: linesCleared,
                heightPenalty,
                iDependencies
            });
        }
    }

    // Sort moves by score (lowest score is better)
    moves.sort((a, b) => a.score - b.score);
    currentMove = 0;
    displayCurrentMove();
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
function calculateheightPenalty(offsetY) {
    // The higher the piece is placed, the more points it gives
    // Use a 0.1 multiplier for this bonus
    const heightPenalty = (20 - offsetY);
    return heightPenalty;
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
    drawPiece(rotatedPiece, move.offsetX, move.offsetY);
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
    // Place piece on the board
    piece.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                boardState[offsetY + y][offsetX + x] = 1;
            }
        });
    });

    // Check and clear any full lines
    clearFullLines();
    renderBoard();
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

    randomModeInterval = setInterval(() => {
        const letters = Object.keys(PIECES);  // Array of piece names (I, O, T, etc.)

        // Get the current piece from the array based on pieceIndex
        const currentPiece = letters[pieceIndex];

        // Select the piece and confirm the move
        setTimeout(() => {
            selectPiece(currentPiece);
        }, 150);

        setTimeout(() => {
            confirmMove();
        }, 300);

        // Update pieceIndex to the next piece, looping back to 0 if necessary
        pieceIndex = (pieceIndex + 1) % letters.length;

    }, 450);  // Time interval between each move
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
