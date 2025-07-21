package com.maven.OnlineShoppingSB.service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.dto.userDTO;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.helperClasses.GroupCheckerResult;
import com.maven.OnlineShoppingSB.repository.OrderRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiscountGroupCheckerService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private RoleRepository roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OrderRepository orderRepository;

    public GroupCheckerResult getEligibilityResult(UserEntity user, GroupEntity group) {
        // system.out.println("🔍 Checking eligibility for user: " + user.getEmail() + " against group: " + group.getName());

        List<DiscountConditionGroupEntity> conditionGroups = group.getDiscountConditionGroups();

        // ✅ Reject immediately if group has no condition groups
        if (conditionGroups == null || conditionGroups.isEmpty()) {
            // system.out.println("    ❌ No condition groups defined — skipping group.");
            return new GroupCheckerResult(false, new ArrayList<>());
        }

        List<String> matchedConditions = new ArrayList<>();
        for (DiscountConditionGroupEntity groupCond : conditionGroups) {
            List<DiscountConditionEntity> conditions = groupCond.getDiscountCondition();

            // ❗ Skip group if it has no conditions — treat it as failed
            // system.out.println("condition list size : " + conditions.size());
            if (conditions == null || conditions.isEmpty()) {
                // system.out.println("    ❌ Condition group is empty — failing eligibility check.");
                return new GroupCheckerResult(false, new ArrayList<>());
            }

            List<Boolean> results = new ArrayList<>();

            for (DiscountConditionEntity condition : conditions) {
                boolean result = evaluateCondition(user, condition);

                String conditionDesc = condition.getConditionDetail() + " (" + condition.getOperator() + " " + condition.getValue() + ")";
                // system.out.println("    ➤ Condition: " + conditionDesc + " → " + (result ? "✅ Passed" : "❌ Failed"));

                results.add(result);

                if (result) {
                    matchedConditions.add(conditionDesc);
                }
            }

            boolean groupResult = groupCond.getLogicOperator()
                    ? results.stream().allMatch(b -> b) // 1 = AND
                    : results.stream().anyMatch(b -> b); // 0 = OR

            String logicStr = groupCond.getLogicOperator() ? "AND" : "OR";
            // system.out.println("    ➤ Group result with logic [" + logicStr + "]: " + (groupResult ? "✅ Group Passed" : "❌ Group Failed"));

            if (!groupResult) {
                return new GroupCheckerResult(false, new ArrayList<>());
            }
        }

        return new GroupCheckerResult(true, matchedConditions);
    }

    public boolean evaluateCondition(UserEntity user, DiscountConditionEntity condition) {
        List<String> values = parseValueJsonToList(condition.getValue());
        String field = condition.getConditionDetail();
        Operator operator = condition.getOperator();

        switch (field) {

            case "days_since_signup": {
                long daysSinceSignup = ChronoUnit.DAYS.between(user.getCreatedDate(), LocalDateTime.now());
                // system.out.println("        ↪ days_since_signup = " + daysSinceSignup);
                return compareLong(daysSinceSignup, values.get(0), operator);
            }

            case "last_login_date": {
                if (user.getLastLoginDate() == null) {
                    // system.out.println("        ℹ No last login → treating as very old date");
                    return compareLong(Long.MAX_VALUE, values.get(0), operator);
                }
                long daysSinceLogin = ChronoUnit.DAYS.between(user.getLastLoginDate(), LocalDateTime.now());
                // system.out.println("        ↪ days_since_last_login = " + daysSinceLogin);
                return compareLong(daysSinceLogin, values.get(0), operator);
            }

            case "days_since_last_purchase": {
                LocalDateTime lastOrderDate = orderRepository.findLastOrderDateByUserId(user.getId());
                if (lastOrderDate == null) {
                    // system.out.println("        ℹ No last order → treating as never purchased (Long.MAX_VALUE)");
                    return compareLong(Long.MAX_VALUE, values.get(0), operator);
                }
                long days = ChronoUnit.DAYS.between(lastOrderDate, LocalDateTime.now());
                // system.out.println("        ↪ days_since_last_purchase = " + days);
                return compareLong(days, values.get(0), operator);
            }

            case "total_spent": {
                BigDecimal spent = orderRepository.sumTotalPaidByUser(user.getId());
                if (spent == null) {
                    // system.out.println("        ℹ No orders found → treating total_spent as 0");
                    spent = BigDecimal.ZERO;
                }
                // system.out.println("        ↪ total_spent = " + spent);
                return compareBigDecimal(spent, values.get(0), operator);
            }

            case "order_count": {
                Long count = orderRepository.countCompletedOrdersByUser(user.getId());
                long orderCount = count != null ? count : 0L;
                // system.out.println("        ↪ order_count = " + orderCount);
                return compareLong(orderCount, values.get(0), operator);
            }

            default:
                // system.out.println("        ⚠ Unknown condition type: " + field);
                return false;
        }
    }

    private boolean compareLong(long actual, String expectedStr, Operator op) {
        long expected = Long.parseLong(expectedStr);
        boolean result = switch (op) {
            case EQUAL -> actual == expected;
            case GREATER_THAN -> actual > expected;
            case GREATER_THAN_OR_EQUAL -> actual >= expected;
            case LESS_THAN -> actual < expected;
            case LESS_THAN_OR_EQUAL -> actual <= expected;
            default -> false;
        };
        // system.out.println("          ↪ Comparing: " + actual + " " + op + " " + expected + " → " + result);
        return result;
    }

    private boolean compareBigDecimal(BigDecimal actual, String expectedStr, Operator op) {
        BigDecimal expected = new BigDecimal(expectedStr);
        boolean result = switch (op) {
            case EQUAL -> actual.compareTo(expected) == 0;
            case GREATER_THAN -> actual.compareTo(expected) > 0;
            case GREATER_THAN_OR_EQUAL -> actual.compareTo(expected) >= 0;
            case LESS_THAN -> actual.compareTo(expected) < 0;
            case LESS_THAN_OR_EQUAL -> actual.compareTo(expected) <= 0;
            default -> false;
        };
        // system.out.println("          ↪ Comparing: " + actual + " " + op + " " + expected + " → " + result);
        return result;
    }

    public List<String> parseValueJsonToList(String valueJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(valueJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            // system.out.println("⚠ Failed to parse value JSON: " + valueJson);
            return new ArrayList<>();
        }
    }
}
