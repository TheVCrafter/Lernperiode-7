import { openHoldingPanel } from './trades.js';
import { recalcOverview } from './overview.js';

export function loadHoldings() {
    const tbody = document.getElementById("holdings-body");
    if (!tbody) return;

    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    tbody.innerHTML = "";

    holdings.forEach(h => {
        const totalValue = h.quantity * h.currentPrice;
        const profitLoss = (h.currentPrice - h.buyPrice) * h.quantity;
        const profitLossPercent = h.buyPrice ? ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100 : 0;
        const profitLossClass = profitLoss >= 0 ? "positive" : "negative";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${h.symbol}</td>
            <td>${h.quantity.toFixed(6)}</td>
            <td>$${h.currentPrice.toFixed(2)}</td>
            <td>$${totalValue.toFixed(2)}</td>
            <td class="${profitLossClass}">$${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)</td>
        `;
        tbody.appendChild(row);

        row.addEventListener("click", () => openHoldingPanel(h.symbol));
    });
}

export async function refreshHoldingsValues(updateChart = null, range = '1W') {
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    loadHoldings();
    recalcOverview(holdings);

    const { loadPendingOrders } = await import('./pending.js');
    loadPendingOrders();

    const { updateWalletChart } = await import('./charts.js');
    if (updateChart) updateWalletChart(range);
}