// Begins AI learning process
function startEvolution() {
    isEvolutionRunning = true;
    document.getElementById('autoPlayMode').checked = true;
    currentWeights = { ...multipliers };
    bestWeights = { ...multipliers };
    document.getElementById('current-weights').textContent = JSON.stringify(currentWeights, null, 2);
    document.getElementById('best-weights').textContent = JSON.stringify(bestWeights, null, 2);
    startNewGame();
    startRandomMode();
}

// Stops AI learning process
function stopEvolution() {
    isEvolutionRunning = false;
    stopRandomMode();
}

// Resets game state for new game
function startNewGame() {
    // Clear the board
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            boardState[y][x] = 0;
        }
    }
    renderBoard();
    
    // Reset game state
    currentGamePieces = 0;
    currentHeightPenalties = [];
    historyStack = [];
    piecesPlaced = 0;
    document.getElementById('pieces-placed').textContent = '0';
    pieceIndex = 0; // Reset to start with 'I' piece
}

// Handles game completion and stats
function finishCurrentGame() {
    const gameScore = calculateGameScore();

    // Save current game stats
    gameStats.push({
        score: gameScore,
        weights: { ...currentWeights }
    });
    renderTopGamesChart();

    if (gameScore < bestScore) {
        bestScore = gameScore;
        bestWeights = { ...currentWeights }; // Save current weights as best
        document.getElementById('best-score').textContent = bestScore.toFixed(2);
        document.getElementById('best-weights').textContent = JSON.stringify(bestWeights, null, 2);
    }

    if (isEvolutionRunning) {
        // Generate new weights from the best weights
        currentWeights = mutateWeights(bestWeights);
        document.getElementById('current-weights').textContent = JSON.stringify(currentWeights, null, 2);
        startNewGame();
        startRandomMode(); // Continue auto-play
    } else {
        stopRandomMode();
    }
}

// Modifies AI parameters for evolution
function mutateWeights(weights) {
    const mutated = {};
    for (const key in weights) {
        // Always mutate each weight by a random amount within mutationRate
        const mutation = (Math.random() - 0.5) * 2 * mutationRate;
        mutated[key] = Number((weights[key] + mutation).toFixed(2));
    }
    return mutated;
}

// Calculates the average height of the board throughout every move played so far
function calculateAverageHeightPenalty() {
    const currentPenalty = calculateHeightPenalty(boardState);
    currentHeightPenalties.push(currentPenalty);
    
    // Log current average height penalty
    const currentAverage = currentHeightPenalties.reduce((a, b) => a + b, 0) / currentHeightPenalties.length;
    console.log(`Current Average Height Penalty: ${currentAverage.toFixed(2)}, Current Height: ${currentPenalty}`);
    document.getElementById('current-score').textContent = currentAverage.toFixed(2);
    
    // Only perform game-ending checks if evolution is running
    if (isEvolutionRunning) {
        // Check for game over condition
        if (!canPlaceAnyPiece()) {
            console.log("Game Over - No valid moves available");
            finishCurrentGame();
        }
        
        // Check if we've reached 250 pieces
        if (++currentGamePieces >= 250) {
            console.log("Game Over - Reached 250 pieces");
            finishCurrentGame();
        }
    }
}

// Computes overall game performance
function calculateGameScore() {
    if (currentHeightPenalties.length === 0) return Infinity;
    return currentHeightPenalties.reduce((a, b) => a + b, 0) / currentHeightPenalties.length;
}

// Checks if any piece can be placed
function canPlaceAnyPiece() {
    for (const pieceName in PIECES) {
        const piece = PIECES[pieceName];
        let maxRotations = pieceName === 'O' ? 1 : 
                          pieceName === 'I' || pieceName === 'S' || pieceName === 'Z' ? 2 : 4;
        
        for (let rotation = 0; rotation < maxRotations; rotation++) {
            const rotatedPiece = rotatePiece(piece, rotation);
            const pieceWidth = rotatedPiece[0].length;
            
            for (let x = 0; x <= 10 - pieceWidth; x++) {
                const offsetY = getDropHeight(rotatedPiece, x);
                if (offsetY >= 0) return true;
            }
        }
    }
    return false;
}