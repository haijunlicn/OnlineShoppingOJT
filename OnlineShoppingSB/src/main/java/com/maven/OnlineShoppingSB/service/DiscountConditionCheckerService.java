package com.maven.OnlineShoppingSB.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DiscountConditionCheckerService {

    @Autowired
    private CustomerGroupRepository customerGroupRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private OrderRepository orderRepository;

    public boolean isEligible(UserEntity user, DiscountMechanismEntity mechanism) {
        List<DiscountConditionGroupEntity> groups = mechanism.getDiscountConditionGroup();

        if (groups == null || groups.isEmpty()) {
            return true; // No condition means eligible for all
        }

        for (DiscountConditionGroupEntity group : groups) {
            List<DiscountConditionEntity> conditions = group.getDiscountCondition();

            if (conditions == null || conditions.isEmpty()) {
                return false;
            }

            List<Boolean> results = new ArrayList<>();

            for (DiscountConditionEntity condition : conditions) {
                boolean passed = evaluateCondition(user, condition);
                results.add(passed);
            }

            boolean groupPassed = group.getLogicOperator()
                    ? results.stream().allMatch(Boolean::booleanValue)
                    : results.stream().anyMatch(Boolean::booleanValue);

            if (!groupPassed) return false;
        }

        return true;
    }

    public boolean evaluateCondition(UserEntity user, DiscountConditionEntity condition) {
        List<String> values = parseValueJsonToList(condition.getValue());

        return switch (condition.getConditionType()) {
            case CUSTOMER_GROUP -> evaluateCustomerGroupCondition(user, condition.getConditionDetail(), values);
            case ORDER -> evaluateOrderCondition(user, condition.getConditionDetail(), condition.getOperator(), values);
            default -> false; // Unsupported condition types are ignored here
        };
    }

    private boolean evaluateCustomerGroupCondition(UserEntity user, String groupIdStr, List<String> valueList) {
        if (user == null) return false;

        boolean mustBeInGroup = valueList.contains("true");

        try {
            Long groupId = Long.parseLong(groupIdStr);
            List<Long> userGroupIds = customerGroupRepository.findGroupIdsByUser(user.getId());
            boolean isInGroup = userGroupIds.contains(groupId);

            return mustBeInGroup == isInGroup;

        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean evaluateOrderCondition(UserEntity user, String field, Operator operator, List<String> values) {
        if (user == null || values.isEmpty()) return false;

        switch (field) {
            case "first_order" -> {
                long orderCount = orderRepository.countCompletedOrdersByUser(user.getId());
                boolean isFirstOrder = orderCount == 0;
                boolean required = Boolean.parseBoolean(values.get(0));
                return required == isFirstOrder;
            }
            default -> {
                return false; // other order fields handled on frontend/cart
            }
        }
    }

    private List<String> parseValueJsonToList(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public String buildShortLabel(DiscountMechanismEntity mechanism) {
        if (mechanism.getMechanismType() != MechanismType.Discount) return "";

        String value = mechanism.getValue();
        String type = mechanism.getDiscountType() != null ? mechanism.getDiscountType().name() : "";

        return switch (type) {
            case "PERCENTAGE" -> value + "% Off";
            case "FIXED" -> "MMK " + value + " Off";
            default -> "Discount";
        };
    }

    public String buildConditionSummary(DiscountMechanismEntity mechanism) {
        List<DiscountConditionGroupEntity> groups = mechanism.getDiscountConditionGroup();
        if (groups == null || groups.isEmpty()) return "Available for everyone";

        StringBuilder summary = new StringBuilder();

        for (DiscountConditionGroupEntity group : groups) {
            if (group.getDiscountCondition() == null || group.getDiscountCondition().isEmpty()) continue;

            summary.append("(");
            List<String> conditionDescriptions = new ArrayList<>();

            for (DiscountConditionEntity condition : group.getDiscountCondition()) {
                conditionDescriptions.add(conditionToString(condition));
            }

            String joined = String.join(
                    group.getLogicOperator() ? " AND " : " OR ",
                    conditionDescriptions
            );

            summary.append(joined).append(")");
        }

        return summary.toString();
    }

    public String conditionToString(DiscountConditionEntity condition) {
        String field = condition.getConditionDetail();
        List<String> values = parseValueJsonToList(condition.getValue());
        String operator = operatorToText(condition.getOperator());
        String valueStr = String.join(", ", values);

        return switch (condition.getConditionType()) {
            case PRODUCT -> capitalize(field) + " " + operator + " " + valueStr;
            case ORDER -> buildOrderConditionText(field, operator, valueStr);
            case CUSTOMER_GROUP -> buildCustomerGroupConditionText(field, values);
            default -> "";
        };
    }

    private String buildOrderConditionText(String field, String operator, String valueStr) {
        return switch (field) {
            case "first_order" ->
                    Boolean.parseBoolean(valueStr) ? "Customer's first order" : "Not customer's first order";
            default -> capitalize(field.replace("_", " ")) + " " + operator + " " + valueStr;
        };
    }

    private String buildCustomerGroupConditionText(String groupId, List<String> values) {
        Long id = Long.parseLong(groupId);
        GroupEntity group = groupRepository.findById(id).orElse(null);
        if (group == null) return "";

        boolean included = values.contains("true");
        return included
                ? "Customer belongs to group '" + group.getName() + "'"
                : "Customer does not belong to group '" + group.getName() + "'";
    }

    private String capitalize(String input) {
        return input == null || input.isEmpty()
                ? ""
                : input.substring(0, 1).toUpperCase() + input.substring(1).replace("_", " ");
    }

    private String operatorToText(Operator op) {
        return switch (op) {
            case EQUAL -> "is";
            case GREATER_THAN -> ">";
            case GREATER_THAN_OR_EQUAL -> "≥";
            case LESS_THAN -> "<";
            case LESS_THAN_OR_EQUAL -> "≤";
            case IS_ONE_OF -> "one of";
            default -> "";
        };
    }

    public Boolean evaluateConditionNullable(UserEntity user, DiscountConditionEntity condition) {
        if (isFrontendCartCondition(condition)) {
            return null; // frontend must evaluate these
        }
        return evaluateCondition(user, condition);
    }

    public boolean isFrontendCartCondition(DiscountConditionEntity condition) {
        return switch (condition.getConditionType()) {
            case PRODUCT -> true;
            case ORDER -> !"first_order".equals(condition.getConditionDetail());
            default -> false;
        };
    }

}

