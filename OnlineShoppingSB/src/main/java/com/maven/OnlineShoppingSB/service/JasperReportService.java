package com.maven.OnlineShoppingSB.service;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.util.JRLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.Connection;
import java.util.Map;

@Service
public class JasperReportService {

    @Autowired
    private DataSource dataSource;

    public byte[] generatePdf(String reportName, Map<String, Object> params) throws Exception {
        InputStream stream = new ClassPathResource("reports/" + reportName + ".jrxml").getInputStream();
        JasperReport jasperReport = JasperCompileManager.compileReport(stream);
        
        try (Connection connection = dataSource.getConnection()) {
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, params, connection);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        }
    }

    public byte[] generatePdfWithCompiledReport(String reportName, Map<String, Object> params) throws Exception {
        // Try to load compiled .jasper file first, if not found compile from .jrxml
        InputStream stream;
        boolean isCompiled = false;
        
        try {
            stream = new ClassPathResource("reports/" + reportName + ".jasper").getInputStream();
            isCompiled = true;
        } catch (Exception e) {
            // If .jasper not found, compile from .jrxml
            stream = new ClassPathResource("reports/" + reportName + ".jrxml").getInputStream();
            isCompiled = false;
        }
        
        JasperReport jasperReport;
        if (isCompiled) {
            jasperReport = (JasperReport) JRLoader.loadObject(stream);
        } else {
            jasperReport = JasperCompileManager.compileReport(stream);
        }
        
        try (Connection connection = dataSource.getConnection()) {
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, params, connection);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        }
    }
} 