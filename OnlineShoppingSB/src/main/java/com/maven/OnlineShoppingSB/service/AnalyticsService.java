package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.repository.CustomerGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
@Service
public class AnalyticsService {

    @Autowired
    private CustomerGroupRepository customerGroupRepository;

    public List<Map<String, Object>> getGroupMembershipHistory(LocalDate from, LocalDate to) {
        List<Object[]> results = customerGroupRepository.getGroupMembershipHistoryRaw(from, to);
        Map<Long, Map<String, Object>> groupMap = new LinkedHashMap<>();
        for (Object[] row : results) {
            Long groupId = ((Number) row[0]).longValue();
            String groupName = (String) row[1];
            String date = row[2] != null ? row[2].toString() : null;
            Long count = row[3] != null ? ((Number) row[3]).longValue() : 0L;

            groupMap.putIfAbsent(groupId, new HashMap<>(Map.of(
                "groupId", groupId,
                "groupName", groupName,
                "series", new ArrayList<Map<String, Object>>()
            )));
            if (date != null) {
                ((List<Map<String, Object>>) groupMap.get(groupId).get("series")).add(Map.of(
                    "date", date,
                    "count", count
                ));
            }
        }
        return new ArrayList<>(groupMap.values());
    }
}
