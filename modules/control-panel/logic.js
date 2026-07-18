// ==========================================
// CONTROL PANEL LOGIC (NEW ARCHITECTURE)
// ==========================================

let appState = null;

document.addEventListener("DOMContentLoaded", () => {
    // DataBridge থেকে লেটেস্ট ডেটা নিয়ে আসা
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    
    // সেফটি চেক
    if (!appState) appState = { missionStats: {}, bagLayouts: [], gearVault: [] };
    if (!appState.missionStats) appState.missionStats = { km: 16000, countries: 1, baseDays: 100, isTimerActive: false, timerStartDate: null };
    if (!appState.bagLayouts) appState.bagLayouts = [];
    if (!appState.gearVault) appState.gearVault = [];

    populateMissionInputs();
    renderAdminBagList();
    renderAdminGearList();
});

// মাস্টার সেভ ফাংশন (DataBridge এর মাধ্যমে)
function saveMasterData() {
    if (window.parent && window.parent.DataBridge) {
        window.parent.DataBridge.save(appState);
    }
}

function handleBackButton() {
    if (window.parent) window.parent.postMessage({ action: 'loadModule', module: 'mission-stats' }, '*');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- Mission Stats Logic ---
function calculateCurrentDays() {
    const stats = appState.missionStats;
    if (!stats.isTimerActive || !stats.timerStartDate) return stats.baseDays;
    const diffTime = Math.abs(Date.now() - stats.timerStartDate);
    return stats.baseDays + Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function populateMissionInputs() {
    document.getElementById('input-km').value = appState.missionStats.km;
    document.getElementById('input-countries').value = appState.missionStats.countries;
    document.getElementById('input-days').value = calculateCurrentDays();
    updateTimerStatusUI();
}

function saveMissionData() {
    appState.missionStats.km = parseInt(document.getElementById('input-km').value) || 0;
    appState.missionStats.countries = parseInt(document.getElementById('input-countries').value) || 0;
    appState.missionStats.baseDays = parseInt(document.getElementById('input-days').value) || 0;
    if (appState.missionStats.isTimerActive) appState.missionStats.timerStartDate = Date.now();
    
    saveMasterData();
    alert("📢 Mission Stats updated successfully!");
}

function startAutoCounter() {
    if(appState.missionStats.isTimerActive) return alert("Counter is already active!");
    appState.missionStats.isTimerActive = true;
    appState.missionStats.timerStartDate = Date.now();
    appState.missionStats.baseDays = parseInt(document.getElementById('input-days').value) || appState.missionStats.baseDays;
    saveMasterData();
    updateTimerStatusUI();
}

function stopAutoCounter() {
    if(!appState.missionStats.isTimerActive) return;
    appState.missionStats.baseDays = calculateCurrentDays();
    appState.missionStats.isTimerActive = false;
    appState.missionStats.timerStartDate = null;
    saveMasterData();
    document.getElementById('input-days').value = appState.missionStats.baseDays;
    updateTimerStatusUI();
}

function updateTimerStatusUI() {
    const statusTxt = document.getElementById('timerStatusText');
    if (appState.missionStats.isTimerActive) {
        statusTxt.innerHTML = `🟢 ACTIVE. Counting automatically...`;
        statusTxt.style.color = "#4caf50";
    } else {
        statusTxt.innerHTML = `🔴 INACTIVE. Stopped at day ${appState.missionStats.baseDays}.`;
        statusTxt.style.color = "#8b949e";
    }
}

// --- Image Compression Engine ---
function getCompressedBase64(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400; 
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = height * (MAX_WIDTH / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
}

// --- Bag Logic ---
function renderAdminBagList() {
    const container = document.getElementById('adminBagList');
    container.innerHTML = appState.bagLayouts.length === 0 ? '<p style="font-size:11px; color:#8b949e; text-align:center; padding:10px;">No bags found.</p>' : '';
    
    appState.bagLayouts.forEach(bag => {
        container.innerHTML += `
            <div class="list-item">
                <div class="list-item-left">
                    <img src="${bag.image}" class="list-item-img">
                    <div><div class="list-item-name">${bag.name}</div><div class="list-item-sub">${bag.capacity}</div></div>
                </div>
                <button class="btn-delete" onclick="deleteBag(${bag.id})">🗑️</button>
            </div>`;
    });
}

function addNewBag() {
    const name = document.getElementById('newBagName').value.trim();
    const cap = document.getElementById('newBagCapacity').value.trim();
    const fileInput = document.getElementById('newBagImage');
    
    if(!name || !cap || !fileInput.files[0]) return alert("All fields and image are required!");

    getCompressedBase64(fileInput.files[0], (base64Img) => {
        appState.bagLayouts.push({ id: Date.now(), name: name, capacity: cap, image: base64Img, compartments: [] });
        saveMasterData();
        renderAdminBagList();
        
        document.getElementById('newBagName').value = '';
        document.getElementById('newBagCapacity').value = '';
        fileInput.value = '';
    });
}

function deleteBag(id) {
    if(confirm("Permanently delete this bag and all its gear?")) {
        appState.bagLayouts = appState.bagLayouts.filter(b => b.id !== id);
        saveMasterData();
        renderAdminBagList();
    }
}

// --- Gear Category Logic ---
function renderAdminGearList() {
    const container = document.getElementById('adminGearList');
    container.innerHTML = appState.gearVault.length === 0 ? '<p style="font-size:11px; color:#8b949e; text-align:center; padding:10px;">No categories found.</p>' : '';
    
    appState.gearVault.forEach(cat => {
        container.innerHTML += `
            <div class="list-item">
                <div class="list-item-left">
                    <img src="${cat.image}" class="list-item-img" style="object-fit:cover;">
                    <div class="list-item-name">${cat.name}</div>
                </div>
                <button class="btn-delete" onclick="deleteGearCategory(${cat.id})">🗑️</button>
            </div>`;
    });
}

function addNewGearCategory() {
    const name = document.getElementById('newGearCatName').value.trim();
    const fileInput = document.getElementById('newGearCatImage');
    
    if(!name || !fileInput.files[0]) return alert("Please specify name and cover photo!");

    getCompressedBase64(fileInput.files[0], (base64Img) => {
        appState.gearVault.push({ id: Date.now(), name: name, image: base64Img, items: [] });
        saveMasterData();
        renderAdminGearList();
        
        document.getElementById('newGearCatName').value = '';
        fileInput.value = '';
    });
}

function deleteGearCategory(id) {
    if(confirm("Delete this category and all its items?")) {
        appState.gearVault = appState.gearVault.filter(c => c.id !== id);
        saveMasterData();
        renderAdminGearList();
    }
}