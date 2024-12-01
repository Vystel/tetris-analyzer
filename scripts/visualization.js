// Updates the UI to show the currently selected move position, rotation, and detailed scoring breakdown. Shows the piece preview and updates score labels
function displayCurrentMove() {
    if (!selectedPiece) return;
    const move = moves[currentMove];
    const rotatedPiece = rotatePiece(selectedPiece, move.rotation);
    drawPiece(rotatedPiece, move.offsetX, move.offsetY, true); 
    currentMoveLabel.textContent = currentMove + 1;

    // Update individual score-related stats
    document.getElementById('score').textContent = `${move.score.toFixed(2)}`;
    document.getElementById('gaps').textContent = move.gaps;
    document.getElementById('bumpiness').textContent = move.bumpiness;
    document.getElementById('line-clears').textContent = move.lineClears;
    document.getElementById('i-dependencies').textContent = move.iDependencies;
    document.getElementById('height-penalty').textContent = move.heightPenalty;
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

// Function to set the multipliers to a preset
function setPreset(presetName) {
    const presets = {
        koreanStacker: {
            gaps: 1.22,
            bumpiness: 0.18,
            lineClears: -0.13,
            heightPenalty: 1.18,
            iDependencies: 2.58
        },
        90: {
            gaps: 1.5,
            bumpiness: 0.25,
            lineClears: -0.2,
            heightPenalty: 1.5,
            iDependencies: 2.8
        }
    };

    const preset = presets[presetName];
    for (const key in preset) {
        multipliers[key] = preset[key];
        document.getElementById(`${key}Input`).value = preset[key];
    }
}

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

/*
// Function to open sorted stats in a raw text view
function viewSortedStats() {
    // Sort stats by score
    const sortedStats = [...gameStats].sort((a, b) => a.score - b.score);
    
    // Format the stats into text
    const statsText = sortedStats
        .map(stat => `Score: ${stat.score.toFixed(2)}, Weights: ${JSON.stringify(stat.weights)}`)
        .join("\n");

    // Create a new blob with the stats text
    const blob = new Blob([statsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Open the stats in a new browser tab
    const newTab = window.open();
    newTab.document.body.innerHTML = `<pre>${statsText}</pre>`;
    URL.revokeObjectURL(url);
}

// Function to render the top 10 games as a line chart
function renderTopGamesChart() {
    // Sort the stats by score and take the top 10
    const topGames = [...gameStats]
        .sort((a, b) => a.score - b.score)
        .slice(0, 10);

    // Prepare data for the chart
    const labels = topGames.map(game => game.score.toFixed(2)); // Use scores as X-axis labels
    const datasets = Object.keys(multipliers).map(weightKey => ({
        label: weightKey,
        data: topGames.map(game => game.weights[weightKey]),
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1
    }));

    // Get the chart canvas
    const ctx = document.getElementById('topGamesChart').getContext('2d');

    // Destroy the previous chart instance if it exists
    if (topGamesChartInstance) {
        topGamesChartInstance.destroy();
    }

    // Create the chart
    topGamesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels, // X-axis labels are scores
            datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Games and Their Weights (X: Scores)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Weight Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Game Scores'
                    }
                }
            }
        }
    });
}

// Utility to generate random colors for the chart lines
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
*/