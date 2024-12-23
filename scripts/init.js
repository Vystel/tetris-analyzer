// List of scripts to load
const scriptsToLoad = [
    //'https://cdn.jsdelivr.net/npm/chart.js',

    'scripts/vars.js',
    'scripts/boardManagement.js',
    'scripts/findPossibleMoves.js',
    'scripts/userInterface.js',
    'scripts/evaluation.js',
    'scripts/autoPlay.js',
    'scripts/evolution.js'
];

// Function to load a single script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(script);
    });
}

// Function to load all scripts
async function loadAllScripts() {
    try {
        // Load all scripts in parallel
        await Promise.all(scriptsToLoad.map(loadScript));
        
        // All scripts are loaded, now call initBoard
        initBoard();
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

// Start loading scripts
loadAllScripts();