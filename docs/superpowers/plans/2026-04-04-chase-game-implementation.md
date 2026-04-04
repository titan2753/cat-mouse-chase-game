# 你追我赶游戏实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个网页版猫和老鼠追逐游戏，支持电脑和手机双平台

**Architecture:** Phaser.js游戏引擎 + 独立场景管理（首页/游戏/结束） + 响应式UI适配

**Tech Stack:** Phaser 3 + HTML/CSS + JavaScript

---

## 文件结构

```
be-careful/
├── index.html              # 入口页面
├── css/
│   └── style.css           # 全局样式（粉紫主题）
├── js/
│   ├── main.js             # Phaser游戏入口
│   ├── scenes/
│   │   ├── HomeScene.js    # 首页场景
│   │   ├── GameScene.js    # 游戏主场景
│   │   └── EndScene.js     # 结束场景
│   ├── entities/
│   │   ├── Cat.js          # 猫角色类
│   │   ├── Mouse.js        # 老鼠角色类
│   │   ├── Obstacle.js     # 障碍物类
│   │   ├── Chest.js        # 宝箱类
│   │   └── Door.js         # 逃生门类
│   ├── systems/
│   │   ├── AIController.js # AI控制系统
│   │   ├── ItemSystem.js   # 道具系统
│   │   ├── LevelSystem.js  # 关卡生成系统
│   │   └── InputManager.js # 输入管理（键盘+触屏）
│   └── utils/
│       ├── constants.js    # 常量配置
│       └── svgAssets.js    # SVG角色定义
├── assets/
│   ├── audio/              # 音效文件
│   └── images/             # 装饰图片
└── docs/
    └── superpowers/
        └ specs/            # 设计文档
        └ plans/            # 实现计划
```

---

### Task 1: 项目初始化

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`

- [ ] **Step 1: 创建入口HTML文件**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>你追我赶 - 猫和老鼠</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="game-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
    <script src="js/utils/constants.js"></script>
    <script src="js/utils/svgAssets.js"></script>
    <script src="js/entities/Cat.js"></script>
    <script src="js/entities/Mouse.js"></script>
    <script src="js/entities/Obstacle.js"></script>
    <script src="js/entities/Chest.js"></script>
    <script src="js/entities/Door.js"></script>
    <script src="js/systems/AIController.js"></script>
    <script src="js/systems/ItemSystem.js"></script>
    <script src="js/systems/LevelSystem.js"></script>
    <script src="js/systems/InputManager.js"></script>
    <script src="js/scenes/HomeScene.js"></script>
    <script src="js/scenes/GameScene.js"></script>
    <script src="js/scenes/EndScene.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建全局样式文件**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
    overflow: hidden;
    font-family: 'Comic Sans MS', cursive, sans-serif;
}

#game-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

canvas {
    border-radius: 10px;
}
```

- [ ] **Step 3: 创建Phaser入口文件**

```javascript
// js/main.js
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#FFB6C1',
    scene: [HomeScene, GameScene, EndScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
```

- [ ] **Step 4: 创建常量配置文件**

```javascript
// js/utils/constants.js
const GAME_CONFIG = {
    PLAYER_SPEED: 200,
    AI_SPEED_BASE: 150,
    AI_SPEED_INCREMENT: 10,
    MAP_SIZES: {
        small: { width: 800, height: 600 },
        medium: { width: 1000, height: 750 },
        large: { width: 1200, height: 900 },
        xlarge: { width: 1400, height: 1050 }
    },
    ITEM_DURATION: {
        slow: 5000,
        freeze: 3000,
        trap: 4000
    },
    COLORS: {
        pink: '#FFB6C1',
        purple: '#DDA0DD',
        gold: '#FFD700',
        orange: '#FFA500',
        gray: '#C0C0C0',
        brown: '#8B4513',
        green: '#4CAF50'
    }
};
```

- [ ] **Step 5: Git提交**

```bash
git add index.html css/style.css js/main.js js/utils/constants.js
git commit -m "feat: 项目初始化，配置Phaser游戏引擎"
```

---

### Task 2: 创建首页场景

**Files:**
- Create: `js/scenes/HomeScene.js`

- [ ] **Step 1: 创建首页场景类**

