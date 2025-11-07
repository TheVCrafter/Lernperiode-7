const API_URL = "http://localhost:4000/api/crypto";

window.addEventListener("DOMContentLoaded", async () => {
    await loadLiveMarket();
    loadOverview();
    loadHoldings();
    loadPendingOrders();
    attachTradeButton();
    attachTimeRangeButtons();
    initWalletChart();
    setInterval(loadLiveMarket, 5 * 60 * 1000);
    setInterval(checkPendingOrders, 30 * 1000);
});

// ---------------- Live Market ----------------
async function loadLiveMarket() {
    const tbody = document.getElementById("live-market-body");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("API request failed: " + response.status);
        const json = await response.json();
        const data = json.data;
        localStorage.setItem("cryptoData", JSON.stringify({ timestamp: new Date().toISOString(), data }));
        tbody.innerHTML = "";

        data.forEach(coin => {
            const quote = coin.quote.USD;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${coin.symbol}</td>
                <td>$${formatNumber(quote.price)}</td>
                <td>$${formatNumber(quote.market_cap)}</td>
                <td>$${formatNumber(quote.volume_24h)}</td>
                <td class="${getChangeClass(quote.percent_change_1h)}">${formatChange(quote.percent_change_1h)}</td>
                <td class="${getChangeClass(quote.percent_change_24h)}">${formatChange(quote.percent_change_24h)}</td>
                <td class="${getChangeClass(quote.percent_change_7d)}">${formatChange(quote.percent_change_7d)}</td>
                <td class="${getChangeClass(quote.percent_change_30d)}">${formatChange(quote.percent_change_30d)}</td>
                <td>${getRating(quote.percent_change_1h)}</td>
            `;
            tbody.appendChild(row);
            row.addEventListener("click", () => showCryptoChart(coin.symbol));
        });
    } catch (err) {
        console.error("Error loading data:", err);
        tbody.innerHTML = `<tr><td colspan="10">Error loading data.</td></tr>`;
    }
}

function formatNumber(num) {
    if (!num || isNaN(num)) return "N/A";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

function formatChange(val) { return val != null && !isNaN(val) ? val.toFixed(2) + "%" : "N/A"; }
function getChangeClass(val) { return val >= 0 ? "positive" : "negative"; }
function getRating(change) {
    if (change > 5) return "🟢 Strong Buy";
    if (change > 0) return "🟡 Buy";
    if (change < -5) return "🔴 Strong Sell";
    return "⚪ Hold";
}

// ---------------- Overview ----------------
function loadOverview() {
    let saved = localStorage.getItem("overviewData");
    if (!saved) {
        const defaultData = { accountValue: 5000, cash: 5000, change24h: 0 };
        localStorage.setItem("overviewData", JSON.stringify(defaultData));
        saved = JSON.stringify(defaultData);
    }
    const data = JSON.parse(saved);
    updateOverviewUI(data);
}

function updateOverviewUI(data) {
    document.getElementById("overview-value").innerText = `Account Value: $${data.accountValue.toFixed(2)}`;
    document.getElementById("overview-cash").innerText = `Cash: $${data.cash.toFixed(2)}`;
    const changeSymbol = data.change24h > 0 ? "▲" : data.change24h < 0 ? "▼" : "";
    const changeText = `${data.change24h.toFixed(2)}% ${changeSymbol}`;
    const changeElem = document.getElementById("overview-change");
    changeElem.innerText = `24h Change: ${changeText}`;
    changeElem.style.color = data.change24h > 0 ? "green" : data.change24h < 0 ? "red" : "gray";
}

function saveOverviewData(updates) {
    const saved = JSON.parse(localStorage.getItem("overviewData") || "{}");
    const newData = { ...saved, ...updates };
    localStorage.setItem("overviewData", JSON.stringify(newData));
    updateOverviewUI(newData);
}

// ---------------- Holdings ----------------
function loadHoldings() {
    const tbody = document.getElementById("holdings-body");
    if (!tbody) return;
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    tbody.innerHTML = "";

    holdings.forEach(h => {
        const totalValue = h.quantity * h.currentPrice;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${h.symbol}</td>
            <td>${h.quantity.toFixed(6)}</td>
            <td>$${h.currentPrice.toFixed(2)}</td>
            <td>$${totalValue.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
        row.addEventListener("click", () => openHoldingPanel(h.symbol));
    });
}

// ---------------- Pending Orders ----------------
function loadPendingOrders() {
    const tbody = document.getElementById("crypto-pending-body");
    if (!tbody) return;
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    const cryptoData = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    tbody.innerHTML = "";
    orders.forEach(o => {
        const price = cryptoData.find(c => c.symbol === o.symbol)?.quote.USD.price || "N/A";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${o.symbol}</td>
            <td>$${formatNumber(price)}</td>
            <td>${o.quantity}</td>
            <td>${o.type}</td>
        `;
        tbody.appendChild(row);
    });
}

