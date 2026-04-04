class Obstacle {
    constructor(scene, x, y, width, height, type = 'wall') {
        this.scene = scene;
        this.type = type;

        const colors = {
            wall: 0x8B4513,
            furniture: 0xD2691E,
            moving: 0x424242
        };

        this.sprite = scene.add.rectangle(x, y, width, height, colors[type]);
        scene.physics.add.existing(this.sprite, true);

        if (type === 'moving') {
            this.startX = x;
            this.moveRange = 100;
            this.moveSpeed = 50;
            this.direction = 1;
        }
    }

    update() {
        if (this.type === 'moving') {
            const currentX = this.sprite.x;
            if (currentX > this.startX + this.moveRange || currentX < this.startX - this.moveRange) {
                this.direction *= -1;
            }
            this.sprite.x += this.moveSpeed * this.direction * 0.016;
            this.sprite.body.updateFromGameObject();
        }
    }

    getSprite() {
        return this.sprite;
    }
}