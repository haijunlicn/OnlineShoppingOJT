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