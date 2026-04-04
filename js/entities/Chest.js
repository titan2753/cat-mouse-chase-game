class Chest {
    constructor(scene, x, y, guaranteedKey = false) {
        this.scene = scene;
        this.isOpen = false;
        this.guaranteedKey = guaranteedKey;

        this.sprite = scene.add.container(x, y);

        // 更大的宝箱
        const base = scene.add.rectangle(0, 5, 40, 25, 0xDAA520);
        base.setStrokeStyle(3, 0x8B4513);

        // 宝箱盖子
        this.lid = scene.add.rectangle(0, -8, 40, 15, 0xFFD700);
        this.lid.setStrokeStyle(3, 0x8B4513);

        // 宝箱装饰 - 中心锁扣
        const lock = scene.add.rectangle(0, 5, 10, 10, 0xFFD700);
        lock.setStrokeStyle(1, 0x8B4513);

        this.sprite.add([base, this.lid, lock]);
        this.sprite.setSize(40, 30);

        scene.physics.add.existing(this.sprite, true);

        // 浮动动画
        scene.tweens.add({
            targets: this.sprite,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    open() {
        if (this.isOpen) return null;

        this.isOpen = true;

        // 打开动画
        this.scene.tweens.add({
            targets: this.lid,
            y: -25,
            angle: -30,
            duration: 300,
            ease: 'Power2'
        });

        // 播放打开音效
        if (this.scene.sound && this.scene.sound.get('chest-open')) {
            this.scene.sound.play('chest-open');
        }

        // 返回道具 - 提高钥匙概率
        let item;
        if (this.guaranteedKey) {
            item = 'key';
        } else {
            // 钥匙40%概率，其他道具各20%
            const rand = Math.random();
            if (rand < 0.4) {
                item = 'key';
            } else if (rand < 0.6) {
                item = 'slow';
            } else if (rand < 0.8) {
                item = 'freeze';
            } else {
                item = 'trap';
            }
        }

        // 显示道具弹出效果
        this.showItemPopup(item);

        return item;
    }

    showItemPopup(item) {
        const icons = {
            key: '🔑',
            slow: '⏱️',
            freeze: '❄️',
            trap: '🪤'
        };

        const popup = this.scene.add.text(this.sprite.x, this.sprite.y - 30, icons[item], {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: popup,
            y: popup.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => popup.destroy()
        });
    }

    getSprite() {
        return this.sprite;
    }
}