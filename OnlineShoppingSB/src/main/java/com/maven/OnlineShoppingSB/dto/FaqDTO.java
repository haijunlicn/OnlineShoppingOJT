package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FaqDTO {
    private Long id;
    private String question;
    private String answer;
    private String category;
   
}