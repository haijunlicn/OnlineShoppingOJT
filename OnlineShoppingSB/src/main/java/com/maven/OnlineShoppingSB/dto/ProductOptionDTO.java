package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Data
public class ProductOptionDTO {
    private Long id;
    private String name; // The option name, e.g. "Color" or "Size"
    private List<OptionValueDTO> optionValues;
}
