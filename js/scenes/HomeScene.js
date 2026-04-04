// js/scenes/HomeScene.js
class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
        this.selectedRole = null;
    }

    create() {
        // 创建音效管理器
        this.soundManager = new SoundManager(this);

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
        this.createCard(width * 0.3, height * 0.28, '🏆 最高记录', '15关', GAME_CONFIG.COLORS.pink);
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

        this.mouseCard = this.createRoleCard(width * 0.35, height * 0.5, '🐭', '逃生者', '找钥匙逃跑', 'mouse');
        this.catCard = this.createRoleCard(width * 0.65, height * 0.5, '🐱', '抓捕者', '抓住老鼠', 'cat');
    }

    createRoleCard(x, y, emoji, name, desc, role) {
        const card = this.add.container(x, y);

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
        this.soundManager.playClick();

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
                this.soundManager.playClick();
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

        const decorations = ['✨', '🌸', '💜', '⭐', '🎀', '💫'];
        decorations.forEach((emoji) => {
            this.add.text(
                Math.random() * width,
                Math.random() * height,
                emoji,
                { fontSize: '20px' }
            ).setAlpha(0.4 + Math.random() * 0.3);
        });
    }
}