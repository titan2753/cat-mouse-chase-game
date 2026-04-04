class ItemSystem {
    constructor(scene) {
        this.scene = scene;
        this.items = [null, null, null, null];
        this.uiSlots = [];
        this.container = null;
        this.createUI();
    }

    createUI() {
        const height = this.scene.cameras.main.height;

        this.container = this.scene.add.container(100, height - 50);
        this.container.setScrollFactor(0);
        this.container.setDepth(100);

        for (let i = 0; i < 4; i++) {
            const slot = this.scene.add.container(i * 55, 0);

            const bg = this.scene.add.rectangle(0, 0, 42, 42, 0xCCCCCC, 0.95);
            bg.setStrokeStyle(2, 0xFF69B4);

            const itemIcon = this.scene.add.text(0, 0, '', { fontSize: '18px' }).setOrigin(0.5);
            const keyLabel = this.scene.add.text(0, 25, (i + 1).toString(), {
                fontSize: '10px',
                color: '#8B008B'
            }).setOrigin(0.5);

            slot.add([bg, itemIcon, keyLabel]);
            this.uiSlots.push({ slot, icon: itemIcon, bg });
            this.container.add(slot);

            slot.setSize(42, 42);
            slot.setInteractive();
            slot.on('pointerdown', () => this.useItem(i));
        }
    }

    addItem(itemType) {
        const emptySlot = this.items.findIndex(item => item === null);
        if (emptySlot === -1) return false;

        this.items[emptySlot] = itemType;
        this.updateUI();
        return true;
    }

    updateUI() {
        const icons = { key: '🔑', slow: '⏱️', freeze: '❄️', trap: '🪤' };
        const colors = { key: '#FFD700', slow: '#64B5F6', freeze: '#81C784', trap: '#F8BBD0' };

        this.items.forEach((item, i) => {
            if (item) {
                this.uiSlots[i].icon.setText(icons[item]);
                const color = Phaser.Display.Color.HexStringToColor(colors[item]).color;
                this.uiSlots[i].bg.setFillStyle(color);
            } else {
                this.uiSlots[i].icon.setText('');
                this.uiSlots[i].bg.setFillStyle(0xCCCCCC);
            }
        });
    }

    useItem(slotIndex) {
        const item = this.items[slotIndex];
        if (!item) return null;

        this.items[slotIndex] = null;
        this.updateUI();
        return item;
    }

    hasKey() {
        return this.items.includes('key');
    }

    useKey() {
        const keyIndex = this.items.findIndex(item => item === 'key');
        if (keyIndex !== -1) {
            this.items[keyIndex] = null;
            this.updateUI();
            return true;
        }
        return false;
    }

    getItemCount() {
        return this.items.filter(item => item !== null).length;
    }

    hasItem(itemType) {
        return this.items.includes(itemType);
    }

    clear() {
        this.items = [null, null, null, null];
        this.updateUI();
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}