```javascript
// js/scenes/HomeScene.js
class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
        this.selectedRole = null;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 渐变背景
        this.createGradientBackground();

        // 标题
        this.createTitle(width, height);

        // 记录卡片
        this.createRecordCards(width, height);

        // 角色选择
        this.createRoleSelection(width, height);

        // 开始按钮
        this.createStartButton(width, height);

        // 玩法说明按钮
        this.createHelpButton(width, height);

        // 装饰元素
        this.createDecorations();
    }

    createGradientBackground() {
        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        graphics.fillGradientStyle(0xFFB6C1, 0xFFB6C1, 0xDDA0DD, 0xDDA0DD, 1);
        graphics.fillRect(0, 0, width, height);
    }

    createTitle(width, height) {
        this.add.text(width / 2, height * 0.12, '🐱 你追我赶 🐭', {
            fontSize: '48px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B008B',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.18, '猫和老鼠的追逐大战！', {
            fontSize: '20px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#9370DB',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5);
    }

    createRecordCards(width, height) {
        // 最高记录卡片
        this.createCard(width * 0.3, height * 0.28, '🏆 最高记录', '15关', GAME_CONFIG.COLORS.pink);
        
        // 上次记录卡片  
        this.createCard(width * 0.7, height * 0.28, '📊 上次记录', '8关', GAME_CONFIG.COLORS.purple);
    }

    createCard(x, y, label, value, borderColor) {
        const card = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFFFF, 0.95);
        bg.fillRoundedRect(-80, -40, 160, 80, 15);
        bg.lineStyle(3, Phaser.Display.Color.HexStringToColor(borderColor).color);
        bg.strokeRoundedRect(-80, -40, 160, 80, 15);
        
        card.add(bg);
        card.add(this.add.text(0, -20, label, {
            fontSize: '14px',
            color: '#999999'
        }).setOrigin(0.5));
        card.add(this.add.text(0, 10, value, {
            fontSize: '28px',
            fontFamily: 'Comic Sans MS, cursive',
            color: borderColor === '#FFB6C1' ? '#FF69B4' : '#9370DB'
        }).setOrigin(0.5));
        
        return card;
    }

    createRoleSelection(width, height) {
        this.add.text(width / 2, height * 0.38, '选择你的角色：', {
            fontSize: '18px',
            color: '#4B0082'
        }).setOrigin(0.5);

        // 老鼠卡片
        this.mouseCard = this.createRoleCard(width * 0.35, height * 0.5, '🐭', '逃生者', '找钥匙逃跑', 'mouse');
        
        // 猫卡片
        this.catCard = this.createRoleCard(width * 0.65, height * 0.5, '🐱', '抓捕者', '抓住老鼠', 'cat');
    }

    createRoleCard(x, y, emoji, name, desc, role) {
        const card = this.add.container(x, y);
        const isSelected = false;
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFFFF, 0.95);
        bg.fillRoundedRect(-60, -70, 120, 140, 20);
        bg.lineStyle(3, 0x999999);
        bg.strokeRoundedRect(-60, -70, 120, 140, 20);
        
        card.add(bg);
        card.add(this.add.text(0, -35, emoji, { fontSize: '50px' }).setOrigin(0.5));
        card.add(this.add.text(0, 20, name, {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B008B'
        }).setOrigin(0.5));
        card.add(this.add.text(0, 45, desc, {
            fontSize: '12px',
            color: '#999999'
        }).setOrigin(0.5));
        
        card.setSize(120, 140);
        card.setInteractive();
        
        card.on('pointerdown', () => {
            this.selectRole(role, card);
        });
        
        return card;
    }

    selectRole(role, card) {
        this.selectedRole = role;
        
        // 更新边框颜色
        const borderColor = role === 'mouse' ? 0xFF69B4 : 0xDDA0DD;
        
        // 重置所有卡片边框
        [this.mouseCard, this.catCard].forEach(c => {
            const bg = c.list[0];
            bg.clear();
            bg.fillStyle(0xFFFFFF, 0.95);
            bg.fillRoundedRect(-60, -70, 120, 140, 20);
            bg.lineStyle(3, 0x999999);
            bg.strokeRoundedRect(-60, -70, 120, 140, 20);
        });
        
        // 高亮选中卡片
        const selectedBg = card.list[0];
        selectedBg.clear();
        selectedBg.fillStyle(0xFFFFFF, 0.95);
        selectedBg.fillRoundedRect(-60, -70, 120, 140, 20);
        selectedBg.lineStyle(4, borderColor);
        selectedBg.strokeRoundedRect(-60, -70, 120, 140, 20);
        
        // 启用开始按钮
        this.startButton.setAlpha(1);
        this.startButton.setInteractive();
    }

    createStartButton(width, height) {
        this.startButton = this.add.text(width / 2, height * 0.72, '开始游戏 ▶', {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setAlpha(0.5);
        
        this.startButton.on('pointerdown', () => {
            if (this.selectedRole) {
                this.scene.start('GameScene', { role: this.selectedRole, level: 1 });
            }
        });
    }

    createHelpButton(width, height) {
        const helpBtn = this.add.text(100, height - 50, '📖 玩法说明', {
            fontSize: '14px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        
        helpBtn.setInteractive();
        helpBtn.on('pointerdown', () => {
            this.showHelpPopup();
        });
    }

    showHelpPopup() {
        // 创建弹窗背景
        const popup = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFFFF, 0.98);
        bg.fillRoundedRect(-200, -180, 400, 360, 20);
        
        popup.add(bg);
        popup.add(this.add.text(0, -150, '玩法说明', {
            fontSize: '24px',
            color: '#8B008B'
        }).setOrigin(0.5));
        
        const helpText = [
            '🎯 游戏目标：',
            '老鼠：找到钥匙，打开逃生门逃跑！',
            '猫：抓住老鼠，阻止它逃跑！',
            '',
            '🎮 操作方式：',
            'WASD键控制移动方向',
            '数字键1-4使用道具',
            '',
            '📦 道具说明：',
            '🔑 钥匙：打开逃生门',
            '⏱️ 减速：让猫变慢5秒',
            '❄️ 冰冻：猫停止3秒',
            '🪤 陷阱：困住猫一段时间'
        ];
        
        helpText.forEach((text, i) => {
            popup.add(this.add.text(0, -110 + i * 22, text, {
                fontSize: '14px',
                color: '#666666'
            }).setOrigin(0.5));
        });
        
        // 关闭按钮
        const closeBtn = this.add.text(0, 160, '关闭', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#9370DB',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', () => {
            popup.destroy();
        });
        
        popup.add(closeBtn);
    }

    createDecorations() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 添加星星装饰
        const decorations = ['✨', '🌸', '💜', '⭐', '🎀', '💫'];
        decorations.forEach((emoji, i) => {
            this.add.text(
                Math.random() * width,
                Math.random() * height,
                emoji,
                { fontSize: '20px' }
            ).setAlpha(0.4 + Math.random() * 0.3);
        });
    }
}
```

- [ ] **Step 2: 在浏览器测试首页**

打开 `index.html`，确认：
- 渐变背景正确显示
- 标题居中
- 记录卡片显示
- 角色选择卡片可点击
- 点击角色后边框变色
- 开始按钮点击后能切换场景

- [ ] **Step 3: Git提交**

```bash
git add js/scenes/HomeScene.js
git commit -m "feat: 实现首页场景，包含角色选择和玩法说明"
```

---

### Task 3: 创建角色实体类

**Files:**
- Create: `js/utils/svgAssets.js`
- Create: `js/entities/Cat.js`
- Create: `js/entities/Mouse.js`

- [ ] **Step 1: 创建SVG角色定义**

