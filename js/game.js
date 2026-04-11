// ===== 游戏核心代码 =====
// 你追我赶 - 猫和老鼠追逐游戏

// ===== 游戏状态 =====
const GameState = {
    currentScreen: 'home',
    selectedRole: null,
    currentLevel: 1,
    bestRecord: parseInt(localStorage.getItem('catMouseGame_bestRecord')) || 15,
    lastRecord: parseInt(localStorage.getItem('catMouseGame_lastRecord')) || 8,
    isPaused: false,
    gameResult: null,

    // 游戏元素
    player: null,
    aiEntities: [],  // 支持多个AI实体
    obstacles: [],
    chests: [],
    traps: [],  // 持久陷阱列表
    catItems: [null, null, null, null],  // 猫专属道具栏
    fakeChests: [],  // 假宝箱列表
    kittens: [],     // 小猫列表
    door: null,
    items: [null, null, null, null],
    hasKey: false,
    escapedCount: 0,  // 已逃脱的老鼠数量
    caughtCount: 0,   // 抓获的老鼠数量
    totalMice: 0,     // 总老鼠数量

    // 地图和摄像机
    mapWidth: 0,
    mapHeight: 0,
    cameraX: 0,
    cameraY: 0,

    // 输入状态
    keys: { w: false, a: false, s: false, d: false },
    joystickActive: false,
    joystickDir: { x: 0, y: 0 }
};

// ===== 游戏配置 =====
const GameConfig = {
    // 颜色
    colors: {
        pinkSoft: '#FFB6C1',
        pinkBright: '#FF69B4',
        pinkDeep: '#FF1493',
        purpleSoft: '#DDA0DD',
        purpleBright: '#BA55D3',
        purpleDeep: '#8B008B',
        gold: '#FFD700',
        greenSuccess: '#4CAF50',
        grayMouse: '#C0C0C0',
        orange: '#FFA500',
        white: '#FFFFFF',
        black: '#1a1a2e'
    },

    // 角色
    playerSpeed: 3,
    aiBaseSpeed: 2.5,
    aiSpeedIncrease: 0.025, // 每关速度增加（原0.1的1/4）

    // 难度配置
    maxObstacles: 25,      // 最大障碍物数量（原15，增加以适应1.5倍数量）
    difficultyThreshold: 5, // 开始增加AI实体的关卡阈值

    // 地图配置
    mapGrowthStartLevel: 20,  // 从第20关开始地图变大
    mapGrowthBase: 1.5,       // 初始增大到150%
    mapGrowthStep: 0.25,      // 每10关增加25%
    mapGrowthInterval: 10,    // 每10关增长一次

    // 摄像机配置
    cameraEdgeThreshold: 1/3, // 屏幕边缘1/3处触发

    // 道具持续时间（毫秒）
    itemDuration: {
        slow: 5000,
        freeze: 3000,
        trap: 4000,
        invincible: 3000,   // 开局无敌时间
        invincibleFlash: 1000,  // 无敌结束前闪烁时间
        // 玩家是猫时，被道具影响的持续时间（更短以保持可玩性）
        freezeAsCat: 1000,  // 玩家猫被冰冻只有1秒
        trapAsCat: 1000     // 玩家猫被陷阱限制移动只有1秒
    },

    // 玩家是猫时，宝箱道具分配概率（降低冰冻概率）
    catGameChestItemWeights: {
        key: 30,    // 30% 钥匙
        slow: 15,   // 15% 减速
        freeze: 5,  // 5% 冰冻
        trap: 10,   // 10% 陷阱
        nothing: 40 // 40% 无道具
    },

    // 猫专属道具配置
    catItems: {
        speedBoost: { name: '加速', icon: '⚡', duration: 5000 },
        fakeChest: { name: '假宝箱', icon: '📦' },
        summonKitten: { name: '小猫', icon: '🐱', duration: 8000 }
    },

    // 警告距离
    warningDistance: 150,
    catchDistance: 30
};

// ===== Canvas 和渲染 =====
let canvas, ctx;
let gameLoopId;
let lastTime = 0;

