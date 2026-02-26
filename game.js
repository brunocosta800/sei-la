const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distElement = document.getElementById('dist-val');
const animalNameElement = document.getElementById('animal-name');

const previewSprite = document.getElementById('preview-sprite');
const previewName = document.getElementById('preview-name');
const previewDesc = document.getElementById('preview-desc');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

let gameWidth, gameHeight;
let gameActive = false;
let distance = 0;
let level = 1;
let globalSpeedMultiplier = 1;
let lastTime = 0;
let cameraY = 0;

const GRID_SIZE = 60;
const ROWS = [];
const ANIMALS = [
    { name: 'Capivara', sprite: '🦫', speed: 4, size: 0.9, color: '#D2B48C', desc: 'Resistente e calma. Ideal para iniciantes.' },
    { name: 'Gato', sprite: '🐈', speed: 8, size: 0.6, color: '#FFD700', desc: 'Rápido e furtivo. Esquiva fácil.' },
    { name: 'Tartaruga', sprite: '🐢', speed: 2, size: 0.7, color: '#90EE90', desc: 'Lenta, mas focada. Para mestres do timing.' },
    { name: 'Esquilo', sprite: '🐿️', speed: 10, size: 0.5, color: '#CD853F', desc: 'O terror das estradas. Pura velocidade.' }
];

let player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    visualY: 0, // For smooth camera follow
    type: ANIMALS[0]
};

function resize() {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    if (!gameActive) resetPlayerPosition();
}

window.addEventListener('resize', resize);

function resetPlayerPosition() {
    // Alinha a posição base ao GRID_SIZE para garantir que colida com as pistas
    player.x = Math.floor(gameWidth / (2 * GRID_SIZE)) * GRID_SIZE;
    player.y = 0; // Começa no "chão" lógico 0
    player.targetX = player.x;
    player.targetY = player.y;
    player.visualY = player.y;
    cameraY = -gameHeight + GRID_SIZE * 3; // Ajusta câmera para ver o início
}

class Vehicle {
    constructor(rowY, speed, length, color, type = 'car') {
        this.y = rowY;
        this.speed = speed;
        this.length = length * GRID_SIZE;
        this.width = GRID_SIZE * 0.7;
        this.color = color;
        this.type = type;
        this.x = speed > 0 ? -this.length : gameWidth;
    }

    draw(offsetY) {
        ctx.save();
        ctx.fillStyle = this.color;
        const drawY = this.y + 10 - offsetY;

        // Sombra suave para todos os veículos
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';

        switch (this.type) {
            case 'train':
                // Vagão de trem detalhado
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.roundRect(this.x + 2, drawY - 5, this.length - 4, this.width + 10, 5);
                ctx.fill();

                // Conectores e detalhes metálicos
                ctx.fillStyle = '#475569';
                for (let i = 10; i < this.length - 10; i += 40) {
                    ctx.fillRect(this.x + i, drawY - 2, 25, this.width + 4);
                }

                // Luzes vermelhas no último vagão (ou frente)
                ctx.fillStyle = this.speed > 0 ? 'white' : 'red';
                const lightX = this.speed > 0 ? this.x + this.length - 10 : this.x + 5;
                ctx.fillRect(lightX, drawY, 5, 5);
                ctx.fillRect(lightX, drawY + this.width - 5, 5, 5);
                break;

            case 'boat':
                // Barco com textura de madeira
                const grad = ctx.createLinearGradient(this.x, drawY, this.x, drawY + this.width);
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, '#3e2723');
                ctx.fillStyle = grad;

                ctx.beginPath();
                if (this.speed > 0) {
                    ctx.moveTo(this.x, drawY);
                    ctx.lineTo(this.x + this.length - 20, drawY);
                    ctx.quadraticCurveTo(this.x + this.length, drawY + this.width / 2, this.x + this.length - 20, drawY + this.width);
                    ctx.lineTo(this.x, drawY + this.width);
                } else {
                    ctx.moveTo(this.x + this.length, drawY);
                    ctx.lineTo(this.x + 20, drawY);
                    ctx.quadraticCurveTo(this.x, drawY + this.width / 2, this.x + 20, drawY + this.width);
                    ctx.lineTo(this.x + this.length, drawY + this.width);
                }
                ctx.closePath();
                ctx.fill();

                // Deck do barco e rastro na água
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(this.x + 10, drawY + 5, this.length - 30, this.width - 10);
                break;

            default: // 'car'
                // Carro com faróis e janelas premium
                ctx.beginPath();
                ctx.roundRect(this.x + 5, drawY, this.length - 10, this.width, 10);
                ctx.fill();

                // Janelas
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                const winW = (this.length - 10) * 0.6;
                const winX = this.x + (this.length - winW) / 2;
                ctx.fillRect(winX, drawY + 4, winW, this.width - 8);

                // Faróis dinâmicos
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'yellow';
                ctx.shadowColor = 'yellow';
                if (this.speed > 0) {
                    ctx.fillRect(this.x + this.length - 8, drawY + 5, 4, 8);
                    ctx.fillRect(this.x + this.length - 8, drawY + this.width - 13, 4, 8);
                } else {
                    ctx.fillRect(this.x + 4, drawY + 5, 4, 8);
                    ctx.fillRect(this.x + 4, drawY + this.width - 13, 4, 8);
                }
        }
        ctx.restore();
    }

    update(dt) {
        this.x += this.speed * globalSpeedMultiplier * dt * 60;
    }

    isOffscreen() {
        return (this.speed > 0 && this.x > gameWidth + 500) || (this.speed < 0 && this.x < -this.length - 500);
    }
}

