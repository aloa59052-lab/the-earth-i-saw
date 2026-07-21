let appState = null;
let activeCategoryId = null;

document.addEventListener("DOMContentLoaded", () => {
    initGearVault();
});

function loadData() {
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    if (!appState) appState = { gearVault: [] };
    if (!appState.gearVault) appState.gearVault = [];
}

function saveData() {
    if (window.parent && window.parent.DataBridge) {
        window.parent.DataBridge.save(appState);
    }
}

function initGearVault() {
    loadData();
    if (appState.gearVault.length === 0) {
        document.getElementById("mainVaultContainer").innerHTML = `
            <div class="empty-message">
                🎥 <strong>Vault is Empty!</strong><br><br>
                Please add a gear category (e.g. Drones, Cameras) from the Control Panel first.
            </div>`;
        return;
    }
    if (!activeCategoryId || !appState.gearVault.find(c => c.id === activeCategoryId)) {
        activeCategoryId = appState.gearVault[0].id;
    }
    renderCategoryTabs();
    renderActiveCategoryLayout();
}

function renderCategoryTabs() {
    const container = document.getElementById("catTabsContainer");
    container.innerHTML = "";
    appState.gearVault.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = `cat-tab ${cat.id === activeCategoryId ? 'active' : ''}`;
        btn.innerHTML = `📁 ${cat.name}`;
        btn.onclick = () => {
            activeCategoryId = cat.id;
            renderCategoryTabs();
            renderActiveCategoryLayout();
        };
        container.appendChild(btn);
    });
}

function renderActiveCategoryLayout() {
    const container = document.getElementById("mainVaultContainer");
    const category = appState.gearVault.find(c => c.id === activeCategoryId);
    if (!category) return;
    
    let totalItems = category.items ? category.items.length : 0;
    let totalWeight = 0;
    if (category.items) category.items.forEach(i => totalWeight += parseInt(i.weight) || 0);
    let weightText = totalWeight >= 1000 ? (totalWeight / 1000).toFixed(2) + " KG" : totalWeight + " G";

    let html = `
        <div class="vault-hero-card">
            <img src="${category.image}" class="vault-hero-img">
            <div class="vault-hero-info">
                <h2>${category.name}</h2>
                <p>Total Items: ${totalItems}</p>
                <div class="stat-badge">Total Weight: ${weightText}</div>
            </div>
        </div>
    `;

    if (!category.items || category.items.length === 0) {
        html += `<div class="empty-message" style="margin-top:10px;">No gear added to this category yet.</div>`;
    } else {
        html += `<div class="gear-list">`;
        category.items.forEach(item => {
            html += `
                <div class="gear-item">
                    <div class="gear-info">
                        <div class="gear-item-name">${item.name}</div>
                        ${item.brand ? `<div class="gear-item-brand">${item.brand}</div>` : ''}
                    </div>
                    <div class="gear-item-right">
                        <span class="gear-item-weight">${item.weight ? item.weight + 'g' : '-'}</span>
                        <button class="btn-delete-gear" onclick="deleteGear(${item.id})">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `<button class="btn-add-action" onclick="openGearModal()">➕ Add New Gear</button>`;
    container.innerHTML = html;
}

window.openGearModal = function() {
    document.getElementById("gearName").value = "";
    document.getElementById("gearBrand").value = "";
    document.getElementById("gearWeight").value = "";
    document.getElementById("gearModal").classList.add("active");
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove("active");
};

window.saveGear = function() {
    const name = document.getElementById("gearName").value.trim();
    const brand = document.getElementById("gearBrand").value.trim();
    const weight = parseInt(document.getElementById("gearWeight").value) || 0;
    if (!name) return alert("Gear name is required!");
    
    const category = appState.gearVault.find(c => c.id === activeCategoryId);
    if (category) {
        if(!category.items) category.items = [];
        category.items.push({ id: Date.now(), name: name, brand: brand, weight: weight });
        saveData(); 
        closeModal("gearModal"); 
        renderActiveCategoryLayout();
    }
};

window.deleteGear = function(gearId) {
    if(confirm("Are you sure you want to delete this gear?")) {
        const category = appState.gearVault.find(c => c.id === activeCategoryId);
        if (category) {
            category.items = category.items.filter(i => i.id !== gearId);
            saveData(); 
            renderActiveCategoryLayout();
        }
    }
};