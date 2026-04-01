// 猴子跳跃游戏 - Monkey Jump Game
// 完整游戏逻辑

// 游戏变量
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('monkeyJumpHighScore') || 0;
let speed = 1.0;
let frames = 0;

// 游戏对象 - 猴子（增强跳跃能力）
let monkey = {
    x: 80,
    y: 280,
    width: 60,
    height: 80,
    jumping: false,
    jumpVelocity: 0,
    jumpStrength: -25,    // 强跳跃力
    gravity: 0.5,         // 低重力 = 更长滞空
    groundY: 280
};

// 河马数组和生成设置
let hippos = [];
let hippoSpawnRate = 180;   // 180 帧生成一个（约 3 秒）
let hippoFixedHeight = 300;
let hippoSpeed = 3;         // 河马速度

// 图片
let monkeyImg, hippoImg;
let imagesLoaded = false;
let imageLoadError = false;

// 飞镖系统
let darts = [];
let dartCooldown = 0;
let dartCooldownMax = 180;  // 3 秒冷却
let dartSpeed = 12;
let dartWidth = 20;
let dartHeight = 10;

// DOM 元素
let scoreElement, highScoreElement, speedElement, cooldownElement;
let startScreen, gameOverScreen, finalScoreElement;
let startBtn, restartBtn, pauseBtn, jumpBtn, dartBtn, instructionsBtn, closeInstructionsBtn;
let instructionsPanel, cooldownBar;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 获取 DOM 元素
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('high-score');
    speedElement = document.getElementById('speed');
    cooldownElement = document.getElementById('cooldown-text');
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    finalScoreElement = document.getElementById('final-score');
    cooldownBar = document.getElementById('cooldown-bar');

    highScoreElement.textContent = highScore;

    // 加载图片
    loadImages();

    // 设置事件监听
    setupEventListeners();

    // 启动游戏循环
    requestAnimationFrame(gameLoop);
}

// 加载游戏图片
function loadImages() {
    monkeyImg = new Image();
    hippoImg = new Image();

    monkeyImg.onload = function() {
        console.log('猴子图片已加载');
        imagesLoaded = true;
    };

    hippoImg.onload = function() {
        console.log('河马图片已加载');
    };

    monkeyImg.src = 'images/monkey.png';
    hippoImg.src = 'images/hippo.png';

    monkeyImg.onerror = function() {
        console.log('猴子图片加载失败，使用备用绘制');
        imageLoadError = true;
        imagesLoaded = true;
    };

    hippoImg.onerror = function() {
        console.log('河马图片加载失败，使用备用绘制');
        imageLoadError = true;
    };
}

// 设置事件监听
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', function(e) {
        if (!gameRunning && !gameOver) {
            startGame();
            return;
        }

        // 跳跃控制
        if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning && !gamePaused) {
            jump();
            e.preventDefault();
        }

        // 飞镖控制
        if (e.code === 'KeyF' && gameRunning && !gamePaused) {
            shootDart();
            e.preventDefault();
        }

        // 暂停
        if (e.code === 'KeyP' && gameRunning) {
            togglePause();
        }

        // 重新开始
        if (e.code === 'KeyR' && gameOver) {
            restartGame();
        }
    });

    // 点击画布跳跃
    canvas.addEventListener('click', function(e) {
        if (!gameRunning && !gameOver) {
            startGame();
        } else if (gameRunning && !gamePaused) {
            // 检查是否点击了飞镖按钮区域
            const rect = canvas.getBoundingClientRect();
            const clickY = e.clientY - rect.top;

            // 如果点击的是画布下半部分，跳跃
            if (clickY > rect.height * 0.3) {
                jump();
            }
        }
    });

    // 触摸控制（手机优化）
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();

        if (!gameRunning && !gameOver) {
            startGame();
        } else if (gameRunning && !gamePaused) {
            jump();
        }
    }, { passive: false });

    // 按钮事件
    startBtn = document.getElementById('startBtn');
    restartBtn = document.getElementById('restartBtn');
    pauseBtn = document.getElementById('pauseBtn');
    jumpBtn = document.getElementById('jumpBtn');
    dartBtn = document.getElementById('dartBtn');
    instructionsBtn = document.getElementById('instructionsBtn');
    closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
    instructionsPanel = document.getElementById('instructionsPanel');

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (jumpBtn) jumpBtn.addEventListener('click', jump);
    if (jumpBtn) jumpBtn.addEventListener('touchstart', function(e) { e.preventDefault(); jump(); });
    if (dartBtn) dartBtn.addEventListener('click', shootDart);
    if (dartBtn) dartBtn.addEventListener('touchstart', function(e) { e.preventDefault(); shootDart(); });
    if (instructionsBtn) instructionsBtn.addEventListener('click', function() {
        instructionsPanel.style.display = 'block';
    });
    if (closeInstructionsBtn) closeInstructionsBtn.addEventListener('click', function() {
        instructionsPanel.style.display = 'none';
    });

    // 防止双击缩放
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    });
}

