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
        cell.style.backgroundColor = boardState[y][x] ? '#fff' : '#444';
    });
}

// Resets all cells to default color
function clearBoard() {
    Array.from(board.children).forEach(cell => cell.style.backgroundColor = '#444');
}

// Checks and removes completed lines
function clearFullLines() {
    for (let y = 0; y < 20; y++) {
        if (isLineFull(y)) {
            removeLine(y);
        }
    }
}

// Checks if a specific row is complete
function isLineFull(y) {
    return boardState[y].every(cell => cell === 1);
}

// Removes a completed line and shifts above rows down
function removeLine(y) {
    for (let row = y; row > 0; row--) {
        boardState[row] = boardState[row - 1].slice();
    }
    boardState[0] = Array(10).fill(0);
}
