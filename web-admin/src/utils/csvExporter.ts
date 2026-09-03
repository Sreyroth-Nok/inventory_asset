export const exportToCSV = (filename: string, headers: { label: string; key: string }[], data: any[]) => {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  // Header row
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");
  
  // Data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      let val = row[h.key];
      if (val === null || val === undefined) {
        val = "";
      } else if (typeof val === "object") {
        val = JSON.stringify(val);
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csvContent = [headerRow, ...dataRows].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
