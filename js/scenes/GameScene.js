class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.playerRole = data.role;
        this.currentLevel = data.level || 1;
        this.gameResult = null;
        this.isPaused = false;
    }

    create() {
        // 创建音效管理器
        this.soundManager = new SoundManager(this);

        this.createBackground();

        // 创建关卡系统
        this.levelSystem = new LevelSystem(this);
        this.levelSystem.level = this.currentLevel;

        // 生成关卡
        const { elements, config } = this.levelSystem.generateLevel(this.playerRole);

        // 存储元素引用
        this.obstacles = elements.obstacles;
        this.chests = elements.chests;
        this.door = elements.door;

        // 创建角色
        this.createCharacters(elements);

        // 创建道具系统
        this.itemSystem = new ItemSystem(this);

        // 创建输入管理器
        this.inputManager = new InputManager(this);

        // 创建AI控制器
        this.createAIController();

        // 设置碰撞
        this.setupCollisions();

        // 创建UI
        this.createGameUI();

        // 关卡文字动画
        this.showLevelText();

        // 开始BGM
        this.soundManager.startBGM('normal');

        // 警告距离检测定时器
        this.warningCooldown = 0;
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 渐变背景
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0xFFB6C1, 0xFFB6C1, 0xDDA0DD, 0xDDA0DD, 1);
        graphics.fillRect(0, 0, width, height);

        // 添加地面纹理效果
        const floorGraphics = this.add.graphics();
        floorGraphics.lineStyle(1, 0xE8D0E8, 0.3);

        // 网格线
        for (let x = 0; x < width; x += 50) {
            floorGraphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 50) {
            floorGraphics.lineBetween(0, y, width, y);
        }
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
        this.time.delayedCall(200, () => {
            if (!this.player || !this.player.getSprite() || !this.aiEntity || !this.aiEntity.getSprite()) {
                return;
            }

            // 角色与障碍物碰撞
            this.obstacles.forEach(obstacle => {
                if (obstacle && obstacle.getSprite()) {
                    this.physics.add.collider(this.player.getSprite(), obstacle.getSprite());
                    this.physics.add.collider(this.aiEntity.getSprite(), obstacle.getSprite());
                }
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
                if (chest && chest.getSprite()) {
                    this.physics.add.overlap(
                        this.player.getSprite(),
                        chest.getSprite(),
                        () => this.onOpenChest(chest),
                        null,
                        this
                    );
                }
            });

            // 门碰撞
            if (this.door && this.door.getSprite()) {
                this.physics.add.overlap(
                    this.player.getSprite(),
                    this.door.getSprite(),
                    this.onReachDoor,
                    null,
                    this
                );
            }
        });
    }

    createGameUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 退出按钮
        this.exitBtn = this.add.text(20, 20, '❌ 退出', {
            fontSize: '14px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setInteractive().setDepth(100);
        this.exitBtn.on('pointerdown', () => {
            this.soundManager.playClick();
            this.soundManager.stopBGM();
            this.scene.start('HomeScene');
        });

        // 暂停按钮
        this.pauseBtn = this.add.text(100, 20, '⏸️ 暂停', {
            fontSize: '14px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setInteractive().setDepth(100);
        this.pauseBtn.on('pointerdown', () => {
            this.soundManager.playClick();
            this.togglePause();
        });

        // 关卡显示
        this.add.text(width - 80, 20, `关卡 ${this.currentLevel}`, {
            fontSize: '16px',
            color: '#8B008B',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setDepth(100);
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
        }).setOrigin(0.5).setAlpha(0).setDepth(200);

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
            this.soundManager.stopBGM();
        } else {
            this.physics.resume();
            this.pauseBtn.setText('⏸️ 暂停');
            this.soundManager.startBGM('normal');
        }
    }

    update(time, delta) {
        if (this.isPaused || this.gameResult) return;

        // 更新移动障碍物
        this.obstacles.forEach(obstacle => {
            if (obstacle && obstacle.update) {
                obstacle.update();
            }
        });

        // 处理玩家输入
        const direction = this.inputManager.getDirection();
        if (this.player && this.player.move) {
            this.player.move(direction);
        }

        // 处理道具按键
        const itemKey = this.inputManager.getItemKey();
        if (itemKey !== null) {
            this.useItem(itemKey);
        }

        // 更新AI
        if (this.aiController && this.aiEntity) {
            this.aiController.update(time, this.obstacles);
        }

        // 检测猫和老鼠的距离，播放警告音效和切换BGM
        this.checkDistanceWarning(time);
    }

    checkDistanceWarning(time) {
        if (!this.player || !this.aiEntity) return;
        if (this.playerRole !== 'mouse') return;

        const playerPos = this.player.getPosition();
        const aiPos = this.aiEntity.getPosition();

        if (!playerPos || !aiPos) return;

        const distance = Math.sqrt(
            Math.pow(playerPos.x - aiPos.x, 2) +
            Math.pow(playerPos.y - aiPos.y, 2)
        );

        // 猫靠近时切换到紧张BGM
        if (distance < 200) {
            this.soundManager.changeBGMType('chase');

            // 播放警告音效（每2秒一次）
            if (time - this.warningCooldown > 2000) {
                this.soundManager.playWarning();
                this.warningCooldown = time;

                // 显示警告效果
                this.showWarningEffect();
            }
        } else if (distance > 300) {
            this.soundManager.changeBGMType('normal');
        }
    }

    showWarningEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 闪烁红色边框
        const warning = this.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0.2).setDepth(150);
        this.tweens.add({
            targets: warning,
            alpha: 0,
            duration: 300,
            onComplete: () => warning.destroy()
        });
    }

    useItem(slotIndex) {
        const item = this.itemSystem.useItem(slotIndex);
        if (!item || !this.aiEntity) return;

        this.soundManager.playItemUse();

        if (item === 'slow') {
            this.aiEntity.applySlow(GAME_CONFIG.ITEM_DURATION.slow);
        } else if (item === 'freeze') {
            this.aiEntity.applyFreeze(GAME_CONFIG.ITEM_DURATION.freeze);
        } else if (item === 'trap') {
            this.placeTrap();
        }
    }

    placeTrap() {
        if (!this.player || !this.player.getPosition()) return;

        const pos = this.player.getPosition();
        const trap = this.add.circle(pos.x, pos.y, 20, 0xF8BBD0);
        trap.setStrokeStyle(2, 0xC2185B);

        if (this.aiEntity && this.aiEntity.getSprite()) {
            this.physics.add.overlap(
                this.aiEntity.getSprite(),
                trap,
                () => {
                    if (this.aiEntity.applyTrap) {
                        this.aiEntity.applyTrap(GAME_CONFIG.ITEM_DURATION.trap);
                    }
                    trap.destroy();
                },
                null,
                this
            );
        }
    }

    onCatCatchMouse() {
        if (this.gameResult) return;

        this.soundManager.playCaught();

        if (this.playerRole === 'mouse') {
            this.gameResult = 'mouse_caught';
            this.endGame(false);
        } else {
            this.gameResult = 'cat_wins';
            this.endGame(true);
        }
    }

    onOpenChest(chest) {
        if (!chest || chest.isOpen) return;

        const item = chest.open();
        if (item) {
            this.itemSystem.addItem(item);
            this.soundManager.playChestOpen();
            this.soundManager.playItemPickup();

            this.tweens.add({
                targets: chest.sprite,
                scale: 1.2,
                duration: 200,
                yoyo: true
            });
        }
    }

    onReachDoor() {
        if (this.gameResult) return;

        if (this.playerRole === 'mouse') {
            if (this.itemSystem.hasKey()) {
                this.door.unlock();
                this.itemSystem.useKey();
                this.gameResult = 'mouse_escapes';
                this.soundManager.playEscape();
                this.endGame(true);
            } else if (this.door.isOpen()) {
                this.gameResult = 'mouse_escapes';
                this.soundManager.playEscape();
                this.endGame(true);
            }
        } else {
            if (this.itemSystem.hasKey() || this.door.isOpen()) {
                this.gameResult = 'mouse_escapes';
                this.endGame(false);
            }
        }
    }

    endGame(playerWins) {
        this.physics.pause();
        this.soundManager.stopBGM();

        this.time.delayedCall(500, () => {
            this.scene.start('EndScene', {
                role: this.playerRole,
                result: this.gameResult,
                level: this.currentLevel,
                playerWins
            });
        });
    }
}