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
        this.container = this.scene.add.container(x, y);

        this.graphics = this.scene.add.graphics();
        this.drawMouse(0, 0);

        this.container.add(this.graphics);

        this.scene.physics.add.existing(this.container);
        this.sprite = this.container;
        this.sprite.body.setSize(40, 45);
        this.sprite.body.setOffset(-20, -22);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
    }

    drawMouse(offsetX, offsetY) {
        const g = this.graphics;
        g.clear();

        // 身体 - 灰色椭圆
        g.fillStyle(0xC0C0C0, 1);
        g.fillEllipse(offsetX, offsetY + 12, 32, 24);

        // 头部
        g.fillCircle(offsetX, offsetY - 5, 22);

        // 脸部内侧 - 浅粉色
        g.fillStyle(0xFFE4E1, 1);
        g.fillCircle(offsetX, offsetY - 2, 16);

        // 耳朵 - 大圆耳朵
        g.fillStyle(0xC0C0C0, 1);
        g.fillCircle(offsetX - 14, offsetY - 20, 12);
        g.fillCircle(offsetX + 14, offsetY - 20, 12);

        // 耳朵内部 - 粉色
        g.fillStyle(0xFFE4B5, 1);
        g.fillCircle(offsetX - 14, offsetY - 20, 8);
        g.fillCircle(offsetX + 14, offsetY - 20, 8);

        // 眼睛 - 黑色
        g.fillStyle(0x333333, 1);
        g.fillCircle(offsetX - 7, offsetY - 6, 5);
        g.fillCircle(offsetX + 7, offsetY - 6, 5);

        // 眼睛高光 - 白色
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(offsetX - 6, offsetY - 8, 2);
        g.fillCircle(offsetX + 8, offsetY - 8, 2);

        // 鼻子 - 粉色
        g.fillStyle(0xFF69B4, 1);
        g.fillEllipse(offsetX, offsetY + 4, 4, 3);

        // 胡须 - 细线
        g.lineStyle(1, 0x888888, 1);
        g.lineBetween(offsetX - 15, offsetY + 4, offsetX - 28, offsetY);
        g.lineBetween(offsetX - 15, offsetY + 7, offsetX - 28, offsetY + 8);
        g.lineBetween(offsetX + 15, offsetY + 4, offsetX + 28, offsetY);
        g.lineBetween(offsetX + 15, offsetY + 7, offsetX + 28, offsetY + 8);

        // 尾巴 - 细长曲线
        g.lineStyle(3, 0xA0A0A0, 1);
        g.beginPath();
        g.arc(offsetX + 18, offsetY + 20, 15, Math.PI * 0.3, Math.PI * 1.2);
        g.strokePath();
    }

    move(direction) {
        if (!this.sprite) return;

        switch (direction) {
            case 'up':
                this.sprite.body.setVelocity(0, -this.speed);
                break;
            case 'down':
                this.sprite.body.setVelocity(0, this.speed);
                break;
            case 'left':
                this.sprite.body.setVelocity(-this.speed, 0);
                break;
            case 'right':
                this.sprite.body.setVelocity(this.speed, 0);
                break;
            case 'stop':
            default:
                this.sprite.body.setVelocity(0, 0);
                break;
        }
    }

    update(targetX, targetY, obstacles) {
        if (!this.sprite) return;

        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            this.sprite.body.setVelocity(
                (dx / distance) * this.speed,
                (dy / distance) * this.speed
            );
        } else {
            this.sprite.body.setVelocity(0, 0);
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