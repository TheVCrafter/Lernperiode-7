// charts.js
export let walletChart = null;
export let selectedCryptoChart = null;

function formatLabel(date, range) {
    const d = new Date(date);
    if (range === "1W" || range === "1M" || range === "3M" || range === "6M" || range === "1Y") {
        return d.toLocaleDateString();
    }
    return d.toLocaleString();
}

function historyToArray(historyObj) {
    return Object.keys(historyObj)
        .sort()
        .map(k => ({ time: k, value: historyObj[k] }));
}

function filterByRange(historyArr, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return historyArr.filter(h => new Date(h.time) >= cutoff);
}

export function initWalletChart() {
    const ctx = document.querySelector('.performance-graph').getContext('2d');

    walletChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Wallet Value',
                data: [],
                borderColor: '#0099ff',
                backgroundColor: 'rgba(0,153,255,0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Wallet Performance',
                    color: '#0099ff',
                    font: { size: 18, weight: '600' },
                    padding: { top: 10, bottom: 20 }
                }
            },
            scales: {
                x: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } },
                y: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } }
            }
        }
    });

    updateWalletChart("1W");
}

export function saveWalletValue(value) {
    const now = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem("walletHistory") || "{}");
    history[now] = value;
    const keys = Object.keys(history).sort();
    while (keys.length > 1000) delete history[keys.shift()];

    localStorage.setItem("walletHistory", JSON.stringify(history));
}

export function updateWalletChart(range = "1W") {
    if (!walletChart) return;

    const historyObj = JSON.parse(localStorage.getItem("walletHistory")) || {};
    let historyArr = historyToArray(historyObj);

    let days = 7;
    switch (range) {
        case "1M": days = 30; break;
        case "3M": days = 90; break;
        case "6M": days = 180; break;
        case "1Y": days = 365; break;
    }

    const filtered = filterByRange(historyArr, days);

    walletChart.data.labels = filtered.map(h => formatLabel(h.time, range));
    walletChart.data.datasets[0].data = filtered.map(h => h.value);

    walletChart.update();
}

export function attachTimeRangeButtons() {
    document.querySelectorAll(".time-range-btn").forEach(btn => {
        btn.addEventListener("click", () => updateWalletChart(btn.dataset.range));
    });
}

export function saveCryptoPrice(symbol, price) {
    const now = new Date().toISOString();
    const key = `cryptoHistory_${symbol}`;

    const history = JSON.parse(localStorage.getItem(key) || "[]");
    history.push({ time: now, price });
    if (history.length > 1000) history.shift();

    localStorage.setItem(key, JSON.stringify(history));
}

export function getCryptoHistory(symbol, range = '1M') {
    const key = `cryptoHistory_${symbol}`;
    const history = JSON.parse(localStorage.getItem(key) || "[]");

    let days = 30;
    switch (range) {
        case "1W": days = 7; break;
        case "1M": days = 30; break;
        case "3M": days = 90; break;
        case "6M": days = 180; break;
        case "1Y": days = 365; break;
    }

    return filterByRange(history, days);
}

export async function showCryptoChart(symbol, price, range = "1M") {
    saveCryptoPrice(symbol, price);

    const history = getCryptoHistory(symbol, range);
    if (!history.length) return;

    const labels = history.map(h => formatLabel(h.time, range));
    const values = history.map(h => h.price);
    const lastPerDay = {};
    history.forEach(h => {
        const day = new Date(h.time).toISOString().split("T")[0];
        lastPerDay[day] = h.time;
    });

    const pointRadius = history.map(h => lastPerDay[new Date(h.time).toISOString().split("T")[0]] === h.time ? 3 : 0);

    const canvas = document.getElementById("selected-crypto-graph");
    canvas.style.display = "block";

    if (selectedCryptoChart) {
        selectedCryptoChart.data.labels = labels;
        selectedCryptoChart.data.datasets[0].label = symbol;
        selectedCryptoChart.data.datasets[0].data = values;
        selectedCryptoChart.data.datasets[0].pointRadius = pointRadius;
        selectedCryptoChart.options.plugins.title.text = `${symbol} Performance`;
        selectedCryptoChart.update();
        return;
    }

    const ctx = canvas.getContext("2d");

    selectedCryptoChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: symbol,
                data: values,
                borderColor: "#0099ff",
                backgroundColor: "rgba(0,153,255,0.2)",
                tension: 0.4,
                fill: true,
                pointRadius: pointRadius,
                pointHoverRadius: 5,
                pointHitRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${symbol} Performance`,
                    color: '#0099ff',
                    font: { size: 18, weight: '600' },
                    padding: { top: 10, bottom: 20 }
                }
            },
            scales: {
                x: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } },
                y: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } }
            }
        }
    });
}
