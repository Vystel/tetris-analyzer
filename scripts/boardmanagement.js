// Creates initial game board and sets up event listeners
function initBoard() {
    for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('mousedown', (e) => handleCellAction(e, i));
        cell.addEventListener('mouseover', (e) => {
            if (isMouseDown) handleCellAction(e, i);
        });

        board.appendChild(cell);
    }
    document.addEventListener('mouseup', () => {
        isMouseDown = false;
        paintMode = null;
    });
    renderBoard();
}

// Updates visual display of the game board
function renderBoard() {
    Array.from(board.children).forEach((cell, index) => {
        const x = index % 10;
        const y = Math.floor(index / 10);
        cell.style.backgroundColor = boardState[y][x] ? '#fff' : '#111';
    });
}

// Resets all cells to default color
function clearBoard() {
    Array.from(board.children).forEach(cell => cell.style.backgroundColor = '#111');
}

// Checks and removes completed lines
function clearFullLines() {
    for (let y = 0; y < 20; y++) {
        if (boardState[y].every((cell) => cell === 1)) {
            for (let row = y; row > 0; row--) {
            boardState[row] = boardState[row - 1].slice();
            }
            boardState[0] = Array(10).fill(0);
        }
    }
}

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

function drawPreview(selectedPiece) {
    if (!selectedPiece) return;
    const move = moves[currentMove];

    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    drawPiece(rotatedPiece, move.offsetX, move.offsetY, true); 
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