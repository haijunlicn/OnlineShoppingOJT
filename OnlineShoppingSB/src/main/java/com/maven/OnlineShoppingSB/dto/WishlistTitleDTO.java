package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Data
public class WishlistTitleDTO {
    private Long userId;
    private String title;
    private List<WishlistDTO> wishes;
    private Long id;
}