// 开始游戏
function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    gameOver = false;
    gamePaused = false;
    score = 0;
    speed = 1.0;
    frames = 0;

    monkey.y = monkey.groundY;
    monkey.jumping = false;
    monkey.jumpVelocity = 0;

    hippos = [];
    darts = [];
    dartCooldown = 0;

    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    scoreElement.textContent = score;
    speedElement.textContent = speed.toFixed(1) + 'x';
    if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
}

// 重新开始
function restartGame() {
    gameOver = false;
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    startGame();
}

// 切换暂停
function togglePause() {
    if (!gameRunning || gameOver) return;

    gamePaused = !gamePaused;

    if (pauseBtn) {
        if (gamePaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
}

// 跳跃函数
function jump() {
    if (!monkey.jumping && gameRunning && !gamePaused) {
        monkey.jumping = true;
        monkey.jumpVelocity = monkey.jumpStrength;
    }
}

// 发射飞镖
function shootDart() {
    if (!gameRunning || gamePaused || gameOver) return;
    if (dartCooldown > 0) return;

    darts.push({
        x: monkey.x + monkey.width,
        y: monkey.y + monkey.height / 2 - dartHeight / 2,
        width: dartWidth,
        height: dartHeight,
        active: true
    });

    dartCooldown = dartCooldownMax;
}

// 更新游戏状态
function update() {
    if (!gameRunning || gamePaused || gameOver) return;

    frames++;

    // 更新猴子位置（跳跃物理）
    if (monkey.jumping) {
        monkey.y += monkey.jumpVelocity;
        monkey.jumpVelocity += monkey.gravity;

        if (monkey.y > monkey.groundY) {
            monkey.y = monkey.groundY;
            monkey.jumping = false;
            monkey.jumpVelocity = 0;
        }
    }

    // 生成河马
    if (frames % hippoSpawnRate === 0) {
        spawnHippo();
    }

    // 更新河马位置
    for (let i = hippos.length - 1; i >= 0; i--) {
        hippos[i].x -= hippoSpeed * speed;

        if (hippos[i].x + hippos[i].width < 0) {
            hippos.splice(i, 1);
            score++;
            updateScore();
        }
    }

    // 更新飞镖冷却
    if (dartCooldown > 0) {
        dartCooldown--;
        updateCooldownUI();
    }

    // 更新飞镖位置并检测与河马的碰撞
    for (let i = darts.length - 1; i >= 0; i--) {
        darts[i].x += dartSpeed;

        if (darts[i].x > canvas.width) {
            darts.splice(i, 1);
            continue;
        }

        for (let j = hippos.length - 1; j >= 0; j--) {
            if (darts[i].x < hippos[j].x + hippos[j].width &&
                darts[i].x + darts[i].width > hippos[j].x &&
                darts[i].y < hippos[j].y + hippos[j].height &&
                darts[i].y + darts[i].height > hippos[j].y) {

                darts.splice(i, 1);
                hippos.splice(j, 1);
                score += 2;
                updateScore();
                break;
            }
        }
    }

    // 检测碰撞
    checkCollisions();

    // 每 10 分增加速度
    if (score > 0 && score % 10 === 0) {
        speed = 1.0 + Math.floor(score / 10) * 0.15;
        speedElement.textContent = speed.toFixed(1) + 'x';
        hippoSpawnRate = Math.max(90, 180 - Math.floor(score / 10) * 8);
    }
}

// 生成河马
function spawnHippo() {
    hippos.push({
        x: canvas.width,
        y: hippoFixedHeight,
        width: 80,
        height: 50
    });
}

// 检测碰撞
function checkCollisions() {
    for (let hippo of hippos) {
        // 缩小碰撞箱，让跳跃更容易
        const monkeyHitbox = {
            x: monkey.x + 10,
            y: monkey.y + 10,
            width: monkey.width - 20,
            height: monkey.height - 10
        };

        const hippoHitbox = {
            x: hippo.x + 5,
            y: hippo.y + 5,
            width: hippo.width - 10,
            height: hippo.height - 5
        };

        if (monkeyHitbox.x < hippoHitbox.x + hippoHitbox.width &&
            monkeyHitbox.x + monkeyHitbox.width > hippoHitbox.x &&
            monkeyHitbox.y < hippoHitbox.y + hippoHitbox.height &&
            monkeyHitbox.y + monkeyHitbox.height > hippoHitbox.y) {

            gameOver = true;
            gameRunning = false;

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('monkeyJumpHighScore', highScore);
                highScoreElement.textContent = highScore;
            }

            if (finalScoreElement) finalScoreElement.textContent = score;
            if (gameOverScreen) gameOverScreen.style.display = 'flex';
            break;
        }
    }
}

// 更新分数
function updateScore() {
    scoreElement.textContent = score;
}

// 更新冷却 UI
function updateCooldownUI() {
    if (cooldownBar && cooldownElement) {
        const percent = (dartCooldown / dartCooldownMax) * 100;
        cooldownBar.style.width = percent + '%';

        if (dartCooldown === 0) {
            cooldownElement.textContent = '就绪!';
            cooldownBar.style.backgroundColor = '#4CAF50';
        } else {
            cooldownElement.textContent = (dartCooldown / 60).toFixed(1) + '秒';
            cooldownBar.style.backgroundColor = '#ff9800';
        }
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制背景云朵
    drawClouds();

    // 绘制地面
    let groundY = monkey.groundY + monkey.height;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, groundY, canvas.width, 50);

    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, 8);

    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, groundY - 3, 20, 4);
    }

    // 绘制猴子（支持透明背景）
    if (monkeyImg && !imageLoadError) {
        ctx.drawImage(monkeyImg, monkey.x, monkey.y, monkey.width, monkey.height);
    } else {
        // 备用绘制
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(monkey.x + 30, monkey.y + 30, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(monkey.x + 30, monkey.y + 25, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(monkey.x + 22, monkey.y + 18, 6, 6);
        ctx.fillRect(monkey.x + 38, monkey.y + 18, 6, 6);
    }

    // 绘制河马（支持透明背景）
    for (let hippo of hippos) {
        if (hippoImg && !imageLoadError) {
            ctx.drawImage(hippoImg, hippo.x, hippo.y, hippo.width, hippo.height);
        } else {
            // 备用绘制
            ctx.fillStyle = '#708090';
            ctx.beginPath();
            ctx.ellipse(hippo.x + 40, hippo.y + 30, 40, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#778899';
            ctx.beginPath();
            ctx.ellipse(hippo.x + 35, hippo.y + 20, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(hippo.x + 30, hippo.y + 15, 5, 5);
        }
    }

    // 绘制飞镖
    for (let dart of darts) {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(dart.x, dart.y + dart.height/2);
        ctx.lineTo(dart.x + dart.width, dart.y);
        ctx.lineTo(dart.x + dart.width, dart.y + dart.height);
        ctx.closePath();
        ctx.fill();
    }

    // 绘制暂停遮罩
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#FF9800';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('点击 继续 按钮恢复游戏', canvas.width / 2, canvas.height / 2 + 30);
    }
}

// 绘制云朵
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    let cloud1X = (canvas.width - frames * 0.3) % (canvas.width + 200) - 100;
    drawCloud(cloud1X, 60, 50);

    let cloud2X = (canvas.width - frames * 0.5) % (canvas.width + 300) - 150;
    drawCloud(cloud2X, 100, 35);

    let cloud3X = (canvas.width - frames * 0.4) % (canvas.width + 250) - 125;
    drawCloud(cloud3X, 40, 45);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 页面加载后初始化
window.addEventListener('load', init);
