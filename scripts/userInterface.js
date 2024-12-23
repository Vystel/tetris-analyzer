// Sets the current piece and calculates possible moves
function updateMoveInfo() {
    const move = moves[currentMove];
    if (!move) return;
  
    currentMoveLabel.textContent = currentMove + 1;
  
    // Update individual score-related stats
    document.getElementById('score').textContent = `${move.score.toFixed(2)}`;
    document.getElementById('gaps').textContent = move.gaps;
    document.getElementById('bumpiness').textContent = move.bumpiness;
    document.getElementById('i-dependencies').textContent = move.iDependencies;
    document.getElementById('height-penalty').textContent = move.heightPenalty;
    document.getElementById('lines-sent').textContent = move.linesSent;
    document.getElementById('side-blocks').textContent = move.sideBlocks;
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

function selectPiece(pieceName) {
    selectedPiece = PIECES[pieceName];
    currentPieceLabel.textContent = pieceName;
    calculateMoves();
    drawPreview(selectedPiece);
    updateMoveInfo();

    const quickPlace = document.getElementById('quickPlace').checked;
    if (quickPlace) {
        confirmMove();  
    }
}

// Shows a worse possible move
function nextMove() {
    if (currentMove < moves.length - 1) {
        currentMove++;
        drawPreview(selectedPiece);
        updateMoveInfo();
    }
}

// Shows a better possible move
function previousMove() {
    if (currentMove > 0) {
        currentMove--;
        drawPreview(selectedPiece);
        updateMoveInfo();
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

// Function to update the multiplier value when the textbox is changed
function updateMultiplier(inputId, multiplierKey) {
    const value = parseFloat(document.getElementById(inputId).value);
    if (!isNaN(value)) {
        multipliers[multiplierKey] = value;
    } else {
        // If the input is invalid, reset the value to the current multiplier value
        document.getElementById(inputId).value = multipliers[multiplierKey];
    }
}

// Function to set the multipliers to a preset
function setPreset(presetName) {
    const preset = presets[presetName];
    for (const key in preset) {
        multipliers[key] = preset[key];
        document.getElementById(`${key}Input`).value = preset[key];
    }
}

// Initialize the UI to the current multipliers
function initializeUI() {
    for (const key in multipliers) {
        document.getElementById(`${key}Input`).value = multipliers[key];
    }
}

// Initialize the multipliers on page load
window.onload = initializeUI;
window.onload = setPreset("koreanStacker");