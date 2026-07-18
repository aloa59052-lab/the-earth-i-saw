// ==========================================
// MISSION STATS LOGIC (LIVE SERVER OPTIMIZED)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadStatsFromMasterData();
});

function loadStatsFromMasterData() {
    // নতুন আর্কিটেকচার অনুযায়ী মেইন উইন্ডো থেকে ডেটা নেওয়া
    let appState = null;
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    
    // সেফটি ফলব্যাক
    if (!appState || !appState.missionStats) {
        appState = { missionStats: { km: 16000, countries: 1, baseDays: 100, isTimerActive: false, timerStartDate: null } };
    }

    const stats = appState.missionStats;
    let currentDays = stats.baseDays;

    if (stats.isTimerActive && stats.timerStartDate) {
        const now = Date.now();
        const diffTime = Math.abs(now - stats.timerStartDate);
        currentDays += Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    triggerAnimations(stats.km, stats.countries, currentDays);
}

function animateCounter(id, start, end, duration, padZero = false) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); 
        let currentVal = Math.floor(easeProgress * (end - start) + start);
        
        if (padZero && currentVal < 10) obj.innerHTML = "0" + currentVal;
        else obj.innerHTML = currentVal;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = padZero && end < 10 ? "0" + end : end;
        }
    };
    window.requestAnimationFrame(step);
}

function triggerAnimations(km, countries, days) {
    animateCounter("count-km", 0, km, 2000, false);
    animateCounter("count-countries", 0, countries, 2000, true); 
    animateCounter("count-days", 0, days, 2000, false);
}

// মেইন উইন্ডোর রাউটারে মেসেজ পাঠিয়ে পেজ পরিবর্তন
function openModule(moduleId) {
    if (window.parent) {
        window.parent.postMessage({ action: 'loadModule', module: moduleId }, '*');
    }
}