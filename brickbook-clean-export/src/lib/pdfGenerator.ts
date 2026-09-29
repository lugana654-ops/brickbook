import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer, Sale, PaymentRecord } from "@/context/CustomersContext";

export function formatDateDMY(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function formatRs(val: number) {
  const formatted = Math.abs(val).toLocaleString("en-IN");
  return val < 0 ? `- Rs. ${formatted}` : `Rs. ${formatted}`;
}

export function formatNum(val: number) {
  return val.toLocaleString("en-IN");
}

export function formatRate(rate: number) {
  if (rate === 0) return "-";
  const isInt = Number.isInteger(rate) || Math.abs(rate - Math.round(rate)) < 0.001;
  const numStr = isInt
    ? Math.round(rate).toLocaleString("en-IN")
    : rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `@ Rs. ${numStr}`;
}

export function getRateDisplay(salesForType: Sale[]): string {
  if (salesForType.length === 0) return "-";
  const uniqueRates = Array.from(new Set(salesForType.map((s) => s.ratePerBrick)));
  if (uniqueRates.length === 1) {
    return formatRate(uniqueRates[0]);
  }
  return "Multiple Rates";
}

export function generateCustomerBillPDF(
  customer: Customer,
  filteredSales: Sale[],
  filteredPayments: PaymentRecord[],
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryNavy = [33, 53, 71]; // #213547

  // 1. Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 36, "F");

  // App Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("BRICKBOOK", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(230, 230, 230);
  doc.text("Concrete Brick Manufacturer", 14, 22);
  doc.text("Phone: +91 98765 43210 | Location: Kerala, India", 14, 27);

  // Statement Label on Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 191, 105);
  doc.text("WEEKLY STATEMENT", 196, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Period: ${formatDateDMY(startDate)} to ${formatDateDMY(endDate)}`, 196, 23, { align: "right" });
  doc.text(`Generated: ${formatDateDMY(new Date().toISOString().split("T")[0])}`, 196, 28, { align: "right" });

  // 2. Customer Details Box
  doc.setFillColor(247, 235, 225);
  doc.roundedRect(14, 42, 182, 22, 3, 3, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 42, 182, 22, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(33, 53, 71);
  doc.text(`BILL TO: ${customer.name.toUpperCase()}`, 18, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${customer.countryCode} ${customer.phone}`, 18, 57);
  doc.text(`Location: ${customer.place}`, 120, 57);

  let currentY = 71;

  // 3. Table 1: Sales / Deliveries
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(33, 53, 71);
  doc.text("1. Dispatch & Delivery Register", 14, currentY);
  currentY += 4;

  const salesTableBody = filteredSales.map((s) => {
    const grossTripTotal = s.brickCount * s.ratePerBrick;
    return [
      formatDateDMY(s.date),
      s.vehicleNumber || "-",
      s.brickType,
      formatNum(s.brickCount),
      formatNum(s.ratePerBrick),
      formatNum(grossTripTotal),
      formatNum(s.totalPayment),
      s.paymentMode || (s.totalPayment > 0 ? "Cash" : "Credit / Bill"),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Vehicle No", "Brick Type", "Quantity", "Rate (Rs)", "Total (Rs)", "Paid (Rs)", "Mode"]],
    body: salesTableBody.length > 0 ? salesTableBody : [["No dispatch entries found for this date range.", "", "", "", "", "", "", ""]],
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240], // Light grey row separator border (#e2e8f0)
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [33, 53, 71],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      lineWidth: 0,
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "left" },
      1: { cellWidth: 28, halign: "left" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 26, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
      7: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Table 2: Payments & Collections (if any)
  if (filteredPayments.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(33, 53, 71);
    doc.text("2. Payments & Collections Ledger", 14, currentY);
    currentY += 4;

    const paymentsTableBody = filteredPayments.map((p) => [
      formatDateDMY(p.date),
      "Payment Received",
      formatNum(p.amount),
      p.offerAmount && p.offerAmount > 0 ? formatNum(p.offerAmount) : "-",
      p.paymentMode || "Cash",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Date", "Transaction Type", "Paid (Rs)", "Offer / Discount (Rs)", "Payment Mode"]],
      body: paymentsTableBody,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240], // Light grey row separator (#e2e8f0)
        lineWidth: 0.2,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0,
      },
      columnStyles: {
        0: { cellWidth: 28, halign: "left" },
        1: { cellWidth: 46, halign: "left" },
        2: { cellWidth: 36, halign: "right" },
        3: { cellWidth: 36, halign: "right" },
        4: { cellWidth: 36, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Summary Calculations by Brick Type (Gross calculation before discount)
  const sales4Inch = filteredSales.filter((s) => s.brickType === "4 inch");
  const total4Inch = sales4Inch.reduce((sum, s) => sum + s.brickCount, 0);
  const gross4Inch = sales4Inch.reduce((sum, s) => sum + (s.brickCount * s.ratePerBrick), 0);
  const rateStr4Inch = getRateDisplay(sales4Inch);

  const sales6Inch = filteredSales.filter((s) => s.brickType === "6 inch");
  const total6Inch = sales6Inch.reduce((sum, s) => sum + s.brickCount, 0);
  const gross6Inch = sales6Inch.reduce((sum, s) => sum + (s.brickCount * s.ratePerBrick), 0);
  const rateStr6Inch = getRateDisplay(sales6Inch);

  const totalBricks = total4Inch + total6Inch;
  const grossBill = gross4Inch + gross6Inch;

  const salesAdvancePaid = filteredSales.reduce((sum, s) => sum + s.totalPayment, 0);
  const salesDiscounts = filteredSales.reduce((sum, s) => sum + (s.offerAmount || 0), 0);

  const paymentsCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paymentDiscounts = filteredPayments.reduce((sum, p) => sum + (p.offerAmount || 0), 0);

  const totalDiscounts = salesDiscounts + paymentDiscounts;
  const totalPaidReceived = salesAdvancePaid + paymentsCollected;

  const netBalanceDue = grossBill - totalPaidReceived - totalDiscounts;

  // 6. Statement Summary Box & Mini-Summary Table
  const boxX = 14;
  const boxWidth = 182;
  const has4Inch = total4Inch > 0;
  const has6Inch = total6Inch > 0;
  const hasDiscounts = totalDiscounts > 0;

  // Compute total height for the summary card
  let contentHeight = 12; // Header row
  if (has4Inch) contentHeight += 6;
  if (has6Inch) contentHeight += 6;
  contentHeight += 2; // Divider
  contentHeight += 6; // Total Bricks & Gross Bill
  contentHeight += 5.5; // Total Paid
  if (hasDiscounts) contentHeight += 5.5; // Discounts
  contentHeight += 14; // Net Balance Due Banner + Padding

  if (currentY + contentHeight > 275) {
    doc.addPage();
    currentY = 20;
  }

  // Summary Box Outer Card Container
  doc.setFillColor(248, 250, 252); // #f8fafc slate background
  doc.roundedRect(boxX, currentY, boxWidth, contentHeight, 3, 3, "F");
  doc.setDrawColor(203, 213, 225); // #cbd5e1 border
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, currentY, boxWidth, contentHeight, 3, 3, "D");

  let summaryY = currentY + 6;

  // Columns X coordinates inside boxX (14mm) .. (196mm)
  const col1X = boxX + 6; // Item Description (Left)
  const col2X = boxX + 90; // Quantity (Right)
  const col3X = boxX + 135; // Rate (Right)
  const col4X = boxX + boxWidth - 6; // Amount (Right)

  // Header Row Background bar
  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.rect(boxX + 1, currentY + 1, boxWidth - 2, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate 600

  doc.text("ITEM DESCRIPTION", col1X, summaryY);
  doc.text("QUANTITY", col2X, summaryY, { align: "right" });
  doc.text("RATE", col3X, summaryY, { align: "right" });
  doc.text("AMOUNT", col4X, summaryY, { align: "right" });

  summaryY += 2;
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.2);
  doc.line(boxX + 4, summaryY, boxX + boxWidth - 4, summaryY);
  summaryY += 5;

  // Item Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  if (has4Inch) {
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.text("4\" Concrete Bricks", col1X, summaryY);
    doc.text(`${formatNum(total4Inch)} pcs`, col2X, summaryY, { align: "right" });
    doc.setTextColor(100, 116, 139); // Muted rate
    doc.text(rateStr4Inch, col3X, summaryY, { align: "right" });
    doc.setTextColor(33, 53, 71); // Bold navy amount
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${formatNum(gross4Inch)}`, col4X, summaryY, { align: "right" });
    doc.setFont("helvetica", "normal");
    summaryY += 5.5;
  }

  if (has6Inch) {
    doc.setTextColor(51, 65, 85);
    doc.text("6\" Concrete Bricks", col1X, summaryY);
    doc.text(`${formatNum(total6Inch)} pcs`, col2X, summaryY, { align: "right" });
    doc.setTextColor(100, 116, 139);
    doc.text(rateStr6Inch, col3X, summaryY, { align: "right" });
    doc.setTextColor(33, 53, 71);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${formatNum(gross6Inch)}`, col4X, summaryY, { align: "right" });
    doc.setFont("helvetica", "normal");
    summaryY += 5.5;
  }

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(boxX + 4, summaryY - 1.5, boxX + boxWidth - 4, summaryY - 1.5);
  summaryY += 4;

  // Sub-summary block (Total Bricks & Gross Bill)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 53, 71);
  doc.text("Total Bricks:", col1X, summaryY);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatNum(totalBricks)} pcs`, col1X + 24, summaryY);

  doc.setFont("helvetica", "bold");
  doc.text("Gross Bill:", col3X, summaryY, { align: "right" });
  doc.text(`Rs. ${formatNum(grossBill)}`, col4X, summaryY, { align: "right" });

  summaryY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Total Paid:", col3X, summaryY, { align: "right" });
  doc.setTextColor(4, 120, 87); // Emerald paid
  doc.text(`- Rs. ${formatNum(totalPaidReceived)}`, col4X, summaryY, { align: "right" });

  if (hasDiscounts) {
    summaryY += 5;
    doc.setTextColor(71, 85, 105);
    doc.text("Discount:", col3X, summaryY, { align: "right" });
    doc.setTextColor(4, 120, 87);
    doc.text(`- Rs. ${formatNum(totalDiscounts)}`, col4X, summaryY, { align: "right" });
  }

  summaryY += 6.5;

  // NET BALANCE DUE Row with Warm Amber Highlight
  doc.setFillColor(217, 119, 6); // #d97706 warm amber
  doc.roundedRect(boxX + 1, summaryY - 4, boxWidth - 2, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("NET BALANCE DUE:", col1X, summaryY + 2.5);
  doc.text(
    `Rs. ${formatNum(Math.abs(netBalanceDue))}${netBalanceDue < 0 ? " (Credit)" : ""}`,
    col4X,
    summaryY + 2.5,
    { align: "right" }
  );

  // 7. Footer
  const footerY = 282;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(33, 53, 71);
  doc.text("Thank you for your business!", 105, footerY - 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("For account settlements or UPI payments, please contact +91 98765 43210. Generated by BrickBook.", 105, footerY, { align: "center" });

  // Save PDF
  const filename = `Bill_${customer.name.replace(/\s+/g, "_")}_${startDate}_${endDate}.pdf`;
  doc.save(filename);
}
