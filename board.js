// Initializes the board by creating and adding cells.
function initBoard() {
    for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        board.appendChild(cell);
    }
    renderBoard();
}

// Renders the current board state to the UI.
function renderBoard() {
    Array.from(board.children).forEach((cell, index) => {
        const x = index % 10;
        const y = Math.floor(index / 10);
        cell.style.backgroundColor = boardState[y][x] ? '#fff' : '#444';
    });
}

// Clears the visual board (for temporary previews).
function clearBoard() {
    Array.from(board.children).forEach(cell => cell.style.backgroundColor = '#444');
}

// Renders a preview of the piece on the board.
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