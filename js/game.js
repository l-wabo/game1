// Monkey Jump Game
// Main game logic

// Game variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('monkeyJumpHighScore') || 0;
let speed = 1.0;
let gameSpeed = 3.5;
let frames = 0;

// Game objects
let monkey = {
    x: 80,
    y: 300,
    width: 80,
    height: 80,
    jumping: false,
    jumpVelocity: 0,
    jumpStrength: -18,
    gravity: 0.8,
    groundY: 300
};

let hippos = [];
let hippoSpawnRate = 100; // frames between hippo spawns
let hippoFixedHeight = 310; // Fixed height for hippos on ground

// Images
let monkeyImg, hippoImg;
let imagesLoaded = false;

// Dart (projectile) system
let darts = [];
let dartCooldown = 0; // 0 = ready to shoot
let dartCooldownMax = 180; // 3 seconds at 60fps
let dartSpeed = 12;
let dartWidth = 20;
let dartHeight = 10;

// DOM elements
let scoreElement, highScoreElement, speedElement;
let startScreen, gameOverScreen, finalScoreElement;
let startBtn, restartBtn, pauseBtn, soundBtn, dartBtn, instructionsBtn, closeInstructionsBtn;
let instructionsPanel;

// Initialize game
function init() {
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Get DOM elements
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('high-score');
    speedElement = document.getElementById('speed');
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    finalScoreElement = document.getElementById('final-score');

    // Set high score
    highScoreElement.textContent = highScore;

    // Load images
    loadImages();

    // Setup event listeners
    setupEventListeners();

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Load game images
function loadImages() {
    monkeyImg = new Image();
    hippoImg = new Image();

    monkeyImg.onload = function() {
        console.log('Monkey image loaded');
        checkImagesLoaded();
    };

    hippoImg.onload = function() {
        console.log('Hippo image loaded');
        checkImagesLoaded();
    };

    monkeyImg.src = 'images/monkey.png';
    hippoImg.src = 'images/hippo.png';

    // If images fail to load, use fallback colors
    monkeyImg.onerror = function() {
        console.log('Failed to load monkey image, using fallback');
        monkeyImg = null;
        checkImagesLoaded();
    };

    hippoImg.onerror = function() {
        console.log('Failed to load hippo image, using fallback');
        hippoImg = null;
        checkImagesLoaded();
    };
}

function checkImagesLoaded() {
    // Both images are considered loaded even if they failed (null)
    imagesLoaded = true;
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        // Start game on any key if not started
        if (!gameRunning && !gameOver) {
            startGame();
            return;
        }

        // Jump controls
        if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning && !gamePaused) {
            jump();
            e.preventDefault(); // Prevent spacebar from scrolling page
        }

        // Pause with 'P' key
        if (e.code === 'KeyP' && gameRunning) {
            togglePause();
        }

        // Shoot dart with 'F' key
        if (e.code === 'KeyF' && gameRunning && !gamePaused) {
            shootDart();
            e.preventDefault();
        }

        // Restart game on 'R' key when game over
        if (e.code === 'KeyR' && gameOver) {
            restartGame();
        }
    });

    // Click/touch controls
    canvas.addEventListener('click', function() {
        if (!gameRunning && !gameOver) {
            startGame();
        } else if (gameRunning && !gamePaused) {
            jump();
        }
    });

    // Button event listeners
    startBtn = document.getElementById('startBtn');
    restartBtn = document.getElementById('restartBtn');
    pauseBtn = document.getElementById('pauseBtn');
    soundBtn = document.getElementById('soundBtn');
    dartBtn = document.getElementById('dartBtn');
    instructionsBtn = document.getElementById('instructionsBtn');
    closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
    instructionsPanel = document.getElementById('instructionsPanel');

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    pauseBtn.addEventListener('click', togglePause);
    dartBtn.addEventListener('click', shootDart);

    // Sound toggle (placeholder - no actual sound implementation)
    soundBtn.addEventListener('click', function() {
        let soundOn = soundBtn.innerHTML.includes('ON');
        if (soundOn) {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i> SOUND OFF';
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i> SOUND ON';
        }
    });

    // Instructions panel
    instructionsBtn.addEventListener('click', function() {
        instructionsPanel.style.display = 'block';
    });

    closeInstructionsBtn.addEventListener('click', function() {
        instructionsPanel.style.display = 'none';
    });
}

