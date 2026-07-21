document.addEventListener("DOMContentLoaded", () => {
    loadStatsFromMasterData();
});

function loadStatsFromMasterData() {
    let appState = null;
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    
    if (!appState || !appState.missionStats) {
        appState = { missionStats: { km: 0, countries: 0, baseDays: 0 } };
    }

    const stats = appState.missionStats;
    triggerAnimations(stats.km, stats.countries, stats.baseDays);
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

// মেইন উইন্ডোর ফাংশন কল করে পেজ পরিবর্তন করা
function openModule(moduleId) {
    if (window.parent && typeof window.parent.triggerModuleLoad === 'function') {
        window.parent.triggerModuleLoad(moduleId);
    }
}