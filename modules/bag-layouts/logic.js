// ==========================================
// BAG LAYOUTS LOGIC (NEW ARCHITECTURE)
// ==========================================

let appState = null;
let activeBagId = null;
let currentCompIdForGear = null;

document.addEventListener("DOMContentLoaded", () => {
    initBagLayouts();
});

function loadData() {
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    if (!appState) appState = { missionStats: {}, bagLayouts: [], gearVault: [] };
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
        document.getElementById("mainLayoutContainer").innerHTML = `
            <div class="empty-message">
                📂 <strong>No bags found in memory!</strong><br><br>
                Please add a backpack from the Control Panel first.
            </div>`;
        return;
    }
    
    // Check if current active bag still exists, otherwise set to first bag
    if (!activeBagId || !appState.bagLayouts.find(b => b.id === activeBagId)) {
        activeBagId = appState.bagLayouts[0].id;
    }
    
    renderBagTabs();
    renderActiveBagLayout();
}

function handleBackButton() {
    if (window.parent) window.parent.postMessage({ action: 'loadModule', module: 'mission-stats' }, '*');
}

function renderBagTabs() {
    const container = document.getElementById("bagTabsContainer");
    container.innerHTML = "";
    
    appState.bagLayouts.forEach(bag => {
        const btn = document.createElement("button");
        btn.className = `bag-tab ${bag.id === activeBagId ? 'active' : ''}`;
        btn.innerHTML = `🎒 ${bag.name} (${bag.capacity})`;
        btn.onclick = () => {
            activeBagId = bag.id;
            renderBagTabs();
            renderActiveBagLayout();
        };
        container.appendChild(btn);
    });
}

function renderActiveBagLayout() {
    const container = document.getElementById("mainLayoutContainer");
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    
    if (!bag) return;
    
    let totalWeight = 0;
    if (bag.compartments) {
        bag.compartments.forEach(c => {
            if(c.items) c.items.forEach(i => totalWeight += parseInt(i.weight) || 0);
        });
    }

    let weightText = totalWeight >= 1000 ? (totalWeight / 1000).toFixed(2) + " KG" : totalWeight + " G";

    let html = `
        <div class="bag-hero-card">
            <img src="${bag.image}" class="bag-hero-img">
            <div class="bag-hero-info">
                <h2>${bag.name}</h2>
                <p>Capacity: ${bag.capacity}</p>
                <div class="weight-badge">TOTAL WEIGHT: ${weightText}</div>
            </div>
        </div>
    `;

    if (!bag.compartments || bag.compartments.length === 0) {
        html += `<div class="empty-message" style="margin-top:10px;">No compartments created yet.</div>`;
    } else {
        bag.compartments.forEach(comp => {
            let compWeight = 0;
            if(comp.items) comp.items.forEach(i => compWeight += parseInt(i.weight) || 0);
            let compWeightText = compWeight >= 1000 ? (compWeight / 1000).toFixed(2) + " kg" : compWeight + " g";

            html += `
                <div class="compartment-card">
                    <div class="comp-header">
                        <div class="comp-title">${comp.name} <span style="color:#ff3d00; font-size:11px; margin-left:5px;">(${compWeightText})</span></div>
                        <button class="btn-delete-comp" onclick="deleteCompartment(${comp.id})">🗑️</button>
                    </div>
                    <div class="gear-list">
            `;

            if (!comp.items || comp.items.length === 0) {
                // Empty state for compartment
            } else {
                comp.items.forEach(item => {
                    html += `
                        <div class="gear-item">
                            <div class="gear-item-name">${item.name}</div>
                            <div class="gear-item-right">
                                <span class="gear-item-weight">${item.weight ? item.weight + 'g' : '-'}</span>
                                <button class="btn-delete-gear" onclick="deleteGear(${comp.id}, ${item.id})">✕</button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                    <div class="btn-add-action" onclick="openGearModal(${comp.id}, '${comp.name}')">➕ Pack Gear Here</div>
                </div>
            `;
        });
    }

    html += `<div class="btn-add-action" style="background:#ff3d00; color:#fff; border:none; margin-top:10px; padding:16px;" onclick="openCompartmentModal()">➕ Create New Compartment</div>`;
    
    container.innerHTML = html;
}

// Modal Controls attached to window so inline HTML can find them
window.openCompartmentModal = function() {
    document.getElementById("compName").value = "";
    document.getElementById("compartmentModal").classList.add("active");
};

window.openGearModal = function(compId, compName) {
    currentCompIdForGear = compId;
    document.getElementById("currentCompName").innerText = compName;
    document.getElementById("gearName").value = "";
    document.getElementById("gearWeight").value = "";
    document.getElementById("gearModal").classList.add("active");
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove("active");
};

// Data Actions
window.saveCompartment = function() {
    const name = document.getElementById("compName").value.trim();
    if (!name) return alert("Compartment name is required!");
    
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        if(!bag.compartments) bag.compartments = [];
        bag.compartments.push({ id: Date.now(), name: name, items: [] });
        
        saveData();
        closeModal("compartmentModal");
        renderActiveBagLayout();
    }
};

window.deleteCompartment = function(compId) {
    if (confirm("Delete this compartment and all gear inside it?")) {
        const bag = appState.bagLayouts.find(b => b.id === activeBagId);
        if (bag) {
            bag.compartments = bag.compartments.filter(c => c.id !== compId);
            saveData();
            renderActiveBagLayout();
        }
    }
};

window.saveGear = function() {
    const name = document.getElementById("gearName").value.trim();
    const weight = parseInt(document.getElementById("gearWeight").value) || 0;
    
    if (!name) return alert("Gear name is required!");
    
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        const comp = bag.compartments.find(c => c.id === currentCompIdForGear);
        if (comp) {
            if(!comp.items) comp.items = [];
            comp.items.push({ id: Date.now(), name: name, weight: weight });
            
            saveData();
            closeModal("gearModal");
            renderActiveBagLayout();
        }
    }
};

window.deleteGear = function(compId, gearId) {
    const bag = appState.bagLayouts.find(b => b.id === activeBagId);
    if (bag) {
        const comp = bag.compartments.find(c => c.id === compId);
        if (comp) {
            comp.items = comp.items.filter(i => i.id !== gearId);
            saveData();
            renderActiveBagLayout();
        }
    }
};