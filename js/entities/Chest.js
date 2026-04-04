class Chest {
    constructor(scene, x, y) {
        this.scene = scene;
        this.isOpen = false;

        this.sprite = scene.add.container(x, y);

        const base = scene.add.rectangle(0, 5, 30, 20, 0xDAA520);
        base.setStrokeStyle(2, 0x8B4513);

        this.lid = scene.add.rectangle(0, -5, 30, 10, 0xFFD700);
        this.lid.setStrokeStyle(2, 0x8B4513);

        this.sprite.add([base, this.lid]);
        this.sprite.setSize(30, 25);

        scene.physics.add.existing(this.sprite, true);
    }

    open() {
        if (this.isOpen) return null;

        this.isOpen = true;
        this.lid.setY(-15);

        const items = ['key', 'slow', 'freeze', 'trap'];
        return items[Math.floor(Math.random() * items.length)];
    }

    getSprite() {
        return this.sprite;
    }
}