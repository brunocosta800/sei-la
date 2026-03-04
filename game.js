const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distElement = document.getElementById('dist-val');
const levelElement = document.getElementById('level-val'); // Added for level tracking
const animalNameElement = document.getElementById('animal-name');

const previewSprite = document.getElementById('preview-sprite');
const previewName = document.getElementById('preview-name');
const previewDesc = document.getElementById('preview-desc');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtnOver = document.getElementById('menu-btn-over');
const finalScoreElement = document.getElementById('final-score');
const menuBg = document.getElementById('menu-bg-animation');
const hud = document.getElementById('hud');
const prevAnimalBtn = document.getElementById('prev-animal');
const nextAnimalBtn = document.getElementById('next-animal');
const statLifeFill = document.getElementById('stat-life');
const statSpeedFill = document.getElementById('stat-speed');
const levelsBtn = document.getElementById('levels-btn');
const levelSelector = document.getElementById('level-selector');
const levelsGrid = document.getElementById('levels-grid');
const backToMenuBtn = document.getElementById('back-to-menu');
const levelSuccessMenu = document.getElementById('level-success');
const nextLevelBtn = document.getElementById('next-level-btn');
const selectorBtn = document.getElementById('selector-btn');
const starsContainer = document.getElementById('star-rating');
const remainingLivesElement = document.getElementById('remaining-lives');
const healthHearts = document.querySelectorAll('.heart');
const shopBtn = document.getElementById('shop-btn');
const shopMenu = document.getElementById('shop-menu');
const backFromShopBtn = document.getElementById('back-from-shop');
const shopGrid = document.getElementById('shop-grid');
const coinVal = document.getElementById('coin-val');
const shopCoins = document.getElementById('shop-coins');
const rewardCoins = document.getElementById('reward-coins');

