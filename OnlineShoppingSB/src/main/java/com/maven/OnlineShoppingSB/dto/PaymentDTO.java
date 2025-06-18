package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentDTO {

	private int id;
    private String methodName;
    private String qrPath;
    private int status;
 }
