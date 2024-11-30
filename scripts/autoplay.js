// Toggle random piece placement via checkbox
randomModeCheckbox.addEventListener('change', function() {
    if (this.checked) {
        startRandomMode();
    } else {
        stopRandomMode();
    }
});

// Begins automatic piece placement
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

        setTimeout(() => {
            selectPiece(selectedPiece);
        }, interval / 3);

        setTimeout(() => {
            confirmMove();
        }, interval / 1.5);

    }, interval);
}

// Stops automatic piece placement
function stopRandomMode() {
    clearInterval(randomModeInterval);
}