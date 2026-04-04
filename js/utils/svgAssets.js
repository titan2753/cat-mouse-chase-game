// SVG角色资源定义
const SVG_ASSETS = {
    cat: `<svg viewBox="0 0 55 70" width="55" height="70">
        <ellipse cx="27" cy="50" rx="20" ry="15" fill="#FFA500"/>
        <circle cx="27" cy="35" r="18" fill="#FFA500"/>
        <polygon points="12,22 16,8 20,22" fill="#FFA500"/>
        <polygon points="35,22 39,8 43,22" fill="#FFA500"/>
        <polygon points="14,20 17,7 19,20" fill="#FFE4B5"/>
        <polygon points="37,20 40,7 42,20" fill="#FFE4B5"/>
        <circle cx="20" cy="30" r="5" fill="#333"/>
        <circle cx="34" cy="30" r="5" fill="#333"/>
        <circle cx="21" cy="28" r="2" fill="#FFF"/>
        <circle cx="35" cy="28" r="2" fill="#FFF"/>
        <ellipse cx="27" cy="38" rx="4" ry="3" fill="#FF69B4"/>
        <path d="M22,41 Q27,46 32,41" stroke="#333" fill="none" stroke-width="2"/>
        <line x1="15" y1="35" x2="5" y2="32" stroke="#333" stroke-width="1.5"/>
        <line x1="15" y1="38" x2="5" y2="38" stroke="#333" stroke-width="1.5"/>
        <line x1="40" y1="35" x2="50" y2="32" stroke="#333" stroke-width="1.5"/>
        <line x1="40" y1="38" x2="50" y2="38" stroke="#333" stroke-width="1.5"/>
    </svg>`,

    mouse: `<svg viewBox="0 0 45 55" width="45" height="55">
        <ellipse cx="22" cy="40" rx="14" ry="10" fill="#C0C0C0"/>
        <circle cx="22" cy="28" r="12" fill="#C0C0C0"/>
        <circle cx="22" cy="24" r="10" fill="#FFE4E1"/>
        <ellipse cx="14" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="30" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="15" cy="17" rx="5" ry="6" fill="#FFE4B5"/>
        <ellipse cx="29" cy="17" rx="5" ry="6" fill="#FFE4B5"/>
        <circle cx="17" cy="26" r="3" fill="#333"/>
        <circle cx="27" cy="26" r="3" fill="#333"/>
        <circle cx="18" cy="25" r="1" fill="#FFF"/>
        <circle cx="28" cy="25" r="1" fill="#FFF"/>
        <ellipse cx="22" cy="30" rx="2" ry="1.5" fill="#FF69B4"/>
    </svg>`,

    catSad: `<svg viewBox="0 0 55 70" width="55" height="70">
        <ellipse cx="27" cy="50" rx="20" ry="15" fill="#FFA500"/>
        <circle cx="27" cy="35" r="18" fill="#FFA500"/>
        <polygon points="12,22 16,8 20,22" fill="#FFA500"/>
        <polygon points="35,22 39,8 43,22" fill="#FFA500"/>
        <ellipse cx="20" cy="32" rx="5" ry="3" fill="#333"/>
        <ellipse cx="34" cy="32" rx="5" ry="3" fill="#333"/>
        <path d="M24,38 Q27,34 30,38" stroke="#333" fill="none" stroke-width="2"/>
        <path d="M15,40 L8,45" stroke="#333" stroke-width="2"/>
        <path d="M40,40 L47,45" stroke="#333" stroke-width="2"/>
    </svg>`,

    mouseSad: `<svg viewBox="0 0 45 55" width="45" height="55">
        <ellipse cx="22" cy="40" rx="14" ry="10" fill="#C0C0C0"/>
        <circle cx="22" cy="28" r="12" fill="#C0C0C0"/>
        <circle cx="22" cy="24" r="10" fill="#FFE4E1"/>
        <ellipse cx="14" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="30" cy="16" rx="7" ry="9" fill="#C0C0C0"/>
        <ellipse cx="17" cy="28" rx="3" ry="4" fill="#333"/>
        <ellipse cx="27" cy="28" rx="3" ry="4" fill="#333"/>
        <path d="M18,34 Q22,30 26,34" stroke="#333" fill="none" stroke-width="2"/>
    </svg>`
};