// ---------------- Trade Panel ----------------
function attachTradeButton() {
    const tradeBtn = document.getElementById("tradeBtn");
    tradeBtn.addEventListener("click", () => openHoldingPanel());
}

function openHoldingPanel(symbol = null) {
    const panel = document.getElementById("holding-trade-panel");
    panel.style.display = "block";

    // Clear inputs
    ["panel-quantity", "panel-amount", "panel-limitPrice", "panel-stopPrice"].forEach(id => {
        document.getElementById(id).value = "";
    });

    const title = symbol ? `Trade ${symbol}` : "Trade Crypto";
    document.getElementById("holding-panel-title").innerText = title;

    // Build coin selector
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coins = [...new Set([...holdings.map(h => h.symbol), ...liveMarket.map(c => c.symbol)])];

    let select = document.getElementById("panel-coin-select");
    if (!select) {
        select = document.createElement("select");
        select.id = "panel-coin-select";
        select.style.marginBottom = "10px";
        select.style.padding = "5px";
        panel.querySelector(".panel-inputs").prepend(select);
    }
    select.innerHTML = coins.map(c => `<option value="${c}">${c}</option>`).join("");
    if (symbol) select.value = symbol;

    // Remove old listeners by cloning buttons
    ["panel-market-buy", "panel-market-sell", "panel-limit-buy", "panel-stop-limit", "panel-cancel-orders"].forEach(id => {
        const btn = document.getElementById(id);
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    // Attach button handlers
    document.getElementById("panel-market-buy").addEventListener("click", () => executePanelOrder("market-buy"));
    document.getElementById("panel-market-sell").addEventListener("click", () => executePanelOrder("market-sell"));
    document.getElementById("panel-limit-buy").addEventListener("click", () => executePanelOrder("limit-buy"));
    document.getElementById("panel-stop-limit").addEventListener("click", () => executePanelOrder("stop-limit"));
    document.getElementById("panel-cancel-orders").addEventListener("click", () => {
        const sym = document.getElementById("panel-coin-select").value;
        cancelPendingOrders(sym);
    });
}

function executePanelOrder(type) {
    const select = document.getElementById("panel-coin-select");
    if (!select) return alert("No coin selected.");
    const symbol = select.value;

    let quantity = parseFloat(document.getElementById("panel-quantity").value);
    let amount = parseFloat(document.getElementById("panel-amount").value);

    // Get current price from live market or holdings
    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    let coinData = liveMarket.find(c => c.symbol === symbol);
    if (!coinData) coinData = holdings.find(h => h.symbol === symbol);
    if (!coinData) return alert("Coin not found in market data.");

    const currentPrice = coinData.currentPrice || coinData.quote?.USD?.price;
    if (!currentPrice) return alert("Cannot determine price for this coin.");

    // Only one input is required
    if (!quantity && !amount) return alert("Please enter either Quantity or Amount ($).");
    if (!quantity && amount) quantity = amount / currentPrice;
    if (!amount && quantity) amount = quantity * currentPrice;

    console.log(`Placing ${type} for ${symbol}: quantity=${quantity.toFixed(6)}, amount=$${amount.toFixed(2)}`);

    // Call the order handlers
    if (type === "market-buy") handleMarketBuy(symbol, quantity, amount);
    else if (type === "market-sell") handleMarketSell(symbol, quantity, amount);
    else if (type === "limit-buy") handleLimitBuy(symbol, quantity, amount);
    else if (type === "stop-limit") handleStopLimitSell(symbol, quantity, amount);
}

// ---------------- Order Handlers ----------------
function handleMarketBuy(symbol, quantity, amount) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };

    // Get price from live market or holdings
    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    let coin = liveMarket.find(c => c.symbol === symbol) || holdings.find(h => h.symbol === symbol);
    const price = coin.quote?.USD?.price || coin.currentPrice;
    if (!price) return alert("Cannot determine price for this coin.");

    // Calculate quantity if only amount given
    if (!quantity && amount) quantity = amount / price;
    if (!quantity) return alert("Please enter a valid Quantity or Amount.");

    const cost = quantity * price;
    if (cost > overview.cash) return alert("Not enough cash to buy.");

    const existing = holdings.find(h => h.symbol === symbol);
    if (existing) {
        const totalSpent = existing.buyPrice * existing.quantity + cost;
        existing.quantity += quantity;
        existing.buyPrice = totalSpent / existing.quantity;
        existing.currentPrice = price;
    } else {
        holdings.push({ symbol, quantity, buyPrice: price, currentPrice: price });
    }

    overview.cash -= cost;
    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));
    localStorage.setItem("overviewData", JSON.stringify(overview));
    refreshHoldingsValues();

    alert(`✅ Bought ${quantity.toFixed(6)} ${symbol} for $${cost.toFixed(2)}`);
}

