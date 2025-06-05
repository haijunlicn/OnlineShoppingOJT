package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import java.util.Optional;

import com.maven.OnlineShoppingSB.entity.BrandEntity;
import com.maven.OnlineShoppingSB.entity.OptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.OptionValueEntity;

public interface OptionValueRepository extends JpaRepository<OptionValueEntity, Long> {

   // List<OptionValueEntity> findByDeletedFalse(); // del_fg = false

    List<OptionValueEntity> findByDelFg(int delFg);

    List<OptionValueEntity> findByOptionIdAndDelFg(Integer optionId, int delFg);

    Optional<OptionValueEntity> findByOptionAndValue(OptionEntity option, String value);

    Optional<OptionValueEntity> findByOptionAndId(OptionEntity option, Long id);
}
