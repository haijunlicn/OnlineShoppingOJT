import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  /**
   * Export HTML element to PDF with exact layout
   * @param elementId - ID of the HTML element to export
   * @param filename - Name of the PDF file
   * @param options - Additional options for PDF generation
   */
  async exportElementToPdf(
    elementId: string, 
    filename: string = 'export.pdf',
    options: {
      orientation?: 'portrait' | 'landscape';
      format?: 'a4' | 'a3' | 'letter';
      margin?: number;
      scale?: number;
    } = {}
  ): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      // Default options
      const defaultOptions = {
        orientation: 'portrait' as const,
        format: 'a4' as const,
        margin: 10,
        scale: 2
      };
      const finalOptions = { ...defaultOptions, ...options };

      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: finalOptions.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: finalOptions.orientation,
        unit: 'mm',
        format: finalOptions.format
      });

      const imgWidth = pdf.internal.pageSize.getWidth() - (finalOptions.margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeight;
      let position = finalOptions.margin;

      // Add first page
      pdf.addImage(imgData, 'PNG', finalOptions.margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', finalOptions.margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Export table data to PDF with professional styling
   * @param data - Array of objects to export
   * @param columns - Column definitions
   * @param filename - Name of the PDF file
   * @param title - Title for the report (optional)
   */
  exportTableToPdf(
    data: any[],
    columns: { header: string; field: string; width?: number }[],
    filename: string = 'table-export.pdf',
    title: string = 'DATA EXPORT REPORT',
    type?: string
  ): void {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors
    const primaryColor: [number, number, number] = [46, 74, 63]; // Dark green
    const accentColor: [number, number, number] = [201, 184, 124]; // Gold
    const headerBgColor: [number, number, number] = [248, 249, 250]; // Light gray
    const borderColor: [number, number, number] = [233, 236, 239]; // Border gray
    
    // Title Section
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(title.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(201, 184, 124);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, 32, { align: 'center' });

    // Table area
    const tableY = 45;
    const tableHeight = pageHeight - tableY - 30;
    
    // Table headers
    const headerHeight = 12;
    const rowHeight = 10;
    const colWidths = this.calculateColumnWidths(columns, contentWidth);
    
    // Draw header background
    pdf.setFillColor(...headerBgColor);
    pdf.rect(margin, tableY, contentWidth, headerHeight, 'F');
    
    // Draw header border
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, tableY, contentWidth, headerHeight, 'S');
    
    // Header text
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    
    let currentX = margin + 5;
    columns.forEach((col, index) => {
      const colWidth = colWidths[index];
      pdf.text(col.header, currentX, tableY + 8);
      currentX += colWidth;
    });

    // Data rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    let currentY = tableY + headerHeight;
    let rowIndex = 0;
    
    data.forEach((row, dataIndex) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - 30) {
        pdf.addPage();
        
        // Redraw header on new page
        pdf.setFillColor(...headerBgColor);
        pdf.rect(margin, 15, contentWidth, headerHeight, 'F');
        pdf.setDrawColor(...borderColor);
        pdf.rect(margin, 15, contentWidth, headerHeight, 'S');
        
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        
        currentX = margin + 5;
        columns.forEach((col, index) => {
          const colWidth = colWidths[index];
          pdf.text(col.header, currentX, 23);
          currentX += colWidth;
        });
        
        currentY = 15 + headerHeight;
        rowIndex = 0;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(252, 252, 252); // Very light gray
        pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Row border
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.2);
      pdf.line(margin, currentY, margin + contentWidth, currentY);

      // Cell data
      currentX = margin + 5;
      columns.forEach((col, colIndex) => {
        const colWidth = colWidths[colIndex];
        const rawValue = this.getNestedValue(row, col.field);
        const value = this.formatCellValue(rawValue, col.field);
        // Truncate text if too long
        const strValue = value == null ? '' : String(value); // <-- always string
        const maxChars = Math.floor(colWidth / 3);
        const displayValue = strValue.length > maxChars ? strValue.substring(0, maxChars - 3) + '...' : strValue;
        pdf.text(displayValue, currentX, currentY + 7);
        currentX += colWidth;
      });

      currentY += rowHeight;
      rowIndex++;
    });

    // Footer
    const footerY = pageHeight - 20;
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, footerY, pageWidth, 20, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    if (type === 'order') {
      // Order-specific footer
      const totalOrders = data.length;
      const totalRevenue = data.reduce((sum, order) => sum + (order.total || 0), 0);
      pdf.text(`Total Orders: ${totalOrders}`, margin, footerY + 12);
      pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth / 2, footerY + 12, { align: 'center' });
      pdf.text(`Total Revenue: ${totalRevenue.toLocaleString()} MMK`, pageWidth - margin, footerY + 12, { align: 'right' });
    } else if (type === 'product') {
      // Product-specific footer
      pdf.text(`Total Products: ${data.length}`, margin, footerY + 12);
      pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth / 2, footerY + 12, { align: 'center' });
      const totalValue = this.calculateTotalValue(data);
      pdf.text(`Total Value: ${totalValue.toLocaleString()} MMK`, pageWidth - margin, footerY + 12, { align: 'right' });
    } else {
      // For all other types, only show the page number
      pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth / 2, footerY + 12, { align: 'center' });
    }

    // Save PDF
    pdf.save(filename);
  }

  /**
   * Export an order invoice to PDF with modern layout design
   */
  exportOrderInvoiceToPdf(
    order: any, // OrderDetail
    store: any, // StoreLocationDto
    filename: string = 'invoice.pdf'
  ): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Modern color scheme
    const primaryColor: [number, number, number] = [52, 73, 94]; // Dark blue-gray
    const accentColor: [number, number, number] = [231, 76, 60]; // Red accent
    const headerBgColor: [number, number, number] = [245, 246, 250]; // Very light gray
    const borderColor: [number, number, number] = [220, 221, 225]; // Light border
    const textColor: [number, number, number] = [44, 62, 80]; // Dark text
    const lightTextColor: [number, number, number] = [127, 140, 141]; // Light text
    
    let y = 20;
    
    // --- Helper for date formatting ---
    function formatDateTime(dateString: string | undefined | null): string {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Format: dd/MM/yyyy hh:mm AM/PM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    // --- Modern Header Section ---
    // Company section
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('BRITIUM GALLERY', margin, 18);
    
    // Invoice details on the right
    pdf.setFontSize(14);
    pdf.setTextColor(...accentColor);
    pdf.text('INVOICE', pageWidth - margin, 18, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(...lightTextColor);
    pdf.text(`#${order.trackingNumber || order.id}`, pageWidth - margin, 25, { align: 'right' });
    pdf.text(formatDateTime(order.createdDate), pageWidth - margin, 30, { align: 'right' });
    
    y = 40;
    
    // --- Information Grid Layout ---
    const gridY = y;
    const gridHeight = 35;
    const gridColWidth = contentWidth / 3;
    
    // Grid background
    pdf.setFillColor(...headerBgColor);
    pdf.rect(margin, gridY, contentWidth, gridHeight, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, gridY, contentWidth, gridHeight, 'S');
    
    // Vertical dividers
    pdf.line(margin + gridColWidth, gridY, margin + gridColWidth, gridY + gridHeight);
    pdf.line(margin + gridColWidth * 2, gridY, margin + gridColWidth * 2, gridY + gridHeight);
    
    // Section titles
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, gridY, gridColWidth, 8, 'F');
    pdf.rect(margin + gridColWidth, gridY, gridColWidth, 8, 'F');
    pdf.rect(margin + gridColWidth * 2, gridY, gridColWidth, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('CUSTOMER', margin + 5, gridY + 5);
    pdf.text('ORDER INFO', margin + gridColWidth + 5, gridY + 5);
    pdf.text('PAYMENT', margin + gridColWidth * 2 + 5, gridY + 5);
    
    // Customer details
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(order.user?.name || 'N/A', margin + 5, gridY + 15);
    pdf.text(order.user?.email || 'N/A', margin + 5, gridY + 20);
    if (order.shippingAddress?.phoneNumber) {
      pdf.text(order.shippingAddress.phoneNumber, margin + 5, gridY + 25);
    }
    
    // Order details
    pdf.text(`ID: ${order.trackingNumber || order.id}`, margin + gridColWidth + 5, gridY + 15);
    pdf.text(`Status: ${order.currentOrderStatus || 'N/A'}`, margin + gridColWidth + 5, gridY + 20);
    if (order.estimatedDeliveryDate) {
      pdf.text(`Delivery: ${formatDateTime(order.estimatedDeliveryDate)}`, margin + gridColWidth + 5, gridY + 25);
    }
    
    // Payment details
    pdf.text(order.paymentMethod?.methodName || 'N/A', margin + gridColWidth * 2 + 5, gridY + 15);
    pdf.text(`Total: ${(order.totalAmount || 0).toLocaleString()} MMK`, margin + gridColWidth * 2 + 5, gridY + 20);
    
    y = gridY + gridHeight + 15;
    
    // --- Shipping Address Section ---
    const addressY = y;
    const addressHeight = 20;
    
    // Address background
    pdf.setFillColor(...headerBgColor);
    pdf.rect(margin, addressY, contentWidth, addressHeight, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.rect(margin, addressY, contentWidth, addressHeight, 'S');
    
    // Address title
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, addressY, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('SHIPPING ADDRESS', margin + 5, addressY + 5);
    
    // Address content - Single line with wrapping
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    let fullAddress = '';
    if (order.shippingAddress?.address) fullAddress += order.shippingAddress.address;
    if (order.shippingAddress?.township) fullAddress += (fullAddress ? ', ' : '') + order.shippingAddress.township;
    if (order.shippingAddress?.city) fullAddress += (fullAddress ? ', ' : '') + order.shippingAddress.city;
    if (order.shippingAddress?.zipCode) fullAddress += (fullAddress ? ', ' : '') + order.shippingAddress.zipCode;
    if (order.shippingAddress?.country) fullAddress += (fullAddress ? ', ' : '') + order.shippingAddress.country;
    
    // Split address if too long (approximately 60 characters per line)
    const maxCharsPerLine = 60;
    if (fullAddress.length > maxCharsPerLine) {
      const firstLine = fullAddress.substring(0, maxCharsPerLine);
      const secondLine = fullAddress.substring(maxCharsPerLine);
      pdf.text(firstLine, margin + 5, addressY + 15);
      pdf.text(secondLine, margin + 5, addressY + 20);
    } else {
      pdf.text(fullAddress, margin + 5, addressY + 15);
    }
    
    y = addressY + addressHeight + 15;
    
    // --- Items Table with Modern Design ---
    const tableY = y;
    const tableHeaderHeight = 15;
    const rowHeight = 15; // Increased height to accommodate SKU under product name
    
    // Table header with gradient effect
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, tableY, contentWidth, tableHeaderHeight, 'F');
    
    // Header text
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    const colWidths = [95, 20, 35, 35]; // Item (with SKU), Qty, Price, Subtotal
    const colX = [margin + 5, margin + 100, margin + 120, margin + 155];
    
    pdf.text('Product', colX[0], tableY + 10);
    pdf.text('Qty', colX[1], tableY + 10);
    pdf.text('Price', colX[2], tableY + 10);
    pdf.text('Total', colX[3], tableY + 10);
    
    y = tableY + tableHeaderHeight;
    
    // Table data with modern styling
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    order.items.forEach((item: any, index: number) => {
      // Modern alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250); // Very light gray
        pdf.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      
      // Item name with variant options
      let name = item.product?.name || '';
      if (item.variant?.options && Array.isArray(item.variant.options) && item.variant.options.length > 0) {
        const optionsStr = item.variant.options.map((opt: any) => `${opt.optionName}: ${opt.valueName}`).join(', ');
        name += ` [${optionsStr}]`;
      }
      
      // Truncate long names
      if (name.length > 45) {
        name = name.substring(0, 42) + '...';
      }
      
      const qty = String(item.quantity || 0);
      const price = item.price ? `${item.price.toLocaleString()} MMK` : '0 MMK';
      const subtotal = item.totalPrice ? `${item.totalPrice.toLocaleString()} MMK` : '0 MMK';
      const sku = item.variant?.sku || 'N/A';
      
      // Product name and SKU
      pdf.setTextColor(...textColor);
      pdf.text(name, colX[0], y + 6);
      pdf.setTextColor(...lightTextColor);
      pdf.setFontSize(8);
      pdf.text(`SKU: ${sku}`, colX[0], y + 12);
      pdf.setFontSize(9);
      
      // Other columns
      pdf.setTextColor(...textColor);
      pdf.text(qty, colX[1], y + 8);
      pdf.text(price, colX[2], y + 8);
      pdf.text(subtotal, colX[3], y + 8);
      
      y += rowHeight;
    });
    
    // Table bottom border
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + contentWidth, y);
    
    y += 15;
    
    // --- Modern Totals Section ---
    const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
    let discount = 0;
    if (typeof order.getTotalSavings === 'function') {
      discount = order.getTotalSavings();
    } else if (order.totalDiscount) {
      discount = order.totalDiscount;
    } else if (order.items) {
      discount = order.items.reduce((sum: number, item: any) => {
        if (!item.appliedDiscounts) return sum;
        return sum + item.appliedDiscounts.reduce((dSum: number, d: any) => dSum + (d.discountAmount || 0) * (item.quantity || 1), 0);
      }, 0);
    }
    const shippingFee = order.shippingFee || 0;
    const totalPaid = (subtotal - discount + shippingFee);
    
    // Totals container
    const totalsWidth = 100;
    const totalsX = pageWidth - margin - totalsWidth;
    
    // Totals background with primary color border
    pdf.setFillColor(...headerBgColor);
    pdf.rect(totalsX, y, totalsWidth, 50, 'F');
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.rect(totalsX, y, totalsWidth, 50, 'S');
    
    // Totals content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    let currentY = y + 10;
    
    // Subtotal
    pdf.setTextColor(...lightTextColor);
    pdf.text('Subtotal:', totalsX + 5, currentY);
    pdf.setTextColor(...textColor);
    pdf.text(`${subtotal.toLocaleString()} MMK`, totalsX + totalsWidth - 5, currentY, { align: 'right' });
    currentY += 8;
    
    // Discount
    if (discount > 0) {
      pdf.setTextColor(...lightTextColor);
      pdf.text('Discount:', totalsX + 5, currentY);
      pdf.setTextColor(...accentColor);
      pdf.text(`-${discount.toLocaleString()} MMK`, totalsX + totalsWidth - 5, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Shipping
    pdf.setTextColor(...lightTextColor);
    pdf.text('Shipping:', totalsX + 5, currentY);
    pdf.setTextColor(...textColor);
    pdf.text(`${shippingFee.toLocaleString()} MMK`, totalsX + totalsWidth - 5, currentY, { align: 'right' });
    currentY += 12;
    
    // Total line
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(totalsX + 5, currentY, totalsX + totalsWidth - 5, currentY);
    currentY += 8;
    
    // Final total
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('TOTAL:', totalsX + 5, currentY);
    pdf.setTextColor(...primaryColor);
    pdf.text(`${totalPaid.toLocaleString()} MMK`, totalsX + totalsWidth - 5, currentY, { align: 'right' });
    
    y += 60;
    
    // --- Modern Footer Section ---
    const footerY = pageHeight - 25;
    
    // Footer content
    pdf.setTextColor(...lightTextColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Left footer
    pdf.text('Thank you for choosing Britium Gallery!', margin, footerY + 8);
    pdf.text('support@britiumgallery.com', margin, footerY + 14);
    
    // Center footer
    pdf.text('Computer-generated invoice • No signature required', pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Right footer
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 8, { align: 'right' });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY + 14, { align: 'right' });
    
    // Save PDF
    pdf.save(filename);
  }

  /**
   * Export product catalog report with dark theme design
   * @param data - Array of product data
   * @param filename - Name of the PDF file
   * @param options - Additional options
   */
  async exportProductCatalogReport(
    data: any[],
    filename: string = 'product-catalog-report.pdf',
    options: {
      includeVariants?: boolean;
      includeImages?: boolean;
      filters?: any;
      generatedBy?: string;
    } = {}
  ): Promise<void> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors - using black and white for better readability
    const darkBg: [number, number, number] = [20, 20, 20];
    const blackText: [number, number, number] = [0, 0, 0];
    const whiteText: [number, number, number] = [255, 255, 255];
    
    let y = 20;
    
    // Title Section with dark background
    pdf.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add company name as white text (no box)
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('BRITIUM GALLERY', margin + 5, 18);
    
    // Main title
    pdf.setTextColor(whiteText[0], whiteText[1], whiteText[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('PRODUCT CATALOG REPORT', pageWidth / 2, 28, { align: 'center' });
    
    // Separator line
    y = 40;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Report Info Section
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const generatedBy = options.generatedBy || 'Admin';
    const totalProducts = data.length;
    const filters = options.filters || {};
    
    // Report metadata
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(`Generated On:`, margin, y);
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(` ${new Date().toLocaleString()}`, margin + 40, y);
    y += 5;
    
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(`Generated By:`, margin, y);
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(` ${generatedBy}`, margin + 40, y);
    y += 5;
    
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(`Total Products:`, margin, y);
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(` ${totalProducts}`, margin + 40, y);
    y += 5;
    
    // Filters applied
    if (Object.keys(filters).length > 0) {
      pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
      pdf.text(`Filters Applied:`, margin, y);
      y += 5;
      
      Object.entries(filters).forEach(([key, value]) => {
        pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
        pdf.text(`  ${key} = `, margin + 10, y);
        pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
        pdf.text(`"${value}"`, margin + 40, y);
        y += 4;
      });
    }
    
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(`Include Variants:`, margin, y);
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(` ${options.includeVariants ? 'YES' : 'NO'}`, margin + 40, y);
    y += 8;
    
    // Separator
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 8;
    
    // Product Details
    data.forEach((product, index) => {
      // Check if we need a new page
      if (y > pageHeight - 100) {
        pdf.addPage();
        y = 20;
      }
      
      // Product header
      pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`PRODUCT: ${product.product?.name || product.name}`, margin, y);
      y += 5;
      
      this.drawSeparatorLine(pdf, y, pageWidth, margin);
      y += 5;
      
      // Product details (removed description)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      const details = [
        { label: 'Product ID', value: product.id || product.product?.id || 'N/A' },
        { label: 'Brand', value: product.brand?.name || 'N/A' },
        { label: 'Category', value: product.category?.name || 'N/A' },
        { label: 'Base Price', value: product.product?.basePrice || product.basePrice || 0 },
        { label: 'Created Date', value: product.product?.createdDate || product.createdDate || 'N/A' },
        { label: 'Order Count', value: product.product?.orderCount || 0 }
      ];
      
      details.forEach(detail => {
        if (detail.value !== undefined && detail.value !== null) {
          pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
          pdf.text(`${detail.label}:`, margin, y);
          
          let displayValue = detail.value;
          if (detail.label === 'Base Price') {
            displayValue = `${Number(detail.value).toLocaleString()} MMK`;
            pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
          } else {
            pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
          }
          
          pdf.text(` ${displayValue}`, margin + 40, y);
          y += 4;
        }
      });
      
      // Variants section
      if (options.includeVariants && product.variants && product.variants.length > 0) {
        y += 5;
        pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text('VARIANTS', pageWidth / 2, y, { align: 'center' });
        y += 5;
        
        this.drawSeparatorLine(pdf, y, pageWidth, margin);
        y += 5;
        
        // Variants table header
        const variantHeaders = ['SKU', 'Options', 'Price', 'Stock', 'Order Count'];
        const colWidths = [35, 55, 30, 20, 25];
        let x = margin;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        variantHeaders.forEach((header, i) => {
          pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
          pdf.text(`| ${header}`, x, y);
          x += colWidths[i];
        });
        pdf.text('|', x, y);
        y += 4;
        
        this.drawSeparatorLine(pdf, y, pageWidth, margin);
        y += 4;
        
        // Variants data
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        product.variants.forEach((variant: any) => {
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = 20;
          }
          
          x = margin;
          pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
          
          // SKU
          pdf.text(`| ${variant.sku || 'N/A'}`, x, y);
          x += colWidths[0];
          
          // Options - handle different data structures
          let optionsText = 'N/A';
          if (variant.options && variant.options.length > 0) {
            optionsText = variant.options.map((opt: any) => {
              if (opt.valueName) return opt.valueName;
              if (opt.optionValue?.value) return opt.optionValue.value;
              if (opt.value) return opt.value;
              return 'undefined';
            }).join(', ');
          }
          pdf.text(`| ${optionsText}`, x, y);
          x += colWidths[1];
          
          // Price
          pdf.text(`| ${Number(variant.price || 0).toLocaleString()} MMK`, x, y);
          x += colWidths[2];
          
          // Stock
          pdf.text(`| ${variant.stock || 0}`, x, y);
          x += colWidths[3];
          
          // Order Count
          pdf.text(`| ${variant.orderCount || 0}`, x, y);
          x += colWidths[4];
          
          pdf.text('|', x, y);
          y += 4;
        });
        
        this.drawSeparatorLine(pdf, y, pageWidth, margin);
        y += 8;
      }
      
      // Separator between products
      if (index < data.length - 1) {
        this.drawSeparatorLine(pdf, y, pageWidth, margin);
        y += 8;
      }
    });
    
    // Footer
    const footerY = pageHeight - 15;
    pdf.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    pdf.rect(0, footerY, pageWidth, 15, 'F');
    
    pdf.setTextColor(whiteText[0], whiteText[1], whiteText[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Total Products: ${totalProducts} | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 8, { align: 'center' });
    
    pdf.save(filename);
  }

  /**
   * Export Order Status Report
   */


  // Export Bulk Order Status Report (All Orders or Filtered Orders)
  async exportBulkOrderStatusReport(
    ordersData: any[],
    filename: string = 'bulk-order-status-report.pdf',
    options: {
      isFiltered?: boolean;
      filters?: any;
    } = {}
  ): Promise<void> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    let y = 20;
    
    // Title Section
    pdf.setFillColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('ORDER STATUS REPORT', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Report Info
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const reportInfo = options.isFiltered 
      ? `Filtered Orders Report (${ordersData.length} orders)`
      : `All Orders Report (${ordersData.length} orders)`;
    pdf.text(reportInfo, pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Generate Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Process each order
    for (let i = 0; i < ordersData.length; i++) {
      const orderData = ordersData[i];
      
      // Check if we need a new page
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = 20;
      }
      
      // Order Details Section with better formatting
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Order ID      : ${orderData.trackingNumber}`, margin, y);
      y += 6;
      pdf.text(`Customer Name : ${orderData.customerName}`, margin, y);
      y += 6;
      pdf.text(`Order Date    : ${orderData.orderDate}`, margin, y);
      y += 6;
      pdf.text(`Total Amount  : ${orderData.totalAmount}`, margin, y);
      y += 8;
      
      // Status History Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Status History:', margin, y);
      y += 6;
      
      // Status History Table - Simple and Clean Design
      const tableX = margin;
      const tableY = y;
      const colWidths = [15, 40, 45, 30, 35];
      const rowHeight = 7;
      
      // Draw table header - Simple text without background
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      let x = tableX;
      const headers = ['#', 'Status', 'Changed By', 'Role', 'Date'];
      headers.forEach((header, index) => {
        pdf.text(header, x + 2, y + 5);
        x += colWidths[index];
      });
      y += rowHeight;
      
      // Draw separator line under header
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(tableX, y, tableX + colWidths.reduce((sum, width) => sum + width, 0), y);
      y += 2;
      
      // Draw table data - Simple text without background
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      
      if (orderData.statusHistory && orderData.statusHistory.length > 0) {
        orderData.statusHistory.forEach((history: any, index: number) => {
          // Check if we need a new page
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = 20;
          }
          
          x = tableX;
          const rowData = [
            (index + 1).toString(),
            history.status,
            history.changedBy,
            history.role,
            history.date
          ];
          
          rowData.forEach((cell, cellIndex) => {
            pdf.text(cell, x + 2, y + 5);
            x += colWidths[cellIndex];
          });
          y += rowHeight;
        });
      } else {
        // No history row
        x = tableX;
        pdf.text('No status history available', x + 2, y + 5);
        y += rowHeight;
      }
      
      y += 5;
      
      // Notes Section - Inline format (next to label)
      if (orderData.notes && orderData.notes.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Notes:', margin, y);
        
        // Add notes inline (next to the label)
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(orderData.notes, margin + 25, y);
        y += 6;
      }
      
      // Add separator between orders
      if (i < ordersData.length - 1) {
        y += 5;
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    }
    
    // Save the PDF
    pdf.save(filename);
  }

  /**
   * Export comprehensive user detail report to PDF
   * @param reportData - User report data including user info, orders, refunds, and summary
   * @param filename - Name of the PDF file
   */
  async exportUserDetailReport(
    reportData: {
      user: any;
      orders: any[];
      refunds: any[];
      summary: any;
    },
    filename: string = 'user-detail-report.pdf'
  ): Promise<void> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors
    const primaryColor: [number, number, number] = [52, 73, 94]; // Dark blue-gray
    const accentColor: [number, number, number] = [231, 76, 60]; // Red accent
    const headerBgColor: [number, number, number] = [245, 246, 250]; // Very light gray
    const borderColor: [number, number, number] = [220, 221, 225]; // Light border
    const textColor: [number, number, number] = [44, 62, 80]; // Dark text
    const lightTextColor: [number, number, number] = [127, 140, 141]; // Light text
    
    let y = 20;
    
    // --- Header Section ---
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('BRITIUM GALLERY', margin, 18);
    
    pdf.setFontSize(14);
    pdf.text('USER DETAIL REPORT', pageWidth - margin, 18, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(201, 184, 124);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 25, { align: 'right' });
    
    y = 45;
    
    // --- User Information Section ---
    const userInfoY = y;
    const userInfoHeight = 40;
    
    // User info background
    pdf.setFillColor(...headerBgColor);
    pdf.rect(margin, userInfoY, contentWidth, userInfoHeight, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.rect(margin, userInfoY, contentWidth, userInfoHeight, 'S');
    
    // User info title
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, userInfoY, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('USER INFORMATION', margin + 5, userInfoY + 5);
    
    // User details
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const user = reportData.user;
    pdf.text(`Name: ${user.name}`, margin + 5, userInfoY + 15);
    pdf.text(`Email: ${user.email}`, margin + 5, userInfoY + 20);
    pdf.text(`Phone: ${user.phone}`, margin + 5, userInfoY + 25);
    pdf.text(`Address: ${user.address}`, margin + 5, userInfoY + 30);
    pdf.text(`City: ${user.city}`, margin + 5, userInfoY + 35);
    
    // User stats on the right
    pdf.text(`Total Orders: ${user.totalOrders}`, margin + contentWidth / 2, userInfoY + 15);
    pdf.text(`Total Spent: ${user.totalSpent}`, margin + contentWidth / 2, userInfoY + 20);
    pdf.text(`Total Refunds: ${user.totalRefunds}`, margin + contentWidth / 2, userInfoY + 25);
    pdf.text(`Member Since: ${user.memberSince}`, margin + contentWidth / 2, userInfoY + 30);
    
    y = userInfoY + userInfoHeight + 15;
    
    // --- Summary Statistics Section ---
    const summaryY = y;
    const summaryHeight = 30;
    
    // Summary background
    pdf.setFillColor(...headerBgColor);
    pdf.rect(margin, summaryY, contentWidth, summaryHeight, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.rect(margin, summaryY, contentWidth, summaryHeight, 'S');
    
    // Summary title
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, summaryY, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('SUMMARY STATISTICS', margin + 5, summaryY + 5);
    
    // Summary content
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const summary = reportData.summary;
    pdf.text(`Net Spent: ${summary.netSpent.toLocaleString()} MMK`, margin + 5, summaryY + 15);
    pdf.text(`Average Order Value: ${summary.averageOrderValue.toLocaleString()} MMK`, margin + 5, summaryY + 20);
    pdf.text(`Total Refunded: ${summary.totalRefunded.toLocaleString()} MMK`, margin + 5, summaryY + 25);
    
    y = summaryY + summaryHeight + 15;
    
    // --- Orders Section ---
    if (reportData.orders.length > 0) {
      const ordersY = y;
      
      // Orders title
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, ordersY, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(`ORDERS (${reportData.orders.length})`, margin + 5, ordersY + 5);
      
      y = ordersY + 15;
      
      // Orders table
      const orderHeaders = ['Tracking Number', 'Date', 'Status', 'Amount', 'Items', 'Products'];
      const orderColWidths = [30, 25, 30, 30, 15, 50];
      let x = margin;
      
      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...textColor);
      orderHeaders.forEach((header, i) => {
        pdf.text(header, x + 2, y);
        x += orderColWidths[i];
      });
      y += 5;
      
      // Data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      reportData.orders.forEach((order, index) => {
        // Check if we need a new page
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = 20;
        }
        
        x = margin;
        const orderData = [
          order.trackingNumber || order.id.toString(),
          order.orderDate,
          order.status,
          order.totalAmount,
          order.itemsCount.toString(),
          order.products.length > 30 ? order.products.substring(0, 27) + '...' : order.products
        ];
        
        orderData.forEach((cell, cellIndex) => {
          pdf.text(cell, x + 2, y);
          x += orderColWidths[cellIndex];
        });
        y += 4;
      });
      
      y += 10;
    }
    
    // --- Refunds Section ---
    if (reportData.refunds.length > 0) {
      // Check if we need a new page
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = 20;
      }
      
      const refundsY = y;
      
      // Refunds title
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, refundsY, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(`REFUNDS (${reportData.refunds.length})`, margin + 5, refundsY + 5);
      
      y = refundsY + 15;
      
      // Refunds table
      const refundHeaders = ['Refund ID', 'Order ID', 'Date', 'Status', 'Amount', 'Reason'];
      const refundColWidths = [25, 25, 25, 25, 25, 50];
      let x = margin;
      
      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...textColor);
      refundHeaders.forEach((header, i) => {
        pdf.text(header, x + 2, y);
        x += refundColWidths[i];
      });
      y += 5;
      
      // Data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      reportData.refunds.forEach((refund, index) => {
        // Check if we need a new page
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = 20;
        }
        
        x = margin;
        const refundData = [
          refund.id.toString(),
          refund.orderId.toString(),
          refund.createdDate,
          refund.status,
          refund.totalAmount,
          (refund.reason || 'N/A').length > 20 ? (refund.reason || 'N/A').substring(0, 17) + '...' : (refund.reason || 'N/A')
        ];
        
        refundData.forEach((cell, cellIndex) => {
          pdf.text(cell, x + 2, y);
          x += refundColWidths[cellIndex];
        });
        y += 4;
      });
    }
    
    // --- Footer ---
    const footerY = pageHeight - 20;
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, footerY, pageWidth, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Total Orders: ${reportData.summary.totalOrders} | Total Refunds: ${reportData.summary.totalRefunds}`, margin, footerY + 12);
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth / 2, footerY + 12, { align: 'center' });
    pdf.text(`Net Revenue: ${reportData.summary.netSpent.toLocaleString()} MMK`, pageWidth - margin, footerY + 12, { align: 'right' });
    
    // Save PDF
    pdf.save(filename);
  }

  /**
   * Calculate optimal column widths based on content
   */
  private calculateColumnWidths(columns: { header: string; field: string; width?: number }[], totalWidth: number): number[] {
    const defaultWidths: { [key: string]: number } = {
      'product.name': 60,
      'brand.name': 40,
      'category.name': 40,
      'product.basePrice': 35,
      'status': 30,
      'product.createdDate': 45,
      'description': 50
    };

    const widths = columns.map(col => col.width || defaultWidths[col.field] || 40);
    const totalRequestedWidth = widths.reduce((sum, width) => sum + width, 0);
    
    // Scale widths to fit available space
    const scale = totalWidth / totalRequestedWidth;
    return widths.map(width => Math.floor(width * scale));
  }

  /**
   * Format cell value based on field type
   */
  private formatCellValue(value: any, field: string): string {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      return JSON.stringify(value);
    }

    // Add MMK for total and price fields
    if (field === 'total' || field.includes('Price') || field.includes('price')) {
      return typeof value === 'number' ? value.toLocaleString() + ' MMK' : String(value) + ' MMK';
    }

    if (field.includes('Date') || field.includes('date')) {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      }
    }

    return String(value);
  }

  /**
   * Calculate total value of products
   */
  private calculateTotalValue(data: any[]): number {
    return data.reduce((total, item) => {
      const price = item.product?.basePrice || item.basePrice || 0;
      return total + (typeof price === 'number' ? price : 0);
    }, 0);
  }

  // Helper function
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  /**
   * Draw separator line with dashes
   */
  private drawSeparatorLine(pdf: any, y: number, pageWidth: number, margin: number): void {
    const lineLength = pageWidth - (margin * 2);
    const dashLength = 3;
    const gapLength = 2;
    let x = margin;
    
    while (x < margin + lineLength) {
      pdf.line(x, y, Math.min(x + dashLength, margin + lineLength), y);
      x += dashLength + gapLength;
    }
  }
} 