// ===== 音效系统 =====
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.bgmSource = null;
        this.bgmType = 'normal';
        this.sounds = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    }

    // 播放点击音效
    playClick() {
        this.playTone(800, 0.1, 'sine');
    }

    // 播放警告音效
    playWarning() {
        this.playTone(400, 0.15, 'square');
        setTimeout(() => this.playTone(600, 0.1, 'square'), 100);
    }

    // 播放被抓音效
    playCaught() {
        this.playTone(200, 0.3, 'sawtooth');
    }

    // 播放逃脱音效
    playEscape() {
        this.playTone(600, 0.1, 'sine');
        setTimeout(() => this.playTone(800, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(1000, 0.15, 'sine'), 200);
    }

    // 播放宝箱音效
    playChestOpen() {
        this.playTone(500, 0.1, 'triangle');
    }

    // 播放道具拾取音效
    playItemPickup() {
        this.playTone(700, 0.08, 'sine');
    }

    // 播放道具使用音效
    playItemUse() {
        this.playTone(900, 0.1, 'square');
    }

    // 基础音调播放
    playTone(freq, duration, type) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // BGM
    startBGM(type) {
        this.bgmType = type;
        // 简化版BGM：循环播放背景音符
        if (this.bgmInterval) clearInterval(this.bgmInterval);

        const bgmNotes = {
            normal: [400, 450, 500, 450],
            chase: [600, 700, 800, 700],
            win: [500, 600, 700, 800, 900],
            lose: [300, 250, 200, 250]
        };

        const notes = bgmNotes[type] || bgmNotes.normal;
        let noteIndex = 0;

        this.bgmInterval = setInterval(() => {
            if (notes[noteIndex]) {
                this.playTone(notes[noteIndex], 0.2, 'sine');
            }
            noteIndex = (noteIndex + 1) % notes.length;
        }, 400);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    changeBGMType(type) {
        if (this.bgmType !== type) {
            this.startBGM(type);
        }
    }
}

const soundManager = new SoundManager();

// ===== 角色类 =====
class Character {
    constructor(x, y, type, isPlayer) {
        this.x = x;
        this.y = y;
        this.type = type; // 'mouse' or 'cat'
        this.isPlayer = isPlayer;
        this.speed = isPlayer ? GameConfig.playerSpeed : GameConfig.aiBaseSpeed;
        this.baseSpeed = this.speed;
        this.size = 40;
        this.direction = { x: 0, y: 0 };
        this.effects = {
            slowed: false,
            frozen: false,
            trapped: false,
            warning: false,  // 危险警告状态
            invincible: false,   // 无敌状态
            invincibleFlash: false,  // 无敌闪烁提示
            speedBoost: false,   // 加速效果
            dizzy: false   // 晕眩状态（碰到移动障碍物）
        };
        this.effectTimers = {};
        this.animFrame = 0;
    }

    move(dir) {
        if (this.effects.frozen || this.effects.trapped || this.effects.dizzy) return;

        this.direction = dir;

        // 计算移动速度
        let actualSpeed = this.speed;
        if (this.effects.slowed) {
            actualSpeed *= 0.5;
        }
        if (this.effects.speedBoost) {
            actualSpeed *= 1.5;  // 加速效果：速度提升50%
        }

        // 计算新位置
        let newX = this.x + dir.x * actualSpeed;
        let newY = this.y + dir.y * actualSpeed;

        // 边界检查（使用地图边界）
        const mapW = GameState.mapWidth || canvas.width;
        const mapH = GameState.mapHeight || canvas.height;
        newX = Math.max(this.size, Math.min(mapW - this.size, newX));
        newY = Math.max(this.size, Math.min(mapH - this.size, newY));

        // 障碍物碰撞检查
        if (!this.checkObstacleCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 尝试滑动：分别尝试只移动X或只移动Y
            let moved = false;

            // 尝试只移动X
            if (!this.checkObstacleCollision(newX, this.y)) {
                this.x = newX;
                moved = true;
            }
            // 尝试只移动Y
            if (!this.checkObstacleCollision(this.x, newY)) {
                this.y = newY;
                moved = true;
            }

            // 如果还是不行，尝试沿着障碍物滑动
            if (!moved) {
                // 尝试斜向滑动
                const slideAngles = [Math.PI/3, -Math.PI/3, Math.PI/2, -Math.PI/2, Math.PI*2/3, -Math.PI*2/3];
                const currentAngle = Math.atan2(dir.y, dir.x);

                for (const angleOffset of slideAngles) {
                    const testAngle = currentAngle + angleOffset;
                    const testX = this.x + Math.cos(testAngle) * actualSpeed;
                    const testY = this.y + Math.sin(testAngle) * actualSpeed;

                    if (!this.checkObstacleCollision(testX, testY)) {
                        this.x = testX;
                        this.y = testY;
                        moved = true;
                        break;
                    }
                }
            }
        }

        this.animFrame++;
    }

    checkObstacleCollision(x, y) {
        for (const obs of GameState.obstacles) {
            if (!obs) continue;

            const obsX = obs.x;
            const obsY = obs.y;
            const obsW = obs.width;
            const obsH = obs.height;

            // 简单矩形碰撞
            if (x + this.size/2 > obsX && x - this.size/2 < obsX + obsW &&
                y + this.size/2 > obsY && y - this.size/2 < obsY + obsH) {
                return true;
            }
        }
        return false;
    }

    applyEffect(effect, duration) {
        this.effects[effect] = true;

        // 无敌效果：最后1秒开始闪烁
        if (effect === 'invincible') {
            setTimeout(() => {
                if (this.effects.invincible) {
                    this.effects.invincibleFlash = true;
                }
            }, duration - GameConfig.itemDuration.invincibleFlash);
        }

        if (this.effectTimers[effect]) {
            clearTimeout(this.effectTimers[effect]);
        }

        this.effectTimers[effect] = setTimeout(() => {
            this.effects[effect] = false;
            if (effect === 'invincible') {
                this.effects.invincibleFlash = false;
            }
            delete this.effectTimers[effect];
        }, duration);
    }

    draw() {
        // 计算屏幕坐标（应用摄像机偏移）
        const screenX = this.x - GameState.cameraX;
        const screenY = this.y - GameState.cameraY;

        // 检查是否在屏幕范围内（优化性能）
        if (screenX < -this.size - 20 || screenX > canvas.width + this.size + 20 ||
            screenY < -this.size - 20 || screenY > canvas.height + this.size + 20) {
            return;
        }

        ctx.save();

        // 危险警告 - 红色边框闪烁
        if (this.effects.warning && this.isPlayer) {
            const pulse = Math.sin(this.animFrame * 0.15) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();

            // 添加危险光环
            ctx.strokeStyle = `rgba(255, 100, 100, ${pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 12, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 无敌盾牌效果
        if (this.effects.invincible) {
            const flashPhase = this.effects.invincibleFlash;
            const alpha = flashPhase ? (Math.sin(Date.now() / 100) * 0.3 + 0.5) : 0.4;
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = flashPhase ? 4 : 3;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 15, 0, Math.PI * 2);
            ctx.stroke();

            // 盾牌图标
            if (!flashPhase || Math.sin(Date.now() / 100) > 0) {
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🛡️', screenX, screenY - this.size - 25);
            }
        }

        // 冰冻效果显示
        if (this.effects.frozen) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.effects.slowed) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.effects.trapped) {
            ctx.strokeStyle = '#C2185B';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 绘制角色
        if (this.type === 'mouse') {
            this.drawMouse();
        } else {
            this.drawCat();
        }

        // 晕眩效果：头顶旋转星星
        if (this.effects.dizzy) {
            const time = Date.now() / 200;
            const starCount = 3;
            for (let i = 0; i < starCount; i++) {
                const angle = time + (i * Math.PI * 2 / starCount);
                const radius = 20;
                const starX = screenX + Math.cos(angle) * radius;
                const starY = screenY - this.size - 15 + Math.sin(angle) * 8;

                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💫', starX, starY);
            }
        }

        // 加速效果：速度线
        if (this.effects.speedBoost) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX - this.size - 5 - i * 8, screenY - 10 + i * 10);
                ctx.lineTo(screenX - this.size - 15 - i * 8, screenY - 10 + i * 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(screenX - this.size - 5 - i * 8, screenY + 10 - i * 10);
                ctx.lineTo(screenX - this.size - 15 - i * 8, screenY + 10 - i * 10);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawMouse() {
        // 计算屏幕坐标
        const x = this.x - GameState.cameraX;
        const y = this.y - GameState.cameraY;
        const bounce = Math.sin(this.animFrame * 0.1) * 2;

        // 身体
        ctx.fillStyle = GameConfig.colors.grayMouse;
        ctx.beginPath();
        ctx.ellipse(x, y + 5 + bounce, 18, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.beginPath();
        ctx.arc(x, y - 5 + bounce, 16, 0, Math.PI * 2);
        ctx.fill();

        // 内脸
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.arc(x, y - 2 + bounce, 12, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵
        ctx.fillStyle = GameConfig.colors.grayMouse;
        ctx.beginPath();
        ctx.arc(x - 14, y - 20 + bounce, 8, 0, Math.PI * 2);
        ctx.arc(x + 14, y - 20 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = GameConfig.colors.pinkSoft;
        ctx.beginPath();
        ctx.arc(x - 14, y - 20 + bounce, 5, 0, Math.PI * 2);
        ctx.arc(x + 14, y - 20 + bounce, 5, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x - 6, y - 8 + bounce, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 6, y - 8 + bounce, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - 4, y - 10 + bounce, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 8, y - 10 + bounce, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 鼻子
        ctx.fillStyle = GameConfig.colors.pinkBright;
        ctx.beginPath();
        ctx.ellipse(x, y + bounce, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 胡须
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 25, y - 3 + bounce);
        ctx.lineTo(x - 12, y + bounce);
        ctx.moveTo(x - 25, y + 3 + bounce);
        ctx.lineTo(x - 12, y + 3 + bounce);
        ctx.moveTo(x + 25, y - 3 + bounce);
        ctx.lineTo(x + 12, y + bounce);
        ctx.moveTo(x + 25, y + 3 + bounce);
        ctx.lineTo(x + 12, y + 3 + bounce);
        ctx.stroke();

        // 尾巴
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 15 + bounce);
        ctx.quadraticCurveTo(x + 35, y + 10 + bounce, x + 30, y + 25 + bounce);
        ctx.stroke();
    }

    drawCat() {
        // 计算屏幕坐标
        const x = this.x - GameState.cameraX;
        const y = this.y - GameState.cameraY;
        const bounce = Math.sin(this.animFrame * 0.08) * 3;

        // 身体
        ctx.fillStyle = GameConfig.colors.orange;
        ctx.beginPath();
        ctx.ellipse(x, y + 10 + bounce, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.beginPath();
        ctx.arc(x, y - 5 + bounce, 20, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵
        ctx.fillStyle = GameConfig.colors.orange;
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 20 + bounce);
        ctx.lineTo(x - 25, y - 40 + bounce);
        ctx.lineTo(x - 8, y - 25 + bounce);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 18, y - 20 + bounce);
        ctx.lineTo(x + 25, y - 40 + bounce);
        ctx.lineTo(x + 8, y - 25 + bounce);
        ctx.closePath();
        ctx.fill();

        // 内耳
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 22 + bounce);
        ctx.lineTo(x - 22, y - 35 + bounce);
        ctx.lineTo(x - 10, y - 26 + bounce);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 16, y - 22 + bounce);
        ctx.lineTo(x + 22, y - 35 + bounce);
        ctx.lineTo(x + 10, y - 26 + bounce);
        ctx.closePath();
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 10 + bounce, 5, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 8, y - 10 + bounce, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - 5, y - 13 + bounce, 2, 0, Math.PI * 2);
        ctx.arc(x + 11, y - 13 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();

        // 鼻子
        ctx.fillStyle = GameConfig.colors.pinkBright;
        ctx.beginPath();
        ctx.ellipse(x, y + 2 + bounce, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 8 + bounce);
        ctx.quadraticCurveTo(x, y + 14 + bounce, x + 6, y + 8 + bounce);
        ctx.stroke();

        // 胡须
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 35, y + bounce);
        ctx.lineTo(x - 15, y + 2 + bounce);
        ctx.moveTo(x - 35, y + 8 + bounce);
        ctx.lineTo(x - 15, y + 6 + bounce);
        ctx.moveTo(x + 35, y + bounce);
        ctx.lineTo(x + 15, y + 2 + bounce);
        ctx.moveTo(x + 35, y + 8 + bounce);
        ctx.lineTo(x + 15, y + 6 + bounce);
        ctx.stroke();

        // 尾巴
        ctx.strokeStyle = GameConfig.colors.orange;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 22, y + 25 + bounce);
        ctx.quadraticCurveTo(x + 40, y + 15 + bounce, x + 35, y + 35 + bounce);
        ctx.stroke();
    }
}

// 按权重随机选择道具（玩家是猫时使用）
function getWeightedRandomItem() {
    const weights = GameConfig.catGameChestItemWeights;
    const items = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (const item of items) {
        random -= weights[item];
        if (random <= 0) {
            return item;
        }
    }
    return items[items.length - 1];
}

// ===== 关卡生成 =====
function generateLevel(level) {
    // 清空元素
    GameState.obstacles = [];
    GameState.chests = [];
    GameState.traps = [];
    GameState.items = [null, null, null, null];
    GameState.hasKey = false;
    GameState.aiEntities = [];
    GameState.escapedCount = 0;
    GameState.kittens = [];       // 清空小猫
    GameState.fakeChests = [];    // 清空假宝箱
    GameState.catItems = [null, null, null, null];  // 清空猫道具栏

    // ===== 计算地图尺寸 =====
    if (level < GameConfig.mapGrowthStartLevel) {
        GameState.mapWidth = canvas.width;
        GameState.mapHeight = canvas.height;
    } else {
        const stages = Math.floor((level - GameConfig.mapGrowthStartLevel) / GameConfig.mapGrowthInterval);
        const multiplier = GameConfig.mapGrowthBase + stages * GameConfig.mapGrowthStep;
        GameState.mapWidth = canvas.width * multiplier;
        GameState.mapHeight = canvas.height * multiplier;
    }

    // 重置摄像机位置
    GameState.cameraX = 0;
    GameState.cameraY = 0;

    const width = GameState.mapWidth;
    const height = GameState.mapHeight;

    // ===== 计算AI数量 =====
    let numAI = 1;
    if (GameState.selectedRole === 'mouse') {
        // 玩家是老鼠：猫的数量
        if (level < GameConfig.difficultyThreshold) {
            numAI = 1;  // 前5关：1只猫
        } else if (level < GameConfig.mapGrowthStartLevel) {
            // 关卡5-19：最多4只猫
            numAI = 1 + Math.floor((level - GameConfig.difficultyThreshold) / 9);
            numAI = Math.min(numAI, 4);
        } else {
            // 第20关后：从4只开始，地图每变大2档+1只
            const stages = Math.floor((level - GameConfig.mapGrowthStartLevel) / GameConfig.mapGrowthInterval);
            // 每2档增加1只猫（档位0→4只，档位2→5只，档位4→6只...）
            numAI = 4 + Math.floor(stages / 2);
            numAI = Math.min(numAI, 8);  // 上限8只猫
        }
    } else {
        // 玩家是猫：老鼠数量
        if (level < GameConfig.difficultyThreshold) {
            numAI = 1;  // 前5关：1只老鼠
        } else if (level < GameConfig.mapGrowthStartLevel) {
            // 关卡5-19：最多4只老鼠
            numAI = 1 + Math.floor((level - GameConfig.difficultyThreshold) / 6);
            numAI = Math.min(numAI, 4);
        } else {
            // 第20关后：从4只开始，地图每变大2档+1只
            const stages = Math.floor((level - GameConfig.mapGrowthStartLevel) / GameConfig.mapGrowthInterval);
            numAI = 4 + Math.floor(stages / 2);
            numAI = Math.min(numAI, 8);  // 上限8只老鼠
        }
    }

    // ===== 障碍物数量（有上限）=====
    let numObstacles = Math.floor((3 + level) * 1.5);  // 增加1.5倍
    numObstacles = Math.min(numObstacles, GameConfig.maxObstacles);

    // 生成固定障碍物（墙壁）
    for (let i = 0; i < Math.floor(numObstacles * 0.7); i++) {
        let obs;
        let attempts = 0;
        do {
            obs = {
                x: 100 + Math.random() * (width - 200),
                y: 100 + Math.random() * (height - 200),
                width: 40 + Math.random() * 60,
                height: 40 + Math.random() * 60,
                type: 'wall',
                color: '#DDA0DD'
            };
            attempts++;
        } while (checkOverlap(obs) && attempts < 20);

        if (attempts < 20) {
            GameState.obstacles.push(obs);
        }
    }

    // 生成移动障碍物（门）
    for (let i = 0; i < Math.floor(numObstacles * 0.3); i++) {
        let obs;
        let attempts = 0;
        do {
            obs = {
                x: 100 + Math.random() * (width - 300),
                y: 100 + Math.random() * (height - 300),
                width: 30,
                height: 60,
                type: 'moving',
                color: '#FFB6C1',
                direction: Math.random() > 0.5 ? 'horizontal' : 'vertical',
                speed: 1 + level * 0.15,
                range: 80,
                startX: 0,
                startY: 0
            };
            obs.startX = obs.x;
            obs.startY = obs.y;
            attempts++;
        } while (checkOverlap(obs) && attempts < 20);

        if (attempts < 20) {
            GameState.obstacles.push(obs);
        }
    }

    // 生成宝箱（数量与AI数量相关）
    const numChests = Math.max(numAI + 1, 2 + Math.floor(level / 3));
    for (let i = 0; i < numChests; i++) {
        let chest;
        let attempts = 0;
        do {
            chest = {
                x: 80 + Math.random() * (width - 160),
                y: 80 + Math.random() * (height - 160),
                size: 35,
                isOpen: false,
                item: null
            };
            attempts++;
        } while (checkChestOverlap(chest) && attempts < 30);

        if (attempts < 30) {
            if (GameState.selectedRole === 'mouse') {
                // 玩家是老鼠：降低钥匙概率，增加无道具概率
                if (i === 0) {
                    // 第一个宝箱必定有钥匙（确保游戏可进行）
                    chest.item = 'key';
                } else if (i < numAI) {
                    // 其他前numAI个宝箱：有效道具概率下降1/3，约33%无道具
                    const rand = Math.random();
                    if (rand < 0.33) {
                        chest.item = 'key';
                    } else if (rand < 0.67) {
                        // 其他有效道具
                        const items = ['slow', 'freeze', 'trap'];
                        chest.item = items[Math.floor(Math.random() * items.length)];
                    } else {
                        chest.item = 'nothing';  // 无道具
                    }
                } else {
                    // 其他宝箱：有效道具概率下降1/3，约33%无道具
                    const rand = Math.random();
                    if (rand < 0.083) {
                        chest.item = 'key';        // 8.3%
                    } else if (rand < 0.277) {
                        chest.item = 'slow';       // 19.4%
                    } else if (rand < 0.471) {
                        chest.item = 'freeze';     // 19.4%
                    } else if (rand < 0.665) {
                        chest.item = 'trap';       // 19.4%
                    } else {
                        chest.item = 'nothing';    // 33.5% 无道具
                    }
                }
            } else {
                // 玩家是猫：分配老鼠道具和钥匙
                if (i < numAI) {
                    // 确保有足够的钥匙让AI老鼠能开门
                    chest.item = 'key';
                } else {
                    // 其他宝箱按权重分配老鼠可用道具（降低冰冻概率）
                    chest.item = getWeightedRandomItem();
                }
            }
            GameState.chests.push(chest);
        }
    }

    // 逃生门
    let doorX, doorY;
    let doorPosition;  // 记录门的位置类型

    if (level >= GameConfig.mapGrowthStartLevel) {
        // 第20关及以后，逃生门随机位置
        const rand = Math.random();
        if (rand < 0.5) {
            // 50% 右侧
            doorPosition = 'right';
            doorX = width - 60;
            doorY = 100 + Math.random() * (height - 200);  // 避免太靠边
        } else if (rand < 0.75) {
            // 25% 上侧
            doorPosition = 'top';
            doorX = 100 + Math.random() * (width - 200);
            doorY = 50;  // 门中心位置，绘制范围 y-30 到 y+30
        } else {
            // 25% 下侧
            doorPosition = 'bottom';
            doorX = 100 + Math.random() * (width - 200);
            doorY = height - 50;  // 门中心位置，绘制范围 height-80 到 height-20
        }
    } else {
        // 第20关之前，固定在右侧中间
        doorPosition = 'right';
        doorX = width - 60;
        doorY = height / 2;
    }

    GameState.door = {
        x: doorX,
        y: doorY,
        width: 40,
        height: 60,
        isLocked: true,
        color: GameConfig.colors.gold,
        position: doorPosition  // 记录位置类型
    };

    // ===== 创建角色 =====
    const playerStart = { x: 60, y: height / 2 };

    if (GameState.selectedRole === 'mouse') {
        // 玩家是老鼠，创建多个AI猫
        GameState.player = new Character(playerStart.x, playerStart.y, 'mouse', true);

        for (let i = 0; i < numAI; i++) {
            // 猫从逃生门一侧（右侧）出现，上下位置随机
            const aiStart = findCatPositionNearDoor(width, height, i, numAI);
            const cat = new Character(aiStart.x, aiStart.y, 'cat', false);
            // 当敌人数量>1时，速度与玩家一致；否则随关卡提升
            if (numAI > 1) {
                cat.speed = GameConfig.playerSpeed;
            } else {
                cat.speed = GameConfig.aiBaseSpeed + (level - 1) * GameConfig.aiSpeedIncrease;
            }
            cat.baseSpeed = cat.speed;
            cat.lastPosition = { x: aiStart.x, y: aiStart.y };
            cat.stuckCount = 0;
            cat.isStuck = false;
            GameState.aiEntities.push(cat);
        }
    } else {
        // 玩家是猫，创建多个AI老鼠
        GameState.player = new Character(playerStart.x, playerStart.y, 'cat', true);
        // 开局3秒无敌
        GameState.player.applyEffect('invincible', GameConfig.itemDuration.invincible);

        for (let i = 0; i < numAI; i++) {
            const aiStart = findValidAIPosition(width, height, 'mouse', i, numAI);
            const mouse = new Character(aiStart.x, aiStart.y, 'mouse', false);
            // 当敌人数量>1时，速度与玩家一致；否则随关卡提升
            if (numAI > 1) {
                mouse.speed = GameConfig.playerSpeed;
            } else {
                mouse.speed = GameConfig.aiBaseSpeed + (level - 1) * GameConfig.aiSpeedIncrease;
            }
            mouse.baseSpeed = mouse.speed;
            mouse.hasKey = false;
            mouse.escaped = false;
            mouse.lastPosition = { x: aiStart.x, y: aiStart.y };
            mouse.stuckCount = 0;
            mouse.isStuck = false;
            GameState.aiEntities.push(mouse);
        }

        // 当老鼠数量>=4时，自动召唤一只小猫辅助
        if (numAI >= 4) {
            const kitten = {
                x: GameState.player.x,
                y: GameState.player.y + 60,
                speed: GameConfig.playerSpeed * 0.8,
                size: 25,
                active: true,
                createdAt: Date.now(),
                duration: Infinity,  // 永久存在
                stuckCount: 0,
                lastPosition: null
            };
            GameState.kittens.push(kitten);
        }
    }

    // 更新道具栏显示
    updateItemBar();

    // 更新关卡和AI数量显示
    document.getElementById('level-num').textContent = GameState.currentLevel;
    updateAICountDisplay(numAI);

    // 显示AI数量提示
    showAICountHint(numAI);
}

// 为猫在逃生门附近找到有效位置
function findCatPositionNearDoor(width, height, index, total) {
    let position;
    let attempts = 0;

    while (attempts < 50) {
        // 在逃生门一侧（右侧），上下位置随机分布
        position = {
            x: width - 100 - Math.random() * 80,
            y: 60 + (index + 1) * (height - 120) / (total + 1) + (Math.random() - 0.5) * 60
        };

        // 确保在边界内
        position.y = Math.max(60, Math.min(height - 60, position.y));

        // 检查是否与宝箱重叠
        let valid = true;
        for (const chest of GameState.chests) {
            const dist = Math.sqrt(
                Math.pow(position.x - chest.x, 2) +
                Math.pow(position.y - chest.y, 2)
            );
            if (dist < 50) {
                valid = false;
                break;
            }
        }

        // 检查是否与障碍物重叠
        if (valid) {
            for (const obs of GameState.obstacles) {
                if (position.x > obs.x - 40 && position.x < obs.x + obs.width + 40 &&
                    position.y > obs.y - 40 && position.y < obs.y + obs.height + 40) {
                    valid = false;
                    break;
                }
            }
        }

        // 检查是否与其他AI重叠
        if (valid) {
            for (const ai of GameState.aiEntities) {
                const dist = Math.sqrt(
                    Math.pow(position.x - ai.x, 2) +
                    Math.pow(position.y - ai.y, 2)
                );
                if (dist < 60) {
                    valid = false;
                    break;
                }
            }
        }

        if (valid) return position;
        attempts++;
    }

    // 默认位置
    return { x: width - 120, y: height / 2 };
}

// 为AI寻找有效位置
function findValidAIPosition(width, height, type, index, total) {
    let position;
    let attempts = 0;

    while (attempts < 100) {
        if (type === 'cat') {
            // 猫在右侧区域
            position = {
                x: width - 150 + Math.random() * 80,
                y: 60 + (index + 1) * (height - 120) / (total + 1)
            };
        } else {
            // 老鼠在左侧区域
            position = {
                x: 80 + Math.random() * 180,
                y: 80 + Math.random() * (height - 160)
            };
        }

        // 检查是否与宝箱重叠
        let valid = true;
        for (const chest of GameState.chests) {
            const dist = Math.sqrt(
                Math.pow(position.x - chest.x, 2) +
                Math.pow(position.y - chest.y, 2)
            );
            if (dist < 50) {
                valid = false;
                break;
            }
        }

        // 检查是否与障碍物重叠
        if (valid) {
            for (const obs of GameState.obstacles) {
                if (position.x > obs.x - 40 && position.x < obs.x + obs.width + 40 &&
                    position.y > obs.y - 40 && position.y < obs.y + obs.height + 40) {
                    valid = false;
                    break;
                }
            }
        }

        // 检查是否与其他AI重叠
        if (valid) {
            for (const ai of GameState.aiEntities) {
                const dist = Math.sqrt(
                    Math.pow(position.x - ai.x, 2) +
                    Math.pow(position.y - ai.y, 2)
                );
                if (dist < 60) {
                    valid = false;
                    break;
                }
            }
        }

        if (valid) return position;
        attempts++;
    }

    // 默认位置
    return { x: 100 + index * 50, y: height / 2 };
}

// 显示AI数量提示
function showAICountHint(count) {
    if (count > 1) {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(139, 0, 139, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 20px;
            font-size: 20px;
            font-family: 'Comic Sans MS', cursive;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out forwards;
        `;

        if (GameState.selectedRole === 'mouse') {
            hint.textContent = `⚠️ ${count}只猫在追你！`;
        } else {
            hint.textContent = `🐭 ${count}只老鼠要逃跑！`;
        }

        document.body.appendChild(hint);
        setTimeout(() => hint.remove(), 2000);
    }
}

// 更新AI数量显示
function updateAICountDisplay(count) {
    const aiCountEl = document.getElementById('ai-count');
    if (!aiCountEl) return;

    if (count > 1) {
        if (GameState.selectedRole === 'mouse') {
            aiCountEl.textContent = `| 🐱×${count}`;
        } else {
            // 显示剩余老鼠数量
            const remaining = GameState.aiEntities.filter(ai => !ai.caught && !ai.escaped).length;
            aiCountEl.textContent = `| 🐭×${remaining}`;
        }
    } else {
        aiCountEl.textContent = '';
    }
}

// 显示抓捕成功提示
function showCatchNotification() {
    const remaining = GameState.aiEntities.filter(ai => !ai.caught && !ai.escaped).length;
    const total = GameState.aiEntities.length;

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 165, 0, 0.9);
        color: white;
        padding: 12px 25px;
        border-radius: 15px;
        font-size: 18px;
        font-family: 'Comic Sans MS', cursive;
        z-index: 1000;
        animation: fadeInOut 1.5s ease-in-out forwards;
    `;

    notification.textContent = `🐱 抓到了！剩余 ${remaining}/${total}`;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
}

function checkOverlap(obs) {
    const margin = 80;
    const mapW = GameState.mapWidth || canvas.width;
    const mapH = GameState.mapHeight || canvas.height;

    // 检查与角色起点重叠
    if (obs.x < 100 + margin && obs.y > mapH/2 - margin && obs.y < mapH/2 + margin) {
        return true;
    }

    // 检查与门重叠
    if (obs.x > mapW - 100 - margin) {
        return true;
    }

    // 检查与其他障碍物重叠
    for (const other of GameState.obstacles) {
        if (obs.x < other.x + other.width + margin &&
            obs.x + obs.width > other.x - margin &&
            obs.y < other.y + other.height + margin &&
            obs.y + obs.height > other.y - margin) {
            return true;
        }
    }

    return false;
}

function checkChestOverlap(chest) {
    const margin = 60;

    // 检查与障碍物重叠
    for (const obs of GameState.obstacles) {
        if (chest.x > obs.x - margin && chest.x < obs.x + obs.width + margin &&
            chest.y > obs.y - margin && chest.y < obs.y + obs.height + margin) {
            return true;
        }
    }

    // 检查与其他宝箱重叠
    for (const other of GameState.chests) {
        const dist = Math.sqrt(Math.pow(chest.x - other.x, 2) + Math.pow(chest.y - other.y, 2));
        if (dist < margin) return true;
    }

    return false;
}

// ===== 绘制函数 =====
function drawBackground() {
    // 渐变背景（填充整个屏幕）
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, GameConfig.colors.pinkSoft);
    gradient.addColorStop(0.5, GameConfig.colors.purpleSoft);
    gradient.addColorStop(1, GameConfig.colors.purpleBright);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格纹理（根据摄像机偏移）
    ctx.strokeStyle = 'rgba(232, 208, 232, 0.3)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offsetX = -GameState.cameraX % gridSize;
    const offsetY = -GameState.cameraY % gridSize;

    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawObstacles() {
    for (const obs of GameState.obstacles) {
        // 计算屏幕坐标
        const screenX = obs.x - GameState.cameraX;
        const screenY = obs.y - GameState.cameraY;

        // 检查是否在屏幕范围内
        if (screenX + obs.width < -20 || screenX > canvas.width + 20 ||
            screenY + obs.height < -20 || screenY > canvas.height + 20) {
            continue;
        }

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(139, 0, 139, 0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = obs.color;
        ctx.strokeStyle = GameConfig.colors.purpleDeep;
        ctx.lineWidth = 2;

        // 绘制矩形
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, obs.width, obs.height, 8);
        ctx.fill();
        ctx.stroke();

        // 移动障碍物特殊效果
        if (obs.type === 'moving') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(screenX + 5, screenY + 5, obs.width - 10, obs.height - 10, 4);
            ctx.fill();
        }

        ctx.restore();
    }
}

function drawChests() {
    for (const chest of GameState.chests) {
        // 计算屏幕坐标
        const screenX = chest.x - GameState.cameraX;
        const screenY = chest.y - GameState.cameraY;

        // 检查是否在屏幕范围内
        if (screenX < -chest.size - 20 || screenX > canvas.width + chest.size + 20 ||
            screenY < -chest.size - 20 || screenY > canvas.height + chest.size + 20) {
            continue;
        }

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(139, 0, 139, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        if (chest.isOpen) {
            // 打开的宝箱
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - chest.size/2, screenY - chest.size/2 + 10, chest.size, chest.size/2);

            ctx.fillStyle = '#DAA520';
            ctx.fillRect(screenX - chest.size/2 + 3, screenY - chest.size/2 + 13, chest.size - 6, chest.size/2 - 6);
        } else {
            // 关闭的宝箱
            ctx.fillStyle = '#DAA520';
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;

            // 箱体
            ctx.fillRect(screenX - chest.size/2, screenY - chest.size/2, chest.size, chest.size);
            ctx.strokeRect(screenX - chest.size/2, screenY - chest.size/2, chest.size, chest.size);

            // 箱盖装饰
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(screenX, screenY - chest.size/2 + 5, 5, 0, Math.PI * 2);
            ctx.fill();

            // 锁孔
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function drawDoor() {
    if (!GameState.door) return;

    const door = GameState.door;

    // 计算屏幕坐标
    const screenX = door.x - GameState.cameraX;
    const screenY = door.y - GameState.cameraY;

    // 检查是否在屏幕范围内
    if (screenX + door.width < -20 || screenX > canvas.width + 20 ||
        screenY - door.height/2 < -20 || screenY + door.height/2 > canvas.height + 20) {
        return;
    }

    ctx.save();

    // 阴影
    ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
    ctx.shadowBlur = 15;

    // 门框
    ctx.fillStyle = door.isLocked ? '#888' : GameConfig.colors.gold;
    ctx.strokeStyle = GameConfig.colors.purpleDeep;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(screenX, screenY - door.height/2, door.width, door.height, 10);
    ctx.fill();
    ctx.stroke();

    // 门把手
    ctx.fillStyle = door.isLocked ? '#666' : GameConfig.colors.pinkBright;
    ctx.beginPath();
    ctx.arc(screenX + 10, screenY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 锁图标
    if (door.isLocked) {
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', screenX + door.width/2, screenY);
    } else {
        // 开门图标
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚪', screenX + door.width/2, screenY);
    }

    ctx.restore();
}

function drawCharacters() {
    if (GameState.player) GameState.player.draw();
    // 绘制所有AI实体
    for (const ai of GameState.aiEntities) {
        // 跳过被抓或已逃脱的老鼠（不可见）
        if (ai.caught || ai.escaped) continue;
        if (ai.visible !== false) ai.draw();
    }
}

// ===== 游戏逻辑 =====
function updateMovingObstacles() {
    for (const obs of GameState.obstacles) {
        if (obs.type !== 'moving') continue;

        // 更新位置
        if (obs.direction === 'horizontal') {
            obs.x += obs.speed;
            if (obs.x > obs.startX + obs.range || obs.x < obs.startX - obs.range) {
                obs.speed = -obs.speed;
            }
        } else {
            obs.y += obs.speed;
            if (obs.y > obs.startY + obs.range || obs.y < obs.startY - obs.range) {
                obs.speed = -obs.speed;
            }
        }

        // 检测与角色的碰撞
        const allCharacters = [GameState.player, ...GameState.aiEntities.filter(ai => !ai.caught && !ai.escaped)];
        for (const char of allCharacters) {
            if (!char || char.effects.dizzy || char.effects.invincible) continue;

            // 简单矩形与圆形碰撞检测
            const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.width));
            const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.height));
            const distance = Math.sqrt(Math.pow(char.x - closestX, 2) + Math.pow(char.y - closestY, 2));

            if (distance < char.size / 2) {
                // 碰撞！应用晕眩效果
                char.applyEffect('dizzy', 500);
            }
        }
    }
}

// 更新小猫
function updateKittens() {
    const now = Date.now();

    for (let i = GameState.kittens.length - 1; i >= 0; i--) {
        const kitten = GameState.kittens[i];

        // 检查是否过期（永久小猫不过期）
        if (kitten.duration !== Infinity && now - kitten.createdAt > kitten.duration) {
            GameState.kittens.splice(i, 1);
            continue;
        }

        // 检测是否卡住
        if (kitten.lastPosition) {
            const moved = Math.sqrt(
                Math.pow(kitten.x - kitten.lastPosition.x, 2) +
                Math.pow(kitten.y - kitten.lastPosition.y, 2)
            );
            if (moved < 0.5) {
                kitten.stuckCount = (kitten.stuckCount || 0) + 1;
            } else {
                kitten.stuckCount = 0;
            }
        }
        kitten.lastPosition = { x: kitten.x, y: kitten.y };

        // 寻找最近的老鼠
        let nearestMouse = null;
        let minDist = Infinity;

        for (const ai of GameState.aiEntities) {
            if (ai.caught || ai.escaped) continue;
            const dist = Math.sqrt(
                Math.pow(kitten.x - ai.x, 2) +
                Math.pow(kitten.y - ai.y, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestMouse = ai;
            }
        }

        // 追踪最近的老鼠
        if (nearestMouse && minDist > 25) {
            const dx = nearestMouse.x - kitten.x;
            const dy = nearestMouse.y - kitten.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let dirX = dx / dist;
            let dirY = dy / dist;

            const kittenSize = kitten.size || 25;

            // 障碍物检测和绕行
            const nextX = kitten.x + dirX * kitten.speed;
            const nextY = kitten.y + dirY * kitten.speed;

            if (checkKittenObstacleCollision(nextX, nextY, kittenSize)) {
                // 碰撞障碍物，尝试绕行
                const avoidDir = findKittenAvoidDirection(kitten, dirX, dirY);
                dirX = avoidDir.x;
                dirY = avoidDir.y;
            }

            // 移动小猫
            const finalX = kitten.x + dirX * kitten.speed;
            const finalY = kitten.y + dirY * kitten.speed;

            // 边界检查
            const mapW = GameState.mapWidth || canvas.width;
            const mapH = GameState.mapHeight || canvas.height;
            kitten.x = Math.max(kittenSize, Math.min(mapW - kittenSize, finalX));
            kitten.y = Math.max(kittenSize, Math.min(mapH - kittenSize, finalY));
        }

        // 小猫抓老鼠检测
        for (const ai of GameState.aiEntities) {
            if (ai.caught || ai.escaped) continue;
            const dist = Math.sqrt(
                Math.pow(kitten.x - ai.x, 2) +
                Math.pow(kitten.y - ai.y, 2)
            );
            if (dist < 25) {
                ai.caught = true;
                ai.visible = false;
                soundManager.playCaught();
                showCatchNotification();
                updateAICountDisplay(GameState.aiEntities.length);
            }
        }
    }
}

// 小猫障碍物碰撞检测
function checkKittenObstacleCollision(x, y, size) {
    for (const obs of GameState.obstacles) {
        if (!obs) continue;
        if (x + size/2 > obs.x && x - size/2 < obs.x + obs.width &&
            y + size/2 > obs.y && y - size/2 < obs.y + obs.height) {
            return true;
        }
    }
    return false;
}

// 小猫绕障碍物方向
function findKittenAvoidDirection(kitten, dirX, dirY) {
    const angles = [-Math.PI/4, Math.PI/4, -Math.PI/2, Math.PI/2, -Math.PI*3/4, Math.PI*3/4];
    const kittenSize = kitten.size || 25;

    for (const angleOffset of angles) {
        const angle = Math.atan2(dirY, dirX) + angleOffset;
        const testDir = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        const testX = kitten.x + testDir.x * kitten.speed * 5;
        const testY = kitten.y + testDir.y * kitten.speed * 5;

        if (!checkKittenObstacleCollision(testX, testY, kittenSize)) {
            return testDir;
        }
    }

    // 都不行，随机方向
    const randomAngle = Math.random() * Math.PI * 2;
    return { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };
}

function updateAI() {
    if (!GameState.aiEntities || GameState.aiEntities.length === 0 || !GameState.player) return;

    // 更新每个AI实体
    for (const ai of GameState.aiEntities) {
        // 跳过已逃脱、被抓或已失效的实体
        if (ai.escaped || ai.caught) continue;
        if (ai.effects.frozen || ai.effects.trapped) continue;

        // 检测是否卡住
        if (ai.lastPosition) {
            const moved = Math.sqrt(
                Math.pow(ai.x - ai.lastPosition.x, 2) +
                Math.pow(ai.y - ai.lastPosition.y, 2)
            );

            if (moved < 0.5) {
                ai.stuckCount++;
                if (ai.stuckCount > 15) {
                    ai.isStuck = true;
                }
            } else {
                ai.stuckCount = Math.max(0, ai.stuckCount - 1);
                ai.isStuck = false;
            }
        }
        ai.lastPosition = { x: ai.x, y: ai.y };

        // 计算与玩家的距离
        const dx = GameState.player.x - ai.x;
        const dy = GameState.player.y - ai.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        let dir = { x: 0, y: 0 };

        if (GameState.selectedRole === 'mouse') {
            // AI猫追逐玩家老鼠
            dir.x = dx / dist;
            dir.y = dy / dist;

            // 如果卡住，尝试绕行
            if (ai.isStuck) {
                const avoidDir = findAvoidDirection(ai, dir);
                dir.x = avoidDir.x;
                dir.y = avoidDir.y;
            }
        } else {
            // AI老鼠智能行为
            dir = calculateMouseAI(ai, dx, dy, dist);

            // 如果卡住，尝试绕行
            if (ai.isStuck) {
                const avoidDir = findAvoidDirection(ai, dir);
                dir.x = avoidDir.x;
                dir.y = avoidDir.y;
            }
        }

        // 归一化方向向量
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        if (len > 0) {
            dir.x /= len;
            dir.y /= len;
        }

        ai.move(dir);
    }
}

// 寻找绕开障碍物的方向
function findAvoidDirection(entity, currentDir) {
    // 尝试左转和右转，找到可以移动的方向
    const angles = [-Math.PI/4, Math.PI/4, -Math.PI/2, Math.PI/2, -Math.PI*3/4, Math.PI*3/4];

    for (const angleOffset of angles) {
        const angle = Math.atan2(currentDir.y, currentDir.x) + angleOffset;
        const testDir = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        // 测试这个方向是否可行
        const testX = entity.x + testDir.x * entity.speed * 5;
        const testY = entity.y + testDir.y * entity.speed * 5;

        if (!entity.checkObstacleCollision(testX, testY)) {
            return testDir;
        }
    }

    // 如果都不行，尝试随机方向
    const randomAngle = Math.random() * Math.PI * 2;
    return {
        x: Math.cos(randomAngle),
        y: Math.sin(randomAngle)
    };
}

// AI老鼠智能行为计算
function calculateMouseAI(aiMouse, dx, dy, distToCat) {
    const door = GameState.door;
    const chests = GameState.chests;

    let dir = { x: 0, y: 0 };
    let targetX, targetY;

    // 优先级1: 有钥匙时去开门
    if (aiMouse.hasKey) {
        targetX = door.x;
        targetY = door.y;

        const doorDx = targetX - aiMouse.x;
        const doorDy = targetY - aiMouse.y;
        const doorDist = Math.sqrt(doorDx*doorDx + doorDy*doorDy);

        if (doorDist > 5) {
            dir.x = doorDx / doorDist;
            dir.y = doorDy / doorDist;

            // 如果猫在附近，尝试绕开
            if (distToCat < 150) {
                const perpX = -dy / distToCat;
                const perpY = dx / distToCat;
                // 根据猫的位置决定绕开方向
                const cross = doorDx * dy - doorDy * dx;
                if (cross > 0) {
                    dir.x = dir.x * 0.4 + perpX * 0.6;
                    dir.y = dir.y * 0.4 + perpY * 0.6;
                } else {
                    dir.x = dir.x * 0.4 - perpX * 0.6;
                    dir.y = dir.y * 0.4 - perpY * 0.6;
                }
            }
            return dir;
        }
    }

    // 优先级2: 找最近的未开宝箱
    let nearestChest = null;
    let nearestChestDist = Infinity;

    for (const chest of chests) {
        if (chest.isOpen) continue;

        const chestDist = Math.sqrt(
            Math.pow(chest.x - aiMouse.x, 2) +
            Math.pow(chest.y - aiMouse.y, 2)
        );

        if (chestDist < nearestChestDist) {
            nearestChestDist = chestDist;
            nearestChest = chest;
        }
    }

    if (nearestChest) {
        targetX = nearestChest.x;
        targetY = nearestChest.y;

        const chestDx = targetX - aiMouse.x;
        const chestDy = targetY - aiMouse.y;

        if (nearestChestDist > 5) {
            dir.x = chestDx / nearestChestDist;
            dir.y = chestDy / nearestChestDist;

            // 如果猫太近，绕开猫
            if (distToCat < 120) {
                const perpX = -dy / distToCat;
                const perpY = dx / distToCat;
                // 选择离宝箱更近的绕开方向
                const testDir1 = { x: dir.x * 0.3 + perpX * 0.7, y: dir.y * 0.3 + perpY * 0.7 };
                const testDir2 = { x: dir.x * 0.3 - perpX * 0.7, y: dir.y * 0.3 - perpY * 0.7 };

                // 选择让AI更接近宝箱的方向
                const dist1 = Math.sqrt(
                    Math.pow((aiMouse.x + testDir1.x * 20) - targetX, 2) +
                    Math.pow((aiMouse.y + testDir1.y * 20) - targetY, 2)
                );
                const dist2 = Math.sqrt(
                    Math.pow((aiMouse.x + testDir2.x * 20) - targetX, 2) +
                    Math.pow((aiMouse.y + testDir2.y * 20) - targetY, 2)
                );

                if (dist1 < dist2) {
                    dir.x = testDir1.x;
                    dir.y = testDir1.y;
                } else {
                    dir.x = testDir2.x;
                    dir.y = testDir2.y;
                }
            }
            return dir;
        }
    }

    // 优先级3: 猫太近时逃跑
    if (distToCat < 180) {
        // 计算逃跑方向（远离猫）
        dir.x = -dx / distToCat;
        dir.y = -dy / distToCat;

        // 如果前方有障碍物，尝试斜向逃跑
        const testX = aiMouse.x + dir.x * 30;
        const testY = aiMouse.y + dir.y * 30;

        if (aiMouse.checkObstacleCollision(testX, testY)) {
            // 尝试左转或右转
            const perpX = -dir.y;
            const perpY = dir.x;

            // 测试两个垂直方向
            const leftX = aiMouse.x + perpX * 30;
            const leftY = aiMouse.y + perpY * 30;
            const rightX = aiMouse.x - perpX * 30;
            const rightY = aiMouse.y - perpY * 30;

            const leftBlocked = aiMouse.checkObstacleCollision(leftX, leftY);
            const rightBlocked = aiMouse.checkObstacleCollision(rightX, rightY);

            if (!leftBlocked && rightBlocked) {
                dir.x = perpX;
                dir.y = perpY;
            } else if (leftBlocked && !rightBlocked) {
                dir.x = -perpX;
                dir.y = -perpY;
            } else if (!leftBlocked && !rightBlocked) {
                // 两个方向都可以，选择离猫更远的
                if (Math.random() > 0.5) {
                    dir.x = perpX;
                    dir.y = perpY;
                } else {
                    dir.x = -perpX;
                    dir.y = -perpY;
                }
            }
        }
        return dir;
    }

    // 优先级4: 没事做时往门的方向移动（准备逃脱）
    const doorDx = door.x - aiMouse.x;
    const doorDy = door.y - aiMouse.y;
    const doorDist = Math.sqrt(doorDx*doorDx + doorDy*doorDy);
    dir.x = doorDx / doorDist;
    dir.y = doorDy / doorDist;

    return dir;
}

function checkCollisions() {
    if (!GameState.player || GameState.aiEntities.length === 0) return;

    // 检查猫抓老鼠
    for (const ai of GameState.aiEntities) {
        if (ai.escaped) continue;

        const dx = GameState.player.x - ai.x;
        const dy = GameState.player.y - ai.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < GameConfig.catchDistance) {
            if (GameState.selectedRole === 'mouse') {
                // 玩家老鼠被抓
                endGame(false, 'mouse_caught');
                return;
            } else {
                // 玩家猫抓住一只老鼠，标记这只老鼠被抓
                // 检查无敌状态（无敌期间不能抓老鼠）
                if (GameState.player.effects.invincible) {
                    continue;  // 无敌期间跳过抓捕
                }
                ai.caught = true;
                ai.visible = false;
                // 播放抓捕音效
                soundManager.playCaught();
                // 显示抓捕提示
                showCatchNotification();
                // 更新剩余老鼠数量显示
                updateAICountDisplay(GameState.aiEntities.length);
            }
        }
    }

    // 如果玩家是猫，检查胜负条件
    if (GameState.selectedRole === 'cat') {
        const totalMice = GameState.aiEntities.length;
        const caughtMice = GameState.aiEntities.filter(ai => ai.caught).length;
        const escapedMice = GameState.aiEntities.filter(ai => ai.escaped).length;
        const activeMice = totalMice - caughtMice - escapedMice;
        const catchRatio = caughtMice / totalMice;

        // 抓到超过50%老鼠即获胜（即使有老鼠逃脱也赢）
        if (catchRatio > 0.5) {
            GameState.caughtCount = caughtMice;
            GameState.totalMice = totalMice;
            endGame(true, 'cat_wins');
            return;
        }

        // 所有老鼠被抓也是获胜
        if (caughtMice === totalMice) {
            GameState.caughtCount = caughtMice;
            GameState.totalMice = totalMice;
            endGame(true, 'cat_wins');
            return;
        }

        // 检查是否还有可能抓到 > 50%
        const maxPossibleCaught = caughtMice + activeMice;
        if (escapedMice > 0 && maxPossibleCaught / totalMice <= 0.5) {
            // 无法再抓到超过50%，猫输
            endGame(false, 'mouse_escapes_as_cat');
            return;
        }
    }

    // 检查宝箱碰撞 - 玩家（老鼠或猫）都能开箱子
    for (const chest of GameState.chests) {
        if (chest.isOpen) continue;

        // 玩家开箱子检测
        const playerChestDist = Math.sqrt(
            Math.pow(GameState.player.x - chest.x, 2) +
            Math.pow(GameState.player.y - chest.y, 2)
        );

        if (playerChestDist < chest.size + GameState.player.size/2) {
            openChest(chest, GameState.player);
            continue;
        }

        // AI老鼠开箱子检测（仅当玩家是猫时）
        if (GameState.selectedRole === 'cat') {
            for (const ai of GameState.aiEntities) {
                if (ai.caught || ai.escaped) continue;

                const chestDist = Math.sqrt(
                    Math.pow(ai.x - chest.x, 2) +
                    Math.pow(ai.y - chest.y, 2)
                );

                if (chestDist < chest.size + ai.size/2) {
                    openChest(chest, ai);
                    break;
                }
            }
        }
    }

    // 检查门碰撞
    if (GameState.door) {
        // 玩家是老鼠时，检测玩家是否到门
        if (GameState.selectedRole === 'mouse') {
            const doorDist = Math.sqrt(
                Math.pow(GameState.player.x - GameState.door.x, 2) +
                Math.pow(GameState.player.y - GameState.door.y, 2)
            );

            if (doorDist < GameState.door.width + GameState.player.size/2) {
                if (GameState.hasKey) {
                    endGame(true, 'mouse_escapes');
                    return;
                } else if (!GameState.door.isLocked) {
                    endGame(true, 'mouse_escapes');
                    return;
                }
            }
        } else {
            // 玩家是猫时，检测所有AI老鼠是否到门
            for (const ai of GameState.aiEntities) {
                if (ai.caught || ai.escaped) continue;

                const aiDoorDist = Math.sqrt(
                    Math.pow(ai.x - GameState.door.x, 2) +
                    Math.pow(ai.y - GameState.door.y, 2)
                );

                if (aiDoorDist < GameState.door.width + ai.size/2) {
                    if (ai.hasKey || !GameState.door.isLocked) {
                        // 这只老鼠逃脱了
                        ai.escaped = true;
                        GameState.escapedCount++;

                        // 检查当前状态
                        const totalMice = GameState.aiEntities.length;
                        const caughtMice = GameState.aiEntities.filter(a => a.caught).length;
                        const escapedMice = GameState.aiEntities.filter(a => a.escaped).length;
                        const activeMice = totalMice - caughtMice - escapedMice;

                        // 如果已抓到 > 50%，猫赢
                        if (caughtMice / totalMice > 0.5) {
                            GameState.caughtCount = caughtMice;
                            GameState.totalMice = totalMice;
                            endGame(true, 'cat_wins');
                            return;
                        }

                        // 计算是否还能达到 > 50%：已抓到的 + 剩余活跃的老鼠
                        const maxPossibleCaught = caughtMice + activeMice;
                        if (maxPossibleCaught / totalMice <= 0.5) {
                            // 无法再抓到超过50%，猫输
                            endGame(false, 'mouse_escapes_as_cat');
                            return;
                        }
                        // 否则继续游戏
                    }
                }
            }
        }
    }

    // 检查警告距离 - 设置角色警告状态（玩家是老鼠时）
    if (GameState.selectedRole === 'mouse') {
        let minDist = Infinity;
        for (const ai of GameState.aiEntities) {
            const dx = GameState.player.x - ai.x;
            const dy = GameState.player.y - ai.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            minDist = Math.min(minDist, dist);
        }

        if (minDist < GameConfig.warningDistance) {
            soundManager.changeBGMType('chase');
            GameState.player.effects.warning = true;
        } else if (minDist > GameConfig.warningDistance + 50) {
            soundManager.changeBGMType('normal');
            GameState.player.effects.warning = false;
        }
    }
}

function openChest(chest, entity) {
    if (chest.isOpen) return;

    chest.isOpen = true;
    soundManager.playChestOpen();
    soundManager.playItemPickup();

    const item = chest.item;
    const isPlayer = (entity === GameState.player);
    const isCatPlayer = (GameState.selectedRole === 'cat' && isPlayer);

    if (item === 'key') {
        if (GameState.selectedRole === 'mouse') {
            // 老鼠玩家获得钥匙
            if (isPlayer) {
                GameState.hasKey = true;
            } else {
                entity.hasKey = true;
            }
            GameState.door.isLocked = false;
        } else {
            // 玩家是猫
            if (isPlayer) {
                // 猫玩家开到钥匙转为随机猫道具
                const catItemTypes = ['speedBoost', 'fakeChest', 'summonKitten'];
                const randomCatItem = catItemTypes[Math.floor(Math.random() * catItemTypes.length)];
                const slotIndex = findEmptyCatSlot();
                if (slotIndex !== -1) {
                    GameState.catItems[slotIndex] = randomCatItem;
                }
            } else {
                // AI老鼠获得钥匙
                entity.hasKey = true;
                GameState.door.isLocked = false;
            }
        }
        updateItemBar();
    } else if (item === 'slow' || item === 'freeze' || item === 'trap') {
        if (GameState.selectedRole === 'mouse') {
            if (isPlayer) {
                const slotIndex = findEmptySlot();
                if (slotIndex !== -1) {
                    GameState.items[slotIndex] = item;
                    updateItemBar();
                }
            } else {
                // AI老鼠对玩家猫使用道具
                if (item === 'slow') {
                    GameState.player.applyEffect('slowed', GameConfig.itemDuration.slow);
                } else if (item === 'freeze') {
                    GameState.player.applyEffect('frozen', GameConfig.itemDuration.freeze);
                } else if (item === 'trap') {
                    GameState.player.applyEffect('trapped', GameConfig.itemDuration.trap);
                }
            }
        } else {
            // 玩家是猫
            if (isPlayer) {
                // 猫玩家开到老鼠道具转为猫道具
                const catItemTypes = ['speedBoost', 'fakeChest', 'summonKitten'];
                const randomCatItem = catItemTypes[Math.floor(Math.random() * catItemTypes.length)];
                const slotIndex = findEmptyCatSlot();
                if (slotIndex !== -1) {
                    GameState.catItems[slotIndex] = randomCatItem;
                    updateItemBar();
                }
            } else {
                // AI老鼠获得道具，对玩家猫使用
                if (item === 'slow') {
                    GameState.player.applyEffect('slowed', GameConfig.itemDuration.slow);
                } else if (item === 'freeze') {
                    // 玩家猫被冰冻只有1秒
                    GameState.player.applyEffect('frozen', GameConfig.itemDuration.freezeAsCat);
                } else if (item === 'trap') {
                    // 玩家猫被陷阱限制移动只有1秒
                    GameState.player.applyEffect('trapped', GameConfig.itemDuration.trapAsCat);
                }
            }
        }
    }
    // 'nothing' 什么都不做
}

function findEmptySlot() {
    // 道具栏槽位：0, 1, 2, 3（钥匙使用单独标记）
    // 道具放在 1, 2, 3 槽位（0是钥匙位置）
    for (let i = 1; i < 4; i++) {
        if (GameState.items[i] === null) {
            return i;
        }
    }
    return -1; // 没有空槽位
}

function findEmptyCatSlot() {
    for (let i = 1; i < 4; i++) {
        if (GameState.catItems[i] === null) {
            return i;
        }
    }
    return -1;
}


function updateItemBar() {
    const icons = {
        slow: '⏱️', freeze: '❄️', trap: '🪤', key: '🔑',
        speedBoost: '⚡', fakeChest: '📦', summonKitten: '🐱'
    };

    // 检查是否有人持有钥匙
    let anyoneHasKey = GameState.hasKey;
    if (!anyoneHasKey && GameState.aiEntities) {
        anyoneHasKey = GameState.aiEntities.some(ai => ai.hasKey);
    }

    // 根据角色选择道具数组
    const items = GameState.selectedRole === 'mouse' ? GameState.items : GameState.catItems;

    // 更新PC端道具栏
    const pcSlots = document.querySelectorAll('.item-bar .slot-icon');
    pcSlots.forEach((slot, i) => {
        const parent = slot.parentElement;
        parent.classList.remove('has-item');

        if (i === 0) {
            // 槽位0是钥匙（仅老鼠显示）
            if (GameState.selectedRole === 'mouse' && anyoneHasKey) {
                slot.textContent = icons.key;
                parent.classList.add('has-item');
            } else {
                slot.textContent = '';
            }
        } else {
            // 槽位1-3是道具
            if (items[i]) {
                slot.textContent = icons[items[i]] || '';
                parent.classList.add('has-item');
            } else {
                slot.textContent = '';
            }
        }
    });

    // 更新移动端道具按钮
    const mobileBtns = document.querySelectorAll('.item-btn');
    mobileBtns.forEach((btn, i) => {
        const iconEl = btn.querySelector('.item-icon');
        btn.classList.remove('has-item');

        if (i === 0) {
            if (GameState.selectedRole === 'mouse' && anyoneHasKey) {
                iconEl.textContent = icons.key;
                btn.classList.add('has-item');
            } else {
                iconEl.textContent = '';
            }
        } else {
            if (items[i]) {
                iconEl.textContent = icons[items[i]] || '';
                btn.classList.add('has-item');
            } else {
                iconEl.textContent = '';
            }
        }
    });
}

function showWarningEffect() {
    // 已废弃 - 警告效果现在通过角色边框显示
    // 保留函数以防其他引用
}

// ===== 道具触摸处理（移动端） =====
function handleItemTouch(event, index) {
    event.preventDefault();
    event.stopPropagation();

    // 添加视觉反馈
    const btn = event.currentTarget;
    btn.classList.add('touched');
    setTimeout(() => {
        btn.classList.remove('touched');
    }, 150);

    // 调用道具使用
    useItem(index);
}

// ===== 道具使用 =====
function useItem(index) {
    console.log('useItem called:', index);

    if (GameState.isPaused) {
        console.log('Game is paused');
        return;
    }
    if (!GameState.player) {
        console.log('No player');
        return;
    }

    // 槽位0（按键1）是钥匙位，不作为道具使用
    if (index === 0) {
        console.log('Key slot, auto-use only');
        return;
    }

    const items = GameState.selectedRole === 'mouse' ? GameState.items : GameState.catItems;
    const item = items[index];
    console.log('Item at slot', index, ':', item);

    if (!item) {
        // 没有道具，显示提示
        showItemHint(index, '空');
        return;
    }

    soundManager.init();
    soundManager.playItemUse();

    if (GameState.selectedRole === 'mouse') {
        // 老鼠道具逻辑
        if (item === 'slow') {
            for (const ai of GameState.aiEntities) {
                ai.applyEffect('slowed', GameConfig.itemDuration.slow);
            }
            GameState.items[index] = null;
            showItemHint(index, '⏱️ 减速！');
        } else if (item === 'freeze') {
            for (const ai of GameState.aiEntities) {
                ai.applyEffect('frozen', GameConfig.itemDuration.freeze);
            }
            GameState.items[index] = null;
            showItemHint(index, '❄️ 冰冻！');
        } else if (item === 'trap') {
            placeTrap();
            GameState.items[index] = null;
            showItemHint(index, '🪤 陷阱！');
        }
    } else {
        // 猫道具逻辑
        if (item === 'speedBoost') {
            GameState.player.applyEffect('speedBoost', GameConfig.catItems.speedBoost.duration);
            GameState.catItems[index] = null;
            showItemHint(index, '⚡ 加速！');
        } else if (item === 'fakeChest') {
            placeFakeChest();
            GameState.catItems[index] = null;
            showItemHint(index, '📦 陷阱！');
        } else if (item === 'summonKitten') {
            summonKitten();
            GameState.catItems[index] = null;
            showItemHint(index, '🐱 小猫！');
        }
    }

    updateItemBar();
}

// 显示道具使用提示
function showItemHint(index, text) {
    // 在移动端按钮上显示提示
    const btns = document.querySelectorAll('.item-btn');
    if (btns[index]) {
        const btn = btns[index];
        btn.querySelector('.item-icon').textContent = text === '空' ? '❌' : '✓';

        setTimeout(() => {
            updateItemBar();
        }, 500);
    }
}

function placeTrap() {
    if (!GameState.player) return;

    // 创建持久陷阱
    const trap = {
        x: GameState.player.x,
        y: GameState.player.y,
        radius: 45,
        active: true,
        duration: GameConfig.itemDuration.trap,
        createdAt: Date.now()
    };

    GameState.traps.push(trap);
}

// 放置假宝箱陷阱
function placeFakeChest() {
    const fakeChest = {
        x: GameState.player.x,
        y: GameState.player.y,
        size: 35,
        active: true,
        createdAt: Date.now()
    };
    GameState.fakeChests.push(fakeChest);
}

// 召唤小猫
function summonKitten() {
    const angle = Math.random() * Math.PI * 2;
    const kitten = {
        x: GameState.player.x + Math.cos(angle) * 60,
        y: GameState.player.y + Math.sin(angle) * 60,
        speed: GameConfig.playerSpeed * 0.8,
        size: 25,
        active: true,
        createdAt: Date.now(),
        duration: GameConfig.catItems.summonKitten.duration,
        stuckCount: 0,
        lastPosition: null
    };
    GameState.kittens.push(kitten);
}

// 检查陷阱碰撞
function checkTraps() {
    const now = Date.now();

    for (const trap of GameState.traps) {
        if (!trap.active) continue;

        // 检查陷阱是否过期
        if (now - trap.createdAt > trap.duration) {
            trap.active = false;
            continue;
        }

        // 检查所有AI实体是否踩到陷阱
        for (const ai of GameState.aiEntities) {
            // 跳过已失效的实体
            if (ai.caught || ai.escaped) continue;
            // 如果已经被困住，跳过
            if (ai.effects.trapped) continue;

            const dist = Math.sqrt(
                Math.pow(ai.x - trap.x, 2) +
                Math.pow(ai.y - trap.y, 2)
            );

            if (dist < trap.radius) {
                ai.applyEffect('trapped', trap.duration - (now - trap.createdAt));
                trap.active = false;  // 陷阱触发后失效
            }
        }
    }

    // 清理失效的陷阱
    GameState.traps = GameState.traps.filter(t => t.active);
}

// 绘制陷阱
function drawTraps() {
    for (const trap of GameState.traps) {
        if (!trap.active) continue;

        // 计算屏幕坐标
        const screenX = trap.x - GameState.cameraX;
        const screenY = trap.y - GameState.cameraY;

        // 检查是否在屏幕范围内
        if (screenX < -trap.radius - 20 || screenX > canvas.width + trap.radius + 20 ||
            screenY < -trap.radius - 20 || screenY > canvas.height + trap.radius + 20) {
            continue;
        }

        ctx.save();

        // 陷阱底座
        ctx.fillStyle = 'rgba(194, 32, 83, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, trap.radius, 0, Math.PI * 2);
        ctx.fill();

        // 陷阱边框
        ctx.strokeStyle = '#C2185B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, trap.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 陷阱图标
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪤', screenX, screenY);

        ctx.restore();
    }
}

// 绘制假宝箱
function drawFakeChests() {
    for (const fakeChest of GameState.fakeChests) {
        if (!fakeChest.active) continue;

        const screenX = fakeChest.x - GameState.cameraX;
        const screenY = fakeChest.y - GameState.cameraY;

        // 检查是否在屏幕范围内
        if (screenX < -50 || screenX > canvas.width + 50 ||
            screenY < -50 || screenY > canvas.height + 50) {
            continue;
        }

        ctx.save();

        // 绘制假宝箱（外观与真宝箱相似）
        ctx.fillStyle = '#DAA520';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // 箱体
        ctx.fillRect(screenX - fakeChest.size/2, screenY - fakeChest.size/2,
                     fakeChest.size, fakeChest.size);
        ctx.strokeRect(screenX - fakeChest.size/2, screenY - fakeChest.size/2,
                       fakeChest.size, fakeChest.size);

        // 锁孔
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 绘制小猫
function drawKittens() {
    for (const kitten of GameState.kittens) {
        if (!kitten.active) continue;

        const screenX = kitten.x - GameState.cameraX;
        const screenY = kitten.y - GameState.cameraY;

        // 检查是否在屏幕范围内
        if (screenX < -50 || screenX > canvas.width + 50 ||
            screenY < -50 || screenY > canvas.height + 50) {
            continue;
        }

        ctx.save();

        // 绘制小猫（比普通猫小）
        const bounce = Math.sin(Date.now() / 150) * 2;

        // 身体
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 8 + bounce, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.beginPath();
        ctx.arc(screenX, screenY - 5 + bounce, 10, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY - 12 + bounce);
        ctx.lineTo(screenX - 5, screenY - 22 + bounce);
        ctx.lineTo(screenX - 2, screenY - 12 + bounce);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY - 12 + bounce);
        ctx.lineTo(screenX + 5, screenY - 22 + bounce);
        ctx.lineTo(screenX + 2, screenY - 12 + bounce);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 6 + bounce, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 6 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();

        // 尾巴
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX + 12, screenY + 10 + bounce);
        ctx.quadraticCurveTo(screenX + 20, screenY + bounce, screenX + 18, screenY + 15 + bounce);
        ctx.stroke();

        ctx.restore();
    }
}

// ===== 摄像机系统 =====
function updateCamera() {
    if (!GameState.player) return;

    const screenX = GameState.player.x - GameState.cameraX;
    const screenY = GameState.player.y - GameState.cameraY;
    const viewWidth = canvas.width;
    const viewHeight = canvas.height;
    const threshold = GameConfig.cameraEdgeThreshold;

    // X轴摄像机移动
    if (screenX < viewWidth * threshold) {
        GameState.cameraX = GameState.player.x - viewWidth * threshold;
    } else if (screenX > viewWidth * (1 - threshold)) {
        GameState.cameraX = GameState.player.x - viewWidth * (1 - threshold);
    }

    // Y轴摄像机移动
    if (screenY < viewHeight * threshold) {
        GameState.cameraY = GameState.player.y - viewHeight * threshold;
    } else if (screenY > viewHeight * (1 - threshold)) {
        GameState.cameraY = GameState.player.y - viewHeight * (1 - threshold);
    }

    // 边界限制（不让摄像机超出地图）
    const maxCameraX = Math.max(0, GameState.mapWidth - viewWidth);
    const maxCameraY = Math.max(0, GameState.mapHeight - viewHeight);
    GameState.cameraX = Math.max(0, Math.min(maxCameraX, GameState.cameraX));
    GameState.cameraY = Math.max(0, Math.min(maxCameraY, GameState.cameraY));
}

// ===== 游戏循环 =====
function gameLoop(timestamp) {
    if (GameState.isPaused || GameState.gameResult) {
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    drawBackground();

    // 更新移动障碍物
    updateMovingObstacles();

    // 绘制障碍物
    drawObstacles();

    // 绘制宝箱
    drawChests();

    // 绘制陷阱
    drawTraps();

    // 绘制假宝箱
    drawFakeChests();

    // 绘制门
    drawDoor();

    // 处理玩家输入
    handleInput();

    // 更新摄像机
    updateCamera();

    // 更新AI
    updateAI();

    // 更新小猫
    updateKittens();

    // 检查陷阱碰撞
    checkTraps();

    // 绘制角色
    drawCharacters();

    // 绘制小猫
    drawKittens();

    // 检查碰撞
    checkCollisions();

    // 继续循环
    gameLoopId = requestAnimationFrame(gameLoop);
}

function handleInput() {
    if (!GameState.player) return;

    let dir = { x: 0, y: 0 };

    // 键盘输入
    if (GameState.keys.w) dir.y = -1;
    if (GameState.keys.s) dir.y = 1;
    if (GameState.keys.a) dir.x = -1;
    if (GameState.keys.d) dir.x = 1;

    // 摇杆输入
    if (GameState.joystickActive) {
        dir.x = GameState.joystickDir.x;
        dir.y = GameState.joystickDir.y;
    }

    // 移动玩家
    if (dir.x !== 0 || dir.y !== 0) {
        GameState.player.move(dir);
    }
}

// ===== 游戏结束 =====
function endGame(playerWins, result) {
    GameState.gameResult = result;
    cancelAnimationFrame(gameLoopId);
    soundManager.stopBGM();

    if (playerWins) {
        soundManager.playEscape();
        soundManager.startBGM('win');
    } else {
        soundManager.playCaught();
        soundManager.startBGM('lose');
    }

    // 更新记录
    if (playerWins && GameState.selectedRole === 'mouse') {
        GameState.lastRecord = GameState.currentLevel;
        if (GameState.currentLevel > GameState.bestRecord) {
            GameState.bestRecord = GameState.currentLevel;
        }
        // 保存到 localStorage
        localStorage.setItem('catMouseGame_bestRecord', GameState.bestRecord);
        localStorage.setItem('catMouseGame_lastRecord', GameState.lastRecord);
    }

    // 显示结束画面
    showEndScreen(playerWins, result);
}

function showEndScreen(playerWins, result) {
    const endScreen = document.getElementById('end-screen');
    const endEmoji = document.getElementById('end-emoji');
    const endTitle = document.getElementById('end-title');
    const endMessage = document.getElementById('end-message');
    const primaryBtn = document.getElementById('end-primary-btn');

    // 设置内容
    const contents = {
        mouse_escapes: {
            emoji: '🎉 🐭 😊 🎉',
            title: '恭喜！成功逃脱！',
            message: '老鼠开心庆祝，成功过关！'
        },
        mouse_caught: {
            emoji: '😭 🐭 💔',
            title: '哎呀！被抓住了！',
            message: '老鼠被猫抓住了，再试一次！'
        },
        cat_wins: {
            emoji: '😼 🐱 ✨ 🎉',
            title: '抓到了！喵喵得意！',
            message: `抓获 ${GameState.caughtCount}/${GameState.totalMice} 只老鼠！`
        },
        mouse_escapes_as_cat: {
            emoji: '😿 🐱 💔',
            title: '可惜！老鼠跑了！',
            message: '猫垂头丧气，老鼠逃跑了！'
        }
    };

    const content = contents[result];
    endEmoji.textContent = content.emoji;
    endTitle.textContent = content.title;
    endMessage.textContent = content.message;

    // 设置按钮
    if (playerWins) {
        primaryBtn.textContent = '下一关 ▶';
        primaryBtn.onclick = nextLevel;
    } else {
        primaryBtn.textContent = '再试一次 🔄';
        primaryBtn.onclick = retryLevel;
    }

    // 切换屏幕
    switchScreen('end');
}

// ===== 屏幕切换 =====
function switchScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    GameState.currentScreen = screenName;
}

// ===== UI 交互函数 =====
function selectRole(role) {
    soundManager.init();
    soundManager.playClick();

    GameState.selectedRole = role;

    // 更新卡片样式
    const cards = document.querySelectorAll('.role-card');
    cards.forEach(card => {
        card.classList.remove('selected', 'mouse-selected', 'cat-selected');
    });

    const selectedCard = document.querySelector(`.role-card[data-role="${role}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected', `${role}-selected`);
    }

    // 启用开始按钮
    const startBtn = document.getElementById('start-btn');
    startBtn.classList.remove('disabled');
}

function startGame() {
    if (!GameState.selectedRole) return;

    soundManager.playClick();

    // 切换到游戏画面
    switchScreen('game');

    // 初始化Canvas
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // 设置Canvas大小
    resizeCanvas();

    // 生成关卡
    generateLevel(GameState.currentLevel);

    // 更新关卡显示
    document.getElementById('level-num').textContent = GameState.currentLevel;

    // 重置游戏状态
    GameState.isPaused = false;
    GameState.gameResult = null;

    // 开始游戏循环
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);

    // 开始BGM
    soundManager.startBGM('normal');
}

