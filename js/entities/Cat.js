// 猫角色实体类 - AI控制的追逐者
class Cat {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = GAME_CONFIG.AI_SPEED_BASE;
        this.isFrozen = false;
        this.isSlowed = false;
        this.isTrapped = false;
        this.sprite = null;

        // 直接创建图形
        this.createSprite(x, y);
    }

    createSprite(x, y) {
        // 创建容器
        this.container = this.scene.add.container(x, y);

        // 使用Graphics绘制精美的猫
        this.graphics = this.scene.add.graphics();
        this.drawCat(0, 0);

        this.container.add(this.graphics);

        // 添加物理body
        this.scene.physics.add.existing(this.container);
        this.sprite = this.container;
        this.sprite.body.setSize(50, 60);
        this.sprite.body.setOffset(-25, -30);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
    }

    drawCat(offsetX, offsetY) {
        const g = this.graphics;
        g.clear();

        // 身体 - 橙色椭圆
        g.fillStyle(0xFFA500, 1);
        g.fillEllipse(offsetX, offsetY + 15, 45, 35);

        // 头部
        g.fillCircle(offsetX, offsetY - 5, 25);

        // 耳朵 - 三角形
        g.fillTriangle(offsetX - 18, offsetY - 20, offsetX - 10, offsetY - 35, offsetX - 5, offsetY - 18);
        g.fillTriangle(offsetX + 18, offsetY - 20, offsetX + 10, offsetY - 35, offsetX + 5, offsetY - 18);

        // 耳朵内部 - 浅色
        g.fillStyle(0xFFE4B5, 1);
        g.fillTriangle(offsetX - 15, offsetY - 22, offsetX - 10, offsetY - 32, offsetX - 7, offsetY - 20);
        g.fillTriangle(offsetX + 15, offsetY - 22, offsetX + 10, offsetY - 32, offsetX + 7, offsetY - 20);

        // 眼睛 - 黑色
        g.fillStyle(0x333333, 1);
        g.fillCircle(offsetX - 10, offsetY - 8, 6);
        g.fillCircle(offsetX + 10, offsetY - 8, 6);

        // 眼睛高光 - 白色
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(offsetX - 8, offsetY - 10, 2);
        g.fillCircle(offsetX + 12, offsetY - 10, 2);

        // 鼻子 - 粉色
        g.fillStyle(0xFF69B4, 1);
        g.fillEllipse(offsetX, offsetY + 3, 6, 4);

        // 嘴巴 - 曲线
        g.lineStyle(2, 0x333333, 1);
        g.beginPath();
        g.arc(offsetX - 5, offsetY + 8, 6, 0, Math.PI * 0.8);
        g.strokePath();
        g.beginPath();
        g.arc(offsetX + 5, offsetY + 8, 6, Math.PI * 0.2, Math.PI);
        g.strokePath();

        // 胡须
        g.lineStyle(1.5, 0x333333, 1);
        g.lineBetween(offsetX - 25, offsetY - 2, offsetX - 40, offsetY - 8);
        g.lineBetween(offsetX - 25, offsetY + 3, offsetX - 40, offsetY + 3);
        g.lineBetween(offsetX + 25, offsetY - 2, offsetX + 40, offsetY - 8);
        g.lineBetween(offsetX + 25, offsetY + 3, offsetX + 40, offsetY + 3);

        // 尾巴
        g.lineStyle(6, 0xFFA500, 1);
        g.beginPath();
        g.arc(offsetX + 30, offsetY + 25, 20, Math.PI * 0.5, Math.PI * 1.2);
        g.strokePath();
    }

    update(targetX, targetY, obstacles) {
        if (!this.sprite || this.isFrozen || this.isTrapped) return;

        let currentSpeed = this.speed;
        if (this.isSlowed) currentSpeed *= 0.5;

        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            this.sprite.body.setVelocity(
                (dx / distance) * currentSpeed,
                (dy / distance) * currentSpeed
            );
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
    }

    applySlow(duration) {
        this.isSlowed = true;
        // 视觉效果 - 变蓝色
        this.graphics.tint = 0x6666FF;
        this.scene.time.delayedCall(duration || 5000, () => {
            this.isSlowed = false;
            this.graphics.tint = 0xFFFFFF;
        });
    }

    applyFreeze(duration) {
        this.isFrozen = true;
        if (this.sprite) this.sprite.body.setVelocity(0, 0);
        // 视觉效果 - 变浅蓝
        this.graphics.tint = 0x88DDFF;
        this.scene.time.delayedCall(duration || 3000, () => {
            this.isFrozen = false;
            this.graphics.tint = 0xFFFFFF;
        });
    }

    applyTrap(duration) {
        this.isTrapped = true;
        if (this.sprite) this.sprite.body.setVelocity(0, 0);
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