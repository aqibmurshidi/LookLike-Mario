// Game Configuration
const GAME_CONFIG = {
    GRAVITY: 0.5,
    JUMP_STRENGTH: 13,
    MAX_FALL_SPEED: 16,
    PLAYER_SPEED: 6,
    ANIMATION_SPEED: 0.15,
    CAMERA_LERP: 0.08,
    CHUNK_WIDTH: 900,
    GROUND_Y: 550,
    GROUND_HEIGHT: 50
};

// Game Classes
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isJumping = false;
        this.direction = 1; // 1 for right, -1 for left
        this.animationCounter = 0;
        this.animationFrame = 0;
        this.isMoving = false;
    }

    update(platforms, enemies) {
        // Apply gravity
        this.velocityY += GAME_CONFIG.GRAVITY;
        this.velocityY = Math.min(this.velocityY, GAME_CONFIG.MAX_FALL_SPEED);

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep player in bounds (left edge only for endless world)
        if (this.x < 0) this.x = 0;

        // Collision detection with platforms
        let isOnPlatform = false;
        platforms.forEach(platform => {
            if (this.isCollidingWithPlatform(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y + 10) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    isOnPlatform = true;
                }
            }
        });

        // Check collision with enemies
        enemies.forEach((enemy, index) => {
            if (this.isCollidingWithEnemy(enemy)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= enemy.y + 10) {
                    // Jumped on enemy
                    enemy.defeated = true;
                    this.velocityY = -10;
                    this.isJumping = true;
                    game.enemyScore += 100;
                } else {
                    // Hit by enemy
                    game.loseLife();
                }
            }
        });

        // Game over if fell off screen
        if (this.y > 600) {
            game.loseLife();
        }

        // Animation
        if (this.isMoving) {
            this.animationCounter += GAME_CONFIG.ANIMATION_SPEED;
            if (this.animationCounter >= 1) {
                this.animationCounter = 0;
                this.animationFrame = (this.animationFrame + 1) % 4;
            }
        } else {
            this.animationFrame = 0;
        }
    }

    isCollidingWithPlatform(platform) {
        return (
            this.x + this.width > platform.x &&
            this.x < platform.x + platform.width &&
            this.y + this.height > platform.y &&
            this.y < platform.y + platform.height
        );
    }

    isCollidingWithEnemy(enemy) {
        return (
            this.x + this.width > enemy.x &&
            this.x < enemy.x + enemy.width &&
            this.y + this.height > enemy.y &&
            this.y < enemy.y + enemy.height
        );
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = -GAME_CONFIG.JUMP_STRENGTH;
            this.isJumping = true;
        }
    }

    moveLeft() {
        this.velocityX = -GAME_CONFIG.PLAYER_SPEED;
        this.direction = -1;
        this.isMoving = true;
    }

    moveRight() {
        this.velocityX = GAME_CONFIG.PLAYER_SPEED;
        this.direction = 1;
        this.isMoving = true;
    }

    stopMoving() {
        this.velocityX = 0;
        this.isMoving = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        ctx.translate(-(this.width / 2), 0);

        // Draw legs
        const legFrames = [0, 2, 1, 2]; // Leg animation frames
        const legFrame = legFrames[this.animationFrame % 4];
        
        ctx.fillStyle = '#8B4513'; // Brown
        if (legFrame === 0) {
            // Left leg forward
            ctx.fillRect(8, 40, 6, 8);
            ctx.fillRect(18, 35, 6, 8);
        } else if (legFrame === 1) {
            // Right leg forward
            ctx.fillRect(8, 35, 6, 8);
            ctx.fillRect(18, 40, 6, 8);
        } else {
            // Both legs neutral
            ctx.fillRect(8, 38, 6, 8);
            ctx.fillRect(18, 38, 6, 8);
        }

        // Draw body
        ctx.fillStyle = '#DD0000'; // Bright red
        ctx.fillRect(6, 24, 20, 16);
        
        // Draw collar area
        ctx.fillStyle = '#FFD700'; // Gold buttons
        ctx.fillRect(10, 24, 4, 4);
        ctx.fillRect(18, 24, 4, 4);

        // Draw arms
        const armFrames = [0, 1, 0, -1];
        const armOffset = armFrames[this.animationFrame % 4] * 3;
        
        ctx.fillStyle = '#FFD1A3'; // Skin tone
        ctx.fillRect(4, 26 + armOffset, 4, 12);
        ctx.fillRect(26, 26 - armOffset, 4, 12);

        // Draw head
        ctx.fillStyle = '#FFD1A3';
        ctx.beginPath();
        ctx.arc(16, 16, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw hat
        ctx.fillStyle = '#DD0000';
        ctx.fillRect(8, 8, 16, 8);
        ctx.fillRect(6, 10, 20, 2);

        // Draw "M" on hat
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', 16, 15);

        // Draw face
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(13, 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(19, 14, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw mustache
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(16, 17, 3, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }
}

class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'normal', 'moving', 'final'
        this.moveSpeed = 2;
        this.moveRange = 100;
        this.originalX = x;
        this.animationFrame = 0;
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveSpeed;
            if (Math.abs(this.x - this.originalX) > this.moveRange) {
                this.moveSpeed *= -1;
            }
        }
        this.animationFrame = (this.animationFrame + 1) % 60;
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'final') {
            // Castle/flagpole - golden
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw brick pattern
            for (let i = 0; i < this.width; i += 16) {
                for (let j = 0; j < this.height; j += 16) {
                    ctx.strokeStyle = '#B8860B';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x + i, this.y + j, 16, 16);
                }
            }
            
            // Draw flag
            const flagX = this.x + this.width / 2;
            const flagY = this.y - 30;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(flagX, flagY);
            ctx.lineTo(flagX, this.y);
            ctx.stroke();
            
            // Flag with waving animation
            const wave = Math.sin(this.animationFrame * 0.1) * 3;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(flagX, flagY);
            ctx.lineTo(flagX + 25 + wave, flagY + 10);
            ctx.lineTo(flagX + 25 + wave, flagY - 10);
            ctx.closePath();
            ctx.fill();

        } else if (this.type === 'moving') {
            // Green moving platform
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Brick pattern
            for (let i = 0; i < this.width; i += 16) {
                for (let j = 0; j < this.height; j += 16) {
                    ctx.strokeStyle = '#1a6b1a';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(this.x + i, this.y + j, 16, 16);
                }
            }
            
            // Arrow to show movement
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('↔', this.x + this.width / 2, this.y + this.height / 2 + 4);
        } else {
            // Normal brick platform (brown)
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw brick pattern
            for (let i = 0; i < this.width; i += 16) {
                for (let j = 0; j < this.height; j += 16) {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(this.x + i + 1, this.y + j + 1, 14, 14);
                    
                    // Brick details (lighter shade)
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x + i + 2, this.y + j + 2, 12, 12);
                }
            }
        }

        // Border shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, width = 32, height = 32, speed = 2) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = 1;
        this.moveRange = 100;
        this.originalX = x;
        this.defeated = false;
        this.animationCounter = 0;
    }

    update() {
        if (!this.defeated) {
            this.x += this.speed * this.direction;
            if (Math.abs(this.x - this.originalX) > this.moveRange) {
                this.direction *= -1;
            }
        }
        this.animationCounter += 0.1;
    }

    draw(ctx) {
        if (this.defeated) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        ctx.translate(-(this.width / 2), 0);

        // Draw Goomba-style enemy
        // Body (brown)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(16, 24, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (darker brown)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(16, 14, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 10, 4, 5);
        ctx.fillRect(22, 10, 4, 5);

        // Pupils (animated)
        ctx.fillStyle = '#000000';
        let pupilOffset = Math.sin(this.animationCounter) * 2;
        ctx.fillRect(11 + pupilOffset, 11, 2, 3);
        ctx.fillRect(23 + pupilOffset, 11, 2, 3);

        // Eyebrows (angry)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(9, 9);
        ctx.lineTo(12, 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(20, 9);
        ctx.lineTo(23, 8);
        ctx.stroke();

        // Mouth (frown)
        ctx.beginPath();
        ctx.arc(16, 15, 3, 0, Math.PI);
        ctx.stroke();

        // Spikes on back
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(10 + i * 6, 14);
            ctx.lineTo(12 + i * 6, 8);
            ctx.lineTo(14 + i * 6, 14);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.enemyScore = 0;
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameWon = false;
        this.levelWon = false;

        // Endless world state
        this.cameraX = 0;
        this.nextSpawnX = 0;
        this.lastSafeX = 50;
        this.lastSafeY = 480;
        
        this.keys = {
            left: false,
            right: false,
            jump: false
        };

        this.setupEndlessWorld();
        this.setupControls();
    }

    rectsOverlap(a, b, padding = 0) {
        return (
            a.x < b.x + b.width + padding &&
            a.x + a.width + padding > b.x &&
            a.y < b.y + b.height + padding &&
            a.y + a.height + padding > b.y
        );
    }

    getPlatformsAtX(x) {
        return this.platforms.filter(p => x >= p.x && x <= p.x + p.width);
    }

    getDifficulty() {
        const distance = this.player ? this.player.x : 0;
        const level = Math.floor(distance / 1200);
        return Math.min(6, level);
    }

    setupEndlessWorld() {
        this.platforms = [];
        this.enemies = [];
        this.enemyScore = 0;
        this.score = 0;
        this.cameraX = 0;
        this.nextSpawnX = 0;
        this.lastSafeX = 50;
        this.lastSafeY = 480;

        // Create player
        this.player = new Player(50, 480);

        // Generate initial chunks
        for (let i = 0; i < 3; i++) {
            this.generateChunk(this.nextSpawnX);
            this.nextSpawnX += GAME_CONFIG.CHUNK_WIDTH;
        }
    }

    generateChunk(startX, difficulty = 0) {
        const endX = startX + GAME_CONFIG.CHUNK_WIDTH;

        // Ground segments with gaps
        let x = startX;
        const minGround = 120;
        const maxGround = 260;
        const minGap = 40 + difficulty * 6;
        const maxGap = 140 + difficulty * 8;

        let firstSegment = true;
        while (x < endX) {
            const groundLength = Math.floor(Math.random() * (maxGround - minGround)) + minGround;
            const gapLength = Math.floor(Math.random() * (maxGap - minGap)) + minGap;

            const segmentLength = firstSegment ? Math.max(200, groundLength) : groundLength;
            this.platforms.push(
                new Platform(x, GAME_CONFIG.GROUND_Y, segmentLength, GAME_CONFIG.GROUND_HEIGHT, 'normal')
            );

            x += segmentLength + (firstSegment ? 0 : gapLength);
            firstSegment = false;
        }

        // Floating platforms (avoid overlaps)
        const platformCount = 3 + Math.floor(Math.random() * 3) + Math.floor(difficulty * 0.5);
        for (let i = 0; i < platformCount; i++) {
            let placed = false;
            for (let attempt = 0; attempt < 30 && !placed; attempt++) {
                const width = 80 + Math.floor(Math.random() * 100);
                const px = startX + 80 + Math.floor(Math.random() * (GAME_CONFIG.CHUNK_WIDTH - 160));
                const py = 240 + Math.floor(Math.random() * 220);
                const type = Math.random() < 0.3 + difficulty * 0.05 ? 'moving' : 'normal';
                const candidate = { x: px, y: py, width, height: 20 };

                const overlaps = this.platforms.some(p => this.rectsOverlap(candidate, p, 6));
                if (!overlaps) {
                    this.platforms.push(new Platform(px, py, width, 20, type));
                    placed = true;
                }
            }
        }

        // Enemies
        const enemyCount = 2 + Math.floor(Math.random() * 3) + Math.floor(difficulty * 0.8);
        for (let i = 0; i < enemyCount; i++) {
            let placed = false;
            for (let attempt = 0; attempt < 30 && !placed; attempt++) {
                const ex = startX + 120 + Math.floor(Math.random() * (GAME_CONFIG.CHUNK_WIDTH - 240));
                const onGround = Math.random() < 0.7;

                let surface = null;
                if (onGround) {
                    surface = this.getPlatformsAtX(ex).find(p => p.y === GAME_CONFIG.GROUND_Y);
                } else {
                    const candidates = this.getPlatformsAtX(ex).filter(p => p.y < GAME_CONFIG.GROUND_Y);
                    if (candidates.length) {
                        surface = candidates[Math.floor(Math.random() * candidates.length)];
                    }
                }

                if (!surface) continue;

                const ey = surface.y - 32;
                const enemyRect = { x: ex, y: ey, width: 32, height: 32 };
                const overlaps = this.platforms.some(p => p !== surface && this.rectsOverlap(enemyRect, p, 1));

                if (!overlaps) {
                    const speed = 2 + difficulty * 0.25 + Math.random() * 0.5;
                    this.enemies.push(new Enemy(ex, ey, 32, 32, speed));
                    placed = true;
                }
            }
        }
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.keys.jump = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === ' ' || e.key === 'ArrowUp') this.keys.jump = false;
        });

        // Mobile touch controls
        const canvas = this.canvas;
        
        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Left third - move left
            if (x < canvas.width / 3) {
                this.keys.left = true;
                this.keys.right = false;
            }
            // Right third - move right
            else if (x > (canvas.width * 2) / 3) {
                this.keys.right = true;
                this.keys.left = false;
            }
            // Center - jump
            else {
                this.keys.jump = true;
            }
        });

        canvas.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
            this.keys.jump = false;
        });

        // Mouse controls for mobile-like experience
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;

            if (x < canvas.width / 3) {
                this.keys.left = true;
                this.keys.right = false;
            } else if (x > (canvas.width * 2) / 3) {
                this.keys.right = true;
                this.keys.left = false;
            } else {
                this.keys.jump = true;
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.keys.left = false;
            this.keys.right = false;
            this.keys.jump = false;
        });
    }

    update() {
        if (this.gameOver) return;

        // Handle player input
        if (this.keys.left) {
            this.player.moveLeft();
        } else if (this.keys.right) {
            this.player.moveRight();
        } else {
            this.player.stopMoving();
        }

        if (this.keys.jump) {
            this.player.jump();
            this.keys.jump = false; // Prevent continuous jumping
        }

        // Update game objects
        this.player.update(this.platforms, this.enemies);
        this.platforms.forEach(p => p.update());
        this.enemies.forEach(e => e.update());

        // Update checkpoint when safely on a platform
        const feetY = this.player.y + this.player.height;
        if (this.player.velocityY === 0) {
            const standingOn = this.platforms.find(p =>
                this.player.x + this.player.width > p.x &&
                this.player.x < p.x + p.width &&
                Math.abs(feetY - p.y) <= 2
            );
            if (standingOn) {
                this.lastSafeX = this.player.x;
                this.lastSafeY = standingOn.y - this.player.height;
            }
        }

        // Remove defeated enemies
        this.enemies = this.enemies.filter(e => !e.defeated);

        // Camera follow
        const targetX = this.player.x - this.width * 0.35;
        this.cameraX += (targetX - this.cameraX) * GAME_CONFIG.CAMERA_LERP;
        if (this.cameraX < 0) this.cameraX = 0;

        // Spawn new chunks as player moves right
        const difficulty = this.getDifficulty();
        while (this.nextSpawnX < this.cameraX + this.width * 2) {
            this.generateChunk(this.nextSpawnX, difficulty);
            this.nextSpawnX += GAME_CONFIG.CHUNK_WIDTH;
        }

        // Cleanup old platforms/enemies
        const cleanupX = this.cameraX - 300;
        this.platforms = this.platforms.filter(p => p.x + p.width > cleanupX);
        this.enemies = this.enemies.filter(e => e.x + e.width > cleanupX);

        // Score: distance + enemy score
        this.score = Math.max(this.score, Math.floor(this.player.x / 10) + this.enemyScore);

        // Update UI
        document.getElementById('level').textContent = Math.floor(this.player.x);
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }

    draw() {
        // Clear canvas with gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB'); // Light blue top
        gradient.addColorStop(1, '#E0F6FF'); // Lighter blue bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw clouds
        this.drawClouds();

        // Draw hills/background
        this.drawHills();

        // Draw game objects
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        this.platforms.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);
        this.ctx.restore();
    }

    drawClouds() {
        const time = Date.now() * 0.0001;
        const offset = -(this.cameraX * 0.2) % this.width;
        const clouds = [
            { x: 50 + Math.sin(time) * 30 + offset, y: 50 },
            { x: 300 + Math.sin(time + 2) * 40 + offset, y: 80 },
            { x: 600 + Math.sin(time + 4) * 30 + offset, y: 60 },
            { x: 850 + Math.sin(time + 1) * 30 + offset, y: 70 }
        ];

        clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 25, cloud.y - 10, 25, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Cloud shadow
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + 2, cloud.y + 2, 18, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 27, cloud.y - 8, 23, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 52, cloud.y + 2, 18, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawHills() {
        const offset = -(this.cameraX * 0.4) % this.width;
        // Green hills in background
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.ellipse(150 + offset, 400, 120, 80, 0, 0, Math.PI);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(500 + offset, 420, 100, 70, 0, 0, Math.PI);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(700 + offset, 410, 110, 75, 0, 0, Math.PI);
        this.ctx.fill();

        // Darker shade for depth
        this.ctx.fillStyle = '#1a6b1a';
        this.ctx.beginPath();
        this.ctx.ellipse(150 + offset, 395, 100, 60, 0, 0, Math.PI);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(500 + offset, 415, 80, 50, 0, 0, Math.PI);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(700 + offset, 405, 90, 60, 0, 0, Math.PI);
        this.ctx.fill();
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver = true;
            this.showGameOver('Game Over!', 'No lives left! Final Score: ' + this.score);
        } else {
            // Respawn at last checkpoint
            this.player = new Player(this.lastSafeX, this.lastSafeY);
            this.cameraX = Math.max(0, this.lastSafeX - this.width * 0.35);
        }
    }

    showGameOver(title, message) {
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    restart() {
        // Reset entire game
        this.lives = 3;
        this.gameOver = false;
        this.setupEndlessWorld();
        document.getElementById('gameOverScreen').classList.add('hidden');
        game.gameLoop();
    }

    gameLoop() {
        this.update();
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

// Handle restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    game.restart();
});

// Start game
game.gameLoop();
