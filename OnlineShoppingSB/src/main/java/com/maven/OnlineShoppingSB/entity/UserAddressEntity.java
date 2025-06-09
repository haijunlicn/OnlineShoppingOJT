package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_addresses")
public class UserAddressEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "address", length = 255, nullable = false)
    private String address;

    @Column(name = "township", length = 100)
    private String township;

    @Column(name = "longitude")
    @JsonProperty("lng")
    private Double longitude;

    @Column(name = "latitude")
    @JsonProperty("lat")
    private Double latitude;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "country", length = 50)
    private String country;

    @Column(name = "zipcode", length = 20)
    @JsonProperty("zipCode")
    private String zipcode;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;
}
