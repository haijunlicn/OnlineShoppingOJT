package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.DiscountGroupResponseDTO;
import com.maven.OnlineShoppingSB.dto.UserResponseDTO;
import com.maven.OnlineShoppingSB.entity.DiscountUserGroupEntity;
import com.maven.OnlineShoppingSB.entity.DiscountUserGroupMemberEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.DiscountUserGroupMemberRepository;
import com.maven.OnlineShoppingSB.repository.DiscountUserGroupRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DiscountService {

    @Autowired
    private DiscountUserGroupRepository discountUserGroupRepository;

    @Autowired private UserRepository userRepo;


    @Autowired
    private DiscountUserGroupMemberRepository memberRepository;


public Long createDiscountGroup(String name) {
    try {
        DiscountUserGroupEntity group = new DiscountUserGroupEntity();
        group.setName(name);
        group.setCreatedDate(LocalDateTime.now());
        DiscountUserGroupEntity savedGroup = discountUserGroupRepository.save(group);
        System.out.println(savedGroup.getId());
        return savedGroup.getId(); // ID ပြန်ပေးမယ်
    } catch (DataIntegrityViolationException e) {
        // Database constraint errors (e.g. unique constraint, null constraint)
        System.err.println("Database constraint violation: " + e.getMessage());
        throw new RuntimeException("Invalid data. Please check the input.", e);
    } catch (DataAccessException e) {
        // General database access errors
        System.err.println("Database access error: " + e.getMessage());
        throw new RuntimeException("Database error occurred.", e);
    } catch (IllegalArgumentException e) {
        // Invalid arguments passed to repository methods
        System.err.println("Invalid argument: " + e.getMessage());
        throw new RuntimeException("Invalid argument provided.", e);
    } catch (Exception e) {
        // Catch all other unexpected exceptions
        System.err.println("Unexpected error: " + e.getMessage());
        throw new RuntimeException("An unexpected error occurred.", e);
    }
}


    public List<DiscountGroupResponseDTO> getAllDiscountGroupsWithMembers() {
        List<DiscountUserGroupEntity> groups = discountUserGroupRepository.findAll();

        return groups.stream().map(group -> {
            DiscountGroupResponseDTO response = new DiscountGroupResponseDTO();
            response.setId(group.getId());
            response.setName(group.getName());
            response.setCreatedDate(group.getCreatedDate());

            List<UserResponseDTO> members = group.getDiscountUserGroupMembers().stream().map(member -> {
                UserEntity user = member.getUser();
                UserResponseDTO userResponse = new UserResponseDTO();
                userResponse.setId(user.getId());
                userResponse.setName(user.getName());
                userResponse.setEmail(user.getEmail());

                return userResponse;
            }).toList();

            response.setMembers(members);
            response.setMember_count(members.size());
            return response;
        }).toList();
    }




    public List<UserResponseDTO> getAllUsers() {
        List<UserEntity> users = userRepo.findAll();

        // Filter users who are verified (isVerified == true)
        return users.stream()
                .filter(UserEntity::getIsVerified) // ✅ Only verified users
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    private UserResponseDTO convertToDTO(UserEntity user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setIsVerified(user.getIsVerified());
        dto.setDelFg(user.getDelFg());
        dto.setCreatedDate(user.getCreatedDate());
        dto.setUpdatedDate(user.getUpdatedDate());

        if (user.getRole() != null) {
            dto.setRoleName(user.getRole().getName());
        } else {
            dto.setRoleName(null);
        }

        return dto;
    }


    @Autowired
    private DiscountUserGroupMemberRepository discountUserGroupMemberRepository;

public void assignUsersToGroup(Long groupId, List<Long> userIds) {
            DiscountUserGroupEntity group = discountUserGroupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found with ID: " + groupId));

            for (Long userId : userIds) {
                UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Check if user already exists in the group
        boolean exists = discountUserGroupMemberRepository.existsByGroupIdAndUserId(groupId, userId);
        if (exists) {
            throw new RuntimeException("User is already a member of this group.");
        }

        DiscountUserGroupMemberEntity member = new DiscountUserGroupMemberEntity();
        member.setGroup(group);
        member.setUser(user);

        discountUserGroupMemberRepository.save(member);
    }
}


    public void deleteGroupById(Long groupId) {
        Optional<DiscountUserGroupEntity> optionalGroup = discountUserGroupRepository.findById(groupId);
        if (optionalGroup.isPresent()) {
            discountUserGroupRepository.deleteById(groupId);
        } else {
            throw new RuntimeException("Group not found");
        }
    }

    public void updateGroupName(Long groupId, String newName) {
        DiscountUserGroupEntity group = discountUserGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with ID: " + groupId));

        group.setName(newName);
        discountUserGroupRepository.save(group);
    }

}
