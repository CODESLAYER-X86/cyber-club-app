export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  // Generate CSV headers from columns
  const headers = columns.map(col => `"${col.label}"`).join(',');

  // Map each data row to CSV values using column keys
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      // Escape double quotes and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Create CSV string
  const csv = [headers, ...rows].join('\n');

  // Create Blob and trigger download
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
