package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

@Service
public class ExcelTemplateService {

    @Autowired
    private BrandRepository brandRepo;
    @Autowired
    private CategoryRepository categoryRepo;
    @Autowired
    private OptionRepository optionRepo;

    public ByteArrayInputStream generateProductUploadTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {

            // Create sheets
            Sheet productSheet = workbook.createSheet("Product");
            Sheet variantSheet = workbook.createSheet("Variant");
            Sheet refSheet = workbook.createSheet("Reference");

            // === Product Sheet headers ===
            String[] productHeaders = {
                    "name",
                    "description",
                    "brandId",
                    "categoryId",
                    "basePrice",
                    "productImages",
                    "imageDisplayOrders",
                    "imageMainStatuses",  // multi true/false
                    "imageAltTexts"
            };
            Row productHeaderRow = productSheet.createRow(0);
            for (int i = 0; i < productHeaders.length; i++) {
                Cell cell = productHeaderRow.createCell(i);
                cell.setCellValue(productHeaders[i]);

                if (i == 7) {
                    CreationHelper factory = workbook.getCreationHelper();
                    Drawing<?> drawing = productSheet.createDrawingPatriarch();
                    ClientAnchor anchor = factory.createClientAnchor();
                    Comment comment = drawing.createCellComment(anchor);
                    comment.setString(factory.createRichTextString("Comma-separated true/false values. One per image, e.g., true,false,false"));
                    comment.setAuthor("System");
                    cell.setCellComment(comment);
                }
            }

            // === Variant Sheet headers ===
            List<OptionEntity> optionTypes = optionRepo.findByDelFg(1);
            int optionCount = optionTypes.size();

            // static + dynamic header
            List<String> variantHeaders = new ArrayList<>(List.of(
                    "product_name", "price", "stock", "sku", "imgPath"
            ));

            // now append all option names
            for (OptionEntity opt : optionTypes) {
                variantHeaders.add(opt.getName());
            }

            // write header to sheet
            Row variantHeaderRow = variantSheet.createRow(0);
            for (int i = 0; i < variantHeaders.size(); i++) {
                variantHeaderRow.createCell(i).setCellValue(variantHeaders.get(i));
            }

            // === Reference Sheet: Brands + Categories ===
            Row brandHeader = refSheet.createRow(0);
            brandHeader.createCell(0).setCellValue("Brand ID");
            brandHeader.createCell(1).setCellValue("Brand Name");

            List<BrandEntity> brands = brandRepo.findByDelFg(1);
            for (int i = 0; i < brands.size(); i++) {
                BrandEntity b = brands.get(i);
                Row row = refSheet.createRow(i + 1);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.getName());
            }

            Row categoryHeader = refSheet.getRow(0);
            if (categoryHeader == null) categoryHeader = refSheet.createRow(0);
            categoryHeader.createCell(3).setCellValue("Category ID");
            categoryHeader.createCell(4).setCellValue("Category Name");

            List<CategoryEntity> categories = categoryRepo.findByDelFg(1);
            for (int i = 0; i < categories.size(); i++) {
                CategoryEntity c = categories.get(i);
                Row row = refSheet.getRow(i + 1);
                if (row == null) row = refSheet.createRow(i + 1);
                row.createCell(3).setCellValue(c.getId());
                row.createCell(4).setCellValue(c.getName());
            }

            // === Reference: Option Values ===
            int optionStartCol = 6;
            int maxOptionValuesRows = 0;
            for (int i = 0; i < optionTypes.size(); i++) {
                OptionEntity option = optionTypes.get(i);
                refSheet.getRow(0).createCell(optionStartCol + i * 2).setCellValue(option.getName() + " ID");
                refSheet.getRow(0).createCell(optionStartCol + i * 2 + 1).setCellValue(option.getName() + " Value");

                List<OptionValueEntity> values = option.getOptionValues();
                for (int j = 0; j < values.size(); j++) {
                    int rowIndex = j + 1;
                    Row row = refSheet.getRow(rowIndex);
                    if (row == null) row = refSheet.createRow(rowIndex);
                    row.createCell(optionStartCol + i * 2).setCellValue(values.get(j).getId());
                    row.createCell(optionStartCol + i * 2 + 1).setCellValue(values.get(j).getValue());
                }
                maxOptionValuesRows = Math.max(maxOptionValuesRows, values.size());
            }

            // === Data Validations ===

            DataValidationHelper dvHelper = productSheet.getDataValidationHelper();

            // brandId dropdown
            String brandRange = String.format("Reference!$A$2:$A$%d", brands.size() + 1);
            DataValidationConstraint brandConstraint = dvHelper.createFormulaListConstraint(brandRange);
            productSheet.addValidationData(
                    dvHelper.createValidation(brandConstraint, new CellRangeAddressList(1, 100, 2, 2))
            );

            // categoryId dropdown
            String categoryRange = String.format("Reference!$D$2:$D$%d", categories.size() + 1);
            DataValidationConstraint categoryConstraint = dvHelper.createFormulaListConstraint(categoryRange);
            productSheet.addValidationData(
                    dvHelper.createValidation(categoryConstraint, new CellRangeAddressList(1, 100, 3, 3))
            );

            // Variant sheet data validations
            dvHelper = variantSheet.getDataValidationHelper();

            // product_name dropdown
            String productNamesRange = "Product!$A$2:$A$101";
            DataValidationConstraint productNameConstraint = dvHelper.createFormulaListConstraint(productNamesRange);
            variantSheet.addValidationData(
                    dvHelper.createValidation(productNameConstraint, new CellRangeAddressList(1, 100, 0, 0))
            );

            // Option values dropdowns (shifted index)
            for (int i = 0; i < optionTypes.size(); i++) {
                int colIndex = 5 + i;  // options start after imgPath column
                int refColIndex = optionStartCol + i * 2;
                String colLetter = CellReference.convertNumToColString(refColIndex);
                String formula = String.format("Reference!$%s$2:$%s$%d", colLetter, colLetter, maxOptionValuesRows + 1);

                DataValidationConstraint optionConstraint = dvHelper.createFormulaListConstraint(formula);
                variantSheet.addValidationData(
                        dvHelper.createValidation(optionConstraint, new CellRangeAddressList(1, 100, colIndex, colIndex))
                );
            }

            // === Auto-size ===
            for (int i = 0; i < productHeaders.length; i++) productSheet.autoSizeColumn(i);
            for (int i = 0; i < variantHeaders.size(); i++) variantSheet.autoSizeColumn(i);
            int refColsCount = 6 + optionTypes.size() * 2;
            for (int i = 0; i < refColsCount; i++) refSheet.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

}
