import { escapeHtml, formatCurrency, formatDate } from './utils/escapeHtml.js';

/**
 * Reusable Monochrome Document Logo (Black & White)
 */
export const MONOCHROME_LOGO_SVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="6" fill="#000000"/>
  <path d="M18 8L26 24H10L18 8Z" fill="#FFFFFF"/>
  <circle cx="18" cy="19" r="2.5" fill="#000000"/>
</svg>
`;

/**
 * Reusable Monochrome Document Styles
 * Keeps background completely white and uses black typography, borders, and accents.
 */
export const SHARED_PDF_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #000000;
    background-color: #FFFFFF;
    margin: 0;
    padding: 0;
  }

  .doc-container {
    width: 100%;
    background-color: #FFFFFF;
  }

  /* Header Section */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .header-table td {
    vertical-align: top;
  }

  .brand-cell {
    width: 55%;
  }

  .brand-logo-wrap {
    display: inline-block;
    vertical-align: middle;
    margin-right: 12px;
  }

  .brand-text-wrap {
    display: inline-block;
    vertical-align: middle;
  }

  .company-title {
    font-size: 15pt;
    font-weight: 800;
    color: #000000;
    letter-spacing: -0.3px;
  }

  .company-sub {
    font-size: 8.5pt;
    color: #444444;
    margin-top: 2px;
  }

  .meta-cell {
    width: 45%;
    text-align: right;
  }

  .doc-title {
    font-size: 20pt;
    font-weight: 900;
    color: #000000;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .status-badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 8pt;
    font-weight: 700;
    color: #000000;
    background-color: #FFFFFF;
    border: 1.5px solid #000000;
    border-radius: 3px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }

  .meta-line {
    font-size: 9pt;
    color: #333333;
    margin-top: 2px;
  }

  .meta-line strong {
    color: #000000;
  }

  /* Address & Metadata Cards */
  .address-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    border: 1px solid #000000;
    border-radius: 4px;
  }

  .address-table td {
    width: 50%;
    padding: 12px 14px;
    vertical-align: top;
  }

  .address-table td:first-child {
    border-right: 1px solid #E5E5E5;
  }

  .address-label {
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #555555;
    margin-bottom: 4px;
  }

  .party-name {
    font-size: 10.5pt;
    font-weight: 700;
    color: #000000;
    margin-bottom: 2px;
  }

  .party-detail {
    font-size: 8.5pt;
    color: #333333;
    line-height: 1.35;
  }

  /* Data Table */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  .items-table thead {
    display: table-header-group;
  }

  .items-table th {
    background-color: #000000;
    color: #FFFFFF;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    border: 1px solid #000000;
  }

  .items-table td {
    padding: 8px 10px;
    font-size: 9pt;
    border-bottom: 1px solid #E5E5E5;
    border-left: 1px solid #E5E5E5;
    border-right: 1px solid #E5E5E5;
    page-break-inside: avoid;
    break-inside: avoid;
    color: #000000;
  }

  .row-odd {
    background-color: #FFFFFF;
  }

  .row-even {
    background-color: #FAFAFA;
  }

  .col-num {
    width: 6%;
    text-align: center;
    color: #666666;
  }

  .col-desc {
    width: 48%;
    text-align: left;
  }

  .item-name {
    font-weight: 700;
    color: #000000;
  }

  .item-sku {
    font-size: 7.5pt;
    color: #666666;
    margin-top: 1px;
  }

  .col-qty {
    width: 12%;
    text-align: center;
    color: #000000;
  }

  .col-price {
    width: 16%;
    text-align: right;
    color: #000000;
  }

  .col-total {
    width: 18%;
    text-align: right;
    font-weight: 700;
    color: #000000;
  }

  /* Summary Section */
  .summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .summary-table td {
    vertical-align: top;
  }

  .notes-cell {
    width: 55%;
    padding-right: 20px;
  }

  .notes-box {
    border: 1px solid #CCCCCC;
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 8.5pt;
    color: #333333;
    background-color: #FFFFFF;
  }

  .notes-title {
    font-weight: 800;
    color: #000000;
    margin-bottom: 4px;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .totals-cell {
    width: 45%;
  }

  .totals-table {
    width: 100%;
    border-collapse: collapse;
  }

  .totals-table td {
    padding: 5px 8px;
    font-size: 9pt;
  }

  .totals-label {
    text-align: left;
    color: #444444;
  }

  .totals-value {
    text-align: right;
    color: #000000;
    font-weight: 600;
  }

  .grand-total-row td {
    padding-top: 8px;
    padding-bottom: 8px;
    border-top: 2px solid #000000;
    border-bottom: 2px solid #000000;
    font-size: 11pt;
    font-weight: 900;
    color: #000000;
  }

  /* Footer */
  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #CCCCCC;
    font-size: 8pt;
    color: #666666;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .footer a {
    color: #000000;
    text-decoration: underline;
  }
`;

