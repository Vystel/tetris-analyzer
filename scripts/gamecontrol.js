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

    //calculateAverageHeightPenalty(); // Log average height penalty after each move
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

// Event listeners for textboxes
document.getElementById('gapsInput').addEventListener('input', function() {
    updateMultiplier('gapsInput', 'gaps');
});
document.getElementById('bumpinessInput').addEventListener('input', function() {
    updateMultiplier('bumpinessInput', 'bumpiness');
});
document.getElementById('lineClearsInput').addEventListener('input', function() {
    updateMultiplier('lineClearsInput', 'lineClears');
});
document.getElementById('heightPenaltyInput').addEventListener('input', function() {
    updateMultiplier('heightPenaltyInput', 'heightPenalty');
});
document.getElementById('iDependenciesInput').addEventListener('input', function() {
    updateMultiplier('iDependenciesInput', 'iDependencies');
});
document.getElementById('linesSentInput').addEventListener('input', function() {
    updateMultiplier('linesSentInput', 'linesSent');
});
document.getElementById('sideBlocksInput').addEventListener('input', function() {
    updateMultiplier('sideBlocksInput', 'sideBlocks');
});

// Function to set the multipliers to a preset
function setPreset(presetName) {
    const presets = {
        koreanStacker: {
            gaps: 1.22,
            bumpiness: 0.18,
            heightPenalty: 1.18,
            iDependencies: 2.58,
            linesSent: 0,
            sideBlocks: 0
        },
        90: {
            gaps: 4,
            bumpiness: 0.6,
            heightPenalty: 1,
            iDependencies: 4,
            linesSent: -16,
            sideBlocks: 8
        }
    };

    const preset = presets[presetName];
    for (const key in preset) {
        multipliers[key] = preset[key];
        document.getElementById(`${key}Input`).value = preset[key];
    }
}

setPreset("koreanStacker");

// Event listener for preset dropdown
document.getElementById('presetSelect').addEventListener('change', function() {
    const selectedPreset = document.getElementById('presetSelect').value;
    setPreset(selectedPreset);
});

// Initialize the UI to the current multipliers
function initializeUI() {
    for (const key in multipliers) {
        document.getElementById(`${key}Input`).value = multipliers[key];
    }
}

// Initialize the multipliers on page load
window.onload = initializeUI;