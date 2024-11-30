const board = document.getElementById('board');
const currentPieceLabel = document.getElementById('current-piece');
const currentMoveLabel = document.getElementById('current-move');
const scoreLabel = document.getElementById('score');
const boardState = Array(20).fill().map(() => Array(10).fill(0));

let selectedPiece = null;
let currentMove = 0;
let piecesPlaced = 0;
let moves = [];
let historyStack = [];

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
    'I': '#3DBF8F',
    'O': '#C0A73E',
    'T': '#B34FA9',
    'S': '#93C443',
    'Z': '#C8464C',
    'J': '#6150B3',
    'L': '#C16F3E'
};


let isMouseDown = false;
let paintMode = null;

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

function handleCellAction(event, index) {
    const x = index % 10;
    const y = Math.floor(index / 10);

    if (event.type === 'mousedown') {
        isMouseDown = true;
        paintMode = !boardState[y][x];
    }
    boardState[y][x] = paintMode ? 1 : 0;
    renderBoard();
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
        confirmMove();  
    }
}

function calculateBoardScore(board, linesCleared) {
    const gaps = calculateGapsOnTempBoard(board);
    const bumpiness = calculateBumpinessOnTempBoard(board);
    const heightPenalty = calculateHeightPenalty(board);
    const iDependencies = calculateIDependenciesOnTempBoard(board);
    
    return gaps * 1.5 + bumpiness * 0.1 - linesCleared * 0.5 + heightPenalty * 1 + iDependencies * 2.5;
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
            if (offsetY < 0) continue;
            
            const tempBoard = boardState.map(row => row.slice()); 
            const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, tempBoard);
            
            const immediateScore = calculateBoardScore(tempBoard, linesCleared);
            const lookAheadScore = calculateLookAheadScore(tempBoard);
            const averageLookAheadScore = (immediateScore + lookAheadScore / 2);
            
            moves.push({
                rotation,
                offsetX: x,
                offsetY,
                score: averageLookAheadScore,
                gaps: calculateGapsOnTempBoard(tempBoard),
                bumpiness: calculateBumpinessOnTempBoard(tempBoard),
                lineClears: linesCleared,
                heightPenalty: calculateHeightPenalty(tempBoard),
                iDependencies: calculateIDependenciesOnTempBoard(tempBoard)
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
                if (offsetY < 0) continue;
                
                const lookAheadBoard = tempBoard.map(row => row.slice()); 
                const linesCleared = placePieceOnBoard(rotatedPiece, x, offsetY, lookAheadBoard); 
                
                const lookAheadMoveScore = calculateBoardScore(lookAheadBoard, linesCleared);
                bestScoreForPiece = Math.min(bestScoreForPiece, lookAheadMoveScore);
            }
        }
        totalBestScore += bestScoreForPiece;
        piecesEvaluated++;
    }
    return totalBestScore / piecesEvaluated;
}

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

function displayCurrentMove() {
    if (!selectedPiece) return;
    const move = moves[currentMove];
    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    drawPiece(rotatedPiece, move.offsetX, move.offsetY, true); 
    currentMoveLabel.textContent = currentMove + 1;
    scoreLabel.textContent = `Score: ${move.score.toFixed(2)} (Gaps: ${move.gaps}, Bumpiness: ${move.bumpiness}, Line Clears: ${move.lineClears}, I-Dependencies: ${move.iDependencies}, Height Penalty: ${move.heightPenalty})`;
}

function getDropHeight(piece, offsetX) {

    for (let y = 0; y <= 20 - piece.length; y++) {
        if (checkCollision(piece, offsetX, y)) {
            return y - 1;
        }
    }
    return 20 - piece.length;
}

function checkCollision(piece, offsetX, offsetY) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col] !== 0) {
                const boardY = offsetY + row;
                const boardX = offsetX + col;
                if (
                    boardY >= 20 || // Prevent going outside the bottom of the board
                    boardX < 0 || boardX >= 10 || // Horizontal boundaries
                    (boardY >= 0 && boardState[boardY][boardX] !== 0) // Collision with existing blocks
                ) {
                    return true;
                }
            }
        }
    }
    return false;
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

    calculateAverageHeightPenalty(); // Log average height penalty after each move
}

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

function clearFullLines() {
    for (let y = 0; y < 20; y++) {
        if (isLineFull(y)) {
            removeLine(y);
        }
    }
}

function isLineFull(y) {

    return boardState[y].every(cell => cell === 1);
}

function removeLine(y) {

    for (let row = y; row > 0; row--) {
        boardState[row] = boardState[row - 1].slice();
    }

    boardState[0] = Array(10).fill(0);
}

const randomModeCheckbox = document.getElementById('autoPlayMode');

let randomModeInterval;

randomModeCheckbox.addEventListener('change', function() {
    if (this.checked) {
        startRandomMode();
    } else {
        stopRandomMode();
    }
});

let pieceIndex = 0; // Track the current piece in the sequence

