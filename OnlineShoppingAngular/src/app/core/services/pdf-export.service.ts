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
   * Export an order invoice to PDF (styled, no logo, always MMK, no tax/terms)
   */
  exportOrderInvoiceToPdf(
    order: any, // OrderDetail
    store: any, // StoreLocationDto
    filename: string = 'invoice.pdf'
  ): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 18;
    const leftMargin = 18;
    const rightMargin = 18;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    // Black and white only
    const tableHeaderBg = [255, 255, 255]; // white
    const tableHeaderText = [0, 0, 0]; // black
    const rowAltBg = [255, 255, 255]; // white

    // --- Company Info ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text(store?.name || 'Store Name', leftMargin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    y += 7;
    if (store?.address) {
      pdf.text(store.address, leftMargin, y);
      y += 5;
    }
    let addrLine = '';
    if (store?.city) addrLine += store.city;
    if (store?.state) addrLine += (addrLine ? ', ' : '') + store.state;
    // if (store?.zipCode) addrLine += (addrLine ? ', ' : '') + store.zipCode;
    if (addrLine) {
      pdf.text(addrLine, leftMargin, y);
      y += 5;
    }
    if (store?.phoneNumber) {
      pdf.text('Phone: ' + store.phoneNumber, leftMargin, y);
      y += 5;
    }

    // --- Invoice Title ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 0);
    pdf.text('INVOICE', pageWidth - rightMargin, 22, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    // --- Invoice Info Box ---
    y += 6;
    const infoBoxX = pageWidth - rightMargin - 60;
    const infoBoxY = y - 2;
    const infoBoxW = 60;
    let infoBoxH = 24; // will adjust if needed
    pdf.setFontSize(10);
    let infoY = y + 3;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice #', infoBoxX + 3, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(order.id).padStart(7, '0'), infoBoxX + 30, infoY);
    infoY += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date', infoBoxX + 3, infoY);
    pdf.setFont('helvetica', 'normal');
    const dateStr = order.createdDate ? new Date(order.createdDate).toLocaleDateString('en-US') : '';
    pdf.text(dateStr, infoBoxX + 30, infoY);
    infoY += 6;
    // --- Order Status in Info Box ---
    pdf.setFont('helvetica', 'bold');
    pdf.text('Status', infoBoxX + 3, infoY);
    pdf.setFont('helvetica', 'normal');
    const statusText = order.currentOrderStatus || '';
    pdf.text(statusText, infoBoxX + 30, infoY);
    // Find status date from statusHistory if available
    let statusDate = '';
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const statusEntry = order.statusHistory.find((s: any) => s.statusCode === order.currentOrderStatus);
      if (statusEntry && statusEntry.createdAt) {
        statusDate = new Date(statusEntry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    }
    if (!statusDate && order.createdDate) {
      statusDate = new Date(order.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (statusDate) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`as of ${statusDate}`, infoBoxX + 3, infoY + 5);
      infoBoxH = Math.max(infoBoxH, (infoY + 8) - infoBoxY);
    }

    // --- Payment Method (below Info Box) ---
    let paymentY = infoY + 10;
    if (order.paymentMethod && order.paymentMethod.methodName) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Payment Method:', infoBoxX + 3, paymentY);
      pdf.setFont('helvetica', 'normal');
      let paymentText = order.paymentMethod.methodName;
      if (order.paymentMethod.type) {
        paymentText += ` (${order.paymentMethod.type})`;
      }
      pdf.text(paymentText, infoBoxX + 35, paymentY);
    }

    // --- Bill To ---
    y += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Bill To', leftMargin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(order.user?.name || '', leftMargin, y + 6);
    let custAddrY = y + 12;
    if (order.shippingAddress) {
      let addr = order.shippingAddress.address || '';
      if (order.shippingAddress.township) addr += ', ' + order.shippingAddress.township;
      pdf.text(addr, leftMargin, custAddrY);
      custAddrY += 5;
      let cityLine = '';
      if (order.shippingAddress.city) cityLine += order.shippingAddress.city;
      // if (order.shippingAddress.zipCode) cityLine += (cityLine ? ', ' : '') + order.shippingAddress.zipCode;
      if (cityLine) {
        pdf.text(cityLine, leftMargin, custAddrY);
        custAddrY += 5;
      }
      // if (order.shippingAddress.country) {
      //   pdf.text(order.shippingAddress.country, leftMargin, custAddrY);
      //   custAddrY += 5;
      // }
      if (order.shippingAddress.phoneNumber) {
        pdf.text('Phone: ' + order.shippingAddress.phoneNumber, leftMargin, custAddrY);
        custAddrY += 5;
      }
    }

    // --- Table Header ---
    y = Math.max(custAddrY, y + 18) + 6;
    pdf.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
    pdf.setTextColor(tableHeaderText[0], tableHeaderText[1], tableHeaderText[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(leftMargin, y, contentWidth, 10, 'F');
    // Restore columns: SL, Description, Qty, Unit Price, Amount
    const colWidths = [12, 80, 18, 35, 35];
    let colX = leftMargin;
    ['SL', 'Description', 'Qty', 'Unit Price', 'Amount'].forEach((header, i) => {
      pdf.text(header, colX + 2, y + 7);
      colX += colWidths[i];
    });

    // --- Table Rows ---
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    let rowY = y + 10;
    order.items.forEach((item: any, idx: number) => {
      colX = leftMargin;
      // All rows white background
      pdf.setFillColor(rowAltBg[0], rowAltBg[1], rowAltBg[2]);
      pdf.rect(leftMargin, rowY, contentWidth, 10, 'F');
      // SL (serial number)
      pdf.text(String(idx + 1), colX + 2, rowY + 7);
      colX += colWidths[0];
      // Description
      pdf.text(item.product?.name || '', colX + 2, rowY + 7);
      colX += colWidths[1];
      // Qty
      pdf.text(String(item.quantity), colX + 2, rowY + 7);
      colX += colWidths[2];
      // Unit Price
      pdf.text((item.price || 0).toLocaleString() + ' MMK', colX + 2, rowY + 7, { align: 'left' });
      colX += colWidths[3];
      // Amount
      pdf.text((item.totalPrice || 0).toLocaleString() + ' MMK', colX + 2, rowY + 7, { align: 'left' });
      rowY += 10;
    });

    // --- Subtotal and Total ---
    rowY += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    // Move to Unit Price + Amount columns (right side)
    let totalLabelX = leftMargin + colWidths[0] + colWidths[1] + colWidths[2];
    pdf.text('Subtotal', totalLabelX, rowY + 7);
    pdf.text((order.subtotal || order.totalAmount || 0).toLocaleString() + ' MMK', totalLabelX + colWidths[3], rowY + 7, { align: 'left' });
    rowY += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Total', totalLabelX, rowY + 7);
    pdf.text((order.totalAmount || 0).toLocaleString() + ' MMK', totalLabelX + colWidths[3], rowY + 7, { align: 'left' });
    pdf.setTextColor(0, 0, 0);

    // --- Footer ---
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Thank you for your purchase!', leftMargin, 285);

    // Save
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
} 