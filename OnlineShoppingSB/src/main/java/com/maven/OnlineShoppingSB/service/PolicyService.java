package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.PolicyDTO;
import com.maven.OnlineShoppingSB.entity.PolicyEntity;
import com.maven.OnlineShoppingSB.repository.PolicyRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private ModelMapper mapper;

    public PolicyDTO createPolicy(PolicyDTO dto) {
        System.out.println("Creating policy with data: " + dto);
        PolicyEntity entity = new PolicyEntity();
        entity.setTitle(dto.getTitle());
        entity.setType(dto.getType());
        entity.setDescription(dto.getDescription());

        PolicyEntity saved = policyRepository.save(entity);

        PolicyDTO responseDto = new PolicyDTO();
        responseDto.setId(saved.getId());
        responseDto.setTitle(saved.getTitle());
        responseDto.setType(saved.getType());
        responseDto.setDescription(saved.getDescription());

        return responseDto;
    }


    public List<PolicyDTO> getAllPolicies() {
        return policyRepository.findAll().stream()
                .map(entity -> mapper.map(entity, PolicyDTO.class))
                .collect(Collectors.toList());
    }

    public PolicyDTO getPolicyById(Integer id) {
        PolicyEntity entity = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id: " + id));
        return mapper.map(entity, PolicyDTO.class);
    }

    public PolicyDTO updatePolicy(Integer id, PolicyDTO dto) {
        PolicyEntity existing = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id: " + id));

        existing.setTitle(dto.getTitle());
        existing.setType(dto.getType());
        existing.setDescription(dto.getDescription());

        PolicyEntity updated = policyRepository.save(existing);
        return mapper.map(updated, PolicyDTO.class);
    }

    public void deletePolicy(Integer id) {
        PolicyEntity entity = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id: " + id));
        policyRepository.delete(entity);
    }
    public List<PolicyDTO> getPoliciesByType(String type) {
        return policyRepository.findByType(type).stream()
            .map(policy -> mapper.map(policy, PolicyDTO.class))
            .collect(Collectors.toList());
    }

}
