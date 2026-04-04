class Door {
    constructor(scene, x, y) {
        this.scene = scene;
        this.isLocked = true;

        this.sprite = scene.add.container(x, y);

        const frame = scene.add.rectangle(0, 0, 40, 55, 0x4CAF50);
        frame.setStrokeStyle(3, 0x1B5E20);

        const handle = scene.add.circle(10, 0, 5, 0xFFD700);

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