// Start game
function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    gameOver = false;
    gamePaused = false;
    score = 0;
    speed = 1.0;
    frames = 0;

    // Reset monkey position
    monkey.y = monkey.groundY;
    monkey.jumping = false;
    monkey.jumpVelocity = 0;

    // Clear hippos
    hippos = [];

    // Clear darts and reset cooldown
    darts = [];
    dartCooldown = 0;

    // Update UI
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    scoreElement.textContent = score;
    speedElement.textContent = speed.toFixed(1) + 'x';

    // Update pause button text
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
}

// Restart game
function restartGame() {
    gameOver = false;
    gameOverScreen.style.display = 'none';
    startGame();
}

// Toggle pause
function togglePause() {
    if (!gameRunning || gameOver) return;

    gamePaused = !gamePaused;

    if (gamePaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> RESUME';
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
    }
}

// Make monkey jump
function jump() {
    if (!monkey.jumping && gameRunning && !gamePaused) {
        monkey.jumping = true;
        monkey.jumpVelocity = monkey.jumpStrength;
    }
}

// Shoot a dart
function shootDart() {
    if (!gameRunning || gamePaused || gameOver) return;

    // Check cooldown
    if (dartCooldown > 0) return;

    // Create a new dart at monkey's position
    darts.push({
        x: monkey.x + monkey.width,
        y: monkey.y + monkey.height / 2 - dartHeight / 2,
        width: dartWidth,
        height: dartHeight,
        active: true
    });

    // Start cooldown (3 seconds = 180 frames at 60fps)
    dartCooldown = dartCooldownMax;
}

// Update game state
function update() {
    if (!gameRunning || gamePaused || gameOver) return;

    frames++;

    // Update monkey position (jump physics)
    if (monkey.jumping) {
        monkey.y += monkey.jumpVelocity;
        monkey.jumpVelocity += monkey.gravity;

        // Hit the ground
        if (monkey.y > monkey.groundY) {
            monkey.y = monkey.groundY;
            monkey.jumping = false;
            monkey.jumpVelocity = 0;
        }
    }

    // Spawn hippos
    if (frames % hippoSpawnRate === 0) {
        spawnHippo();
    }

    // Update hippos position
    for (let i = hippos.length - 1; i >= 0; i--) {
        hippos[i].x -= gameSpeed * speed;

        // Remove hippos that are off screen
        if (hippos[i].x + hippos[i].width < 0) {
            hippos.splice(i, 1);
            score++;
            updateScore();
        }
    }

    // Update darts
    if (dartCooldown > 0) {
        dartCooldown--;
    }

    // Update darts position and check collisions with hippos
    for (let i = darts.length - 1; i >= 0; i--) {
        // Move dart
        darts[i].x += dartSpeed;

        // Remove darts that are off screen
        if (darts[i].x > canvas.width) {
            darts.splice(i, 1);
            continue;
        }

        // Check dart collision with hippos
        for (let j = hippos.length - 1; j >= 0; j--) {
            if (darts[i].x < hippos[j].x + hippos[j].width &&
                darts[i].x + darts[i].width > hippos[j].x &&
                darts[i].y < hippos[j].y + hippos[j].height &&
                darts[i].y + darts[i].height > hippos[j].y) {

                // Dart hits hippo - remove both
                darts.splice(i, 1);
                hippos.splice(j, 1);
                score += 2; // Bonus points for shooting hippo
                updateScore();
                break; // This dart is gone, move to next dart
            }
        }
    }

    // Check collisions
    checkCollisions();

    // Increase speed every 10 points
    if (score > 0 && score % 10 === 0) {
        speed = 1.0 + Math.floor(score / 10) * 0.2;
        speedElement.textContent = speed.toFixed(1) + 'x';

        // Increase spawn rate with speed
        hippoSpawnRate = Math.max(40, 100 - Math.floor(score / 10) * 5);
    }
}

