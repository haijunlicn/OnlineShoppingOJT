package com.maven.OnlineShoppingSB.dto;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
@Data
public class OptionValueDTO {
	private Long id;
	private Long optionId;
	private String value;
	private Integer del_fg;
	private LocalDateTime createdDate;
	private LocalDateTime updatedDate;
	   
}
