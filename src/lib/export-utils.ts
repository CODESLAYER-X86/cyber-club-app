export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  const headers = columns.map(col => `"${col.label}"`).join(',');

  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
