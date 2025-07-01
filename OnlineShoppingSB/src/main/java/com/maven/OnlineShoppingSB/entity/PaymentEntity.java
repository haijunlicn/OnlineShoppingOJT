package com.maven.OnlineShoppingSB.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "method_name", nullable = false, unique = true)
    private String methodName;

    @Column(name = "qr_path")
    private String qrPath;
    
    @Column(name = "logo" , length = 255)
    private String logo;

    @Column(name = "status")
    private int status;

    @Column(name = "description")
    private String description;

    @Column(name = "type", length = 50) // varchar(50) ဆိုပြီး size ပေးထားတာ
    private String type;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

//    @OneToMany(mappedBy = "paymentMethod", cascade = CascadeType.ALL)
//    private List<OrderEntity> orders;
}