// Mock Database
let currentUser = null;
const users = { 'admin': { pass: '123', role: 'admin' }, 'staff': { pass: '123', role: 'staff' } };

const suppliers = [
    { id: 'S1', name: 'ElectroTech Components', contact: 'Ramesh Singh', phone: '9876543210' },
    { id: 'S2', name: 'CircuitBoards Inc', contact: 'Priya Desai', phone: '9123456780' }
];

const inventory = [
    { sku: 'MCU-001', name: 'Raspberry Pi 4', desc: 'SBC 4GB RAM', cat: 'Microcontrollers', cp: 3500, sp: 4200, qty: 15, min: 5, supId: 'S1' },
    { sku: 'SENS-012', name: 'Ultrasonic Sensor', desc: 'HC-SR04', cat: 'Sensors', cp: 80, sp: 150, qty: 3, min: 10, supId: 'S1' },
    { sku: 'DISP-005', name: 'OLED Display 0.96"', desc: 'I2C Interface', cat: 'Displays', cp: 200, sp: 350, qty: 0, min: 5, supId: 'S2' }
];

const auditLog = [];
let activeSKU = null;

// Authentication
function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (users[user] && users[user].pass === pass) {
        currentUser = { name: user, role: users[user].role };
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('current-user').innerText = `${user.toUpperCase()} (${users[user].role})`;
        
        if (currentUser.role === 'admin') {
            document.getElementById('add-item-btn').classList.remove('hidden');
        }
        updateDashboard();
        renderInventory();
        renderSuppliers();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function logout() { location.reload(); }

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if(tabId === 'dashboard') updateDashboard();
    if(tabId === 'audit') renderAudit();
}

// Logic & Rendering
function updateDashboard() {
    let totalVal = 0, outStock = 0, lowStockHTML = '';
    inventory.forEach(item => {
        totalVal += item.qty * item.cp;
        if (item.qty === 0) outStock++;
        if (item.qty < item.min) {
            let sup = suppliers.find(s => s.id === item.supId);
            lowStockHTML += `<li>${item.name} (${item.sku}) - Only ${item.qty} left. Order from: ${sup.name} (${sup.phone})</li>`;
        }
    });

    document.getElementById('stat-val').innerText = `₹${totalVal.toLocaleString()}`;
    document.getElementById('stat-prod').innerText = inventory.length;
    document.getElementById('stat-out').innerText = outStock;
    document.getElementById('stat-low').innerText = inventory.filter(i => i.qty < i.min).length;
    document.getElementById('low-stock-list').innerHTML = lowStockHTML || "<li>Stock levels are healthy.</li>";
}

function renderInventory(searchTerm = '') {
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';
    inventory.forEach(item => {
        if (!item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !item.sku.toLowerCase().includes(searchTerm.toLowerCase())) return;
        
        const row = `<tr>
            <td>${item.sku}</td><td>${item.name}<br><small style="color:var(--text-muted)">${item.desc}</small></td>
            <td>${item.cat}</td><td>₹${item.cp}</td><td>₹${item.sp}</td>
            <td style="color:${item.qty < item.min ? 'var(--danger)' : 'var(--accent)'}">${item.qty}</td>
            <td><button class="stock-btn" onclick="openModal('${item.sku}')">Adjust Stock</button></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function handleSearch() { renderInventory(document.getElementById('global-search').value); }

// Fail-Safe Stock Adjustments
function openModal(sku) {
    activeSKU = sku;
    document.getElementById('stock-modal').classList.remove('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    document.getElementById('stock-qty').value = '';
    document.getElementById('stock-reason').value = '';
}
function closeModal() { document.getElementById('stock-modal').classList.add('hidden'); }

function confirmStock(isAdding) {
    const qty = parseInt(document.getElementById('stock-qty').value);
    const reason = document.getElementById('stock-reason').value || "Manual Adjustment";
    if (isNaN(qty) || qty <= 0) return;

    let item = inventory.find(i => i.sku === activeSKU);
    
    // Core Fail-Safe validation requirement
    if (!isAdding && (item.qty - qty < 0)) {
        document.getElementById('modal-error').classList.remove('hidden');
        return;
    }

    item.qty = isAdding ? item.qty + qty : item.qty - qty;
    
    // Record Audit
    auditLog.unshift({
        time: new Date().toLocaleString(),
        sku: item.sku,
        change: isAdding ? `+${qty}` : `-${qty}`,
        user: currentUser.name,
        reason: reason
    });

    closeModal();
    renderInventory();
    updateDashboard();
}

function renderAudit() {
    const tbody = document.getElementById('audit-body');
    tbody.innerHTML = auditLog.map(log => 
        `<tr><td>${log.time}</td><td>${log.sku}</td>
        <td style="color:${log.change.startsWith('+') ? 'var(--accent)' : 'var(--danger)'}">${log.change}</td>
        <td>${log.user}</td><td>${log.reason}</td></tr>`
    ).join('');
}

function renderSuppliers() {
    const grid = document.getElementById('supplier-grid');
    grid.innerHTML = suppliers.map(s => 
        `<div class="supplier-card">
            <h3 class="accent">${s.name}</h3>
            <p style="margin-top:10px">Contact: ${s.contact}</p>
            <p>Phone: ${s.phone}</p>
        </div>`
    ).join('');
}