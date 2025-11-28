import { saveWalletValue, updateWalletChart } from './charts.js';

export function loadOverview() {
    let saved = JSON.parse(localStorage.getItem("overviewData"));
    let history = JSON.parse(localStorage.getItem("accountHistory") || "{}");
    if (!saved) {
        saved = { cash: 5000, accountValue: 5000, change24h: 0 };
        localStorage.setItem("overviewData", JSON.stringify(saved));

        const now = new Date().toISOString();
        history[now] = saved.accountValue;
        localStorage.setItem("accountHistory", JSON.stringify(history));

        saveWalletValue(saved.accountValue);
    }

    updateOverviewUI(saved);
}

export function updateOverviewUI(data) {
    const valueElem = document.getElementById("overview-value");
    const cashElem = document.getElementById("overview-cash");
    const changeElem = document.getElementById("overview-change");

    if (!valueElem || !cashElem || !changeElem) return;

    valueElem.innerText = `Account Value: $${data.accountValue.toFixed(2)}`;
    cashElem.innerText = `Cash: $${data.cash.toFixed(2)}`;

    const changeSymbol = data.change24h > 0 ? "▲" : data.change24h < 0 ? "▼" : "";
    changeElem.innerText = `24h Change: ${data.change24h.toFixed(2)}% ${changeSymbol}`;
    changeElem.style.color = data.change24h > 0 ? "green" : data.change24h < 0 ? "red" : "gray";
}

function saveAccountValue(value) {
    const now = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem("accountHistory") || "{}");
    const today = now.slice(0, 10); // YYYY-MM-DD
    const lastKey = Object.keys(history).pop();
    if (!lastKey || lastKey.slice(0, 10) !== today) {
        history[now] = value;
        localStorage.setItem("accountHistory", JSON.stringify(history));
    }
}

function calc24hChange(currentValue) {
    const history = JSON.parse(localStorage.getItem("accountHistory") || "{}");
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 1);

    const entries = Object.entries(history)
        .map(([time, value]) => ({ time: new Date(time), value }))
        .filter(e => e.time <= now && e.time >= cutoff)
        .sort((a, b) => a.time - b.time);

    if (!entries.length) return 0;

    const oldValue = entries[0].value;
    return ((currentValue - oldValue) / oldValue) * 100;
}

export function recalcOverview(holdings) {
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { cash: 5000, accountValue: 5000, change24h: 0 };

    const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    overview.accountValue = overview.cash + totalHoldingsValue;

    saveAccountValue(overview.accountValue);
    overview.change24h = calc24hChange(overview.accountValue);

    localStorage.setItem("overviewData", JSON.stringify(overview));
    updateOverviewUI(overview);

    saveWalletValue(overview.accountValue);
    updateWalletChart();
}