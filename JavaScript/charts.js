// charts.js
export let walletChart;
export let selectedCryptoChart = null;

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
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } },
                y: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } }
            }
        }
    });
    updateWalletChart('1W');
}

export function updateWalletChart(range) {
    const history = JSON.parse(localStorage.getItem("walletHistory")) || {};
    const dates = Object.keys(history).sort();
    const values = Object.values(history);
    let days = 7;

    switch(range){
        case "1M": days=30; break;
        case "3M": days=90; break;
        case "6M": days=180; break;
        case "1Y": days=365; break;
    }

    const filteredDates = dates.slice(-days);
    const filteredValues = filteredDates.map(d => history[d]);

    walletChart.data.labels = filteredDates;
    walletChart.data.datasets[0].data = filteredValues;
    walletChart.update();
}

export async function fetchCryptoHistory(symbol, limit = 30) {
    const cacheKey = `cryptoHistory_${symbol}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    const now = Date.now();
    if (cached.timestamp && now - cached.timestamp < 12 * 60 * 60 * 1000) return cached.data;

    try {
        const response = await fetch(`http://localhost:4000/api/crypto/history?symbol=${symbol}&limit=${limit}`);
        if (!response.ok) throw new Error("Failed to fetch history");
        const json = await response.json();
        const quotes = json.data?.quotes || [];
        const history = quotes.map(q => ({
            date: new Date(q.time_open).toLocaleDateString(),
            price: q.quote.USD.close
        }));
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: history }));
        return history;
    } catch(e) {
        console.error(e);
        return [];
    }
}

export async function showCryptoChart(symbol) {
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
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } },
                    y: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,153,255,0.1)" } }
                }
            }
        });
    }
}

export function attachTimeRangeButtons() {
    document.querySelectorAll(".time-range-btn").forEach(btn => {
        btn.addEventListener("click", () => updateWalletChart(btn.dataset.range));
    });
}