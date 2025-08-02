package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.entity.GroupEntity;
import com.maven.OnlineShoppingSB.entity.DiscountConditionGroupEntity;
import com.maven.OnlineShoppingSB.entity.DiscountConditionEntity;
import com.maven.OnlineShoppingSB.repository.GroupRepository;
import com.maven.OnlineShoppingSB.repository.DiscountConditionGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private DiscountConditionGroupRepository discountConditionGroupRepository;

    @GetMapping("/all")
    public ResponseEntity<List<GroupEntity>> getAllGroups() {
        List<GroupEntity> groups = groupRepository.findAll();
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{groupId}/details")
    public ResponseEntity<Map<String, Object>> getGroupDetails(@PathVariable Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElse(null);

        if (group == null) {
            return ResponseEntity.notFound().build();
        }

        // Get discount condition groups for this group
        List<DiscountConditionGroupEntity> conditionGroups = discountConditionGroupRepository.findByGroupId(groupId);

        Map<String, Object> response = Map.of(
            "group", group,
            "conditionGroups", conditionGroups
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all-with-conditions")
    public ResponseEntity<List<Map<String, Object>>> getAllGroupsWithConditions() {
        List<GroupEntity> groups = groupRepository.findAll();
        
        List<Map<String, Object>> groupsWithConditions = groups.stream()
            .map(group -> {
                List<DiscountConditionGroupEntity> conditionGroups = discountConditionGroupRepository.findByGroupId(group.getId());
                
                return Map.of(
                    "group", group,
                    "conditionGroups", conditionGroups
                );
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(groupsWithConditions);
    }
} 