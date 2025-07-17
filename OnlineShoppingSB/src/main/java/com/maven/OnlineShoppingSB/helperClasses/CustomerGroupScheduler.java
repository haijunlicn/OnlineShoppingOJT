package com.maven.OnlineShoppingSB.helperClasses;

import com.maven.OnlineShoppingSB.entity.CustomerGroupEntity;
import com.maven.OnlineShoppingSB.entity.GroupEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.CustomerGroupRepository;
import com.maven.OnlineShoppingSB.repository.GroupRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.service.DiscountGroupCheckerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
public class CustomerGroupScheduler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private CustomerGroupRepository customerGroupRepository;

    @Autowired
    private DiscountGroupCheckerService discountGroupCheckerService;

    // Runs every 30s
    @Transactional
    @Scheduled(cron = "0/30 * * * * ?")
    public void assignUsersToGroups() {
        List<UserEntity> allUsers = userRepository.findAll();
        List<GroupEntity> allGroups = groupRepository.findAll();

        System.out.println("assigning users to groups every 30s");

        for (UserEntity user : allUsers) {
            for (GroupEntity group : allGroups) {
                // Check eligibility with detailed conditions
                GroupCheckerResult result = discountGroupCheckerService.getEligibilityResult(user, group);
                boolean alreadyAssigned = customerGroupRepository.existsByUserAndGroup(user, group);

                if (result.isEligible() && !alreadyAssigned) {
                    System.out.println("✅ " + user.getEmail() + " assigned to group " + group.getName());
                    System.out.println("    ✔ Matched Conditions:");
                    for (String condition : result.getMatchedConditions()) {
                        System.out.println("    - " + condition);
                    }

                    CustomerGroupEntity membership = new CustomerGroupEntity();
                    membership.setUser(user);
                    membership.setGroup(group);
                    customerGroupRepository.save(membership);
                }

                if (!result.isEligible() && alreadyAssigned) {
                    System.out.println("❌ " + user.getEmail() + " removed from group " + group.getName() + " (no longer eligible)");

                    CustomerGroupEntity entity = customerGroupRepository.findByUserAndGroup(user, group);
                    if (entity != null) {
                        customerGroupRepository.delete(entity);
                    }
                }
            }
        }
    }

}