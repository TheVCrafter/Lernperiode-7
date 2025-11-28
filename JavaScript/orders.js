// orders.js
import { refreshHoldingsValues } from './holdings.js';

const round = n => parseFloat(n.toFixed(6));

export function handleMarketBuy(symbol, quantity, amount) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };

    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coin = liveMarket.find(c => c.symbol === symbol) || holdings.find(h => h.symbol === symbol);
    const price = coin?.quote?.USD?.price || coin?.currentPrice;

    if (!price) return alert("Cannot determine price for this coin.");
    if (!quantity && amount) quantity = amount / price;
    if (!quantity || quantity <= 0) return alert("Enter quantity or amount.");

    const cost = quantity * price;
    if (cost > overview.cash) return alert("Not enough cash.");

    const existing = holdings.find(h => h.symbol === symbol);
    if (existing) {
        const totalSpent = existing.buyPrice * existing.quantity + cost;
        existing.quantity = round(existing.quantity + quantity);
        existing.buyPrice = totalSpent / existing.quantity;
        existing.currentPrice = price;
    } else {
        holdings.push({ symbol, quantity: round(quantity), buyPrice: price, currentPrice: price });
    }

    overview.cash -= cost;
    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));
    localStorage.setItem("overviewData", JSON.stringify(overview));

    refreshHoldingsValues();
    alert(`✔ Bought ${round(quantity)} ${symbol} for $${cost.toFixed(2)}`);
}

export function handleMarketSell(symbol, quantity) {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 0 };

    if (!symbol || !quantity || quantity <= 0) return alert("Invalid quantity.");

    const existing = holdings.find(h => h.symbol === symbol);
    if (!existing || existing.quantity < quantity) return alert("Not enough holdings.");

    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coin = liveMarket.find(c => c.symbol === symbol) || existing;
    const price = coin?.quote?.USD?.price || coin?.currentPrice;

    existing.quantity = round(existing.quantity - quantity);
    overview.cash += price * quantity;

    if (existing.quantity <= 0) holdings.splice(holdings.indexOf(existing), 1);

    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));
    localStorage.setItem("overviewData", JSON.stringify(overview));

    refreshHoldingsValues();
    alert(`✔ Sold ${round(quantity)} ${symbol} at $${price.toFixed(2)}`);
}

export function handleLimitBuy(symbol, quantity, limitPrice) {
    if (!limitPrice) return alert("Enter limit price.");
    addPending({ symbol, quantity, limitPrice, type: "limit-buy" });
}

export function handleLimitSell(symbol, quantity, limitPrice) {
    if (!limitPrice) return alert("Enter limit price.");
    addPending({ symbol, quantity, limitPrice, type: "limit-sell" });
}

export function handleStopLimitSell(symbol, quantity, stopPrice, limitPrice) {
    if (!stopPrice || !limitPrice) return alert("Enter both stop price & limit price.");
    addPending({
        symbol,
        quantity,
        stopPrice,
        limitPrice,
        triggered: false,
        type: "stop-limit"
    });
}

export function handleStopLossSell(symbol, quantity, stopPrice) {
    if (!stopPrice) return alert("Enter stop price.");
    addPending({ symbol, quantity, stopPrice, type: "stop-loss" });
}

export function handleTakeProfit(symbol, quantity, limitPrice) {
    if (!limitPrice) return alert("Enter take-profit price.");
    addPending({ symbol, quantity, limitPrice, type: "take-profit" });
}

function addPending(order) {
    const orders = JSON.parse(localStorage.getItem("pendingOrders")) || [];
    orders.push(order);
    localStorage.setItem("pendingOrders", JSON.stringify(orders));
    loadPendingOrders();
    alert(`✔ Order created: ${order.type} for ${order.symbol}`);
}