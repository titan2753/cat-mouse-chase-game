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
        // 创建音效管理器
        this.soundManager = new SoundManager(this);

        this.createBackground();
        this.createContent();
        this.createButtons();

        // 播放结局音效和BGM
        this.playEndingSound();
    }

    playEndingSound() {
        if (this.playerWins) {
            this.soundManager.startBGM('win');
        } else {
            this.soundManager.startBGM('lose');
        }
    }

    createBackground() {
        const colors = {
            mouse_escapes: [0xFFD700, 0xFFA500],
            mouse_caught: [0x87CEEB, 0x6495ED],
            cat_wins: [0xFFA500, 0xFF8C00],
            mouse_escapes_as_cat: [0xB0BEC5, 0x78909C]
        };

        const colorKey = this.getResultKey();
        const [color1, color2] = colors[colorKey];

        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        graphics.fillGradientStyle(color1, color1, color2, color2, 1);
        graphics.fillRect(0, 0, width, height);

        // 添加粒子效果
        if (this.playerWins) {
            this.createCelebrationParticles();
        }
    }

    createCelebrationParticles() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建彩带效果
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const confetti = this.add.text(x, -20, ['🎉', '🎊', '✨', '⭐'][Math.floor(Math.random() * 4)], {
                fontSize: '24px'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: confetti,
                y: height + 50,
                x: x + (Math.random() - 0.5) * 200,
                angle: Math.random() * 360,
                duration: 2000 + Math.random() * 2000,
                repeat: -1,
                delay: Math.random() * 1000
            });
        }
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

        // 显示关卡数
        this.add.text(width / 2, height * 0.63, `第 ${this.level} 关`, {
            fontSize: '18px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 5 }
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
            const nextBtn = this.add.text(width / 2, height * 0.72, '下一关 ▶', {
                fontSize: '18px',
                color: '#FFFFFF',
                backgroundColor: '#4CAF50',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setInteractive();

            nextBtn.on('pointerdown', () => {
                this.soundManager.playClick();
                this.soundManager.stopBGM();
                this.scene.start('GameScene', {
                    role: this.playerRole,
                    level: this.level + 1
                });
            });
        } else {
            const retryBtn = this.add.text(width / 2, height * 0.72, '再试一次 🔄', {
                fontSize: '18px',
                color: '#FFFFFF',
                backgroundColor: '#9370DB',
                padding: { x: 25, y: 12 }
            }).setOrigin(0.5).setInteractive();

            retryBtn.on('pointerdown', () => {
                this.soundManager.playClick();
                this.soundManager.stopBGM();
                this.scene.start('GameScene', {
                    role: this.playerRole,
                    level: this.level
                });
            });
        }

        const homeBtn = this.add.text(width / 2, height * 0.85, '返回首页 🏠', {
            fontSize: '16px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        homeBtn.on('pointerdown', () => {
            this.soundManager.playClick();
            this.soundManager.stopBGM();
            this.scene.start('HomeScene');
        });
    }
}