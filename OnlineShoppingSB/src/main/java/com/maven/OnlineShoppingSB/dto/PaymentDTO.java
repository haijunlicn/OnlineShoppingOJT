package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentDTO {

	private int id;
    private String methodName;
    private String qrPath;
    private String logo;
    private String description;
    private int status;
    private String type;
 }
