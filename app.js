// ==========================================
// MASTER APP ENGINE (SECURE BACKUP SYSTEM)
// ==========================================

window._SharedAppState = { 
    missionStats: { km: 0, countries: 0, baseDays: 0, timerStartDate: null, isTimerActive: false }, 
    bagLayouts: [], 
    gearVault: [],
    wishlist: [],
    lastUpdated: 0 
};

try {
    const local = localStorage.getItem('TheEarthISaw_Backup');
    if (local) window._SharedAppState = JSON.parse(local);
} catch(e) {}

window.DataBridge = {
    get: function() { return window._SharedAppState; },
    save: function(data, skipCloudSync = false) {
        data.lastUpdated = Date.now(); 
        window._SharedAppState = data;
        try { localStorage.setItem('TheEarthISaw_Backup', JSON.stringify(data)); } catch(e) {}

        if (!skipCloudSync && navigator.onLine && window.CloudSyncEngine && typeof window.CloudSyncEngine.syncToDrive === 'function') {
            window.CloudSyncEngine.syncToDrive(data);
        }
    }
};

// --- Offline Manual Backup System ---
window.downloadOfflineBackup = function() {
    const currentData = window.DataBridge.get();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", "TheEarthISaw_Backup_" + date + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("✅ Offline Backup Downloaded Successfully!");
};

window.restoreOfflineBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && importedData.missionStats) {
                window.DataBridge.save(importedData);
                alert("🎉 Backup Restored Successfully!");
                const frame = document.getElementById('module-frame');
                frame.src = frame.src; 
            } else {
                alert("❌ Invalid Backup File.");
            }
        } catch (error) { alert("❌ Error reading backup file."); }
    };
    reader.readAsText(file);
};

// --- Google Drive UI Controls ---
window.triggerCloudSync = function() {
    if (!navigator.onLine) return alert("You are currently offline.");
    if (window.CloudSyncEngine) {
        document.getElementById('cloud-status-text').innerText = "CONNECTING...";
        document.getElementById('cloud-status-text').style.color = "#ff3d00"; 
        window.CloudSyncEngine.authorize(() => setCloudOnline());
    }
};

window.setCloudOnline = function() {
    const text = document.getElementById('cloud-status-text');
    const dot = document.getElementById('cloud-status-dot');
    if (text && dot) {
        text.innerText = navigator.onLine ? "ONLINE" : "OFFLINE";
        text.style.color = navigator.onLine ? "#4caf50" : "#ff3d00";
        dot.className = navigator.onLine ? "status-dot online" : "status-dot offline";
    }
};

window.addEventListener('online', () => {
    setCloudOnline();
    if (localStorage.getItem('gdrive_token') && window.CloudSyncEngine) {
        window.CloudSyncEngine.syncToDrive(window.DataBridge.get());
    }
});
window.addEventListener('offline', () => setCloudOnline());

setTimeout(() => { if (localStorage.getItem('gdrive_token')) setCloudOnline(); }, 2000);

window.addEventListener('message', function(e) {
    if (e.data) {
        if (e.data.action === 'loadModule') {
            const frame = document.getElementById('module-frame');
            frame.style.opacity = '0';
            setTimeout(() => {
                frame.src = `modules/${e.data.module}/ui.html`;
                frame.onload = () => frame.style.opacity = '1';
            }, 200);
        } else if (e.data.action === 'cloudDataUpdated') {
            const frame = document.getElementById('module-frame');
            frame.src = frame.src; 
        }
    }
});