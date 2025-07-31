import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }
  /**
   * Export data to Excel file
   * @param data - Array of objects to export
   * @param columns - Column definitions
   * @param filename - Name of the Excel file
   * @param sheetName - Name of the worksheet
   * @param title - Title for the report (optional)
   */
  async exportToExcel(
    data: any[],
    columns: { header: string; field: string; width?: number }[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1',
    title: string = 'Data Export Report'
  ): Promise<void> {
    try {
      // Dynamic import to avoid build issues
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Add title row
      worksheet.addRow([title]);
      worksheet.addRow([`Generated on: ${new Date().toLocaleDateString()}`]);
      worksheet.addRow([]); // Empty row

      // Add headers
      const headerRow = worksheet.addRow(columns.map(col => col.header));
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(
          columns.map(col => {
            const value = this.getNestedValue(row, col.field);
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            // Add MMK for total and price fields
            if (col.field === 'total' || col.field.includes('Price') || col.field.includes('price')) {
              return typeof value === 'number' ? value.toLocaleString() + ' MMK' : String(value) + ' MMK';
            }
            return value;
          })
        );
      });

      // Set column widths
      columns.forEach((col, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = col.width || 15;
      });

      // Style the title
      const titleRow = worksheet.getRow(1);
      titleRow.font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.mergeCells('A1:' + this.getColumnLetter(columns.length) + '1');

      // Style the date row
      const dateRow = worksheet.getRow(2);
      dateRow.font = { italic: true };
      dateRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.mergeCells('A2:' + this.getColumnLetter(columns.length) + '2');

      // Add borders to data
      const dataRange = worksheet.getCell(4, 1).address + ':' +
        worksheet.getCell(data.length + 3, columns.length).address;
      worksheet.getCell(dataRange).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw error;
    }
  }

  /**
   * Export multiple sheets to Excel
   * @param sheets - Array of sheet configurations
   * @param filename - Name of the Excel file
   */
  async exportMultipleSheets(
    sheets: {
      name: string;
      data: any[];
      columns: { header: string; field: string; width?: number }[];
    }[],
    filename: string = 'multi-sheet-export.xlsx'
  ): Promise<void> {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();

      sheets.forEach(sheetConfig => {
        const worksheet = workbook.addWorksheet(sheetConfig.name);

        // Add headers
        const headerRow = worksheet.addRow(sheetConfig.columns.map(col => col.header));
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        sheetConfig.data.forEach(row => {
          worksheet.addRow(
            sheetConfig.columns.map(col => {
              const value = this.getNestedValue(row, col.field);
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return JSON.stringify(value);
              return value;
            })
          );
        });

        // Set column widths
        sheetConfig.columns.forEach((col, index) => {
          const column = worksheet.getColumn(index + 1);
          column.width = col.width || 15;
        });
      });

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating multi-sheet Excel file:', error);
      throw error;
    }
  }

  /**
   * Export product catalog report with dark theme design for Excel
   * @param data - Array of product data
   * @param filename - Name of the Excel file
   * @param options - Additional options
   */
  async exportProductCatalogReport(
    data: any[],
    filename: string = 'product-catalog-report.xlsx',
    options: {
      includeVariants?: boolean;
      includeImages?: boolean;
      filters?: any;
      generatedBy?: string;
    } = {}
  ): Promise<void> {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // Add metadata sheet
      const metadataSheet = workbook.addWorksheet('Report Info');
      this.addMetadataSheet(metadataSheet, data, options);
      
      // Add products sheet
      const productsSheet = workbook.addWorksheet('Products');
      this.addProductsSheet(productsSheet, data, options);
      
      // Add variants sheet if needed
      if (options.includeVariants) {
        const variantsSheet = workbook.addWorksheet('Variants');
        this.addVariantsSheet(variantsSheet, data);
      }
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating product catalog Excel file:', error);
      throw error;
    }
  }

  /**
   * Export Order Status Report to Excel
   */


  /**
   * Export Bulk Order Status Report to Excel (All Orders or Filtered Orders)
   */
  async exportBulkOrderStatusReport(
    ordersData: any[],
    filename: string = 'bulk-order-status-report.xlsx',
    options: {
      isFiltered?: boolean;
      filters?: any;
    } = {}
  ): Promise<void> {
    // Dynamic import to avoid build issues
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // Add Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add title
    summarySheet.addRow(['ORDER STATUS REPORT']);
    summarySheet.addRow([]);
    
    // Add report info
    const reportInfo = options.isFiltered 
      ? `Filtered Orders Report (${ordersData.length} orders)`
      : `All Orders Report (${ordersData.length} orders)`;
    summarySheet.addRow([reportInfo]);
    summarySheet.addRow([]);
    
    // Add generation date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    summarySheet.addRow(['Generated on:', currentDate]);
    summarySheet.addRow([]);
    
    // Add summary statistics
    summarySheet.addRow(['Summary Statistics']);
    summarySheet.addRow(['Total Orders', ordersData.length]);
    
    // Count by status
    const statusCounts: { [key: string]: number } = {};
    ordersData.forEach(order => {
      const currentStatus = order.currentStatus || 'Unknown';
      statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;
    });
    
    summarySheet.addRow([]);
    summarySheet.addRow(['Status Distribution']);
    Object.entries(statusCounts).forEach(([status, count]) => {
      summarySheet.addRow([status, count]);
    });
    
    // Style summary sheet
    summarySheet.getCell('A1').font = { bold: true, size: 16 };
    summarySheet.getCell('A3').font = { bold: true, size: 12 };
    summarySheet.getCell('A5').font = { bold: true, size: 12 };
    summarySheet.getCell('A8').font = { bold: true, size: 12 };
    summarySheet.getCell('A9').font = { bold: true, size: 12 };
    
    // Add Orders Details Sheet
    const ordersSheet = workbook.addWorksheet('Orders Details');
    
    // Add headers
    const orderHeaders = [
      'Order ID', 'Customer Name', 'Order Date', 'Total Amount', 
      'Current Status', 'Payment Status', 'City', 'Items Count'
    ];
    ordersSheet.addRow(orderHeaders);
    
    // Add order data
    ordersData.forEach(order => {
      ordersSheet.addRow([
        order.trackingNumber,
        order.customerName,
        order.orderDate,
        order.totalAmount,
        order.currentStatus,
        order.paymentStatus,
        order.city || 'N/A',
        order.itemsCount || 0
      ]);
    });
    
    // Style orders sheet
    ordersSheet.getRow(1).font = { bold: true };
    ordersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Auto-fit columns
    ordersSheet.columns.forEach((column: any) => {
      column.width = 15;
    });
    
    // Add Status History Sheet
    const historySheet = workbook.addWorksheet('Status History');
    
    // Add headers
    const historyHeaders = [
      'Order ID', 'Customer Name', 'Status', 'Changed By', 'Role', 'Date', 'Notes'
    ];
    historySheet.addRow(historyHeaders);
    
    // Add status history data
    ordersData.forEach(order => {
      if (order.statusHistory && order.statusHistory.length > 0) {
        order.statusHistory.forEach((history: any) => {
          historySheet.addRow([
            order.trackingNumber,
            order.customerName,
            history.status,
            history.changedBy,
            history.role,
            history.date,
            history.notes || ''
          ]);
        });
      } else {
        // Add a row for orders with no history
        historySheet.addRow([
          order.trackingNumber,
          order.customerName,
          'No status history',
          'N/A',
          'N/A',
          'N/A',
          ''
        ]);
      }
    });
    
    // Style history sheet
    historySheet.getRow(1).font = { bold: true };
    historySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Auto-fit columns
    historySheet.columns.forEach((column: any) => {
      column.width = 15;
    });
    
    // Save the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Add metadata sheet to workbook
   */
  private addMetadataSheet(worksheet: any, data: any[], options: any): void {
    // Title
    worksheet.addRow(['PRODUCT CATALOG REPORT']);
    worksheet.addRow([]);
    
    // Report metadata
    worksheet.addRow(['Generated On:', new Date().toLocaleString()]);
    worksheet.addRow(['Generated By:', options.generatedBy || 'Admin']);
    worksheet.addRow(['Total Products:', data.length]);
    worksheet.addRow(['Include Variants:', options.includeVariants ? 'YES' : 'NO']);
    worksheet.addRow(['Include Images:', options.includeImages ? 'YES' : 'NO']);
    worksheet.addRow([]);
    
    // Filters applied
    if (options.filters && Object.keys(options.filters).length > 0) {
      worksheet.addRow(['Filters Applied:']);
      Object.entries(options.filters).forEach(([key, value]) => {
        worksheet.addRow([`  ${key} =`, `"${value}"`]);
      });
      worksheet.addRow([]);
    }
    
    // Style the title
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:B1');
    
    // Style metadata rows
    for (let i = 3; i <= 7; i++) {
      const row = worksheet.getRow(i);
      row.getCell(1).font = { bold: true, color: { argb: 'FF006400' } }; // Green
      row.getCell(2).font = { color: { argb: 'FF000000' } }; // Black
    }
    
    // Set column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 40;
  }

  /**
   * Add products sheet to workbook
   */
  private addProductsSheet(worksheet: any, data: any[], options: any): void {
    // Headers
    const headers = [
      'Product ID', 'Product Name', 'Brand', 'Category', 'Base Price', 
      'Created Date', 'Stock Status', 'Order Count'
    ];
    
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Data rows
    data.forEach(product => {
      const rowData = [
        product.id || product.product?.id,
        product.product?.name || product.name,
        product.brand?.name,
        product.category?.name,
        product.product?.basePrice || product.basePrice,
        product.product?.createdDate || product.createdDate,
        product.status,
        product.product?.orderCount || 0
      ];
      
      worksheet.addRow(rowData);
    });
    
    // Style price column
    const priceColumn = worksheet.getColumn(5);
    priceColumn.numFmt = '#,##0 MMK';
    
    // Style date column
    const dateColumn = worksheet.getColumn(6);
    dateColumn.numFmt = 'yyyy-mm-dd hh:mm';
    
    // Set column widths
    worksheet.getColumn(1).width = 12; // Product ID
    worksheet.getColumn(2).width = 30; // Product Name
    worksheet.getColumn(3).width = 15; // Brand
    worksheet.getColumn(4).width = 15; // Category
    worksheet.getColumn(5).width = 15; // Base Price
    worksheet.getColumn(6).width = 20; // Created Date
    worksheet.getColumn(7).width = 15; // Stock Status
    worksheet.getColumn(8).width = 12; // Order Count
    
    // Add borders
    const dataRange = worksheet.getCell(2, 1).address + ':' + 
      worksheet.getCell(data.length + 1, headers.length).address;
    worksheet.getCell(dataRange).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  /**
   * Add variants sheet to workbook
   */
  private addVariantsSheet(worksheet: any, data: any[]): void {
    // Headers
    const headers = ['Product Name', 'SKU', 'Options', 'Price', 'Stock', 'Order Count'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Data rows
    data.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          // Handle different options data structures
          let optionsText = 'N/A';
          if (variant.options && variant.options.length > 0) {
            optionsText = variant.options.map((opt: any) => {
              if (opt.valueName) return opt.valueName;
              if (opt.optionValue?.value) return opt.optionValue.value;
              if (opt.value) return opt.value;
              return 'undefined';
            }).join(', ');
          }
          
          const rowData = [
            product.product?.name || product.name,
            variant.sku || 'N/A',
            optionsText,
            variant.price || 0,
            variant.stock || 0,
            variant.orderCount || 0
          ];
          
          worksheet.addRow(rowData);
        });
      }
    });
    
    // Style price column
    const priceColumn = worksheet.getColumn(4);
    priceColumn.numFmt = '#,##0 MMK';
    
    // Set column widths
    worksheet.getColumn(1).width = 30; // Product Name
    worksheet.getColumn(2).width = 20; // SKU
    worksheet.getColumn(3).width = 30; // Options
    worksheet.getColumn(4).width = 15; // Price
    worksheet.getColumn(5).width = 10; // Stock
    worksheet.getColumn(6).width = 15; // Order Count
    
    // Add borders
    const lastRow = worksheet.rowCount;
    if (lastRow > 1) {
      const dataRange = worksheet.getCell(2, 1).address + ':' + 
        worksheet.getCell(lastRow, headers.length).address;
      worksheet.getCell(dataRange).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  /**
   * Helper method to convert column index to letter
   */
  private getColumnLetter(index: number): string {
    let letter = '';
    while (index > 0) {
      index--;
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26);
    }
    return letter;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? '';
  }
  
} 