const startScreen = document.getElementById('start-screen');
const playBtn = document.getElementById('play-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const quitToMenuBtn = document.getElementById('quit-to-menu-btn');
let gameWidth, gameHeight;
let gameActive = false;
let distance = 0;
let level = 1;
let globalSpeedMultiplier = 1;
let lastTime = 0;
let cameraY = 0;
let maxDist = 0;
let requestID = null; // To manage the animation frame loop
let gameMode = 'infinite'; // 'infinite' or 'levels'
let currentLevel = 1;
let lives = 3;
let MAX_LIVES = 3;
let selectedAnimalIndex = 0;

const LEVELS = [
    { goal: 200, multiplier: 1.0, title: "Primeiros Passos" },
    { goal: 400, multiplier: 1.1, title: "Rua Movimentada" },
    { goal: 600, multiplier: 1.2, title: "Travessia Selvagem" },
    { goal: 800, multiplier: 1.3, title: "Hora do Rush" },
    { goal: 1000, multiplier: 1.4, title: "Mestre da Pista" },
    { goal: 1200, multiplier: 1.55, title: "Rodovia Letal" },
    { goal: 1500, multiplier: 1.7, title: "Expresso Bioma" },
    { goal: 1800, multiplier: 1.85, title: "Tráfego Caótico" },
    { goal: 2100, multiplier: 2.0, title: "Desafio Extremo" },
    { goal: 2500, multiplier: 2.2, title: "Rei da Floresta" },
    { goal: 3000, multiplier: 2.5, title: "Inalcançável" },
    { goal: 4000, multiplier: 3.0, title: "Lenda Urbana" }
];

const ANIMALS = [
    { name: 'Capivara', sprite: '🦫', speed: 5, size: 0.85, maxLives: 3, color: '#D2B48C', desc: 'Equilibrada e resiliente.', price: 0 },
    { name: 'Tartaruga', sprite: '🐢', speed: 1.5, size: 0.75, maxLives: 5, color: '#90EE90', desc: 'O tanque clássico.', price: 0 },
    { name: 'Coelho', sprite: '🐇', speed: 15, size: 0.5, maxLives: 2, color: '#E0E0E0', desc: 'Saltador veloz.', price: 0 },
    // Loja Animais
    { name: 'Gato', sprite: '🐈', speed: 10, size: 0.6, maxLives: 3, color: '#FFD700', desc: 'Ágil e preciso.', price: 200 },
    { name: 'Esquilo', sprite: '🐿️', speed: 20, size: 0.5, maxLives: 1, color: '#CD853F', desc: 'Flash da natureza.', price: 400 },
    { name: 'Panda', sprite: '🐼', speed: 4, size: 1.0, maxLives: 6, color: '#FFFFFF', desc: 'Resistência extrema.', price: 800 },
    { name: 'Leão', sprite: '🦁', speed: 8, size: 0.9, maxLives: 4, color: '#F4A460', desc: 'Rei da pista.', price: 1500 },
    { name: 'Pinguim', sprite: '🐧', speed: 12, size: 0.6, maxLives: 2, color: '#000000', desc: 'Desliza no asfalto.', price: 600 },
    { name: 'Dinossauro', sprite: '🦖', speed: 6, size: 1.2, maxLives: 8, color: '#228B22', desc: 'Extinto? Jamais.', price: 5000 }
];

// Persistent Progress
let progress = JSON.parse(localStorage.getItem('wildCrossingProgress')) || {
    completedLevels: {}, // levelIndex: stars
    coins: 0,
    unlockedAnimals: ['Capivara', 'Tartaruga', 'Coelho']
};

// Migração/Garantia de atributos para progressos antigos
if (typeof progress.coins !== 'number') progress.coins = 0;
if (!Array.isArray(progress.unlockedAnimals)) progress.unlockedAnimals = ['Capivara', 'Tartaruga', 'Coelho'];

// Garante que o trio inicial SEMPRE esteja desbloqueado
const starters = ['Capivara', 'Tartaruga', 'Coelho'];
starters.forEach(animal => {
    if (!progress.unlockedAnimals.includes(animal)) progress.unlockedAnimals.push(animal);
});

// Limpeza de bugs críticos: Se o usuário só tem o Dinossauro ou o Gato (erros de versões anteriores)
if (progress.unlockedAnimals.length < 3 || (progress.unlockedAnimals.includes('Dinossauro') && progress.coins < 1000)) {
    // Reset preventivo para garantir o trio inicial
    progress.unlockedAnimals = ['Capivara', 'Tartaruga', 'Coelho'];
}

// Garante que o animal selecionado seja um que ele possui
if (progress.unlockedAnimals.length === 0) progress.unlockedAnimals = ['Capivara', 'Tartaruga', 'Coelho'];
const firstUnlocked = progress.unlockedAnimals[0];
const animalExists = ANIMALS.find(a => a.name === firstUnlocked);
if (!animalExists) {
    progress.unlockedAnimals = ['Capivara', 'Tartaruga', 'Coelho'];
}

if (!progress.completedLevels) progress.completedLevels = {};
saveProgress();

function saveProgress() {
    localStorage.setItem('wildCrossingProgress', JSON.stringify(progress));
}

const GRID_SIZE = 60;
const ROWS = [];

let player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    visualY: 0, // For smooth camera follow
    lastMoveTime: 0, // Novo: Controle de recarga
    type: ANIMALS[0],
    facingDir: 1
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

function canSpawnVehicle(lane) {
    // Evita sobreposição: checa se o último veículo já se afastou o suficiente da borda de spawn
    if (lane.vehicles.length === 0) return true;
    const lastV = lane.vehicles[lane.vehicles.length - 1];
    const minGap = 150; // Espaço mínimo entre veículos em pixels

    if (lane.speed > 0) {
        return lastV.x > -lastV.length + minGap;
    } else {
        return lastV.x < gameWidth - minGap;
    }
}

class Lane {
    constructor(y, type) {
        this.y = y;
        this.type = type;
        this.vehicles = [];

        // Ajustes de escala de dificuldade
        const difficulty = (gameMode === 'levels') ? currentLevel : level;

        // Fator de escala: Nível 1 é muito fácil, escala gradualmente
        const scaleFactor = Math.max(0.2, (difficulty - 1) * 0.4 + 0.5);

        let baseSpeed = 0.8 + (scaleFactor * 0.4);
        let vType = 'car';

        if (type === 'river') {
            baseSpeed *= 0.6;
            this.spawnInterval = Math.max(2000, 6000 / scaleFactor);
            vType = 'boat';
        } else if (type === 'rail') {
            baseSpeed *= 2.0;
            this.spawnInterval = Math.max(4000, 12000 / scaleFactor);
            vType = 'train';
        } else { // road
            // Gaps muito maiores no nível 1
            this.spawnInterval = Math.max(1500, (Math.random() * 2000 + 3000) / scaleFactor);
        }

        // Garante que o nível 1 seja realmente amigável
        if (difficulty === 1 && type === 'road') {
            this.spawnInterval *= 1.5;
            baseSpeed *= 0.8;
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

                // GARANTIA DE ESPAÇO: Escala com a dificuldade
                const difficulty = (gameMode === 'levels') ? currentLevel : level;
                const gapScale = Math.max(2.0, 5.0 - (difficulty * 0.3));
                const minGap = GRID_SIZE * (vType === 'train' ? 12 : gapScale);
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
        if (this.type === 'river') return '#0c4a6e';
        if (this.type === 'rail') return '#0f172a';
        if (this.type === 'checkpoint') return '#064e3b';
        return '#022c22';
    }

    draw(offsetY) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(0, this.y - offsetY, gameWidth, GRID_SIZE);

        if (this.type === 'road' && gameMode === 'infinite') {
            // Adiciona uma linha sutil para garantir que não pareça um erro visual
            ctx.strokeStyle = 'rgba(255,255,255,0.02)';
            ctx.strokeRect(0, this.y - offsetY, gameWidth, GRID_SIZE);
        }

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
            let label = `LEVEL ${level}`;
            if (this.isLevelGoal) label = "LINE GOAL!";
            ctx.fillText(label, gameWidth / 2, this.y + GRID_SIZE / 2 - offsetY + 8);
            ctx.shadowBlur = 0;
        }

        this.vehicles.forEach(v => v.draw(offsetY));
        ctx.restore();
    }

    update(dt) {
        if (this.type !== 'grass' && this.type !== 'checkpoint') {
            this.spawnTimer += dt * 1000;
            if (this.spawnTimer > this.spawnInterval && canSpawnVehicle(this)) {
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

// Fundo Animado do Menu
function createBgAnimation() {
    if (!menuBg) return;
    menuBg.innerHTML = '';
    const emojiList = ['🚗', '🚕', '🚙', '🚌', '🚐', '🚛', '🚚', '🚜', '🏎️', '🏍️'];

    for (let i = 0; i < 15; i++) {
        const car = document.createElement('div');
        car.className = 'bg-car';
        car.innerText = emojiList[Math.floor(Math.random() * emojiList.length)];

        let x = Math.random() * 100;
        let y = Math.random() * 100;
        let speed = 0.05 + Math.random() * 0.1;
        let dir = Math.random() > 0.5 ? 1 : -1;

        car.style.left = x + '%';
        car.style.top = y + '%';

        const interval = setInterval(() => {
            if (menuBg.classList.contains('hidden')) {
                clearInterval(interval);
                return;
            }
            x += speed * dir;
            if (x > 110) x = -10;
            if (x < -10) x = 110;
            car.style.left = x + '%';
        }, 16);

        menuBg.appendChild(car);
    }
}

function toggleMenuVisibility(show) {
    if (show) {
        menuBg.classList.remove('hidden');
        hud.classList.add('hidden');
        document.getElementById('game-title').classList.remove('hidden');
        gameActive = false; // Garante que o jogo pare se voltarmos pro menu
        if (requestID) cancelAnimationFrame(requestID);

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas do jogo
        createBgAnimation();
    } else {
        menuBg.classList.add('hidden');
        hud.classList.remove('hidden');
    }
}

function updateHealthUI(customHearts = null) {
    const heartsToUpdate = customHearts || document.querySelectorAll('.heart');
    heartsToUpdate.forEach((heart, index) => {
        if (index < lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function renderLevelSelector() {
    levelsGrid.innerHTML = '';
    LEVELS.forEach((lv, index) => {
        const levelNum = index + 1;
        const stars = progress.completedLevels[levelNum] || 0;
        const isLocked = levelNum > 1 && !progress.completedLevels[levelNum - 1];

        const card = document.createElement('div');
        card.className = `level-card ${isLocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="level-num">${levelNum}</div>
            <div class="level-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        `;

        if (!isLocked) {
            card.onclick = () => {
                currentLevel = levelNum;
                startLevel(levelNum);
            };
        }
        levelsGrid.appendChild(card);
    });
}

function startLevel(levelNum) {
    gameMode = 'levels';
    const config = LEVELS[levelNum - 1];
    startGame(config.multiplier, config.goal);
}

function generateInitialLanes() {
    ROWS.length = 0;
    // Começamos do -5 (abaixo do jogador) até 10 (visão inicial)
    for (let i = -5; i <= 10; i++) {
        const y = i * -GRID_SIZE;
        let type = 'grass';
        if (i > 0) type = 'road';
        if (i === 10) type = 'checkpoint'; // Primeiro respiro

        const lane = new Lane(y, type);
        ROWS.push(lane);
    }
    // O resto é preenchido pelo fillLanes dinamicamente
    fillLanes();
}

function fillLanes() {
    let minY = ROWS.reduce((acc, row) => Math.min(acc, row.y), 0);
    const renderDistance = 2000;

    while (minY > player.targetY - renderDistance) {
        minY -= GRID_SIZE;
        let type = 'road';
        let isGoal = false;
        const rowId = Math.abs(Math.floor(minY / GRID_SIZE));

        if (gameMode === 'levels') {
            const goalId = LEVELS[currentLevel - 1].goal / 10;
            if (rowId > goalId) {
                type = 'grass'; // Depois da meta, tudo é seguro
            } else if (rowId === goalId) {
                type = 'checkpoint';
                isGoal = true;
            } else if (rowId % 25 === 0) {
                type = 'checkpoint';
            } else {
                const rand = Math.random();
                if (rand < 0.2) type = 'rail';
                else if (rand < 0.5) type = 'river';
                else type = 'road';
            }
        } else {
            if (rowId % 25 === 0) {
                type = 'checkpoint';
            } else {
                const rand = Math.random();
                if (rand < 0.2) type = 'rail';
                else if (rand < 0.5) type = 'river';
                else type = 'road';
            }
        }

        const lane = new Lane(minY, type);
        if (type === 'checkpoint') lane.isLevelEnd = true;
        if (isGoal) {
            lane.isLevelGoal = true;
            lane.color = '#7c3aed'; // Roxo realce para a linha de chegada
        }
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


function updateAnimalPreview() {
    const animal = ANIMALS[selectedAnimalIndex];
    player.type = animal;
    previewSprite.innerText = animal.sprite;
    previewName.innerText = animal.name;
    previewDesc.innerText = animal.desc;
    animalNameElement.innerText = animal.name;

    // Update Stats Bars
    statLifeFill.style.width = (animal.maxLives / 6 * 100) + '%';
    statSpeedFill.style.width = (animal.speed / 10 * 100) + '%';
}

function selectRandomAnimal() {
    // Escolhe apenas entre os desbloqueados
    const unlocked = ANIMALS.filter(a => progress.unlockedAnimals.includes(a.name));
    const randomAnimal = unlocked[Math.floor(Math.random() * unlocked.length)];
    selectedAnimalIndex = ANIMALS.findIndex(a => a.name === randomAnimal.name);
    updateAnimalPreview();
}

function movePlayer(dx, dy) {
    if (!gameActive) return;

    // SISTEMA DE RECARGA (COOLDOWN) - Baseado na velocidade do animal
    const now = Date.now();
    const moveCooldown = Math.max(50, 420 - (player.type.speed * 20)); // Mais lento o animal, maior o intervalo
    if (now - player.lastMoveTime < moveCooldown) return;

    player.lastMoveTime = now;

    if (dx !== 0) {
        player.facingDir = dx > 0 ? -1 : 1;
    }

    const newX = player.targetX + dx * GRID_SIZE;
    const newY = player.targetY + dy * GRID_SIZE;

    // Boundary check lateral
    if (newX >= 0 && newX <= gameWidth - GRID_SIZE) {
        player.targetX = newX;
    }

    // Always allow moving up (infinite)
    if (dy !== 0) {
        player.targetY = newY;

        // Calcular progresso baseado na linha (lógica: +10m por linha avançada)
        const currentDist = Math.max(0, Math.round(player.targetY / -GRID_SIZE) * 10);

        if (currentDist > maxDist) {
            maxDist = currentDist;
            distance = maxDist;
            distElement.innerText = `${distance}m`;

            const currentRow = ROWS.find(r => Math.round(r.y) === Math.round(player.targetY));

            // Checar Vitória em Modo Fases (Baseado na linha de chegada)
            if (gameMode === 'levels' && currentRow && currentRow.isLevelGoal) {
                levelComplete();
                return;
            }

            // Checar se subiu de nível - Em Modo Fases o nível é fixo, em Infinito sobe nos checkpoints
            if (gameMode === 'infinite' && currentRow && currentRow.isLevelEnd && !currentRow.processed) {
                currentRow.processed = true;
                level++;
                if (gameMode === 'infinite') {
                    globalSpeedMultiplier += 0.25;
                    addCoins(20); // Bonus por checkpoint no infinito
                }
                if (levelElement) levelElement.innerText = level;
                console.log("CHECKPOINT! Nível atual:", level);
            }
        }
    }

    // Gerar mais pistas conforme sobe
    // Melhorado: Verifica se o topo das pistas está perto da posição do jogador
    let topY = ROWS.reduce((acc, row) => Math.min(acc, row.y), 0);
    if (topY > player.targetY - 1500) fillLanes();
}

function addCoins(amount) {
    progress.coins += amount;
    saveProgress();
    updateCoinDisplay();
}

function updateCoinDisplay() {
    const coins = (progress && typeof progress.coins === 'number') ? progress.coins : 0;
    if (coinVal) coinVal.innerText = coins;
    if (shopCoins) shopCoins.innerText = coins;
}

function renderShop() {
    shopGrid.innerHTML = '';
    ANIMALS.forEach(animal => {
        const isUnlocked = progress.unlockedAnimals.includes(animal.name);
        const canAfford = progress.coins >= animal.price;

        const item = document.createElement('div');
        item.className = `shop-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
            <div class="shop-item-sprite">${animal.sprite}</div>
            <div class="shop-item-name">${animal.name}</div>
            <div class="shop-item-price">${isUnlocked ? 'DESBLOQUEADO' : animal.price + ' 🪙'}</div>
            <button class="buy-btn ${isUnlocked ? 'owned' : ''}" 
                ${isUnlocked ? 'disabled' : ''}>
                ${isUnlocked ? 'ADQUIRIDO' : (canAfford ? 'COMPRAR' : 'POUCAS MOEDAS')}
            </button>
        `;

        const btn = item.querySelector('.buy-btn');
        if (isUnlocked) {
            btn.classList.add('owned');
            btn.disabled = true;
        } else if (canAfford) {
            btn.onclick = (e) => {
                e.stopPropagation(); // Previne conflitos
                progress.coins -= animal.price;
                progress.unlockedAnimals.push(animal.name);
                saveProgress();
                renderShop();
                updateCoinDisplay();
            };
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
        shopGrid.appendChild(item);
    });
}

let isPaused = false;

function togglePause() {
    if (!gameActive) return;

    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        if (requestID) cancelAnimationFrame(requestID);
    } else {
        pauseScreen.classList.add('hidden');
        lastTime = performance.now();
        requestID = requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('keydown', e => {
    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && gameActive) {
        togglePause();
    }

    if (isPaused) return;

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

    // Suavização do movimento (ARRASTO)
    // Reduzi os valores base para dar mais sensação de peso/arrasto
    const interpolationSpeed = 0.04 + (player.type.speed * 0.012);
    player.x += (player.targetX - player.x) * interpolationSpeed;
    player.y += (player.targetY - player.y) * interpolationSpeed;
    player.visualY += (player.targetY - player.visualY) * 0.15;

    // Draw Player
    ctx.save(); // Salva o estado para não afetar outros desenhos

    // Animação de caminhada e respiração
    const moveDistX = Math.abs(player.targetX - player.x);
    const moveDistY = Math.abs(player.targetY - player.visualY);
    const isMoving = moveDistX > 0.5 || moveDistY > 0.5;

    let walkY = 0;
    let walkRotation = 0;
    let scaleY = 1.0;
    let scaleX = 1.0;

    if (isMoving) {
        const speedFactor = player.type.speed * 0.002;
        const timeVal = Date.now() * (0.01 + speedFactor);
        walkY = -Math.abs(Math.sin(timeVal)) * 12; // Pulo ao andar

        const moveDirX = player.targetX > player.x ? 1 : (player.targetX < player.x ? -1 : 0);
        walkRotation = Math.sin(timeVal) * 0.2 * (moveDirX !== 0 ? moveDirX : 1); // Rotação ao andar

        scaleY = 1.0 + Math.sin(timeVal) * 0.1;
        scaleX = 1.0 - Math.sin(timeVal) * 0.05;
    } else {
        // Respiração suave ao ficar parado
        scaleY = 1.0 + Math.sin(Date.now() * 0.003) * 0.03;
        scaleX = 1.0 - Math.sin(Date.now() * 0.003) * 0.02;
    }

    ctx.font = `${GRID_SIZE * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Fix: Garante que o preenchimento seja branco opaco (evita transparência residual de outros objetos)
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

    if (isInvincible) {
        ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.4 + 0.6;
    }

    // Aplica transformações da animação
    ctx.translate(player.x + GRID_SIZE / 2, player.visualY + GRID_SIZE / 2 - cameraY + walkY);
    ctx.rotate(walkRotation);
    ctx.scale(scaleX * player.facingDir, scaleY); // Multiplica scaleX pelo facingDir para espelhar o animal

    // Desenha na origem traduzida
    ctx.fillText(player.type.sprite, 0, 0);

    ctx.globalAlpha = 1.0;
    ctx.restore();

    if (checkCollision()) playerHit();

    requestID = requestAnimationFrame(gameLoop);
}

function startGame(multiplier = 1, goal = Infinity) {
    gameActive = true;
    distance = 0;
    maxDist = 0;
    level = 1;
    MAX_LIVES = player.type.maxLives;
    lives = MAX_LIVES;
    globalSpeedMultiplier = multiplier;
    distElement.innerText = "0m";
    if (levelElement) levelElement.innerText = (gameMode === 'levels') ? currentLevel : 1;
    if (gameMode === 'infinite') level = 1;
    updateCoinDisplay();

    // Re-create health HUD based on character
    const healthContainer = document.getElementById('health-container');
    healthContainer.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.innerText = '❤️';
        healthContainer.appendChild(heart);
    }
    // Update the reference
    const newHearts = document.querySelectorAll('.heart');

    updateHealthUI(newHearts);

    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    levelSelector.classList.add('hidden');
    levelSuccessMenu.classList.add('hidden');
    document.getElementById('game-title').classList.add('hidden');
    toggleMenuVisibility(false);

    if (requestID) cancelAnimationFrame(requestID);

    resetPlayerPosition();
    generateInitialLanes();
    lastTime = performance.now();
    requestID = requestAnimationFrame(gameLoop);
}

let isInvincible = false;
function playerHit() {
    if (isInvincible) return;

    lives--;
    updateHealthUI();

    if (lives <= 0) {
        endGame();
    } else {
        // Breve invencibilidade e feedback visual (Sem redirecionamento conforme pedido)
        isInvincible = true;
        setTimeout(() => { isInvincible = false; }, 1500); // 1.5s de invencibilidade
    }
}

function levelComplete() {
    gameActive = false;

    // Estrela baseada na porcentagem de vida restante para ser justo com todos (Tank vs Speed)
    const healthPercentage = lives / MAX_LIVES;
    let stars = 1;
    if (healthPercentage >= 0.8) stars = 3;
    else if (healthPercentage >= 0.4) stars = 2;

    let coinsEarned = 50; // 1 Estrela
    if (stars === 3) coinsEarned = 300;
    else if (stars === 2) coinsEarned = 150;

    addCoins(coinsEarned);
    rewardCoins.innerText = coinsEarned;

    // Save progress
    if (!progress.completedLevels[currentLevel] || progress.completedLevels[currentLevel] < stars) {
        progress.completedLevels[currentLevel] = stars;
        saveProgress();
    }

    remainingLivesElement.innerText = lives;
    const starSpans = starsContainer.querySelectorAll('.star');
    starSpans.forEach((s, i) => {
        if (i < stars) s.classList.add('earned');
        else s.classList.remove('earned');
    });

    levelSuccessMenu.classList.remove('hidden');
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = distance;

    // Mensagens de morte variadas
    const messages = [
        "ATROPELADO!",
        "VIROU TAPETE!",
        "ASSADO NA PISTA!",
        "FOI PRO CÉU DOS BICHOS!",
        "QUE PANCADA!",
        "GAME OVER!",
        "TENTE OUTRA VEZ!"
    ];
    document.querySelector('#game-over h2').innerText = messages[Math.floor(Math.random() * messages.length)];

    gameOverMenu.classList.remove('hidden');
    selectRandomAnimal();
}

function initGame() {
    resize();

    // Configura interface inicial
    hud.classList.add('hidden');
    startScreen.classList.remove('hidden');
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    shopMenu.classList.add('hidden');
    levelSelector.classList.add('hidden');
    pauseScreen.classList.add('hidden');

    // Garante animais iniciais
    const currentStarters = ['Capivara', 'Tartaruga', 'Coelho'];
    if (!currentStarters.every(name => progress.unlockedAnimals.includes(name))) {
        progress.unlockedAnimals = [...new Set([...progress.unlockedAnimals, ...currentStarters])];
        saveProgress();
    }

    selectRandomAnimal();
    updateCoinDisplay();
    createBgAnimation();
}

initGame();

startBtn.addEventListener('click', () => {
    gameMode = 'infinite';
    startGame();
});

levelsBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    levelSelector.classList.remove('hidden');
    renderLevelSelector();
});

backToMenuBtn.addEventListener('click', () => {
    levelSelector.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    toggleMenuVisibility(true);
});

restartBtn.addEventListener('click', () => {
    if (gameMode === 'infinite') startGame();
    else startLevel(currentLevel);
});

nextLevelBtn.addEventListener('click', () => {
    if (currentLevel < LEVELS.length) {
        currentLevel++;
        startLevel(currentLevel);
    } else {
        levelSuccessMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        toggleMenuVisibility(true);
    }
});

selectorBtn.addEventListener('click', () => {
    levelSuccessMenu.classList.add('hidden');
    levelSelector.classList.remove('hidden');
    renderLevelSelector();
    toggleMenuVisibility(true);
});

shopBtn.addEventListener('click', () => {
    shopMenu.classList.remove('hidden');
    renderShop();
});

backFromShopBtn.addEventListener('click', () => {
    shopMenu.classList.add('hidden');
});

function getNextUnlockedAnimal(index, direction) {
    let nextIdx = index;
    const count = ANIMALS.length;
    for (let i = 0; i < count; i++) {
        nextIdx = (nextIdx + direction + count) % count;
        if (progress.unlockedAnimals.includes(ANIMALS[nextIdx].name)) {
            return nextIdx;
        }
    }
    return index;
}

prevAnimalBtn.addEventListener('click', () => {
    selectedAnimalIndex = getNextUnlockedAnimal(selectedAnimalIndex, -1);
    updateAnimalPreview();
});

nextAnimalBtn.addEventListener('click', () => {
    selectedAnimalIndex = getNextUnlockedAnimal(selectedAnimalIndex, 1);
    updateAnimalPreview();
});

menuBtnOver.addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    toggleMenuVisibility(true);
    updateAnimalPreview();
});

playBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

resumeBtn.addEventListener('click', () => {
    if (isPaused) togglePause();
});

quitToMenuBtn.addEventListener('click', () => {
    if (isPaused) {
        isPaused = false;
        pauseScreen.classList.add('hidden');
    }
    gameActive = false;

    if (requestID) {
        cancelAnimationFrame(requestID);
        requestID = null;
    }


    mainMenu.classList.remove('hidden');
    hud.classList.add('hidden');
    toggleMenuVisibility(true);
    updateAnimalPreview();
});

updateCoinDisplay();