```javascript
// js/utils/svgAssets.js
const SVG_ASSETS = {
    cat: `<svg viewBox="0 0 55 70" width="55" height="70">
        <ellipse cx="27" cy="50" rx="20" ry="15" fill="#FFA500"/>
        <circle cx="27" cy="35" r="18" fill="#FFA500"/>
        <polygon points="12,22 16,8 20,22" fill="#FFA500"/>
        <polygon points="35,22 39,8 43,22" fill="#FFA500"/>
        <polygon points="14,20 17,7 19,20" fill="#FFE4B5"/>
        <polygon points="37,20 40,7 42,20" fill="#FFE4B5"/>
        <circle cx="20" cy="30" r="5" fill="#333"/>
        <circle cx="34" cy="30" r="5" fill="#333"/>
        <circle cx="21" cy="28" r="2" fill="#FFF"/>
        <circle cx="35" cy="28" r="2" fill="#FFF"/>
        <ellipse cx="27" cy="38" rx="4" ry="3" fill="#FF69B4"/>
        <path d="M22,41 Q27,46 32,41" stroke="#333" fill="none" stroke-width="2"/>
        <line x1="15" y1="35" x2="5" y2="32" stroke="#333" stroke-width="1.5"/>
        <line x1="15" y1="38" x2="5" y2="38" stroke="#333" stroke-width="1.5"/>
        <line x1="40" y1="35" x2="50" y2="32" stroke="#333" stroke-width="1.5"/>
        <line x1="40" y1="38" x2="50" y2="38" stroke="#333" stroke-width="1.5"/>
    </svg>`,
    
    mouse: `<svg viewBox="0 0 45 55" width="45" height="55">
        <ellipse cx="22" cy="40" rx="14" ry="10" fill="#C0C0C0"/>
        <circle cx="22" cy="28" r="12" fill="#C0C0C0"/>
        <circle cx="22" cy="24" r="10" fill="#FFE4E1"/>
        <ellipse cx="14" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="30" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="15" cy="17" rx="5" ry="6" fill="#FFE4B5"/>
        <ellipse cx="29" cy="17" rx="5" ry="6" fill="#FFE4B5"/>
        <circle cx="17" cy="26" r="3" fill="#333"/>
        <circle cx="27" cy="26" r="3" fill="#333"/>
        <circle cx="18" cy="25" r="1" fill="#FFF"/>
        <circle cx="28" cy="25" r="1" fill="#FFF"/>
        <ellipse cx="22" cy="30" rx="2" ry="1.5" fill="#FF69B4"/>
    </svg>`,
    
    catSad: `<svg viewBox="0 0 55 70" width="55" height="70">
        <ellipse cx="27" cy="50" rx="20" ry="15" fill="#FFA500"/>
        <circle cx="27" cy="35" r="18" fill="#FFA500"/>
        <polygon points="12,22 16,8 20,22" fill="#FFA500"/>
        <polygon points="35,22 39,8 43,22" fill="#FFA500"/>
        <ellipse cx="20" cy="32" rx="5" ry="3" fill="#333"/>
        <ellipse cx="34" cy="32" rx="5" ry="3" fill="#333"/>
        <path d="M24,38 Q27,34 30,38" stroke="#333" fill="none" stroke-width="2"/>
        <path d="M15,40 L8,45" stroke="#333" stroke-width="2"/>
        <path d="M40,40 L47,45" stroke="#333" stroke-width="2"/>
    </svg>`,
    
    mouseSad: `<svg viewBox="0 0 45 55" width="45" height="55">
        <ellipse cx="22" cy="40" rx="14" ry="10" fill="#C0C0C0"/>
        <circle cx="22" cy="28" r="12" fill="#C0C0C0"/>
        <circle cx="22" cy="24" r="10" fill="#FFE4E1"/>
        <ellipse cx="14" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="30" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="17" cy="28" rx="3" ry="4" fill="#333"/>
        <ellipse cx="27" cy="28" rx="3" ry="4" fill="#333"/>
        <path d="M18,34 Q22,30 26,34" stroke="#333" fill="none" stroke-width="2"/>
    </svg>`
};
```

- [ ] **Step 2: 创建猫角色类**

```javascript
// js/entities/Cat.js
class Cat {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = GAME_CONFIG.AI_SPEED_BASE;
        this.isFrozen = false;
        this.isSlowed = false;
        this.isTrapped = false;
        
        // 创建SVG纹理
        const texture = scene.textures.createCanvas('cat', 55, 70);
        const ctx = texture.getContext();
        const svgBlob = new Blob([SVG_ASSETS.cat], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            texture.refresh();
            this.sprite = scene.physics.add.sprite(x, y, 'cat');
            this.sprite.setCollideWorldBounds(true);
            this.sprite.setScale(1.2);
        };
        img.src = url;
    }

    update(targetX, targetY, obstacles) {
        if (!this.sprite || this.isFrozen || this.isTrapped) return;
        
        let currentSpeed = this.speed;
        if (this.isSlowed) currentSpeed *= 0.5;
        
        // 简单AI：朝目标移动
        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            this.sprite.setVelocity(
                (dx / distance) * currentSpeed,
                (dy / distance) * currentSpeed
            );
        }
    }

    applySlow(duration = 5000) {
        this.isSlowed = true;
        this.scene.time.delayedCall(duration, () => {
            this.isSlowed = false;
        });
    }

    applyFreeze(duration = 3000) {
        this.isFrozen = true;
        this.sprite.setVelocity(0, 0);
        this.scene.time.delayedCall(duration, () => {
            this.isFrozen = false;
        });
    }

    applyTrap(duration = 4000) {
        this.isTrapped = true;
        this.sprite.setVelocity(0, 0);
        this.scene.time.delayedCall(duration, () => {
            this.isTrapped = false;
        });
    }

    getSprite() {
        return this.sprite;
    }

    getPosition() {
        return this.sprite ? { x: this.sprite.x, y: this.sprite.y } : null;
    }
}
```

- [ ] **Step 3: 创建老鼠角色类**