/**
 * Invoice HTML Template Function (Monochrome Black & White)
 *
 * @param {object} data
 * @returns {string} Full HTML string
 */
export function invoiceTemplate(data = {}) {
    const currency = data.currency || 'USD';
    const items = Array.isArray(data.items) ? data.items : [];

    const calculatedSubtotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + (item.amount !== undefined ? Number(item.amount) : qty * price);
    }, 0);

    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : calculatedSubtotal;
    const discount = Number(data.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : 0.1;
    const taxAmount =
        data.taxAmount !== undefined ? Number(data.taxAmount) : taxableAmount * taxRate;
    const grandTotal = data.total !== undefined ? Number(data.total) : taxableAmount + taxAmount;

    const company = {
        name: data.company?.name || 'Apex Technologies Inc.',
        address: data.company?.address || '100 Innovation Way, Suite 400',
        cityStateZip: data.company?.cityStateZip || 'San Francisco, CA 94107',
        email: data.company?.email || 'billing@apex-template.io',
        phone: data.company?.phone || '+1 (555) 019-2834',
        taxId: data.company?.taxId || 'US-EIN-98-7654321',
    };

    const customer = {
        name: data.customer?.name || 'Valued Customer',
        company: data.customer?.company || '',
        address: data.customer?.address || '456 Market Street',
        cityStateZip: data.customer?.cityStateZip || 'Austin, TX 78701',
        email: data.customer?.email || 'contact@customer.com',
        phone: data.customer?.phone || '',
    };

    const status = (data.status || 'PAID').toUpperCase();
    const logoSvg = data.logoSvg || MONOCHROME_LOGO_SVG;

    const itemRows = items
        .map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPrice) || 0;
            const itemTotal = item.amount !== undefined ? Number(item.amount) : qty * price;
            const isEven = index % 2 === 0;

            return `
        <tr class="${isEven ? 'row-even' : 'row-odd'}">
          <td class="col-num">${index + 1}</td>
          <td class="col-desc">
            <div class="item-name">${escapeHtml(item.description || 'Item')}</div>
            ${item.sku ? `<div class="item-sku">SKU: ${escapeHtml(item.sku)}</div>` : ''}
          </td>
          <td class="col-qty">${escapeHtml(qty)}</td>
          <td class="col-price">${escapeHtml(formatCurrency(price, currency))}</td>
          <td class="col-total">${escapeHtml(formatCurrency(itemTotal, currency))}</td>
        </tr>
      `;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${escapeHtml(data.invoiceNumber || 'INV-0000')}</title>
  <style>
    ${SHARED_PDF_STYLES}
  </style>
</head>
<body>
  <div class="doc-container">
    
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td class="brand-cell">
          <div class="brand-logo-wrap">
            ${logoSvg}
          </div>
          <div class="brand-text-wrap">
            <div class="company-title">${escapeHtml(company.name)}</div>
            <div class="company-sub">Tax ID: ${escapeHtml(company.taxId)}</div>
          </div>
        </td>
        <td class="meta-cell">
          <div class="doc-title">INVOICE</div>
          <div><span class="status-badge">${escapeHtml(status)}</span></div>
          <div class="meta-line"><strong>Invoice #:</strong> ${escapeHtml(data.invoiceNumber || 'INV-2026-0001')}</div>
          <div class="meta-line"><strong>Issue Date:</strong> ${escapeHtml(formatDate(data.issueDate || new Date()))}</div>
          <div class="meta-line"><strong>Due Date:</strong> ${escapeHtml(formatDate(data.dueDate || new Date()))}</div>
        </td>
      </tr>
    </table>

    <!-- Addresses -->
    <table class="address-table">
      <tr>
        <td>
          <div class="address-label">From</div>
          <div class="party-name">${escapeHtml(company.name)}</div>
          <div class="party-detail">${escapeHtml(company.address)}</div>
          <div class="party-detail">${escapeHtml(company.cityStateZip)}</div>
          <div class="party-detail">${escapeHtml(company.email)} · ${escapeHtml(company.phone)}</div>
        </td>
        <td>
          <div class="address-label">Bill To</div>
          <div class="party-name">${escapeHtml(customer.name)}</div>
          ${customer.company ? `<div class="party-detail"><strong>${escapeHtml(customer.company)}</strong></div>` : ''}
          <div class="party-detail">${escapeHtml(customer.address)}</div>
          <div class="party-detail">${escapeHtml(customer.cityStateZip)}</div>
          <div class="party-detail">${escapeHtml(customer.email)}${customer.phone ? ` · ${escapeHtml(customer.phone)}` : ''}</div>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-desc">Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Unit Price</th>
          <th class="col-total">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="text-align: center; color: #666666; padding: 14px;">No line items</td></tr>'}
      </tbody>
    </table>

    <!-- Summary & Totals -->
    <table class="summary-table">
      <tr>
        <td class="notes-cell">
          <div class="notes-box">
            <div class="notes-title">Payment Terms & Notes</div>
            <div>${escapeHtml(data.paymentTerms || 'Payment due within 30 days of invoice date.')}</div>
            ${data.notes ? `<div style="margin-top: 6px;">${escapeHtml(data.notes)}</div>` : ''}
          </div>
        </td>
        <td class="totals-cell">
          <table class="totals-table">
            <tr>
              <td class="totals-label">Subtotal:</td>
              <td class="totals-value">${escapeHtml(formatCurrency(subtotal, currency))}</td>
            </tr>
            ${
                discount > 0
                    ? `
            <tr>
              <td class="totals-label">Discount:</td>
              <td class="totals-value">-${escapeHtml(formatCurrency(discount, currency))}</td>
            </tr>
            `
                    : ''
            }
            <tr>
              <td class="totals-label">Tax (${(taxRate * 100).toFixed(0)}%):</td>
              <td class="totals-value">${escapeHtml(formatCurrency(taxAmount, currency))}</td>
            </tr>
            <tr class="grand-total-row">
              <td class="totals-label">Total Due:</td>
              <td class="totals-value">${escapeHtml(formatCurrency(grandTotal, currency))}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
      Thank you for your business. For billing inquiries, contact <a href="mailto:${escapeHtml(company.email)}">${escapeHtml(company.email)}</a>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Receipt HTML Template Function (Monochrome Black & White)
 *
 * @param {object} data
 * @returns {string} Full HTML string
 */
