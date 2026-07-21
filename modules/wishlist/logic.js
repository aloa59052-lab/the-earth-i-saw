let appState = null;

document.addEventListener("DOMContentLoaded", () => {
    initWishlist();
});

function loadData() {
    if (window.parent && window.parent.DataBridge) {
        appState = window.parent.DataBridge.get();
    }
    if (!appState) appState = { wishlist: [] };
    if (!appState.wishlist) appState.wishlist = [];
}

function saveData() {
    if (window.parent && window.parent.DataBridge) {
        window.parent.DataBridge.save(appState);
    }
}

function initWishlist() {
    loadData();
    renderWishlist();
}

function renderWishlist() {
    const container = document.getElementById("mainWishlistContainer");
    
    let totalCost = 0;
    appState.wishlist.forEach(item => {
        totalCost += parseInt(item.price) || 0;
    });

    let html = `
        <div class="summary-card">
            <div class="summary-info">
                <h3>Estimated Target</h3>
                <div class="cost"><span>$</span>${totalCost.toLocaleString()}</div>
            </div>
            <div class="summary-info" style="text-align: right;">
                <h3>Total Items</h3>
                <div class="cost" style="font-size: 20px;">${appState.wishlist.length}</div>
            </div>
        </div>
    `;

    if (appState.wishlist.length === 0) {
        html += `
            <div class="empty-message">
                🛒 <strong>Your wishlist is empty!</strong><br><br>
                Add the equipment you plan to purchase in the future.
            </div>`;
    } else {
        html += `<div class="list-wrapper">`;
        
        // Priority অনুযায়ী সর্ট করা (High আগে দেখাবে)
        const sortedList = [...appState.wishlist].sort((a, b) => {
            const priorities = { "High": 1, "Medium": 2, "Low": 3 };
            return priorities[a.priority] - priorities[b.priority];
        });

        sortedList.forEach(item => {
            let badgeClass = '';
            if(item.priority === 'High') badgeClass = 'priority-high';
            else if(item.priority === 'Medium') badgeClass = 'priority-medium';
            else badgeClass = 'priority-low';

            html += `
                <div class="wishlist-item">
                    <div class="item-left">
                        <div class="item-name">${item.name}</div>
                        <div class="priority-badge ${badgeClass}">${item.priority} Priority</div>
                    </div>
                    <div class="item-right">
                        <div class="item-price">$${(parseInt(item.price) || 0).toLocaleString()}</div>
                        <button class="btn-delete-item" onclick="deleteWishlistItem(${item.id})">🗑️ Remove</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `<button class="btn-add-action" onclick="openWishlistModal()">➕ Add Target Item</button>`;
    
    container.innerHTML = html;
}

window.openWishlistModal = function() {
    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";
    document.getElementById("itemPriority").value = "Medium";
    document.getElementById("wishlistModal").classList.add("active");
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove("active");
};

window.saveWishlistItem = function() {
    const name = document.getElementById("itemName").value.trim();
    const price = parseInt(document.getElementById("itemPrice").value) || 0;
    const priority = document.getElementById("itemPriority").value;
    
    if (!name) return alert("Item name is required!");
    
    appState.wishlist.push({
        id: Date.now(),
        name: name,
        price: price,
        priority: priority
    });
    
    saveData();
    closeModal("wishlistModal");
    renderWishlist();
};

window.deleteWishlistItem = function(itemId) {
    if(confirm("Remove this item from your wishlist?")) {
        appState.wishlist = appState.wishlist.filter(i => i.id !== itemId);
        saveData();
        renderWishlist();
    }
};