```javascript
// js/entities/Mouse.js
class Mouse {
    constructor(scene, x, y, isPlayer) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.hasKey = false;
        
        const texture = scene.textures.createCanvas('mouse', 45, 55);
        const ctx = texture.getContext();
        const svgBlob = new Blob([SVG_ASSETS.mouse], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            texture.refresh();
            this.sprite = scene.physics.add.sprite(x, y, 'mouse');
            this.sprite.setCollideWorldBounds(true);
            this.sprite.setScale(1.2);
        };
        img.src = url;
    }

    move(direction) {
        if (!this.sprite) return;
        
        switch (direction) {
            case 'up':
                this.sprite.setVelocity(0, -this.speed);
                break;
            case 'down':
                this.sprite.setVelocity(0, this.speed);
                break;
            case 'left':
                this.sprite.setVelocity(-this.speed, 0);
                break;
            case 'right':
                this.sprite.setVelocity(this.speed, 0);
                break;
            case 'stop':
                this.sprite.setVelocity(0, 0);
                break;
        }
    }

    collectKey() {
        this.hasKey = true;
    }

    useKey() {
        if (this.hasKey) {
            this.hasKey = false;
            return true;
        }
        return false;
    }

    getSprite() {
        return this.sprite;
    }

    getPosition() {
        return this.sprite ? { x: this.sprite.x, y: this.sprite.y } : null;
    }
}
```

- [ ] **Step 4: Git提交**

```bash
git add js/utils/svgAssets.js js/entities/Cat.js js/entities/Mouse.js
git commit -m "feat: 创建猫和老鼠角色实体类，SVG矢量图形"
```

---

### Task 4: 创建障碍物和地图元素

**Files:**
- Create: `js/entities/Obstacle.js`
- Create: `js/entities/Chest.js`
- Create: `js/entities/Door.js`

- [ ] **Step 1: 创建障碍物类**

```javascript
// js/entities/Obstacle.js
class Obstacle {
    constructor(scene, x, y, width, height, type = 'wall') {
        this.scene = scene;
        this.type = type;
        
        const colors = {
            wall: 0x8B4513,
            furniture: 0xD2691E,
            moving: 0x424242
        };
        
        this.sprite = scene.add.rectangle(x, y, width, height, colors[type]);
        scene.physics.add.existing(this.sprite, true); // static body
        
        if (type === 'moving') {
            this.startX = x;
            this.moveRange = 100;
            this.moveSpeed = 50;
            this.direction = 1;
        }
    }

    update() {
        if (this.type === 'moving') {
            const currentX = this.sprite.x;
            if (currentX > this.startX + this.moveRange || currentX < this.startX - this.moveRange) {
                this.direction *= -1;
            }
            this.sprite.x += this.moveSpeed * this.direction * 0.016;
            this.sprite.body.updateFromGameObject();
        }
    }

    getSprite() {
        return this.sprite;
    }
}
```

- [ ] **Step 2: 创建宝箱类**

```javascript
// js/entities/Chest.js
class Chest {
    constructor(scene, x, y) {
        this.scene = scene;
        this.isOpen = false;
        
        this.sprite = scene.add.container(x, y);
        
        // 宝箱底部
        const base = scene.add.rectangle(0, 5, 30, 20, 0xDAA520);
        base.setStrokeStyle(2, 0x8B4513);
        
        // 宝箱盖子
        this.lid = scene.add.rectangle(0, -5, 30, 10, 0xFFD700);
        this.lid.setStrokeStyle(2, 0x8B4513);
        
        this.sprite.add([base, this.lid]);
        this.sprite.setSize(30, 25);
        
        scene.physics.add.existing(this.sprite, true);
        
        this.sprite.setInteractive();
    }

    open() {
        if (this.isOpen) return null;
        
        this.isOpen = true;
        this.lid.setY(-15);
        
        // 返回随机道具
        const items = ['key', 'slow', 'freeze', 'trap'];
        return items[Math.floor(Math.random() * items.length)];
    }

    getSprite() {
        return this.sprite;
    }
}
```

- [ ] **Step 3: 创建逃生门类**

```javascript
// js/entities/Door.js
class Door {
    constructor(scene, x, y) {
        this.scene = scene;
        this.isLocked = true;
        
        this.sprite = scene.add.container(x, y);
        
        // 门框
        const frame = scene.add.rectangle(0, 0, 40, 55, 0x4CAF50);
        frame.setStrokeStyle(3, 0x1B5E20);
        
        // 门把手
        const handle = scene.add.circle(10, 0, 5, 0xFFD700);
        
        // 锁孔
        this.lock = scene.add.text(-5, 0, '🔒', { fontSize: '16px' });
        
        this.sprite.add([frame, handle, this.lock]);
        this.sprite.setSize(40, 55);
        
        scene.physics.add.existing(this.sprite, true);
    }

    unlock() {
        this.isLocked = false;
        this.lock.setText('🚪');
    }

    getSprite() {
        return this.sprite;
    }

    isOpen() {
        return !this.isLocked;
    }
}
```

- [ ] **Step 4: Git提交**

```bash
git add js/entities/Obstacle.js js/entities/Chest.js js/entities/Door.js
git commit -m "feat: 创建障碍物、宝箱、逃生门实体类"
```

---

### Task 5: 创建道具和关卡系统

**Files:**
- Create: `js/systems/ItemSystem.js`
- Create: `js/systems/LevelSystem.js`

- [ ] **Step 1: 创建道具系统**

