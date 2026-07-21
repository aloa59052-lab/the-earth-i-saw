let appState = null;

document.addEventListener("DOMContentLoaded", () => {
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    if (!appState) appState = { missionStats: { km:0, countries:0, baseDays:0 }, bagLayouts: [], gearVault: [] };
    
    populateMissionInputs();
    renderAdminBagList();
    renderAdminGearList();
});

function saveMasterData() {
    if (window.parent && window.parent.DataBridge) {
        window.parent.DataBridge.save(appState);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- Mission Stats ---
function populateMissionInputs() {
    document.getElementById('input-km').value = appState.missionStats.km || 0;
    document.getElementById('input-countries').value = appState.missionStats.countries || 0;
    document.getElementById('input-days').value = appState.missionStats.baseDays || 0;
}

function saveMissionData() {
    appState.missionStats.km = parseInt(document.getElementById('input-km').value) || 0;
    appState.missionStats.countries = parseInt(document.getElementById('input-countries').value) || 0;
    appState.missionStats.baseDays = parseInt(document.getElementById('input-days').value) || 0;
    saveMasterData();
    alert("📢 Mission Stats updated successfully!");
}

// --- Backup & Restore (Triggers Parent Functions) ---
function triggerDownload() {
    if (window.parent && typeof window.parent.downloadOfflineBackup === 'function') {
        window.parent.downloadOfflineBackup();
    } else {
        alert("Backup engine not connected.");
    }
}

function triggerRestore(event) {
    if (window.parent && typeof window.parent.restoreOfflineBackup === 'function') {
        window.parent.restoreOfflineBackup(event);
    }
}

// --- Image Compression ---
function getCompressedBase64(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width, height = img.height;
            if (width > 400) { height = height * (400 / width); width = 400; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
}

// --- Bag & Gear Logic ---
function renderAdminBagList() {
    const container = document.getElementById('adminBagList');
    container.innerHTML = '';
    if(!appState.bagLayouts) appState.bagLayouts = [];
    appState.bagLayouts.forEach(bag => {
        container.innerHTML += `
            <div class="list-item">
                <div class="list-item-left"><img src="${bag.image}" class="list-item-img"><div><div class="list-item-name">${bag.name}</div></div></div>
                <button class="btn-delete" onclick="deleteBag(${bag.id})">🗑️</button>
            </div>`;
    });
}

function addNewBag() {
    const name = document.getElementById('newBagName').value.trim();
    const cap = document.getElementById('newBagCapacity').value.trim();
    const file = document.getElementById('newBagImage').files[0];
    if(!name || !cap || !file) return alert("All fields required!");
    getCompressedBase64(file, (base64Img) => {
        appState.bagLayouts.push({ id: Date.now(), name: name, capacity: cap, image: base64Img, compartments: [] });
        saveMasterData(); renderAdminBagList();
    });
}

function deleteBag(id) {
    if(confirm("Delete this bag?")) {
        appState.bagLayouts = appState.bagLayouts.filter(b => b.id !== id);
        saveMasterData(); renderAdminBagList();
    }
}

function renderAdminGearList() {
    const container = document.getElementById('adminGearList');
    container.innerHTML = '';
    if(!appState.gearVault) appState.gearVault = [];
    appState.gearVault.forEach(cat => {
        container.innerHTML += `
            <div class="list-item">
                <div class="list-item-left"><img src="${cat.image}" class="list-item-img"><div class="list-item-name">${cat.name}</div></div>
                <button class="btn-delete" onclick="deleteGearCat(${cat.id})">🗑️</button>
            </div>`;
    });
}

function addNewGearCategory() {
    const name = document.getElementById('newGearCatName').value.trim();
    const file = document.getElementById('newGearCatImage').files[0];
    if(!name || !file) return alert("Fields required!");
    getCompressedBase64(file, (base64Img) => {
        appState.gearVault.push({ id: Date.now(), name: name, image: base64Img, items: [] });
        saveMasterData(); renderAdminGearList();
    });
}

function deleteGearCat(id) {
    if(confirm("Delete category?")) {
        appState.gearVault = appState.gearVault.filter(c => c.id !== id);
        saveMasterData(); renderAdminGearList();
    }
}