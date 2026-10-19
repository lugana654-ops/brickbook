import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, LedgerEntry, DispatchRecord, UserSession } from '@/types';
import { formatFriendlyDate } from './curingCalculator';

export function generateCustomerStatementPDF(
  customer: Customer,
  ledger: LedgerEntry[],
  user: UserSession
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Primary Colors
  const navy = [33, 53, 71]; // #213547
  const amber = [217, 119, 6]; // #d97706
  const darkText = [17, 24, 39]; // #111827

  // Company Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(user.plantName || 'BRICKBOOK MANUFACTURING', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user.location || 'Kerala, India'} | Phone: ${user.phone || '+91 98765 43210'}`, 14, 18);
  doc.text('STATEMENT OF ACCOUNT', 196, 15, { align: 'right' });

  // Customer & Meta Info Section
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, 35);

  doc.setFontSize(13);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(customer.name, 14, 41);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${customer.phone}`, 14, 46);
  doc.text(`Location: ${customer.place}`, 14, 51);

  // Statement Metadata (Right-aligned)
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setTextColor(75, 85, 99);
  doc.text(`Statement Date: ${todayStr}`, 196, 35, { align: 'right' });
  doc.text(`Account ID: BB-${customer.id.slice(-6).toUpperCase()}`, 196, 40, { align: 'right' });

  // Summary Metrics Banner
  doc.setFillColor(243, 244, 246); // #f3f4f6
  doc.roundedRect(14, 56, 182, 18, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('Opening Balance', 20, 62);
  doc.text('Total Invoiced', 70, 62);
  doc.text('Total Payments', 120, 62);
  doc.text('Outstanding Due', 165, 62);

  const totalInvoiced = ledger.reduce((sum, e) => sum + e.debit, 0);
  const totalPaid = ledger.reduce((sum, e) => sum + e.credit, 0);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Rs. ${(customer.openingBalance || 0).toLocaleString('en-IN')}`, 20, 70);
  doc.text(`Rs. ${(totalInvoiced || 0).toLocaleString('en-IN')}`, 70, 70);
  doc.setTextColor(5, 150, 105); // Green
  doc.text(`Rs. ${(totalPaid || 0).toLocaleString('en-IN')}`, 120, 70);

  doc.setTextColor(amber[0], amber[1], amber[2]);
  doc.text(`Rs. ${(customer.currentBalance || 0).toLocaleString('en-IN')}`, 165, 70);

  // Table Data Preparation
  const tableData = ledger.map((row) => [
    formatFriendlyDate(row.date),
    row.description,
    row.vehicleNumber || '-',
    row.reference || row.mode || '-',
    row.debit > 0 ? `Rs. ${(row.debit || 0).toLocaleString('en-IN')}` : '-',
    row.credit > 0 ? `Rs. ${(row.credit || 0).toLocaleString('en-IN')}` : '-',
    `Rs. ${(row.balance || 0).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Particulars', 'Vehicle No', 'Mode / Ref', 'Debit (+)', 'Credit (-)', 'Balance']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [33, 53, 71],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [17, 24, 39],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { halign: 'left', cellWidth: 46 },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer / Signature Section
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.min(Math.max(finalY + 20, 240), pageHeight - 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('This is a computer-generated statement from BrickBook Management System.', 14, footerY);
  doc.text('Authorized Signature & Stamp: ___________________________', 196, footerY, { align: 'right' });

  // Save PDF to browser
  const filename = `${customer.name.replace(/\s+/g, '_')}_Statement_${todayStr.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

export function generateDispatchSlipPDF(
  dispatch: DispatchRecord,
  customer: Customer,
  user: UserSession
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 for compact delivery slip
  });

  const navy = [33, 53, 71];
  const amber = [217, 119, 6];

  // Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 148, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(user.plantName || 'BRICKBOOK MANUFACTURING', 10, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DELIVERY CHALLAN / DISPATCH SLIP', 138, 10, { align: 'right' });
  doc.text(`${user.location || 'Kerala'} | Ph: ${user.phone}`, 10, 17);

  // Metadata Box
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Slip No: DC-${dispatch.id.slice(-6).toUpperCase()}`, 10, 30);
  doc.text(`Date: ${formatFriendlyDate(dispatch.date)}`, 138, 30, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${customer.name}`, 10, 36);
  doc.text(`Destination: ${customer.place}`, 10, 41);
  doc.text(`Phone: ${customer.phone}`, 10, 46);

  // Transport details
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(10, 50, 128, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Kerala Vehicle No: ${dispatch.vehicleNumber}`, 14, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Driver: ${dispatch.driverName || 'N/A'} | Contact: ${dispatch.driverPhone || 'N/A'}`, 14, 61);

  // Items Table
  const items = [
    [
      dispatch.blockType === '4inch'
        ? '4-inch Solid Concrete Block'
        : dispatch.blockType === '6inch'
        ? '6-inch Solid Concrete Block'
        : '8-inch Hollow Block',
      `${dispatch.quantity} Pcs`,
      `Rs. ${dispatch.unitPrice.toFixed(2)}`,
      `Rs. ${dispatch.totalAmount.toLocaleString('en-IN')}`,
    ],
  ];

  autoTable(doc, {
    startY: 68,
    head: [['Item Description', 'Quantity', 'Rate', 'Total Amount']],
    body: items,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 53, 71],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [17, 24, 39],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 24 },
      3: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 110;

  // Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Receiver Signature: ___________________', 10, finalY + 25);
  doc.text('For BrickBook: ___________________', 138, finalY + 25, { align: 'right' });

  doc.save(`Dispatch_${dispatch.vehicleNumber}_${dispatch.id.slice(-4)}.pdf`);
}