class Lane {
    constructor(y, type) {
        this.y = y;
        this.type = type;
        this.vehicles = [];

        // Ajustes de velocidade e spawn por ambiente
        let baseSpeed = 1.2 + (level * 0.3);
        let spawnChance = 1.0;
        let vType = 'car';

        if (type === 'river') {
            baseSpeed *= 0.6; // Rios mais tranquilos no início
            this.spawnInterval = Math.max(2500, 5000 / (1 + level * 0.2));
            vType = 'boat';
        } else if (type === 'rail') {
            baseSpeed *= 2.2;
            this.spawnInterval = Math.max(5000, 10000 / (1 + level * 0.5));
            vType = 'train';
        } else { // road
            // Nível 1 começa com tráfego bem mais espaçado
            this.spawnInterval = Math.max(1800, (Math.random() * 2500 + 2500) / (1 + level * 0.3));
        }

        this.speed = (Math.random() * 1.5 + baseSpeed) * (Math.random() > 0.5 ? 1 : -1);
        this.spawnTimer = Math.random() * this.spawnInterval;
        this.color = this.getLaneColor();
        this.isLevelEnd = false;

        if (this.type !== 'grass' && this.type !== 'checkpoint') {
            const laneFullWidth = gameWidth + 1000;
            let currentX = Math.random() * 600;
            while (currentX < laneFullWidth) {
                const colors = this.getEnvColors();
                const vLen = vType === 'train' ? 6 + Math.random() * 4 : 1.1 + Math.random() * 0.5;
                const v = new Vehicle(this.y, this.speed, vLen, colors[Math.floor(Math.random() * colors.length)], vType);
                v.x = this.speed > 0 ? currentX - v.length : gameWidth - currentX;
                this.vehicles.push(v);

                // GARANTIA DE ESPAÇO: Aumentada para 3.5x no nível 1 para facilitar
                const minGap = GRID_SIZE * (vType === 'train' ? 12 : 3.5);
                currentX += Math.max(minGap + v.length, (this.spawnInterval / 16.6) * Math.abs(this.speed));
            }
        }
    }

    getEnvColors() {
        if (this.type === 'river') return ['#8b4513', '#a0522d', '#deb887']; // Tons de madeira
        if (this.type === 'rail') return ['#334155', '#475569', '#1e293b']; // Tons metálicos
        return ['#ef4444', '#f59e0b', '#3b82f6', '#ffffff', '#8b5cf6']; // Carros
    }

    getLaneColor() {
        if (this.type === 'grass') return '#064e3b';
        if (this.type === 'road') return '#1e293b';
        if (this.type === 'river') return '#0c4a6e'; // Azul profundo
        if (this.type === 'rail') return '#0f172a'; // Quase preto
        if (this.type === 'checkpoint') return '#1e40af';
        return '#022c22';
    }

