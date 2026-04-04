// 猫角色实体类 - AI控制的追逐者
class Cat {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = GAME_CONFIG.AI_SPEED_BASE;
        this.isFrozen = false;
        this.isSlowed = false;
        this.isTrapped = false;
        this.sprite = null;

        // 创建SVG纹理
        this.createSprite(x, y);
    }

    createSprite(x, y) {
        const textureKey = 'cat-' + Date.now();
        const svg = SVG_ASSETS.cat;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        this.scene.load.image(textureKey, url);
        this.scene.load.once('complete', () => {
            this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
            this.sprite.setCollideWorldBounds(true);
            this.sprite.setScale(1.2);
            URL.revokeObjectURL(url);
        });
        this.scene.load.start();
    }

    update(targetX, targetY, obstacles) {
        if (!this.sprite || this.isFrozen || this.isTrapped) return;

        let currentSpeed = this.speed;
        if (this.isSlowed) currentSpeed *= 0.5;

        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            this.sprite.setVelocity(
                (dx / distance) * currentSpeed,
                (dy / distance) * currentSpeed
            );
        } else {
            this.sprite.setVelocity(0, 0);
        }
    }

    applySlow(duration) {
        this.isSlowed = true;
        this.scene.time.delayedCall(duration || 5000, () => {
            this.isSlowed = false;
        });
    }

    applyFreeze(duration) {
        this.isFrozen = true;
        if (this.sprite) this.sprite.setVelocity(0, 0);
        this.scene.time.delayedCall(duration || 3000, () => {
            this.isFrozen = false;
        });
    }

    applyTrap(duration) {
        this.isTrapped = true;
        if (this.sprite) this.sprite.setVelocity(0, 0);
        this.scene.time.delayedCall(duration || 4000, () => {
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