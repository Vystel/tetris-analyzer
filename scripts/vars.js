// ------------------- DOM ELEMENT REFERENCES ------------------- //

const board = document.getElementById('board'); // Main game board element
const currentPieceLabel = document.getElementById('current-piece'); // Display for current move number
const currentMoveLabel = document.getElementById('current-move'); // Display for current piece type

const randomModeCheckbox = document.getElementById('autoPlayMode'); // Auto-play mode toggle element



// ------------------- GAME CONSTANTS ------------------- //

// Shape definitions for all Tetris pieces
const PIECES = { 
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'Z': [[1, 1, 0], [0, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]]
};

// Color mapping for each piece type
const PIECE_COLORS = { 
    'I': '#00FDFF',
    'O': '#FFFF00',
    'T': '#FF00FF',
    'S': '#00FF00',
    'Z': '#FF0000',
    'J': '#0000FF',
    'L': '#FF8000'
};

// AI evaluation parameter multipliers
const initialWeights = { 
    gaps: 1.22,
    bumpiness: 0.18,
    lineClears: -0.13,
    heightPenalty: 1.18,
    iDependencies: 2.58
};

const mutationRate = 1; // How much weights can change during evolution mutation



//  ------------------- GAME STATE ------------------- //

// Board Management
const boardState = Array(20).fill().map(() => Array(10).fill(0)); // Current state of game board

// Piece Management
let selectedPiece = null; // Currently active piece
let piecesPlaced = 0; // Total pieces placed

// Move Calculation
let moves = []; // List of possible moves for current piece
let currentMove = 0; // Ranking of move out of all calculated piece positions

// Game Control
let historyStack = []; // Previous board states for undo
let isMouseDown = false; // Mouse button state tracker
let paintMode = null; // Board cell painting mode
let randomModeInterval;

// Auto Play
let pieceIndex = 0; // Current piece in sequence


// Evolution
let isEvolutionRunning = false; // Evolution mode status
let gameStats = []; // Historical game performance data during evolution
let bestScore = Infinity; // Best performance achieved during evolution
let bestWeights = { ...initialWeights }; // Best performing AI parameters during evolution
let currentWeights = { ...initialWeights }; // Current AI evaluation parameters
let currentGamePieces = 0; // Pieces placed in current evolution game
let currentHeightPenalties = []; // Height penalties for current evolution game

// Visualization
let topGamesChartInstance = null; // Chart.js instance reference