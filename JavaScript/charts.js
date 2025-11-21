// charts.js
export let walletChart;
export let selectedCryptoChart = null;

// ------------------- Wallet Chart -------------------
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
    updateWalletChart('1W');
}

export function saveWalletValue(value) {
    const now = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem("walletHistory") || "{}");
    history[now] = value;
    localStorage.setItem("walletHistory", JSON.stringify(history));

    const keys = Object.keys(history).sort();
    while (keys.length > 1000) delete history[keys.shift()];
    localStorage.setItem("walletHistory", JSON.stringify(history));
}

export function updateWalletChart(range) {
    const history = JSON.parse(localStorage.getItem("walletHistory")) || {};
    const dates = Object.keys(history).sort();
    const values = Object.values(history);

    let days = 7;
    switch(range) {
        case "1M": days = 30; break;
        case "3M": days = 90; break;
        case "6M": days = 180; break;
        case "1Y": days = 365; break;
    }

    const filteredDates = dates.slice(-days);
    const filteredValues = filteredDates.map(d => history[d]);

    walletChart.data.labels = filteredDates.map(d => new Date(d).toLocaleDateString());
    walletChart.data.datasets[0].data = filteredValues;
    walletChart.update();
}

// ------------------- Selected Crypto Chart -------------------
export async function showCryptoChart(symbol, price) {
    saveCryptoPrice(symbol, price);

    const history = getCryptoHistory(symbol);
    if (!history.length) return;

    const labels = history.map(h => new Date(h.time).toLocaleDateString());
    const values = history.map(h => h.price);

    const canvas = document.getElementById("selected-crypto-graph");
    canvas.style.display = "block";

    if (selectedCryptoChart) {
        selectedCryptoChart.data.labels = labels;
        selectedCryptoChart.data.datasets[0].label = symbol;
        selectedCryptoChart.data.datasets[0].data = values;
        selectedCryptoChart.options.plugins.title.text = `${symbol} Performance`;
        selectedCryptoChart.update();
    } else {
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
                    fill: true
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
    switch(range) {
        case "1W": days = 7; break;
        case "3M": days = 90; break;
        case "6M": days = 180; break;
        case "1Y": days = 365; break;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return history.filter(h => new Date(h.time) >= cutoff);
}

// ------------------- Time Range Buttons -------------------
export function attachTimeRangeButtons() {
    document.querySelectorAll(".time-range-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            updateWalletChart(btn.dataset.range);
        });
    });
}