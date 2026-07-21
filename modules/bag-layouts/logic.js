let appState = null;
let activeBagId = null;
let activeCompartmentIdForItems = null;

document.addEventListener("DOMContentLoaded", () => {
    initBagLayouts();
});

function loadData() {
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    if (!appState) appState = { bagLayouts: [] };
    if (!appState.bagLayouts) appState.bagLayouts = [];
}

function saveData() {
    if (window.parent && window.parent.DataBridge) {
        window.parent.DataBridge.save(appState);
    }
}

function initBagLayouts() {
    loadData();
    if (appState.bagLayouts.length === 0) {
        document.getElementById("mainBagContainer").innerHTML = `
            <div class="empty-message">
                🎒 <strong>No Bags Found!</strong><br><br>
                Please add a bag from the Control Panel first.
            </div>`;
        return;
    }
    if (!activeBagId || !appState.bagLayouts.find(b => b.id === activeBagId)) {
        activeBagId = appState.bagLayouts[0].id;
    }
    renderBagTabs();
    renderActiveBagLayout();
}

function renderBagTabs() {
    const container = document.getElementById("bagTabsContainer");
    container.innerHTML = "";
    appState.bagLayouts.forEach(bag => {
        const btn = document.createElement("button");
        btn.className = `bag-tab ${bag.id === activeBagId ? 'active' : ''}`;
        btn.innerHTML = `🎒 ${bag.name}`;
        btn.onclick = () => {
            activeBagId = bag.id;
            renderBagTabs();
            renderActiveBagLayout();
        };
        container.appendChild(btn);
    });
}

function renderActiveBagLayout() {
    const container = document.getElementById("mainBagContainer");
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (!bag) return;

    if (!bag.compartments) bag.compartments = [];
    
    let totalItems = 0;
    bag.compartments.forEach(comp => {
        if(comp.items) totalItems += comp.items.length;
    });

    let html = `
        <div class="bag-hero-card">
            <img src="${bag.image}" class="bag-hero-img">
            <div class="bag-hero-info">
                <h2>${bag.name}</h2>
                <p>Capacity: ${bag.capacity}</p>
                <div class="stat-badge">Total Packed Items: ${totalItems}</div>
            </div>
        </div>
    `;

    bag.compartments.forEach(comp => {
        html += `
            <div class="compartment-box">
                <div class="compartment-header">
                    <div class="compartment-title">📦 ${comp.name}</div>
                    <button class="btn-delete-comp" onclick="deleteCompartment(${comp.id})">🗑️</button>
                </div>
                <div class="item-list">
        `;
        if (comp.items) {
            comp.items.forEach(item => {
                html += `
                    <div class="pack-item">
                        <span class="pack-item-name">• ${item.name}</span>
                        <button class="btn-delete-item" onclick="deletePackItem(${comp.id}, ${item.id})">✕</button>
                    </div>
                `;
            });
        }
        html += `
                </div>
                <button class="btn-add-item" onclick="openItemModal(${comp.id})">➕ Add Item Here</button>
            </div>
        `;
    });

    html += `<button class="btn-add-action" onclick="openCompartmentModal()">➕ New Compartment</button>`;
    container.innerHTML = html;
}

window.openCompartmentModal = function() {
    document.getElementById("compartmentName").value = "";
    document.getElementById("compartmentModal").classList.add("active");
};

window.openItemModal = function(compartmentId) {
    activeCompartmentIdForItems = compartmentId;
    document.getElementById("packItemName").value = "";
    document.getElementById("itemModal").classList.add("active");
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove("active");
};

window.saveCompartment = function() {
    const name = document.getElementById("compartmentName").value.trim();
    if (!name) return alert("Compartment name is required!");
    
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        bag.compartments.push({ id: Date.now(), name: name, items: [] });
        saveData();
        closeModal("compartmentModal");
        renderActiveBagLayout();
    }
};

window.savePackItem = function() {
    const name = document.getElementById("packItemName").value.trim();
    if (!name) return alert("Item name is required!");
    
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        const comp = bag.compartments.find(c => c.id === activeCompartmentIdForItems);
        if (comp) {
            if(!comp.items) comp.items = [];
            comp.items.push({ id: Date.now(), name: name });
            saveData();
            closeModal("itemModal");
            renderActiveBagLayout();
        }
    }
};

window.deleteCompartment = function(compId) {
    if(confirm("Delete this entire compartment and its items?")) {
        const bag = appState.bagLayouts.find(b => b.id === activeBagId);
        if (bag) {
            bag.compartments = bag.compartments.filter(c => c.id !== compId);
            saveData();
            renderActiveBagLayout();
        }
    }
};

window.deletePackItem = function(compId, itemId) {
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        const comp = bag.compartments.find(c => c.id === compId);
        if (comp) {
            comp.items = comp.items.filter(i => i.id !== itemId);
            saveData();
            renderActiveBagLayout();
        }
    }
};