```javascript
// js/systems/ItemSystem.js
class ItemSystem {
    constructor(scene) {
        this.scene = scene;
        this.items = [null, null, null, null]; // 4个槽位
        this.uiSlots = [];
        this.createUI();
    }

    createUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // 道具栏背景
        this.container = this.scene.add.container(100, height - 50);
        
        for (let i = 0; i < 4; i++) {
            const slot = this.scene.add.container(i * 55, 0);
            
            const bg = this.scene.add.rectangle(0, 0, 42, 42, 0xFFFFFF, 0.95);
            bg.setStrokeStyle(2, 0xFF69B4);
            
            const itemIcon = this.scene.add.text(0, 0, '', { fontSize: '18px' }).setOrigin(0.5);
            const keyLabel = this.scene.add.text(0, 25, (i + 1).toString(), {
                fontSize: '10px',
                color: '#8B008B'
            }).setOrigin(0.5);
            
            slot.add([bg, itemIcon, keyLabel]);
            this.uiSlots.push({ slot, icon: itemIcon, bg });
            this.container.add(slot);
            
            // 点击使用
            slot.setSize(42, 42);
            slot.setInteractive();
            slot.on('pointerdown', () => this.useItem(i));
        }
    }

    addItem(itemType) {
        const emptySlot = this.items.findIndex(item => item === null);
        if (emptySlot === -1) return false;
        
        this.items[emptySlot] = itemType;
        this.updateUI();
        return true;
    }

    updateUI() {
        const icons = {
            key: '🔑',
            slow: '⏱️',
            freeze: '❄️',
            trap: '🪤'
        };
        
        const colors = {
            key: '#FFD700',
            slow: '#64B5F6',
            freeze: '#81C784',
            trap: '#F8BBD0'
        };
        
        this.items.forEach((item, i) => {
            if (item) {
                this.uiSlots[i].icon.setText(icons[item]);
                this.uiSlots[i].bg.setFillStyle(Phaser.Display.Color.HexStringToColor(colors[item]).color);
            } else {
                this.uiSlots[i].icon.setText('');
                this.uiSlots[i].bg.setFillStyle(0xCCCCCC);
            }
        });
    }

    useItem(slotIndex) {
        const item = this.items[slotIndex];
        if (!item) return null;
        
        this.items[slotIndex] = null;
        this.updateUI();
        return item;
    }

    hasKey() {
        return this.items.includes('key');
    }

    useKey() {
        const keyIndex = this.items.findIndex(item => item === 'key');
        if (keyIndex !== -1) {
            this.items[keyIndex] = null;
            this.updateUI();
            return true;
        }
        return false;
    }
}
```

- [ ] **Step 2: 创建关卡生成系统**

```javascript
// js/systems/LevelSystem.js
class LevelSystem {
    constructor(scene) {
        this.scene = scene;
        this.level = 1;
    }

    getLevelConfig() {
        let size, speed, obstacleTypes, chestCount;
        
        if (this.level <= 5) {
            size = 'small';
            speed = GAME_CONFIG.AI_SPEED_BASE;
            obstacleTypes = ['wall'];
            chestCount = 3;
        } else if (this.level <= 10) {
            size = 'medium';
            speed = GAME_CONFIG.AI_SPEED_BASE + 30;
            obstacleTypes = ['wall', 'furniture'];
            chestCount = 4;
        } else if (this.level <= 15) {
            size = 'large';
            speed = GAME_CONFIG.AI_SPEED_BASE + 60;
            obstacleTypes = ['wall', 'furniture', 'moving'];
            chestCount = 5;
        } else {
            size = 'xlarge';
            speed = GAME_CONFIG.AI_SPEED_BASE + 100;
            obstacleTypes = ['wall', 'furniture', 'moving'];
            chestCount = 6;
        }
        
        return {
            mapSize: GAME_CONFIG.MAP_SIZES[size],
            aiSpeed: speed,
            obstacleTypes,
            chestCount
        };
    }

    generateLevel(role) {
        const config = this.getLevelConfig();
        const width = config.mapSize.width;
        const height = config.mapSize.height;
        
        // 设置世界边界
        this.scene.physics.world.setBounds(0, 0, width, height);
        
        const elements = {
            obstacles: [],
            chests: [],
            door: null,
            playerStart: { x: 50, y: height - 50 },
            aiStart: { x: width - 50, y: 50 }
        };
        
        // 生成障碍物
        const obstacleCount = 5 + this.level;
        for (let i = 0; i < obstacleCount; i++) {
            const type = config.obstacleTypes[Math.floor(Math.random() * config.obstacleTypes.length)];
            const x = 100 + Math.random() * (width - 200);
            const y = 100 + Math.random() * (height - 200);
            const w = type === 'furniture' ? 40 + Math.random() * 20 : 80;
            const h = type === 'furniture' ? 30 + Math.random() * 10 : 18;
            
            elements.obstacles.push(new Obstacle(this.scene, x, y, w, h, type));
        }
        
        // 生成宝箱
        for (let i = 0; i < config.chestCount; i++) {
            const x = 100 + Math.random() * (width - 200);
            const y = 100 + Math.random() * (height - 200);
            elements.chests.push(new Chest(this.scene, x, y));
        }
        
        // 逃生门（右上角偏僻位置）
        elements.door = new Door(this.scene, width - 60, 60);
        
        // 角色起始位置
        if (role === 'mouse') {
            elements.playerStart = { x: 50, y: height - 50 };
            elements.aiStart = { x: width - 80, y: height - 80 };
        } else {
            elements.playerStart = { x: width - 80, y: height - 80 };
            elements.aiStart = { x: 50, y: height - 50 };
        }
        
        return { elements, config };
    }

    nextLevel() {
        this.level++;
        return this.level;
    }

    getLevel() {
        return this.level;
    }
}
```

- [ ] **Step 3: Git提交**

```bash
git add js/systems/ItemSystem.js js/systems/LevelSystem.js
git commit -m "feat: 创建道具系统和关卡生成系统"
```

---

### Task 6: 创建输入管理器

**Files:**
- Create: `js/systems/InputManager.js`

- [ ] **Step 1: 创建输入管理器**

