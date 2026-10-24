import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, LedgerEntry, DispatchRecord, UserSession, PaymentMode } from '@/types';
import { formatFriendlyDate } from './curingCalculator';

export interface StatementBillingSummary {
  previousBalance: number;
  currentPurchases: number;
  totalAmountDue: number;
  paymentReceived: number;
  remainingBalance: number;
}

export function generateCustomerStatementPDF(
  customer: Customer,
  ledger: LedgerEntry[],
  user: UserSession,
  dispatches?: DispatchRecord[],
  payments?: {
    id: string;
    date: string;
    amount: number;
    paymentMode: PaymentMode;
  }[],
  dateRange?: { fromDate?: string; toDate?: string },
  billingSummary?: StatementBillingSummary
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Primary Colors
  const navy = [33, 53, 71]; // #213547
  const darkText = [17, 24, 39]; // #111827

  // Company Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(user.plantName || 'BRICKBOOK MANUFACTURING', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user.location || 'Kerala, India'} | Phone: ${user.phone || '+91 98765 43210'}`, 14, 18);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF ACCOUNT', 196, 15, { align: 'right' });

  // Customer & Meta Info Section
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, 34);

  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(customer.name, 14, 40);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${customer.phone}`, 14, 45);
  doc.text(`Location: ${customer.place || 'N/A'}`, 14, 50);

  // Statement Metadata (Right-aligned)
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(8.5);
  doc.text(`Statement Date: ${todayStr}`, 196, 34, { align: 'right' });
  doc.text(`Account ID: BB-${customer.id.slice(-6).toUpperCase()}`, 196, 39, { align: 'right' });
  if (dateRange?.fromDate || dateRange?.toDate) {
    const from = dateRange.fromDate ? formatFriendlyDate(dateRange.fromDate) : 'Start';
    const to = dateRange.toDate ? formatFriendlyDate(dateRange.toDate) : 'Present';
    doc.text(`Period: ${from} to ${to}`, 196, 44, { align: 'right' });
  } else {
    doc.text('Period: All Time', 196, 44, { align: 'right' });
  }

  // Active records fallback
  const activeDispatches = dispatches || [];
  const activePayments = payments || [];

  // 1. Sales Details Table Data
  const salesTableData =
    activeDispatches.length === 0
      ? [['-', '-', '-', 'No sales records found', '-', '-', '-', '-', '-', '-']]
      : activeDispatches.map((sale, idx) => {
          const blockNominal =
            sale.blockType === '4inch'
              ? '4" Solid'
              : sale.blockType === '6inch'
              ? '6" Solid'
              : sale.blockType?.replace('inch', '"') || 'Block';

          const paid = Number(sale.paidAmount) || 0;
          const total = Number(sale.totalAmount) || 0;
          const balance = Math.max(0, total - paid);

          return [
            String(idx + 1),
            formatFriendlyDate(sale.date),
            sale.vehicleNumber || '-',
            blockNominal,
            sale.quantity.toLocaleString('en-IN'),
            `Rs. ${Number(sale.unitPrice).toFixed(2)}`,
            `Rs. ${total.toLocaleString('en-IN')}`,
            paid > 0 ? `Rs. ${paid.toLocaleString('en-IN')}` : 'Rs. 0',
            sale.paymentMode || 'CREDIT',
            `Rs. ${balance.toLocaleString('en-IN')}`,
          ];
        });

  // Sales Section Header
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('1. Sales Details', 14, 57);

  autoTable(doc, {
    startY: 60,
    head: [[
      'Sl. No.',
      'Date',
      'Vehicle Number',
      'Brick Type',
      'Quantity',
      'Rate per Brick',
      'Total Brick Amount',
      'Amount Paid',
      'Payment Mode',
      'Balance',
    ]],
    body: salesTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 53, 71],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [17, 24, 39],
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'left', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 19 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 19 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 21, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  });

  const salesFinalY = (doc as any).lastAutoTable?.finalY || 100;

  // Check page overflow for Table 2
  let paymentsStartY = salesFinalY + 11;
  if (paymentsStartY > 240) {
    doc.addPage();
    paymentsStartY = 20;
  }

  // 2. Payment Details Table Data
  const paymentsTableData =
    activePayments.length === 0
      ? [['-', '-', 'No payments recorded', '-']]
      : activePayments.map((pay, idx) => [
          String(idx + 1),
          formatFriendlyDate(pay.date),
          `Rs. ${(Number(pay.amount) || 0).toLocaleString('en-IN')}`,
          pay.paymentMode || 'CASH',
        ]);

  // Payment Section Header
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('2. Payment Details', 14, paymentsStartY);

  autoTable(doc, {
    startY: paymentsStartY + 3,
    head: [['Sl. No.', 'Date', 'Amount Paid', 'Payment Mode']],
    body: paymentsTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 53, 71],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [17, 24, 39],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 62, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 60 },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  });

  const paymentsFinalY = (doc as any).lastAutoTable?.finalY || 160;


  // 3. Final Summary Calculations (Previous Outstanding Balance Carry-Forward)
  let previousBalance = 0;
  let currentPurchases = 0;
  let totalAmountDue = 0;
  let paymentReceived = 0;
  let remainingBalance = 0;

  if (billingSummary) {
    previousBalance = billingSummary.previousBalance;
    currentPurchases = billingSummary.currentPurchases;
    totalAmountDue = billingSummary.totalAmountDue;
    paymentReceived = billingSummary.paymentReceived;
    remainingBalance = billingSummary.remainingBalance;
  } else {
    currentPurchases = activeDispatches.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    paymentReceived = activePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    if (dateRange?.fromDate) {
      const priorDispatches = (dispatches || []).filter((d) => d.date < dateRange.fromDate!);
      const priorSales = priorDispatches.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
      const priorPayments = (payments || []).filter((p) => p.date < dateRange.fromDate!);
      const priorPaid = priorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const openBal = Number(customer.openingBalance) || 0;
      previousBalance = Math.max(0, openBal + priorSales - priorPaid);
    } else {
      previousBalance = Number(customer.openingBalance) || 0;
    }

    totalAmountDue = previousBalance + currentPurchases;
    remainingBalance = Math.max(0, totalAmountDue - paymentReceived);
  }

  // Check page overflow for 2-row Summary Box (needs ~55mm)
  let summaryY = paymentsFinalY + 9;
  if (summaryY > 215) {
    doc.addPage();
    summaryY = 20;
  }

  // Section 3 Header
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('3. Account & Balance Summary', 14, summaryY);

  // Row 1: Two cards (Previous Outstanding Balance & Current Week's Purchases)
  const row1Y = summaryY + 4;
  const halfCardWidth = 89;

  // Card 1: Previous Outstanding Balance
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.roundedRect(14, row1Y, halfCardWidth, 19, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.roundedRect(14, row1Y, halfCardWidth, 19, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99);
  doc.text('PREVIOUS OUTSTANDING BALANCE', 14 + halfCardWidth / 2, row1Y + 6, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Rs. ${previousBalance.toLocaleString('en-IN')}`, 14 + halfCardWidth / 2, row1Y + 12.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Unpaid balance carried forward', 14 + halfCardWidth / 2, row1Y + 16.5, { align: 'center' });

  // Card 2: Current Week's Purchases
  const card2X = 14 + halfCardWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, row1Y, halfCardWidth, 19, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, row1Y, halfCardWidth, 19, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99);
  doc.text("CURRENT WEEK'S PURCHASES", card2X + halfCardWidth / 2, row1Y + 6, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Rs. ${currentPurchases.toLocaleString('en-IN')}`, card2X + halfCardWidth / 2, row1Y + 12.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Total purchases in selected period', card2X + halfCardWidth / 2, row1Y + 16.5, { align: 'center' });

  // Row 2: Three cards (Total Amount Due, Payment Received, Remaining Outstanding Balance)
  const row2Y = row1Y + 23;
  const thirdCardWidth = 58;

  // Card 3: Total Amount Due
  doc.setFillColor(241, 245, 249); // light slate/navy tint
  doc.roundedRect(14, row2Y, thirdCardWidth, 21, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, row2Y, thirdCardWidth, 21, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('TOTAL AMOUNT DUE', 14 + thirdCardWidth / 2, row2Y + 6, { align: 'center' });
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Rs. ${totalAmountDue.toLocaleString('en-IN')}`, 14 + thirdCardWidth / 2, row2Y + 13.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Previous Due + Current Purchases', 14 + thirdCardWidth / 2, row2Y + 18, { align: 'center' });

  // Card 4: Payment Received
  const card4X = 14 + thirdCardWidth + 4;
  doc.setFillColor(236, 253, 245); // light emerald tint
  doc.roundedRect(card4X, row2Y, thirdCardWidth, 21, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card4X, row2Y, thirdCardWidth, 21, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('PAYMENT RECEIVED', card4X + thirdCardWidth / 2, row2Y + 6, { align: 'center' });
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${paymentReceived.toLocaleString('en-IN')}`, card4X + thirdCardWidth / 2, row2Y + 13.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Total paid during period', card4X + thirdCardWidth / 2, row2Y + 18, { align: 'center' });

  // Card 5: Remaining Outstanding Balance
  const card5X = card4X + thirdCardWidth + 4;
  const isDue = remainingBalance > 0;
  doc.setFillColor(isDue ? 254 : 236, isDue ? 243 : 253, isDue ? 199 : 245);
  doc.roundedRect(card5X, row2Y, thirdCardWidth, 21, 2, 2, 'F');
  doc.setDrawColor(isDue ? 253 : 167, isDue ? 230 : 243, isDue ? 138 : 208);
  doc.roundedRect(card5X, row2Y, thirdCardWidth, 21, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDue ? 180 : 5, isDue ? 83 : 150, isDue ? 9 : 105);
  doc.text(isDue ? 'REMAINING BALANCE' : 'ACCOUNT SETTLED', card5X + thirdCardWidth / 2, row2Y + 6, { align: 'center' });
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${remainingBalance.toLocaleString('en-IN')}`, card5X + thirdCardWidth / 2, row2Y + 13.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(isDue ? 'Carried forward to next bill' : 'Nil balance due', card5X + thirdCardWidth / 2, row2Y + 18, { align: 'center' });

  summaryY = row2Y + 21;

  // Footer / Signature Section
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.min(Math.max(summaryY + 35, 260), pageHeight - 15);

  doc.setFontSize(7.5);
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
        : 'Solid Concrete Block',
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
