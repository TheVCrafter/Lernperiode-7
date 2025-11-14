// pending.js
import { handleMarketBuy, handleMarketSell } from './orders.js';

export function loadPendingOrders() {
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
            <td>$${price}</td>
            <td>${o.quantity}</td>
            <td>${o.type}</td>
        `;
        tbody.appendChild(row);
    });
}

export function checkPendingOrders() {
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
            o.triggered = true;
        } else if (o.type === "stop-limit" && o.triggered && price <= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        } else if (o.type === "stop-loss" && price <= o.stopPrice) {
            handleMarketSell(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        } else if (o.type === "limit-sell" && price >= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        } else if (o.type === "take-profit" && price >= o.limitPrice) {
            handleMarketSell(o.symbol, o.quantity);
            updatedOrders = updatedOrders.filter(ord => ord !== o);
        }
    });

    localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders));
    loadPendingOrders();
}

export function cancelPendingOrders(symbol) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    const remaining = orders.filter(o => o.symbol !== symbol);
    localStorage.setItem("pendingOrders", JSON.stringify(remaining));
    loadPendingOrders();
    alert(`Cancelled all pending orders for ${symbol}`);
}