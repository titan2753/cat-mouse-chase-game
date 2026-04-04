class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = this.checkMobile();
        this.currentDirection = 'stop';
        this.joystickBase = null;
        this.joystickKnob = null;
        this.hintContainer = null;
        this.cursors = null;
        this.wasd = null;

        this.createControls();
    }

    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 800 && window.innerHeight <= 900);
    }

    createControls() {
        if (this.isMobile) {
            this.createVirtualJoystick();
        } else {
            this.createKeyboardControls();
            this.createWASDHint();
        }
    }

    createKeyboardControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR
        });
    }

    createWASDHint() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.hintContainer = this.scene.add.container(width - 60, height - 100);

        // W键（在S上方）
        const wKey = this.createKeyButton(0, -45, 'W');

        // A S D 一行
        const aKey = this.createKeyButton(-45, 0, 'A');
        const sKey = this.createKeyButton(0, 0, 'S');
        const dKey = this.createKeyButton(45, 0, 'D');

        this.hintContainer.add([wKey, aKey, sKey, dKey]);
    }

    createKeyButton(x, y, label) {
        const key = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 38, 38, 0xFFFFFF);
        bg.setStrokeStyle(2, 0x999999);

        const text = this.scene.add.text(0, 0, label, {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#8B008B',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        key.add([bg, text]);
        return key;
    }

    createVirtualJoystick() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // 摇杆外圈
        this.joystickBase = this.scene.add.circle(100, height - 100, 50, 0x000000, 0.15);
        this.joystickBase.setStrokeStyle(3, 0xFFFFFF, 0.4);

        // 摇杆内圈
        this.joystickKnob = this.scene.add.circle(100, height - 100, 25, 0xFFFFFF, 0.7);
        this.joystickKnob.setInteractive({ draggable: true });

        this.scene.input.setDraggable(this.joystickKnob);

        const baseX = 100;
        const baseY = height - 100;
        const maxDist = 50;

        this.joystickKnob.on('drag', (pointer, dragX, dragY) => {
            const dx = dragX - baseX;
            const dy = dragY - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > maxDist) {
                dragX = baseX + (dx / dist) * maxDist;
                dragY = baseY + (dy / dist) * maxDist;
            }

            this.joystickKnob.setPosition(dragX, dragY);

            if (dist > 10) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDirection = dx > 0 ? 'right' : 'left';
                } else {
                    this.currentDirection = dy > 0 ? 'down' : 'up';
                }
            } else {
                this.currentDirection = 'stop';
            }
        });

        this.joystickKnob.on('dragend', () => {
            this.joystickKnob.setPosition(baseX, baseY);
            this.currentDirection = 'stop';
        });
    }

    getDirection() {
        if (this.isMobile) {
            return this.currentDirection;
        }

        if (this.wasd.up.isDown) return 'up';
        if (this.wasd.down.isDown) return 'down';
        if (this.wasd.left.isDown) return 'left';
        if (this.wasd.right.isDown) return 'right';
        return 'stop';
    }

    getItemKey() {
        if (this.isMobile) return null;

        if (Phaser.Input.Keyboard.JustDown(this.wasd.one)) return 0;
        if (Phaser.Input.Keyboard.JustDown(this.wasd.two)) return 1;
        if (Phaser.Input.Keyboard.JustDown(this.wasd.three)) return 2;
        if (Phaser.Input.Keyboard.JustDown(this.wasd.four)) return 3;
        return null;
    }

    isMobileDevice() {
        return this.isMobile;
    }
}