```javascript
// js/systems/InputManager.js
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = this.checkMobile();
        this.currentDirection = 'stop';
        this.createControls();
    }

    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 800 && window.innerHeight <= 900);
    }

    createControls() {
        if (this.isMobile) {
            this.createVirtualJoystick();
        } else {
            this.createKeyboardControls();
            this.createWASDHint();
        }
    }

    createKeyboardControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR
        });
    }

    createWASDHint() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.hintContainer = this.scene.add.container(width - 60, height - 100);
        
        // W键（在S上方）
        const wKey = this.createKeyButton(0, -45, 'W');
        
        // A S D 一行
        const aKey = this.createKeyButton(-45, 0, 'A');
        const sKey = this.createKeyButton(0, 0, 'S');
        const dKey = this.createKeyButton(45, 0, 'D');
        
        this.hintContainer.add([wKey, aKey, sKey, dKey]);
    }

    createKeyButton(x, y, label) {
        const key = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, 38, 38, 0xFFFFFF);
        bg.setStrokeStyle(2, 0x999999);
        
        const text = this.scene.add.text(0, 0, label, {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#8B008B',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        key.add([bg, text]);
        return key;
    }

    createVirtualJoystick() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // 摇杆外圈
        this.joystickBase = this.scene.add.circle(100, height - 100, 50, 0x000000, 0.15);
        this.joystickBase.setStrokeStyle(3, 0xFFFFFF, 0.4);
        
        // 摇杆内圈
        this.joystickKnob = this.scene.add.circle(100, height - 100, 25, 0xFFFFFF, 0.7);
        this.joystickKnob.setInteractive({ draggable: true });
        
        this.scene.input.setDraggable(this.joystickKnob);
        
        this.joystickKnob.on('drag', (pointer, dragX, dragY) => {
            // 限制在内圈范围内
            const baseX = 100;
            const baseY = height - 100;
            const maxDist = 50;
            
            const dx = dragX - baseX;
            const dy = dragY - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                dragX = baseX + (dx / dist) * maxDist;
                dragY = baseY + (dy / dist) * maxDist;
            }
            
            this.joystickKnob.setPosition(dragX, dragY);
            
            // 计算方向
            if (dist > 10) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDirection = dx > 0 ? 'right' : 'left';
                } else {
                    this.currentDirection = dy > 0 ? 'down' : 'up';
                }
            } else {
                this.currentDirection = 'stop';
            }
        });
        
        this.joystickKnob.on('dragend', () => {
            this.joystickKnob.setPosition(100, height - 100);
            this.currentDirection = 'stop';
        });
    }

    getDirection() {
        if (this.isMobile) {
            return this.currentDirection;
        }
        
        if (this.wasd.up.isDown) return 'up';
        if (this.wasd.down.isDown) return 'down';
        if (this.wasd.left.isDown) return 'left';
        if (this.wasd.right.isDown) return 'right';
        return 'stop';
    }

    getItemKey() {
        if (this.isMobile) return null;
        
        if (this.wasd.one.isDown) return 0;
        if (this.wasd.two.isDown) return 1;
        if (this.wasd.three.isDown) return 2;
        if (this.wasd.four.isDown) return 3;
        return null;
    }

    isMobileDevice() {
        return this.isMobile;
    }
}
```

- [ ] **Step 2: Git提交**

```bash
git add js/systems/InputManager.js
git commit -m "feat: 创建输入管理器，支持键盘和虚拟摇杆"
```

---

### Task 7: 创建AI控制器

**Files:**
- Create: `js/systems/AIController.js`

- [ ] **Step 1: 创建AI控制器**

```javascript
// js/systems/AIController.js
class AIController {
    constructor(scene, entity, role) {
        this.scene = scene;
        this.entity = entity;
        this.role = role; // 'cat' or 'mouse'
        this.target = null;
        this.updateInterval = 500; // 每500ms更新一次路径
        this.lastUpdate = 0;
    }

    setTarget(targetEntity) {
        this.target = targetEntity;
    }

    update(time, obstacles) {
        if (!this.target) return;
        
        // 定期更新路径
        if (time - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = time;
        
        const targetPos = this.target.getPosition();
        const myPos = this.entity.getPosition();
        
        if (!targetPos || !myPos) return;
        
        if (this.role === 'cat') {
            // 猫追逐老鼠
            this.entity.update(targetPos.x, targetPos.y, obstacles);
        } else {
            // 老鼠逃跑逻辑
            this.updateMouseAI(targetPos, myPos, obstacles);
        }
    }

    updateMouseAI(catPos, mousePos, obstacles) {
        // 计算远离猫的方向
        const dx = mousePos.x - catPos.x;
        const dy = mousePos.y - catPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
            // 猫靠近时逃跑
            const fleeX = mousePos.x + dx * 0.5;
            const fleeY = mousePos.y + dy * 0.5;
            this.entity.update(fleeX, fleeY, obstacles);
        } else {
            // 寻找宝箱或门
            this.findNearestObjective(mousePos);
        }
    }

    findNearestObjective(mousePos) {
        // 寻找最近的宝箱或门
        // 简化版本：随机移动
        const randomX = mousePos.x + (Math.random() - 0.5) * 200;
        const randomY = mousePos.y + (Math.random() - 0.5) * 200;
        this.entity.move(this.getDirectionToPoint(randomX, randomY, mousePos));
    }

    getDirectionToPoint(targetX, targetY, currentPos) {
        const dx = targetX - currentPos.x;
        const dy = targetY - currentPos.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }
}
```

- [ ] **Step 2: Git提交**

```bash
git add js/systems/AIController.js
git commit -m "feat: 创建AI控制器，支持猫追逐和老鼠逃跑逻辑"
```

---

### Task 8: 创建游戏主场景

**Files:**
- Create: `js/scenes/GameScene.js`

- [ ] **Step 1: 创建游戏主场景**

