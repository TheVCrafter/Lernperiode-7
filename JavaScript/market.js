import { formatNumber, formatChange, getChangeClass, getRating } from './utils.js';

export const API_URL = "http://localhost:4000/api/crypto";

let allData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 20;
let currentSort = { column: null, order: 1 };

// ---------------- Load Market ----------------
export async function loadLiveMarket() {
    const tbody = document.getElementById("live-market-body");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("API request failed: " + response.status);
        const json = await response.json();
        allData = json.data;
        filteredData = [...allData];
        localStorage.setItem("cryptoData", JSON.stringify({ timestamp: new Date().toISOString(), data: allData }));
        currentPage = 1;
        renderTable();
    } catch (err) {
        console.error("Error loading data:", err);
        tbody.innerHTML = `<tr><td colspan="10">Error loading data.</td></tr>`;
    }
}

// ---------------- Render Table ----------------
function renderTable() {
    const tbody = document.getElementById("live-market-body");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(coin => {
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
        row.addEventListener("click", () => window.showCryptoChart(coin.symbol));
    });

    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(filteredData.length / pageSize)}`;
}

// ---------------- Search ----------------
const searchInput = document.getElementById("market-search");
if (searchInput) {
    searchInput.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();
        filteredData = allData.filter(c =>
            c.symbol.toLowerCase().includes(term) ||
            c.name.toLowerCase().includes(term)
        );
        currentPage = 1;
        renderTable();
    });
}

// ---------------- Sorting ----------------
const headers = document.querySelectorAll("#live-market-table th");
const columnKeys = [
    "symbol",
    "quote.USD.price",
    "quote.USD.market_cap",
    "quote.USD.volume_24h",
    "quote.USD.percent_change_1h",
    "quote.USD.percent_change_24h",
    "quote.USD.percent_change_7d",
    "quote.USD.percent_change_30d",
    "quote.USD.percent_change_1h"
];

headers.forEach((th, idx) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
        const key = columnKeys[idx];
        if (!key) return;
        if (currentSort.column === key) currentSort.order *= -1;
        else currentSort = { column: key, order: 1 };

        filteredData.sort((a, b) => {
            const aVal = getNestedValue(a, key);
            const bVal = getNestedValue(b, key);
            if (typeof aVal === "string") return currentSort.order * aVal.localeCompare(bVal);
            return (aVal - bVal) * currentSort.order;
        });

        renderTable();
    });
});

// ---------------- Pagination ----------------
document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

// ---------------- Helper ----------------
function getNestedValue(obj, path) {
    const val = path.split('.').reduce((o, k) => o?.[k], obj);
    return val !== undefined && val !== null ? val : 0;
}