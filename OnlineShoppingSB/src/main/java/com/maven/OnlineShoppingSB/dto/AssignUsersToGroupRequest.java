package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignUsersToGroupRequest {
    private Long groupId;
    private List<Long> userIds;
}