// Spawn a new hippo
function spawnHippo() {
    // Hippos now appear only on the ground (fixed height)
    hippos.push({
        x: canvas.width,
        y: hippoFixedHeight,
        width: 100,
        height: 60
    });
}

// Check for collisions between monkey and hippos
function checkCollisions() {
    for (let hippo of hippos) {
        if (monkey.x < hippo.x + hippo.width &&
            monkey.x + monkey.width > hippo.x &&
            monkey.y < hippo.y + hippo.height &&
            monkey.y + monkey.height > hippo.y) {

            // Collision detected - game over
            gameOver = true;
            gameRunning = false;

            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('monkeyJumpHighScore', highScore);
                highScoreElement.textContent = highScore;
            }

            // Show game over screen
            finalScoreElement.textContent = score;
            gameOverScreen.style.display = 'flex';

            break;
        }
    }
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Draw game elements
function draw() {
    // Clear canvas with sky blue background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, monkey.groundY + monkey.height - 10, canvas.width, 50);

    // Draw grass on top of ground
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, monkey.groundY + monkey.height - 10, canvas.width, 10);

    // Draw monkey
    if (monkeyImg) {
        ctx.drawImage(monkeyImg, monkey.x, monkey.y, monkey.width, monkey.height);
    } else {
        // Fallback rectangle for monkey
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(monkey.x, monkey.y, monkey.width, monkey.height);

        // Draw monkey face
        ctx.fillStyle = '#000';
        ctx.fillRect(monkey.x + 60, monkey.y + 20, 10, 10); // eye
        ctx.fillRect(monkey.x + 20, monkey.y + 50, 40, 20); // mouth
    }

    // Draw hippos
    for (let hippo of hippos) {
        if (hippoImg) {
            ctx.drawImage(hippoImg, hippo.x, hippo.y, hippo.width, hippo.height);
        } else {
            // Fallback rectangle for hippo
            ctx.fillStyle = '#607D8B';
            ctx.fillRect(hippo.x, hippo.y, hippo.width, hippo.height);

            // Draw hippo features
            ctx.fillStyle = '#000';
            ctx.fillRect(hippo.x + 80, hippo.y + 20, 10, 10); // eye
            ctx.fillRect(hippo.x + 20, hippo.y + 40, 60, 10); // mouth
        }
    }

    // Draw darts
    for (let dart of darts) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(dart.x, dart.y, dart.width, dart.height);

        // Draw dart tip
        ctx.fillStyle = '#FF9900';
        ctx.fillRect(dart.x + dart.width - 5, dart.y, 5, dart.height);
    }

    // Draw clouds in background if game is running
    if (gameRunning && !gamePaused) {
        drawClouds();
    }

    // Draw pause overlay
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '40px "Press Start 2P", cursive';
        ctx.fillStyle = '#FF9800';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '20px "Press Start 2P", cursive';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press P or click PAUSE to resume', canvas.width / 2, canvas.height / 2 + 30);
    }
}

// Draw background clouds
function drawClouds() {
    // Draw some clouds at fixed positions based on frame count
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    // Cloud 1
    let cloud1X = (canvas.width - frames * 0.5) % (canvas.width + 200) - 100;
    drawCloud(cloud1X, 80, 60);

    // Cloud 2
    let cloud2X = (canvas.width - frames * 0.3) % (canvas.width + 300) - 150;
    drawCloud(cloud2X, 120, 40);

    // Cloud 3
    let cloud3X = (canvas.width - frames * 0.7) % (canvas.width + 250) - 125;
    drawCloud(cloud3X, 50, 50);
}

// Draw a single cloud
function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game when page loads
window.addEventListener('load', init);