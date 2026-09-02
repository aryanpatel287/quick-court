/**
 * Table Export Utilities for CSV, Excel, and PDF formats.
 */

function formatCSVCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
}

function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Export array of data objects to CSV file
 */
export function exportToCSV(data = [], columns = [], filename = 'table-export.csv') {
    if (!data || data.length === 0) return;

    const visibleCols = columns.filter(
        (c) => c.key !== 'action' && c.key !== 'actions' && c.key !== 'selection',
    );
    const headers = visibleCols.map((c) => formatCSVCell(c.label || c.key)).join(',');

    const rows = data.map((row) => {
        return visibleCols.map((c) => formatCSVCell(row[c.key])).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export array of data objects to Excel Spreadsheet (.xls XML format)
 */
export function exportToExcel(data = [], columns = [], filename = 'table-export.xls') {
    if (!data || data.length === 0) return;

    const visibleCols = columns.filter(
        (c) => c.key !== 'action' && c.key !== 'actions' && c.key !== 'selection',
    );

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="HeaderStyle">
    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataStyle">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
</Styles>
<Worksheet ss:Name="Sheet1">
<Table>
<Row>`;

    visibleCols.forEach((col) => {
        xml += `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.label || col.key)}</Data></Cell>`;
    });
    xml += `</Row>`;

    data.forEach((row) => {
        xml += `<Row>`;
        visibleCols.forEach((col) => {
            const val = row[col.key] ?? '';
            xml += `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        });
        xml += `</Row>`;
    });

    xml += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export array of data objects to formatted printable PDF window
 */
export function exportToPDF(
    data = [],
    columns = [],
    filename = 'table-export',
    title = 'Data Table Report',
) {
    if (!data || data.length === 0) return;

    const visibleCols = columns.filter(
        (c) => c.key !== 'action' && c.key !== 'actions' && c.key !== 'selection',
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const headerCells = visibleCols
        .map((col) => `<th>${escapeXml(col.label || col.key)}</th>`)
        .join('');
    const bodyRows = data
        .map((row) => {
            const cells = visibleCols
                .map((col) => `<td>${escapeXml(row[col.key] ?? '')}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${escapeXml(title)}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 16px;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .report-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
    .report-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #94a3b8;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <h1 class="report-title">${escapeXml(title)}</h1>
      <div class="report-meta">Generated on ${new Date().toLocaleString()} • ${data.length} Record(s)</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
  <div class="footer">Confidential • Generated from Application</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
