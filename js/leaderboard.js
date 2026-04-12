// ===== 排行榜模块 =====
// 使用腾讯云 CloudBase 存储玩家记录

// CloudBase 环境 ID
const CLOUDBASE_ENV_ID = 'becareful-5gg0kklye6d3079d';

// 初始化 CloudBase
let tcbApp = null;
let db = null;
let pendingRoleSelection = null;

// 初始化 CloudBase SDK
function initCloudBase() {
    if (tcbApp) return tcbApp;

    try {
        // 检查 tcb 是否已加载
        if (typeof tcb === 'undefined') {
            console.warn('CloudBase SDK 未加载，跳过初始化');
            return null;
        }

        tcbApp = tcb.init({
            env: CLOUDBASE_ENV_ID
        });
        db = tcbApp.database();
        console.log('CloudBase 初始化成功');
        return tcbApp;
    } catch (e) {
        console.error('CloudBase 初始化失败:', e);
        return null;
    }
}

// 获取排行榜数据
async function getLeaderboard() {
    initCloudBase();

    if (!db) {
        console.error('数据库未初始化');
        return [];
    }

    try {
        const result = await db
            .collection('leaderboard')
            .orderBy('level', 'desc')
            .limit(10)
            .get();

        console.log('排行榜数据:', result.data);
        return result.data || [];
    } catch (e) {
        console.error('获取排行榜失败:', e);
        return [];
    }
}

// 上传游戏记录
async function uploadRecord(name, level, role) {
    initCloudBase();

    if (!db) {
        console.error('数据库未初始化');
        return false;
    }

    if (!name || name.trim() === '') {
        console.log('昵称为空，不上传记录');
        return false;
    }

    try {
        await db.collection('leaderboard').add({
            name: name.trim(),
            level: level,
            role: role,
            timestamp: Date.now()
        });

        console.log('记录上传成功:', name, level, role);
        return true;
    } catch (e) {
        console.error('上传记录失败:', e);
        return false;
    }
}

// 显示排行榜弹窗
async function showLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    const listContainer = document.getElementById('leaderboard-list');

    // 显示加载状态
    listContainer.innerHTML = '<div class="leaderboard-loading">加载中...</div>';
    modal.classList.add('active');

    // 获取排行榜数据
    const records = await getLeaderboard();

    // 获取当前用户昵称
    const userNickname = getSavedNickname();

    if (records.length === 0) {
        listContainer.innerHTML = `
            <div class="leaderboard-empty">暂无记录，快来挑战吧！</div>
            ${userNickname ? `<div class="leaderboard-user-info">你的昵称：${userNickname}</div>` : ''}
        `;
        return;
    }

    // 渲染排行榜
    let html = '';

    // 显示用户昵称
    if (userNickname) {
        html += `<div class="leaderboard-user-info">你的昵称：${userNickname}</div>`;
    }

    records.forEach((record, index) => {
        const rankIcon = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}`;
        const roleIcon = record.role === 'mouse' ? '🐭' : '🐱';
        const time = formatTime(record.timestamp);

        html += `
            <div class="leaderboard-item ${index < 3 ? 'top-rank' : ''}">
                <div class="rank">${rankIcon}</div>
                <div class="player-name">${record.name}</div>
                <div class="player-role">${roleIcon}</div>
                <div class="player-level">${record.level}关</div>
                <div class="player-time">${time}</div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// 关闭排行榜弹窗
function closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.remove('active');
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

// 获取保存的昵称
function getSavedNickname() {
    return localStorage.getItem('catMouseGame_nickname') || '';
}

// 保存昵称
function saveNickname(name) {
    localStorage.setItem('catMouseGame_nickname', name);
}

// 检查是否是首次玩游戏（没有昵称）
function isFirstTimePlayer() {
    return !localStorage.getItem('catMouseGame_nickname') && !localStorage.getItem('catMouseGame_hasPlayed');
}

// 显示昵称输入弹窗
function showNicknameModal(role) {
    pendingRoleSelection = role;
    const modal = document.getElementById('nickname-modal');
    const input = document.getElementById('nickname-input-modal');

    modal.classList.add('active');
    input.value = '';
    input.focus();
}

// 关闭昵称弹窗
function closeNicknameModal() {
    document.getElementById('nickname-modal').classList.remove('active');
    pendingRoleSelection = null;
}

// 确认昵称
function confirmNickname() {
    const input = document.getElementById('nickname-input-modal');
    const nickname = input.value.trim();

    if (nickname) {
        saveNickname(nickname);
    }

    // 标记已玩过游戏
    localStorage.setItem('catMouseGame_hasPlayed', 'true');

    closeNicknameModal();

    // 继续选择角色
    if (pendingRoleSelection) {
        selectRoleInternal(pendingRoleSelection);
    }
}

// 跳过昵称输入
function skipNickname() {
    localStorage.setItem('catMouseGame_hasPlayed', 'true');
    closeNicknameModal();

    if (pendingRoleSelection) {
        selectRoleInternal(pendingRoleSelection);
    }
}

// 内部选择角色函数（不检查昵称）
function selectRoleInternal(role) {
    soundManager.init();
    soundManager.playClick();

    GameState.selectedRole = role;

    // 更新卡片样式
    const cards = document.querySelectorAll('.role-card');
    cards.forEach(card => {
        card.classList.remove('selected', 'mouse-selected', 'cat-selected');
    });

    const selectedCard = document.querySelector(`.role-card[data-role="${role}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected', `${role}-selected`);
    }

    // 启用开始按钮
    const startBtn = document.getElementById('start-btn');
    startBtn.classList.remove('disabled');
}

// 检查是否需要上传记录（只有超过或等于最佳记录才上传）
async function checkAndUploadRecord(level, role) {
    const nickname = getSavedNickname();
    const bestRecord = GameState.bestRecord || 0;

    // 只有达到或超过最佳记录才上传
    if (level >= bestRecord && nickname) {
        await uploadRecord(nickname, level, role);
    }
}