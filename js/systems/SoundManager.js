// 音效系统 - 使用Web Audio API生成音效
class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.bgmOscillator = null;
        this.bgmGain = null;
        this.isBgmPlaying = false;
        this.bgmType = 'normal'; // normal, chase, win, lose

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // 确保音频上下文激活
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // 播放BGM
    startBGM(type = 'normal') {
        if (!this.audioContext || this.isBgmPlaying) return;

        this.resumeContext();
        this.isBgmPlaying = true;
        this.bgmType = type;

        this.playBGMLoop();
    }

    playBGMLoop() {
        if (!this.isBgmPlaying) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 创建振荡器
        this.bgmOscillator = ctx.createOscillator();
        this.bgmGain = ctx.createGain();

        // 根据类型设置不同的音调
        const frequencies = {
            normal: [262, 330, 392, 330], // C-E-G-E (欢快)
            chase: [392, 440, 494, 440], // G-A-B-A (紧张)
            win: [523, 659, 784, 1047],  // C5-E5-G5-C6 (胜利)
            lose: [196, 175, 165, 156]   // G3-F3-E3-D#3 (悲伤)
        };

        const freqs = frequencies[this.bgmType] || frequencies.normal;
        const noteDuration = this.bgmType === 'chase' ? 0.15 : 0.3;

        this.bgmOscillator.connect(this.bgmGain);
        this.bgmGain.connect(ctx.destination);
        this.bgmGain.gain.value = 0.1;

        // 播放旋律
        let time = now;
        freqs.forEach((freq, i) => {
            this.bgmOscillator.frequency.setValueAtTime(freq, time);
            time += noteDuration;
        });

        this.bgmOscillator.type = 'sine';
        this.bgmOscillator.start(now);
        this.bgmOscillator.stop(time);

        // 循环播放
        this.bgmTimeout = setTimeout(() => {
            if (this.isBgmPlaying) {
                this.playBGMLoop();
            }
        }, (noteDuration * freqs.length + 0.1) * 1000);
    }

    // 停止BGM
    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
        }
        if (this.bgmOscillator) {
            try {
                this.bgmOscillator.stop();
            } catch (e) {}
        }
    }

    // 切换BGM类型
    changeBGMType(type) {
        if (this.bgmType !== type) {
            this.bgmType = type;
            // 重启BGM
            if (this.isBgmPlaying) {
                this.stopBGM();
                this.startBGM(type);
            }
        }
    }

    // 播放开宝箱音效
    playChestOpen() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.type = 'sine';
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    // 播放获得道具音效
    playItemPickup() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.type = 'square';
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    // 播放使用道具音效
    playItemUse() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.type = 'sawtooth';
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    // 播放被抓音效
    playCaught() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.type = 'sawtooth';
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);

        this.changeBGMType('lose');
    }

    // 播放逃跑成功音效
    playEscape() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const notes = [523, 659, 784, 1047];
        const duration = 0.15;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0, ctx.currentTime + i * duration);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * duration + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * duration);

            osc.start(ctx.currentTime + i * duration);
            osc.stop(ctx.currentTime + (i + 1) * duration);
        });

        this.changeBGMType('win');
    }

    // 播放胜利音效
    playWin() {
        this.playEscape();
    }

    // 播放失败音效
    playLose() {
        this.playCaught();
    }

    // 播放按钮点击音效
    playClick() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 600;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }

    // 播放警告音效（猫靠近时）
    playWarning() {
        if (!this.audioContext) return;
        this.resumeContext();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 200;
        osc.type = 'square';

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }
}