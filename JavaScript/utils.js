// utils.js
export function formatNumber(num) {
    if (!num || isNaN(num)) return "N/A";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

export function formatChange(val) {
    return val != null && !isNaN(val) ? val.toFixed(2) + "%" : "N/A";
}

export function getChangeClass(val) {
    return val >= 0 ? "positive" : "negative";
}

export function getRating(change) {
    if (change > 5) return "🟢 Strong Buy";
    if (change > 0) return "🟡 Buy";
    if (change < -5) return "🔴 Strong Sell";
    return "⚪ Hold";
}