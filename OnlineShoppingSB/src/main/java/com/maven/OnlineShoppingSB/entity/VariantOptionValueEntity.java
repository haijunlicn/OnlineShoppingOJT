package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "variant_option_values")
public class VariantOptionValueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT(11)")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "variant_id")
    private ProductVariantEntity variant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "option_value_id")
    private OptionValueEntity optionValue;

    @Column(name = "del_fg", nullable = false)
    private Integer delFg = 1;

    @CreationTimestamp
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;
}