function startRandomMode() {
    clearInterval(randomModeInterval);

    const pps = parseFloat(document.getElementById("autoplaySpeed").value) || 2;
    const interval = 1000 / pps;
    const randomModeEnabled = document.getElementById("randomModeToggle").checked;

    randomModeInterval = setInterval(() => {
        const letters = Object.keys(PIECES);

        let selectedPiece;
        if (randomModeEnabled) {
            // Select a random piece from the available pieces
            const randomIndex = Math.floor(Math.random() * letters.length);
            selectedPiece = letters[randomIndex];
        } else {
            // If not in random mode, select in sequence starting from 'I'
            selectedPiece = letters[pieceIndex];
            pieceIndex = (pieceIndex + 1) % letters.length; // Cycle through pieces
        }

        // Force start from 'I' piece after each evolution
        if (pieceIndex === 0) { // Reset back to 'I' piece if we cycle back
            pieceIndex = letters.indexOf('I');
        }

        setTimeout(() => {
            selectPiece(selectedPiece);
        }, interval / 3);

        setTimeout(() => {
            confirmMove();
        }, interval / 1.5);

    }, interval);
}


function stopRandomMode() {
    clearInterval(randomModeInterval);
}

function calculateAverageHeightPenalty() {
    if (historyStack.length === 0) {
        console.log("No board history to calculate average height penalty.");
        return;
    }

    let totalHeightPenalty = 0;

    historyStack.forEach(boardState => {
        totalHeightPenalty += calculateHeightPenalty(boardState);
    });

    const averageHeightPenalty = totalHeightPenalty / historyStack.length;
    console.log("Average Height Penalty:", averageHeightPenalty);
}












// Scoring parameters structure
class ScoringParams {
    constructor(gapsWeight = 1.5, bumpinessWeight = 0.1, lineClearWeight = 0.5, heightWeight = 1.0, iDependencyWeight = 2.5) {
        this.gapsWeight = gapsWeight;
        this.bumpinessWeight = bumpinessWeight;
        this.lineClearWeight = lineClearWeight;
        this.heightWeight = heightWeight;
        this.iDependencyWeight = iDependencyWeight;
    }

    mutate(mutationRate = 0.2) {
        const mutated = new ScoringParams();
        for (let param in this) {
            if (Math.random() < mutationRate) {
                // Randomly adjust the parameter by up to ±50%
                mutated[param] = this[param] * (1 + (Math.random() - 0.5));
            } else {
                mutated[param] = this[param];
            }
        }
        return mutated;
    }
}

class Evolution {
    constructor(populationSize = 50, generationLimit = 20) {
        this.populationSize = populationSize;
        this.generationLimit = generationLimit;
        this.population = [];
        this.generation = 0;
        this.bestScores = [];
    }

    initializePopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(new ScoringParams(
                1.5 * (1 + (Math.random() - 0.5)),
                0.1 * (1 + (Math.random() - 0.5)),
                0.5 * (1 + (Math.random() - 0.5)),
                1.0 * (1 + (Math.random() - 0.5)),
                2.5 * (1 + (Math.random() - 0.5))
            ));
        }
    }

    clearBoard() {
        // Reset board state
        for (let y = 0; y < boardState.length; y++) {
            for (let x = 0; x < boardState[y].length; x++) {
                boardState[y][x] = 0;
            }
        }
        historyStack = [];
        piecesPlaced = 0;
        renderBoard();
        document.getElementById('pieces-placed').textContent = '0';
    }

    async evaluateParams(params) {
        return new Promise((resolve) => {
            let heightPenalties = [];
            let movesPlayed = 0;
            let gameOver = false;
            let originalCalculateBoardScore = window.calculateBoardScore;

            // Override the scoring function with our parameters
            window.calculateBoardScore = function(board, linesCleared) {
                const gaps = calculateGapsOnTempBoard(board);
                const bumpiness = calculateBumpinessOnTempBoard(board);
                const heightPenalty = calculateHeightPenalty(board);
                const iDependencies = calculateIDependenciesOnTempBoard(board);
                
                return gaps * params.gapsWeight + 
                       bumpiness * params.bumpinessWeight - 
                       linesCleared * params.lineClearWeight + 
                       heightPenalty * params.heightWeight + 
                       iDependencies * params.iDependencyWeight;
            };

            // Clear the board before starting
            this.clearBoard();

            // Check for available moves
            const checkAvailableMoves = () => {
                const pieces = Object.keys(PIECES);
                for (let piece of pieces) {
                    const pieceShape = PIECES[piece];
                    let maxRotations = piece === 'O' ? 1 : piece === 'I' || piece === 'S' || piece === 'Z' ? 2 : 4;
                    
                    for (let rotation = 0; rotation < maxRotations; rotation++) {
                        const rotatedPiece = rotatePiece(pieceShape, rotation);
                        const pieceWidth = rotatedPiece[0].length;
                        
                        for (let x = 0; x <= 10 - pieceWidth; x++) {
                            if (getDropHeight(rotatedPiece, x) >= 0) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };

            // Setup move counter and score tracking
            const moveListener = setInterval(() => {
                // Check if the game is over (no available moves)
                if (!checkAvailableMoves()) {
                    gameOver = true;
                    clearInterval(moveListener);
                    window.calculateBoardScore = originalCalculateBoardScore;
                    stopRandomMode();
                    
                    // Return a very poor score if the game ended early
                    if (movesPlayed < 50) {
                        resolve(999999); // Large penalty for early game over
                    } else {
                        // Calculate average height penalty for completed moves
                        const avgHeightPenalty = heightPenalties.reduce((a, b) => a + b, 0) / heightPenalties.length;
                        resolve(avgHeightPenalty);
                    }
                    return;
                }

                // Record height penalty for this move
                heightPenalties.push(calculateHeightPenalty(boardState));
                movesPlayed++;

                if (movesPlayed >= 100) {
                    clearInterval(moveListener);
                    window.calculateBoardScore = originalCalculateBoardScore;
                    stopRandomMode();
                    
                    // Calculate average height penalty
                    const avgHeightPenalty = heightPenalties.reduce((a, b) => a + b, 0) / heightPenalties.length;
                    resolve(avgHeightPenalty);
                }
            }, 100);

            // Start autoplay
            document.getElementById('randomModeToggle').checked = false;
            document.getElementById('autoPlayMode').checked = true;
            startRandomMode();
        });
    }

    crossover(parent1, parent2) {
        const child = new ScoringParams();
        for (let param in parent1) {
            // Randomly choose which parent's parameter to inherit
            child[param] = Math.random() < 0.5 ? parent1[param] : parent2[param];
        }
        return child;
    }

    selectParent(fitnessScores) {
        const tournamentSize = 3;
        let bestIndex = Math.floor(Math.random() * this.populationSize);
        let bestFitness = fitnessScores[bestIndex];

        for (let i = 0; i < tournamentSize - 1; i++) {
            const idx = Math.floor(Math.random() * this.populationSize);
            if (fitnessScores[idx] < bestFitness) {
                bestIndex = idx;
                bestFitness = fitnessScores[idx];
            }
        }
        return this.population[bestIndex];
    }

    async evolve() {
        console.log(`Starting evolution - Generation ${this.generation + 1}`);

        pieceIndex = Object.keys(PIECES).indexOf('I');  // Ensure starting with 'I'
        
        // Evaluate current population
        const fitnessScores = await Promise.all(
            this.population.map(params => this.evaluateParams(params))
        );

        // Store best score
        const bestScore = Math.min(...fitnessScores);
        const bestParams = this.population[fitnessScores.indexOf(bestScore)];
        this.bestScores.push({
            generation: this.generation,
            score: bestScore,
            params: {...bestParams}
        });

        console.log(`Generation ${this.generation + 1} Results:`);
        console.log(`Best Score: ${bestScore}`);
        console.log('Best Parameters:', bestParams);
        console.log('All Scores:', fitnessScores);

        // Create new population
        const newPopulation = [];

        // Keep the best performing individual (elitism)
        newPopulation.push(bestParams);

        // Create rest of new population
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selectParent(fitnessScores);
            const parent2 = this.selectParent(fitnessScores);
            const child = this.crossover(parent1, parent2);
            newPopulation.push(child.mutate());
        }

        this.population = newPopulation;
        this.generation++;

        // Clear the board after generation is complete
        this.clearBoard();

        return this.generation < this.generationLimit;
    }
}

// Initialize and start evolution
async function startEvolution() {
    const evolution = new Evolution();
    evolution.initializePopulation();

    // Create status display
    const statusDiv = document.createElement('div');
    statusDiv.className = 'evolution-status';
    statusDiv.style.marginTop = '10px';
    document.querySelector('.controls').appendChild(statusDiv);

    // Create canvas for visualization
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    canvas.style.marginTop = '10px';
    document.querySelector('.controls').appendChild(canvas);

    while (await evolution.evolve()) {
        // Update status display
        statusDiv.textContent = `Generation: ${evolution.generation}/${evolution.generationLimit} - Best Score: ${evolution.bestScores[evolution.bestScores.length - 1].score.toFixed(2)}`;
        
        // Update visualization
        plotEvolutionProgress(evolution.bestScores, canvas);
    }

    // Show final results
    const bestResult = evolution.bestScores.reduce((best, current) => 
        current.score < best.score ? current : best
    );

    statusDiv.innerHTML = `
        <h3>Evolution Complete!</h3>
        <p>Best Score: ${bestResult.score.toFixed(2)}</p>
        <p>Best Parameters:</p>
        <pre>${JSON.stringify(bestResult.params, null, 2)}</pre>
    `;
}

// Add evolution control buttons
const controlsDiv = document.querySelector('.controls');
const evolutionButton = document.createElement('button');
evolutionButton.textContent = 'Start Evolution';
evolutionButton.onclick = startEvolution;
controlsDiv.appendChild(evolutionButton);

// Visualization function
function plotEvolutionProgress(scores, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const y = (i / 10) * canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Plot progress
    if (scores.length > 1) {
        const maxScore = Math.min(Math.max(...scores.map(s => s.score)), 100); // Cap at 100 for better visualization
        
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        
        scores.forEach((score, i) => {
            const x = (i / (scores.length - 1)) * canvas.width;
            const y = canvas.height - (Math.min(score.score, 100) / maxScore) * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }
}

initBoard();