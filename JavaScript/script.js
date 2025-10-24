// === JavaScript/script.js ===
// Fetches data from your local proxy server (no CORS issues)

const API_URL = "http://localhost:4000/api/crypto";

async function loadCryptoData() {
    const tbody = document.getElementById("crypto-table-body");
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Proxy request failed: " + response.status);

        const json = await response.json();
        const data = json.data;
        tbody.innerHTML = "";

        data.forEach((coin) => {
            const quote = coin.quote.USD;
            const row = document.createElement("tr");

            const price = quote.price;
            const marketCap = quote.market_cap;
            const change1h = quote.percent_change_1h;
            const volume = quote.volume_24h;
            const change24h = quote.percent_change_24h;
            const change7d = quote.percent_change_7d;
            const change30d = quote.percent_change_30d;

            row.innerHTML = `
        <td data-label="Symbol">${coin.symbol}</td>
        <td data-label="Price">$${formatNumber(price)}</td>
        <td data-label="Market Cap">$${formatNumber(marketCap)}</td>
        <td data-label="24h Volume">$${formatNumber(volume)}</td>
        <td data-label="1h Change" class="${getChangeClass(change1h)}">${formatChange(change1h)}</td>
        <td data-label="24h Change" class="${getChangeClass(change24h)}">${formatChange(change24h)}</td>
        <td data-label="7d Change" class="${getChangeClass(change7d)}">${formatChange(change7d)}</td>
        <td data-label="30d Change" class="${getChangeClass(change30d)}">${formatChange(change30d)}</td>
        <td data-label="Technical Rating">${getRating(change1h)}</td>
      `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading data:", error);
        tbody.innerHTML = `<tr><td colspan="10">Error loading data. Please try again later.</td></tr>`;
    }
}

// 🔹 Helper: format numbers nicely
function formatNumber(num) {
    if (num == null || isNaN(num)) return "N/A";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

// 🔹 Helper: format % changes
function formatChange(value) {
    return value != null && !isNaN(value) ? `${value.toFixed(2)}%` : "N/A";
}

// 🔹 Helper: set positive/negative colors
function getChangeClass(value) {
    if (value == null || isNaN(value)) return "";
    return value >= 0 ? "positive" : "negative";
}

// 🔹 Helper: calculate technical rating
function getRating(change) {
    if (change > 5) return "🟢 Strong Buy";
    if (change > 0) return "🟡 Buy";
    if (change < -5) return "🔴 Strong Sell";
    return "⚪ Hold";
}

// Auto-refresh every 5 minutes
loadCryptoData();
setInterval(loadCryptoData, 5 * 60 * 1000);
