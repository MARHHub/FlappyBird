// Initialize Supabase Client
const supabaseUrl = 'https://hbzvggukuuhdxqwovzsj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienZnZ3VrdXVoZHhxd292enNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0OTc2NzYsImV4cCI6MjA0MjA3MzY3Nn0.sUTf3ZMhRQ6rVCKE7z19i_AIgRarBw3XLAAUEbbDcmQ';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Get the canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Load images
const background = new Image();
const birdImg = new Image();
const pipeTop = new Image();
const pipeBottom = new Image();

background.src = 'background.png'; 
birdImg.src = 'bird.png';          
pipeTop.src = 'columnup.png';      
pipeBottom.src = 'columndown.png'; 

// General settings
let gamePlaying = false;
let gravity = 0.5;
let initialSpeed = 6.2;
let speed = initialSpeed;
let birdSize = [51, 36];
let jump = -11.5;
let cTenth = canvas.width / 10;

let bestScore = 0;
let flight, flyHeight, currentScore, pipes = [];
let pipeWidth = 100; 
let pipeGap = canvas.height / 6;

let playerName = '';
let waitingForClick = false; 
let animationFrameId; // Variable to store requestAnimationFrame ID

const startScreen = document.getElementById('startScreen');
const startGameBtn = document.getElementById('startGameBtn');
const playerNameInput = document.getElementById('playerNameInput');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const playerRankDisplay = document.getElementById('playerRank');

// Get DOM elements for the High Scores button
const highScoreBtn = document.getElementById('highScoreBtn');
const highScoreBtnGameOver = document.getElementById('highScoreBtnGameOver');
const highScoresPopup = document.getElementById('highScoresPopup');
const closeHighScoresBtn = document.getElementById('closeHighScores');

// High Scores button functionality
highScoreBtn.addEventListener('click', async () => {
    const scores = await loadHighScores();
    displayHighScores(scores);
    highScoresPopup.classList.remove('hidden'); // Show popup
});

// High Scores button on the Game Over screen
highScoreBtnGameOver.addEventListener('click', async () => {
    const scores = await loadHighScores();
    displayHighScores(scores);
    highScoresPopup.classList.remove('hidden'); // Show popup
});

// Close the High Scores popup
closeHighScoresBtn.addEventListener('click', () => {
    highScoresPopup.classList.add('hidden');
});

// Start Game button listener
startGameBtn.addEventListener('click', (event) => {
    playerName = playerNameInput.value.trim(); // Get the entered name

    // Check if the player entered a name
    if (!playerName) {
        alert("Please enter your name before starting the game.");
        return; // Stop further execution, keep the start screen visible
    }

    // Only proceed if there is a valid name
    startScreen.classList.add('hidden'); // Hide the start screen
    setup(); // Setup the game
    waitingForClick = true; // Enable game start on click
    cancelAnimationFrame(animationFrameId); // Cancel any previous game loop
    render(); // Start rendering the game
});

// Function to determine pipe location
const pipeLoc = () => {
    return Math.random() * (canvas.height - (pipeGap + pipeWidth)) + pipeWidth;
};

// Setup game
const setup = () => {
    speed = initialSpeed; // Reset speed
    currentScore = 0;
    flight = jump;
    flyHeight = (canvas.height / 2) - (birdSize[1] / 2);
    pipes = Array(3).fill().map((_, i) => [
        canvas.width + i * (pipeGap + pipeWidth),
        pipeLoc(),
    ]);
    gameOverScreen.classList.add('hidden'); // Hide Game Over screen on restart
};

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cTenth = canvas.width / 10;
    pipeGap = canvas.height / 2.5;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Event listener for clicking to start the game
document.addEventListener('click', () => {
    if (waitingForClick && playerName) {
        gamePlaying = true; // Start the game
        waitingForClick = false; // No longer waiting for a click
    }
    if (!gamePlaying) return; // If the game isn't playing, prevent further action

    flight = jump; // Apply the jump effect to the bird
});

