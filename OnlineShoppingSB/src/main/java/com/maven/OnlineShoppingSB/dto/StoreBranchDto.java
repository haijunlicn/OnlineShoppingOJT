package com.maven.OnlineShoppingSB.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StoreBranchDto {
    private Integer id;
    private String name;
    private String fullAddress;

    @JsonProperty("lat")
    private Double latitude;

    @JsonProperty("lng")
    private Double longitude;

    private String phoneNumber;

    private Boolean delFg;

    private String city;
    private String country;

    @JsonProperty("zipCode")
    private String zipcode;

    private String email;
}