export function receiptTemplate(data = {}) {
    const currency = data.currency || 'USD';
    const amount = Number(data.amountPaid) || 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${escapeHtml(data.receiptNumber || 'REC-0000')}</title>
  <style>
    ${SHARED_PDF_STYLES}
    .receipt-box {
      border: 1.5px solid #000000;
      border-radius: 6px;
      padding: 24px;
      background: #FFFFFF;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1.5px dashed #000000;
    }
    .amount-banner {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 14px;
      text-align: center;
      margin: 16px 0;
      background: #FFFFFF;
    }
    .amount-label { font-size: 8pt; color: #555555; text-transform: uppercase; font-weight: 800; }
    .amount-val { font-size: 22pt; font-weight: 900; color: #000000; margin-top: 2px; }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .details-table td {
      padding: 8px 0;
      border-bottom: 1px solid #E5E5E5;
      font-size: 9.5pt;
    }
    .details-label { color: #555555; width: 40%; font-weight: 500; }
    .details-value { color: #000000; font-weight: 700; text-align: right; width: 60%; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="receipt-header">
      <div><span class="status-badge">PAYMENT CONFIRMED</span></div>
      <div class="doc-title" style="font-size: 18pt; margin-top: 6px;">Payment Receipt</div>
      <div style="font-size: 8.5pt; color: #555555; margin-top: 2px;">Receipt #${escapeHtml(data.receiptNumber || 'REC-2026-0001')}</div>
    </div>

    <div class="amount-banner">
      <div class="amount-label">Amount Received</div>
      <div class="amount-val">${escapeHtml(formatCurrency(amount, currency))}</div>
    </div>

    <table class="details-table">
      <tr>
        <td class="details-label">Date & Time:</td>
        <td class="details-value">${escapeHtml(formatDate(data.paymentDate || new Date()))}</td>
      </tr>
      <tr>
        <td class="details-label">Payment Method:</td>
        <td class="details-value">${escapeHtml(data.paymentMethod || 'Credit Card')}</td>
      </tr>
      ${
          data.transactionId
              ? `
      <tr>
        <td class="details-label">Transaction Reference:</td>
        <td class="details-value">${escapeHtml(data.transactionId)}</td>
      </tr>
      `
              : ''
      }
      <tr>
        <td class="details-label">Customer Name:</td>
        <td class="details-value">${escapeHtml(data.customerName || 'Valued Customer')}</td>
      </tr>
      ${
          data.customerEmail
              ? `
      <tr>
        <td class="details-label">Customer Email:</td>
        <td class="details-value">${escapeHtml(data.customerEmail)}</td>
      </tr>
      `
              : ''
      }
      ${
          data.description
              ? `
      <tr>
        <td class="details-label">Description:</td>
        <td class="details-value">${escapeHtml(data.description)}</td>
      </tr>
      `
              : ''
      }
    </table>

    <div class="footer">
      Apex Platform · Automatic Billing System · Keep this receipt for your records
    </div>
  </div>
</body>
</html>`;
}

export { escapeHtml, formatCurrency, formatDate } from './utils/escapeHtml.js';