    draw(offsetY) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, this.y - offsetY, gameWidth, GRID_SIZE);

        // Detalhes visuais dos trilhos
        if (this.type === 'rail') {
            ctx.fillStyle = '#475569';
            for (let i = 0; i < gameWidth; i += 40) {
                // Dormentes de madeira
                ctx.fillRect(i, this.y - offsetY, 15, GRID_SIZE);
            }
            // Trilhos metálicos
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(0, this.y + 12 - offsetY, gameWidth, 4);
            ctx.fillRect(0, this.y + GRID_SIZE - 16 - offsetY, gameWidth, 4);
        }

        // Ondas dinâmicas em camadas para o rio
        if (this.type === 'river') {
            const time = Date.now() * 0.002;

            // Camada 1: Ondas lentas
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = -50; i < gameWidth + 50; i += 50) {
                const waveY = Math.sin(time + i * 0.02) * 5;
                ctx.moveTo(i, this.y + GRID_SIZE / 2 - offsetY + waveY);
                ctx.lineTo(i + 30, this.y + GRID_SIZE / 2 - offsetY + waveY);
            }
            ctx.stroke();

            // Camada 2: Brilho na água
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < gameWidth; i += 100) {
                const off = (time * 50 + i) % gameWidth;
                ctx.fillRect(off, this.y + 5 - offsetY, 20, 2);
            }
        }

        // Detalhes da grama
        if (this.type === 'grass') {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 20; i < gameWidth; i += 60) {
                ctx.fillRect(i, this.y + 10 - offsetY, 4, 4);
                ctx.fillRect(i + 15, this.y + 30 - offsetY, 4, 4);
            }
        }

        if (this.type === 'road') {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(0, this.y - offsetY); ctx.lineTo(gameWidth, this.y - offsetY);
            ctx.moveTo(0, this.y + GRID_SIZE - offsetY); ctx.lineTo(gameWidth, this.y + GRID_SIZE - offsetY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (this.isLevelEnd) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.2;
            ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
            ctx.fillRect(0, this.y - offsetY, gameWidth, GRID_SIZE);

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'gold';
            ctx.font = '700 24px Outfit';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL ${level}`, gameWidth / 2, this.y + GRID_SIZE / 2 - offsetY + 8);
            ctx.shadowBlur = 0;
        }

        this.vehicles.forEach(v => v.draw(offsetY));
    }

    update(dt) {
        if (this.type !== 'grass' && this.type !== 'checkpoint') {
            this.spawnTimer += dt * 1000;
            if (this.spawnTimer > this.spawnInterval) {
                const colors = this.getEnvColors();
                let vType = 'car';
                if (this.type === 'river') vType = 'boat';
                if (this.type === 'rail') vType = 'train';

                const vLen = vType === 'train' ? 6 + Math.random() * 4 : 1.1 + Math.random() * 0.5;
                this.vehicles.push(new Vehicle(this.y, this.speed, vLen, colors[Math.floor(Math.random() * colors.length)], vType));
                this.spawnTimer = 0;
            }
        }
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            this.vehicles[i].update(dt);
            if (this.vehicles[i].isOffscreen()) this.vehicles.splice(i, 1);
        }
    }
}

function generateInitialLanes() {
    ROWS.length = 0;
    // Posição 0 é onde o jogador começa. Geramos algumas para baixo e muitas para cima.
    for (let i = -5; i <= 20; i++) {
        const y = i * -GRID_SIZE;
        const type = (i <= 0) ? 'grass' : 'road';
        const lane = new Lane(y, type);
        ROWS.push(lane);
    }
}

function fillLanes() {
    let minY = ROWS.reduce((acc, row) => Math.min(acc, row.y), 0);
    const renderDistance = 2000;

    while (minY > player.targetY - renderDistance) {
        minY -= GRID_SIZE;
        let type = 'road';
        const rowId = Math.abs(Math.floor(minY / GRID_SIZE));

        if (rowId % 15 === 0) {
            type = 'checkpoint';
        } else if (rowId % 15 > 12) {
            type = 'grass';
        } else {
            // Sorteia o ambiente perigoso
            const rand = Math.random();
            if (rand < 0.2) type = 'rail';      // 20% trilhos
            else if (rand < 0.5) type = 'river'; // 30% rios
            else type = 'road';                  // 50% estradas
        }

        const lane = new Lane(minY, type);
        if (type === 'checkpoint') lane.isLevelEnd = true;
        ROWS.push(lane);
    }

    if (ROWS.length > 200) {
        const cameraBottom = cameraY + gameHeight;
        for (let i = ROWS.length - 1; i >= 0; i--) {
            if (ROWS[i].y > cameraBottom + 1000) {
                ROWS.splice(i, 1);
            }
        }
    }
}


function selectRandomAnimal() {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    player.type = animal;
    previewSprite.innerText = animal.sprite;
    previewName.innerText = animal.name;
    previewDesc.innerText = animal.desc;
    animalNameElement.innerText = animal.name;

}

function movePlayer(dx, dy) {
    if (!gameActive) return;

    const newX = player.targetX + dx * GRID_SIZE;
    const newY = player.targetY + dy * GRID_SIZE;

    // Boundary check lateral
    if (newX >= 0 && newX <= gameWidth - GRID_SIZE) {
        player.targetX = newX;
    }

    // Always allow moving up (infinite)
    if (dy !== 0) {
        player.targetY = newY;
        if (dy < 0) {
            distance += 10;
            distElement.innerText = `${distance}m`;

            // Checar se passou checkpoint - Busca a linha na posição Y atual
            const currentRow = ROWS.find(r => Math.round(r.y) === Math.round(player.targetY));
            if (currentRow && currentRow.isLevelEnd) {
                level++;
                globalSpeedMultiplier += 0.25; // Aumento significativo de velocidade
                console.log("LEVEL UP! Nível atual:", level, "Velocidade:", globalSpeedMultiplier);
            }
        }
    }

    // Gerar mais pistas conforme sobe
    // Melhorado: Verifica se o topo das pistas está perto da posição do jogador
    let topY = ROWS.reduce((acc, row) => Math.min(acc, row.y), 0);
    if (topY > player.targetY - 1500) fillLanes();
}

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
});

function checkCollision() {
    const playerY = Math.round(player.targetY);
    const row = ROWS.find(r => Math.round(r.y) === playerY);

    if (!row) return false;

    // Hitbox base (padding do animal)
    const playerPadding = (1 - player.type.size) * GRID_SIZE * 0.5;
    const playerLeft = player.targetX + playerPadding;
    const playerRight = player.targetX + GRID_SIZE - playerPadding;

    // Lógica para ESTRADA e TRILHO: Bateu, morreu
    if (row.type === 'road' || row.type === 'rail') {
        for (let v of row.vehicles) {
            const vLeft = v.x + 5;
            const vRight = v.x + v.length - 5;
            if (playerLeft < vRight && playerRight > vLeft) return true;
        }
    }

    // Lógica para RIO: NÃO estar em cima do barco, morreu
    if (row.type === 'river') {
        let onBoat = false;
        for (let v of row.vehicles) {
            // No rio, a hitbox do barco é mais generosa para não cair na beiradinha
            if (playerLeft + 10 < v.x + v.length && playerRight - 10 > v.x) {
                onBoat = true;
                break;
            }
        }
        if (!onBoat) return true; // Caiu na água
    }

    return false;
}

function gameLoop(time) {
    if (!gameActive) return;

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // Camera follow player
    const targetCameraY = player.targetY - gameHeight * 0.7;
    cameraY += (targetCameraY - cameraY) * 0.1;

    // Draw and Update Lanes (Only those near camera)
    ROWS.forEach(row => {
        if (row.y - cameraY > -GRID_SIZE && row.y - cameraY < gameHeight + GRID_SIZE) {
            row.update(dt);
            row.draw(cameraY);
        }
    });

    // MÁGICA DO RIO: Drift do jogador se estiver em cima de um barco
    const currentRow = ROWS.find(r => Math.round(r.y) === Math.round(player.targetY));
    if (gameActive && currentRow && currentRow.type === 'river') {
        player.targetX += currentRow.speed * globalSpeedMultiplier * dt * 60;
        player.x += currentRow.speed * globalSpeedMultiplier * dt * 60;

        // Impedir que o drift tire o jogador totalmente da tela
        if (player.targetX < -GRID_SIZE) endGame();
        if (player.targetX > gameWidth) endGame();
    }

    // Interpolate Player
    player.x += (player.targetX - player.x) * (player.type.speed * 0.1);
    player.visualY += (player.targetY - player.visualY) * (player.type.speed * 0.1);

    // Draw Player
    ctx.save(); // Salva o estado para não afetar outros desenhos
    ctx.font = `${GRID_SIZE * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Fix: Garante que o preenchimento seja branco opaco (evita transparência residual de outros objetos)
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

    ctx.fillText(player.type.sprite, player.x + GRID_SIZE / 2, player.visualY + GRID_SIZE / 2 - cameraY);
    ctx.restore();

    if (checkCollision()) endGame();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameActive = true;
    distance = 0;
    level = 1;
    globalSpeedMultiplier = 1;
    distElement.innerText = "0m";
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    document.getElementById('game-title').classList.add('hidden'); // Esconde o título principal

    generateInitialLanes();
    resetPlayerPosition();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = distance;
    gameOverMenu.classList.remove('hidden');
    selectRandomAnimal();
}

resize();
selectRandomAnimal();
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
