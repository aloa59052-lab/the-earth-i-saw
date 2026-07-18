// ==========================================
// MASTER APP ENGINE (CLEAN & BUG-FREE)
// ==========================================

window._SharedAppState = { 
    missionStats: { km: 16000, countries: 1, baseDays: 100, timerStartDate: null, isTimerActive: false }, 
    bagLayouts: [], 
    gearVault: [],
    wishlist: []
};

// লোকাল ব্যাকআপ চেক করা
try {
    const local = localStorage.getItem('TheEarthISaw_Backup');
    if (local) window._SharedAppState = JSON.parse(local);
} catch(e) {}

// DataBridge
window.DataBridge = {
    get: function() {
        return window._SharedAppState;
    },
    save: function(data) {
        window._SharedAppState = data;
        
        try { localStorage.setItem('TheEarthISaw_Backup', JSON.stringify(data)); } catch(e) {}

        if (window.CloudSyncEngine && typeof window.CloudSyncEngine.syncToDrive === 'function') {
            window.CloudSyncEngine.syncToDrive(data);
        }
    }
};

// --- Google Drive UI Controls ---
window.triggerCloudSync = function() {
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
        text.innerText = "ONLINE";
        text.style.color = "#4caf50";
        dot.classList.add("online");
    }
};

// অ্যাপ রিলোড হলে অটো-চেক করবে লগিন করা আছে কি না
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
            // ড্রাইভ থেকে নতুন ডেটা আসলে স্ক্রিন নিজে নিজে রিফ্রেশ হবে
            const frame = document.getElementById('module-frame');
            frame.src = frame.src; 
        }
    }
});