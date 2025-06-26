package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "store_branches")
public class StoreBranch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Column(name = "full_address", columnDefinition = "TEXT")
    private String fullAddress;

    @Column(name = "latitude")
    @JsonProperty("lat")
    private Double latitude;
    @Column(name = "longitude")
    @JsonProperty("lng")
    private Double longitude;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "del_fg")
    private Boolean delFg = false;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "updated_date")
    private LocalDateTime updatedDate = LocalDateTime.now();

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Column(name = "zipcode")
    @JsonProperty("zipCode")
    private String zipcode;
}
