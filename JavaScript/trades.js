// trades.js
import { handleMarketBuy, handleMarketSell, handleLimitBuy, handleLimitSell, handleStopLimitSell, handleStopLossSell, handleTakeProfit } from './orders.js';
import {cancelPendingOrders} from './pending.js';

export function attachTradeButton() {
    const tradeBtn = document.getElementById("tradeBtn");
    tradeBtn.addEventListener("click", () => openHoldingPanel());
}

export function openHoldingPanel(symbol = null) {
    const panel = document.getElementById("holding-trade-panel");
    panel.style.display = "block";

    ["panel-quantity","panel-amount","panel-limitPrice","panel-stopPrice"].forEach(id=>{
        document.getElementById(id).value = "";
    });

    const title = symbol ? `Trade ${symbol}` : "Trade Crypto";
    document.getElementById("holding-panel-title").innerText = title;

    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const coins = [...new Set([...holdings.map(h=>h.symbol),...liveMarket.map(c=>c.symbol)])];

    let select = document.getElementById("panel-coin-select");
    if (!select) {
        select = document.createElement("select");
        select.id = "panel-coin-select";
        select.style.marginBottom = "10px";
        select.style.padding = "5px";
        panel.querySelector(".panel-inputs").prepend(select);
    }
    select.innerHTML = coins.map(c=>`<option value="${c}">${c}</option>`).join("");
    if (symbol) select.value = symbol;

    // Remove old listeners
    ["panel-market-buy","panel-market-sell","panel-limit-buy","panel-stop-limit","panel-cancel-orders","panel-limit-sell","panel-stop-loss","panel-take-profit"].forEach(id=>{
        const btn = document.getElementById(id);
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    // Attach handlers
    document.getElementById("panel-market-buy").addEventListener("click",()=>executePanelOrder("market-buy"));
    document.getElementById("panel-market-sell").addEventListener("click",()=>executePanelOrder("market-sell"));
    document.getElementById("panel-limit-buy").addEventListener("click",()=>executePanelOrder("limit-buy"));
    document.getElementById("panel-stop-limit").addEventListener("click",()=>executePanelOrder("stop-limit"));
    document.getElementById("panel-limit-sell").addEventListener("click",()=>executePanelOrder("limit-sell"));
    document.getElementById("panel-stop-loss").addEventListener("click",()=>executePanelOrder("stop-loss"));
    document.getElementById("panel-take-profit").addEventListener("click",()=>executePanelOrder("take-profit"));
    document.getElementById("panel-cancel-orders").addEventListener("click",()=>{
        const sym = document.getElementById("panel-coin-select").value;
        cancelPendingOrders(sym);
    });
}

export function executePanelOrder(type) {
    const select = document.getElementById("panel-coin-select");
    if (!select) return alert("No coin selected.");
    const symbol = select.value;

    let quantity = parseFloat(document.getElementById("panel-quantity").value);
    let amount = parseFloat(document.getElementById("panel-amount").value);

    // Get current price from live market or holdings
    const liveMarket = JSON.parse(localStorage.getItem("cryptoData"))?.data || [];
    const holdings = JSON.parse(localStorage.getItem("cryptoHoldings")) || [];
    let coinData = liveMarket.find(c=>c.symbol===symbol)||holdings.find(h=>h.symbol===symbol);
    if (!coinData) return alert("Coin not found.");

    const currentPrice = coinData.currentPrice||coinData.quote?.USD?.price;
    if (!currentPrice) return alert("Cannot determine price for this coin.");

    if (!quantity && !amount) return alert("Enter Quantity or Amount");
    if (!quantity && amount) quantity = amount/currentPrice;
    if (!amount && quantity) amount = quantity*currentPrice;

    if (type==="market-buy") handleMarketBuy(symbol, quantity, amount);
    else if(type==="market-sell") handleMarketSell(symbol, quantity, amount);
    else if(type==="limit-buy") handleLimitBuy(symbol, quantity, amount);
    else if(type==="stop-limit") handleStopLimitSell(symbol, quantity, amount);
    else if(type==="limit-sell") handleLimitSell(symbol, quantity, amount);
    else if(type==="stop-loss") handleStopLossSell(symbol, quantity, amount);
    else if(type==="take-profit") handleTakeProfit(symbol, quantity, amount);
}