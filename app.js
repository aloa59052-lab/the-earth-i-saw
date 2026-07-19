// ==========================================
// MASTER APP ENGINE (OFFLINE & SYNC READY)
// ==========================================

window._SharedAppState = { 
    missionStats: { km: 16000, countries: 1, baseDays: 100, timerStartDate: null, isTimerActive: false }, 
    bagLayouts: [], 
    gearVault: [],
    wishlist: []
};

// অ্যাপ ওপেন হলে সবার আগে লোকাল ব্যাকআপ চেক করবে (অফলাইন ডাটা)
try {
    const local = localStorage.getItem('TheEarthISaw_Backup');
    if (local) window._SharedAppState = JSON.parse(local);
} catch(e) {}

// DataBridge - ডাটা সেভ এবং সিঙ্ক করার মূল জায়গা
window.DataBridge = {
    get: function() {
        return window._SharedAppState;
    },
    save: function(data) {
        window._SharedAppState = data;
        
        // সব সময় আগে মোবাইলের লোকাল স্টোরেজে সেভ করবে (অফলাইনের জন্য)
        try { localStorage.setItem('TheEarthISaw_Backup', JSON.stringify(data)); } catch(e) {}

        // ইন্টারনেট থাকলে ক্লাউডে পাঠিয়ে দেবে
        if (navigator.onLine && window.CloudSyncEngine && typeof window.CloudSyncEngine.syncToDrive === 'function') {
            window.CloudSyncEngine.syncToDrive(data);
        } else {
            console.log("Saved locally. Will sync when online.");
        }
    }
};

// --- Google Drive UI Controls ---
window.triggerCloudSync = function() {
    if (!navigator.onLine) {
        alert("You are currently offline. Data is saved securely on this device.");
        return;
    }

    if (window.CloudSyncEngine) {
        document.getElementById('cloud-status-text').innerText = "CONNECTING...";
        document.getElementById('cloud-status-text').style.color = "#ff3d00"; 
        
        window.CloudSyncEngine.authorize(() => {
            setCloudOnline();
            window.CloudSyncEngine.syncToDrive(window.DataBridge.get());
            alert("✅ Successfully connected and synced with Google Drive!");
        });
    } else {
        alert("Cloud Sync Engine not loaded properly.");
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

// --- Auto-Sync on Internet Connection ---
window.addEventListener('online', () => {
    setCloudOnline();
    // ইন্টারনেট আসলে লোকাল স্টোরেজের ডাটা ক্লাউডে পুশ করবে
    if (localStorage.getItem('gdrive_token') && window.CloudSyncEngine) {
        window.CloudSyncEngine.syncToDrive(window.DataBridge.get());
    }
});

window.addEventListener('offline', () => {
    setCloudOnline();
});

// অ্যাপ রিলোড হলে অটো-চেক করবে
setTimeout(() => {
    if (localStorage.getItem('gdrive_token')) {
        setCloudOnline();
    }
}, 2000);

// রাউটার এবং ক্লাউড আপডেট লিসেনার
window.addEventListener('message', function(e) {
    if (e.data) {
        if (e.data.action === 'loadModule') {
            const frame = document.getElementById('module-frame');
            frame.style.opacity = '0';
            setTimeout(() => {
                frame.src = `modules/${e.data.module}/ui.html`;
                frame.onload = () => frame.style.opacity = '1';
            }, 200);
        } 
        else if (e.data.action === 'cloudDataUpdated') {
            const frame = document.getElementById('module-frame');
            frame.src = frame.src; 
        }
    }
});