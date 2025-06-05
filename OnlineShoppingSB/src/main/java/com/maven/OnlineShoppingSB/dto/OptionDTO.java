package com.maven.OnlineShoppingSB.dto;

import java.util.List;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@Data
public class OptionDTO {
	private Long id;
	private String name;
	private Integer del_fg;
	private LocalDateTime createdDate;
	private LocalDateTime updatedDate;
	private List<OptionValueDTO> optionValues;
}
