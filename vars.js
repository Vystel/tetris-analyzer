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