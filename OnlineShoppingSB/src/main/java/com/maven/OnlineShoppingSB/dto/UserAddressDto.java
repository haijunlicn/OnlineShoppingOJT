package com.maven.OnlineShoppingSB.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserAddressDto {
    private Integer id;
    private String address;
    private String township;
    @JsonProperty("lng")
    private Double longitude;
    @JsonProperty("lat")
    private Double latitude;
    private String city;
    private String country;
    @JsonProperty("zipCode")
    private String zipcode;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private Integer userId;
    private String phoneNumber;
}