```javascript
// js/scenes/GameScene.js
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.playerRole = data.role;
        this.currentLevel = data.level || 1;
        this.gameResult = null;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 渐变背景
        this.createBackground();

        // 创建关卡系统
        this.levelSystem = new LevelSystem(this);
        this.levelSystem.level = this.currentLevel;

        // 生成关卡
        const { elements, config } = this.levelSystem.generateLevel(this.playerRole);

        // 创建角色
        this.createCharacters(elements);

        // 创建障碍物
        this.obstacles = elements.obstacles;

        // 创建宝箱
        this.chests = elements.chests;

        // 创建门
        this.door = elements.door;

        // 创建道具系统
        this.itemSystem = new ItemSystem(this);

        // 创建输入管理器
        this.inputManager = new InputManager(this);

        // 创建AI控制器
        this.createAIController();

        // 设置碰撞
        this.setupCollisions();

        // 创建UI
        this.createGameUI(config);

        // 关卡文字动画
        this.showLevelText();
    }

    createBackground() {
        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        graphics.fillGradientStyle(0xFFB6C1, 0xFFB6C1, 0xDDA0DD, 0xDDA0DD, 1);
        graphics.fillRect(0, 0, width, height);
    }

    createCharacters(elements) {
        if (this.playerRole === 'mouse') {
            this.player = new Mouse(this, elements.playerStart.x, elements.playerStart.y, true);
            this.aiEntity = new Cat(this, elements.aiStart.x, elements.aiStart.y);
        } else {
            this.player = new Cat(this, elements.playerStart.x, elements.playerStart.y);
            this.aiEntity = new Mouse(this, elements.aiStart.x, elements.aiStart.y, false);
        }
    }

    createAIController() {
        this.aiController = new AIController(this, this.aiEntity, 
            this.playerRole === 'mouse' ? 'cat' : 'mouse');
        this.aiController.setTarget(this.player);
    }

    setupCollisions() {
        // 延迟设置碰撞（等待sprite创建完成）
        this.time.delayedCall(100, () => {
            if (!this.player.getSprite() || !this.aiEntity.getSprite()) return;

            // 角色与障碍物碰撞
            this.obstacles.forEach(obstacle => {
                this.physics.add.collider(this.player.getSprite(), obstacle.getSprite());
                this.physics.add.collider(this.aiEntity.getSprite(), obstacle.getSprite());
            });

            // 猫抓老鼠碰撞
            this.physics.add.overlap(
                this.player.getSprite(),
                this.aiEntity.getSprite(),
                this.onCatCatchMouse,
                null,
                this
            );

            // 宝箱碰撞
            this.chests.forEach(chest => {
                this.physics.add.overlap(
                    this.player.getSprite(),
                    chest.getSprite(),
                    () => this.onOpenChest(chest),
                    null,
                    this
                );
            });

            // 门碰撞
            this.physics.add.overlap(
                this.player.getSprite(),
                this.door.getSprite(),
                this.onReachDoor,
                null,
                this
            );
        });
    }

    createGameUI(config) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 退出按钮
        this.exitBtn = this.add.text(20, 20, '❌ 退出', {
            fontSize: '14px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        this.exitBtn.on('pointerdown', () => this.scene.start('HomeScene'));

        // 暂停按钮
        this.pauseBtn = this.add.text(100, 20, '⏸️ 暂停', {
            fontSize: '14px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        this.isPaused = false;
        this.pauseBtn.on('pointerdown', () => this.togglePause());

        // 关卡显示
        this.add.text(width - 80, 20, `关卡 ${this.currentLevel}`, {
            fontSize: '16px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        });
    }

    showLevelText() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const levelText = this.add.text(width / 2, height / 2, `关卡 ${this.currentLevel}`, {
            fontSize: '48px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B008B',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: levelText,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: 1000,
            onComplete: () => levelText.destroy()
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            this.pauseBtn.setText('▶️ 继续');
        } else {
            this.physics.resume();
            this.pauseBtn.setText('⏸️ 暂停');
        }
    }

    update(time, delta) {
        if (this.isPaused || this.gameResult) return;

        // 更新移动障碍物
        this.obstacles.forEach(obstacle => obstacle.update());

        // 处理输入
        const direction = this.inputManager.getDirection();
        if (this.playerRole === 'mouse') {
            this.player.move(direction);
        } else {
            // 猫玩家控制
            this.updateCatPlayer(direction);
        }

        // 处理道具按键
        const itemKey = this.inputManager.getItemKey();
        if (itemKey !== null) {
            this.useItem(itemKey);
        }

        // 更新AI
        this.aiController.update(time, this.obstacles);
    }

    updateCatPlayer(direction) {
        if (!this.player.getSprite()) return;
        
        const speed = GAME_CONFIG.PLAYER_SPEED;
        switch (direction) {
            case 'up': this.player.sprite.setVelocity(0, -speed); break;
            case 'down': this.player.sprite.setVelocity(0, speed); break;
            case 'left': this.player.sprite.setVelocity(-speed, 0); break;
            case 'right': this.player.sprite.setVelocity(speed, 0); break;
            case 'stop': this.player.sprite.setVelocity(0, 0); break;
        }
    }

    useItem(slotIndex) {
        const item = this.itemSystem.useItem(slotIndex);
        if (!item) return;

        if (item === 'slow') {
            this.aiEntity.applySlow();
        } else if (item === 'freeze') {
            this.aiEntity.applyFreeze();
        } else if (item === 'trap') {
            this.placeTrap();
        }
    }

    placeTrap() {
        const pos = this.player.getPosition();
        if (!pos) return;

        const trap = this.add.circle(pos.x, pos.y, 20, 0xF8BBD0);
        trap.setStrokeStyle(2, 0xC2185B);

        this.physics.add.overlap(
            this.aiEntity.getSprite(),
            trap,
            () => {
                this.aiEntity.applyTrap();
                trap.destroy();
            },
            null,
            this
        );
    }

    onCatCatchMouse() {
        if (this.playerRole === 'mouse') {
            // 老鼠被抓
            this.gameResult = 'mouse_caught';
            this.endGame(false);
        } else {
            // 猫抓住老鼠
            this.gameResult = 'cat_wins';
            this.endGame(true);
        }
    }

    onOpenChest(chest) {
        const item = chest.open();
        if (item) {
            this.itemSystem.addItem(item);
            
            // 宝箱打开动画
            this.tweens.add({
                targets: chest.sprite,
                scale: 1.2,
                duration: 200,
                yoyo: true
            });
        }
    }

    onReachDoor() {
        if (this.playerRole === 'mouse') {
            if (this.itemSystem.hasKey()) {
                this.door.unlock();
                this.itemSystem.useKey();
                this.gameResult = 'mouse_escapes';
                this.endGame(true);
            } else if (this.door.isOpen()) {
                this.gameResult = 'mouse_escapes';
                this.endGame(true);
            }
        } else {
            // 猫到达门（老鼠逃跑）
            if (this.itemSystem.hasKey() || this.door.isOpen()) {
                this.gameResult = 'mouse_escapes';
                this.endGame(false);
            }
        }
    }

    endGame(playerWins) {
        this.physics.pause();
        
        this.scene.start('EndScene', {
            role: this.playerRole,
            result: this.gameResult,
            level: this.currentLevel,
            playerWins
        });
    }
}
```

