package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.entity.VariantSerialTrackerEntity;
import com.maven.OnlineShoppingSB.repository.VariantSerialTrackerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VariantSerialService {

    @Autowired
    private VariantSerialTrackerRepository trackerRepo;

    @Transactional
    public synchronized long getNextSerial() {
        VariantSerialTrackerEntity tracker = trackerRepo.findById("variant_serial")
                .orElseGet(() -> {
                    VariantSerialTrackerEntity newTracker = new VariantSerialTrackerEntity();
                    return trackerRepo.save(newTracker);
                });

        long nextSerial = tracker.getCurrentSerial() + 1;
        tracker.setCurrentSerial(nextSerial);
        trackerRepo.save(tracker);
        return nextSerial;
    }
}
