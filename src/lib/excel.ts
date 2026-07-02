const escapeHtml = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildExcelTableHtml = (rows: Array<Record<string, unknown>>): string => {
  if (rows.length === 0) {
    return '<table><tr><td>Không có dữ liệu</td></tr></table>';
  }

  const headers = Object.keys(rows[0]);
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const bodyHtml = rows
    .map((row) => {
      const cells = headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <table border="1">
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;
};

export const downloadExcel = (filename: string, rows: Array<Record<string, unknown>>) => {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        ${buildExcelTableHtml(rows)}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