function handleMarketSell(symbol, quantity, amount) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };
    if (!symbol || !quantity || quantity <= 0) return alert("Invalid sell quantity.");

    const existing = holdings.find(h => h.symbol === symbol);
    if (!existing || existing.quantity < quantity) return alert("Not enough holdings to sell.");

    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coin = liveMarket.find(c => c.symbol === symbol) || existing;
    const price = coin.quote?.USD?.price || coin.currentPrice;

    existing.quantity -= quantity;
    overview.cash += price * quantity;
    if (existing.quantity <= 0) holdings.splice(holdings.indexOf(existing), 1);

    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));
    localStorage.setItem("overviewData", JSON.stringify(overview));
    refreshHoldingsValues();

    alert(`✅ Sold ${quantity.toFixed(6)} ${symbol} at $${price.toFixed(2)}`);
}

// Limit Buy & Stop-Limit placeholders (for pending orders)
function handleLimitBuy(symbol, quantity, limitPrice) {
    if (!symbol || !quantity || !limitPrice) return;
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, limitPrice, type: "limit-buy" });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Limit Buy set for ${symbol} at $${limitPrice}`);
}

function handleStopLimitSell(symbol, quantity, stopPrice, limitPrice) {
    if (!symbol || !quantity || !stopPrice || !limitPrice) return;
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, stopPrice, limitPrice, type: "stop-limit", triggered: false });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Stop-Limit Sell set for ${symbol} at $${limitPrice} (trigger: $${stopPrice})`);
}

// ---------------- Cancel Orders ----------------
function cancelPendingOrders(symbol) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    const remaining = orders.filter(o => o.symbol !== symbol);
    localStorage.setItem("pendingOrders", JSON.stringify(remaining));
    loadPendingOrders();
    alert(`Cancelled all pending orders for ${symbol}`);
}

// ---------------- Wallet Chart ----------------
let walletChart;
function initWalletChart() {
    const ctx = document.querySelector('.performance-graph').getContext('2d');
    walletChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Wallet Value', data: [], borderColor: '#0099ff', backgroundColor: 'rgba(0,153,255,0.2)', tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } }, y: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } } } }
    });
    updateWalletChart('1W');
}

