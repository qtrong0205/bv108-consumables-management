const CSV_BOM = "\uFEFF";

const escapeCSVCell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

export const buildCSV = (rows: Array<Record<string, unknown>>): string => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => escapeCSVCell(header)).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSVCell(row[header])).join(","),
    ),
  ];

  return `${CSV_BOM}${lines.join("\r\n")}`;
};

export const downloadCSV = (filename: string, rows: Array<Record<string, unknown>>) => {
  const csvContent = buildCSV(rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const parseCSVRows = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows
    .map((row) => row.map((cell) => cell.replace(/^\uFEFF/, "")))
    .filter((row) => row.some((cell) => cell.trim() !== ""));
};