function resizeCanvas() {
    // 使用窗口实际尺寸，确保全屏
    // 移动端优先使用 visualViewport 获取准确可视区域
    if (window.visualViewport) {
        canvas.width = window.visualViewport.width;
        canvas.height = window.visualViewport.height;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // 如果在游戏中，需要重新生成关卡以适应新尺寸
    if (GameState.currentScreen === 'game' && GameState.player) {
        // 更新门的位置
        if (GameState.door) {
            const mapW = GameState.mapWidth || canvas.width;
            const mapH = GameState.mapHeight || canvas.height;
            // 门在地图右侧
            GameState.door.x = mapW - 60;
            GameState.door.y = mapH / 2;
        }
    }
}

function showHelp() {
    soundManager.init();
    soundManager.playClick();
    document.getElementById('help-modal').classList.add('active');
}

function closeHelp() {
    soundManager.playClick();
    document.getElementById('help-modal').classList.remove('active');
}

function exitGame() {
    soundManager.playClick();
    soundManager.stopBGM();

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }

    switchScreen('home');
    GameState.currentLevel = 1;
}

function togglePause() {
    GameState.isPaused = !GameState.isPaused;
    const pauseBtn = document.getElementById('pause-btn');

    if (GameState.isPaused) {
        pauseBtn.textContent = '▶️ 继续';
        soundManager.stopBGM();
    } else {
        pauseBtn.textContent = '⏸️ 暂停';
        soundManager.startBGM('normal');
        lastTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

function nextLevel() {
    soundManager.playClick();
    soundManager.stopBGM();

    GameState.currentLevel++;
    GameState.gameResult = null;

    switchScreen('game');
    generateLevel(GameState.currentLevel);

    document.getElementById('level-num').textContent = GameState.currentLevel;

    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
    soundManager.startBGM('normal');
}

function retryLevel() {
    soundManager.playClick();
    soundManager.stopBGM();

    GameState.gameResult = null;

    switchScreen('game');
    generateLevel(GameState.currentLevel);

    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
    soundManager.startBGM('normal');
}

function backToHome() {
    soundManager.playClick();
    soundManager.stopBGM();

    switchScreen('home');
    GameState.currentLevel = 1;

    // 更新记录显示
    document.getElementById('best-record').textContent = `${GameState.bestRecord}关`;
    document.getElementById('last-record').textContent = `${GameState.lastRecord}关`;
}

// ===== 键盘控制 =====
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        GameState.keys[key] = true;
    }

    // 数字键使用道具
    if (e.key >= '1' && e.key <= '4') {
        useItem(parseInt(e.key) - 1);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        GameState.keys[key] = false;
    }
});

