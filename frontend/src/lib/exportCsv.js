import { getCategory } from "./mock.js";

/**
 * Exports a list of transactions into a downloadable CSV file.
 * @param {Array} transactions 
 * @param {string} filename 
 */
export function exportTransactionsToCsv(transactions = [], filename = "wallet_tracker_transactions.csv") {
  if (!transactions || transactions.length === 0) {
    return false;
  }

  const headers = ["Date", "Description", "Category", "Type", "Amount", "Payment Method"];
  
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map((t) => {
    const dateStr = t.date ? new Date(t.date).toISOString().split("T")[0] : "";
    const categoryLabel = getCategory(t.category)?.label || t.category || "Other";
    const type = t.type ? t.type.toUpperCase() : "EXPENSE";
    const amount = Number(t.amount) || 0;
    const account = t.account || t.paymentMethod || "Other";
    const desc = t.description || t.merchant || "Transaction";

    return [
      escapeCsv(dateStr),
      escapeCsv(desc),
      escapeCsv(categoryLabel),
      escapeCsv(type),
      amount.toFixed(2),
      escapeCsv(account),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
