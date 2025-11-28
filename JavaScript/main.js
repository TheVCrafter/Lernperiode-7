// main.js
import { loadLiveMarket } from './market.js';
import { loadOverview } from './overview.js';
import { openHoldingPanel, attachTradeButton } from './trades.js';
import { loadHoldings } from './holdings.js';
import { checkPendingOrders, loadPendingOrders, cancelPendingOrders } from './pending.js';
import { initWalletChart, updateWalletChart, attachTimeRangeButtons, showCryptoChart } from './charts.js';
import { handleMarketBuy, handleMarketSell, handleLimitBuy, handleLimitSell, handleStopLimitSell, handleStopLossSell, handleTakeProfit } from './orders.js';

window.addEventListener("DOMContentLoaded", async () => {
    await loadLiveMarket();
    loadOverview();
    initWalletChart();
    loadHoldings();
    loadPendingOrders();
    attachTradeButton();
    attachTimeRangeButtons();
    setInterval(loadLiveMarket, 5 * 60 * 1000);
    setInterval(checkPendingOrders, 30 * 1000);
});

document.addEventListener("click", e => {
    const panel = document.getElementById("holding-trade-panel");
    const canvas = document.getElementById("selected-crypto-graph");
    if (panel && !panel.contains(e.target) && !e.target.closest("#tradeBtn") && !e.target.closest("#holdings-body")) panel.style.display = "none";
    if (canvas && !canvas.contains(e.target) && !e.target.closest("#live-market-body")) canvas.style.display = "none";
});

window.showCryptoChart = showCryptoChart;