function updateWalletChart(range) {
    const history = JSON.parse(localStorage.getItem("walletHistory")) || {};
    const dates = Object.keys(history).sort();
    const values = Object.values(history);
    let days = 7;
    if (range === "1M") days = 30;
    if (range === "3M") days = 90;
    if (range === "6M") days = 180;
    if (range === "1Y") days = 365;

    const filteredDates = dates.slice(-days);
    const filteredValues = filteredDates.map(d => history[d]);
    walletChart.data.labels = filteredDates;
    walletChart.data.datasets[0].data = filteredValues;
    walletChart.update();
}

function attachTimeRangeButtons() {
    document.querySelectorAll(".time-range-btn").forEach(btn => {
        btn.addEventListener("click", () => updateWalletChart(btn.dataset.range));
    });
}

// ---------------- Crypto Chart ----------------
let selectedCryptoChart = null;
async function fetchCryptoHistory(symbol, limit = 30) {
    const cacheKey = `cryptoHistory_${symbol}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    const now = new Date().getTime();
    if (cached.timestamp && now - cached.timestamp < 12 * 60 * 60 * 1000) return cached.data;

    try {
        const response = await fetch(`http://localhost:4000/api/crypto/history?symbol=${symbol}&limit=${limit}`);
        if (!response.ok) throw new Error("Failed to fetch history");
        const json = await response.json();
        const quotes = json.data?.quotes || [];
        const history = quotes.map(q => ({ date: new Date(q.time_open).toLocaleDateString(), price: q.quote.USD.close }));
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: history }));
        return history;
    } catch (e) { console.error(e); return []; }
}

async function showCryptoChart(symbol) {
    const canvas = document.getElementById("selected-crypto-graph");
    canvas.style.display = "block";
    const history = await fetchCryptoHistory(symbol);
    if (!history.length) return;

    const labels = history.map(h => h.date);
    const values = history.map(h => h.price);

    if (selectedCryptoChart) {
        selectedCryptoChart.data.labels = labels;
        selectedCryptoChart.data.datasets[0].label = symbol;
        selectedCryptoChart.data.datasets[0].data = values;
        selectedCryptoChart.update();
    } else {
        const ctx = canvas.getContext("2d");
        selectedCryptoChart = new Chart(ctx, {
            type: "line",
            data: { labels, datasets: [{ label: symbol, data: values, borderColor: "#0099ff", backgroundColor: "rgba(0,153,255,0.2)", tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } }, y: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } } } }
        });
    }
}

// ---------------- Hide overlays on outside click ----------------
document.addEventListener("click", e => {
    const panel = document.getElementById("holding-trade-panel");
    const canvas = document.getElementById("selected-crypto-graph");
    if (panel && !panel.contains(e.target) && !e.target.closest("#tradeBtn") && !e.target.closest("#holdings-body")) panel.style.display = "none";
    if (canvas && !canvas.contains(e.target) && !e.target.closest("#live-market-body")) canvas.style.display = "none";
});

// ---------------- Pending Orders ----------------
function checkPendingOrders() {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    if (!orders.length) return;
    const cryptoData = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    let updatedOrders = [...orders];

    updatedOrders.forEach(o => {
        const price = cryptoData.find(c => c.symbol === o.symbol)?.quote.USD.price || 0;
        if (o.type === "limit-buy" && price <= o.limitPrice) {
            handleMarketBuy(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        } else if (o.type === "stop-limit" && !o.triggered && price <= o.stopPrice) {
            o.triggered = true; // mark as triggered
        } else if (o.type === "stop-limit" && o.triggered && price <= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        }
    });

    localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders));
    loadPendingOrders();
}

// ---------------- Refresh Holdings ----------------
function refreshHoldingsValues() {
    loadHoldings();
    loadOverview();
    loadPendingOrders();
    updateWalletChart('1W');
}
