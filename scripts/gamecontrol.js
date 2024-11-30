// Shows a worse possible move
function nextMove() {
    if (currentMove < moves.length - 1) {
        currentMove++;
        displayCurrentMove();
    }
}

// Shows a better possible move
function previousMove() {
    if (currentMove > 0) {
        currentMove--;
        displayCurrentMove();
    }
}

// Executes selected move
function confirmMove() {
    if (!selectedPiece) return;
    const move = moves[currentMove];
    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    placePiece(rotatedPiece, move.offsetX, move.offsetY);

    piecesPlaced++;
    document.getElementById('pieces-placed').textContent = piecesPlaced;
    console.log('Move confirmed, pieces placed:', piecesPlaced);

    calculateAverageHeightPenalty(); // Log average height penalty after each move
    selectPiece('None');
}

// Handles painting cells with the cursor
function handleCellAction(event, index) {
    const x = index % 10;
    const y = Math.floor(index / 10);

    if (event.type === 'mousedown') {
        isMouseDown = true;
        paintMode = !boardState[y][x];
    }
    boardState[y][x] = paintMode ? 1 : 0;
    clearFullLines();
    renderBoard();
}

// Reverts the last placed piece
function undoMove() {
    if (historyStack.length > 0) {
        const lastState = historyStack.pop(); 
        for (let y = 0; y < 20; y++) {
            boardState[y] = lastState[y].slice(); 
        }
        renderBoard();
        piecesPlaced = Math.max(0, piecesPlaced - 1); 
        document.getElementById('pieces-placed').textContent = piecesPlaced;
    } else {
        console.log("No moves to undo!");
    }
}