// ===== 虚拟摇杆（移动端） =====
function initJoystick() {
    const joystickArea = document.getElementById('joystick-area');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');

    if (!joystickArea || !joystickBase || !joystickKnob) return;

    let isDragging = false;
    let baseRect = null;
    let maxRadius = 50;

    // 获取摇杆基座的当前位置
    const updateBaseRect = () => {
        baseRect = joystickBase.getBoundingClientRect();
        maxRadius = baseRect.width / 2 - 30;
    };

    // 处理触摸开始
    const handleTouchStart = (e) => {
        e.preventDefault();
        isDragging = true;
        GameState.joystickActive = true;
        updateBaseRect();
    };

    // 处理触摸移动
    const handleTouchMove = (e) => {
        if (!isDragging || !baseRect) return;
        e.preventDefault();

        const touch = e.touches[0];
        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, maxRadius);

        const angle = Math.atan2(dy, dx);
        const x = clampedDist * Math.cos(angle);
        const y = clampedDist * Math.sin(angle);

        joystickKnob.style.transform = `translate(${x}px, ${y}px)`;

        GameState.joystickDir.x = x / maxRadius;
        GameState.joystickDir.y = y / maxRadius;
    };

    // 处理触摸结束
    const handleTouchEnd = (e) => {
        isDragging = false;
        GameState.joystickActive = false;
        joystickKnob.style.transform = 'translate(0px, 0px)';
        GameState.joystickDir = { x: 0, y: 0 };
    };

    // 在整个摇杆区域监听触摸事件
    joystickArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    joystickArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // 同时在旋钮上监听（作为备用）
    joystickKnob.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickKnob.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickKnob.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// ===== 窗口大小调整 =====
