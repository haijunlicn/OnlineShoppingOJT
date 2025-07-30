package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

@Data
public class NotificationTypeDTO {

	 	private Long id;
	    private String name;
	    private String titleTemplate;
	    private String messageTemplate;
	    private boolean adminOnly;
}
