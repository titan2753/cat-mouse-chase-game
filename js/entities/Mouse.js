// 老鼠角色实体类 - 玩家控制的逃跑者
class Mouse {
    constructor(scene, x, y, isPlayer) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.hasKey = false;
        this.sprite = null;

        this.createSprite(x, y);
    }

    createSprite(x, y) {
        const textureKey = 'mouse-' + Date.now();
        const svg = SVG_ASSETS.mouse;
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
            default:
                this.sprite.setVelocity(0, 0);
                break;
        }
    }

    update(targetX, targetY, obstacles) {
        if (!this.sprite) return;

        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            this.sprite.setVelocity(
                (dx / distance) * this.speed,
                (dy / distance) * this.speed
            );
        } else {
            this.sprite.setVelocity(0, 0);
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