// Get the canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Load images
const background = new Image();
const birdImg = new Image();
const pipeTop = new Image();
const pipeBottom = new Image();

// Set image sources (replace these with your own image paths)
background.src = 'background.png'; // Your background image
birdImg.src = 'bird.png';          // Your bird image
pipeTop.src = 'columnup.png';       // Your top pipe image
pipeBottom.src = 'columndown.png'; // Your bottom pipe image

// General settings
let gamePlaying = false;
let gravity = 0.5;
let speed = 6.2;
let birdSize = [100, 100]; // Adjust to your bird image size
let jump = -11.5;
let cTenth = canvas.width / 10; // Horizontal position of the bird

let index = 0,
    bestScore = 0,
    flight,
    flyHeight,
    currentScore,
    pipes = [];

// Pipe settings
let pipeWidth = 100; // Adjust to your pipe image width
let pipeGap = canvas.height / 6 // Increased gap between pipes

// Function to determine pipe location
const pipeLoc = () => {
    return (
        Math.random() *
            (canvas.height - (pipeGap + pipeWidth)) +
        pipeWidth
    );
};

// Setup initial game state
const setup = () => {
    currentScore = 0;
    flight = jump;

    // Set initial flyHeight (middle of screen - size of the bird)
    flyHeight = (canvas.height / 2) - (birdSize[1] / 2);

    // Setup initial pipes
    pipes = Array(3)
        .fill()
        .map((_, i) => [
            canvas.width + i * (pipeGap + pipeWidth),
            pipeLoc(),
        ]);
};

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cTenth = canvas.width / 10; // Update bird position based on new canvas width
    pipeGap = canvas.height / 2.5; // Adjust pipe gap based on new canvas height
}

// Initial setup
resizeCanvas();
setup();

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    setup(); // Reset the game on resize to avoid scaling issues
});

// The render function
const render = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Pipe display
    if (gamePlaying) {
        pipes.forEach((pipe) => {
            // Pipe moving to the left
            pipe[0] -= speed;

            // Top pipe
            ctx.drawImage(
                pipeTop,
                pipe[0],
                pipe[1] - pipeTop.height,
                pipeWidth,
                pipeTop.height
            );

            // Bottom pipe
            ctx.drawImage(
                pipeBottom,
                pipe[0],
                pipe[1] + pipeGap,
                pipeWidth,
                pipeBottom.height
            );

            // Give 1 point & create new pipe
            if (pipe[0] <= -pipeWidth) {
                currentScore++;
                // Check if it's the best score
                bestScore = Math.max(bestScore, currentScore);

                // Remove & create new pipe
                pipes = [
                    ...pipes.slice(1),
                    [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()],
                ];
            }

            // Collision detection (updated to fix error)
            if (
                pipe[0] <= cTenth + birdSize[0] &&
                pipe[0] + pipeWidth >= cTenth &&
                (flyHeight < pipe[1] || flyHeight + birdSize[1] > pipe[1] + pipeGap)
            ) {
                // Collision detected
                gamePlaying = false;
                setup();
            }
        });
    }

    // Draw bird
    if (gamePlaying) {
        ctx.drawImage(
            birdImg,
            cTenth,
            flyHeight,
            ...birdSize
        );
        flight += gravity;
        flyHeight = Math.min(flyHeight + flight, canvas.height - birdSize[1]);
    } else {
        // Bird at start position
        ctx.drawImage(
            birdImg,
            (canvas.width / 2) - birdSize[0] / 2,
            flyHeight,
            ...birdSize
        );
        flyHeight = (canvas.height / 2) - (birdSize[1] / 2);

        // Welcome text
        ctx.fillStyle = "#fff"; // Adjust color to fit your theme
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.font = "bold 40px sans-serif"; // Adjust font to fit your theme
        ctx.textAlign = 'center';
        ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.strokeText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('Click to Play', canvas.width / 2, canvas.height / 2 + 50);
        ctx.strokeText('Click to Play', canvas.width / 2, canvas.height / 2 + 50);
    }

    // Update score display on canvas
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Score: ${currentScore}`, 80, 50);
    ctx.fillText(`Best Score: ${bestScore}`, 103, 80);

    // Request next frame
    window.requestAnimationFrame(render);
};

// Start the game on click
document.addEventListener('click', () => {
    gamePlaying = true;
    flight = jump;
});

// Start the game
background.onload = render;
