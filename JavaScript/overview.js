//overview.js
export function loadOverview() {
    let saved = localStorage.getItem("overviewData");
    if (!saved) {
        const defaultData = { accountValue: 5000, cash: 5000, change24h: 0 };
        localStorage.setItem("overviewData", JSON.stringify(defaultData));
        saved = JSON.stringify(defaultData);
    }
    const data = JSON.parse(saved);
    updateOverviewUI(data);
}

export function updateOverviewUI(data) {
    document.getElementById("overview-value").innerText = `Account Value: $${data.accountValue.toFixed(2)}`;
    document.getElementById("overview-cash").innerText = `Cash: $${data.cash.toFixed(2)}`;
    const changeSymbol = data.change24h > 0 ? "▲" : data.change24h < 0 ? "▼" : "";
    const changeText = `${data.change24h.toFixed(2)}% ${changeSymbol}`;
    const changeElem = document.getElementById("overview-change");
    changeElem.innerText = `24h Change: ${changeText}`;
    changeElem.style.color = data.change24h > 0 ? "green" : data.change24h < 0 ? "red" : "gray";
}

export function saveOverviewData(updates) {
    const saved = JSON.parse(localStorage.getItem("overviewData") || "{}");
    const newData = { ...saved, ...updates };
    localStorage.setItem("overviewData", JSON.stringify(newData));
    updateOverviewUI(newData);
}