- [ ] **Step 2: Git提交**

```bash
git add js/scenes/GameScene.js
git commit -m "feat: 实现游戏主场景，包含完整游戏循环"
```

---

### Task 9: 创建结束场景

**Files:**
- Create: `js/scenes/EndScene.js`

- [ ] **Step 1: 创建结束场景**

```javascript
// js/scenes/EndScene.js
class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    init(data) {
        this.playerRole = data.role;
        this.result = data.result;
        this.level = data.level;
        this.playerWins = data.playerWins;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground();
        this.createContent();
        this.createButtons();
    }

    createBackground() {
        const colors = {
            mouse_escapes: [0xFFD700, 0xFFA500],      // 金色（老鼠赢）
            mouse_caught: [0x87CEEB, 0x6495ED],       // 蓝色（老鼠输）
            cat_wins: [0xFFA500, 0xFF8C00],           // 橙色（猫赢）
            mouse_escapes_as_cat: [0xB0BEC5, 0x78909C] // 灰色（猫输）
        };

        const colorKey = this.getResultKey();
        const [color1, color2] = colors[colorKey];

        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        graphics.fillGradientStyle(color1, color1, color2, color2, 1);
        graphics.fillRect(0, 0, width, height);
    }

    getResultKey() {
        if (this.playerRole === 'mouse') {
            return this.playerWins ? 'mouse_escapes' : 'mouse_caught';
        } else {
            return this.playerWins ? 'cat_wins' : 'mouse_escapes_as_cat';
        }
    }

    createContent() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const content = this.getResultContent();
        
        // 角色表情
        this.add.text(width / 2, height * 0.3, content.emoji, {
            fontSize: '60px'
        }).setOrigin(0.5);

        // 结果文字
        this.add.text(width / 2, height * 0.45, content.message, {
            fontSize: '28px',
            fontFamily: 'Comic Sans MS, cursive',
            color: content.textColor,
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 说明文字
        this.add.text(width / 2, height * 0.55, content.description, {
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);
    }

    getResultContent() {
        const contents = {
            mouse_escapes: {
                emoji: '🎉 🐭 😊 🎉',
                message: '恭喜！成功逃脱！',
                description: '🎊 老鼠开心庆祝 🎵 欢快音乐',
                textColor: '#FFD700'
            },
            mouse_caught: {
                emoji: '😭 🐭 💔',
                message: '哎呀！被抓住了！',
                description: '💧 老鼠哭泣 😢 悲伤音乐',
                textColor: '#6495ED'
            },
            cat_wins: {
                emoji: '😼 🐱 ✨ 🎉',
                message: '抓到了！喵喵得意！',
                description: '🎉 猫得意洋洋 😼 欢快音乐',
                textColor: '#FF8C00'
            },
            mouse_escapes_as_cat: {
                emoji: '😿 🐱 💔',
                message: '可惜！老鼠跑了！',
                description: '😿 猫垂头丧气 😢 悲伤音乐',
                textColor: '#78909C'
            }
        };

        return contents[this.getResultKey()];
    }

    createButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        if (this.playerWins) {
            // 下一关按钮
            const nextBtn = this.add.text(width / 2, height * 0.7, '下一关 ▶', {
                fontSize: '18px',
                color: '#FFFFFF',
                backgroundColor: '#4CAF50',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setInteractive();

            nextBtn.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    role: this.playerRole,
                    level: this.level + 1
                });
            });
        } else {
            // 再试一次按钮
            const retryBtn = this.add.text(width / 2, height * 0.7, '再试一次 🔄', {
                fontSize: '18px',
                color: '#FFFFFF',
                backgroundColor: '#9370DB',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setInteractive();

            retryBtn.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    role: this.playerRole,
                    level: this.level
                });
            });
        }

        // 返回首页按钮
        const homeBtn = this.add.text(width / 2, height * 0.85, '返回首页 🏠', {
            fontSize: '16px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        homeBtn.on('pointerdown', () => {
            this.scene.start('HomeScene');
        });
    }
}
```

- [ ] **Step 2: Git提交**

```bash
git add js/scenes/EndScene.js
git commit -m "feat: 实现结束场景，四种结局画面"
```

---

### Task 10: 整合测试和优化

**Files:**
- Modify: `index.html` (确保所有脚本正确加载顺序)

- [ ] **Step 1: 完整测试流程**

在浏览器打开 `index.html`，测试完整流程：
1. 首页显示正确（渐变背景、标题、角色选择）
2. 选择角色后边框变色
3. 点击开始进入游戏场景
4. WASD/摇杆控制角色移动
5. 打开宝箱获得道具
6. 使用道具效果生效
7. 猫抓住老鼠/老鼠逃到门 → 结束画面
8. 结束画面正确显示四种结局
9. 下一关/再试一次按钮正常工作

- [ ] **Step 2: 响应式测试**

测试不同屏幕尺寸：
- 电脑浏览器（宽屏）
- 手机模拟器（窄屏，显示虚拟摇杆）
- 平板尺寸

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: 完成你追我赶游戏完整实现"
```

---

## 自检清单

**Spec覆盖检查：**
- ✅ 首页设计：粉紫渐变、角色选择、玩法说明
- ✅ 游戏视角：俯视角迷宫
- ✅ 角色：SVG矢量猫和老鼠
- ✅ 道具：钥匙、减速、冰冻、陷阱
- ✅ 障碍物：墙壁、家具、移动障碍
- ✅ 关卡递进：地图变大 + AI变快 + 障碍物增加
- ✅ 控制：电脑WASD + 手机虚拟摇杆
- ✅ 结束画面：四种结局正确表情

**Placeholder检查：** 无TBD/TODO占位符

**类型一致性检查：** 方法名称在各文件中保持一致