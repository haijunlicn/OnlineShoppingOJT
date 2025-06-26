package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "variant_serial_tracker")
public class VariantSerialTrackerEntity {

    @Id
    private String id = "variant_serial";  // always the same

    private Long currentSerial = 0L;
}
