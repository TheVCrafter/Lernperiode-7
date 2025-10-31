const API_URL = "http://localhost:4000/api/crypto";

window.addEventListener("DOMContentLoaded", async () => {
    await loadLiveMarket();
    loadOverview();
    loadHoldings();
    attachTradeListener();
    initPerformanceChart();
    setInterval(loadLiveMarket, 5 * 60 * 1000);
});

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
        });

        addRowClickListeners();
    } catch (error) {
        console.error("Error loading data:", error);
        tbody.innerHTML = `<tr><td colspan="10">Error loading data.</td></tr>`;
    }
}

function formatNumber(num) {
    if (num == null || isNaN(num)) return "N/A";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

function formatChange(val) {
    return val != null && !isNaN(val) ? val.toFixed(2) + "%" : "N/A";
}

function getChangeClass(val) {
    if (val == null || isNaN(val)) return "";
    return val >= 0 ? "positive" : "negative";
}

function getRating(change) {
    if (change > 5) return "🟢 Strong Buy";
    if (change > 0) return "🟡 Buy";
    if (change < -5) return "🔴 Strong Sell";
    return "⚪ Hold";
}

function loadOverview() {
    let saved = localStorage.getItem("overviewData");
    if (!saved) {
        localStorage.setItem("overviewData", JSON.stringify({ accountValue: 5000, cash: 5000, change24h: 0 }));
        saved = localStorage.getItem("overviewData");
    }
    const data = JSON.parse(saved);
    document.getElementById("overview-value").innerText = `Account Value: $${data.accountValue.toFixed(2)}`;
    document.getElementById("overview-cash").innerText = `Cash: $${data.cash.toFixed(2)}`;
    let changeText = data.change24h === 0 ? "0%" : `${data.change24h.toFixed(2)}% ${data.change24h > 0 ? "▲" : "▼"}`;
    document.getElementById("overview-change").innerText = `24h Change: ${changeText}`;
}

function loadHoldings() {
    const tbody = document.getElementById("holdings-body");
    if (!tbody) return;

    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    tbody.innerHTML = "";
    holdings.forEach(h => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${h.symbol}</td>
            <td>${h.quantity.toFixed(6)}</td>
            <td>$${h.currentPrice.toFixed(2)}</td>
            <td>$${(h.quantity * h.currentPrice).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function attachTradeListener() {
    const btn = document.getElementById("trade-confirmationBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        const orderType = document.getElementById("order-type").value;
        if (orderType === "market-buy") processMarketBuy();
        else alert("Market sell not implemented yet");
    });
}

function processMarketBuy() {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData"));

    const symbol = document.getElementById("trade-currency").value.toUpperCase();
    let amount = parseFloat(document.getElementById("trade-amount").value);
    let quantity = parseFloat(document.getElementById("trade-quantity").value);

    const cryptoData = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coin = cryptoData.find(c => c.symbol === symbol);
    if (!coin) { alert("Coin not found in market data"); return; }

    const price = coin.quote.USD.price;

    if (amount && !quantity) quantity = amount / price;
    else if (quantity && !amount) amount = quantity * price;
    else if (!amount && !quantity) { alert("Enter either amount or quantity"); return; }

    if (overview.cash < amount) { alert("Not enough cash!"); return; }
    overview.cash -= amount;

    const existing = holdings.find(h => h.symbol === symbol);
    if (existing) {
        existing.quantity += quantity;
        existing.currentPrice = price;
    } else {
        holdings.push({ symbol, currentPrice: price, quantity });
    }

    localStorage.setItem("overviewData", JSON.stringify(overview));
    localStorage.setItem("cryptoHoldings", JSON.stringify(holdings));

    loadOverview();
    loadHoldings();
    saveDailySnapshot();
    updateWalletChart('1W');
    alert(`Bought ${quantity.toFixed(6)} ${symbol} for $${amount.toFixed(2)}`);
}

const tradeBtn = document.getElementById("tradeBtn");
const tradeSection = document.querySelector(".Trade");
const tradeCloseBtn = document.getElementById("trade-closeBtn");

tradeBtn.addEventListener("click", () => { tradeSection.style.display = "flex"; });
tradeCloseBtn.addEventListener("click", () => { tradeSection.style.display = "none"; });

const liveMarketBody = document.getElementById("live-market-body");
const selectedCryptoCanvas = document.getElementById("selected-crypto-graph").getContext("2d");
let selectedCryptoChart;

function addRowClickListeners() {
    const rows = liveMarketBody.querySelectorAll("tr");
    rows.forEach(row => {
        row.addEventListener("click", () => {
            const symbol = row.cells[0].innerText;
            showCryptoChart(symbol, '1W');
        });
    });
}

function saveDailySnapshot() {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const overview = JSON.parse(localStorage.getItem("overviewData")) || { accountValue: 5000, cash: 5000 };
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("walletHistory")) || {};

    const totalValue = overview.cash + holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    history[today] = totalValue;
    localStorage.setItem("walletHistory", JSON.stringify(history));
}

let walletChart;
function initWalletChart() {
    const ctx = document.querySelector('.performance-graph').getContext('2d');

    walletChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Wallet Value', data: [], borderColor: '#0099ff', backgroundColor: 'rgba(0,153,255,0.2)', tension: 0.4 }] },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } },
                y: { ticks: { color: '#e3edf7' }, grid: { color: 'rgba(0,153,255,0.1)' } }
            }
        }
    });

    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateWalletChart(btn.dataset.range);
        });
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

function showCryptoChart(symbol, range = "1W") {
    const cryptoHistory = JSON.parse(localStorage.getItem("cryptoHistory")) || {};
    const coinHistory = cryptoHistory[symbol] || {};

    const dates = Object.keys(coinHistory).sort();
    const values = Object.values(coinHistory);

    let days = 7;

    const filteredDates = dates.slice(-days);
    const filteredValues = filteredDates.map(d => coinHistory[d]);

    if (selectedCryptoChart) {
        selectedCryptoChart.data.labels = filteredDates;
        selectedCryptoChart.data.datasets[0].data = filteredValues;
        selectedCryptoChart.options.plugins.title.text = symbol + " Performance";
        selectedCryptoChart.update();
        return;
    }

    selectedCryptoChart = new Chart(selectedCryptoCanvas, {
        type: "line",
        data: {
            labels: filteredDates,
            datasets: [{
                label: symbol + " Price (USD)",
                data: filteredValues,
                borderColor: "#00ff99",
                backgroundColor: "rgba(0,255,153,0.2)",
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: symbol + " Performance", color: "#e3edf7" },
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,255,153,0.1)" } },
                y: { ticks: { color: "#e3edf7" }, grid: { color: "rgba(0,255,153,0.1)" } }
            }
        }
    });
}

function updateAllCryptoHistory(data) {
    const cryptoHistory = JSON.parse(localStorage.getItem("cryptoHistory")) || {};
    const today = new Date().toISOString().split("T")[0];

    data.forEach(coin => {
        if (!cryptoHistory[coin.symbol]) cryptoHistory[coin.symbol] = {};
        cryptoHistory[coin.symbol][today] = coin.quote.USD.price;
    });

    localStorage.setItem("cryptoHistory", JSON.stringify(cryptoHistory));
}