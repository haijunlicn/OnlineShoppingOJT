package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.FaqDTO;
import com.maven.OnlineShoppingSB.entity.FaqEntity;
import com.maven.OnlineShoppingSB.repository.FaqRepository;

@Service
public class FaqService {

    @Autowired
    private FaqRepository faqRepository;

    @Autowired
    private ModelMapper mapper;

    public FaqDTO insertFaq(FaqDTO dto) {
        FaqEntity entity = mapper.map(dto, FaqEntity.class);
        entity.setDelFg(0);
        FaqEntity saved = faqRepository.save(entity);
        return mapper.map(saved, FaqDTO.class);
    }

    public List<FaqDTO> getAllFaqs() {
        List<FaqEntity> faqList = faqRepository.findByDelFgFalse();
        return faqList.stream()
                .map(faq -> mapper.map(faq, FaqDTO.class))
                .collect(Collectors.toList());
    }

    public FaqDTO getById(Long id) {
        FaqEntity entity = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found with id: " + id));
        return mapper.map(entity, FaqDTO.class);
    }

    public FaqDTO updateFaq(FaqDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("FAQ ID must not be null for update");
        }

        FaqEntity existing = faqRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("FAQ not found"));

        existing.setQuestion(dto.getQuestion());
        existing.setAnswer(dto.getAnswer());

        FaqEntity updated = faqRepository.save(existing);
        return mapper.map(updated, FaqDTO.class);
    }

    public void deleteFaq(Long id) {
        FaqEntity existing = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found with id: " + id));
        existing.setDelFg(1);
        faqRepository.save(existing);
    }
}
