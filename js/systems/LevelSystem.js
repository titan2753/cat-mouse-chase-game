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

        // 生成宝箱 - 第一个宝箱必定包含钥匙
        for (let i = 0; i < config.chestCount; i++) {
            const x = 100 + Math.random() * (width - 200);
            const y = 100 + Math.random() * (height - 200);
            // 第一个宝箱保证有钥匙
            const guaranteedKey = (i === 0);
            elements.chests.push(new Chest(this.scene, x, y, guaranteedKey));
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

    setLevel(level) {
        this.level = level;
    }

    reset() {
        this.level = 1;
    }
}