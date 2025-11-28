// pending.js
import { handleMarketBuy, handleMarketSell } from './orders.js';

// ---------------- Load Pending Orders ----------------
export function loadPendingOrders() {
    const tbody = document.getElementById("crypto-pending-body");
    if (!tbody) return;

    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    const cryptoData = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    tbody.innerHTML = "";

    orders.forEach(o => {
        const marketEntry = cryptoData.find(
            c => c.symbol.toUpperCase() === o.symbol.toUpperCase()
        );

        const price = marketEntry?.quote.USD.price ?? "N/A";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${o.symbol}</td>
            <td>$${price}</td>
            <td>${o.quantity}</td>
            <td>${o.type}</td>
        `;
        tbody.appendChild(row);
    });
}

// ---------------- Check Pending Orders ----------------
export function checkPendingOrders() {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    if (!orders.length) return;

    const cryptoData = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    let updatedOrders = [];

    for (const o of orders) {
        const marketEntry = cryptoData.find(
            c => c.symbol.toUpperCase() === o.symbol.toUpperCase()
        );

        const price = marketEntry?.quote.USD.price ?? 0;

        // LIMIT BUY
        if (o.type === "limit-buy" && price <= o.limitPrice) {
            handleMarketBuy(o.symbol, o.quantity);
            continue;
        }

        // STOP-LIMIT: TRIGGER PHASE
        if (o.type === "stop-limit" && !o.triggered && price <= o.stopPrice) {
            o.triggered = true;
            updatedOrders.push(o);
            continue;
        }

        // STOP-LIMIT: EXECUTION PHASE
        if (o.type === "stop-limit" && o.triggered && price <= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            continue;
        }

        // STOP-LOSS
        if (o.type === "stop-loss" && price <= o.stopPrice) {
            handleMarketSell(o.symbol, o.quantity);
            continue;
        }

        // LIMIT SELL
        if (o.type === "limit-sell" && price >= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            continue;
        }

        // TAKE PROFIT
        if (o.type === "take-profit" && price >= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            continue;
        }

        updatedOrders.push(o);
    }

    localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders));
    loadPendingOrders();
}

// ---------------- Cancel All Pending Orders for a Symbol ----------------
export function cancelPendingOrders(symbol) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    const remaining = orders.filter(o => o.symbol !== symbol);

    localStorage.setItem("pendingOrders", JSON.stringify(remaining));
    loadPendingOrders();

    alert(`Cancelled all pending orders for ${symbol}`);
}