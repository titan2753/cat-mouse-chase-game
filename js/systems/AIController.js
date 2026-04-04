// AI控制器 - 控制猫追逐和老鼠逃跑的AI逻辑
class AIController {
    constructor(scene, entity, role) {
        this.scene = scene;
        this.entity = entity;
        this.role = role; // 'cat' or 'mouse'
        this.target = null;
        this.updateInterval = 500; // AI更新间隔(毫秒)
        this.lastUpdate = 0;
        this.fleeDistance = 200; // 老鼠开始逃跑的距离
        this.randomMoveRange = 200; // 随机移动范围
    }

    /**
     * 设置AI追逐/逃跑的目标
     * @param {Object} targetEntity - 目标实体(需要有getPosition方法)
     */
    setTarget(targetEntity) {
        this.target = targetEntity;
    }

    /**
     * 更新AI逻辑
     * @param {number} time - 当前游戏时间
     * @param {Array} obstacles - 障碍物数组
     */
    update(time, obstacles) {
        if (!this.target) return;

        // 控制更新频率，避免每帧都计算
        if (time - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = time;

        const targetPos = this.target.getPosition();
        const myPos = this.entity.getPosition();

        if (!targetPos || !myPos) return;

        if (this.role === 'cat') {
            // 猫追逐老鼠 - 直接向目标移动
            this.entity.update(targetPos.x, targetPos.y, obstacles);
        } else {
            // 老鼠逃跑逻辑
            this.updateMouseAI(targetPos, myPos, obstacles);
        }
    }

    /**
     * 老鼠AI逻辑 - 当猫靠近时逃跑，否则随机移动或寻找宝箱
     * @param {Object} catPos - 猫的位置
     * @param {Object} mousePos - 老鼠的位置
     * @param {Array} obstacles - 障碍物数组
     */
    updateMouseAI(catPos, mousePos, obstacles) {
        const dx = mousePos.x - catPos.x;
        const dy = mousePos.y - catPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.fleeDistance) {
            // 猫靠近时逃跑 - 向远离猫的方向移动
            const fleeX = mousePos.x + dx * 0.5;
            const fleeY = mousePos.y + dy * 0.5;
            this.entity.update(fleeX, fleeY, obstacles);
        } else {
            // 猫较远时随机移动
            const randomX = mousePos.x + (Math.random() - 0.5) * this.randomMoveRange;
            const randomY = mousePos.y + (Math.random() - 0.5) * this.randomMoveRange;
            this.entity.update(randomX, randomY, obstacles);
        }
    }

    /**
     * 获取朝向某点的方向
     * @param {number} targetX - 目标X坐标
     * @param {number} targetY - 目标Y坐标
     * @param {Object} currentPos - 当前位置 {x, y}
     * @returns {string} 方向 ('up', 'down', 'left', 'right')
     */
    getDirectionToPoint(targetX, targetY, currentPos) {
        const dx = targetX - currentPos.x;
        const dy = targetY - currentPos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    /**
     * 设置AI更新间隔
     * @param {number} interval - 更新间隔(毫秒)
     */
    setUpdateInterval(interval) {
        this.updateInterval = interval;
    }

    /**
     * 设置逃跑距离
     * @param {number} distance - 逃跑触发距离
     */
    setFleeDistance(distance) {
        this.fleeDistance = distance;
    }

    /**
     * 获取当前目标
     * @returns {Object} 目标实体
     */
    getTarget() {
        return this.target;
    }
}