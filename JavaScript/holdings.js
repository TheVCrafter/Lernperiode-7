//holdings.js
import { openHoldingPanel } from './trades.js';

export function loadHoldings() {
    const tbody = document.getElementById("holdings-body");
    if (!tbody) return;
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    tbody.innerHTML = "";

    holdings.forEach(h => {
        const totalValue = h.quantity * h.currentPrice;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${h.symbol}</td>
            <td>${h.quantity.toFixed(6)}</td>
            <td>$${h.currentPrice.toFixed(2)}</td>
            <td>$${totalValue.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
        row.addEventListener("click", () => openHoldingPanel(h.symbol));
    });
}

export async function refreshHoldingsValues(updateChart = null, range = '1W') {
    loadHoldings();
    const { loadOverview } = await import('./overview.js');
    loadOverview();
    const { loadPendingOrders } = await import('./pending.js');
    loadPendingOrders();
    if (updateChart) updateChart(range);
}