// orders.js
import {loadHoldings} from './holdings.js';
import { loadPendingOrders } from './pending.js';
import { loadOverview } from './overview.js';
import {updateWalletChart} from './charts.js';

export function handleMarketBuy(symbol, quantity, amount) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };

    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    let coin = liveMarket.find(c => c.symbol === symbol) || holdings.find(h => h.symbol === symbol);
    const price = coin?.quote?.USD?.price || coin?.currentPrice;
    if (!price) return alert("Cannot determine price for this coin.");

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

export function handleMarketSell(symbol, quantity, amount) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };
    if (!symbol || !quantity || quantity <= 0) return alert("Invalid sell quantity.");

    const existing = holdings.find(h => h.symbol === symbol);
    if (!existing || existing.quantity < quantity) return alert("Not enough holdings to sell.");

    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coin = liveMarket.find(c => c.symbol === symbol) || existing;
    const price = coin?.quote?.USD?.price || coin?.currentPrice;

    existing.quantity -= quantity;
    overview.cash += price * quantity;
    if (existing.quantity <= 0) holdings.splice(holdings.indexOf(existing), 1);

    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));
    localStorage.setItem("overviewData", JSON.stringify(overview));
    refreshHoldingsValues();

    alert(`✅ Sold ${quantity.toFixed(6)} ${symbol} at $${price.toFixed(2)}`);
}

export function handleLimitBuy(symbol, quantity, limitPrice) {
    if (!symbol || !quantity || !limitPrice) return;
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, limitPrice, type: "limit-buy" });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Limit Buy set for ${symbol} at $${limitPrice}`);
}

export function handleLimitSell(symbol, quantity, limitPrice) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, limitPrice, type: "limit-sell" });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Limit Sell set for ${symbol} at $${limitPrice}`);
}

export function handleStopLimitSell(symbol, quantity, stopPrice, limitPrice) {
    if (!symbol || !quantity || !stopPrice || !limitPrice) return;
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, stopPrice, limitPrice, type: "stop-limit", triggered: false });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Stop-Limit Sell set for ${symbol} at $${limitPrice} (trigger: $${stopPrice})`);
}

export function handleStopLossSell(symbol, quantity, stopPrice) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, stopPrice, type: "stop-loss" });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Stop-Loss Sell set for ${symbol} at $${stopPrice}`);
}

export function handleTakeProfit(symbol, quantity, limitPrice) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push({ symbol, quantity, limitPrice, type: "take-profit" });
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`Take-Profit set for ${symbol} at $${limitPrice}`);
}

function refreshHoldingsValues() {
    loadHoldings();
    loadOverview();
    loadPendingOrders();
    updateWalletChart('1W');
}