// Render the game
const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    if (gamePlaying) {
        pipes.forEach((pipe) => {
            pipe[0] -= speed; // Speed remains constant

            ctx.drawImage(pipeTop, pipe[0], pipe[1] - pipeTop.height, pipeWidth, pipeTop.height);
            ctx.drawImage(pipeBottom, pipe[0], pipe[1] + pipeGap, pipeWidth, pipeBottom.height);

            if (pipe[0] <= -pipeWidth) {
                currentScore++;
                bestScore = Math.max(bestScore, currentScore);
                pipes = [...pipes.slice(1), [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]];
            }

            if (
                pipe[0] <= cTenth + birdSize[0] &&
                pipe[0] + pipeWidth >= cTenth &&
                (flyHeight < pipe[1] || flyHeight + birdSize[1] > pipe[1] + pipeGap)
            ) {
                gamePlaying = false;
                saveHighScore(playerName, currentScore);
                showGameOverScreen(playerName, currentScore); // Pass the correct score
            }
        });
    }

    if (gamePlaying) {
        ctx.drawImage(birdImg, cTenth, flyHeight, ...birdSize);
        flight += gravity;
        flyHeight = Math.min(flyHeight + flight, canvas.height - birdSize[1]);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Score: ${currentScore}`, 80, 50);
    ctx.fillText(`Best Score: ${bestScore}`, 80, 80);

    animationFrameId = window.requestAnimationFrame(render); // Store the animation frame ID
};

// Supabase - Save high score (all scores and highest score for ranking)
async function saveHighScore(name, score) {
    let gameEndTime = new Date();
    let playedAt = gameEndTime.toISOString();

    try {
        // Insert the new score regardless of whether it's the highest score
        const { error: insertError } = await supabaseClient
            .from('high_scores')
            .insert([{ name, score, time: playedAt }]);
        if (insertError) throw insertError;

        // Check if this is the player's highest score
        const { data: existingHighest, error: selectError } = await supabaseClient
            .from('high_scores')
            .select('*')
            .eq('name', name)
            .order('score', { ascending: false })
            .limit(1)
            .single();

        if (selectError) throw selectError;

        // If the new score is the highest, refresh scores and display rank
        if (existingHighest && existingHighest.score < score) {
            await refreshAndDisplayScores();
        }

    } catch (error) {
        console.error('Error saving high score:', error);
    }
}

// Supabase - Load high scores
async function loadHighScores() {
    try {
        const { data, error } = await supabaseClient
            .from('high_scores')
            .select('*')
            .order('score', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading high scores:', error);
        return [];
    }
}

// Display high scores in the High Scores Popup
// Display high scores in the High Scores Popup
function displayHighScores(scores) {
    const highScoresList = document.getElementById('highScores');
    highScoresList.innerHTML = ''; // Clear current scores

    // Filter highest scores per player
    const highestScores = scores.reduce((acc, score) => {
        if (!acc[score.name] || acc[score.name].score < score.score) {
            acc[score.name] = score;
        }
        return acc;
    }, {});

    // Convert highest scores to array and sort
    const sortedScores = Object.values(highestScores).sort((a, b) => b.score - a.score);

    sortedScores.forEach((score) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${score.name}: ${score.score}`; // Remove manual ranking numbers
        highScoresList.appendChild(listItem);
    });
}


// Refresh and display the high scores
async function refreshAndDisplayScores() {
    const scores = await loadHighScores();
    displayHighScores(scores);
}

// Supabase - Load rank (based on the player's highest score)
async function loadRank(name, playerScore) {
    try {
        const scores = await loadHighScores();
        const highestScoresMap = scores.reduce((acc, score) => {
            if (!acc[score.name] || acc[score.name].score < score.score) {
                acc[score.name] = score;
            }
            return acc;
        }, {});

        const sortedScores = Object.values(highestScoresMap).sort((a, b) => b.score - a.score);

        // Find the rank of the player's highest score or fallback to current score rank
        const playerHighScore = highestScoresMap[name]?.score || playerScore;
        const rank = sortedScores.findIndex(s => s.score <= playerHighScore) + 1;

        return rank > 0 ? rank : 'N/A';
    } catch (error) {
        console.error('Error calculating rank:', error);
        return 'Error';
    }
}

// Show Game Over screen and rank
async function showGameOverScreen(name, score) {
    if (score === undefined || isNaN(score)) {
        score = currentScore; // Use the currentScore from the game
    }

    finalScoreDisplay.textContent = `Final Score: ${score}`;

    // Display the player's rank based on their highest score or the current score
    const rank = await loadRank(name, score);
    playerRankDisplay.textContent = `Your Rank: ${rank}`;

    gameOverScreen.classList.remove('hidden');
}

// Restart Game button listener
document.getElementById('restartGame').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    setup(); 
    waitingForClick = true;
    cancelAnimationFrame(animationFrameId); // Cancel previous animation frame
    render();
});

// Initialize Supabase and load scores on page load
document.addEventListener('DOMContentLoaded', function() {
    refreshAndDisplayScores(); // Load high scores on init
});