window.addEventListener('resize', () => {
    if (canvas && GameState.currentScreen === 'game') {
        resizeCanvas();
    }
    // 重新初始化摇杆（位置可能改变）
    initJoystick();
    updateFullscreenButton();
});

// 屏幕方向改变
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (canvas && GameState.currentScreen === 'game') {
            resizeCanvas();
        }
        initJoystick();
        updateFullscreenButton();
    }, 100);
});

// ===== 全屏功能 =====
function toggleFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    const isCurrentlyFullscreen = btn && btn.getAttribute('data-active') === 'true';

    if (!isCurrentlyFullscreen) {
        // 进入全屏模式 - 使用Safari兼容的方式
        // 1. 滚动到顶部，隐藏Safari地址栏
        window.scrollTo(0, 1);

        // 2. 设置body标记，应用全屏样式
        document.body.classList.add('ios-fullscreen');

        // 3. 尝试使用标准API（部分浏览器支持）
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
                // Safari 不支持，回退到CSS方案
            });
        }

        // 4. 标记按钮状态
        if (btn) {
            btn.setAttribute('data-active', 'true');
            btn.textContent = '✕';
        }
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        document.body.classList.remove('ios-fullscreen');
        if (btn) {
            btn.setAttribute('data-active', 'false');
            btn.textContent = '⛶';
        }
    }
}

function updateFullscreenButton() {
    const btn = document.getElementById('fullscreen-btn');
    if (!btn) return;

    // 移动端横屏时显示全屏按钮
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isMobile = ('ontouchstart' in window);

    if (isMobile && isLandscape) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

// 监听全屏状态变化
// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    initJoystick();

    // 更新记录显示
    document.getElementById('best-record').textContent = `${GameState.bestRecord}关`;
    document.getElementById('last-record').textContent = `${GameState.lastRecord}关`;

    // 初始化全屏按钮
    updateFullscreenButton();
});

// iOS Safari: 页面加载后滚动隐藏地址栏
window.addEventListener('load', () => {
    setTimeout(() => {
        window.scrollTo(0, 1);
    }, 100);
});

// 检测触摸设备
function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}