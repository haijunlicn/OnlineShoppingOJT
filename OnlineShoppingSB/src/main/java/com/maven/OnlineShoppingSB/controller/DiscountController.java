package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.*;

import com.maven.OnlineShoppingSB.entity.DiscountUserGroupMemberEntity;
import com.maven.OnlineShoppingSB.repository.DiscountUserGroupMemberRepository;
import com.maven.OnlineShoppingSB.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins="http://localhost:4200")
@RestController
@RequestMapping("discount")
public class DiscountController {

    @Autowired private  DiscountService discountGroupService;
    @Autowired private DiscountUserGroupMemberRepository discountUserGroupMemberRepository;

    @PostMapping("/discountGroup")
    public ResponseEntity<String> createDiscountGroup(@RequestBody DiscountGroupRequest request) {

        Long groupId =discountGroupService.createDiscountGroup(request.getName());
        String groupUrl = "/groups/" + groupId;
        System.out.println(groupUrl);
        return ResponseEntity.ok(groupUrl);
    }

    @GetMapping("/discountgroupList")
    public ResponseEntity<List<DiscountGroupResponseDTO>> getAllDiscountGroupsWithMembers() {
        List<DiscountGroupResponseDTO> responseList = discountGroupService.getAllDiscountGroupsWithMembers();
        return ResponseEntity.ok(responseList);
    }


    @GetMapping("/getUsers")
    public ResponseEntity<List<UserResponseDTO>> getUsers() {
        List<UserResponseDTO> users = discountGroupService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/assignUsers")
    public ResponseEntity<String> assignUsersToGroup(@RequestBody AssignUsersToGroupRequest request) {
        try {
            discountGroupService.assignUsersToGroup(request.getGroupId(), request.getUserIds());
            return ResponseEntity.ok("Users assigned successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }


    @PostMapping("/deleteGroup")
    public ResponseEntity<String> deleteDiscountGroup(@RequestBody Map<String, Long> request) {
        Long groupId = request.get("groupId");
        try {
            discountGroupService.deleteGroupById(groupId);
            return ResponseEntity.ok("delete success"); //✅ ဒီမှာ စာသား ပြန်ပေးတယ်
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete group: " + e.getMessage());
        }
    }

    @PutMapping("/updateName")
    public ResponseEntity<String> updateGroupName(@RequestBody UpdateGroupNameRequest request) {
        try {
            discountGroupService.updateGroupName(request.getId(), request.getName());
            return ResponseEntity.ok("Group name updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }



}
