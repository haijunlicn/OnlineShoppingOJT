package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/group-user-counts")
    public ResponseEntity<List<Map<String, Object>>> getGroupUserCounts(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<Map<String, Object>> data = analyticsService.getGroupMembershipHistory(from, to);
        return ResponseEntity.ok(data);
    }
}
