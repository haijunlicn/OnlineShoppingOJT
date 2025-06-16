package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountGroupRequest {

    private Long id;

    private String name;

    private LocalDateTime createdDate;

}
