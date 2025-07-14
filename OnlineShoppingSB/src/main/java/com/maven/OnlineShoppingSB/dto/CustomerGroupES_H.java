package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerGroupES_H {
    private String id;
    private Integer groupId;
    private Integer userId;
    private  GroupES_G group;
    private  userDTO user;
}
